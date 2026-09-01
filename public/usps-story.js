(() => {
  const STORY_ID = "fact-check-usps-whistleblower";

  function addStory() {
    const grid = document.querySelector("#checks .check-grid");
    if (!grid || document.getElementById(STORY_ID)) return;

    const story = document.createElement("article");
    story.id = STORY_ID;
    story.className = "check-card";
    story.innerHTML = `
      <div class="card-top"><span>NBC NEWS • SEP. 1, 2026</span><b>10</b></div>
      <span class="verdict white">NEEDS CONTEXT</span>
      <h3>Whistleblower Alleges Rushed USPS Ballot-Mail System Could Disrupt the 2026 Midterms</h3>
      <p>Trump's executive order, the resulting USPS ballot-mail rule, and the federal portal are documented. An anonymous federal official alleges the portal was rushed, inadequately tested, and could reject an entire ballot batch when a sampled barcode fails. Those claimed defects and projections of widespread voter harm have not yet been independently established; USPS says it expects a low rejection rate, while courts have temporarily blocked mandatory state participation.</p>
      <div class="source"><span>PRIMARY RECEIPT</span><b>Executive Order 14399 • USPS final rule • Whistleblower disclosure</b></div>
      <a href="https://www.samsung-news.com/articles/7MuR5DTiwEadQq56wVTyvw-en-US" target="_blank" rel="noreferrer" aria-label="Read fact check: Whistleblower alleges rushed USPS ballot-mail system could disrupt the 2026 midterms">READ THE REPORT <span>↗</span></a>
    `;
    grid.prepend(story);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", addStory, { once: true });
  } else {
    addStory();
  }

  window.addEventListener("load", addStory, { once: true });
})();
