(() => {
  const TEAM_ID = "editorial-team";

  function addEditorialTeam() {
    if (document.getElementById(TEAM_ID)) return;
    const banner = document.querySelector(".hero-banner");
    if (!banner) return;

    const team = document.createElement("section");
    team.id = TEAM_ID;
    team.className = "editorial-team";
    team.setAttribute("aria-labelledby", "editorial-team-title");
    team.innerHTML = `
      <header>
        <p class="kicker">/ THE PEOPLE BEHIND THE PROCESS</p>
        <h2 id="editorial-team-title">The Team @ White House: Fact Checked</h2>
        <p class="team-disclosure">Our virtual editorial team helps research, draft, and review each fact check under human direction.</p>
      </header>
      <div class="editorial-team-grid">
        <article><span>EDITOR-IN-CHIEF</span><h3>Tom Holland</h3><p>Directs editorial standards, final review, and publication readiness.</p></article>
        <article><span>SENIOR EDITOR</span><h3>Susan Brooks</h3><p>Shapes each story for clarity, balance, sourcing, and accuracy.</p></article>
        <article><span>SENIOR FIELD SUPERVISOR</span><h3>James Williamson</h3><p>Leads source research, primary-document checks, and field verification.</p></article>
      </div>
    `;
    banner.insertAdjacentElement("afterend", team);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", addEditorialTeam, { once: true });
  } else {
    addEditorialTeam();
  }
  window.addEventListener("load", addEditorialTeam, { once: true });
})();
