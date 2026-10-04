/* Online Portal dashboard: one file, like shell.js.
   Checks sign-in, builds the sidebar and top bar, loads the person's cases, and renders the Overview. */
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import { getAuth, setPersistence, browserLocalPersistence, onAuthStateChanged, signOut }
  from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";
import { fillBadges, badgeCounts, BADGE_CSS } from "./badges.js?v=1";
import { getFirestore, doc, getDoc, collection, getDocs }
  from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

/* ── Settings (edit here) ─────────────────────────────────────────────── */
const SIGNIN = '/courts/online-services/portal/';
const PUBLIC = '/courts/';
const ORIGIN = 'https://migovt.org';
const BASE   = ORIGIN + '/courts/online-services/portal/dashboard/';

/* ── Roles: who sees which pages (edit the lists here) ───────────────── */
const SELF = ['Public User', 'Justice System User', 'Provisional Attorney', 'Licensed Attorney', 'Prosecuting Attorney', 'Legal Services User'];
const ENFORCE = ['Justice System User', 'Prosecuting Attorney', 'Legal Services User'];
const STAFF = ['Court Reporter', 'Law Clerk', 'Judicial Assistant',
               'Deputy Clerk', 'County Clerk', 'Court Administrator', 'Magistrate', 'Judge', 'Chief Judge',
               'Deputy Clerk of the Supreme Court', 'Clerk of the Supreme Court', 'Reporter of Decisions',
               'State Court Administrator', 'Justice', 'Chief Justice'];
const SUPREME = ['Deputy Clerk of the Supreme Court', 'Clerk of the Supreme Court', 'Reporter of Decisions',
                 'State Court Administrator', 'Justice', 'Chief Justice'];
const DISTRICT = ['Deputy Clerk', 'County Clerk', 'Court Administrator', 'Magistrate', 'Judge', 'Chief Judge'];
const JUDICIAL = ['Magistrate', 'Judge', 'Chief Judge', 'Justice', 'Chief Justice'];   // roles that get a "My docket"
const DISTRICT_COURT = 'Genesee Co. District Court', SUPREME_COURT = 'Michigan Supreme Court';

const ALL_ROLES = [...new Set([...SELF, ...ENFORCE, ...STAFF, ...SUPREME])];
const roleKey = x => String(x || '').toLowerCase().replace(/[^a-z]/g, '');
const has = (list, role) => list.some(r => roleKey(r) === roleKey(role));
// Matches the saved role to a known one (ignoring case and spacing). An unrecognized role falls back to Public User.
const roleOf = a => {
  const raw = String(a.role || '').trim();
  const hit = ALL_ROLES.find(r => roleKey(r) === roleKey(raw));
  if (!hit) console.warn('Portal: unrecognized role "' + raw + '", showing Public User pages.');
  return hit || 'Public User';
};

/* Public-site links in the sidebar. roles: 'all' or a list. */
const LINKS = [
  { label: 'Search cases',       href: '/courts/case-search/',                  roles: 'all' },
  { label: 'Manual court forms', href: '/courts/forms-and-filing/forms/',       roles: 'all' },
  { label: 'Filing information', href: '/courts/forms-and-filing/information/', roles: SELF }
];

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

/* ── Data ─────────────────────────────────────────────────────────────── */
async function loadAccount(uid) {
  const s = await getDoc(doc(db, 'accounts', uid));
  return s.exists() ? { uid, ...s.data() } : null;
}

function peopleOf(c) {
  const out = [];
  Object.values(c.parties || {}).forEach(v => Array.isArray(v) ? v.forEach(x => out.push(x)) : v && typeof v === 'object' && out.push(v));
  return out;
}
const nameKey = n => { const t = String(n || '').toLowerCase().replace(/^hon\.?\s+/, '').replace(/[.,]/g, '').trim().split(/\s+/); return t.length ? t[0] + ' ' + t[t.length - 1] : ''; };

// Which courts a staff role works in. Court Reporter, Law Clerk, and Judicial Assistant see both.
const scopeOf = role => has(DISTRICT, role) ? [DISTRICT_COURT] : has(SUPREME, role) ? [SUPREME_COURT] : [DISTRICT_COURT, SUPREME_COURT];

