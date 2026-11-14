/* Service of process: the summons for each defendant (MC 01A person, MC 01B business or organization, MC 01C government),
   its proof of service, and the acknowledgment. Pure helpers; no Firebase and no page code. */
export const KIND_FORM = { Person: 'mc01a', 'Business or organization': 'mc01b', Government: 'mc01c' };
export const FORM_NUM = { mc01a: 'MC 01A', mc01b: 'MC 01B', mc01c: 'MC 01C' };
export const formFor = kind => KIND_FORM[kind] || 'mc01a';
/* Which party kinds can be served with a summons, and which case types get one when the case is opened. */
export const SERVICE_TYPES = ['Small Claims', 'General Civil'];
export const needsSummons = caseType => SERVICE_TYPES.includes(caseType);
const CHECK = /^(cv1|cv2|ackc|nonc|[psm]chk|tp|ts|tm|to|rd|rm|ra|rg|ro|oacc|orej|ofd|oalias|oalt|opub|odis|onfa|ooth)$/;
const US = d => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(d || '')); return m ? `${m[2]}/${m[3]}/${m[1]}` : String(d || ''); };
export const usDate = d => d instanceof Date ? `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}` : US(d);
export const usTime = t => { const m = /^(\d{1,2}):(\d{2})/.exec(String(t || '')); if (!m) return String(t || ''); const h = +m[1]; return `${h % 12 || 12}:${m[2]} ${h < 12 ? 'AM' : 'PM'}`; };

/* Rules (MCR 2.301, 2.302): a summons is served within 30 days of issuance; a second summons is valid 14 days; the response is due 7 days after service
   (10 days when served through MiBRIDGES, which is how a governmental defendant is served), and an acknowledgment within 72 hours extends it (7 to 10, 10 to 14). */
export const SUMMONS_DAYS = 30, SECOND_SUMMONS_DAYS = 14, ACK_HOURS = 72;
export const responseDays = (formId, mibridges = false) => formId === 'mc01c' || mibridges ? 10 : 7;
export const extendedDays = base => base === 7 ? 10 : 14;
export const addDays = (iso, n) => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || '')); if (!m) return ''; const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3] + n)); return d.toISOString().slice(0, 10); };
/* The starting values of a summons: the case, both sides, and what the rule says must appear on it. The clerk adds the issue date, expiration and signature. */
export function summonsValues({ caseno = '', judge = '', plaintiffs = [], plaintiffAddress = '', defendant = '', defendantAddress = '', kind = 'Person', representative = '' }) {
  const dfa = kind === 'Government' ? [defendantAddress, 'To be served upon: Michigan Attorney General, through MiBRIDGES'].filter(Boolean).join('\n')
    : kind === 'Business or organization' ? [defendantAddress, representative ? 'Authorized representative to be served: ' + representative : ''].filter(Boolean).join('\n') : defendantAddress;
  return { judge, caseno, pln: plaintiffs.join(', '), pla: plaintiffAddress, dfn: defendant, dfa };
}
/* The clerk issues the summons: issue date, expiration (30 days later, or 14 for a second summons; MCR 2.301(C), (A)(6)), and the clerk's name. The signature itself is stamped by the form. */
export function issueValues(values, { name, date = new Date(), days = SUMMONS_DAYS }) {
  const x = new Date(date.getTime()); x.setDate(x.getDate() + days);
  return { ...values, iss: usDate(date), exp: usDate(x), clk: name, clkn: name };
}
/* A form's saved text (.md) built from its values. Checkbox values are true/false; everything else is text. */
export function mdFromValues(def, values = {}, sigs = {}) {
  const out = [`---\nform: ${def.number}\ntitle: ${def.title}\n---\n\n# ${def.number}\n`];
  for (const s of def.md.sections) {
    const lines = [`## ${s.name}\n`];
    for (const [id, label] of s.fields || []) { const v = values[id]; lines.push(`- ${label}: ${CHECK.test(id) ? (v ? 'yes' : 'no') : v == null ? '' : String(v).replace(/\n/g, ' ')}`); }
    for (const [id, label] of s.multi || []) lines.push(`\n### ${label}\n\n\`\`\`text\n${values[id] || ''}\n\`\`\``);
    out.push(lines.join('\n') + '\n');
  }
  // signatures made by the court: { clk: { name, uid, at, png } } become the form's signature record (and the picture, when there is one)
  const cl = x => String(x || '').replace(/[|\r\n]+/g, ' ').trim(), ks = Object.keys(sigs).filter(k => sigs[k]?.name);
  if (ks.length) {
    out.push('## Signature record\n\n' + ks.map(k => `- ${k}: signed | ${cl(sigs[k].name)} | ${sigs[k].png ? 'image' : 'slash'} | ${cl(sigs[k].uid)} | ${cl(sigs[k].at)}`).join('\n') + '\n');
    const im = ks.filter(k => sigs[k].png);
    if (im.length) out.push('## Field styles\n\n' + im.map(k => `- ${k}: Signature image`).join('\n') + '\n', '## Signature images\n\n' + im.map(k => `- ${k}: ${sigs[k].png}`).join('\n') + '\n');
  }
  return out.join('\n');
}
/* What the process server fills in, per form. type: check | date | time | text | money. `on` shows a field only while that box is checked. */
export function proofSpec(formId) {
  const b = formId !== 'mc01a', c = formId === 'mc01c';
  const block = (k, label, extra = []) => [{ id: k + 'chk', type: 'check', label }, ...extra, { id: k + 'd', type: 'date', label: 'Date', on: k + 'chk' }, { id: k + 't', type: 'time', label: 'Time', on: k + 'chk' }, { id: k + 'z', type: 'text', label: 'Timezone', ph: 'e.g. Eastern', on: k + 'chk' }];
  return [
    ...(c ? block('m', 'Service through MiBRIDGES: upon the Michigan Attorney General') : [
      ...block('p', 'Personal service: by Discord direct message', b ? [{ id: 'pn', type: 'text', label: 'Authorized representative served (name)', on: 'pchk' }] : []),
      ...block('s', 'Substituted electronic service: posted in the county Discord server with a mention', b ? [{ id: 'sn', type: 'text', label: 'Authorized representative mentioned (name)', on: 'schk' }] : [])]),
    { id: 'ackc', type: 'check', label: 'An acknowledgment of service was returned within 72 hours' },
    { id: 'nonc', type: 'check', label: 'Non-service: I could not complete service (a certificate of non-service, MC 01D, must be filed)' },
    { id: 'fee', type: 'money', label: 'Service fee assessed' },
    { id: 'pname', type: 'text', label: 'Name and title (type or print)' },
    { id: 'psig', type: 'text', label: 'Signature (typed)' }
  ];
}
/* The proof's outcome and the way service was made, read from the values. */
export function outcomeOf(v = {}) {
  if (v.nonc && !v.pchk && !v.schk && !v.mchk) return { result: 'Not served', method: '', date: '' };
  const m = v.pchk ? ['Discord direct message', v.pd] : v.schk ? ['Posted in county Discord server with mention', v.sd] : v.mchk ? ['MiBRIDGES (Attorney General)', v.md] : ['', ''];
  return { result: m[0] ? 'Served' : 'Not served', method: m[0], date: m[1] || '' };
}
export const SR_STATUS = { sumreq: 'Summons requested', subreq: 'Subpoena requested', subissued: 'Subpoena issued', issued: 'Summons issued', requested: 'Service requested', assigned: 'Process server assigned', served: 'Served', notserved: 'Not served' };

