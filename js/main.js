/* =========================
   GLOBAL HELPERS
========================= */

/* Safe element getter */
window.$ = (id) => document.getElementById(id);

/* Open external links safely */
window.openExternal = (url) => {
  window.open(url, "_blank", "noopener");
};

/* Scroll to top helper */
window.scrollTopSmooth = () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
};

/* Generic error handler */
window.showGlobalError = (containerId, message) => {
  const box = $(containerId);
  if (!box) return;

  box.innerHTML = `<div class="error-banner">${message}</div>`;
  scrollTopSmooth();
};
