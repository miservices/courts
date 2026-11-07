/**
 * Michigan Courts Shell: shell.js
 * Injects the site-wide banner, header/nav, and footer into every page.
 *
 * USAGE (in each page's <head>):
 *   <script src="/courts/shell.js" data-active="home"></script>
 *
 * data-active: home | directory | services | rules | forms | selfhelp | careers | about
 */
(function () {
  'use strict';

  const CSS = `
    :root {
      --navy: #10264a; --navy-mid: #17335f; --navy-light: #eef3f9; --border: #d5dde8;
      --gold: #1f5fae; --gold-light: #2a72cc; --accent: #1f5fae; --cream: #f5f7fa; --white: #ffffff;
      --text: #1b2433; --muted: #5a667a; --line: #d5dde8; --blue-muted: #5a667a;
      --font-ui: 'Public Sans', system-ui, -apple-system, 'Segoe UI', sans-serif;
      --font-head: 'Source Serif 4', Georgia, serif;
    }
    .mc-shell-banner, .mc-shell-header, .mc-shell-footer, .mc-shell-mnav,
    .mc-shell-banner *, .mc-shell-header *, .mc-shell-footer *, .mc-shell-mnav * { box-sizing: border-box; margin: 0; padding: 0; }

    .mc-shell-banner { background: #091628; color: #b9c8de; font-family: var(--font-ui); font-size: 13px; line-height: 1.45; padding: 9px 40px; display: flex; align-items: center; gap: 10px; }
    .mc-shell-banner svg { width: 16px; height: 16px; flex-shrink: 0; color: #5b9be0; }

    .mc-shell-top { position: fixed; top: 0; left: 0; right: 0; z-index: 300; transition: transform .25s ease; }
    .mc-shell-spacer { display: block; width: 100%; height: 0; pointer-events: none; }
    html { scroll-padding-top: calc(var(--mc-header-h, 0px) + 12px); }
    .mc-shell-top.banner-hidden { transform: translateY(calc(-1 * var(--mc-banner-h, 36px))); }
    .mc-shell-top.is-stuck .mc-shell-header { box-shadow: 0 6px 18px rgba(9,22,40,.28); }
    @media (prefers-reduced-motion: reduce) { .mc-shell-top { transition: none; } }

    .mc-shell-header { background: var(--navy); font-family: var(--font-ui); border-bottom: 3px solid #5b9be0; position: relative; z-index: 100; }
    .mc-shell-bar { display: flex; align-items: center; gap: 26px; max-width: 1280px; margin: 0 auto; padding: 0 32px; }
    .mc-shell-brand { display: flex; align-items: center; gap: 13px; text-decoration: none; color: inherit; padding: 15px 0; flex: none; }
    .mc-shell-seal { width: 50px; height: 50px; flex: none; display: block; }
    .mc-shell-logo { white-space: nowrap; }
    .mc-shell-logo h1 { font-family: var(--font-head); color: #fff; font-size: 24px; font-weight: 600; line-height: 1.1; letter-spacing: -.005em; }
    .mc-shell-logo p { font: 700 11px var(--font-ui); letter-spacing: .18em; text-transform: uppercase; color: #9cc4f5; margin-top: 4px; }

    .mc-shell-nav { margin-left: auto; display: flex; align-items: stretch; }
    .mc-shell-nav > a, .mc-shell-dropdown > a {
      color: #fff; font-size: 14.5px; font-weight: 600; padding: 0 13px; height: 80px; text-decoration: none;
      white-space: nowrap; display: flex; align-items: center; gap: 6px;
    }
    .mc-shell-nav > a:hover, .mc-shell-nav > a.active, .mc-shell-dropdown:hover > a, .mc-shell-dropdown > a.active {
      background: rgba(255,255,255,.08); box-shadow: inset 0 -3px 0 #9cc4f5;
    }
    .mc-shell-nav a:focus-visible, .mc-shell-nav-btn:focus-visible, .mc-shell-burger:focus-visible { outline: 3px solid #9cc4f5; outline-offset: -3px; }
    .mc-shell-nav-right { margin-left: 10px; display: flex; align-items: center; }
    .mc-shell-nav-btn { background: #fff; color: var(--navy) !important; padding: 10px 18px; border-radius: 6px; font-size: 14px; font-weight: 800; text-decoration: none; white-space: nowrap; display: inline-block; }
    .mc-shell-nav-btn:hover { background: #e3ecf8; }

    .mc-shell-dropdown { position: relative; display: flex; }
    .mc-shell-dropdown > a::after { content: ''; width: 6px; height: 6px; margin-left: 2px; border-right: 2px solid currentColor; border-bottom: 2px solid currentColor; transform: rotate(45deg) translateY(-2px); opacity: .7; }
    .mc-shell-dropdown-menu { display: none; position: absolute; top: 100%; left: 0; background: #fff; border: 1px solid var(--border); border-top: 3px solid var(--accent); min-width: 250px; z-index: 200; box-shadow: 0 12px 28px rgba(16,38,74,.2); }
    .mc-shell-dropdown:hover .mc-shell-dropdown-menu, .mc-shell-dropdown:focus-within .mc-shell-dropdown-menu { display: block; }
    .mc-shell-dropdown-menu a { display: block; padding: 11px 18px; color: var(--text); font-size: 14px; font-weight: 500; text-decoration: none; border-bottom: 1px solid #edf1f6; border-left: 3px solid transparent; }
    .mc-shell-dropdown-menu a:last-child { border-bottom: none; }
    .mc-shell-dropdown-menu a:hover { background: var(--navy-light); border-left-color: var(--accent); color: var(--navy); }
    .mc-shell-dropdown-menu a small { display: block; font-size: 12.5px; font-weight: 400; color: var(--muted); margin-top: 4px; line-height: 1.45; }
    .mc-shell-dropdown-menu.mega { padding: 14px 0 18px; }
    .mc-shell-dropdown:hover .mc-shell-dropdown-menu.mega, .mc-shell-dropdown:focus-within .mc-shell-dropdown-menu.mega { display: grid; gap: 0; }
    .mc-shell-col { border-right: 1px solid #edf1f6; padding: 2px 0; }
    .mc-shell-col:last-child { border-right: 0; }
    .mc-shell-col h2 { font-family: var(--font-ui); font-size: 13px; font-weight: 700; color: var(--navy); padding: 8px 24px 14px; border-bottom: 2px solid var(--navy-light); margin-bottom: 10px; }
    .mc-shell-dropdown-menu.mega a { border-bottom: 0; padding: 13px 24px; line-height: 1.4; }
    @media (max-width: 1240px) { .mc-shell-dropdown:nth-last-child(-n+5) .mc-shell-dropdown-menu { left: auto; right: 0; } .mc-shell-dropdown:nth-child(3) .mc-shell-dropdown-menu { left: 0; right: auto; } }

    .mc-shell-burger { display: none; margin-left: auto; width: 46px; height: 46px; border-radius: 8px; border: 1.5px solid rgba(255,255,255,.4); background: none; color: #fff; cursor: pointer; align-items: center; justify-content: center; flex-direction: column; gap: 5px; }
    .mc-shell-burger span { width: 22px; height: 2.5px; background: currentColor; border-radius: 2px; }
    .mc-shell-mnav { display: none; background: #fff; color: var(--text); font-family: var(--font-ui); border-bottom: 1px solid var(--border); padding: 8px 20px 18px; max-height: calc(100vh - 110px); overflow-y: auto; }
    .mc-shell-mnav.open { display: block; }
    .mc-shell-mnav .mg { padding: 8px 0; border-bottom: 1px solid #edf1f6; }
    .mc-shell-mnav .mg b { display: block; font: 700 12px var(--font-ui); text-transform: uppercase; letter-spacing: .1em; color: var(--muted); padding: 6px 0; }
    .mc-shell-mnav a { display: block; padding: 9px 0; text-decoration: none; font-weight: 500; color: var(--navy); }
    .mc-shell-mnav .m1 { border-bottom: 1px solid #edf1f6; font-weight: 600; }
    .mc-shell-mnav .mb { margin-top: 12px; background: var(--navy); color: #fff; text-align: center; border-radius: 6px; border: 0; }
    @media (max-width: 1020px) { .mc-shell-nav { display: none; } .mc-shell-burger { display: flex; } .mc-shell-bar { gap: 12px; } .mc-shell-brand { padding: 12px 0; } }

    .mc-shell-footer { background: #091628; color: #9fb3d1; font-family: var(--font-ui); font-size: 14px; line-height: 1.6; border-top: 4px solid var(--accent); }
    .mc-shell-footer-main { max-width: 1280px; margin: 0 auto; padding: 44px 32px 32px; display: grid; grid-template-columns: 1.4fr repeat(5, 1fr); gap: 28px; }
    .mc-shell-footer-brand { display: flex; gap: 14px; align-items: flex-start; }
    .mc-shell-footer-brand .mc-shell-seal { width: 46px; height: 46px; }
    .mc-shell-footer-brand strong { display: block; font-family: var(--font-head); color: #fff; font-size: 20px; font-weight: 600; }
    .mc-shell-footer-brand span { display: block; margin-top: 6px; font-size: 13.5px; max-width: 280px; }
    .mc-shell-footer h2 { color: #fff; font-family: var(--font-ui); font-size: 14px; font-weight: 700; margin-bottom: 12px; }
    .mc-shell-footer ul { list-style: none; }
    .mc-shell-footer li { margin-bottom: 8px; }
    .mc-shell-footer a { color: #b9c8de; text-decoration: none; }
    .mc-shell-footer a:hover { color: #fff; text-decoration: underline; }
    .mc-shell-footer a:focus-visible { outline: 3px solid #5b9be0; outline-offset: 2px; }
    .mc-shell-footer-base { border-top: 1px solid #1c3358; }
    .mc-shell-footer-base div { max-width: 1280px; margin: 0 auto; padding: 18px 32px; font-size: 12.5px; display: flex; justify-content: space-between; gap: 20px; flex-wrap: wrap; color: #7f94b5; }
    @media (max-width: 1020px) { .mc-shell-footer-main { grid-template-columns: repeat(3, 1fr); } .mc-shell-footer-brand { grid-column: 1 / -1; } }
    @media (max-width: 640px) { .mc-shell-banner { padding: 9px 18px; } .mc-shell-bar { padding: 0 18px; } .mc-shell-logo h1 { font-size: 21px; } .mc-shell-footer-main { grid-template-columns: 1fr 1fr; padding: 32px 18px; } .mc-shell-footer-base div { padding: 16px 18px; } }
`;

  /* SITE MAP: edit paths/labels here; header, mobile menu and footer all read from this */
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
        L('Attorney Discipline Board',    'supreme-court/attorney-discipline-board/'),
        L('Board of Law Examiners',       'supreme-court/board-of-law-examiners/'),
      ]},
      { title: 'District Courts', links: [
        L('About the District Court', 'genesee-co-district/about/',            'Trial court for Flint and Genesee County'),
        L('Court Directory',          'genesee-co-district/directory/',        'Judges, departments, and contacts'),
        L('Local Administration',     'genesee-co-district/administration/',   'Local rules and administrative orders'),
        L('Online Portal',            'online-services/portal/',                              'File, pay, and manage your cases'),
      ]},
    ]},
    { id: 'services', label: 'Online Services', groups: [
      { title: 'Online Portal', links: [
        L('Online Portal',   'online-services/portal/',      'Sign in to file, pay, and manage cases'),
        L('Search Cases',    'case-search/',  'District Court case records'),
        L('Docket Calendar', 'online-services/docket/', 'Upcoming hearings and court dates'),
      ]},
      { title: 'Payments & Records', links: [
        L('Pay Fines & Fees',      'online-services/pay-fees/',        'Traffic fines, court costs, other fees'),
        L('Request Court Records', 'online-services/request-records/', 'Copies, certified copies, and transcripts'),
      ]},
      { title: 'Jury Service', links: [
        L('Juror Information', 'online-services/juror-information/', 'What to expect and how service works'),
        L('Become a Juror', 'online-services/become-a-juror/', 'What to expect and how service works'),
        L('Jury Duty Portal',  'online-services/jury-portal/',    'Respond to a summons or check your status'),
      ]},
    ]},
    { id: 'rules', label: 'Rules', groups: [
      { links: [
        L('Rules',          'rules/',           'Court rules and rules of evidence'),
        L('Proposed Rules', 'rules/proposals/', 'Proposed amendments to court rules'),
      ]},
    ]},
    { id: 'forms', label: 'Forms & Filing', href: BASE + 'forms-and-filing/', groups: [
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

  const SEAL = `<svg class="mc-shell-seal" viewBox="0 0 100 100" aria-hidden="true"><rect width="100" height="100" rx="22" fill="#10264a"/><path d="M50 17L17 34h66z" fill="#9cc4f5"/><rect x="21" y="38" width="58" height="6" rx="1.5" fill="#9cc4f5"/><g fill="#f6f1e3"><rect x="24" y="48" width="8" height="28" rx="1.5"/><rect x="38" y="48" width="8" height="28" rx="1.5"/><rect x="54" y="48" width="8" height="28" rx="1.5"/><rect x="68" y="48" width="8" height="28" rx="1.5"/></g><rect x="17" y="79" width="66" height="6" rx="1.5" fill="#9cc4f5"/><circle cx="50" cy="29" r="3" fill="#10264a"/></svg>`;

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
        items += `<div class="mc-shell-dropdown"><a href="${item.href || '#'}" class="${cls}" aria-haspopup="true">${item.label}</a>${menu}</div>`;
      } else {
        items += `<a href="${item.href}" class="${cls}">${item.label}</a>`;
      }
    });
    return `<nav class="mc-shell-nav" aria-label="Main">${items}
      <div class="mc-shell-nav-right"><a href="${BASE}online-services/portal/" class="mc-shell-nav-btn">Sign in to Online Portal</a></div></nav>`;
  }

  function buildMobileNav() {
    let out = '';
    NAV_ITEMS.forEach(item => {
      if (item.groups) {
        out += `<div class="mg"><b>${item.label}</b>${item.groups.flatMap(g => g.links).map(l => `<a href="${l.href}">${l.label}</a>`).join('')}</div>`;
      } else {
        out += `<a class="m1" href="${item.href}">${item.label}</a>`;
      }
    });
    return `<div class="mc-shell-mnav" id="mc-shell-mnav">${out}<a class="m1 mb" href="${BASE}online-services/portal/">Sign in to Online Portal</a></div>`;
  }

  function buildHeader(activeId) {
    return `<header class="mc-shell-header"><div class="mc-shell-bar">
      <a class="mc-shell-brand" href="${BASE}" aria-label="Michigan Courts home">${SEAL}
        <div class="mc-shell-logo"><h1>Michigan Courts</h1><p>One Court of Justice</p></div>
      </a>${buildNav(activeId)}
      <button class="mc-shell-burger" type="button" aria-label="Menu" aria-expanded="false" aria-controls="mc-shell-mnav"><span></span><span></span><span></span></button>
    </div></header>`;
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
          <div><strong>Michigan Courts</strong><span>State Court Administrative Office<br>P.O. Box 30048, Flint, MI 48502</span></div>
        </div>
        ${footerCol('Supreme Court', group('directory', 0).links)}
        ${footerCol('Offices & agencies', group('directory', 1).links)}
        ${footerCol('District Courts', group('directory', 2).links)}
        ${footerCol('Online services', flat('services'))}
        ${footerCol('Resources', [...flat('rules'), ...flat('forms'),
          { label: 'Self Help', href: BASE + 'self-help/' }, { label: 'Careers', href: BASE + 'careers/' }, { label: 'About', href: BASE + 'about/' }])}
      </div>
      <div class="mc-shell-footer-base"><div>
        <span>&copy; ${new Date().getFullYear()} Michigan Courts</span>
      </div></div>
    </footer>`;
  }

  function injectFavicon() {
    if (document.querySelector('link[rel~="icon"]')) return;
    const link = document.createElement('link');
    link.rel = 'icon';
    link.type = 'image/png';
    link.href = '/courts/images/favicon.png';
    document.head.appendChild(link);
  }

  function injectFonts() {
    if (document.querySelector('link[data-mc-fonts]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.setAttribute('data-mc-fonts', '');
    link.href = 'https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;500;600;700;800&family=Source+Serif+4:wght@500;600;700&display=swap';
    document.head.prepend(link);
  }

  function injectStyles() {
    if (document.getElementById('mc-shell-styles')) return;
    const style = document.createElement('style');
    style.id = 'mc-shell-styles';
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  /* Header is always stuck to the top. The disclaimer banner hides on scroll down and
     returns on any scroll up. --mc-sticky-top tells page-level sticky bars where to sit. */
  function initStickyHeader() {
    const top = document.querySelector('.mc-shell-top');
    if (!top) return;
    const banner = top.querySelector('.mc-shell-banner');
    const header = top.querySelector('.mc-shell-header');
    const spacer = document.querySelector('.mc-shell-spacer');
    const root = document.documentElement;
    let hidden = false, last = window.scrollY;

    const measure = () => {
      if (spacer) spacer.style.height = top.offsetHeight + 'px';
      root.style.setProperty('--mc-header-h', header.offsetHeight + 'px');
      root.style.setProperty('--mc-banner-h', banner.offsetHeight + 'px');
      root.style.setProperty('--mc-sticky-top', (hidden ? header.offsetHeight : top.offsetHeight) + 'px');
    };
    const set = v => {
      if (v === hidden) return;
      hidden = v;
      top.classList.toggle('banner-hidden', v);
      measure();
    };
    measure();

    window.addEventListener('scroll', () => {
      const y = window.scrollY, dy = y - last, bh = banner.offsetHeight;
      last = y;
      top.classList.toggle('is-stuck', y > bh);
      if (y <= bh) set(false);
      else if (dy > 0) set(true);
      else if (dy < 0) set(false);
    }, { passive: true });
    window.addEventListener('resize', measure);
    window.addEventListener('load', measure);
    if (window.ResizeObserver) new ResizeObserver(measure).observe(top);
  }

  function initMobileNav(top) {
    const btn = top.querySelector('.mc-shell-burger');
    const panel = top.querySelector('.mc-shell-mnav');
    if (!btn || !panel) return;
    btn.addEventListener('click', () => {
      const open = panel.classList.toggle('open');
      btn.setAttribute('aria-expanded', open);
    });
    window.addEventListener('resize', () => {
      if (window.innerWidth > 1020) { panel.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); }
    });
  }

  function mount() {
    const scriptTag = document.currentScript || document.querySelector('script[src*="shell.js"]');
    const activeId = scriptTag ? (scriptTag.getAttribute('data-active') || '') : '';
    injectFavicon();
    injectFonts();
    injectStyles();

    const mk = html => { const d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstElementChild; };
    const body = document.body;
    const top = document.createElement('div');
    top.className = 'mc-shell-top';
    top.append(mk(buildBanner()), mk(buildHeader(activeId)), mk(buildMobileNav()));
    const spacer = document.createElement('div');
    spacer.className = 'mc-shell-spacer';
    body.insertBefore(spacer, body.firstChild);
    body.insertBefore(top, body.firstChild);
    body.appendChild(mk(buildFooter()));
    initMobileNav(top);
    initStickyHeader();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();