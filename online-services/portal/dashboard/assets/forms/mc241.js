/* MC 241: Order After Preliminary Examination.
   Completed by the court: the judge or magistrate, or court staff for them. */
import a200 from './mc200a.js?v=16';
import { defendants, hearingFill, chargeLine } from './caseinfo.js?v=3';

const css = args => a200.css(args) + (({ U, P, B }) => `
.u{text-align:left;padding-left:${P(4)}}
.h3 .jv{font-size:${P(8)};white-space:nowrap}
.pt .c5{flex:1;border-top:${B} solid #000;padding-left:${P(5)}}
.mt{width:${P(497.5)};border-bottom:${B} solid #000;padding:${P(9)} 0 ${P(9)} ${P(8)};line-height:${P(13)}}
.sb{width:max-content;min-width:${P(104)};margin:${P(16)} auto 0;border:${B} solid #333;padding:${P(5)} ${P(14)};text-align:center;font-weight:bold;line-height:${P(12)}}
.pp{line-height:${P(14)};margin-top:${P(14)}}.pp.t{margin-top:${P(12)}}
.ob2{display:flex;align-items:flex-start;min-height:${P(18.5)};line-height:${P(14)}}.ob2 .cb{margin-top:${P(2.5)};flex:none}.ob2 .tx{flex:1;min-width:0;white-space:pre-wrap;word-wrap:break-word}
.in1{margin-left:${P(24)}}.in2{margin-left:${P(46)}}
.fi{display:flex;align-items:flex-end;margin-top:${P(11)};line-height:${P(14)}}.fi .u{min-width:${P(120)}}
.note{font-size:${P(7.5)};font-weight:normal}
.ct{width:${P(497.5)};margin-top:${P(12)};font-size:${P(9.6)};font-weight:normal;line-height:${P(14)}}.ct .rr>div:nth-child(1){font-weight:bold}
.ct .rr{display:flex;align-items:center;border-bottom:${B} solid #000;min-height:${P(42)}}.ct .rr.h{font-weight:bold;font-size:${P(7.8)};min-height:${P(18)}}
.ct .rr>div:nth-child(1){width:${P(38)};padding-left:${P(6)}}.ct .rr>div:nth-child(2){width:${P(130)};padding-right:${P(6)}}.ct .rr>div:nth-child(3){width:${P(228)};padding-right:${P(6)}}.ct .rr>div:nth-child(4){flex:1}
.ct .oo{height:${P(18)}}
.gl{border-bottom:${B} solid #000;min-height:${P(16)};margin:${P(2)} 0 0 ${P(46)};padding-left:${P(3)};white-space:pre-wrap}
.nl{margin:${P(3)} 0 0 ${P(24)};line-height:${P(14)}}.nl>div{display:flex;margin-top:${P(3)}}.nl>div>b{width:${P(18)};flex:none;font-weight:normal}
`)({ U: args.U, P: args.P, B: args.B });

