/* MC 09 (Dismissal), MC 09A (Order of Dismissal for Lack of Progress) and MC 26 (Notice of Intent to Dismiss for Lack of Progress).
   One module builds all three (make('09'|'09a'|'26')); each form has its own small wrapper file (mc09.js ...). Layout measured from the court's PDFs. */
import { plaintiffs, defendants, caption } from './caseinfo.js?v=3';

const css = ({ U, P, B }) => `
.page{width:816px;height:1056px;position:relative;overflow:hidden;background:#fff;margin:0 auto 16px;box-shadow:0 1px 6px rgba(0,0,0,.25);padding:${P(35)} ${P(49)} 0;font-family:Arial,Helvetica,sans-serif;color:#000;font-size:${P(9.7)};line-height:${P(13)}}
.page *{box-sizing:border-box}
.pc{width:${P(512)}}
.foot{position:absolute;left:0;right:0;top:${P(722)};text-align:center;font-weight:bold;font-size:${P(7.5)};line-height:${P(11)}}
.b{font-weight:bold}.r{text-align:right}.sm{font-size:${P(7.7)};font-weight:normal}
.hd{display:flex;width:${P(512)};height:${P(46)};margin-top:${P(3)};border-top:${B} solid #000;border-bottom:${B} solid #000}
.h1{width:${P(170)};padding:${P(7)} ${P(5)} 0 0;line-height:${P(11.3)}}
.h2{width:${P(170)};display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;font-weight:bold;line-height:${P(13)};padding:0 ${P(6)}}
.h3{flex:1;padding:${P(11)} 0 0 ${P(6.5)};line-height:${P(11.5)}}.jv{margin-left:${P(6)};font-weight:normal}
.hd>div+div{border-left:${B} solid #000}
.pt{display:flex;width:${P(512)};border-bottom:${B} solid #000;margin-top:${P(12)};height:${P(72)}}
.pt>.pa{flex:1;min-width:0;border-top:${B} solid #000;padding-left:${P(5)}}.pt>.pa.l{border-right:${B} solid #000}.pt>.pa.rr{border-left:${B} solid #000}
.pt>.pv{width:${P(31)};flex:none;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:${P(7.7)};border-top:${B} solid transparent}
.lb{font-size:${P(7.7)};line-height:${P(9)};padding-top:${P(5.5)}}
.vv{line-height:${P(12)};margin-top:${P(4)};white-space:pre-wrap;word-wrap:break-word;overflow:hidden}
.sec{margin-top:${P(14)}}
.oo{display:flex;align-items:flex-start;line-height:${P(13.6)}}.oo .tx{flex:1;min-width:0}
.cb{width:${P(10)};height:${P(10)};border:${B} solid #333;border-radius:2px;flex:none;text-align:center;font-size:${P(10)};line-height:${P(8)};margin:${P(1.8)} ${P(9)} 0 ${P(2)}}
.in1{margin-left:${P(18)}}
.u{display:inline-block;border-bottom:${B} solid #000;min-height:${P(12)};vertical-align:bottom;padding:0 ${P(3)};text-align:left;line-height:${P(12)}}
.gl{border-bottom:${B} solid #000;min-height:${P(25)};margin:${P(3)} 0 0 ${P(7)};padding-top:${P(9)};line-height:${P(15)};white-space:pre-wrap;word-wrap:break-word}
.sx{position:relative;display:flex;justify-content:center;align-items:center;height:${P(28)};margin-top:${P(11)}}.sx.g{margin-top:${P(14)}}
.sx .sl2{position:absolute;left:${P(5.6)};top:50%;transform:translateY(-35%);font-size:${P(7.7)};line-height:${P(9)}}
.sx .bx{border:${B} solid #222;box-shadow:1px 1px 0 #222;background:#f4f4f4;padding:${P(5)} ${P(21)};font-weight:bold;text-align:center;line-height:${P(12)};min-width:${P(86)}}
.np{margin:${P(3)} 0 0}.np>div{display:flex;margin-top:${P(2)}}.np>div>span:first-child{width:${P(18)};flex:none;padding-left:${P(5)}}.np>div>span:last-child{flex:1;min-width:0}
.tb{display:flex;width:${P(512)};border:${B} solid #000;height:${P(34)};margin-top:${P(10)}}.tb>div{padding:0 ${P(5)};min-width:0;overflow:hidden}.tb>div+div{border-left:${B} solid #000}
.ch{width:${P(512)};text-align:right;font-weight:bold;line-height:${P(12)};height:${P(12)};margin-top:${P(2)}}
.cu{display:inline-block;min-width:${P(85)};border-bottom:${B} solid #000;text-align:center;font-weight:normal;line-height:${P(11)}}
.sg{display:flex;align-items:flex-end}.sg>.sc{display:flex;flex-direction:column}
.sv{display:flex;align-items:flex-end;min-height:${P(16)};line-height:${P(14)};border-bottom:${B} solid #000;overflow:visible;white-space:nowrap}
.sv .in{flex:1;min-width:0;position:relative;z-index:1}
.sl{font-size:${P(7.7)};line-height:${P(9)};padding:${P(5)} 0 0 ${P(5)}}
.pos .tx{line-height:${P(17.6)}}.pos .tx.s{line-height:${P(13.6)}}.pos:not(.s) .cb{margin-top:${P(4.2)}}
.mt{display:flex;align-items:center;width:${P(512)};height:${P(28)};border-bottom:${B} solid #000;padding-left:${P(8)};margin-top:${P(2)}}.mt .b{margin-right:${P(4)};flex:none}.mt .vv{margin:0;padding:0;flex:1;min-width:0;line-height:${P(13)}}
.ind{margin-left:${P(18)}}.ind2{margin-left:${P(36)}}.fl{display:flex;align-items:flex-end;line-height:${P(13)}}.fl .u{margin-left:${P(3)}}
.dl{display:flex;margin-top:${P(2)}}.dl .sc{display:flex;flex-direction:column}
.tl{border-bottom:${B} solid #000;min-height:${P(14.4)};margin-top:${P(0.5)};padding-top:${P(1)};line-height:${P(13.5)};white-space:pre-wrap;word-wrap:break-word}.bk{min-height:${P(25)};margin-top:${P(2)};line-height:${P(15)};white-space:pre-wrap;word-wrap:break-word}
`;

