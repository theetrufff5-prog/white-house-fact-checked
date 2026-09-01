(function () {
  const section = `
    <section class="energy-video section" id="energy-video" aria-labelledby="energy-video-title">
      <div class="energy-video-copy">
        <p class="kicker">/ NEW VIDEO</p>
        <h2 id="energy-video-title">Energy</h2>
        <p>Watch the latest White House Fact Checked video presentation.</p>
      </div>
      <div class="energy-video-player">
        <video src="/energy-2.mp4" poster="/energy-2-poster.jpg" controls playsinline preload="metadata" aria-label="Energy video"></video>
      </div>
    </section>`;

  function insertEnergyVideo() {
    if (document.getElementById("energy-video")) return;
    const featured = document.getElementById("featured-video");
    if (featured) featured.insertAdjacentHTML("beforebegin", section);
  }

  let attempts = 0;
  const timer = window.setInterval(function () {
    insertEnergyVideo();
    attempts += 1;
    if (attempts >= 20) window.clearInterval(timer);
  }, 500);
})();
