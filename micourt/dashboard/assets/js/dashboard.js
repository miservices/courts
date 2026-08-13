// dashboard.js — universal boot script. Every page loads only this (plus the CSS).
// It handles auth, loads Firestore data once, injects the sidebar + notifications,
// then hands off to the page-specific module in ./pages/<PAGE_ID>.js.
import { auth, db } from './firebase-init.js';
import { onAuthStateChanged, setPersistence, browserLocalPersistence, signOut } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";
import { doc, getDoc, getDocs, collection, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";
import { PAGE_TITLES, getTier, isScRole, mountSidebar } from './sidebar.js';
import { mountNotifications } from './notifications.js';

const PAGE_ID = window.PAGE_ID || 'overview';
const el = id => document.getElementById(id);
const setMsg = m => { const n = el('auth-overlay-msg'); if (n) n.textContent = m; };

const STORE = {
  user: null, role: 'Portal User', tier: 'public',
  cases: [], pendingFilings: [],
  court: 'Genesee Co. District Court', isSc: false,
};

function pendingCountForCourt() {
  return (STORE.pendingFilings || []).filter(f => {
    const st = (f.status || '').toLowerCase();
    return f.court === STORE.court && !f.accepted && st !== 'accepted' && st !== 'rejected';
  }).length;
}

function refreshChrome() {
  mountSidebar({
    role: STORE.role, pageId: PAGE_ID, user: STORE.user, court: STORE.court,
    counts: { pendingFilings: pendingCountForCourt() },
  });
  mountNotifications('notif-root', STORE);
  const courtName = el('topbar-court-name');
  if (courtName) courtName.textContent = STORE.court;
}

function buildMount() {
  return {
    setHeader({ title, subtitle = '', action = '' } = {}) {
      if (title) { el('topbar-title').textContent = title; el('page-title').textContent = title; }
      el('page-subtitle').textContent = subtitle;
      el('page-action').innerHTML = action;
    },
    setBody(html) { el('page-body').innerHTML = html; },
  };
}

async function renderPage() {
  const mount = buildMount();
  mount.setHeader({ title: PAGE_TITLES[PAGE_ID] || 'MiCOURT' });
  try {
    const mod = await import(`./pages/${PAGE_ID}.js`);
    await mod.renderPage(STORE, mount, { db, refresh: renderPage });
  } catch (err) {
    console.error('Page render error:', err);
    mount.setBody(`<div class="empty-state"><div class="ei">⚠️</div><h4>Unable to Load Page</h4><p>Something went wrong rendering this page. Try refreshing.</p></div>`);
  }
}
window.MiCourtRenderPage = renderPage;

document.addEventListener('micourt:court-changed', e => {
  STORE.court = e.detail.court;
  STORE.isSc = e.detail.isSc;
  refreshChrome();
  renderPage();
});

window.signOutUser = async function () {
  try { await signOut(auth); } catch (e) {}
  window.location.href = '/courts/micourt/';
};

await setPersistence(auth, browserLocalPersistence);
const dateEl = el('topbar-date');
if (dateEl) dateEl.textContent = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const unsub = onAuthStateChanged(auth, async user => {
  unsub();
  if (!user) {
    setMsg('Session expired. Redirecting…');
    setTimeout(() => { window.location.href = '/courts/micourt/'; }, 1500);
    return;
  }
  setMsg('Loading your profile…');
  try {
    const snap = await getDoc(doc(db, 'accounts', user.uid));
    if (!snap.exists()) {
      setMsg('Account not found. Redirecting…');
      setTimeout(() => { window.location.href = '/courts/micourt/'; }, 1500);
      return;
    }
    const data = snap.data();
    STORE.user = {
      uid: user.uid,
      name: data.name || user.displayName || 'Unknown User',
      email: data.email || user.email || '—',
      pin: data.pin || data.mipassPin || '—',
      barNumber: data.barNumber || null,
    };
    STORE.role = data.role || 'Portal User';
    STORE.tier = getTier(STORE.role);
    STORE.isSc = isScRole(STORE.role);
    STORE.court = STORE.isSc ? 'Michigan Supreme Court' : 'Genesee Co. District Court';

    updateDoc(doc(db, 'accounts', user.uid), { lastLogin: serverTimestamp() }).catch(() => {});

    setMsg('Loading case records…');
    try {
      const casesSnap = await getDocs(collection(db, 'cases'));
      STORE.cases = [];
      casesSnap.forEach(d => STORE.cases.push({ ...d.data(), _id: d.id }));
    } catch (e) { console.warn('Could not load cases:', e); }

    try {
      const pfSnap = await getDocs(collection(db, 'pendingFilings'));
      STORE.pendingFilings = [];
      pfSnap.forEach(d => STORE.pendingFilings.push({ ...d.data(), _id: d.id }));
    } catch (e) { console.warn('Could not load pending filings:', e); }

    refreshChrome();

    const overlay = el('auth-overlay');
    if (overlay) overlay.classList.add('hidden');

    await renderPage();
  } catch (err) {
    console.error(err);
    setMsg('Error loading profile. Retrying…');
    setTimeout(() => { window.location.reload(); }, 3000);
  }
});

setTimeout(() => {
  const overlay = el('auth-overlay');
  if (overlay && !overlay.classList.contains('hidden')) window.location.reload();
}, 12000);