const MID = { '09': 'DISMISSAL', '09a': 'ORDER OF DISMISSAL FOR<br>LACK OF PROGRESS', '26': 'NOTICE OF INTENT TO DISMISS<br>FOR LACK OF PROGRESS' };
const TITLE = { '09': 'Dismissal', '09a': 'Order of Dismissal for Lack of Progress', '26': 'Notice of Intent to Dismiss for Lack of Progress' };
const NUM = { '09': 'MC 09', '09a': 'MC 09A', '26': 'MC 26' };
const JUDGE = /judge|magistrate|justice/i, ISSUER = /clerk|judge|magistrate|justice|administrator/i;

/* ── the fields on the left ── */
const panelFor = k => {
  const inp = (id, l, ph = '', f = '') => `<label>${l}</label><input type="text" id="${id}"${ph ? ` placeholder="${ph}"` : ''}${f ? ` data-font="${f}"` : ''}>`;
  const row = (...c) => `<div class="row">${c.map(x => `<div>${x}</div>`).join('')}</div>`;
  const chk = (id, t) => `<div class="chk"><input type="checkbox" id="${id}"> ${t}</div>`;
  const area = (id, l, r = 1, ph = '') => `<label>${l}</label><textarea id="${id}" rows="${r}"${ph ? ` placeholder="${ph}"` : ''}></textarea>`;
  const sel = (id, l, opts) => `<label>${l}</label><select id="${id}"><option value="0">— leave unchecked —</option>${opts.map((o, i) => `<option value="${i + 1}">${o}</option>`).join('')}</select>`;
  const lines = (p, n, l) => Array.from({ length: n }, (_, i) => area(p + (i + 1), `${l}, line ${i + 1}`)).join('');
  const hdr = `<h2>Header</h2>${row(inp('judge', 'Judge'), inp('caseno', 'Case No.'))}<h2>Parties</h2>${inp('pln', 'Plaintiff/Petitioner’s name', 'e.g. Jane Roe')}${area('pla', 'Plaintiff/Petitioner’s address', 2, 'Street, city, state ZIP')}${inp('dfn', 'Defendant/Respondent’s name', 'e.g. John Doe')}${area('dfa', 'Defendant/Respondent’s address', 2, 'Street, city, state ZIP')}`;
  const sign = (d, s, n, who) => `${row(inp(d, 'Date', '', 'date'), inp(n, who + ' (type or print)', '', 'sig'))}${inp(s, 'Signature (typed)', '', 'sig')}`;
  if (k === '09a') return hdr + `<h2>Notice</h2>${inp('nid', 'Notice of intent to dismiss issued on (date)', '', 'date')}
    <h2>Order (judge or magistrate)</h2>${chk('a1', 'The action is dismissed without prejudice for lack of progress')}${chk('a2', 'The action is dismissed without prejudice as to the following party only')}${lines('pt', 3, 'Party')}${chk('a3', 'Other')}${lines('ot', 4, 'Other')}
    ${sign('od', 'ojs', 'ojn', 'Judge or magistrate')}`;
  if (k === '26') return hdr + `<h2>1. Reason for the notice</h2>${chk('n1a', 'a. General lack of progress (MCR 2.103(A))')}${chk('n1b', 'b. Service of process failure (MCR 2.301(A))')}${chk('n1bi', 'i. Failure to request issuance of a summons within 5 days after commencement')}${chk('n1bii', 'ii. Failure to effectuate service within 30 days after issuance of the summons')}${chk('n1biii', 'iii. Failure to effectuate service following expiration of an extended summons or issuance of a second summons')}
    ${chk('n1c', 'c. Failure to request entry of default (MCR 2.603(B))')}${chk('n1d', 'd. Failure to comply with court order')}${inp('dod', 'Date of order', '', 'date')}${lines('dr', 4, 'Required action')}${chk('n1e', 'e. Other statutory or court rule authority')}${inp('ecit', 'Applicable citation')}${lines('er', 4, 'Required action')}
    <h2>2. Period to remedy the deficiency</h2>${sel('per', 'Period (select one)', ['a. 72 hours', 'b. 5 days', 'c. 7 days', 'd. Other'])}${inp('pero', 'Other period (item d)')}${row(inp('dd', 'Deadline date', '', 'date'), inp('dt', 'Deadline time', '', 'date'))}
    <h2>3. Action to complete within the cure period</h2>${chk('n3a', 'a. Request issuance of a summons')}${chk('n3b', 'b. Effectuate service of process')}${chk('n3c', 'c. Move for an extension of an existing summons or issuance of a second summons')}${chk('n3d', 'd. File a request for entry of default')}${chk('n3e', 'e. Comply with the applicable court order')}${chk('n3f', 'f. Take sufficient action to advance the proceedings')}
    ${chk('n3g', 'g. Other')}${lines('g', 2, 'Other')}${chk('n3h', 'h. Additional instructions')}${lines('h', 3, 'Instructions')}${chk('n3i', 'i. This section is not in use')}
    <h2>Issuing officer</h2>${sign('idt', 'isg', 'ion', 'Issuing officer')}`;
  return hdr + `${inp('matter', 'In the matter of', 'e.g. Paul v. Doe')}<h2>1. Dismissal of</h2>${sel('rq', 'Dismissal of (select one)', ['The entire action', 'The following claim(s) or party(ies)'])}${area('rcl', 'Claim(s) or party(ies)', 2)}
    <h2>2. The request is made by</h2>${sel('by', 'Request made by (select one)', ['Dismissal by plaintiff', 'Stipulation to dismiss'])}<h2>3. The dismissal requested is</h2>${sel('pj', 'Dismissal (select one)', ['With prejudice', 'Without prejudice'])}
    <h2>Declaration (plaintiff or attorney)</h2>${row(inp('d1', 'Date', '', 'date'), inp('s1', 'Plaintiff/Attorney signature (typed)', '', 'sig'))}
    <h2>Stipulation (only if by stipulation)</h2>${row(inp('sd1', 'Plaintiff/Attorney date', '', 'date'), inp('sd2', 'Defendant/Attorney date', '', 'date'))}${row(inp('ss1', 'Plaintiff/Attorney signature (typed)', '', 'sig'), inp('ss2', 'Defendant/Attorney signature (typed)', '', 'sig'))}
    <h2>Order (judge or magistrate)</h2>${chk('o2', '2. The request for dismissal is GRANTED')}${chk('o2a', 'a. The entire action is dismissed')}${chk('o2b', 'b. Only the claims or parties identified in Item 1 are dismissed')}${chk('o2c', 'c. The dismissal is with prejudice')}${chk('o2d', 'd. The dismissal is without prejudice')}${chk('o2e', 'e. Costs and attorney fees')}${chk('o2e1', 'Each party shall bear its own costs and attorney fees')}${chk('o2e2', 'Costs are awarded as follows')}${lines('oc', 3, 'Costs')}${chk('o2f', 'f. Other')}${lines('of', 4, 'Other')}${chk('o3', '3. The request for dismissal is DENIED')}
    ${sign('od', 'ojs', 'ojn', 'Judge or magistrate')}`;
};

