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

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/visits") {
      const id = env.VISITOR_COUNTER.idFromName("white-house-fact-checked");
      const stub = env.VISITOR_COUNTER.get(id);
      return stub.fetch(request);
    }

    return env.ASSETS.fetch(request);
  },
};
