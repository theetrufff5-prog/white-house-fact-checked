const ORIGINAL_SITE = "https://whitehousefactchecked.com";

export default {
  async fetch(request) {
    const incoming = new URL(request.url);

    // This worker is only a staging mirror while we recover the original site.
    // Never proxy the custom domain back to itself.
    if (incoming.hostname === "whitehousefactchecked.com" || incoming.hostname === "www.whitehousefactchecked.com") {
      return new Response("Original-site recovery staging is not ready for the custom domain yet.", {
        status: 503,
        headers: { "content-type": "text/plain; charset=utf-8" },
      });
    }

    const target = new URL(incoming.pathname + incoming.search, ORIGINAL_SITE);
    const headers = new Headers(request.headers);
    headers.delete("host");
    headers.delete("cf-connecting-ip");
    headers.delete("cf-ray");
    headers.delete("cf-visitor");

    const init = {
      method: request.method,
      headers,
      redirect: "manual",
    };

    if (request.method !== "GET" && request.method !== "HEAD") {
      init.body = request.body;
    }

    const upstream = await fetch(target.toString(), init);
    const outHeaders = new Headers(upstream.headers);

    // Let the recovered page and its assets render normally on workers.dev.
    outHeaders.delete("content-security-policy");
    outHeaders.delete("content-security-policy-report-only");
    outHeaders.delete("x-frame-options");

    const location = outHeaders.get("location");
    if (location && location.startsWith(ORIGINAL_SITE)) {
      const redirected = new URL(location);
      redirected.protocol = incoming.protocol;
      redirected.host = incoming.host;
      outHeaders.set("location", redirected.toString());
    }

    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: outHeaders,
    });
  },
};
