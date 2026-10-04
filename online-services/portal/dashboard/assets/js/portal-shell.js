/* Portal shell for sub-pages (file/, file/manage/, ...). Same roles + sidebar as dashboard.js.
   Usage: const { account, role } = await boot({ id: 'filings', title: '...', subtitle: '...' }); */
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import { getAuth, setPersistence, browserLocalPersistence, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";
import { getFirestore, doc, getDoc, runTransaction } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

const SIGNIN = '/courts/online-services/portal/', PUBLIC = '/courts/';
const BASE = 'https://migovt.org/courts/online-services/portal/dashboard/';

export const SELF = ['Public User', 'Justice System User', 'Provisional Attorney', 'Licensed Attorney', 'Prosecuting Attorney', 'Legal Services User'];
export const ATTY = ['Provisional Attorney', 'Licensed Attorney', 'Prosecuting Attorney'];
const ENFORCE = ['Justice System User', 'Prosecuting Attorney', 'Legal Services User'];
export const SUPREME = ['Deputy Clerk of the Supreme Court', 'Clerk of the Supreme Court', 'Reporter of Decisions', 'State Court Administrator', 'Justice', 'Chief Justice'];
export const DISTRICT = ['Deputy Clerk', 'County Clerk', 'Court Administrator', 'Magistrate', 'Judge', 'Chief Judge'];
export const STAFF = ['Court Reporter', 'Law Clerk', 'Judicial Assistant', ...DISTRICT, ...SUPREME];
export const DISTRICT_COURT = 'Genesee Co. District Court', SUPREME_COURT = 'Michigan Supreme Court';
const ALL = [...new Set([...SELF, ...ENFORCE, ...STAFF])];
const key = x => String(x || '').toLowerCase().replace(/[^a-z]/g, '');
export const has = (list, r) => list.some(x => key(x) === key(r));
export const roleOf = a => ALL.find(r => key(r) === key(a.role)) || 'Public User';
export const scopeOf = r => has(DISTRICT, r) ? [DISTRICT_COURT] : has(SUPREME, r) ? [SUPREME_COURT] : [DISTRICT_COURT, SUPREME_COURT];

export const $ = id => document.getElementById(id);
export const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const app = getApps().length ? getApp() : initializeApp({
  apiKey: "AIzaSyA8sUFIq81cs6uQvqduardpGJ4R2DxO8NQ", authDomain: "micourt-dada6.firebaseapp.com", projectId: "micourt-dada6",
  storageBucket: "micourt-dada6.firebasestorage.app", messagingSenderId: "1013564619997", appId: "1:1013564619997:web:8f259dab457915758f6f34" });
export const auth = getAuth(app), db = getFirestore(app);
await setPersistence(auth, browserLocalPersistence);

/* Case numbers: YY-#-CODE (district, one running sequence per year) or "MSC #" (Supreme Court). */
export const CASE_CODES = { 'Small Claims': 'SC', 'Civil Infraction': 'CI', 'General Civil': 'CV', 'Administrative Appeal': 'AA', 'General Appeal': 'GA', 'General Criminal': 'CR', 'Special Proceedings': 'SP',
  Expungement: 'SP', 'Special Proceeding': 'SP', Criminal: 'CR', Administrative: 'AA', Appellate: 'GA', Traffic: 'CI' };
export const colFor = court => court === SUPREME_COURT ? 'mscCases' : 'cases';   // Supreme Court cases live in their own collection
export async function reserveCaseNumber(court, caseType) {
  const sc = court === SUPREME_COURT, year = new Date().getFullYear(), ref = doc(db, 'caseNumberCounters', sc ? 'supreme' : 'district-' + year);
  const n = await runTransaction(db, async tx => { const s = await tx.get(ref); const v = (s.exists() ? s.data().value || 0 : 0) + 1; tx.set(ref, { value: v, ...(sc ? {} : { year }), updatedAt: new Date().toISOString() }); return v; });
  return sc ? `MSC ${n}` : `${String(year).slice(-2)}-${n}-${CASE_CODES[caseType] || 'CV'}`;
}

/* Filing numbers: [CASE-NUMBER]-F-[N]. The first filing of a new case is always F-1; later filings take the next number from the case's counter. */
export async function reserveFilingNumber(court, docId, caseNo) {
  const ref = doc(db, colFor(court), docId);
  const n = await runTransaction(db, async tx => {
    const s = await tx.get(ref); if (!s.exists()) throw new Error('Case not found');
    const d = s.data(), v = (d.filingCounter ?? new Set((d.events || []).map(e => e.confirmationNumber).filter(Boolean)).size) + 1;
    tx.update(ref, { filingCounter: v }); return v;
  });
  return `${caseNo}-F-${n}`;
}

const NAV = [
  [null, [['overview', 'Overview', '', 'all']]],
  ['Workspace', [['cases', 'My cases', 'cases/', SELF], ['hearings', 'My hearings', 'hearings/', SELF], ['drafting', 'Document Drafting', 'document-drafting/', [...SELF, ...STAFF]],
    ['filings', 'My filings', 'file/', SELF], ['financials', 'My financials', 'financials/', SELF], ['enforce', 'Enforcement services', 'enforcement-services/', ENFORCE]]],
  ['Court operations', [['docket', 'Docket', 'docket/', STAFF], ['mhearings', 'Manage Hearings', 'hearings/manage/', STAFF], ['mcases', 'Case Management', 'cases/manage/', STAFF],
    ['mfilings', 'Manage Filings', 'file/manage/', STAFF], ['mfinancials', 'Manage Financials', 'financials/manage/', STAFF], ['menforce', 'Enforcement administration', 'enforcement-services/manage/', STAFF], ['reports', 'Court Reports', 'reports/', STAFF]]],
  ['Supreme Court', [['opinions', 'Opinions', 'opinions/', SUPREME], ['administration', 'Administration', 'administration/', SUPREME]]]
];
const LINKS = [['Search cases', '/courts/case-search/', 'all'], ['Manual court forms', '/courts/forms-and-filing/forms/', 'all'], ['Filing information', '/courts/forms-and-filing/information/', SELF]];
const ICON = {
  overview: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z', cases: 'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
  hearings: 'M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM3 10h18M8 3v4M16 3v4', drafting: 'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5',
  filings: 'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5M9 13h6M9 17h6', financials: 'M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM2 10h20M6 15h4',
  enforce: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z', docket: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01', mhearings: 'M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM3 10h18M9 15l2 2 4-4',
  mcases: 'M5 7h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2zM9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18', mfilings: 'M8 3h8l4 4v10H8zM4 7v14h12',
  mfinancials: 'M3 7h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM3 7l2-3h12v3', menforce: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM9 12l2 2 4-4', reports: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  opinions: 'M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 19V5M9 8h6', administration: 'M4 21h16M5 21V10l7-5 7 5v11M9 21v-6h6v6', settings: 'M12 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1', link: 'M7 17L17 7M9 7h8v8'
};
const svg = k => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${ICON[k]}"/></svg>`;
const ok = (roles, r) => roles === 'all' || has(roles, r);

const CSS = `
.f{display:grid;gap:6px;align-content:start;margin-bottom:16px}.f>span{font-weight:600;font-size:14.5px;color:var(--navy)}
.f input,.f select,.f textarea,.in{font:inherit;min-height:44px;padding:10px 12px;border:1px solid #9fb0c8;border-radius:4px;background:#fff;width:100%;color:var(--text)}
.f textarea{min-height:84px;resize:vertical}.f input:focus,.f select:focus,.f textarea:focus,.in:focus{outline:3px solid #5b9be0;outline-offset:1px;border-color:var(--blue)}
.cols{display:grid;grid-template-columns:1fr 1fr;gap:16px;align-items:start}.cols .f{margin-bottom:0}.sub .cols{margin-bottom:2px}
.steps{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:20px}
.steps div{padding:11px 14px;background:#fff;border:1px solid var(--line);border-top:3px solid var(--line);border-radius:4px;font-size:14px;color:var(--muted)}
.steps .on{border-top-color:var(--navy);color:var(--navy);font-weight:600}.steps .done{border-top-color:#2f7d4f;color:#154d2e}
.opt{display:flex;gap:12px;align-items:flex-start;padding:14px 16px;border:1px solid var(--line);border-radius:4px;cursor:pointer;margin-bottom:10px;background:#fff}
.opt:hover{border-color:var(--blue)}.opt.on{border-color:var(--navy);background:#eef3f9;box-shadow:inset 4px 0 0 var(--navy)}.opt input{margin-top:5px}
.opt b{display:block}.nav{display:flex;justify-content:space-between;gap:12px;margin-top:4px}
.tabs{display:flex;gap:4px;border-bottom:1px solid var(--line);margin-bottom:18px;flex-wrap:wrap}
.tabs button{font:inherit;font-weight:600;background:none;border:0;border-bottom:3px solid transparent;padding:10px 16px;cursor:pointer;color:var(--muted)}
.tabs button.on{color:var(--navy);border-bottom-color:var(--navy)}.tabs i{font-style:normal;font-weight:500;color:var(--muted);margin-left:6px}
.sub{border:1px solid var(--line);border-radius:4px;padding:14px 16px;margin-bottom:12px;background:#f8fafd}
.sub>header{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;font-weight:600;color:var(--navy)}
.btn.sm{padding:6px 12px;font-size:13.5px}.btn.danger{background:#b3261e;border-color:#b3261e}.btn.good{background:#2f7d4f;border-color:#2f7d4f}.btn:disabled{opacity:.5;cursor:not-allowed}
.pill.warn{background:#fbefd6;color:#8a5a12}.pill.bad{background:#fbe3e0;color:#7a1b13}.pill.mid{background:#ece6f7;color:#4a2c85}
.drop{display:flex;flex-direction:column;align-items:center;gap:6px;text-align:center;padding:26px 18px;border:2px dashed #9fb0c8;border-radius:6px;background:#f8fafd;margin-bottom:16px;transition:background .15s,border-color .15s}
.drop.over{border-color:var(--blue);background:#e8f0fb}.drop p{margin:0;color:var(--muted);font-size:14.5px}.drop .big{font-weight:600;color:var(--navy)}
.vh{position:absolute;width:1px;height:1px;opacity:0;overflow:hidden}.vh:focus-visible+label{outline:3px solid #5b9be0;outline-offset:2px}
.fchip{display:flex;justify-content:space-between;align-items:center;gap:12px}
.f input[readonly],.f select:disabled{background:#eef2f7;color:#4a5568;cursor:not-allowed}
.cb{position:relative}.cbl{position:absolute;z-index:30;left:0;right:0;top:calc(100% + 4px);max-height:300px;overflow:auto;background:#fff;border:1px solid var(--navy);border-radius:4px;box-shadow:0 10px 24px rgba(16,38,74,.18)}
.cbg{padding:8px 12px 4px;font-size:12px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:var(--muted);background:#f4f7fb;position:sticky;top:0}
.cbo b{display:block}.cbo small{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.cbo{padding:10px 12px;cursor:pointer;border-top:1px solid #eef2f7}.cbo:hover,.cbo.hl{background:#e8f0fb}.cbn{padding:14px 12px;color:var(--muted)}
.acts{display:flex;gap:8px;flex-wrap:wrap;align-items:center}.mt{margin-top:14px}
@media(max-width:700px){.cols{grid-template-columns:1fr}.steps{grid-template-columns:1fr 1fr}}`;

export function boot({ id, title, subtitle }) {
  document.head.insertAdjacentHTML('beforeend', `<style>${CSS}</style>`);
  return new Promise(resolve => {
    const off = onAuthStateChanged(auth, async user => {
      off();
      if (!user) { location.replace(SIGNIN); return; }
      const s = await getDoc(doc(db, 'accounts', user.uid)).catch(() => null);
      if (!s?.exists()) { await signOut(auth).catch(() => {}); location.replace(SIGNIN); return; }
      const account = { uid: user.uid, ...s.data() }, role = roleOf(account), here = location.pathname.replace(/index\.html$/, '').replace(/\/?$/, '/');
      const link = (i, l, p) => { const href = BASE + p, on = new URL(href).pathname === here; return `<a href="${href}" class="${on ? 'active' : ''}" ${on ? 'aria-current="page"' : ''}>${svg(i)}${esc(l)}</a>`; };
      const nav = NAV.map(([t, items]) => { const v = items.filter(i => ok(i[3], role)); return v.length ? (t ? `<div class="sb-label">${esc(t)}</div>` : '') + v.map(i => link(i[0], i[1], i[2])).join('') : ''; }).join('');
      $('sidebar-root').innerHTML = `
        <a class="sb-brand" href="${BASE}"><svg viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="25" fill="#fff"/><g stroke="#10264a" stroke-width="2" stroke-linecap="round" fill="none"><path d="M26 11v26M17 15h18M19 38h14"/><path d="M17 15l-6 12h12zM35 15l-6 12h12z" stroke-width="1.6" stroke-linejoin="round"/></g></svg><span><b>Online Portal</b><small>Michigan Courts</small></span></a>
        <nav class="sb-nav" aria-label="Portal">${nav}<div class="sb-label">Quick links</div>
          ${LINKS.filter(l => ok(l[2], role)).map(l => `<a href="${l[1]}">${svg('link')}${esc(l[0])}</a>`).join('')}
          <div class="sb-bottom">${link('settings', 'Account Settings', 'settings/')}</div></nav>
        <div class="sb-foot"><div class="sb-user"><div class="avatar" aria-hidden="true">${esc(String(account.name || '?').split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase())}</div><div><b>${esc(account.name)}</b><small>${esc(role)}</small></div></div>
          <a class="sb-link" href="${PUBLIC}">Michigan Courts website</a><button class="sb-signout" type="button" id="so">Sign out</button></div>`;
      $('so').onclick = async () => { try { await signOut(auth); } finally { location.replace(SIGNIN); } };
      const sb = $('sidebar-root'), btn = $('menu-btn'), scrim = $('scrim');
      const set = o => { sb.classList.toggle('open', o); scrim.hidden = !o; btn.setAttribute('aria-expanded', o); };
      btn.onclick = () => set(!sb.classList.contains('open')); scrim.onclick = () => set(false);
      document.addEventListener('keydown', e => { if (e.key === 'Escape') set(false); });
      $('topbar-date').textContent = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
      $('topbar-title').textContent = $('page-title').textContent = title;
      $('page-subtitle').textContent = subtitle; document.title = title + ' | Online Portal';
      $('auth-overlay').hidden = true;
      resolve({ account, role, user });
    });
  });
}