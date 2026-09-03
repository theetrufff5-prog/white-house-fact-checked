const JSON_HEADERS = { "cache-control": "no-store", "content-type": "application/json; charset=utf-8" };

function json(data, status = 200) { return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS }); }
function clean(value, limit) { return String(value || "").replace(/\s+/g, " ").trim().slice(0, limit); }
function authorized(request, secret) { return Boolean(secret) && request.headers.get("authorization") === `Bearer ${secret}`; }
async function clientKey(request) {
  const address = request.headers.get("cf-connecting-ip") || "unknown";
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(address));
  return [...new Uint8Array(digest)].slice(0, 12).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
async function verifyTurnstile(token, secret, remoteip) {
  if (!token || !secret) return false;
  const body = new FormData(); body.append("secret", secret); body.append("response", token); body.append("remoteip", remoteip);
  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body });
  if (!response.ok) return false;
  const result = await response.json(); return result.success === true;
}

export class VisitCounter {
  constructor(state, env) {
    this.state = state;
  }

  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname !== "/api/visits") {
      return new Response("Not found", { status: 404 });
    }

    if (request.method === "POST") {
      let count = 0;
      await this.state.storage.transaction(async (txn) => {
        const current = await txn.get("count");
        count = typeof current === "number" ? current + 1 : 116;
        await txn.put("count", count);
      });
      return Response.json({ count }, { headers: { "cache-control": "no-store" } });
    }

    if (request.method === "GET") {
      const current = await this.state.storage.get("count");
      const count = typeof current === "number" ? current : 115;
      return Response.json({ count }, { headers: { "cache-control": "no-store" } });
    }

    return new Response("Method not allowed", { status: 405 });
  }
}

export class CommentStore {
  constructor(state, env) { this.state = state; this.env = env; }
  async all() {
    const entries = await this.state.storage.list({ prefix: "comment:" });
    return [...entries.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === "/api/comments" && request.method === "GET") {
      const comments = (await this.all()).filter((item) => item.status === "approved").map(({ id, name, body, createdAt, editorial }) => ({ id, name, body, createdAt, editorial }));
      return json({ comments });
    }
    if (url.pathname === "/api/comments" && request.method === "POST") {
      let input; try { input = await request.json(); } catch { return json({ error: "Invalid submission." }, 400); }
      if (input.website) return json({ ok: true, pending: true }, 202);
      const name = clean(input.name, 40), body = clean(input.body, 800);
      if (name.length < 2 || body.length < 3) return json({ error: "Please provide a display name and comment." }, 400);
      const address = request.headers.get("cf-connecting-ip") || "unknown";
      if (!await verifyTurnstile(input.turnstileToken, this.env.TURNSTILE_SECRET, address)) return json({ error: "Human verification failed. Please try again." }, 403);
      const client = await clientKey(request), bucket = Math.floor(Date.now() / 600000), rateKey = `rate:${client}:${bucket}`;
      const attempts = (await this.state.storage.get(rateKey)) || 0;
      if (attempts >= 3) return json({ error: "Please wait before submitting another comment." }, 429);
      const id = crypto.randomUUID();
      await this.state.storage.put(rateKey, attempts + 1, { expirationTtl: 1200 });
      await this.state.storage.put(`comment:${id}`, { id, name, body, createdAt: new Date().toISOString(), status: "pending", reports: 0, editorial: false });
      return json({ ok: true, pending: true }, 202);
    }
    if (url.pathname === "/api/comments/report" && request.method === "POST") {
      let input; try { input = await request.json(); } catch { return json({ error: "Invalid report." }, 400); }
      const key = `comment:${clean(input.id, 60)}`, record = await this.state.storage.get(key);
      if (!record || record.status !== "approved") return json({ error: "Comment unavailable." }, 404);
      const reportKey = `report:${record.id}:${await clientKey(request)}`;
      if (await this.state.storage.get(reportKey)) return json({ ok: true, duplicate: true });
      record.reports = (record.reports || 0) + 1; if (record.reports >= 3) record.status = "flagged";
      await this.state.storage.put(reportKey, true, { expirationTtl: 604800 }); await this.state.storage.put(key, record);
      return json({ ok: true });
    }
    if (url.pathname === "/api/comments/admin" && request.method === "GET") {
      if (!authorized(request, this.env.COMMENTS_ADMIN_TOKEN)) return json({ error: "Unauthorized." }, 401);
      return json({ comments: await this.all() });
    }
    if (url.pathname === "/api/comments/admin" && request.method === "POST") {
      if (!authorized(request, this.env.COMMENTS_ADMIN_TOKEN)) return json({ error: "Unauthorized." }, 401);
      let input; try { input = await request.json(); } catch { return json({ error: "Invalid action." }, 400); }
      const action = clean(input.action, 20);
      if (action === "editorial") {
        const body = clean(input.body, 800); if (body.length < 3) return json({ error: "Enter a reply." }, 400);
        const id = crypto.randomUUID(); await this.state.storage.put(`comment:${id}`, { id, name: "WH: Unchecked Editorial Team", body, createdAt: new Date().toISOString(), status: "approved", reports: 0, editorial: true }); return json({ ok: true });
      }
      const key = `comment:${clean(input.id, 60)}`, record = await this.state.storage.get(key);
      if (!record) return json({ error: "Comment not found." }, 404);
      if (action === "approve") { record.status = "approved"; record.reports = 0; }
      else if (action === "reject") record.status = "rejected";
      else if (action === "delete") { await this.state.storage.delete(key); return json({ ok: true }); }
      else return json({ error: "Unknown action." }, 400);
      await this.state.storage.put(key, record); return json({ ok: true });
    }
    return new Response("Not found", { status: 404 });
  }
}

