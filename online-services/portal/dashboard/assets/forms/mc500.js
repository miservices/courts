/* MC 500: Request for Certified Court Records Copies (page 1 the request, page 2 the court's response).
   Built on the shared drafting engine so it looks and prints like every other court form.
   Records Requests fills it in automatically (mc500Fill); court staff can open and edit it like any other form. */
import a02 from './mc02.js';
import { esc } from './engine.js';

const css = args => a02.css(args) + (({ U, P, B }) => `
.hd .h1{padding-top:${P(6.5)}}
.rq{margin-top:${P(13)};line-height:${P(14)}}
.rq .sm{display:block;margin:${P(1)} 0 0 ${P(8)}}
.ln2{display:flex;align-items:flex-end;margin-top:${P(4)};line-height:${P(14)}}.ln2 .bl{border-bottom:${B} solid #000;min-height:${P(14)};padding:0 ${P(3)};white-space:pre-wrap}
.in1{margin-left:${P(14)}}
.lst{margin:${P(5)} 0 0 ${P(46)};line-height:${P(14)};white-space:pre-wrap}
.cbx{display:flex;align-items:flex-start;line-height:${P(14)};margin-top:${P(5)}}.cbx .tx{flex:1;min-width:0}
.cbx .cb{margin-top:${P(2.4)}}
.rcpt{width:${P(497.5)};text-align:right;font-weight:bold;margin-top:${P(2)};line-height:${P(14)}}
.rcpt .cu{display:inline-block;min-width:${P(110)};border-bottom:${B} solid #000;font-weight:normal;text-align:left;padding-left:${P(4)}}
.cr2{position:relative;display:flex;align-items:center;justify-content:center;width:${P(497.5)};margin-top:${P(16)};height:${P(26)}}
.cr2 .sb{border:${B} solid #000;padding:${P(6)} ${P(14)};font-weight:bold;line-height:${P(12)};text-align:center}
.cr2 .sm{position:absolute;left:0;top:50%;transform:translateY(-50%);font-size:${P(7.1)}}
.tb{width:${P(497.5)};margin-top:${P(9)};border-top:${B} solid #000;font-size:${P(9)}}
.tb .r2{display:flex;align-items:stretch;border-bottom:${B} solid #000;min-height:${P(32)}}
.tb .r2.h{min-height:${P(21)};font-size:${P(7)};font-weight:bold;align-items:center}
.tb .r2>div{padding:${P(8)} ${P(5)};line-height:${P(12)}}.tb .r2.h>div{padding:0 ${P(5)}}
.tb.t1 .r2>div:nth-child(1){flex:1;min-width:0}.tb.t1 .r2>div:nth-child(2){width:${P(66)};border-left:${B} solid #000}.tb.t1 .r2>div:nth-child(3){width:${P(49)};border-left:${B} solid #000;text-align:center}
.tb.t1 .r2.h>div{border-left:0}
.tb.t2 .r2>div:nth-child(1){flex:1;min-width:0}.tb.t2 .r2>div:nth-child(2){width:${P(47)};border-left:${B} solid #000;text-align:center}.tb.t2 .r2>div:nth-child(3){width:${P(58)};border-left:${B} solid #000}.tb.t2 .r2>div:nth-child(4){width:${P(52)};border-left:${B} solid #000}.tb.t2 .r2>div:nth-child(5){width:${P(85)};border-left:${B} solid #000;text-align:right}
.tb.t2 .r2.h>div{border-left:0}
.tot{width:${P(137)};margin-left:${P(360.5)};border:${B} solid #000;border-top:0;padding:${P(5)} ${P(5)};text-align:right;font-weight:bold;line-height:${P(12)}}
.sg{display:flex;margin-top:${P(56)}}.sg .sc{display:flex;flex-direction:column}
`)({ U: args.U, P: args.P, B: args.B });

