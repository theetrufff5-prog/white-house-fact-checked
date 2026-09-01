(() => {
  const PROMO_ID = "paranormal-fact-checked-promo";
  const RAIL_ID = "paranormal-fact-checked-rail-card";

  function addParanormalPromo() {
    const footer = document.querySelector("main > footer") || document.querySelector("body > footer") || document.querySelector("footer:last-of-type");
    const rail = document.querySelector(".side-rail");

    if (footer && !document.getElementById(PROMO_ID)) {
      const promo = document.createElement("aside");
      promo.id = PROMO_ID;
      promo.className = "paranormal-promo";
      promo.setAttribute("aria-label", "Promoted site");
      promo.innerHTML = `
        <a href="https://paranormal-fact-checked.theetrufff5.workers.dev" target="_blank" rel="noreferrer" aria-label="Visit Paranormal Fact Checked">
          <img src="/paranormal-fact-checked-promo.png" alt="Paranormal Fact Checked — Claims, Evidence, The Unknown">
          <span class="paranormal-promo-copy">
            <small>PROMOTED SITE</small>
            <h2>Paranormal:<br>Fact Checked</h2>
            <p>Step beyond the headlines. Explore paranormal claims, evidence, possible explanations, and the stories that remain unexplained.</p>
            <b>VISIT THE SITE ↗</b>
          </span>
        </a>`;
      footer.insertAdjacentElement("beforebegin", promo);
    }

    if (rail && !document.getElementById(RAIL_ID)) {
      const railCard = document.createElement("a");
      railCard.id = RAIL_ID;
      railCard.className = "paranormal-rail-card";
      railCard.href = "https://paranormal-fact-checked.theetrufff5.workers.dev";
      railCard.target = "_blank";
      railCard.rel = "noreferrer";
      railCard.setAttribute("aria-label", "Visit Paranormal Fact Checked promoted site");
      railCard.innerHTML = `<img src="/paranormal-fact-checked-promo.png" alt=""><span>PROMOTED SITE</span><b>PARANORMAL: FACT CHECKED ↗</b>`;
      rail.prepend(railCard);
    }
  }

  let attempts = 0;
  const timer = window.setInterval(() => {
    addParanormalPromo();
    attempts += 1;
    if ((document.getElementById(PROMO_ID) && document.getElementById(RAIL_ID)) || attempts >= 20) window.clearInterval(timer);
  }, 250);
})();