const MAXC = 12, NS = Array.from({ length: MAXC }, (_, i) => i + 1);
const sOpt = (...a) => a.map((t, i) => `<option value="${i}">${t}</option>`).join('');
const chk = (id, t) => `<div class="chk"><input type="checkbox" id="${id}"> ${t}</div>`;
const area = (id, l, r = 2) => `<label>${l}</label><textarea id="${id}" rows="${r}"></textarea>`;
const panel = `
 <h2>Case</h2>
 <div class="row"><div><label>Judge</label><input type="text" id="judge"></div><div><label>Case No.</label><input type="text" id="caseno"></div></div>
 <label>Defendant's name</label><input type="text" id="defn" placeholder="e.g. John Doe">

 <h2>Preliminary examination</h2>
 <div class="row"><div><label>1. Date</label><input type="text" id="pxd" placeholder="e.g. 11/05/2026"></div><div><label>2. Time</label><input type="text" id="pxt" placeholder="e.g. 9:00 AM"></div></div>
 <label>3. Presiding: Hon.</label><input type="text" id="pres">

 <h2>Advisements</h2>
 <label>4. The defendant</label>
 <select id="app"><option value="0">— leave unchecked —</option><option value="1">Appeared in person</option><option value="2">Appeared virtually</option><option value="3">Failed to appear</option></select>
 <label>5. Representation</label>
 <select id="rp"><option value="0">— leave unchecked —</option><option value="1">Defendant was represented by</option><option value="2">Defendant appeared pro se (self-represented)</option></select>
 <label>Represented by</label><input type="text" id="rby" placeholder="Attorney name">

 <h2>6. Charges considered</h2>
 <input type="hidden" id="cn">
 ${Array.from({ length: MAXC }, (_, i) => i + 1).map(n => `<div class="row r3 crow" data-n="${n}"><div><label>Count ${n} statute</label><input type="text" id="s${n}"></div><div><label>Offense</label><input type="text" id="o${n}"></div><div><label>Disposition</label><select id="d${n}"><option value="0">—</option><option value="1">PC Found</option><option value="2">No PC</option></select></div></div>`).join('')}
 <div class="row"><div><button class="btn outline" type="button" id="addc">+ Add count</button></div><div><button class="btn outline" type="button" id="remc">Remove last count</button></div></div>

 <h2>Findings</h2>
 <label>7. The prosecution</label>
 <select id="pf"><option value="0">— leave unchecked —</option><option value="1">Established probable cause as to all charged offenses</option><option value="2">Established probable cause as to some, but not all, charged offenses</option><option value="3">Failed to establish probable cause</option></select>
 <label>8. As to the offenses</label>
 <select id="of"><option value="0">— leave unchecked —</option><option value="1">a. Each offense charged was committed and probable cause exists</option><option value="2">b. Only some offenses were committed (list below)</option><option value="3">c. No offense charged was committed</option><option value="4">d. No probable cause that the defendant committed any charged offense</option></select>
 ${area('f8y', 'b. Probable cause exists only as to the following offense(s)')}
 ${area('f8n', 'b. The prosecution failed to establish the following offense(s)')}
 ${area('addl', '9. Additional findings', 3)}

 <h2>Order</h2>
 <label>1. The defendant is</label>
 <select id="bind"><option value="0">— leave unchecked —</option><option value="1">Bound over for trial on all charges</option><option value="2">Bound over for trial only on the following charges</option><option value="3">Not bound over for trial on any of the charges</option></select>
 ${area('bnt', 'Bound over only on')}
 ${chk('z2', '2. The following charge(s) are dismissed')}
 ${area('dis', 'Dismissed charges')}
 <select id="prej"><option value="0">— prejudice: leave unchecked —</option><option value="1">With prejudice</option><option value="2">Without prejudice</option></select>
 ${chk('z3', '3. The complaint and any information shall be amended')}
 ${area('amd', 'Amendments (excluding amendments to dismissed charges)')}
 ${chk('z4', '4. Bail')}
 <select id="bail"><option value="0">— leave unchecked —</option><option value="1">The previously ordered bail is continued</option><option value="2">Bail is modified by separate order</option><option value="3">Bail is denied by separate order</option><option value="4">Defendant is remanded into custody</option></select>
 ${chk('fo', 'Further orders are entered (item 6)')}
 ${area('fot', 'Item 6: further orders', 3)}
 <div class="row"><div><label>Date</label><input type="text" id="od" data-font="date"></div><div><label>Judge or Magistrate (type or print)</label><input type="text" id="jname" data-font="sig"></div></div>
 <label>Signature (typed)</label><input type="text" id="jsig" data-font="sig">
`;

const hdr = (P, mid, j, c) => `<div class="hd"><div class="h1"><div class="b" style="padding-left:${P(33.5)}">STATE OF MICHIGAN</div>${globalThis.__mcSup ? '<div class="r">IN THE SUPREME COURT</div>' : '<div class="r">THE 7TH DISTRICT COURT FOR</div><div class="r">GENESEE COUNTY</div>'}</div><div class="h2">${mid}</div><div class="h3"><div><b>JUDGE</b><span class="jv">${j}</span></div><div><b>CASE NO.</b><span class="jv">${c}</span></div></div></div>`;
const cb = (on, key) => `<div class="cb"${key ? ` data-chk="${key}" title="Click to check or uncheck"` : ''}>${on ? '✓' : ''}</div>`;