const panel = `
 <h2>Request</h2>
 <label>Name of the person requesting</label><input type="text" id="rname">
 <div class="row"><div><label>Case No.</label><input type="text" id="caseno"></div><div><label>Judge</label><input type="text" id="judge"></div></div>
 <label>Court</label><input type="text" id="court" placeholder="e.g. Genesee Co. District Court">
 <label>In the matter of</label><input type="text" id="matter">
 <label>Documents requested (one per line, start each with "- ")</label><textarea id="docs" rows="3"></textarea>
 <label>Docket entries requested</label><textarea id="dockets" rows="2"></textarea>
 <label>Court opinions requested</label><textarea id="opinions" rows="2"></textarea>
 <label>Preferred delivery</label>
 <select id="deliv"><option value="1">a. Electronic</option><option value="2">b. Mail</option><option value="3">c. In-Person Pickup</option></select>
 <label>Date of request</label><input type="text" id="dated" data-font="date">

 <h2>Court response (court staff)</h2>
 <label>Receipt number</label><input type="text" id="receipt">
 <label>Determination</label>
 <select id="resp"><option value="0">— leave unchecked —</option><option value="1">a. The requested records are available and will be issued as certified copies.</option><option value="2">b. Certain requested records will be issued as certified copies.</option><option value="3">c. The request is denied</option></select>
 <label>Reason(s) for denial</label><textarea id="denial" rows="2"></textarea>
 <label>Record description</label><input type="text" id="rdesc">
 <div class="row"><div><label>Date of record</label><input type="text" id="rdate"></div><div><label>Pages</label><input type="text" id="rpages"></div></div>
 <div class="row"><div><label>Search fee</label><input type="text" id="fsearch"></div><div><label>Copy fee</label><input type="text" id="fcopy"></div></div>
 <label>Total</label><input type="text" id="ftotal">
 <div class="row"><div><label>Date issued</label><input type="text" id="issued" data-font="date"></div><div><label>Clerk signature (typed)</label><input type="text" id="clerk" data-font="sig"></div></div>
`;

const cb = on => `<div class="cb">${on ? '✓' : ''}</div>`;

function build(api) {
  const { $, P, B } = api, E = api.ed, seq = [], v = id => $(id).value.trim();
  const sup = /supreme/i.test(v('court')) || !!globalThis.__mcSup;
  const head = sup ? '<div class="r">IN THE SUPREME COURT</div>' : '<div class="r">THE 7TH DISTRICT COURT FOR</div><div class="r">GENESEE COUNTY</div>';
  const dl = v('deliv'), resp = v('resp');
  seq.push({ html: `<div class="hd"><div class="h1"><div class="b" style="padding-left:${P(33.5)}">STATE OF MICHIGAN</div>${head}</div><div class="h2">REQUEST FOR CERTIFIED<br>COURT RECORDS COPIES</div><div class="h3"><div><b>JUDGE</b><span class="jv">${E('judge')}</span></div><div><b>CASE NO.</b><span class="jv">${E('caseno')}</span></div></div></div>` });
  seq.push({ html: `<div class="rq">I, <span class="u" style="min-width:${P(183)}">${E('rname', { ph: 'Name' })}</span>, request certified copies of court record(s) as follows:<span class="sm">Print or type your name</span></div>` });
  seq.push({ html: `<div class="sec">1. I request records from the following case:</div>
    <div class="ln2 in1">a. Court:&nbsp;<div class="bl" style="width:${P(226)}">${E('court', { ph: 'Court' })}</div></div>
    <div class="ln2 in1">b. Case No.:&nbsp;<div class="bl" style="width:${P(118)}">${E('caseno', { ph: 'Case number' })}</div></div>
    <div class="ln2 in1">c. In the matter of:&nbsp;<div class="bl" style="width:${P(392)}">${E('matter', { ph: 'Case name' })}</div></div>` });
  const list = (l, id, n) => `<div class="cbx in1">${cb(!!v(id))}<div class="tx">${l}</div></div><div class="lst">${v(id) ? E(id, { multi: true }) : 'NONE'}</div>`;
  seq.push({ html: `<div class="sec" style="margin-top:${P(18)}">2. I request certified copies of the following records maintained by the court in the case identified in item 1:</div>${list('a. Documents:', 'docs')}${list('b. Docket entries:', 'dockets')}${list('c. Court opinions:', 'opinions')}` });
  const opt = (n, t) => `<div class="oo in1" data-sel="deliv=${n}" title="Click to choose this option">${cb(dl === String(n))}<div class="tx">${'abc'[n - 1]}. ${t}</div></div>`;
  seq.push({ html: `<div class="sec" style="margin-top:${P(18)}">3. My preferred delivery method is:</div>${opt(1, 'Electronic')}${opt(2, 'Mail')}${opt(3, 'In-Person Pickup')}` });
  seq.push({ html: `<div style="margin-top:${P(22)}">I certify that the information provided in this request is true and complete to the best of my knowledge. I understand that the issuance of certified copies may be subject to applicable fees.</div>
    <div style="margin-top:${P(28)}"><b>DATED:</b> <span class="u" style="min-width:${P(60)}">${E('dated', { ph: 'MM/DD/YYYY' })}</span></div>
    <div class="cbx" style="margin-top:${P(12)}">${cb(true)}<div class="tx">This request was submitted and administered through an automated electronic system.</div></div>` });

  /* page 2: the court's response */
  seq.push({ pb: 'new', html: `<div class="rcpt">Receipt Number: <span class="cu">${E('receipt', { ph: '' })}</span></div>
    <div class="cr2"><div class="sm">Section to be completed by court staff only.</div><div class="sb">COURT RESPONSE</div></div>` });
  const ro = (n, t, extra = '') => `<div class="oo in1" data-sel="resp=${n}" title="Click to choose this option">${cb(resp === String(n))}<div class="tx">${t}${extra}</div></div>`;
  seq.push({ html: `<div class="sec" style="margin-top:${P(14)}">1. The court has reviewed the request for certified copies identified above and makes the following determination:</div>
    <div style="margin-top:${P(4)}">${ro(1, 'a. The requested records are available and will be issued as certified copies.')}${ro(2, 'b. Certain requested records will be issued as certified copies.')}${ro(3, 'c. The request is denied for the following reason(s):')}</div>
    <div class="lst" style="min-height:${P(58)}">${E('denial', { multi: true })}</div>` });
  seq.push({ html: `<div class="sec" style="margin-top:${P(18)}">2. The following records have been approved for certification and issued pursuant to this request:</div>
    <div class="tb t1"><div class="r2 h"><div>Record description</div><div>Date of record</div><div>Pages</div></div>
    <div class="r2"><div>${E('rdesc')}</div><div>${E('rdate')}</div><div>${E('rpages')}</div></div></div>` });
  seq.push({ html: `<div class="cbx" style="margin-top:${P(40)}">${cb(true)}<div class="tx">3. The following fees have been assessed in connection with this request:</div></div>
    <div class="tb t2" style="margin-top:${P(22)}"><div class="r2 h"><div>Record name</div><div>Pages</div><div>Search fee</div><div>Copy fee</div><div>Total</div></div>
    <div class="r2"><div>${E('rdesc')}</div><div>${E('rpages')}</div><div>${E('fsearch')}</div><div>${E('fcopy')}</div><div>${E('ftotal')}</div></div></div>
    <div class="tot">TOTAL: ${E('ftotal')}</div>` });
  seq.push({ html: `<div style="margin-top:${P(28)}">4. This certification has been assigned the following receipt number: ${E('receipt', { ph: '' })}.</div>
    <div style="margin-top:${P(36)}">I certify that the records issued pursuant to this request are true and accurate copies of the records maintained by this court. Each certified record bears the certification of the clerk of the court and the official seal of the court.</div>
    <div class="sg"><div class="sc" style="width:${P(100)}"><div class="sv lf"><div class="in">${E('issued')}</div></div><div class="sl">Date issued</div></div>
    <div class="sc" style="margin-left:${P(182)};width:${P(213)}"><div class="sv lf"><div class="in">${E('clerk', { pre: '/s/ ' })}</div></div><div class="sl">Clerk of the court signature</div></div></div>` });
  return seq;
}