/* ── the document ── */
const hdr = (P, mid, j, c) => `<div class="hd"><div class="h1"><div class="b" style="padding-left:${P(33.5)}">STATE OF MICHIGAN</div>${globalThis.__mcSup ? '<div class="r">IN THE SUPREME COURT</div>' : '<div class="r">THE 7TH DISTRICT COURT FOR</div><div class="r">GENESEE COUNTY</div>'}</div><div class="h2">${mid}</div><div class="h3"><div><b>JUDGE</b><span class="jv">${j}</span></div><div><b>CASE NO.</b><span class="jv">${c}</span></div></div></div>`;
const cell = (l, v) => `<div class="lb">${l}</div><div class="vv">${v}</div>`;
const cbx = (on, key) => `<div class="cb"${key ? ` data-chk="${key}" title="Click to check or uncheck"` : ''}>${on ? '✓' : ''}</div>`;

function build(api, k) {
  const { $, P } = api, E = api.ed, seq = [], on = id => { const e = $(id); return !!(e && e.checked); }, sv = id => $(id)?.value;
  const caseHd = `<div class="ch">Case Number: <span class="cu">${E('caseno')}</span></div>`;
  const u = (id, w, o = {}) => `<span class="u" style="min-width:${P(w)}">${E(id, o)}</span>`;
  const chk = (id, inner, cls = '') => `<div class="oo ${cls}">${cbx(on(id), id)}<div class="tx">${inner}</div></div>`;
  const opt = (id, n, inner) => `<div class="oo" data-sel="${id}=${n}" title="Click to choose this option">${cbx(sv(id) === String(n))}<div class="tx">${inner}</div></div>`;
  const box = (note, title, g = '') => `<div class="sx ${g}"><div class="sl2">${note}</div><div class="bx">${title}</div></div>`;
  const ln = (id, ph = '') => `<div class="tl">${E(id, { multi: true, ph })}</div>`, bk = id => `<div class="bk">${E(id, { multi: true })}</div>`;
  const lines = (p, n) => Array.from({ length: n }, (_, i) => ln(p + (i + 1))).join(''), blanks = (p, n) => Array.from({ length: n }, (_, i) => bk(p + (i + 1))).join('');
  const parties = `<div class="pt"><div class="pa l">${cell('Plaintiff/Petitioner’s name and address', `<div>${E('pln')}</div><div>${E('pla', { multi: true })}</div>`)}</div><div class="pv">v</div><div class="pa rr">${cell('Defendant/Respondent’s name and address', `<div>${E('dfn')}</div><div>${E('dfa', { multi: true })}</div>`)}</div></div>`;
  /* signature block: officer line on the right, then date on the left and signature on the right */
  const signBlock = (d, s, n, who, top) => `<div class="sg" style="margin-top:${P(top)};align-items:flex-start"><div class="sc" style="margin-left:${P(342)};width:${P(220)}"><div class="sv"><div class="in">${E(n, { ph: who })}</div></div><div class="sl">${who} (type or print)</div></div></div>
    <div class="sg" style="margin-top:${P(40)};align-items:flex-start"><div class="sc" style="margin-left:${P(3)};width:${P(110)}"><div class="sv"><div class="in">${E(d)}</div></div><div class="sl">Date</div></div><div class="sc" style="margin-left:${P(229)};width:${P(220)}"><div class="sv"><div class="in">${E(s, { pre: '/s/ ' })}</div></div><div class="sl">Signature</div></div></div>`;
  seq.push({ html: hdr(P, MID[k], E('judge'), E('caseno')) + parties });

  if (k === '09a') {
    seq.push({ html: `<div style="margin-top:${P(14)}">1. The court previously issued and served a notice of intent to dismiss for lack of progress.</div>
      <div class="ind" style="margin-top:${P(4)}">Notice issued: ${u('nid', 84)}<div class="sl" style="padding-left:${P(46)}">Date</div></div>
      <div style="margin-top:${P(4)}">2. The applicable cure period has expired, and the deficiency identified in that notice has not been remedied.</div>` });
    seq.push({ html: `<div class="b" style="margin-top:${P(24)}">IT IS ORDERED:</div>
      ${chk('a1', '1. The above-captioned action is <b>DISMISSED WITHOUT PREJUDICE</b> for lack of progress.')}${chk('a2', '2. The action is <b>DISMISSED WITHOUT PREJUDICE</b> as to the following party only:')}<div class="ind">${blanks('pt', 3)}</div>
      <div style="margin-top:${P(12)}">${chk('a3', '3. Other:')}</div><div class="ind">${blanks('ot', 4)}</div>` });
    seq.push({ html: `<div class="b" style="margin-top:${P(34)}">IT IS SO ORDERED.</div>${signBlock('od', 'ojs', 'ojn', 'Judge or magistrate', 36)}` });
    return seq;
  }

  if (k === '26') {
    seq.push({ html: `<div style="margin-top:${P(14)}">1. The court issues this notice because of the following:</div>
      ${chk('n1a', '<b>a. GENERAL LACK OF PROGRESS.</b> The action has remained inactive or without sufficient progress for at least 30 days. See MCR 2.103(A).')}
      ${chk('n1b', '<b>b. SERVICE OF PROCESS FAILURE.</b> Pursuant to MCR 2.301(A), the following circumstance applies:')}
      <div class="ind">${chk('n1bi', 'i. Failure to request issuance of a summons within 5 days after commencement of the action.')}${chk('n1bii', 'ii. Failure to effectuate service within 30 days after issuance of the summons.')}${chk('n1biii', 'iii. Failure to effectuate service following expiration of an extended summons or issuance of a second summons, as applicable.')}</div>
      ${chk('n1c', '<b>c. FAILURE TO REQUEST ENTRY OF DEFAULT.</b> The party entitled to request entry of default has failed to file the required request within 14 days after the opposing party\'s time to plead or otherwise defend expired as provided under MCR 2.603(B).')}
      ${chk('n1d', '<b>d. FAILURE TO COMPLY WITH COURT ORDER.</b> The initiating party has failed to comply with the following court order:')}
      <div class="ind" style="margin-top:${P(6)}">Date of order: ${u('dod', 84)}</div><div class="ind" style="margin-top:${P(6)}">Required Action:</div><div class="ind">${lines('dr', 4)}</div>` });
    seq.push({ html: `<div style="margin-top:${P(14)}">${chk('n1e', '<b>e. OTHER.</b> The following statutory or court rule authority enables this notice:')}</div>
      <div class="ind" style="margin-top:${P(6)}">Applicable Citation: ${u('ecit', 140)}</div><div class="ind" style="margin-top:${P(6)}">Required Action:</div><div class="ind">${lines('er', 4)}</div>` });
    seq.push({ html: `<div style="margin-top:${P(18)}">2. The initiating party is afforded the following period to remedy the deficiency:</div>
      ${opt('per', 1, 'a. 72 hours')}${opt('per', 2, 'b. 5 days')}${opt('per', 3, 'c. 7 days')}
      <div class="oo" data-sel="per=4" title="Click to choose this option">${cbx(sv('per') === '4')}<div class="tx">d. Other: ${u('pero', 130)}</div></div>
      <div class="ind" style="margin-top:${P(10)}">e. This brings the deadline date to ${u('dd', 80)} at ${u('dt', 80)}.</div>
      <div class="sl" style="padding-left:${P(184)}">Date<span style="margin-left:${P(60)}">Time</span></div>` });
    seq.push({ pb: 'new', head: caseHd, html: `<div style="margin-top:${P(14)}">3. The initiating party must complete the following action within the applicable cure period:</div>
      ${chk('n3a', 'a. Request issuance of a summons.')}${chk('n3b', 'b. Effectuate service of process.')}${chk('n3c', 'c. Move for an extension of an existing summons or issuance of a second summons.')}${chk('n3d', 'd. File a request for entry of default.')}${chk('n3e', 'e. Comply with the applicable court order.')}${chk('n3f', 'f. Take sufficient action to advance the proceedings.')}
      ${chk('n3g', 'g. Other:')}<div class="ind">${blanks('g', 2)}</div>${chk('n3h', 'h. Additional instructions:')}<div class="ind">${blanks('h', 3)}</div>
      <div style="margin-top:${P(14)}">${chk('n3i', 'i. This section is not in use. The affected party shall reasonably determine the action required to prevent dismissal from the cause identified in item 1(a)–(e), as applicable.')}</div>` });
    seq.push({ html: box('', 'NOTICE', 'g') + `<div class="b" style="margin-top:${P(14)}">NOTICE IS HEREBY GIVEN THAT:</div>
      <div class="np"><div><span>1.</span><span>The above-captioned action is subject to dismissal for lack of progress due to the circumstances identified in this notice.</span></div><div><span>2.</span><span>The initiating party must take the action specified above within the applicable cure period.</span></div>
      <div><span>3.</span><span>Dismissal may be avoided if, within the applicable period, the initiating party:<div class="ind" style="margin-top:${P(2)}">a. Takes the action necessary to remedy the lack of progress;<br>b. Demonstrates good cause and obtains an extension or other appropriate relief from the court; or<br>c. Otherwise satisfies the court that dismissal is unwarranted, where permitted by the applicable rule.</div></span></div>
      <div><span>4.</span><span>Failure to remedy the deficiency or obtain appropriate relief within the applicable period may result in dismissal of the action without prejudice, as authorized by the applicable court rule or statute.</span></div></div>` });
    seq.push({ html: signBlock('idt', 'isg', 'ion', 'Issuing officer', 54) });
    return seq;
  }

  /* MC 09 */
  seq.push({ html: `<div class="mt"><span class="b">In the matter of:</span><div class="vv">${E('matter', { ph: 'e.g. Paul v. Doe' })}</div></div>` });
  seq.push({ html: `<div style="margin-top:${P(14)}">1. The undersigned requests dismissal of:</div><div class="ind">${opt('rq', 1, 'The entire action.')}${opt('rq', 2, 'The following claim(s) or party(ies):')}</div>${ln('rcl')}` });
  seq.push({ html: `<div style="margin-top:${P(14)}">2. The request is made by:</div><div class="ind">${opt('by', 1, 'Dismissal by plaintiff.')}${opt('by', 2, 'Stipulation to dismiss. <span class="sm">(All parties required to stipulate have signed below.)</span>')}</div>
    <div style="margin-top:${P(12)}">3. The dismissal requested is:</div><div class="ind">${opt('pj', 1, 'With prejudice.')}${opt('pj', 2, 'Without prejudice.')}</div>` });
  seq.push({ html: `<div style="margin-top:${P(24)}">I declare under penalty of perjury that the statements contained in this request are true and correct to the best of my knowledge, information, and belief.</div>
    <div class="tb" style="height:${P(63)};margin-top:${P(16)}"><div style="width:${P(88)}"><div class="lb">Date</div><div class="vv">${E('d1')}</div></div><div style="flex:1"><div class="lb">Plaintiff/Attorney signature</div><div class="vv">${E('s1', { pre: '/s/ ' })}</div></div></div>` });
  seq.push({ html: box('Complete only if dismissal is by stipulation.', 'STIPULATION', 'g') + `<div style="margin-top:${P(14)}">The undersigned stipulate to the dismissal requested above.</div>
    <div class="dl" style="margin-top:${P(36)}"><div class="sc" style="width:${P(103)}"><div class="sv"><div class="in">${E('sd1')}</div></div><div class="sl">Date</div></div><div class="sc" style="margin-left:${P(204)};width:${P(103)}"><div class="sv"><div class="in">${E('sd2')}</div></div><div class="sl">Date</div></div></div>
    <div class="dl" style="margin-top:${P(34)}"><div class="sc" style="width:${P(204)}"><div class="sv"><div class="in">${E('ss1', { pre: '/s/ ' })}</div></div><div class="sl">Plaintiff/Attorney signature</div></div><div class="sc" style="margin-left:${P(103)};width:${P(204)}"><div class="sv"><div class="in">${E('ss2', { pre: '/s/ ' })}</div></div><div class="sl">Defendant/Attorney signature</div></div></div>` });
  seq.push({ pb: 'new', head: caseHd, html: box('Order section to be completed by judge or magistrate.', 'ORDER') + `<div class="b" style="margin-top:${P(12)}">IT IS ORDERED:</div>
    <div style="margin-top:${P(4)}">${chk('o2', '2. The request for dismissal is <b>GRANTED</b>. Accordingly, the following apply:')}</div>
    <div class="ind">${chk('o2a', 'a. The entire action is dismissed.')}${chk('o2b', 'b. Only the claims or parties identified in Item 1 of the request are dismissed.')}${chk('o2c', 'c. The dismissal is with prejudice.')}${chk('o2d', 'd. The dismissal is without prejudice.')}${chk('o2e', 'e. Costs and attorney fees:')}
    <div class="ind">${chk('o2e1', 'Each party shall bear its own costs and attorney fees.')}${chk('o2e2', 'Costs are awarded as follows:')}${blanks('oc', 3)}</div>
    <div style="margin-top:${P(18)}">${chk('o2f', 'f. Other:')}</div>${blanks('of', 4)}</div>
    <div style="margin-top:${P(24)}">${chk('o3', '3. The request for dismissal is <b>DENIED</b>.')}</div>
    <div class="b" style="margin-top:${P(40)}">IT IS SO ORDERED.</div>${signBlock('od', 'ojs', 'ojn', 'Judge or magistrate', 36)}` });
  return seq;
}