/* Non-service: what the server tried and why it failed (the questions on the MC 01D). Government defendants have no authorized representative; others have no governmental official. */
export function nonServiceSpec(formId) {
  const c = formId === 'mc01c', b = formId === 'mc01b';
  return c ? { tried: [['tm', 'Service through MiBRIDGES upon the Michigan Attorney General'], ['to', 'Something else']], why: [['rg', 'The Michigan Attorney General could not be served through MiBRIDGES'], ['ro', 'Some other reason']] }
    : { tried: [['tp', 'Personal service (direct message)'], ['ts', 'Substituted electronic service (posted in the county Discord server with a mention)'], ['to', 'Something else']],
        why: [['rd', 'The defendant could not be located'], ['rm', 'Direct messages to the defendant were unavailable or disabled'], ...(b ? [['ra', 'The authorized representative could not be identified']] : []), ['ro', 'Some other reason']] };
}
/* Returns a message when a proof of service is not complete enough to file, otherwise ''. */
export function proofProblem(v = {}, formId = 'mc01a') {
  if (!(v.pchk || v.schk || v.mchk || v.nonc)) return 'Check how the summons was served, or check that service could not be completed.';
  if (v.nonc) {
    const n = nonServiceSpec(formId);
    if (!n.tried.some(([k]) => v[k])) return 'Check what you tried to serve the defendant.';
    if (v.to && !String(v.tot1 || '').trim()) return 'Describe the other way you tried to serve the defendant.';
    if (!n.why.some(([k]) => v[k])) return 'Check why service could not be completed.';
    if (v.ro && !String(v.rot1 || '').trim()) return 'Describe the other reason service could not be completed.';
  }
  return '';
}
/* The MC 01D (certificate of non-service) values, from the summons values and the process server's answers. */
export function certValues(sr, v, { name, date = new Date() }) {
  const out = { ...sr.values }, wrap = (t, n) => { const w = String(t || '').split(/\s+/).filter(Boolean), ls = []; let cur = ''; for (const x of w) { if ((cur + ' ' + x).trim().length > n && cur) { ls.push(cur); cur = x; } else cur = (cur + ' ' + x).trim(); } if (cur) ls.push(cur); return ls; };
  for (const k of ['tp', 'ts', 'tm', 'to', 'rd', 'rm', 'ra', 'rg', 'ro', 'tot1', 'tot2', 'rot1', 'rot2']) if (v[k] != null) out[k] = v[k];
  const ad = wrap(v.adtext, 95); ['ad1', 'ad2', 'ad3', 'ad4'].forEach((k, i) => { out[k] = ad[i] || ''; });
  if (ad.length > 4) out.ad4 = ad.slice(3).join(' ');
  out.cd = usDate(date); out.cn = v.pname || name; out.csig = v.pname || name;
  delete out.iss; delete out.exp; delete out.clk; delete out.clkn;
  return out;
}