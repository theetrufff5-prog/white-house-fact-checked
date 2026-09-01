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
    `${ENERGY_VIDEO_STYLES}<script src="/energy-video.js" defer></script></head>`,
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