const ENERGY_VIDEO_STYLES = `
<style>
  .energy-video{background:radial-gradient(circle at 72% 45%,#77a9ff29,#0000 35%),#050608;border-top:1px solid #2e3137;grid-template-columns:minmax(260px,.75fr) minmax(300px,1.25fr);align-items:center;gap:clamp(38px,7vw,110px);display:grid}
  .energy-video-copy h2{letter-spacing:-.055em;text-transform:uppercase;margin:18px 0 25px;font-size:clamp(46px,6vw,88px);line-height:.9}
  .energy-video-copy>p:not(.kicker){max-width:480px;color:var(--muted);font-size:16px;line-height:1.7}
  .energy-video-player{background:#000;border:1px solid #3a3e45;min-width:0;padding:clamp(8px,1.2vw,16px);box-shadow:16px 16px #f0443e2e}
  .energy-video-player video{background:#000;width:100%;height:auto;display:block}
  @media (max-width:820px){.energy-video{grid-template-columns:1fr;text-align:left;gap:38px}.energy-video-player{width:100%;padding:6px;box-shadow:8px 8px #f0443e2e}}
</style>`;

const EDITORIAL_TEAM_STYLES = `
<style>
  .editorial-team{width:min(1180px,calc(100% - 40px));margin:30px auto 70px;padding:clamp(26px,4vw,48px);background:#0a0b0e;border:1px solid #34373e;box-shadow:12px 12px #f0443e26;color:#f5f5f3}
  .editorial-team header{max-width:820px;margin-bottom:30px}
  .editorial-team h2{margin:9px 0 12px;font-size:clamp(30px,4vw,52px);line-height:1;letter-spacing:-.045em;text-transform:uppercase}
  .editorial-team .team-disclosure{max-width:720px;color:#aeb1b8;font-size:15px;line-height:1.65}
  .editorial-team-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1px;background:#34373e;border:1px solid #34373e}
  .editorial-team-grid article{min-width:0;background:#111318;padding:26px}
  .editorial-team-grid img{display:block;width:100%;aspect-ratio:1;object-fit:cover;margin:0 0 22px;border:1px solid #444851;filter:saturate(.9) contrast(1.04)}
  .editorial-team-grid span{display:block;color:#f0443e;font:700 11px/1.3 var(--font-geist-mono),monospace;letter-spacing:.12em}
  .editorial-team-grid h3{margin:12px 0 10px;font-size:clamp(22px,2.4vw,32px);line-height:1.05;text-transform:uppercase}
  .editorial-team-grid p{margin:0;color:#aeb1b8;font-size:14px;line-height:1.6}
  @media (max-width:760px){.editorial-team{width:min(100% - 24px,1180px);margin:20px auto 48px;box-shadow:7px 7px #f0443e26}.editorial-team-grid{grid-template-columns:1fr}}
</style>`;

