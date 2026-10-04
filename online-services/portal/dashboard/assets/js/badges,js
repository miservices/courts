/* Counts shown beside Manage Filings, Enforcement administration and Enforcement services in the sidebar.
   Each count is limited to what the signed-in person can act on, so a probation report for one judge's case does not alert every judge. */
import { getFirestore, collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";
import { getApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";

const D = 'Genesee Co. District Court', S = 'Michigan Supreme Court';
const CLERKS = ['County Clerk', 'Deputy Clerk', 'Clerk of the Supreme Court', 'Deputy Clerk of the Supreme Court'];
const JUDICIAL = ['Magistrate', 'Judge', 'Chief Judge', 'Justice', 'Chief Justice'], CHIEFS = ['Chief Judge', 'Chief Justice'], CHAMBERS = ['Law Clerk', 'Judicial Assistant'];
const ENFORCE = ['Justice System User', 'Prosecuting Attorney', 'Legal Services User'];
const lc = s => String(s || '').toLowerCase().trim(), is = (list, r) => list.some(x => lc(x) === lc(r));
const courtOf = r => is(['Deputy Clerk of the Supreme Court', 'Clerk of the Supreme Court', 'Reporter of Decisions', 'State Court Administrator', 'Justice', 'Chief Justice'], r) ? S : D;

export async function badgeCounts(account, role, db = getFirestore(getApp())) {
  const out = {}, court = courtOf(role), judicial = is(JUDICIAL, role), chief = is(CHIEFS, role), clerk = is(CLERKS, role);
  const rows = async (col, field, op, val) => { try { return (await getDocs(query(collection(db, col), where(field, op, val)))).docs.map(d => ({ ...d.data(), _id: d.id })); } catch (e) { return []; } };
  // The judge whose queue this person works from: themselves, or the judge a law clerk or judicial assistant is assigned to.
  const judgeUid = judicial ? account.uid : is(CHAMBERS, role) ? account.supervisorUid || null : null;
  let mine = new Set(judgeUid ? [judgeUid] : []);
  if (judicial && !is(['Magistrate'], role)) { const sup = await rows('accounts', 'supervisorUid', '==', account.uid); sup.filter(a => is(['Magistrate'], a.role)).forEach(a => mine.add(a._id)); }
  const reviewer = r => (r.reviewerUid && mine.has(r.reviewerUid)) || (chief && !r.reviewerUid);

  if (is(CLERKS, role) || judgeUid) {   // Manage Filings
    const jobs = [];
    if (clerk) { jobs.push(rows('pendingFilings', 'status', '==', 'Pending').then(l => l.filter(f => f.court === court && f.filingType === 'new').length)); jobs.push(rows('pendingFilings', 'feeWaiver.status', '==', 'Pending clerk review').then(l => l.filter(f => f.court === court).length)); }
    if (judgeUid) jobs.push(rows('pendingFilings', 'feeWaiver.status', '==', 'Referred to judge').then(l => l.filter(f => f.court === court && ((f.feeWaiver?.judgeUid && mine.has(f.feeWaiver.judgeUid)) || (chief && !f.feeWaiver?.judgeUid))).length));
    out.mfilings = (await Promise.all(jobs)).reduce((a, b) => a + b, 0);
  }
  if (judgeUid) {   // Enforcement administration: warrant requests any judge or magistrate may rule on, plus supervision reports for cases this judge presides over
    const [w, l] = await Promise.all([rows('warrants', 'status', '==', 'Requested'), rows('supervisionLogs', 'status', '==', 'Pending review')]);
    out.menforce = (judicial ? w.filter(x => x.court === court).length : 0) + l.filter(x => x.court === court && reviewer(x)).length;
  }
  if (is(ENFORCE, role)) {   // Enforcement services: warrant rulings and returned reports the person has not seen yet
    const [w, l] = await Promise.all([rows('warrants', 'requestedByUid', '==', account.uid), rows('supervisionLogs', 'uid', '==', account.uid)]);
    out.enforce = w.filter(x => x.decision && !x.seenByRequester).length + l.filter(x => x.status === 'Returned' && !x.seen).length;
  }
  return out;
}
export const badgeHtml = n => n > 0 ? `<span class="sb-badge" aria-label="${n} to review">${n > 99 ? '99+' : n}</span>` : '';
export async function fillBadges(account, role) {
  try { const c = await badgeCounts(account, role); Object.entries(c).forEach(([k, n]) => { const a = document.querySelector(`#sidebar-root a[data-nav="${k}"]`); if (a) { a.querySelector('.sb-badge')?.remove(); a.insertAdjacentHTML('beforeend', badgeHtml(n)); } }); } catch (e) { console.warn('Badges not loaded', e); }
}
export const BADGE_CSS = '.sb-nav a{position:relative}.sb-badge{margin-left:auto;background:#c0392b;color:#fff;border-radius:10px;min-width:20px;height:20px;padding:0 6px;font-size:12px;font-weight:700;line-height:20px;text-align:center;flex-shrink:0}';