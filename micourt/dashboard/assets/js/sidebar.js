// sidebar.js — the ONE place that defines routes, roles, and navigation.
// Change a role's nav, add a page, or rename a route here and every page picks it up.

export const BASE = '/courts/micourt/dashboard';

export const ROUTES = {
  overview:          BASE + '/',
  'cases':           BASE + '/cases/',
  'cases-mine':      BASE + '/cases/mine/',
  docket:            BASE + '/docket/',
  hearings:          BASE + '/hearings/',
  filings:           BASE + '/filings/',
  'filings-manage':  BASE + '/filings/manage/',
  'filings-new':     BASE + '/filings/new/',
  financials:        BASE + '/financials/',
  'case-management': BASE + '/case-management/',
  settings:          BASE + '/settings/',
};

export const PAGE_TITLES = {
  overview:'Dashboard',
  'cases':'All Cases',
  'cases-mine':'My Cases',
  docket:'My Docket',
  hearings:'Hearings',
  filings:'Electronic Filing',
  'filings-manage':'Manage Filings',
  'filings-new':'File a New Document',
  financials:'Fines & Fees',
  'case-management':'Case Management',
  settings:'Account Settings',
};

// Role → tier + home court. Add new roles here only.
export const ROLE_META = {
  'Portal User':                          { tier:'public',        court:'Genesee Co. District Court', sc:false },
  'Licensed Attorney':                    { tier:'attorney',      court:'Genesee Co. District Court', sc:false },
  'State Attorney':                       { tier:'state-atty',    court:'Genesee Co. District Court', sc:false },
  'Clerk':                                { tier:'clerk',         court:'Genesee Co. District Court', sc:false },
  'Magistrate Judge':                     { tier:'magistrate',    court:'Genesee Co. District Court', sc:false },
  'Judge':                                { tier:'judge',         court:'Genesee Co. District Court', sc:false },
  'Chief Judge':                          { tier:'chief-judge',   court:'Genesee Co. District Court', sc:false },
  'Clerk of the Supreme Court':           { tier:'sc-clerk',      court:'Michigan Supreme Court',     sc:true  },
  'Assistant Clerk of the Supreme Court': { tier:'sc-asst-clerk', court:'Michigan Supreme Court',     sc:true  },
  'Justice':                              { tier:'justice',       court:'Michigan Supreme Court',     sc:true  },
  'Chief Justice':                        { tier:'chief-justice', court:'Michigan Supreme Court',     sc:true  },
};

// Tiers whose "Manage Filings" page shows the pending-review queue.
export const QUEUE_TIERS = ['clerk','sc-clerk','sc-asst-clerk','chief-judge'];
// Tiers with a personal docket + inline upcoming-proceedings list.
export const DOCKET_HEARING_TIERS = ['magistrate','judge','chief-judge','justice','chief-justice'];
// Tiers with access to Case Management (administrative tools).
export const ADMIN_TIERS = ['clerk','magistrate','judge','chief-judge','sc-clerk','justice','chief-justice'];

export function getTier(role) { return (ROLE_META[role]||ROLE_META['Portal User']).tier; }
export function isScRole(role) { return !!(ROLE_META[role]||{}).sc; }
export function isStaffTier(tier) { return !['public','attorney','state-atty'].includes(tier); }

const SECTION_LABELS = { main:'Case Management', staff:'Staff Tools', account:'Account' };

