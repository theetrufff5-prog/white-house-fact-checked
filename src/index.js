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
    `${ENERGY_VIDEO_STYLES}${EDITORIAL_TEAM_STYLES}${PARANORMAL_PROMO_STYLES}<script src="/energy-video.js" defer></script><script src="/usps-story.js" defer></script><script src="/editorial-team.js" defer></script><script src="/paranormal-promo.js" defer></script></head>`,
  );

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

    return serveSiteAsset(request, env);
  },
};
