/* Online Portal dashboard: one file, like shell.js.
   Checks sign-in, builds the sidebar and top bar, loads the person's cases, and renders the Overview. */
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import { getAuth, setPersistence, browserLocalPersistence, onAuthStateChanged, signOut }
  from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";
import { getFirestore, doc, getDoc, collection, getDocs }
  from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

/* ── Settings (edit here) ─────────────────────────────────────────────── */
const SIGNIN = '/courts/online-services/portal/';
const PUBLIC = '/courts/';
const BASE   = '/courts/online-services/portal/dashboard/';

/* ── Roles: who sees which sidebar pages (edit the lists here) ─────────── */
const SELF   = ['Public User', 'Justice System User', 'Provisional Attorney', 'Licensed Attorney', 'Prosecuting Attorney'];
const ENFORCE = ['Justice System User', 'Prosecuting Attorney', 'Legal Services User'];
const STAFF  = ['Court Reporter', 'Law Clerk', 'Judicial Assistant',
                'Deputy Clerk', 'County Clerk', 'Court Administrator', 'Magistrate', 'Judge', 'Chief Judge',
                'Deputy Clerk of the Supreme Court', 'Clerk of the Supreme Court', 'Reporter of Decisions',
                'State Court Administrator', 'Justice', 'Chief Justice'];
const SUPREME = ['Deputy Clerk of the Supreme Court', 'Clerk of the Supreme Court', 'Reporter of Decisions',
                 'State Court Administrator', 'Justice', 'Chief Justice'];
const LEGACY = { 'portal user': 'Public User', 'bar member': 'Licensed Attorney' };   // roles saved by the old sign-up
const roleOf = a => { const r = String(a.role || '').trim(); return LEGACY[r.toLowerCase()] || r || 'Public User'; };

/* ── Sidebar pages. roles: 'all' or a list. Paths are relative to BASE. ── */
const NAV = [
  { title: null, items: [
    { id: 'overview', label: 'Overview', path: '', roles: 'all' } ] },
  { title: 'Workspace', items: [
    { id: 'cases',      label: 'My cases',           path: 'cases/',             roles: SELF },
    { id: 'hearings',   label: 'My hearings',        path: 'hearings/',          roles: SELF },
    { id: 'drafting',   label: 'Document Drafting',  path: 'document-drafting/', roles: [...SELF, ...STAFF] },
    { id: 'filings',    label: 'My filings',         path: 'file/',              roles: SELF },
    { id: 'financials', label: 'My financials',      path: 'financials/',        roles: SELF },
    { id: 'enforce',    label: 'Enforcement services', path: 'enforcement-services/', roles: ENFORCE } ] },
  { title: 'Court operations', items: [
    { id: 'docket',      label: 'Docket',                    path: 'docket/',                        roles: STAFF },
    { id: 'mhearings',   label: 'Manage Hearings',           path: 'hearings/manage/',               roles: STAFF },
    { id: 'mcases',      label: 'Case Management',           path: 'cases/manage/',                  roles: STAFF },
    { id: 'mfilings',    label: 'Manage Filings',            path: 'file/manage/',                   roles: STAFF },
    { id: 'mfinancials', label: 'Manage Financials',         path: 'financials/manage/',             roles: STAFF },
    { id: 'menforce',    label: 'Enforcement administration', path: 'enforcement-services/manage/',  roles: STAFF },
    { id: 'reports',     label: 'Court Reports',             path: 'reports/',                       roles: STAFF } ] },
  { title: 'Supreme Court', items: [
    { id: 'opinions',       label: 'Opinions',       path: 'opinions/',       roles: SUPREME },
    { id: 'administration', label: 'Administration', path: 'administration/', roles: SUPREME } ] }
];
const SETTINGS = { id: 'settings', label: 'Account Settings', path: 'settings/', roles: 'all' };   // always last
const LINKS = [
  { label: 'Search cases',       href: '/courts/case-search/' },
  { label: 'Pay fines & fees',   href: '/courts/online-services/pay-fees/' },
  { label: 'Court forms',        href: '/courts/forms-and-filing/forms/' },
  { label: 'Filing information', href: '/courts/forms-and-filing/information/' }
];

const app  = getApps().length ? getApp() : initializeApp({
  apiKey: "AIzaSyA8sUFIq81cs6uQvqduardpGJ4R2DxO8NQ",
  authDomain: "micourt-dada6.firebaseapp.com",
  projectId: "micourt-dada6",
  storageBucket: "micourt-dada6.firebasestorage.app",
  messagingSenderId: "1013564619997",
  appId: "1:1013564619997:web:8f259dab457915758f6f34"
});
const auth = getAuth(app);
const db   = getFirestore(app);
await setPersistence(auth, browserLocalPersistence);

