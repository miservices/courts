/**
 * MiCOURT Shell — shell.js
 * Injects the site-wide banner, header/nav, and footer into every page.
 *
 * USAGE: Drop ONE line into each page's <head> (before any page CSS):
 *   <script src="/courts/shell.js" data-active="home"></script>
 *
 * data-active values (marks that nav link as active):
 *   home | directory | services | forms | selfhelp | careers
 *
 * The script also:
 *   - Sets the date in the header automatically
 *   - Marks the correct nav item active based on data-active=""
 *   - Keeps page-specific <body> content untouched
 */

(function () {
  'use strict';

  /* ── 1. Styles ───────────────────────────────────────────────────────────── */
  const CSS = `
    :root {
      --navy:       #0a1628;
      --navy-mid:   #0d1f3c;
      --navy-light: #112240;
      --border:     #1e3a5f;
      --gold:       #c8a84b;
      --gold-light: #d4b85e;
      --cream:      #f4f1ec;
      --white:      #ffffff;
      --text:       #1a1a1a;
      --muted:      #6b5f4e;
      --line:       #e0d9cf;
      --blue-muted: #7a9bbf;
    }

    /* Reset only shell elements */
    .mc-shell-banner, .mc-shell-header, .mc-shell-footer,
    .mc-shell-banner *, .mc-shell-header *, .mc-shell-footer * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    /* ── Banner ── */
    .mc-shell-banner {
      background: #071220;
      color: var(--blue-muted);
      text-align: center;
      padding: 8px 20px;
      font-size: 11px;
      letter-spacing: 0.01em;
      border-bottom: 1px solid var(--border);
      line-height: 1.5;
      font-family: 'DM Sans', sans-serif;
    }

    /* ── Header ── */
    .mc-shell-header {
      background: var(--navy);
      font-family: 'DM Sans', sans-serif;
    }
    .mc-shell-header-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 22px 40px 18px;
      border-bottom: 1px solid var(--border);
    }
    .mc-shell-logo h1 {
      font-family: 'Merriweather', serif;
      color: #fff;
      font-size: 22px;
      font-weight: 300;
      letter-spacing: 0.01em;
    }
    .mc-shell-logo p {
      color: var(--blue-muted);
      font-size: 11px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      margin-top: 3px;
    }
    .mc-shell-header-right {
      text-align: right;
    }
    .mc-shell-header-right p {
      color: var(--blue-muted);
      font-size: 11px;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }
    .mc-shell-date {
      color: var(--gold);
      font-size: 13px;
      margin-top: 3px;
    }

    /* ── Nav ── */
    .mc-shell-nav {
      background: var(--navy-mid);
      display: flex;
      align-items: center;
      padding: 0 40px;
      position: relative;
      z-index: 100;
    }
    .mc-shell-nav > a {
      color: #a0b8d0;
      font-size: 12.5px;
      padding: 14px 18px;
      text-decoration: none;
      letter-spacing: 0.04em;
      border-bottom: 3px solid transparent;
      transition: all 0.15s;
      white-space: nowrap;
      display: inline-block;
    }
    .mc-shell-nav > a:hover,
    .mc-shell-nav > a.active {
      color: #fff;
      border-bottom-color: var(--gold);
    }
    .mc-shell-nav-right {
      margin-left: auto;
      display: flex;
      gap: 8px;
      align-items: center;
    }
    .mc-shell-nav-btn {
      background: var(--gold);
      color: var(--navy) !important;
      padding: 8px 18px;
      border-radius: 3px;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.05em;
      text-decoration: none;
      border-bottom: none !important;
      white-space: nowrap;
    }
    .mc-shell-nav-btn:hover {
      background: var(--gold-light) !important;
    }

    /* ── Dropdowns ── */
    .mc-shell-dropdown {
      position: relative;
      display: inline-block;
    }
    .mc-shell-dropdown > a {
      color: #a0b8d0;
      font-size: 12.5px;
      padding: 14px 18px;
      text-decoration: none;
      letter-spacing: 0.04em;
      border-bottom: 3px solid transparent;
      transition: all 0.15s;
      white-space: nowrap;
      display: flex;
      align-items: center;
      gap: 5px;
      cursor: pointer;
      user-select: none;
    }
    .mc-shell-dropdown > a::after {
      content: '▾';
      font-size: 9px;
      color: var(--blue-muted);
      font-weight: 700;
    }
    .mc-shell-dropdown:hover > a,
    .mc-shell-dropdown > a.active {
      color: #fff;
    }
    .mc-shell-dropdown:hover > a::after,
    .mc-shell-dropdown > a.active::after {
      color: var(--gold);
    }
    .mc-shell-dropdown:hover > a,
    .mc-shell-dropdown > a.active {
      border-bottom-color: var(--gold);
    }
    .mc-shell-dropdown-menu {
      display: none;
      position: absolute;
      top: 100%;
      left: 0;
      background: var(--navy-mid);
      border: 1px solid var(--border);
      border-top: 2px solid var(--gold);
      min-width: 210px;
      z-index: 200;
      box-shadow: 0 8px 28px rgba(0,0,0,0.4);
    }
    .mc-shell-dropdown:hover .mc-shell-dropdown-menu {
      display: block;
    }
    .mc-shell-dropdown-menu a {
      display: block;
      padding: 10px 18px;
      color: #a0b8d0;
      font-size: 12px;
      text-decoration: none;
      border-bottom: 1px solid #1a2d48;
      letter-spacing: 0.03em;
      border-left: 3px solid transparent;
      transition: all 0.12s;
    }
    .mc-shell-dropdown-menu a:last-child { border-bottom: none; }
    .mc-shell-dropdown-menu a:hover {
      color: #fff;
      background: var(--navy-light);
      border-left-color: var(--gold);
    }

    /* ── Footer ── */
    .mc-shell-footer {
      background: var(--navy);
      padding: 20px 40px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 3px solid var(--gold);
      font-family: 'DM Sans', sans-serif;
    }
    .mc-shell-footer p {
      color: #3a5a7a;
      font-size: 11.5px;
    }
    .mc-shell-footer p + p {
      color: #2a4a6a;
    }

    /* ── Responsive ── */
    @media (max-width: 780px) {
      .mc-shell-header-top { padding: 16px 20px; }
      .mc-shell-nav        { padding: 0 20px; }
      .mc-shell-footer     { padding: 16px 20px; flex-direction: column; gap: 6px; text-align: center; }
    }
  `;

  /* ── 2. Nav structure ────────────────────────────────────────────────────── */
  const BASE = '/courts/';

  const NAV_ITEMS = [
    { id: 'home',      label: 'Home',            href: BASE + 'micourt/' },
    {
      id: 'directory', label: 'Directory',
      children: [
        { label: 'Supreme Court',            href: '#' },
        { label: 'Genesee Co. District Court', href: '#' },
      ]
    },
    {
      id: 'services', label: 'Online Services',
      children: [
        { label: 'Online Portal (MiCOURT)',  href: BASE + 'micourt/' },
        { label: 'Search Cases',             href: BASE + 'case-search/' },
        { label: 'Pay Fines & Fees',         href: '#' },
        { label: 'Docket Calendar',          href: '#' },
        { label: 'Jury Duty Portal',         href: '#' },
        { label: 'Request Court Records',    href: '#' },
      ]
    },
    {
      id: 'forms', label: 'Forms & Filing',
      children: [
        { label: 'Filing Information', href: '#' },
        { label: 'Court Forms',        href: '#' },
      ]
    },
    { id: 'selfhelp', label: 'Self Help', href: '#' },
    { id: 'careers',  label: 'Careers',   href: '#' },
  ];

  /* ── 3. Build HTML strings ──────────────────────────────────────────────── */
  function buildNav(activeId) {
    let items = '';
    NAV_ITEMS.forEach(item => {
      const isActive = item.id === activeId;
      if (item.children) {
        const dropLinks = item.children.map(c =>
          `<a href="${c.href}">${c.label}</a>`
        ).join('');
        items += `
          <div class="mc-shell-dropdown">
            <a href="#" class="${isActive ? 'active' : ''}">${item.label}</a>
            <div class="mc-shell-dropdown-menu">${dropLinks}</div>
          </div>`;
      } else {
        items += `<a href="${item.href}" class="${isActive ? 'active' : ''}">${item.label}</a>`;
      }
    });

    return `
      <nav class="mc-shell-nav">
        ${items}
        <div class="mc-shell-nav-right">
          <a href="${BASE}micourt/account/" class="mc-shell-nav-btn">Access MiCOURT ›</a>
        </div>
      </nav>`;
  }

  function buildHeader(activeId) {
    const today = new Date().toLocaleDateString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric'
    });
    return `
      <div class="mc-shell-header">
        <div class="mc-shell-header-top">
          <div class="mc-shell-logo">
            <h1>Michigan Courts</h1>
            <p>One Court of Justice</p>
          </div>
          <div class="mc-shell-header-right">
            <p>SCAO Maintained</p>
            <div class="mc-shell-date">${today}</div>
          </div>
        </div>
        ${buildNav(activeId)}
      </div>`;
  }

  function buildBanner() {
    return `<div class="mc-shell-banner">
      This site is not a real court, does not have legal authority, and is not affiliated with or endorsed by any real court system or government agency.
    </div>`;
  }

  function buildFooter() {
    return `
      <footer class="mc-shell-footer">
        <p>© ${new Date().getFullYear()} Michigan Courts · State Court Administrative Office · P.O. Box 30048, Lansing, MI 48909</p>
        <p>Portal v2.1 · Secured by MiPASS Identity Authentication</p>
      </footer>`;
  }

  /* ── 4. Inject fonts ─────────────────────────────────────────────────────── */
  function injectFonts() {
    if (document.querySelector('link[data-mc-fonts]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.setAttribute('data-mc-fonts', '');
    link.href = 'https://fonts.googleapis.com/css2?family=Merriweather:ital,wght@0,300;0,400;0,700;1,300&family=DM+Sans:wght@300;400;500;600;700;800&display=swap';
    document.head.prepend(link);
  }

  /* ── 5. Inject styles ────────────────────────────────────────────────────── */
  function injectStyles() {
    if (document.getElementById('mc-shell-styles')) return;
    const style = document.createElement('style');
    style.id = 'mc-shell-styles';
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  /* ── 6. Mount into DOM ───────────────────────────────────────────────────── */
  function mount() {
    // Read active page from the script tag itself
    const scriptTag = document.currentScript ||
      document.querySelector('script[src*="shell.js"]');
    const activeId = scriptTag ? (scriptTag.getAttribute('data-active') || '') : '';

    injectFonts();
    injectStyles();

    const bannerEl  = document.createElement('div');
    bannerEl.innerHTML = buildBanner();
    const headerEl  = document.createElement('div');
    headerEl.innerHTML = buildHeader(activeId);
    const footerEl  = document.createElement('div');
    footerEl.innerHTML = buildFooter();

    // Insert banner + header before <body>'s first child
    const body = document.body;
    body.insertBefore(headerEl.firstElementChild, body.firstChild);
    body.insertBefore(bannerEl.firstElementChild, body.firstChild);

    // Append footer at end of body
    body.appendChild(footerEl.firstElementChild);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();