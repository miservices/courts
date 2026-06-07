/**
 * micourt-layout-inject.js
 * ─────────────────────────────────────────────────────────────────
 * Fetches layout.html and injects the shared header and footer into
 * the current page.
 *
 * HOW TO USE IN ANY PAGE
 * ──────────────────────
 * 1. Add two slot divs wherever you want the header and footer:
 *
 *      <div id="layout-header"></div>   ← top of <body>
 *      ...your page content...
 *      <div id="layout-footer"></div>   ← bottom of <body>
 *
 * 2. Include this script in <head> (or anywhere before </body>):
 *
 *      <script src="micourt-layout-inject.js"></script>
 *
 * 3. Optionally mark the active nav link by setting a data attribute
 *    on the script tag:
 *
 *      <script src="micourt-layout-inject.js" data-active-nav="home"></script>
 *
 *    Valid values: home | directory | services | forms | selfhelp | careers
 *
 * CONFIGURATION
 * ─────────────
 * Override defaults by setting window.MICOURT_LAYOUT before this
 * script loads:
 *
 *   window.MICOURT_LAYOUT = {
 *     src: '/path/to/layout.html',   // default: same directory
 *     dateId: 'my-date-element-id',  // if you want a custom date target
 *   };
 *
 * ─────────────────────────────────────────────────────────────────
 */

(function () {
  'use strict';

  // ── Config ────────────────────────────────────────────────────────
  const cfg = window.MICOURT_LAYOUT || {};

  // Resolve layout.html path relative to this script's own location
  const scriptSrc  = (document.currentScript || {}).src || '';
  const scriptDir  = scriptSrc ? scriptSrc.replace(/[^/]+$/, '') : './';
  const LAYOUT_SRC = cfg.src || (scriptDir + 'layout.html');

  // Active nav key from data attribute on the script tag
  const activeNav  = (document.currentScript || {}).dataset?.activeNav || cfg.activeNav || '';

  // Nav link text → key map (lowercase)
  const NAV_KEYS = {
    home:      'Home',
    directory: 'Directory',
    services:  'Online Services',
    forms:     'Forms & Filing',
    selfhelp:  'Self Help',
    careers:   'Careers',
  };

  // ── Helpers ───────────────────────────────────────────────────────
  function stampDate(container) {
    const el = container.querySelector('#layout-date-display');
    if (el) {
      el.textContent = new Date().toLocaleDateString('en-US', {
        month: 'long', day: 'numeric', year: 'numeric'
      });
    }
  }

  function markActiveNav(container) {
    if (!activeNav) return;
    const target = NAV_KEYS[activeNav.toLowerCase()];
    if (!target) return;
    container.querySelectorAll('.layout-nav > a, .layout-nav > .nav-dropdown > a').forEach(a => {
      if (a.textContent.trim() === target) a.classList.add('active');
    });
  }

  function injectSlot(container, templateId, slotId) {
    const slot = document.getElementById(slotId);
    if (!slot) return; // page doesn't use this slot — skip silently

    const tpl = container.querySelector('#' + templateId);
    if (!tpl) { console.warn('[MiCOURT Layout] template #' + templateId + ' not found in layout.html'); return; }

    const frag = tpl.content.cloneNode(true);
    slot.replaceWith(frag);
  }

  function injectStyles(container) {
    const styleEl = container.querySelector('#layout-styles');
    if (!styleEl) return;
    // Move layout styles into the document <head> if not already there
    if (!document.getElementById('layout-styles')) {
      const clone = styleEl.cloneNode(true);
      document.head.appendChild(clone);
    }
  }

  // ── Main injection ────────────────────────────────────────────────
  function inject(htmlText) {
    // Parse the fetched layout.html into a temporary container
    const parser    = new DOMParser();
    const parsed    = parser.parseFromString(htmlText, 'text/html');
    const container = parsed.body;

    // 1. Inject shared styles into <head>
    injectStyles(container);

    // 2. Stamp header slot
    injectSlot(container, 'tpl-header', 'layout-header');

    // 3. Stamp footer slot
    injectSlot(container, 'tpl-footer', 'layout-footer');

    // 4. Fill live date (after header is in the real DOM)
    const headerSlot = document.querySelector('.layout-header');
    if (headerSlot) {
      stampDate(headerSlot.closest('#layout-header') || document);
      markActiveNav(headerSlot.closest('#layout-header') || document);
    }
    // Fallback: scan the whole document
    stampDate(document);
    markActiveNav(document);
  }

  // ── Fetch + run ───────────────────────────────────────────────────
  function run() {
    fetch(LAYOUT_SRC)
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status + ' fetching ' + LAYOUT_SRC);
        return res.text();
      })
      .then(inject)
      .catch(function (err) {
        console.error('[MiCOURT Layout] Failed to load layout.html:', err);
        // Surface a visible error only in development environments
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
          ['layout-header', 'layout-footer'].forEach(function (id) {
            const el = document.getElementById(id);
            if (el) el.innerHTML = '<div style="background:#fef2f2;color:#7f1d1d;padding:10px 16px;font-size:12px;font-family:monospace;">[MiCOURT Layout] Could not load <strong>layout.html</strong>: ' + err.message + '</div>';
          });
        }
      });
  }

  // Run after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }

})();