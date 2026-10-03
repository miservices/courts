/**
 * Michigan Courts Shell — shell.js
 * Injects the site-wide banner, header/nav, and footer into every page.
 *
 * USAGE (in each page's <head>):
 *   <script src="/courts/shell.js" data-active="home"></script>
 *
 * data-active: home | directory | services | forms | selfhelp | careers
 */
(function () {
  'use strict';

  const CSS = `
    :root {
      --navy:       #10264a;
      --navy-mid:   #17335f;
      --navy-light: #eef3f9;
      --border:     #d5dde8;
      --gold:       #1f5fae;   /* kept as the accent token name for existing pages */
      --gold-light: #2a72cc;
      --accent:     #1f5fae;
      --cream:      #f5f7fa;
      --white:      #ffffff;
      --text:       #1b2433;
      --muted:      #5a667a;
      --line:       #d5dde8;
      --blue-muted: #5a667a;
      --font-ui:    'Public Sans', system-ui, -apple-system, 'Segoe UI', sans-serif;
      --font-head:  'Source Serif 4', Georgia, serif;
    }

    .mc-shell-banner, .mc-shell-header, .mc-shell-footer,
    .mc-shell-banner *, .mc-shell-header *, .mc-shell-footer * {
      box-sizing: border-box; margin: 0; padding: 0;
    }

    /* Banner */
    .mc-shell-banner {
      background: #e8edf4; color: #3b475c; font-family: var(--font-ui);
      font-size: 12.5px; line-height: 1.5; padding: 7px 40px;
      border-bottom: 1px solid var(--border);
    }

    /* Header */
    .mc-shell-header { background: #fff; font-family: var(--font-ui); border-bottom: 1px solid var(--border); }
    .mc-shell-header-top {
      display: flex; align-items: center; justify-content: space-between;
      padding: 18px 40px; gap: 20px;
    }
    .mc-shell-brand { display: flex; align-items: center; gap: 14px; text-decoration: none; color: inherit; }
    .mc-shell-seal { width: 52px; height: 52px; flex-shrink: 0; }
    .mc-shell-logo h1 {
      font-family: var(--font-head); color: var(--navy);
      font-size: 24px; font-weight: 600; line-height: 1.1;
    }
    .mc-shell-logo p { color: var(--muted); font-size: 13px; margin-top: 3px; }
    .mc-shell-header-right { text-align: right; font-size: 13px; color: var(--muted); }
    .mc-shell-date { color: var(--text); font-weight: 600; margin-top: 2px; }

    /* Nav */
    .mc-shell-nav {
      background: var(--navy); display: flex; align-items: center;
      padding: 0 32px; position: relative; z-index: 100; flex-wrap: wrap;
    }
    .mc-shell-nav > a, .mc-shell-dropdown > a {
      color: #dbe5f3; font-size: 14.5px; font-weight: 500; padding: 15px 14px;
      text-decoration: none; border-bottom: 3px solid transparent;
      white-space: nowrap; display: flex; align-items: center; gap: 6px;
    }
    .mc-shell-nav > a:hover, .mc-shell-nav > a.active,
    .mc-shell-dropdown:hover > a, .mc-shell-dropdown > a.active {
      color: #fff; background: var(--navy-mid); border-bottom-color: #fff;
    }
    .mc-shell-nav > a:focus-visible, .mc-shell-dropdown a:focus-visible, .mc-shell-nav-btn:focus-visible {
      outline: 3px solid #9cc4f5; outline-offset: -3px;
    }
    .mc-shell-nav-right { margin-left: auto; padding: 8px 0; }
    .mc-shell-nav-btn {
      background: #fff; color: var(--navy) !important; padding: 9px 18px;
      border-radius: 4px; font-size: 14px; font-weight: 700;
      text-decoration: none; white-space: nowrap; display: inline-block;
    }
    .mc-shell-nav-btn:hover { background: #e3ecf8; }

    .mc-shell-dropdown { position: relative; display: inline-block; }
    .mc-shell-dropdown > a::after {
      content: ''; width: 6px; height: 6px; margin-left: 2px;
      border-right: 2px solid currentColor; border-bottom: 2px solid currentColor;
      transform: rotate(45deg) translateY(-2px);
    }
    .mc-shell-dropdown-menu {
      display: none; position: absolute; top: 100%; left: 0; background: #fff;
      border: 1px solid var(--border); border-top: 0; min-width: 240px; z-index: 200;
      box-shadow: 0 10px 24px rgba(16,38,74,.18);
    }
    .mc-shell-dropdown:hover .mc-shell-dropdown-menu,
    .mc-shell-dropdown:focus-within .mc-shell-dropdown-menu { display: block; }
    .mc-shell-dropdown-menu a {
      display: block; padding: 11px 18px; color: var(--text); font-size: 14px;
      text-decoration: none; border-bottom: 1px solid #edf1f6; border-left: 3px solid transparent;
    }
    .mc-shell-dropdown-menu a:last-child { border-bottom: none; }
    .mc-shell-dropdown-menu a:hover { background: var(--navy-light); border-left-color: var(--accent); color: var(--navy); }

    /* Footer */
    .mc-shell-footer {
      background: var(--navy); color: #b9c8de; font-family: var(--font-ui);
      padding: 28px 40px; display: flex; justify-content: space-between;
      align-items: center; gap: 20px; font-size: 13px; line-height: 1.6;
    }
    .mc-shell-footer strong { color: #fff; font-weight: 600; }

    @media (max-width: 780px) {
      .mc-shell-banner { padding: 7px 20px; }
      .mc-shell-header-top { padding: 14px 20px; }
      .mc-shell-header-right { display: none; }
      .mc-shell-nav { padding: 0 8px; }
      .mc-shell-footer { padding: 22px 20px; flex-direction: column; text-align: center; }
    }
  `;

  const BASE = '/courts/';

  const NAV_ITEMS = [
    { id: 'home', label: 'Home', href: BASE },
    { id: 'directory', label: 'Directory', children: [
        { label: 'Supreme Court',              href: BASE + 'supreme-court/' },
        { label: 'Genesee Co. District Court', href: BASE + 'genesee-co-district/' },
    ]},
    { id: 'services', label: 'Online Services', children: [
        { label: 'Online Portal (MiCOURT)', href: BASE + 'micourt/' },
        { label: 'Search Cases',            href: BASE + 'case-search/' },
        { label: 'Pay Fines & Fees',        href: BASE + 'online-services/pay-fees/' },
        { label: 'Docket Calendar',         href: BASE + 'online-services/docket/' },
        { label: 'Jury Duty Portal',        href: BASE + 'online-services/jury-portal/' },
        { label: 'Request Court Records',   href: BASE + 'online-services/request-records/' },
    ]},
    { id: 'forms', label: 'Forms & Filing', children: [
        { label: 'Filing Information', href: BASE + 'forms-and-filing/information/' },
        { label: 'Court Forms',        href: BASE + 'forms-and-filing/forms/' },
    ]},
    { id: 'selfhelp', label: 'Self Help', href: BASE + 'self-help/' },
    { id: 'careers',  label: 'Careers',   href: BASE + 'careers/' },
  ];

  const SEAL = `
    <svg class="mc-shell-seal" viewBox="0 0 52 52" aria-hidden="true">
      <circle cx="26" cy="26" r="25" fill="#10264a"/>
      <circle cx="26" cy="26" r="21.5" fill="none" stroke="#fff" stroke-width="1" opacity=".6"/>
      <path d="M26 11v26M17 15h18" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
      <path d="M17 15l-6 12h12zM35 15l-6 12h12z" fill="none" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/>
      <path d="M11 27a6 3 0 0 0 12 0M29 27a6 3 0 0 0 12 0" fill="#fff"/>
      <path d="M19 38h14" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>
    </svg>`;

  function buildNav(activeId) {
    let items = '';
    NAV_ITEMS.forEach(item => {
      const cls = item.id === activeId ? 'active' : '';
      if (item.children) {
        const links = item.children.map(c => `<a href="${c.href}">${c.label}</a>`).join('');
        items += `<div class="mc-shell-dropdown"><a href="#" class="${cls}">${item.label}</a><div class="mc-shell-dropdown-menu">${links}</div></div>`;
      } else {
        items += `<a href="${item.href}" class="${cls}">${item.label}</a>`;
      }
    });
    return `<nav class="mc-shell-nav" aria-label="Main">${items}
      <div class="mc-shell-nav-right"><a href="${BASE}micourt/" class="mc-shell-nav-btn">Sign in to MiCOURT</a></div></nav>`;
  }

  function buildHeader(activeId) {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    return `<header class="mc-shell-header">
      <div class="mc-shell-header-top">
        <a class="mc-shell-brand" href="${BASE}">${SEAL}
          <div class="mc-shell-logo"><h1>Michigan Courts</h1><p>One Court of Justice</p></div>
        </a>
        <div class="mc-shell-header-right">Maintained by SCAO<div class="mc-shell-date">${today}</div></div>
      </div>${buildNav(activeId)}</header>`;
  }

  function buildBanner() {
    return `<div class="mc-shell-banner">This site is not a real court, does not have legal authority, and is not affiliated with or endorsed by any real court system or government agency.</div>`;
  }

  function buildFooter() {
    return `<footer class="mc-shell-footer">
      <div><strong>Michigan Courts</strong><br>State Court Administrative Office, P.O. Box 30048, Lansing, MI 48909</div>
      <div>&copy; ${new Date().getFullYear()} Michigan Courts &middot; Portal v2.1<br>Secured by MiPASS Identity Authentication</div>
    </footer>`;
  }

  function injectFonts() {
    if (document.querySelector('link[data-mc-fonts]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.setAttribute('data-mc-fonts', '');
    link.href = 'https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;500;600;700&family=Source+Serif+4:wght@500;600;700&display=swap';
    document.head.prepend(link);
  }

  function injectStyles() {
    if (document.getElementById('mc-shell-styles')) return;
    const style = document.createElement('style');
    style.id = 'mc-shell-styles';
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  function mount() {
    const scriptTag = document.currentScript || document.querySelector('script[src*="shell.js"]');
    const activeId = scriptTag ? (scriptTag.getAttribute('data-active') || '') : '';
    injectFonts();
    injectStyles();

    const mk = html => { const d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstElementChild; };
    const body = document.body;
    body.insertBefore(mk(buildHeader(activeId)), body.firstChild);
    body.insertBefore(mk(buildBanner()), body.firstChild);
    body.appendChild(mk(buildFooter()));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