const PARANORMAL_PROMO_STYLES = `
<style>
  .paranormal-promo{width:min(1180px,calc(100% - 40px));margin:30px auto 70px;background:#080a0d;border:1px solid #34373e;box-shadow:12px 12px #f0443e26;overflow:hidden}
  .paranormal-promo>a{display:grid;grid-template-columns:1fr;color:#f5f5f3;text-decoration:none}
  .paranormal-promo img{display:block;width:100%;aspect-ratio:3.2/1;object-fit:cover}
  .paranormal-promo-copy{padding:clamp(28px,4vw,54px)}
  .paranormal-promo-copy small{display:block;color:#f0443e;font:700 11px/1.3 var(--font-geist-mono),monospace;letter-spacing:.13em}
  .paranormal-promo-copy h2{margin:13px 0 16px;font-size:clamp(32px,4vw,58px);line-height:.92;letter-spacing:-.045em;text-transform:uppercase}
  .paranormal-promo-copy p{max-width:760px;margin:0 0 24px;color:#aeb1b8;font-size:15px;line-height:1.65}
  .paranormal-promo-copy b{display:inline-block;padding:14px 17px;background:#b20f18;color:#fff;font:800 12px/1 var(--font-geist-mono),monospace;letter-spacing:.08em}
  .paranormal-promo>a:hover .paranormal-promo-copy b,.paranormal-promo>a:focus-visible .paranormal-promo-copy b{background:#e12932}
  .paranormal-rail-card{display:block;margin-bottom:10px;background:#080a0d;border:2px solid #b20f18;color:#fff;text-decoration:none;box-shadow:7px 7px #4679c94d;overflow:hidden}
  .paranormal-rail-card img{display:block;width:100%;aspect-ratio:2.1/1;object-fit:cover;border-bottom:1px solid #34373e}
  .paranormal-rail-card span,.paranormal-rail-card b{display:block;padding-left:12px;padding-right:12px}
  .paranormal-rail-card span{padding-top:10px;color:#f0443e;font:700 8px/1.2 var(--font-geist-mono),monospace;letter-spacing:.11em}
  .paranormal-rail-card b{padding-top:7px;padding-bottom:11px;font:800 11px/1.25 var(--font-geist-mono),monospace;letter-spacing:.04em}
  .paranormal-rail-card:hover,.paranormal-rail-card:focus-visible{border-color:#ef4045;background:#11151a}
  @media (max-width:760px){.paranormal-promo{width:min(100% - 24px,1180px);margin:20px auto 48px;box-shadow:7px 7px #f0443e26}.paranormal-promo img{aspect-ratio:2/1}.paranormal-promo-copy{padding:26px}}
</style>`;

const COMMENTS_STYLES = `
<style>
  .community-comments{background:#0a0b0e;color:#f5f5f3;border-top:1px solid #34373e;border-bottom:1px solid #34373e;padding:clamp(60px,8vw,110px) clamp(20px,6vw,90px)}
  .community-comments>header{max-width:780px}.community-comments h2{margin:12px 0 18px;font-size:clamp(40px,6vw,78px);line-height:.9;letter-spacing:-.05em;text-transform:uppercase}.community-comments>header>p:last-child{color:#aeb1b8;font-size:17px;line-height:1.7}
  .comments-layout{display:grid;grid-template-columns:minmax(280px,.8fr) minmax(0,1.2fr);gap:1px;max-width:1180px;margin-top:42px;background:#34373e;border:1px solid #34373e}.comment-form,.comment-list{background:#111318;padding:clamp(24px,4vw,42px)}
  .comment-form label{display:block;margin-bottom:20px;color:#e1e2e4;font:800 11px var(--font-geist-mono),monospace;letter-spacing:.07em;text-transform:uppercase}.comment-form input,.comment-form textarea{display:block;width:100%;margin-top:9px;padding:14px;background:#050608;border:1px solid #444851;color:#fff;font:16px Arial,sans-serif}.comment-form textarea{resize:vertical}.comment-form input:focus,.comment-form textarea:focus{outline:2px solid #6d9fea;outline-offset:1px}.comment-form button,.admin-button{padding:15px 18px;background:#b20f18;border:0;color:#fff;font:800 12px var(--font-geist-mono),monospace;letter-spacing:.07em;cursor:pointer}.comment-form small{display:block;margin-top:20px;color:#8e929a;line-height:1.6}.comment-trap{position:absolute!important;left:-10000px!important;width:1px!important;height:1px!important;overflow:hidden!important}.cf-turnstile{margin:0 0 20px}.form-message{min-height:20px;color:#8cb8f5;font:700 12px var(--font-geist-mono),monospace}
  .comment{padding:0 0 26px;margin-bottom:26px;border-bottom:1px solid #34373e}.comment:last-child{margin-bottom:0}.comment p{color:#d7d8db;line-height:1.65}.comment-meta{display:flex;justify-content:space-between;gap:15px}.comment-meta b{font:800 12px var(--font-geist-mono),monospace;letter-spacing:.05em;text-transform:uppercase}.comment-meta b span{margin-left:8px;padding:4px 6px;color:#75a7ef;border:1px solid currentColor;font-size:9px}.comment-meta time{color:#81858d;font:700 10px var(--font-geist-mono),monospace}.comment>button{padding:0;background:none;border:0;color:#81858d;font:700 10px var(--font-geist-mono),monospace;text-transform:uppercase;cursor:pointer}.comment>button:hover{color:#f0443e}.comments-empty{color:#8e929a;font-style:italic}
  @media(max-width:820px){.comments-layout{grid-template-columns:1fr}.comment-meta{flex-direction:column;gap:8px}}
</style>`;

