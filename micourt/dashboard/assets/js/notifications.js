// notifications.js — the bell in the topbar. Computes alerts from already-loaded
// case/filing data (no extra Firestore reads) and renders a dropdown panel.
import { fmtDate, getAllHearings, getUserCases, getDocketCases, getAllFinancials } from './data.js';
import { isStaffTier } from './sidebar.js';

export function computeNotifications(store) {
  const notifs = [];
  const now = new Date();
  const staff = isStaffTier(store.tier);

  if (staff) {
    const pending = (store.pendingFilings || []).filter(f => {
      const st = (f.status || '').toLowerCase();
      return f.court === store.court && !f.accepted && st !== 'accepted' && st !== 'rejected';
    });
    if (pending.length) {
      notifs.push({
        id: 'pending-filings', severity: pending.length > 5 ? 'high' : 'med', icon: '🗂️',
        title: `${pending.length} filing${pending.length !== 1 ? 's' : ''} awaiting review`,
        detail: 'New submissions are in the review queue.',
        href: '/courts/micourt/dashboard/filings/manage/',
      });
    }
    const docket = getDocketCases(store.cases, store.user, store.isSc);
    getAllHearings(docket).filter(h => {
      const diffDays = (new Date(h.date) - now) / 86400000;
      return diffDays >= 0 && diffDays <= 3;
    }).forEach(h => notifs.push({
      id: 'hearing-' + h._caseId + h.date, severity: 'med', icon: '📅',
      title: `${h.type || 'Hearing'} — ${h._caseId || ''}`, detail: `Scheduled ${fmtDate(h.date)}`,
      href: '/courts/micourt/dashboard/docket/',
    }));
  } else {
    const myCases = getUserCases(store.cases, store.user);
    getAllHearings(myCases).filter(h => {
      const diffDays = (new Date(h.date) - now) / 86400000;
      return diffDays >= 0 && diffDays <= 5;
    }).forEach(h => notifs.push({
      id: 'hearing-' + h._caseId + h.date, severity: 'med', icon: '📅',
      title: `Upcoming: ${h.type || 'Hearing'}`, detail: `${h._caseId || ''} · ${fmtDate(h.date)}`,
      href: '/courts/micourt/dashboard/hearings/',
    }));
    const balance = getAllFinancials(myCases).reduce((s, o) => {
      const paid = (o.payments || []).reduce((ss, p) => ss + (p.amount || 0), 0);
      return s + Math.max(0, (o.amount || 0) - paid);
    }, 0);
    if (balance > 0) notifs.push({
      id: 'balance-due', severity: 'high', icon: '💳',
      title: 'Outstanding balance', detail: 'You have an unpaid balance on file.',
      href: '/courts/micourt/dashboard/financials/',
    });
  }
  return notifs;
}

export function mountNotifications(containerId, store) {
  const root = document.getElementById(containerId);
  if (!root) return;
  const notifs = computeNotifications(store);
  root.innerHTML = `
    <button class="notif-bell" id="notif-bell" title="Notifications">🔔${notifs.length ? `<span class="notif-badge">${notifs.length > 9 ? '9+' : notifs.length}</span>` : ''}</button>
    <div class="notif-panel" id="notif-panel">
      <div class="notif-panel-hdr"><span>Notifications</span><span style="font-size:11px;color:var(--muted)">${notifs.length} new</span></div>
      ${notifs.length ? notifs.map(n => `
        <a class="notif-item" href="${n.href || '#'}">
          <div class="notif-icon severity-${n.severity}">${n.icon}</div>
          <div><div class="notif-title">${n.title}</div><div class="notif-detail">${n.detail}</div></div>
        </a>`).join('') : `<div class="notif-empty">You're all caught up.</div>`}
    </div>`;
  const bell = document.getElementById('notif-bell');
  const panel = document.getElementById('notif-panel');
  bell.addEventListener('click', e => { e.stopPropagation(); panel.classList.toggle('open'); });
  document.addEventListener('click', e => { if (!root.contains(e.target)) panel.classList.remove('open'); });
}