function build(api) {
  const { $, P, qa } = api, E = api.ed, seq = [], on = id => $(id).checked, sv = id => $(id).value;
  const caseHd = `<div class="ch">Case Number: <span class="u">${E('caseno')}</span></div>`;
  const matter = `<div class="mt"><b>In the matter of:</b> The People of the State of Michigan v. ${E('defn', { blank: '[Defendant Name]' })}</div>`;
  const sel = (id, n, t, cls = '') => `<div class="ob2 ${cls}" data-sel="${id}=${n}" title="Click to choose this">${cb(sv(id) == n)}<div class="tx">${t}</div></div>`;
  const u = (k, w) => `<span class="u" style="min-width:${P(w)}">${E(k)}</span>`;

  seq.push({ ch: caseHd });
  seq.push({ html: hdr(P, 'ORDER AFTER PRELIMINARY<br>EXAMINATION', E('judge'), E('caseno')) });
  seq.push({ html: `<div class="pt"><div class="c1">THE PEOPLE OF THE<br>STATE OF MICHIGAN</div><div class="c2">v</div><div class="c5"><div class="lb">Defendant’s full name</div><div class="vv">${E('defn')}</div></div></div>${matter}` });
  seq.push({ html: `<div class="sb">ARRAIGNMENT</div><div class="pp t">The preliminary examination was held pursuant to MCR 6.604 on:</div>
    <div class="fi">1. Date:&nbsp;${u('pxd', 120)}<span style="margin-left:${P(14)}">2. Time:&nbsp;</span>${u('pxt', 120)}</div><div class="fi">3. Presiding: Hon.&nbsp;${u('pres', 280)}</div>` });
  seq.push({ html: `<div class="sb">ADVISEMENTS</div><div class="pp t">4. The defendant:</div>
    ${sel('app', 1, 'Appeared in person.', 'in1')}${sel('app', 2, 'Appeared virtually.', 'in1')}${sel('app', 3, 'Failed to appear.', 'in1')}
    <div class="pp t">5. Representation:</div>
    <div class="ob2 in1" data-sel="rp=1" title="Click to choose this">${cb(sv('rp') == 1)}<div class="tx">Defendant was represented by:&nbsp;${u('rby', 260)}</div></div>
    ${sel('rp', 2, 'Defendant appeared <i>pro se</i> (self-represented).', 'in1')}` });

  /* charges */
  const cnt = Math.min(MAXC, Math.max(1, parseInt($('cn').value, 10) || 3));
  qa('.crow').forEach(r => { r.style.display = +r.dataset.n > cnt ? 'none' : ''; }); { const rb = $('remc'); if (rb) rb.disabled = cnt <= 1; const ab = $('addc'); if (ab) ab.disabled = cnt >= MAXC; }
  const row = n => `<div class="rr"><div>${n}</div><div>${E('s' + n)}</div><div>${E('o' + n)}</div><div>${sel('d' + n, 1, 'PC Found')}${sel('d' + n, 2, 'No PC')}</div></div>`;
  seq.push({ pb: 'new', head: caseHd, html: `<div class="sb" style="margin-top:${P(20)}">CHARGES</div><div class="pp t">6. The following charges were considered:</div>
    <div class="ct"><div class="rr h"><div>Count</div><div>Statute</div><div>Offense</div><div>Disposition</div></div>${NS.slice(0, cnt).map(row).join('')}</div>` });
  seq.push({ ch: caseHd });
  seq.push({ html: `<div class="sb" style="margin-top:${P(16)}">FINDINGS</div><div class="b" style="margin-top:${P(14)}">THE COURT FINDS:</div>
    <div class="pp t">7. The prosecution:</div>
    ${sel('pf', 1, 'Established probable cause as to all charged offenses.', 'in1')}${sel('pf', 2, 'Established probable cause as to some, but not all, charged offenses.', 'in1')}${sel('pf', 3, 'Failed to establish probable cause.', 'in1')}` });
  seq.push({ html: `<div class="pp t">8. As to the offenses identified in Item 5:</div>
    ${sel('of', 1, 'a. The prosecution established that each offense charged was committed and that probable cause exists to believe the defendant committed each offense.', 'in1')}
    ${sel('of', 2, 'b. The prosecution established that one or more, but not all, offenses charged were committed and that probable cause exists only as to the following offense(s):', 'in1')}
    <div class="gl" style="min-height:${P(26)}">${E('f8y', { multi: true, ph: 'Offense(s)' })}</div>` });
  seq.push({ html: `<div class="pp in2" style="margin-top:${P(8)}">The prosecution failed to establish that the following offense(s) were committed or that probable cause exists to believe the defendant committed them:</div>
    <div class="gl" style="min-height:${P(26)}">${E('f8n', { multi: true, ph: 'Offense(s)' })}</div>` });
  seq.push({ html: `${sel('of', 3, 'c. The prosecution failed to establish that any offense charged was committed.', 'in1')}
    ${sel('of', 4, 'd. The prosecution failed to establish that probable cause exists to believe the defendant committed any charged offense.', 'in1')}` });
  seq.push({ html: `<div class="pp t">9. Additional findings:</div><div class="gl" style="margin-left:0;min-height:${P(50)}">${E('addl', { multi: true, ph: 'Additional findings' })}</div>` });

  /* order */
  seq.push({ pb: 'new', head: caseHd, html: `<div class="or" style="margin-top:${P(20)};justify-content:center"><div class="ob">ORDER</div></div><div class="b" style="margin-top:${P(14)}">IT IS ORDERED:</div>
    <div class="pp t">1. The defendant is:</div>
    ${sel('bind', 1, 'Bound over for trial on all charges.', 'in1')}${sel('bind', 2, 'Bound over for trial only on the following charges:', 'in1')}
    <div class="gl" style="min-height:${P(26)}">${E('bnt', { multi: true, ph: 'Charges' })}</div>
    ${sel('bind', 3, 'Not bound over for trial on any of the charges.', 'in1')}` });
  seq.push({ ch: caseHd });
  seq.push({ html: `<div class="ob2" style="margin-top:${P(10)}">${cb(on('z2'), 'z2')}<div class="tx">2. The following charge(s) are dismissed:</div></div>
    <div class="gl" style="min-height:${P(26)}">${E('dis', { multi: true, ph: 'Charges' })}</div>
    ${sel('prej', 1, 'With prejudice.', 'in1')}${sel('prej', 2, 'Without prejudice.', 'in1')}
    <div class="ob2" style="margin-top:${P(10)}">${cb(on('z3'), 'z3')}<div class="tx">3. The complaint and any information shall be amended as follows: <span class="note">(excluding any amendments to dismissed charges.)</span></div></div>
    <div class="gl" style="min-height:${P(26)}">${E('amd', { multi: true, ph: 'Amendments' })}</div>
    <div class="ob2" style="margin-top:${P(10)}">${cb(on('z4'), 'z4')}<div class="tx">4. Bail:</div></div>
    ${sel('bail', 1, 'The previously ordered bail is continued.', 'in1')}${sel('bail', 2, 'Bail is modified by separate order.', 'in1')}${sel('bail', 3, 'Bail is denied by separate order.', 'in1')}${sel('bail', 4, 'Defendant is remanded into custody.', 'in1')}
    <div class="pp t">5. The prosecuting attorney shall file the Information within the time prescribed by court rule, provided the case remains a felony.</div>
    <div class="ob2" style="margin-top:${P(8)}">${cb(on('fo'), 'fo')}<div class="tx"><b>IT IS FURTHER ORDERED:</b> <span class="note">(If this box is not checked, no further orders are entered)</span></div></div>
    <div class="nl"><div><b>6.</b><span style="flex:1;white-space:pre-wrap;min-height:${P(26)}">${E('fot', { multi: true, ph: 'Further orders' })}</span></div></div>
    <div class="b" style="margin-top:${P(12)};line-height:${P(14)}">IT IS SO ORDERED.</div>` });
  seq.push({ html: `<div class="sr" style="margin-top:${P(30)}"><div class="sc" style="margin-left:${P(283)};width:${P(213)}"><div class="sv lf"><div class="in">${E('jname')}</div></div><div class="sl">Judge or Magistrate (type or print)</div></div></div>
   <div class="sr" style="margin-top:${P(24)}"><div class="sc" style="margin-left:${P(3)};width:${P(98)}"><div class="sv lf"><div class="in">${E('od')}</div></div><div class="sl">Date</div></div><div class="sc" style="margin-left:${P(182)};width:${P(213)}"><div class="sv lf"><div class="in">${E('jsig', { pre: '/s/ ' })}</div></div><div class="sl">Signature</div></div></div>` });
  return seq;
}

