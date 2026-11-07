/* What a form needs to know about a case record: the parties, the caption, the judge line, and who may link to it.
   Case records keep their parties in `parties` (name, role, attorneys), the case number in `caseId` and the judge in `judge`. */
export const norm = s => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();
export const sideOf = r => /defendant|respondent|appellee/i.test(r || '') ? 1 : /plaintiff|petitioner|prosecut|appellant|applicant|complainant|claimant/i.test(r || '') ? 0 : null;
export function plist(c) {
  if (Array.isArray(c.parties)) return c.parties.filter(x => x && x.name);
  const out = []; Object.values(c.parties || {}).forEach(v => Array.isArray(v) ? v.forEach(x => x && out.push(x)) : v && typeof v === 'object' && out.push(v));
  return out.filter(x => x.name);
}
export const counselOf = p => { const a = [...(p.attorneys || [])]; if (p.attorney?.name && !a.some(x => x.name === p.attorney.name)) a.unshift(p.attorney); return a.filter(x => x && x.name); };
export const defendants = c => plist(c).filter(p => sideOf(p.role) === 1).map(p => p.name);
export const plaintiffs = c => plist(c).filter(p => sideOf(p.role) === 0).map(p => p.name);
export const judgeName = c => c.judge || (Array.isArray(c.judges) ? c.judges.join(', ') : '') || '';
export function caption(c) {
  if (c.caseTitleOverride) return c.caseTitleOverride;
  const a = plaintiffs(c)[0], b = defendants(c)[0], t = String(c.caseType || '').toLowerCase();
  if (t === 'criminal' || t === 'traffic') return `${a || 'People of the State of Michigan'} v. ${b || 'Unknown'}`;
  return a && b ? `${a} v. ${b}` : a || b || '';
}
/* "Hon. Judge James Sullivan" -> "James Sullivan" */
export const cleanJudge = n => String(n || '').split(/,|;| and /)[0].trim().replace(/^(hon\.?|honorable|chief judge|chief justice|judge|magistrate|justice)\s+/i, '').trim();
export const barFmt = b => { const t = String(b || '').trim(); return !t ? '' : /^[A-Za-z]/.test(t) ? t.toUpperCase() : 'P' + t; };
/* The judge line is the full name and bar number: James Sullivan (P59594) */
export const judgeLine = (name, bar) => { const n = cleanJudge(name), b = barFmt(bar); return n ? (b ? `${n} (${b})` : n) : ''; };
/* May this person link the case? Court staff may link any case; everyone else needs to be a party, an attorney of record, or the filer. */
export function canLink(c, account, uid, staff) {
  if (staff) return true; const me = norm(account?.name), bar = String(account?.barNumber || '').trim();
  if ((c.relatedUserIds || []).includes(uid)) return true;
  return plist(c).some(p => norm(p.name) === me || counselOf(p).some(a => norm(a.name) === me || (bar && String(a.barNumber || '').trim() === bar)));
}

/* The scheduled hearing of a kind (e.g. /arraign/i) as form text: the next one that has no result yet, otherwise the latest. */
export function hearingFill(c, re) {
  const l = (c.hearings || []).filter(h => re.test(h.type || '') && h.date && !isNaN(new Date(h.date))).sort((a, b) => new Date(a.date) - new Date(b.date));
  if (!l.length) return null;
  const open = l.find(h => !String(h.result || '').trim() && h.result !== 'Cancelled'), h = open || l[l.length - 1], d = new Date(h.date);
  const p = n => String(n).padStart(2, '0'), hrs = d.getHours(), timed = !(hrs === 0 && d.getMinutes() === 0);
  return { date: `${p(d.getMonth() + 1)}/${p(d.getDate())}/${d.getFullYear()}`, time: timed ? `${hrs % 12 || 12}:${p(d.getMinutes())} ${hrs < 12 ? 'AM' : 'PM'}` : '' };
}
/* "FIRST-DEGREE MURDER (MCL 750.316)" */
export const chargeLine = ch => { const n = String(ch.chargeName || ch.title || '').trim().toUpperCase(), s = String(ch.statute || '').trim(); return s ? `${n} (${s})` : n; };

/* Case numbers: official form is YYYY-####-TYPE (2026-0108-CR). The default shown on forms can use a 2-digit year (26-0108-CR) or the full year, by the person's setting. */
export const fmtCaseNo = (no, yearMode = '2') => { const m = /^(\d{2}|\d{4})-(.+)$/.exec(String(no || '').trim()); if (!m) return String(no || ''); const y = m[1]; return (yearMode === '4' ? (y.length === 2 ? '20' + y : y) : y.slice(-2)) + '-' + m[2]; };
/* Alternate spellings of a case number so a search for 26-0108 finds 2026-0108-CR. */
export const caseAlias = id => { const m = /^(\d{2}|\d{4})-(\d+)(?:-([A-Za-z]+))?$/.exec(String(id || '')); if (!m) return ''; const yy = m[1].slice(-2), yyyy = m[1].length === 2 ? '20' + m[1] : m[1], n = m[2], t = m[3] ? '-' + m[3] : ''; return [`${yy}-${n}${t}`, `${yy}-${n}`, `${yyyy}-${n}${t}`, `${yyyy}-${n}`].join(' '); };