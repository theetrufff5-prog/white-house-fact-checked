(() => {
  const root = document.querySelector("[data-comments]"); if (!root) return;
  const list = root.querySelector("[data-comment-list]"), form = root.querySelector("form"), message = root.querySelector("[data-comment-message]");
  const escape = (value) => String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
  async function load() {
    try {
      const response = await fetch("/api/comments", { cache: "no-store" }); if (!response.ok) throw new Error();
      const { comments } = await response.json();
      list.innerHTML = comments.length ? comments.map((comment) => `<article class="comment"><div class="comment-meta"><b>${escape(comment.name)}${comment.editorial ? ' <span>WH: UNCHECKED EDITORIAL TEAM</span>' : ""}</b><time datetime="${escape(comment.createdAt)}">${new Date(comment.createdAt).toLocaleDateString()}</time></div><p>${escape(comment.body)}</p><button type="button" data-report="${escape(comment.id)}">Report</button></article>`).join("") : '<p class="comments-empty">No published remarks yet. You can be the first to submit one.</p>';
    } catch { list.innerHTML = '<p class="comments-empty">Remarks are temporarily unavailable.</p>'; }
  }
  form.addEventListener("submit", async (event) => {
    event.preventDefault(); const button = form.querySelector("button[type=submit]"), data = new FormData(form); button.disabled = true; message.textContent = "Submitting…";
    try {
      const response = await fetch("/api/comments", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: data.get("name"), body: data.get("body"), website: data.get("website") }) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error || "Submission failed.");
      form.reset(); message.textContent = "Thank you. Your remark is awaiting editorial review.";
    } catch (error) { message.textContent = error.message; } finally { button.disabled = false; }
  });
  list.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-report]"); if (!button || button.disabled) return; button.disabled = true;
    await fetch("/api/comments/report", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: button.dataset.report }) }); button.textContent = "Reported";
  });
  load();
})();