const F = ['judge', 'caseno', 'defn', 'pxd', 'pxt', 'pres', 'app', 'rp', 'rby', ...NS.flatMap(n => ['s' + n, 'o' + n, 'd' + n]), 'cn', 'pf', 'of', 'bind', 'z2', 'prej', 'z3', 'z4', 'bail', 'fo', 'od', 'jname', 'jsig'];
const L = { judge: 'Judge', caseno: 'Case No.', defn: 'Defendant name', pxd: 'Preliminary examination date', pxt: 'Preliminary examination time', pres: 'Presiding', app: 'Defendant (0 none, 1 in person, 2 virtually, 3 failed to appear)', rp: 'Representation (0 none, 1 represented, 2 pro se)', rby: 'Represented by',
  s1: 'Count 1 statute', o1: 'Count 1 offense', d1: 'Count 1 disposition (0 none, 1 PC found, 2 no PC)', s2: 'Count 2 statute', o2: 'Count 2 offense', d2: 'Count 2 disposition (0 none, 1 PC found, 2 no PC)', s3: 'Count 3 statute', o3: 'Count 3 offense', d3: 'Count 3 disposition (0 none, 1 PC found, 2 no PC)',
  pf: 'Prosecution (0 none, 1 all, 2 some, 3 failed)', of: 'Offenses (0 none, 1 a, 2 b, 3 c, 4 d)', bind: 'Bound over (0 none, 1 all, 2 only some, 3 none)', z2: 'Charges dismissed', prej: 'Prejudice (0 none, 1 with, 2 without)', z3: 'Complaint amended', z4: 'Bail ordered', bail: 'Bail (0 none, 1 continued, 2 modified, 3 denied, 4 remanded)', fo: 'Further orders entered', od: 'Order date', jname: 'Judge or magistrate name', jsig: 'Signature' };
