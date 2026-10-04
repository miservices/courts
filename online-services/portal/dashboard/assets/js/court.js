/* Shared court rules for the Docket and Enforcement pages. Pure functions: no Firebase, no page code. */
export const JUDICIAL = ['Magistrate', 'Judge', 'Chief Judge', 'Justice', 'Chief Justice'], CHIEFS = ['Chief Judge', 'Chief Justice'];
export const CLERICAL = ['County Clerk', 'Deputy Clerk', 'Clerk of the Supreme Court', 'Deputy Clerk of the Supreme Court'];
const lc = s => String(s || '').toLowerCase().trim();
export const is = (list, r) => list.some(x => lc(x) === lc(r));
export const isChief = r => is(CHIEFS, r), isJudicial = r => is(JUDICIAL, r);
export const nameKey = n => { const t = String(n || '').toLowerCase().replace(/^hon\.?\s+/, '').replace(/[.,]/g, '').trim().split(/\s+/); return t.length ? t[0] + ' ' + t[t.length - 1] : ''; };
export const iso = d => (d || new Date()).toISOString();
export const fmtD = s => { const d = s instanceof Date ? s : /^\d{4}-\d{2}-\d{2}$/.test(String(s)) ? new Date(s + 'T12:00:00') : new Date(s); return isNaN(d) ? '—' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); };
export const fmtDT = s => { const d = new Date(s); return isNaN(d) ? '—' : d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }); };
export const uid = p => p + '-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase();

export function partiesOf(c) { if (Array.isArray(c.parties)) return c.parties.filter(x => x && x.name); const o = []; Object.values(c.parties || {}).forEach(v => Array.isArray(v) ? v.forEach(x => x && o.push(x)) : v && typeof v === 'object' && o.push(v)); return o.filter(x => x.name); }
const sideOf = r => /defendant|respondent|appellee/i.test(r || '') ? 1 : /plaintiff|petitioner|prosecut|appellant|applicant|complainant|claimant/i.test(r || '') ? 0 : null;
export function caption(c) {
  if (c.caseTitleOverride && String(c.caseTitleOverride).trim()) return c.caseTitleOverride;
  const l = partiesOf(c), t = String(c.caseType || '').toLowerCase(), a = l.find(x => sideOf(x.role) === 0), b = l.find(x => sideOf(x.role) === 1);
  if (t === 'criminal' || t === 'traffic') return a && b ? `${a.name} v. ${b.name}` : `State of Michigan v. ${b?.name || 'Unknown'}`;
  if (a && b) return `${a.name} v. ${b.name}`; if (a) return `Ex parte ${a.name}`; if (b) return `In re ${b.name}`; return c.administrativeSubtype || c.caseId || 'Case';
}
export const isDefendantSide = p => sideOf(p.role) === 1;

/* The judicial officer presiding over a case, as an account. */
export function presidingOf(c, accts) { return (accts || []).find(a => a.uid === c.judgeUid) || (accts || []).find(a => c.judge && nameKey(a.name) === nameKey(c.judge)) || null; }
/* Who may change a case from the court's side: the chief judge or chief justice (whole court), the presiding judge or magistrate, or the judge a presiding magistrate reports to. */
export function governs({ account, role, accts, scope }, c) {
  if (!isJudicial(role)) return false;
  if (isChief(role) && (!scope || scope.includes(c.court))) return true;
  if (c.judgeUid === account.uid || (c.judge && nameKey(c.judge) === nameKey(account.name))) return true;
  const p = presidingOf(c, accts); return !!p && is(['Magistrate'], p.role) && p.supervisorUid === account.uid;
}
/* The account whose review queue a case's supervision reports go to: the presiding officer. */
export const reviewerUidOf = (c, accts) => presidingOf(c, accts)?.uid || c.judgeUid || null;

export const nextEventNo = ev => (ev || []).reduce((m, e) => Math.max(m, e.eventNumber || 0), 0) + 1;
export const addEvent = (events, e) => [...(events || []), { eventNumber: nextEventNo(events), sealed: false, type: 'event', date: iso(), ...e }];
export const WARRANT_TYPES = ['Arrest Warrant', 'Bench Warrant', 'Search Warrant'];
export const SUPERVISION = ['Community Service', 'Probation', 'Pretrial Services'];
export const warrantActive = w => w.status === 'Issued';