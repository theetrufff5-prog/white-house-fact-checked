(() => {
  const records = [
    { title: "The Documents Case", label: "Primary-record explainer", tags: "trump mar-a-lago classified documents indictment special counsel jack smith obstruction", summary: "What prosecutors alleged, the charges, and why no jury decided the case.", url: "#top" },
    { title: "Latest Fact Checks", label: "Claims and receipts", tags: "trump putin ukraine iran hegseth drug prices medicare bitcoin crypto politics evidence", summary: "Review the newest claims against reporting and primary records.", url: "#checks" },
    { title: "Trump Fails Families and Kids", label: "Senate committee report", tags: "families children budget senate joint economic committee report pdf", summary: "Read the source document directly on the site.", url: "#families-and-kids" },
    { title: "Featured Video", label: "Watch the receipts", tags: "video youtube report watch receipts", summary: "Watch the current featured White House Fact Checked report.", url: "#featured-video" },
    { title: "Take Action", label: "Public petition", tags: "petition youtube harassment human review enforcement reporting", summary: "Read and sign the petition calling for accountable human review.", url: "#petition" },
    { title: "Our Method", label: "How we investigate", tags: "method evidence sources claims receipts verify verification fact check", summary: "See how the team separates claims, receipts, and reality.", url: "#method" },
    { title: "About the Project", label: "Independent journalism", tags: "about mission editorial team reporters investigators independent", summary: "Learn who we are and why the public record matters.", url: "#about" },
    { title: "Community Remarks", label: "Reader discussion", tags: "comments remarks discussion opinion reader", summary: "Read approved remarks or submit your own for review.", url: "#comments" }
  ];

  const guide = document.createElement("aside");
  guide.className = "investigator-guide";
  guide.setAttribute("aria-label", "The Investigator site guide");
  guide.innerHTML = `
    <button class="investigator-summon" type="button" aria-expanded="false" aria-controls="investigator-panel">
      <img src="/investigator-guide.png" alt="" width="66" height="121"><span>ASK THE INVESTIGATOR</span>
    </button>
    <section class="investigator-panel" id="investigator-panel" hidden>
      <button class="investigator-close" type="button" aria-label="Close The Investigator">×</button>
      <header><img src="/investigator-guide.png" alt="The Investigator holding a flashlight and classified documents" width="76" height="139"><div><p>THE INVESTIGATOR / SITE GUIDE</p><h2>What should we investigate?</h2></div></header>
      <form role="search"><label for="investigator-query">Search claims, evidence, people, or topics</label><div><input id="investigator-query" type="search" autocomplete="off" placeholder="Try: documents or Medicare"><button type="submit">SEARCH</button></div></form>
      <div class="investigator-results" aria-live="polite"><p>Point me toward a claim, person, document, or topic.</p></div>
      <small>Searches stay in your browser and are not saved. © 2026 White House: Fact Checked.</small>
    </section>`;
  document.body.append(guide);

  const summon = guide.querySelector(".investigator-summon");
  const panel = guide.querySelector(".investigator-panel");
  const close = guide.querySelector(".investigator-close");
  const form = guide.querySelector("form");
  const input = guide.querySelector("input");
  const results = guide.querySelector(".investigator-results");

  function setOpen(open) {
    panel.hidden = !open;
    summon.setAttribute("aria-expanded", String(open));
    guide.classList.toggle("is-open", open);
    if (open) window.setTimeout(() => input.focus(), 50);
  }

  function search(query) {
    const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
    if (!terms.length) { results.innerHTML = "<p>Type a claim, person, document, or topic.</p>"; return; }
    const matches = records.filter(item => {
      const text = `${item.title} ${item.label} ${item.tags} ${item.summary}`.toLowerCase();
      return terms.every(term => text.includes(term));
    });
    results.innerHTML = matches.length
      ? matches.map(item => `<a href="${item.url}"><b>${item.title}</b><span>${item.label}</span><small>${item.summary}</small></a>`).join("")
      : "<p>I don’t have a matching file yet. Try fewer words or another topic.</p>";
  }

  summon.addEventListener("click", () => setOpen(panel.hidden));
  close.addEventListener("click", () => setOpen(false));
  form.addEventListener("submit", event => { event.preventDefault(); search(input.value); });
  document.addEventListener("keydown", event => { if (event.key === "Escape" && !panel.hidden) setOpen(false); });
})();
