/* Service of process: the summons for each defendant (MC 01A person, MC 01B business or organization, MC 01C government),
   its proof of service, and the acknowledgment. Pure helpers; no Firebase and no page code. */
export const KIND_FORM = { Person: 'mc01a', 'Business or organization': 'mc01b', Government: 'mc01c' };
export const FORM_NUM = { mc01a: 'MC 01A', mc01b: 'MC 01B', mc01c: 'MC 01C' };
export const formFor = kind => KIND_FORM[kind] || 'mc01a';
/* Which party kinds can be served with a summons, and which case types get one when the case is opened. */
export const SERVICE_TYPES = ['Small Claims', 'General Civil'];
export const needsSummons = caseType => SERVICE_TYPES.includes(caseType);
const CHECK = /^(cv1|cv2|shf|msp|ackc|nonc|[psu]chk)$/;
const US = d => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(d || '')); return m ? `${m[2]}/${m[3]}/${m[1]}` : String(d || ''); };
export const usDate = d => d instanceof Date ? `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}` : US(d);
export const usTime = t => { const m = /^(\d{1,2}):(\d{2})/.exec(String(t || '')); if (!m) return String(t || ''); const h = +m[1]; return `${h % 12 || 12}:${m[2]} ${h < 12 ? 'AM' : 'PM'}`; };

/* The starting values of a summons: the case, both sides, and the issue date. The clerk completes the rest. */
export function summonsValues({ caseno = '', judge = '', plaintiffs = [], plaintiffAddress = '', defendant = '', defendantAddress = '' }) {
  return { judge, caseno, pln: plaintiffs.join(', '), pla: plaintiffAddress, dfn: defendant, dfa: defendantAddress };   // the clerk's issue date, expiration and signature are added when the summons is issued
}
/* The clerk issues the summons: issue date, expiration (91 days later, MCR 2.102(D)), and the clerk's name. The signature itself is stamped by the form. */
export function issueValues(values, { name, date = new Date() }) {
  const x = new Date(date.getTime()); x.setDate(x.getDate() + 91);
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
  const b = formId !== 'mc01a', c = formId === 'mc01c', pub = !c;
  const block = (k, label, extra = []) => [{ id: k + 'chk', type: 'check', label }, ...extra, { id: k + 'd', type: 'date', label: 'Date', on: k + 'chk' }, { id: k + 't', type: 'time', label: 'Time', on: k + 'chk' }, { id: k + 'z', type: 'text', label: 'Timezone', ph: 'e.g. Eastern', on: k + 'chk' }];
  return [
    ...block('p', 'Personal service: by Discord direct message', b ? [{ id: 'pn', type: 'text', label: c ? 'Official served (name)' : 'Authorized person served (name)', on: 'pchk' }] : []),
    ...block('s', 'Substituted electronic service: posted in #general with a mention', b ? [{ id: 'sn', type: 'text', label: 'Person mentioned (name)', on: 'schk' }] : []),
    ...(pub ? block('u', 'Service by publication: posted in #general without a mention') : []),
    { id: 'ackc', type: 'check', label: 'An acknowledgment of service was returned within 24 hours' },
    { id: 'nonc', type: 'check', label: 'Non-service: I could not complete service (a certificate of non-service, MC 01D, must be filed)' },
    { id: 'fee', type: 'money', label: 'Service fee assessed' },
    { id: 'pname', type: 'text', label: 'Name and title (type or print)' },
    { id: 'psig', type: 'text', label: 'Signature (typed)' },
    ...(c ? [{ id: 'msp', type: 'check', label: 'Service was conducted by the Michigan State Police pursuant to MCR 2.302(D)(3)' }] : [])
  ];
}
/* The proof's outcome and the way service was made, read from the values. */
export function outcomeOf(v = {}) {
  if (v.nonc && !v.pchk && !v.schk && !v.uchk) return { result: 'Not served', method: '', date: '' };
  const m = v.pchk ? ['Discord direct message', v.pd] : v.schk ? ['Posted in #general with mention', v.sd] : v.uchk ? ['Publication in #general', v.ud] : ['', ''];
  return { result: m[0] ? 'Served' : 'Not served', method: m[0], date: m[1] || '' };
}
export const SR_STATUS = { sumreq: 'Summons requested', subreq: 'Subpoena requested', subissued: 'Subpoena issued', issued: 'Summons issued', requested: 'Service requested', assigned: 'Process server assigned', served: 'Served', notserved: 'Not served' };