// Sidebar nav, per role tier. Order here = order rendered. Keep public-facing
// items first, staff-only tools in their own section, account settings last.
const NAV_CONFIG = {
  public: [
    { section:'main', items:[
      { id:'overview',    icon:'🏠', label:'Overview' },
      { id:'cases-mine',  icon:'📋', label:'My Cases' },
      { id:'hearings',    icon:'📅', label:'Hearings' },
      { id:'filings',     icon:'📤', label:'Electronic Filing' },
      { id:'financials',  icon:'💳', label:'Fines & Fees' },
    ]},
    { section:'account', items:[{ id:'settings', icon:'⚙️', label:'Account Settings' }]},
  ],
  attorney: [
    { section:'main', items:[
      { id:'overview',    icon:'🏠', label:'Overview' },
      { id:'cases-mine',  icon:'📋', label:'Client Cases' },
      { id:'hearings',    icon:'📅', label:'Hearings' },
      { id:'filings',     icon:'📤', label:'Electronic Filing' },
      { id:'financials',  icon:'💳', label:'Financials' },
    ]},
    { section:'account', items:[{ id:'settings', icon:'⚙️', label:'Account Settings' }]},
  ],
  'state-atty': [
    { section:'main', items:[
      { id:'overview',    icon:'🏠', label:'Overview' },
      { id:'cases-mine',  icon:'📋', label:'Case Docket' },
      { id:'hearings',    icon:'📅', label:'Hearings' },
      { id:'filings',     icon:'📤', label:'Electronic Filing' },
    ]},
    { section:'account', items:[{ id:'settings', icon:'⚙️', label:'Settings' }]},
  ],
  clerk: [
    { section:'main', items:[
      { id:'overview', icon:'🏠', label:'Overview' },
      { id:'cases',    icon:'🔎', label:'All Cases' },
      { id:'filings',  icon:'📤', label:'Electronic Filing' },
    ]},
    { section:'staff', items:[
      { id:'filings-manage',  icon:'🗂️', label:'Manage Filings', countKey:'pendingFilings' },
      { id:'case-management', icon:'🛠️', label:'Case Management' },
    ]},
    { section:'account', items:[{ id:'settings', icon:'⚙️', label:'Settings' }]},
  ],
  magistrate: [
    { section:'main', items:[
      { id:'overview', icon:'🏠', label:'Overview' },
      { id:'docket',   icon:'⚖️', label:'My Docket' },
      { id:'cases',    icon:'🔎', label:'All Cases' },
      { id:'filings',  icon:'📤', label:'Electronic Filing' },
    ]},
    { section:'staff', items:[{ id:'case-management', icon:'🛠️', label:'Case Management' }]},
    { section:'account', items:[{ id:'settings', icon:'⚙️', label:'Settings' }]},
  ],
  judge: [
    { section:'main', items:[
      { id:'overview', icon:'🏠', label:'Overview' },
      { id:'docket',   icon:'⚖️', label:'My Docket' },
      { id:'cases',    icon:'🔎', label:'All Cases' },
      { id:'filings',  icon:'📤', label:'Electronic Filing' },
    ]},
    { section:'staff', items:[{ id:'case-management', icon:'🛠️', label:'Case Management' }]},
    { section:'account', items:[{ id:'settings', icon:'⚙️', label:'Settings' }]},
  ],
  'chief-judge': [
    { section:'main', items:[
      { id:'overview', icon:'🏠', label:'Overview' },
      { id:'docket',   icon:'⚖️', label:'My Docket' },
      { id:'cases',    icon:'🔎', label:'All Cases' },
      { id:'filings',  icon:'📤', label:'Electronic Filing' },
    ]},
    { section:'staff', items:[
      { id:'filings-manage',  icon:'🗂️', label:'Manage Filings', countKey:'pendingFilings' },
      { id:'case-management', icon:'🛠️', label:'Case Management' },
    ]},
    { section:'account', items:[{ id:'settings', icon:'⚙️', label:'Settings' }]},
  ],
  'sc-clerk': [
    { section:'main', items:[
      { id:'overview', icon:'🏠', label:'Overview' },
      { id:'cases',    icon:'🔎', label:'All SC Cases' },
      { id:'filings',  icon:'📤', label:'Electronic Filing' },
    ]},
    { section:'staff', items:[
      { id:'filings-manage',  icon:'🗂️', label:'Manage Filings', countKey:'pendingFilings' },
      { id:'case-management', icon:'🛠️', label:'Case Management' },
    ]},
    { section:'account', items:[{ id:'settings', icon:'⚙️', label:'Settings' }]},
  ],
  'sc-asst-clerk': [
    { section:'main', items:[
      { id:'overview', icon:'🏠', label:'Overview' },
      { id:'cases',    icon:'🔎', label:'All SC Cases' },
      { id:'filings',  icon:'📤', label:'Electronic Filing' },
    ]},
    { section:'staff', items:[{ id:'filings-manage', icon:'🗂️', label:'Manage Filings', countKey:'pendingFilings' }]},
    { section:'account', items:[{ id:'settings', icon:'⚙️', label:'Settings' }]},
  ],
  justice: [
    { section:'main', items:[
      { id:'overview', icon:'🏠', label:'Overview' },
      { id:'docket',   icon:'⚖️', label:'My Docket' },
      { id:'cases',    icon:'🔎', label:'All SC Cases' },
    ]},
    { section:'staff', items:[{ id:'case-management', icon:'🛠️', label:'Case Management' }]},
    { section:'account', items:[{ id:'settings', icon:'⚙️', label:'Settings' }]},
  ],
  'chief-justice': [
    { section:'main', items:[
      { id:'overview', icon:'🏠', label:'Overview' },
      { id:'docket',   icon:'⚖️', label:'My Docket' },
      { id:'cases',    icon:'🔎', label:'All SC Cases' },
    ]},
    { section:'staff', items:[{ id:'case-management', icon:'🛠️', label:'Case Management' }]},
    { section:'account', items:[{ id:'settings', icon:'⚙️', label:'Settings' }]},
  ],
};