const COMMENTS_HTML = `<section class="community-comments" id="comments" data-comments aria-labelledby="comments-title"><header><p class="kicker">/ COMMUNITY REMARKS</p><h2 id="comments-title">Join the discussion</h2><p>Good or bad, respectful remarks are welcome. Published comments are opinions—not verified evidence.</p></header><div class="comments-layout"><form class="comment-form"><label>Display name<input name="name" maxlength="40" required autocomplete="name"></label><label>Your remark<textarea name="body" maxlength="800" rows="6" required></textarea></label><label class="comment-trap" aria-hidden="true">Website<input name="website" tabindex="-1" autocomplete="off"></label><div class="cf-turnstile" data-sitekey="0x4AAAAAAEmHNXTkjQiGwhKt" data-theme="dark"></div><button type="submit">SUBMIT FOR REVIEW</button><p class="form-message" data-comment-message aria-live="polite"></p><small>Comments appear only after editorial approval. Critique claims and evidence—not other commenters. Threats, spam, private information, discriminatory abuse, and unverified personal accusations will not be published.</small></form><div class="comment-list" data-comment-list><p class="comments-empty">Loading remarks…</p></div></div></section>`;

async function serveSiteAsset(request, env) {
  const url = new URL(request.url);
  const assetRequest = url.pathname === "/"
    ? new Request(new URL(`/index.html${url.search}`, request.url), request)
    : request;
  const response = await env.ASSETS.fetch(assetRequest);
  const isHomePage = response.ok && (url.pathname === "/" || url.pathname === "/index.html");

  if (!isHomePage) return response;

  const html = await response.text();
  const interactiveHtml = html.replace(
    "</head>",
    `${ENERGY_VIDEO_STYLES}${EDITORIAL_TEAM_STYLES}${PARANORMAL_PROMO_STYLES}${COMMENTS_STYLES}<script src="/energy-video.js" defer></script><script src="/usps-story.js" defer></script><script src="/editorial-team.js" defer></script><script src="/paranormal-promo.js" defer></script><script src="/community-comments.js" defer></script><script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script></head>`,
  ).replace("</main>", `${COMMENTS_HTML}</main>`);

  const headers = new Headers(response.headers);
  headers.delete("content-length");
  headers.set("content-type", "text/html; charset=UTF-8");
  return new Response(interactiveHtml, { status: response.status, headers });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.hostname === "www.whitehousefactchecked.com") {
      url.hostname = "whitehousefactchecked.com";
      url.protocol = "https:";
      return Response.redirect(url.toString(), 301);
    }

    if (url.pathname === "/api/visits") {
      const id = env.VISITOR_COUNTER.idFromName("white-house-fact-checked");
      const stub = env.VISITOR_COUNTER.get(id);
      return stub.fetch(request);
    }

    if (url.pathname.startsWith("/api/comments")) {
      const id = env.COMMENT_STORE.idFromName("white-house-fact-checked-comments");
      return env.COMMENT_STORE.get(id).fetch(request);
    }

    return serveSiteAsset(request, env);
  },
};
