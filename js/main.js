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
  box.innerHTML = `<div style="padding:12px;border:1px solid #f00;background:#fee;color:#900;border-radius:6px;font-weight:600">${message}</div>`;
  scrollTopSmooth();
};

// Highlight active nav link based on current URL
window.highlightActiveNav = () => {
  const links = document.querySelectorAll(".nav a");
  const path = window.location.pathname; // e.g., "/courts/forms"

  // First, remove 'active' from all links
  links.forEach(link => link.classList.remove("active"));

  // Then, add 'active' to the link that matches the path
  let found = false;
  links.forEach(link => {
    const href = link.getAttribute("href");

    // If the current path starts with the link href, mark it active
    if (path.startsWith(href)) {
      link.classList.add("active");
      found = true;
    }
  });

  // Fallback: if no link matches, highlight Home
  if (!found && links.length) {
    links[0].classList.add("active");
  }
};

// Run after DOM loads
document.addEventListener("DOMContentLoaded", highlightActiveNav);