function initials(n) { return (n||'').split(' ').filter(Boolean).map(w=>w[0]).slice(0,2).join(''); }

export function renderSidebar({ role, pageId, user, court, counts = {} }) {
  const tier = getTier(role);
  const config = NAV_CONFIG[tier] || NAV_CONFIG.public;
  const sc = isScRole(role);

  let navHtml = '';
  config.forEach(sec => {
    navHtml += `<div class="sb-section"><span class="sb-section-label">${SECTION_LABELS[sec.section]||sec.section}</span>`;
    sec.items.forEach(item => {
      const active = item.id === pageId ? ' active' : '';
      const count = item.countKey ? (counts[item.countKey] || 0) : 0;
      const badge = count > 0 ? `<span class="sb-nav-count">${count}</span>` : '';
      navHtml += `<a class="sb-nav-item${active}" href="${ROUTES[item.id]}"><span class="sb-nav-icon">${item.icon}</span>${item.label}${badge}</a>`;
    });
    navHtml += `</div><hr class="sb-divider">`;
  });

  return `
    <a class="sb-brand" href="${ROUTES.overview}">
      <div class="sb-brand-seal">⚖️</div>
      <div class="sb-brand-text"><span class="name">MiCOURT</span><span class="sub">Michigan Courts Portal</span></div>
    </a>
    <div class="sb-user">
      <div class="sb-avatar">${initials(user && user.name)}</div>
      <div class="sb-user-info">
        <span class="sb-user-name">${user && user.name || '—'}</span>
        <span class="sb-user-role">${role}</span>
      </div>
    </div>
    <div class="sb-court-switcher${sc ? ' show' : ''}" id="court-switcher">
      <span class="scs-label">Court Context</span>
      <button class="scs-btn${court === 'Michigan Supreme Court' ? ' active' : ''}" data-court="sc"><span class="scs-dot"></span> Michigan Supreme Court</button>
      <button class="scs-btn${court !== 'Michigan Supreme Court' ? ' active' : ''}" data-court="district"><span class="scs-dot"></span> Genesee Co. District Court</button>
    </div>
    <div id="sidebar-nav">${navHtml}</div>
    <div class="sb-bottom">
      <button class="sb-sign-out" onclick="window.signOutUser && window.signOutUser()"><span style="font-size:14px">←</span> Sign Out</button>
    </div>`;
}

export function mountSidebar({ role, pageId, user, court, counts }) {
  const root = document.getElementById('sidebar-root');
  if (!root) return;
  root.innerHTML = renderSidebar({ role, pageId, user, court, counts });
  root.querySelectorAll('.scs-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      root.querySelectorAll('.scs-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const isSc = btn.dataset.court === 'sc';
      const newCourt = isSc ? 'Michigan Supreme Court' : 'Genesee Co. District Court';
      document.dispatchEvent(new CustomEvent('micourt:court-changed', { detail: { court: newCourt, isSc } }));
    });
  });
}