export default {
  id: 'mc500', number: 'MC 500', title: 'Request for Certified Court Records Copies', footer: 'MC 500',
  css, panel, build,
  contHeader: api => `<div class="ch">Case Number: <span class="cu">${api.ed('caseno')}</span></div>`,
  md: { title: 'Request for Certified Court Records Copies',
    sections: [
      { name: 'Request', fields: [['rname', 'Requested by'], ['caseno', 'Case No.'], ['judge', 'Judge'], ['court', 'Court'], ['matter', 'In the matter of'], ['deliv', 'Delivery (1 electronic, 2 mail, 3 in-person pickup)'], ['dated', 'Date of request']], multi: [['docs', 'Documents requested'], ['dockets', 'Docket entries requested'], ['opinions', 'Court opinions requested']] },
      { name: 'Court response', fields: [['receipt', 'Receipt number'], ['resp', 'Determination (1 available, 2 certain records, 3 denied, 0 none)'], ['rdesc', 'Record description'], ['rdate', 'Date of record'], ['rpages', 'Pages'], ['fsearch', 'Search fee'], ['fcopy', 'Copy fee'], ['ftotal', 'Total'], ['issued', 'Date issued'], ['clerk', 'Clerk signature']], multi: [['denial', 'Reason(s) for denial']] }
    ] }
};

const mdy = t => { const d = new Date(t); return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`; };
const money = n => '$' + Number(n || 0).toFixed(2);

/* The field values for a Records Request receipt (a recordReceipts document; older receipts work too). */
export function mc500Fill(r) {
  const line = '- ' + (r.description || '') + (r.recordDate ? ` (${r.recordDate})` : ''), kind = r.kind || 'record';
  return { rname: r.requesterName || '', caseno: r.caseId || '', judge: '', court: r.court || '', matter: r.matter || '',
    docs: kind === 'record' ? line : '', dockets: kind === 'docket' ? line : '', opinions: kind === 'opinion' ? line : '',
    deliv: '1', dated: mdy(r.issuedAt || Date.now()), receipt: r.receipt || '', resp: '1', denial: '',
    rdesc: r.description || '', rdate: r.recordDate || '', rpages: String(r.pages || ''), fsearch: money(r.searchFee), fcopy: money(r.copyFee), ftotal: money(r.total), issued: mdy(r.issuedAt || Date.now()), clerk: '' };
}