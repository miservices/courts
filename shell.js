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
      background: #091628; color: #b9c8de; font-family: var(--font-ui);
      font-size: 13px; line-height: 1.45; padding: 9px 40px;
      display: flex; align-items: center; gap: 10px;
    }
    .mc-shell-banner svg { width: 16px; height: 16px; flex-shrink: 0; color: #5b9be0; }

    /* Header */
    .mc-shell-header { background: var(--navy); font-family: var(--font-ui); }
    .mc-shell-header-top {
      display: flex; align-items: center; justify-content: space-between;
      padding: 22px 40px; gap: 20px; border-top: 1px solid #22406f;
    }
    .mc-shell-brand { display: flex; align-items: center; gap: 16px; text-decoration: none; color: inherit; }
    .mc-shell-seal { width: 56px; height: 56px; flex-shrink: 0; }
    .mc-shell-logo h1 {
      font-family: var(--font-head); color: #fff;
      font-size: 28px; font-weight: 600; line-height: 1.1; letter-spacing: -.005em;
    }
    .mc-shell-logo p { color: #9cc4f5; font-size: 13px; margin-top: 4px; font-weight: 500; }
    .mc-shell-header-right { text-align: right; font-size: 13px; color: #9fb3d1; }
    .mc-shell-date { color: #fff; font-weight: 600; margin-top: 2px; }

    /* Nav */
    .mc-shell-nav {
      background: #fff; display: flex; align-items: center;
      padding: 0 32px; position: relative; z-index: 100; flex-wrap: wrap;
      border-bottom: 1px solid var(--border); box-shadow: 0 1px 0 rgba(16,38,74,.04);
    }
    .mc-shell-nav > a, .mc-shell-dropdown > a {
      color: var(--navy); font-size: 14.5px; font-weight: 600; padding: 15px 14px;
      text-decoration: none; border-bottom: 3px solid transparent;
      white-space: nowrap; display: flex; align-items: center; gap: 6px;
    }
    .mc-shell-nav > a:hover, .mc-shell-nav > a.active,
    .mc-shell-dropdown:hover > a, .mc-shell-dropdown > a.active {
      color: var(--accent); background: var(--navy-light); border-bottom-color: var(--accent);
    }
    .mc-shell-nav > a:focus-visible, .mc-shell-dropdown a:focus-visible, .mc-shell-nav-btn:focus-visible {
      outline: 3px solid #5b9be0; outline-offset: -3px;
    }
    .mc-shell-nav-right { margin-left: auto; padding: 8px 0; }
    .mc-shell-nav-btn {
      background: var(--navy); color: #fff !important; padding: 9px 18px;
      border-radius: 4px; font-size: 14px; font-weight: 700;
      text-decoration: none; white-space: nowrap; display: inline-block;
    }
    .mc-shell-nav-btn:hover { background: var(--navy-mid); }

    .mc-shell-dropdown { position: relative; display: inline-block; }
    .mc-shell-dropdown > a::after {
      content: ''; width: 6px; height: 6px; margin-left: 2px;
      border-right: 2px solid currentColor; border-bottom: 2px solid currentColor;
      transform: rotate(45deg) translateY(-2px);
    }
    .mc-shell-dropdown-menu {
      display: none; position: absolute; top: 100%; left: 0; background: #fff;
      border: 1px solid var(--border); border-top: 3px solid var(--accent); min-width: 250px; z-index: 200;
      box-shadow: 0 12px 28px rgba(16,38,74,.2);
    }
    .mc-shell-dropdown:hover .mc-shell-dropdown-menu,
    .mc-shell-dropdown:focus-within .mc-shell-dropdown-menu { display: block; }
    .mc-shell-dropdown-menu a {
      display: block; padding: 11px 18px; color: var(--text); font-size: 14px;
      text-decoration: none; border-bottom: 1px solid #edf1f6; border-left: 3px solid transparent;
    }
    .mc-shell-dropdown-menu a:last-child { border-bottom: none; }
    .mc-shell-dropdown-menu a:hover { background: var(--navy-light); border-left-color: var(--accent); color: var(--navy); }

    /* Mega menus */
    .mc-shell-dropdown-menu a small {
      display: block; font-size: 12.5px; font-weight: 400; color: var(--muted); margin-top: 2px; line-height: 1.4;
    }
    .mc-shell-dropdown-menu.mega { padding: 6px 0; }
    .mc-shell-dropdown:hover .mc-shell-dropdown-menu.mega,
    .mc-shell-dropdown:focus-within .mc-shell-dropdown-menu.mega { display: grid; gap: 0; }
    .mc-shell-col { border-right: 1px solid #edf1f6; padding: 4px 0; }
    .mc-shell-col:last-child { border-right: 0; }
    .mc-shell-col h2 {
      font-family: var(--font-ui); font-size: 13px; font-weight: 700; color: var(--navy);
      padding: 10px 18px 8px; border-bottom: 2px solid var(--navy-light); margin-bottom: 2px;
    }
    .mc-shell-dropdown-menu.mega a { border-bottom: 0; }

    /* Footer */
    .mc-shell-footer { background: #091628; color: #9fb3d1; font-family: var(--font-ui); font-size: 14px; line-height: 1.6; border-top: 4px solid var(--accent); }
    .mc-shell-footer-main {
      max-width: 1180px; margin: 0 auto; padding: 44px 40px 36px;
      display: grid; grid-template-columns: 1.4fr 1fr 1fr 1fr 1fr; gap: 32px;
    }
    .mc-shell-footer-brand { display: flex; gap: 14px; align-items: flex-start; }
    .mc-shell-footer-brand .mc-shell-seal { width: 44px; height: 44px; }
    .mc-shell-footer-brand strong { display: block; font-family: var(--font-head); color: #fff; font-size: 19px; font-weight: 600; }
    .mc-shell-footer-brand span { display: block; margin-top: 6px; font-size: 13.5px; max-width: 280px; }
    .mc-shell-footer h2 { color: #fff; font-family: var(--font-ui); font-size: 14px; font-weight: 700; margin-bottom: 12px; }
    .mc-shell-footer ul { list-style: none; }
    .mc-shell-footer li { margin-bottom: 8px; }
    .mc-shell-footer a { color: #b9c8de; text-decoration: none; }
    .mc-shell-footer a:hover { color: #fff; text-decoration: underline; }
    .mc-shell-footer a:focus-visible { outline: 3px solid #5b9be0; outline-offset: 2px; }
    .mc-shell-footer-base { border-top: 1px solid #1c3358; }
    .mc-shell-footer-base div {
      max-width: 1180px; margin: 0 auto; padding: 18px 40px; font-size: 12.5px;
      display: flex; justify-content: space-between; gap: 20px; flex-wrap: wrap; color: #7f94b5;
    }

    @media (max-width: 860px) {
      .mc-shell-footer-main { grid-template-columns: 1fr 1fr; padding: 32px 20px; gap: 28px; }
      .mc-shell-footer-brand { grid-column: 1 / -1; }
      .mc-shell-footer-base div { padding: 16px 20px; }
    }
    @media (max-width: 780px) {
      .mc-shell-banner { padding: 9px 20px; }
      .mc-shell-header-top { padding: 16px 20px; }
      .mc-shell-header-right { display: none; }
      .mc-shell-logo h1 { font-size: 23px; }
      .mc-shell-nav { padding: 0 8px; }
      .mc-shell-dropdown-menu.mega { min-width: 0; width: 92vw; }
      .mc-shell-dropdown:hover .mc-shell-dropdown-menu.mega { grid-template-columns: 1fr !important; }
    }
  `;

  const BASE = '/courts/';

  /* ── SITE MAP: edit paths/labels here; header and footer both read from this ── */
  const L = (label, path, desc) => ({ label, href: BASE + path, desc });

  const NAV_ITEMS = [
    { id: 'home', label: 'Home', href: BASE },
    { id: 'directory', label: 'Courts', groups: [
      { title: 'Supreme Court', links: [
        L('About the Supreme Court',      'supreme-court/about/',         'History, role, and jurisdiction'),
        L('Justices',                     'supreme-court/justices/',      'The seven justices of the Court'),
        L("Clerk's Office",               'supreme-court/clerk/',         'Filings, records, and case processing'),
        L('Schedule & Oral Arguments',    'supreme-court/oral-arguments/','Argument calendar and recordings'),
        L('Supreme Court Case Search',    'supreme-court/case-search/',   'Appeals, opinions, and orders'),
      ]},
      { title: 'Court Offices & Agencies', links: [
        L('Marshal of the Court',         'supreme-court/marshal/'),
        L('Reporter of Decisions',        'supreme-court/reporter-of-decisions/'),
        L('State Bar of Michigan',        'supreme-court/state-bar/'),
        L('Judicial Tenure Commission',   'supreme-court/judicial-tenure-commission/'),
        L('Attorney Grievance Commission','supreme-court/attorney-grievance-commission/'),
        L('Board of Law Examiners',       'supreme-court/board-of-law-examiners/'),
      ]},
      { title: 'Genesee Co. District Court', links: [
        L('About the District Court', 'genesee-co-district/about/',            'Trial court for Flint and Genesee County'),
        L('Court Directory',          'genesee-co-district/directory/',        'Judges, departments, and contacts'),
        L('Local Administration',     'genesee-co-district/administration/',   'Local rules and administrative orders'),
        L('Online Portal',            'micourt/',                              'File, pay, and manage your cases'),
      ]},
    ]},
    { id: 'services', label: 'Online Services', groups: [
      { title: 'Online Portal', links: [
        L('Online Portal',   'micourt/',      'Sign in to file, pay, and manage cases'),
        L('Search Cases',    'case-search/',  'District Court case records'),
        L('Docket Calendar', 'online-services/docket/', 'Upcoming hearings and court dates'),
      ]},
      { title: 'Payments & Records', links: [
        L('Pay Fines & Fees',      'online-services/pay-fees/',        'Traffic fines, court costs, other fees'),
        L('Request Court Records', 'online-services/request-records/', 'Copies, certified copies, and transcripts'),
      ]},
      { title: 'Jury Service', links: [
        L('Juror Information', 'jury-service/juror-information/', 'What to expect and how service works'),
        L('Jury Duty Portal',  'online-services/jury-portal/',    'Respond to a summons or check your status'),
      ]},
    ]},
    { id: 'rules', label: 'Rules', groups: [
      { links: [
        L('Rules',          'rules/',           'Court rules and rules of evidence'),
        L('Proposed Rules', 'rules/proposals/', 'Proposed amendments to court rules'),
      ]},
    ]},
    { id: 'forms', label: 'Forms & Filing', groups: [
      { links: [
        L('Filing Information', 'forms-and-filing/information/', 'How, where, and when to file'),
        L('Court Forms',        'forms-and-filing/forms/',       'Standard forms for filing'),
      ]},
    ]},
    { id: 'selfhelp', label: 'Self Help', href: BASE + 'self-help/' },
    { id: 'careers',  label: 'Careers',   href: BASE + 'careers/' },
    { id: 'about',    label: 'About',     href: BASE + 'about/' },
  ];

  const group = (id, i) => NAV_ITEMS.find(x => x.id === id).groups[i];
  const flat  = id => NAV_ITEMS.find(x => x.id === id).groups.flatMap(g => g.links);

  const SEAL = `
    <svg class="mc-shell-seal" viewBox="0 0 52 52" aria-hidden="true">
      <circle cx="26" cy="26" r="25" fill="#fff"/>
      <circle cx="26" cy="26" r="21.5" fill="none" stroke="#10264a" stroke-width="1" opacity=".5"/>
      <path d="M26 11v26M17 15h18" stroke="#10264a" stroke-width="2" stroke-linecap="round"/>
      <path d="M17 15l-6 12h12zM35 15l-6 12h12z" fill="none" stroke="#10264a" stroke-width="1.6" stroke-linejoin="round"/>
      <path d="M11 27a6 3 0 0 0 12 0M29 27a6 3 0 0 0 12 0" fill="#10264a"/>
      <path d="M19 38h14" stroke="#10264a" stroke-width="2.4" stroke-linecap="round"/>
    </svg>`;

  function linkHtml(l) {
    return `<a href="${l.href}">${l.label}${l.desc ? `<small>${l.desc}</small>` : ''}</a>`;
  }

  function buildNav(activeId) {
    let items = '';
    NAV_ITEMS.forEach(item => {
      const cls = item.id === activeId ? 'active' : '';
      if (item.groups) {
        let menu;
        if (item.groups.length > 1) {
          const cols = item.groups.map(g =>
            `<div class="mc-shell-col"><h2>${g.title}</h2>${g.links.map(linkHtml).join('')}</div>`).join('');
          menu = `<div class="mc-shell-dropdown-menu mega" style="grid-template-columns:repeat(${item.groups.length},minmax(215px,1fr))">${cols}</div>`;
        } else {
          menu = `<div class="mc-shell-dropdown-menu">${item.groups[0].links.map(linkHtml).join('')}</div>`;
        }
        items += `<div class="mc-shell-dropdown"><a href="#" class="${cls}" aria-haspopup="true">${item.label}</a>${menu}</div>`;
      } else {
        items += `<a href="${item.href}" class="${cls}">${item.label}</a>`;
      }
    });
    return `<nav class="mc-shell-nav" aria-label="Main">${items}
      <div class="mc-shell-nav-right"><a href="${BASE}micourt/" class="mc-shell-nav-btn">Sign in to Online Portal</a></div></nav>`;
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
    return `<div class="mc-shell-banner" role="note">
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="10" cy="10" r="8"/><path d="M10 9v5M10 6v.01" stroke-linecap="round"/></svg>
      <span>This site is not a real court, does not have legal authority, and is not affiliated with or endorsed by any real court system or government agency.</span>
    </div>`;
  }

  function footerCol(title, items) {
    return `<nav aria-label="${title}"><h2>${title}</h2><ul>${items.map(c => `<li><a href="${c.href}">${c.label}</a></li>`).join('')}</ul></nav>`;
  }

  function buildFooter() {
    return `<footer class="mc-shell-footer">
      <div class="mc-shell-footer-main">
        <div class="mc-shell-footer-brand">${SEAL}
          <div><strong>Michigan Courts</strong><span>State Court Administrative Office<br>P.O. Box 30048, Lansing, MI 48909</span></div>
        </div>
        ${footerCol('Supreme Court', group('directory', 0).links)}
        ${footerCol('District Court', group('directory', 2).links)}
        ${footerCol('Online services', flat('services'))}
        ${footerCol('Resources', [...flat('rules'), ...flat('forms'),
          { label: 'Self Help', href: BASE + 'self-help/' }, { label: 'Careers', href: BASE + 'careers/' }, { label: 'About', href: BASE + 'about/' }])}
      </div>
      <div class="mc-shell-footer-base"><div>
        <span>&copy; ${new Date().getFullYear()} Michigan Courts</span>
        <span>Portal v2.1 &middot; Secured by MiPASS Identity Authentication</span>
      </div></div>
    </footer>`;
  }

  function injectFavicon() {
    if (document.querySelector('link[rel~="icon"]')) return;
    const link = document.createElement('link');
    link.rel = 'icon';
    link.type = 'image/png';
    link.href = '/images/favicon.png';
    document.head.appendChild(link);
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
    injectFavicon();
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