/* ── Helpers ──────────────────────────────────────────────────────────── */
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const asDate = v => new Date(String(v).length <= 10 ? v + 'T12:00:00' : v);
const fmtShort = v => v ? asDate(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
const fmtTime = v => v ? asDate(v).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '';
const money = n => '$' + Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });
const initials = n => String(n || '?').split(/\s+/).filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase();
const norm = s => String(s || '').trim().toLowerCase();
const statusPill = s => `<span class="pill ${/closed|paid/i.test(s) ? 'done' : 'live'}">${esc(s)}</span>`;
const empty = (t, p) => `<div class="empty"><strong>${esc(t)}</strong><p>${esc(p)}</p></div>`;
const searchUrl = c => (/supreme/i.test(c.court) ? '/courts/supreme-court/case-search/' : '/courts/case-search/') + '?q=' + encodeURIComponent(c.id);

/* ── Data: account + the cases linked to this person ─────────────────── */
// A case is linked when the account name matches a party, or appears in an attorney field.
async function loadAccount(uid) {
  const s = await getDoc(doc(db, 'accounts', uid));
  return s.exists() ? { uid, ...s.data() } : null;
}

function peopleOf(c) {
  const out = [];
  Object.values(c.parties || {}).forEach(v => Array.isArray(v) ? v.forEach(x => out.push(x)) : v && typeof v === 'object' && out.push(v));
  return out;
}

async function loadData(account) {
  const me = norm(account.name);
  const snap = await getDocs(collection(db, 'cases'));
  const cases = [], hearings = [], orders = [], filings = [], events = [];

  snap.docs.forEach(d => {
    const c = d.data(), people = peopleOf(c);
    const party = people.find(x => norm(x.name) === me);
    const atty = me && people.some(x => norm(x.attorney).includes(me));
    if (!party && !atty) return;

    const p = c.parties || {};
    const a = p.appellant || p.primaryPetitioner || p.primaryPlaintiff;
    const b = p.appellee || p.respondent || p.primaryDefendant;
    const base = { id: c.caseId, court: c.court, caption: a && b ? `${a.name} v. ${b.name}` : c.caseId };
    const role = party ? party.role : 'Attorney';

    cases.push({ ...base, type: c.caseType, status: c.status, role, updated: c.dates?.closed || c.dates?.lastUpdated || c.dates?.filed });

    (c.hearings || []).forEach(h => {
      hearings.push({ ...base, type: h.type, date: h.date });
      events.push({ date: h.date, text: `${h.type} in ${c.caseId}: ${h.result || 'scheduled'}` });
    });
    (c.filings || []).forEach(f => {
      filings.push({ ...base, title: f.title, by: f.filedBy, date: f.dateFiled });
      events.push({ date: f.dateFiled, text: `${f.title} filed in ${c.caseId}` });
    });
    if (party) (c.financialOrders || []).forEach(o => {
      if (norm(o.owedBy) !== norm(role)) return;
      const paid = (o.payments || []).reduce((t, x) => t + Number(x.amount || 0), 0);
      orders.push({ ...base, type: o.type, balance: /paid/i.test(o.status) ? 0 : Math.max(0, Number(o.amount || 0) - paid) });
      (o.payments || []).forEach(x => events.push({ date: x.date, text: `Payment of $${x.amount} recorded in ${c.caseId}` }));
    });
  });

  const now = new Date(), newest = (a, b) => new Date(b.date) - new Date(a.date);
  cases.sort((a, b) => new Date(b.updated) - new Date(a.updated));
  filings.sort(newest);
  return {
    cases, filings, orders,
    active: cases.filter(c => !/closed/i.test(c.status)),
    upcoming: hearings.filter(h => new Date(h.date) >= now).sort((a, b) => new Date(a.date) - new Date(b.date)),
    balance: orders.reduce((t, o) => t + o.balance, 0),
    notices: events.filter(e => new Date(e.date) <= now).sort(newest).slice(0, 8)
  };
}