NS.forEach(n => { L['s' + n] = `Count ${n} statute`; L['o' + n] = `Count ${n} offense`; L['d' + n] = `Count ${n} disposition (0 none, 1 PC found, 2 no PC)`; }); L.cn = 'Number of counts';
const $c = api => Math.min(MAXC, Math.max(1, parseInt(api.$('cn').value, 10) || 3));
const fields = ids => ids.map(id => [id, L[id]]);

export default {
  id: 'mc241', number: 'MC 241', title: 'Order After Preliminary Examination', footer: 'MC 241',
  css, panel, usable: U => 686 * U,
  autoCheck: { prej: 'z2', bail: 'z4' },
  init(api) {
    const bump = d => { const c = $c(api), n = Math.min(MAXC, Math.max(1, c + d)); if (n === c) return; if (d < 0) { ['s', 'o'].forEach(k => { api.$(k + c).value = ''; }); api.$('d' + c).value = '0'; } api.$('cn').value = String(n); api.$('cn').dispatchEvent(new Event('input', { bubbles: true })); api.render(); };
    api.$('addc').onclick = () => bump(1); api.$('remc').onclick = () => bump(-1);
  },
  fromCase: c => {
    const out = { defn: defendants(c).join(', ') }, h = hearingFill(c, /prelim/i);
    if (h) { out.pxd = h.date; out.pxt = h.time; }
    const l = (c.charges || []).slice(0, MAXC);
    if (l.length) out.cn = String(l.length);
    l.forEach((ch, i) => { out['s' + (i + 1)] = ch.statute || ''; out['o' + (i + 1)] = chargeLine(ch); });
    return out;
  },
  contHeader: api => `<div class="ch">Case Number: <span class="u">${api.ed('caseno')}</span></div>`,
  build,
  courtKeys: F.filter(id => !['judge', 'caseno'].includes(id)).concat(['f8y', 'f8n', 'addl', 'bnt', 'dis', 'amd', 'fot']), courtNote: 'This order is completed by the judge or magistrate, or by court staff for them.',
  roles: [
    { id: 'judge', label: 'Judge or magistrate', for: /judge|magistrate|justice/i, fill: (api, w) => ({ pres: w.name, jname: w.name, jsig: w.name, od: w.today }) },
    { id: 'chambers', label: 'Court staff completing the order for the judge', hint: 'fills the date only', for: /law clerk|judicial assistant|deputy clerk|county clerk|court administrator|court reporter/i, fill: (api, w) => ({ od: w.today }) }
  ],
  md: { title: 'Order After Preliminary Examination', sections: [
    { name: 'Parties and case', fields: fields(['judge', 'caseno', 'defn']) },
    { name: 'Preliminary examination', fields: fields(['pxd', 'pxt', 'pres', 'app', 'rp', 'rby']) },
    { name: 'Charges', fields: fields(['cn', ...NS.flatMap(n => ['s' + n, 'o' + n, 'd' + n])]) },
    { name: 'Findings', fields: fields(['pf', 'of']), multi: [['f8y', 'Probable cause only as to'], ['f8n', 'Failed to establish'], ['addl', 'Additional findings']] },
    { name: 'Order', fields: fields(['bind', 'z2', 'prej', 'z3', 'z4', 'bail', 'fo', 'od', 'jname', 'jsig']), multi: [['bnt', 'Bound over only on'], ['dis', 'Dismissed charges'], ['amd', 'Amendments'], ['fot', 'Further orders']] }
  ] }
};