async function loadData(account, role) {
  const staff = has(STAFF, role), scope = scopeOf(role).map(norm), me = norm(account.name);
  const safeGet = col => getDocs(collection(db, col)).catch(() => ({ docs: [] }));
  const snaps = await Promise.all([safeGet('cases'), safeGet('mscCases')]);
  const docs = snaps.flatMap(x => x.docs);
  const cases = [], hearings = [], orders = [], filings = [], events = [];

  docs.forEach(d => {
    const c = d.data(), people = peopleOf(c);
    const p = c.parties || {};
    const a = p.appellant || p.primaryPetitioner || p.primaryPlaintiff;
    const b = p.appellee || p.respondent || p.primaryDefendant;
    const base = { id: c.caseId, fid: d.id, court: c.court, caption: a && b ? `${a.name} v. ${b.name}` : c.caseId };
    const judges = [c.judge, ...(c.judges || [])].filter(Boolean);
    let role_ = '';

    if (staff) {
      if (!scope.includes(norm(c.court))) return;                      // court-wide view for staff
    } else {
      const party = people.find(x => norm(x.name) === me);
      const counsel = x => [].concat(x.attorney || [], x.attorneys || [], x.counsel || []).map(a => norm(typeof a === 'string' ? a : (a && (a.name || '')) + ' ' + (a && (a.barNumber || ''))));
      const atty = me && people.some(x => counsel(x).some(t => t.includes(me)));
      const direct = (c.financialOrders || []).some(o => o.payorUid === account.uid);   // for example a contempt fine on someone who is not a party
      if (!party && !atty && !direct) return;                           // personal view: only cases linked to this person
      role_ = party ? party.role : atty ? 'Attorney' : 'Payor';
      if (party || direct) (c.financialOrders || []).forEach(o => {
        if (o.payorUid ? o.payorUid !== account.uid : !party || (norm(o.payor || o.owedBy) !== norm(party.name) && norm(o.payor || o.owedBy) !== norm(role_))) return;
        const paid = (o.payments || []).reduce((t, x) => t + Number(x.amount || 0), 0);
        orders.push({ ...base, type: o.type, balance: /paid/i.test(o.status) ? 0 : Math.max(0, Number(o.amount || 0) - paid) });
        (o.payments || []).forEach(x => events.push({ date: x.date, text: `Payment of $${x.amount} recorded in ${c.caseId}` }));
      });
    }

    cases.push({ ...base, type: c.caseType, status: c.status, role: role_, judges, mine: judges.some(j => nameKey(j) === nameKey(account.name)),
                 updated: c.dates?.closed || c.dates?.lastUpdated || c.dates?.filed });
    (c.hearings || []).forEach(h => {
      hearings.push({ ...base, type: h.type, date: h.date, where: [h.attendance === 'video' ? 'Videoconference' : (/^\d+$/.test(String(h.courtroom || '')) ? 'Courtroom ' + h.courtroom : h.courtroom), h.officer].filter(Boolean).join(' · ') });
      events.push({ date: h.date, text: `${h.type} in ${c.caseId}: ${h.result || 'scheduled'}` });
    });
    ((c.filings && c.filings.length) ? c.filings : (c.events || []).filter(e => e.type === 'filing' && !e.sealed).map(e => ({ title: e.description, filedBy: e.filedBy, dateFiled: e.date }))).forEach(f => {
      filings.push({ ...base, title: f.title, by: f.filedBy, date: f.dateFiled });
      events.push({ date: f.dateFiled, text: `${f.title} filed in ${c.caseId}` });
    });
  });

  const now = new Date(), newest = (x, y) => new Date(y.date) - new Date(x.date);
  const monthAgo = new Date(now - 30 * 864e5);
  cases.sort((x, y) => new Date(y.updated) - new Date(x.updated));
  filings.sort(newest);
  const active = cases.filter(c => !/closed/i.test(c.status));
  return {
    staff, cases, filings, orders, active,
    closed: cases.filter(c => /closed/i.test(c.status)),
    mine: active.filter(c => c.mine),
    upcoming: hearings.filter(h => new Date(h.date) >= now).sort((x, y) => new Date(x.date) - new Date(y.date)),
    recentFilings: filings.filter(f => new Date(f.date) >= monthAgo),
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

const canSee = (item, role) => item.roles === 'all' || has(item.roles, role);

function renderSidebar(account) {
  const role = roleOf(account);
  const here = location.pathname.replace(/index\.html$/, '').replace(/\/?$/, '/');
  const link = it => {
    const href = BASE + it.path, on = new URL(href).pathname === here;
    return `<a href="${href}" data-nav="${it.id}" class="${on ? 'active' : ''}" ${on ? 'aria-current="page"' : ''}>${svg(it.id)}${esc(it.label)}</a>`;
  };

  const groups = NAV.map(g => ({ title: g.title, items: g.items.filter(i => canSee(i, role)) })).filter(g => g.items.length);
  const nav = groups.map(g => `${g.title ? `<div class="sb-label">${esc(g.title)}</div>` : ''}${g.items.map(link).join('')}`).join('');

  console.info('Portal dashboard v4 | role:', role);
  $('sidebar-root').innerHTML = `
    <a class="sb-brand" href="${BASE}">
      <svg viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="25" fill="#fff"/><g stroke="#10264a" stroke-width="2" stroke-linecap="round" fill="none"><path d="M26 11v26M17 15h18M19 38h14"/><path d="M17 15l-6 12h12zM35 15l-6 12h12z" stroke-width="1.6" stroke-linejoin="round"/></g></svg>
      <span><b>Online Portal</b><small>Michigan Courts</small></span>
    </a>
    <nav class="sb-nav" aria-label="Portal">
      ${nav}
      <div class="sb-label">Quick links</div>
      ${LINKS.filter(l => canSee(l, role)).map(l => `<a href="${l.href}">${svg('link')}${esc(l.label)}</a>`).join('')}
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

/* ── Overview (what shows depends on the role) ───────────────────────── */
const pageLink = (id, role) => {
  for (const g of NAV) { const it = g.items.find(i => i.id === id && canSee(i, role)); if (it) return { label: it.label, href: BASE + it.path }; }
  return null;
};
const welcome = (account, role, sub, actions) => `
  <section class="welcome">
    <div><h3>Welcome back, ${esc(String(account.name || '').split(' ')[0] || 'there')}</h3><p>${esc(sub)}</p></div>
    <div class="quick">${actions.filter(Boolean).map(a => `<a href="${a.href}">${esc(a.label)}</a>`).join('')}</div>
  </section>`;
let STAFF_VIEW = false;
const stat = (label, val, alert, href) => href ? `<a class="stat ${alert ? 'alert-stat' : ''}" href="${href}"><span>${esc(label)}</span><b>${val}</b></a>` : `<div class="stat ${alert ? 'alert-stat' : ''}"><span>${esc(label)}</span><b>${val}</b></div>`;
const caseHref = (c, staff) => BASE + (staff ? 'cases/manage/' : 'cases/') + '#' + encodeURIComponent(c.fid || c.id);
const go = href => `data-href="${href}" tabindex="0" role="link"`;
const casesTable = (list, withRole) => list.length
  ? `<div class="table-scroll"><table><thead><tr><th>Case</th><th>Court</th>${withRole ? '<th>Your role</th>' : '<th>Type</th>'}<th>Status</th><th></th></tr></thead><tbody>
      ${list.slice(0, 8).map(c => `<tr class="clk" ${go(caseHref(c, STAFF_VIEW))}><td><b>${esc(c.caption)}</b><small>${esc(c.id)}${withRole ? ' · ' + esc(c.type) : ''}</small></td><td>${esc(c.court)}</td><td>${esc(withRole ? c.role : c.type)}</td><td>${statusPill(c.status)}</td><td class="r"><a href="${searchUrl(c)}">Public record</a></td></tr>`).join('')}
    </tbody></table></div>` : null;
const hearingRows = (list, withWhere) => `<ul class="rows">${list.slice(0, 6).map(h => `<li class="clk" ${go(withWhere ? BASE + 'docket/#' + encodeURIComponent(h.id) : BASE + 'hearings/')}><div><b>${esc(h.type)}</b><small>${esc(h.caption)} · ${esc(h.id)}${withWhere && h.where ? ' · ' + esc(h.where) : ''}</small></div><div class="r"><b>${fmtShort(h.date)}</b><small>${fmtTime(h.date)}</small></div></li>`).join('')}</ul>`;
const filingRows = list => `<ul class="rows">${list.slice(0, 6).map(f => `<li class="clk" ${go(caseHref(f, STAFF_VIEW))}><div><b>${esc(f.title)}</b><small>${esc(f.id)} · filed by ${esc(f.by)}</small></div><div class="r"><small>${fmtShort(f.date)}</small></div></li>`).join('')}</ul>`;
const card = (title, linkObj, body) => `<section class="card"><header><h3>${title}</h3>${linkObj ? `<a href="${linkObj.href}">${esc(linkObj.label)}</a>` : ''}</header>${body}</section>`;

// People who file and answer for their own cases: cases, hearings, fines, filings.
function selfOverview(account, role, d) {
  const owing = d.orders.filter(o => o.balance > 0);
  const fees = owing.length
    ? `<ul class="rows">${owing.slice(0, 4).map(o => `<li class="clk" ${go(BASE + 'financials/')}><div><b>${esc(o.type)}</b><small>${esc(o.id)}</small></div><div class="r"><b>${money(o.balance)}</b></div></li>`).join('')}</ul><a class="btn" href="${BASE}financials/">Pay fines and fees</a>`
    : empty('Nothing due', 'You have no unpaid fines or fees.');
  const actions = [
    d.balance > 0 && { label: 'Pay a fine', href: BASE + 'financials/' },
    { label: 'Manual court forms', href: '/courts/forms-and-filing/forms/' },
    { label: 'Search cases', href: '/courts/case-search/' }
  ];
  const sub = role + (account.barNumber ? ' · Bar No. ' + account.barNumber : '');
  return welcome(account, role, sub, actions) + `
    <div class="stats">${stat('Active cases', d.active.length, false, BASE + 'cases/')}${stat('Upcoming hearings', d.upcoming.length, false, BASE + 'hearings/')}${stat('Balance due', money(d.balance), d.balance > 0, BASE + 'financials/')}${stat('Filings on record', d.filings.length, false, BASE + 'file/')}</div>
    <div class="grid2">
      ${card('Upcoming hearings', pageLink('hearings', role), d.upcoming.length ? hearingRows(d.upcoming) : empty('No upcoming hearings', 'When a hearing is scheduled in one of your cases, it will appear here.'))}
      ${card('Fines &amp; fees', pageLink('financials', role), fees)}
    </div>
    ${card('My cases', pageLink('cases', role), casesTable(d.cases, true) || empty('No cases linked to your account', 'Cases appear here when you are listed as a party or attorney. Use the case search to look up any public case.'))}
    ${card('Recent filings', pageLink('filings', role), d.filings.length ? filingRows(d.filings) : empty('No filings yet', 'Documents filed in your cases will be listed here.'))}`;
}

// Court staff: court-wide workload, no personal fines or filings.
function staffOverview(account, role, d) {
  const courts = scopeOf(role), label = courts.length === 1 ? courts[0] : 'Michigan Courts';
  const judicial = has(JUDICIAL, role);
  const actions = ['docket', 'mcases', 'reports', 'opinions'].map(id => pageLink(id, role));
  const listing = judicial ? d.mine : d.active;
  return welcome(account, role, role + ' · ' + label, actions) + `
    <div class="stats">${stat('Active cases', d.active.length, false, BASE + 'cases/manage/')}${stat('Upcoming hearings', d.upcoming.length, false, BASE + 'docket/')}${stat('Filings, last 30 days', d.recentFilings.length, false, BASE + 'file/manage/')}${judicial ? stat('My docket', d.mine.length, false, BASE + 'cases/manage/') : stat('Closed cases', d.closed.length, false, BASE + 'cases/manage/')}</div>
    <div class="grid2">
      ${card('Upcoming hearings', pageLink('docket', role), d.upcoming.length ? hearingRows(d.upcoming, true) : empty('No upcoming hearings', 'Scheduled hearings in ' + label + ' will appear here.'))}
      ${card('Recent filings', pageLink('mfilings', role), d.filings.length ? filingRows(d.filings) : empty('No filings yet', 'Filings in ' + label + ' will appear here.'))}
    </div>
    ${card(judicial ? 'My docket' : 'Active cases', pageLink('mcases', role), casesTable(listing, false) || empty(judicial ? 'No cases assigned to you' : 'No active cases', judicial ? 'Active cases assigned to you will appear here.' : 'Open cases in ' + label + ' will appear here.'))}`;
}

function renderOverview(account, role, d) { STAFF_VIEW = !!d.staff; return d.staff ? staffOverview(account, role, d) : selfOverview(account, role, d); }

/* ── Start ────────────────────────────────────────────────────────────── */
async function logout() { try { await signOut(auth); } finally { location.replace(SIGNIN); } }
document.addEventListener('click', e => { if (e.target.closest('[data-signout]')) logout(); const el = e.target.closest('[data-href]'); if (el && !e.target.closest('a,button')) location.href = el.dataset.href; });
document.addEventListener('keydown', e => { if (e.key === 'Enter') { const el = e.target.closest?.('[data-href]'); if (el) location.href = el.dataset.href; } });

onAuthStateChanged(auth, async user => {
  if (!user) { location.replace(SIGNIN); return; }

  let account;
  try { account = await loadAccount(user.uid); } catch (e) { console.error(e); }
  if (!account) { await logout(); return; }

  const role = roleOf(account);
  document.head.insertAdjacentHTML('beforeend', `<style>${BADGE_CSS}.clk{cursor:pointer}.clk:hover{background:#f6f9fd}.clk:focus-visible{outline:2px solid #1f5fae;outline-offset:-2px}a.stat{display:block;text-decoration:none;color:inherit}a.stat:hover{border-color:#1f5fae;box-shadow:0 2px 8px rgba(16,38,74,.12)}.attn{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px}.attn a{display:flex;align-items:center;gap:10px;background:#fdf6e7;border:1px solid #ecd9a8;color:#6e4a10;border-radius:6px;padding:10px 14px;text-decoration:none;font-weight:600}.attn a b{background:#c0392b;color:#fff;border-radius:10px;min-width:22px;text-align:center;padding:1px 7px;font-size:13px}</style>`);
  renderSidebar(account);
  fillBadges(account, roleOf(account));
  $('topbar-date').textContent = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  $('auth-overlay').hidden = true;

  try {
    const data = await loadData(account, role);
    renderNotifications(user.uid, data.notices);
    $('page-subtitle').textContent = data.staff ? 'Court activity and your workload at a glance.' : 'Your cases, hearings, and balances at a glance.';
    $('page-body').innerHTML = renderOverview(account, role, data);
    badgeCounts(account, role).then(c => {   // what is waiting for this person to review, and only what is theirs to act on
      const items = [['mfilings', 'to review in Manage Filings'], ['menforce', 'to review in Enforcement administration'], ['enforce', 'update' + 's in Enforcement services']].filter(([k]) => c[k] > 0);
      if (!items.length) return; const html = `<div class="attn">${items.map(([k, t]) => { const p = pageLink(k, role); return p ? `<a href="${p.href}"><b>${c[k]}</b>${esc(k === 'enforce' ? c[k] === 1 ? 'update in Enforcement services' : 'updates in Enforcement services' : t)}</a>` : ''; }).join('')}</div>`;
      $('page-body').insertAdjacentHTML('afterbegin', html); }).catch(() => {});
  } catch (e) {
    console.error(e);
    $('page-body').innerHTML = '<div class="alert" role="alert"><strong>Something went wrong</strong><p>Your information could not be loaded. Refresh the page to try again.</p></div>';
  }
});