/* ── Sidebar ──────────────────────────────────────────────────────────── */
const ICON = {
  overview:   '<path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z"/>',
  cases:      '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  hearings:   '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  drafting:   '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 15l5-5 1.5 1.5L10.5 16.5H9z"/>',
  filings:    '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
  financials: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/>',
  enforce:    '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>',
  docket:     '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  mhearings:  '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4M9 15l2 2 4-4"/>',
  mcases:     '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18"/>',
  mfilings:   '<path d="M8 3h8l4 4v10H8z"/><path d="M4 7v14h12"/>',
  mfinancials:'<path d="M3 7h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM3 7l2-3h12v3"/><circle cx="16.5" cy="13.5" r="1"/>',
  menforce:   '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
  reports:    '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  opinions:   '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5M9 8h6"/>',
  administration: '<path d="M4 21h16M5 21V10l7-5 7 5v11M9 21v-6h6v6"/>',
  settings:   '<circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/>',
  link:       '<path d="M7 17L17 7M9 7h8v8"/>'
};
const svg = k => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[k]}</svg>`;

const canSee = (item, role) => item.roles === 'all' || item.roles.some(r => norm(r) === norm(role));

function renderSidebar(account) {
  const role = roleOf(account);
  const here = location.pathname.replace(/index\.html$/, '').replace(/\/?$/, '/');
  const link = it => {
    const href = BASE + it.path, on = href === here;
    return `<a href="${href}" class="${on ? 'active' : ''}" ${on ? 'aria-current="page"' : ''}>${svg(it.id)}${esc(it.label)}</a>`;
  };

  const groups = NAV.map(g => ({ title: g.title, items: g.items.filter(i => canSee(i, role)) })).filter(g => g.items.length);
  const nav = groups.map(g => `${g.title ? `<div class="sb-label">${esc(g.title)}</div>` : ''}${g.items.map(link).join('')}`).join('');

  $('sidebar-root').innerHTML = `
    <a class="sb-brand" href="${BASE}">
      <svg viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="25" fill="#fff"/><g stroke="#10264a" stroke-width="2" stroke-linecap="round" fill="none"><path d="M26 11v26M17 15h18M19 38h14"/><path d="M17 15l-6 12h12zM35 15l-6 12h12z" stroke-width="1.6" stroke-linejoin="round"/></g></svg>
      <span><b>Online Portal</b><small>Michigan Courts</small></span>
    </a>
    <nav class="sb-nav" aria-label="Portal">
      ${nav}
      <div class="sb-label">Quick links</div>
      ${LINKS.map(l => `<a href="${l.href}">${svg('link')}${esc(l.label)}</a>`).join('')}
      <div class="sb-bottom">${link(SETTINGS)}</div>
    </nav>
    <div class="sb-foot">
      <div class="sb-user"><div class="avatar" aria-hidden="true">${esc(initials(account.name))}</div>
        <div><b>${esc(account.name)}</b><small>${esc(role)}</small></div></div>
      <a class="sb-link" href="${PUBLIC}">Michigan Courts website</a>
      <button class="sb-signout" type="button" data-signout>Sign out</button>
    </div>`;

  const sb = $('sidebar-root'), btn = $('menu-btn'), scrim = $('scrim');
  const set = open => { sb.classList.toggle('open', open); scrim.hidden = !open; btn.setAttribute('aria-expanded', open); };
  btn.addEventListener('click', () => set(!sb.classList.contains('open')));
  scrim.addEventListener('click', () => set(false));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') set(false); });
}

/* ── Notifications (bell) ─────────────────────────────────────────────── */
function renderNotifications(uid, notices) {
  const root = $('notif-root'), key = 'mc_portal_seen_' + uid;
  let seen = localStorage.getItem(key);
  if (!seen) { seen = new Date().toISOString(); localStorage.setItem(key, seen); }
  const unread = notices.filter(n => new Date(n.date) > new Date(seen)).length;

  root.innerHTML = `
    <button class="bell" type="button" id="bell" aria-haspopup="true" aria-expanded="false" aria-label="Notifications${unread ? ', ' + unread + ' new' : ''}">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10 21a2 2 0 0 0 4 0"/></svg>
      ${unread ? `<span class="badge">${unread}</span>` : ''}
    </button>
    <div class="notif-menu" id="notif-menu" hidden>
      <div class="nm-head">Recent activity</div>
      ${notices.length ? notices.map(n => `<div class="nm-item"><span>${esc(n.text)}</span><small>${fmtShort(n.date)}</small></div>`).join('') : '<div class="nm-empty">Nothing new right now.</div>'}
    </div>`;

  const bell = $('bell'), menu = $('notif-menu');
  const close = () => { menu.hidden = true; bell.setAttribute('aria-expanded', false); };
  bell.addEventListener('click', e => {
    e.stopPropagation();
    const open = menu.hidden;
    menu.hidden = !open; bell.setAttribute('aria-expanded', open);
    if (open) { localStorage.setItem(key, new Date().toISOString()); bell.querySelector('.badge')?.remove(); }
  });
  document.addEventListener('click', e => { if (!root.contains(e.target)) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
}

/* ── Overview ─────────────────────────────────────────────────────────── */
function renderOverview(account, d) {
  const first = String(account.name || '').split(' ')[0] || 'there';
  const owing = d.orders.filter(o => o.balance > 0);

  const hearings = d.upcoming.length
    ? `<ul class="rows">${d.upcoming.slice(0, 5).map(h => `<li><div><b>${esc(h.type)}</b><small>${esc(h.caption)} · ${esc(h.id)}</small></div><div class="r"><b>${fmtShort(h.date)}</b><small>${fmtTime(h.date)}</small></div></li>`).join('')}</ul>`
    : empty('No upcoming hearings', 'When a hearing is scheduled in one of your cases, it will appear here.');

  const fees = owing.length
    ? `<ul class="rows">${owing.slice(0, 4).map(o => `<li><div><b>${esc(o.type)}</b><small>${esc(o.id)}</small></div><div class="r"><b>${money(o.balance)}</b></div></li>`).join('')}</ul><a class="btn" href="/courts/online-services/pay-fees/">Pay fines and fees</a>`
    : empty('Nothing due', 'You have no unpaid fines or fees.');

  const cases = d.cases.length
    ? `<div class="table-scroll"><table><thead><tr><th>Case</th><th>Court</th><th>Your role</th><th>Status</th><th></th></tr></thead><tbody>
        ${d.cases.slice(0, 8).map(c => `<tr><td><b>${esc(c.caption)}</b><small>${esc(c.id)} · ${esc(c.type)}</small></td><td>${esc(c.court)}</td><td>${esc(c.role)}</td><td>${statusPill(c.status)}</td><td class="r"><a href="${searchUrl(c)}">Details</a></td></tr>`).join('')}
      </tbody></table></div>`
    : empty('No cases linked to your account', 'Cases appear here when you are listed as a party or attorney. Use the case search to look up any public case.');

  const filings = d.filings.length
    ? `<ul class="rows">${d.filings.slice(0, 5).map(f => `<li><div><b>${esc(f.title)}</b><small>${esc(f.id)} · filed by ${esc(f.by)}</small></div><div class="r"><small>${fmtShort(f.date)}</small></div></li>`).join('')}</ul>`
    : empty('No filings yet', 'Documents filed in your cases will be listed here.');

  return `
    <section class="welcome">
      <div><h3>Welcome back, ${esc(first)}</h3><p>${esc(roleOf(account))}${account.barNumber ? ' · Bar No. ' + esc(account.barNumber) : ''}</p></div>
      <div class="quick"><a href="/courts/online-services/pay-fees/">Pay a fine</a><a href="/courts/forms-and-filing/forms/">Court forms</a><a href="/courts/case-search/">Search cases</a></div>
    </section>
    <div class="stats">
      <div class="stat"><span>Active cases</span><b>${d.active.length}</b></div>
      <div class="stat"><span>Upcoming hearings</span><b>${d.upcoming.length}</b></div>
      <div class="stat ${d.balance > 0 ? 'alert-stat' : ''}"><span>Balance due</span><b>${money(d.balance)}</b></div>
      <div class="stat"><span>Filings on record</span><b>${d.filings.length}</b></div>
    </div>
    <div class="grid2">
      <section class="card"><header><h3>Upcoming hearings</h3><a href="/courts/online-services/docket/">Docket calendar</a></header>${hearings}</section>
      <section class="card"><header><h3>Fines &amp; fees</h3><a href="/courts/online-services/pay-fees/">Pay online</a></header>${fees}</section>
    </div>
    <section class="card"><header><h3>My cases</h3><a href="/courts/case-search/">Search cases</a></header>${cases}</section>
    <section class="card"><header><h3>Recent filings</h3><a href="/courts/forms-and-filing/information/">How to file</a></header>${filings}</section>`;
}

/* ── Start ────────────────────────────────────────────────────────────── */
async function logout() { try { await signOut(auth); } finally { location.replace(SIGNIN); } }
document.addEventListener('click', e => { if (e.target.closest('[data-signout]')) logout(); });

onAuthStateChanged(auth, async user => {
  if (!user) { location.replace(SIGNIN); return; }

  let account;
  try { account = await loadAccount(user.uid); } catch (e) { console.error(e); }
  if (!account) { await logout(); return; }

  renderSidebar(account);
  $('topbar-date').textContent = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  $('auth-overlay').hidden = true;

  try {
    const data = await loadData(account);
    renderNotifications(user.uid, data.notices);
    $('page-body').innerHTML = renderOverview(account, data);
  } catch (e) {
    console.error(e);
    $('page-body').innerHTML = '<div class="alert" role="alert"><strong>Something went wrong</strong><p>Your information could not be loaded. Refresh the page to try again.</p></div>';
  }
});