const SECT = {
  '09a': { court: ['nid', 'a1', 'a2', 'pt1', 'pt2', 'pt3', 'a3', 'ot1', 'ot2', 'ot3', 'ot4', 'od', 'ojs', 'ojn'] },
  '26': { court: ['n1a', 'n1b', 'n1bi', 'n1bii', 'n1biii', 'n1c', 'n1d', 'n1e', 'dod', 'dr1', 'dr2', 'dr3', 'dr4', 'ecit', 'er1', 'er2', 'er3', 'er4', 'per', 'pero', 'dd', 'dt', 'n3a', 'n3b', 'n3c', 'n3d', 'n3e', 'n3f', 'n3g', 'g1', 'g2', 'n3h', 'h1', 'h2', 'h3', 'n3i', 'idt', 'isg', 'ion'] },
  '09': { court: ['o2', 'o2a', 'o2b', 'o2c', 'o2d', 'o2e', 'o2e1', 'o2e2', 'oc1', 'oc2', 'oc3', 'o2f', 'of1', 'of2', 'of3', 'of4', 'o3', 'od', 'ojs', 'ojn'] }
};
const caseSec = k => ({ name: 'Case', fields: [['judge', 'Judge'], ['caseno', 'Case No.'], ...(k === '09' ? [['matter', 'In the matter of']] : []), ['pln', 'Plaintiff/Petitioner name'], ['dfn', 'Defendant/Respondent name']], multi: [['pla', 'Plaintiff/Petitioner address'], ['dfa', 'Defendant/Respondent address']] });
const L = (p, n, l) => Array.from({ length: n }, (_, i) => [p + (i + 1), `${l}, line ${i + 1}`]);
const SECTIONS = {
  '09a': [caseSec('09a'), { name: 'Notice', fields: [['nid', 'Notice issued']] }, { name: 'Order', fields: [['a1', 'Dismissed without prejudice'], ['a2', 'Dismissed without prejudice as to the following party only'], ['a3', 'Other order'], ['od', 'Order date'], ['ojn', 'Judge or magistrate'], ['ojs', 'Signature']], multi: [...L('pt', 3, 'Party'), ...L('ot', 4, 'Other')] }],
  '26': [caseSec('26'), { name: 'Reason for notice', fields: [['n1a', 'General lack of progress'], ['n1b', 'Service of process failure'], ['n1bi', 'Failure to request a summons within 5 days'], ['n1bii', 'Failure to effectuate service within 30 days'], ['n1biii', 'Failure to effectuate service after extended or second summons'], ['n1c', 'Failure to request entry of default'], ['n1d', 'Failure to comply with court order'], ['dod', 'Date of order'], ['n1e', 'Other authority'], ['ecit', 'Applicable citation']], multi: [...L('dr', 4, 'Court order required action'), ...L('er', 4, 'Other required action')] },
    { name: 'Cure period', fields: [['per', 'Period (1 is 72 hours, 2 is 5 days, 3 is 7 days, 4 is other, 0 none)'], ['pero', 'Other period'], ['dd', 'Deadline date'], ['dt', 'Deadline time']] },
    { name: 'Required action', fields: [['n3a', 'Request issuance of a summons'], ['n3b', 'Effectuate service of process'], ['n3c', 'Move for an extension or a second summons'], ['n3d', 'File a request for entry of default'], ['n3e', 'Comply with the court order'], ['n3f', 'Take sufficient action to advance the proceedings'], ['n3g', 'Other action'], ['n3h', 'Additional instructions'], ['n3i', 'Section not in use']], multi: [...L('g', 2, 'Other action'), ...L('h', 3, 'Additional instructions')] },
    { name: 'Issuing officer', fields: [['ion', 'Issuing officer'], ['idt', 'Date'], ['isg', 'Signature']] }],
  '09': [caseSec('09'), { name: 'Request', fields: [['rq', 'Dismissal of (1 entire action, 2 the following claims or parties, 0 none)'], ['by', 'Request made by (1 plaintiff, 2 stipulation, 0 none)'], ['pj', 'Dismissal is (1 with prejudice, 2 without prejudice, 0 none)'], ['d1', 'Date'], ['s1', 'Plaintiff/Attorney signature']], multi: [['rcl', 'Claims or parties']] },
    { name: 'Stipulation', fields: [['sd1', 'Plaintiff/Attorney date'], ['ss1', 'Plaintiff/Attorney signature'], ['sd2', 'Defendant/Attorney date'], ['ss2', 'Defendant/Attorney signature']] },
    { name: 'Order', fields: [['o2', 'Request granted'], ['o2a', 'Entire action dismissed'], ['o2b', 'Only claims or parties in Item 1 dismissed'], ['o2c', 'With prejudice'], ['o2d', 'Without prejudice'], ['o2e', 'Costs and attorney fees'], ['o2e1', 'Each party bears its own costs'], ['o2e2', 'Costs awarded as follows'], ['o2f', 'Other order'], ['o3', 'Request denied'], ['od', 'Order date'], ['ojn', 'Judge or magistrate'], ['ojs', 'Signature']], multi: [...L('oc', 3, 'Costs'), ...L('of', 4, 'Other')] }]
};
const ROLES = {
  '09a': [{ id: 'judge', label: 'Judge or magistrate', for: JUDGE, fill: (api, w) => ({ ojn: w.name, ojs: w.name, od: w.today }) }],
  '26': [{ id: 'officer', label: 'Issuing officer', for: ISSUER, fill: (api, w) => ({ ion: w.name, isg: w.name, idt: w.today }) }],
  '09': [{ id: 'plaintiff', label: 'Plaintiff or plaintiff’s attorney', fill: (api, w) => ({ s1: w.name, d1: w.today, ss1: w.name, sd1: w.today }) },
    { id: 'defendant', label: 'Defendant or defendant’s attorney (stipulation)', fill: (api, w) => ({ ss2: w.name, sd2: w.today }) },
    { id: 'judge', label: 'Judge or magistrate', for: JUDGE, fill: (api, w) => ({ ojn: w.name, ojs: w.name, od: w.today }) }]
};
export const make = k => ({
  id: 'mc' + k, number: NUM[k], title: TITLE[k], footer: NUM[k],
  css, panel: panelFor(k), usable: U => 684 * U, build: api => build(api, k),
  fromCase: c => ({ pln: plaintiffs(c).join(', '), dfn: defendants(c).join(', '), ...(k === '09' ? { matter: caption(c) } : {}) }),
  contHeader: api => `<div class="ch">Case Number: <span class="cu">${api.ed('caseno')}</span></div>`,
  courtKeys: SECT[k].court,
  courtNote: k === '09' ? 'The order section is completed by the judge or magistrate.' : k === '09a' ? 'This order is completed by the judge or magistrate.' : 'This notice is completed by the court.',
  roles: ROLES[k],
  md: { title: TITLE[k], malias: { 'plaintiff/petitioner name and address': 'pl', 'defendant/respondent name and address': 'df' }, sections: SECTIONS[k] }
});