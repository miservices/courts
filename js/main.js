/* =========================
   GLOBAL HELPERS
========================= */

/* Get element by ID */
window.$ = (id) => document.getElementById(id);

/* Open external links safely */
window.openExternal = (url) => {
  window.open(url, "_blank", "noopener");
};

/* Disable all inputs */
window.disableAllInputs = () => {
  document.querySelectorAll("input, select, button").forEach(el => el.disabled = true);
};

/* Smooth scroll to top */
window.scrollTopSmooth = () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
};

/* Show error banner in container */
window.showGlobalError = (containerId, message) => {
  const box = $(containerId);
  if (!box) return;
  box.innerHTML = `<div class="error-banner">${message}</div>`;
  scrollTopSmooth();
};

