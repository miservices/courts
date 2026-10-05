/* MC 02: Appearance (attorney enters an appearance as counsel of record). One page.
   Layout measured from the court's PDF. Everything the shared engine needs is in the default export at the bottom. */

const css = ({ U, P, B }) => `
.page{width:816px;height:1056px;position:relative;overflow:hidden;background:#fff;margin:0 auto 16px;box-shadow:0 1px 6px rgba(0,0,0,.25);padding:${P(35)} ${P(49)} 0;font-family:Arial,Helvetica,sans-serif;color:#000;font-size:${P(9.75)};line-height:${P(13)}}
.page *{box-sizing:border-box}
.pc{width:${P(497.5)}}
.foot{position:absolute;left:0;right:0;top:${P(723.5)};text-align:center;font-weight:bold;font-size:${P(7.5)};line-height:${P(11)}}
.b{font-weight:bold}.r{text-align:right}.c{text-align:center}.sm{font-size:${P(7.7)};font-weight:normal}
.hd{display:flex;width:${P(497.5)};height:${P(44.5)};margin-top:${P(2)};border-top:${B} solid #000;border-bottom:${B} solid #000}
.h1{width:${P(165)};border-right:${B} solid #000;padding:${P(6.5)} ${P(5)} 0 0;line-height:${P(11.3)}}
.h2{width:${P(165)};border-right:${B} solid #000;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;font-weight:bold;line-height:${P(13)}}
.h3{flex:1;padding:${P(10.5)} 0 0 ${P(6.5)};line-height:${P(11.5)}}
.jv{margin-left:${P(6)};font-weight:normal}
.pt{display:flex;width:${P(497.5)};border-bottom:${B} solid #000;margin-top:${P(16)};min-height:${P(72)}}
.pt>.pa{flex:1;min-width:0;border-top:${B} solid #000;padding-left:${P(5)}}
.pt>.pv{width:${P(29.5)};flex:none;border-left:${B} solid #000;border-right:${B} solid #000;display:flex;align-items:center;justify-content:center;font-weight:bold}
.lb{font-size:${P(7.7)};line-height:${P(9)};padding-top:${P(5.5)}}
.vv{line-height:${P(12)};margin-top:${P(4.5)};padding-bottom:${P(5)};white-space:pre-wrap;word-wrap:break-word}
.mt{display:flex;align-items:center;width:${P(497.5)};height:${P(28)};border-bottom:${B} solid #000;padding-left:${P(8)}}
.mt .b{margin-right:${P(4)};flex:none}.mt .vv{margin:0;padding:0;flex:1;min-width:0;line-height:${P(13)}}
.sec{margin-top:${P(13)};line-height:${P(13)}}
.oo{display:flex;align-items:flex-start;min-height:${P(14.4)};line-height:${P(14.4)}}
.oo .tx{flex:1;min-width:0}
.cb{width:${P(10)};height:${P(10)};border:${B} solid #333;border-radius:2px;flex:none;text-align:center;font-size:${P(10)};line-height:${P(8)};margin:${P(2.2)} ${P(8)} 0 ${P(2)}}
.ln{display:flex;align-items:flex-end}.ln .bl{flex:1;min-width:0;border-bottom:${B} solid #000;min-height:${P(13)};padding-left:${P(3)}}
.u{display:inline-block;border-bottom:${B} solid #000;min-height:${P(12)};vertical-align:bottom;padding:0 ${P(3)}}
.fl{display:flex;align-items:flex-end;line-height:${P(13)}}
.fl .bl{border-bottom:${B} solid #000;min-height:${P(13)};padding:0 ${P(3)}}
.sr{display:flex;align-items:stretch}
.sc{flex:none;display:flex;flex-direction:column}
.sv{flex:1 1 auto;display:flex;align-items:flex-end;min-height:${P(14)};line-height:${P(14)};border-bottom:${B} solid #000;text-align:center;overflow:hidden;white-space:nowrap}
.sv .in{flex:1;min-width:0}
.lf{text-align:left;padding-left:${P(5)}}
.sl{font-size:${P(7.7)};line-height:${P(9)};padding:${P(5.5)} 0 0 ${P(5)}}
.ad{display:flex;margin-top:${P(60)}}
.ch{width:${P(497.5)};text-align:right;font-weight:bold;line-height:${P(12)};height:${P(12)}}
.cu{display:inline-block;min-width:${P(85)};border-bottom:${B} solid #000;text-align:center;font-weight:normal;line-height:${P(11)}}
`;

const panel = `
 <h2>Header</h2>
 <div class="row"><div><label>Judge</label><input type="text" id="judge"></div><div><label>Case No.</label><input type="text" id="caseno"></div></div>

 <h2>Parties</h2>
 <label>Plaintiff/Petitioner's name</label><input type="text" id="pln" placeholder="e.g. Jane Roe">
 <label>Plaintiff/Petitioner's address</label><textarea id="pla" rows="2" placeholder="Street, city, state ZIP"></textarea>
 <label>Defendant/Respondent's name</label><input type="text" id="dfn" placeholder="e.g. John Doe">
 <label>Defendant/Respondent's address</label><textarea id="dfa" rows="2" placeholder="Street, city, state ZIP"></textarea>
 <label>In the matter of</label><input type="text" id="matter" placeholder="e.g. Paul v. Doe">

 <h2>Representation</h2>
 <label>Representing (select one)</label>
 <select id="rep"><option value="0">— leave unchecked —</option><option value="1">1. Plaintiff(s) / Petitioner(s) / Appellant(s)</option><option value="2">2. Defendant(s) / Respondent(s) / Appellee(s)</option></select>
 <label>Represented party(ies) (select one)</label>
 <select id="rp"><option value="0">— leave unchecked —</option><option value="3">3. Only one party is identified on the selected representation</option><option value="4">4. I represent all parties identified on the selected side</option><option value="5">5. I represent only the following party(ies)</option></select>
 <label>Party(ies) represented (item 5)</label><input type="text" id="only" placeholder="Only used with item 5">

 <h2>Attorney</h2>
 <label>Attorney name (type or print)</label><input type="text" id="aname" data-font="sig">
 <div class="row"><div><label>Bar number</label><input type="text" id="bar"></div><div><label>Firm name (if applicable)</label><input type="text" id="firm"></div></div>

 <h2>Certification</h2>
 <div class="row"><div><label>Date</label><input type="text" id="d1" data-font="date"></div><div><label>Signature (typed)</label><input type="text" id="sig1" data-font="sig"></div></div>
`;

const hdr = (P, B, mid, j, c) => `<div class="hd"><div class="h1"><div class="b" style="padding-left:${P(33.5)}">STATE OF MICHIGAN</div><div class="r">THE DISTRICT COURT FOR</div><div class="r">GENESEE COUNTY</div></div><div class="h2">${mid}</div><div class="h3"><div><b>JUDGE</b><span class="jv">${j}</span></div><div><b>CASE NO.</b><span class="jv">${c}</span></div></div></div>`;
const cell = (l, v) => `<div class="lb">${l}</div><div class="vv">${v}</div>`;
const cb = on => `<div class="cb">${on ? '✓' : ''}</div>`;

function build(api) {
  const { $, P, B } = api, E = api.ed, seq = [];
  const rep = $('rep').value, rp = $('rp').value;
  const opt = (id, n, on, t) => `<div class="oo" data-sel="${id}=${n}" title="Click to choose this option">${cb(on)}<div class="tx">${n}. ${t}</div></div>`;
  seq.push({ html: hdr(P, B, 'APPEARANCE', E('judge'), E('caseno')) });
  seq.push({ html: `<div class="pt"><div class="pa">${cell('Plaintiff/Petitioner’s name and address', `<div>${E('pln')}</div><div>${E('pla', { multi: true })}</div>`)}</div><div class="pv">v</div><div class="pa">${cell('Defendant/Respondent’s name and address', `<div>${E('dfn')}</div><div>${E('dfa', { multi: true })}</div>`)}</div></div>
   <div class="mt"><span class="b">In the matter of:</span><div class="vv">${E('matter', { ph: 'e.g. Paul v. Doe' })}</div></div>` });
  seq.push({ html: `<div class="sec" style="margin-top:${P(11.5)}"><b>TO:</b> Clerk of the court, all attorneys of record, and unrepresented parties:</div>` });
  seq.push({ html: `<div class="sec"><b>Representing:</b> <span class="sm">(select one)</span></div>
   <div style="margin-top:${P(1)}">${opt('rep', 1, rep === '1', 'Plaintiff(s) / Petitioner(s)/ Appellant(s)')}${opt('rep', 2, rep === '2', 'Defendant(s) / Respondent(s) / Appellee(s)')}</div>` });
  seq.push({ html: `<div class="sec" style="margin-top:${P(12)}"><b>Represented Party(ies):</b> <span class="sm">(select one)</span></div>
   <div style="margin-top:${P(1)}">${opt('rp', 3, rp === '3', 'There is only one party identified on the selected representation.')}${opt('rp', 4, rp === '4', 'I represent all parties identified as the Plaintiffs / Petitioners / Appellants &nbsp;or&nbsp; Defendants / Respondents / Appellees &nbsp;as selected above in item 1 or 2.')}
   <div class="oo" data-sel="rp=5" title="Click to choose this option">${cb(rp === '5')}<div class="tx ln">5. I represent only the following party(ies):&nbsp;<div class="bl">${E('only', { ph: 'Party(ies) represented' })}</div></div></div></div>` });
  seq.push({ html: `<div style="margin-top:${P(24)}">I, <span class="u" style="min-width:${P(183)}">${E('aname', { ph: 'Attorney name' })}</span>, attorney at law, enter my appearance as counsel of record for the above-named party in this matter.</div>
   <div style="margin-top:${P(13)}">My appearance shall apply to all proceedings in this case unless and until withdrawn, substituted, or otherwise terminated in accordance with the applicable court rules.</div>` });
  seq.push({ html: `<div class="fl" style="margin-top:${P(12)}">Attorney Name:&nbsp;<div class="bl" style="width:${P(195)}">${E('aname', { ph: 'Attorney name' })}</div></div>
   <div class="fl" style="margin-top:${P(5.6)}">Bar Number:&nbsp;<div class="bl" style="width:${P(97)}">${E('bar', { ph: 'Bar number' })}</div></div>
   <div class="fl" style="margin-top:${P(5.4)}">Firm Name <span class="sm">&nbsp;(if applicable)</span>:&nbsp;<div class="bl" style="width:${P(292)}">${E('firm', { ph: 'Firm name' })}</div></div>` });
  seq.push({ html: `<div style="margin-top:${P(12.7)}">All notices, pleadings, motions, orders, and other documents required to be served upon the represented party shall be served upon the undersigned attorney at the electronic service information provided above. The court shall carry this burden by transmitting such materials through the MiCOURT system.</div>
   <div class="ad"><div style="width:${P(208)};padding-left:${P(5)};font-size:${P(7.7)};line-height:${P(8.4)}">I certify that I have been retained or otherwise authorized to represent the party(ies) identified above and to enter this appearance on their behalf.</div>
    <div class="sc" style="margin-left:${P(23.6)};width:${P(73)}"><div class="sv lf"><div class="in">${E('d1')}</div></div><div class="sl">Date</div></div>
    <div class="sc" style="margin-left:${P(26.4)};width:${P(162.4)}"><div class="sv lf"><div class="in">${E('sig1', { pre: '/s/ ' })}</div></div><div class="sl">Signature</div></div></div>` });
  return seq;
}

export default {
  id: 'mc02', number: 'MC 02', title: 'Appearance', footer: 'MC 02',
  css, panel, build,
  contHeader: api => `<div class="ch">Case Number: <span class="cu">${api.ed('caseno')}</span></div>`,
  roles: [
    { id: 'attorney', label: 'Attorney entering the appearance', fill: (api, w) => ({ aname: w.name, sig1: w.name, d1: w.today, bar: w.bar, firm: w.org }) }
  ],
  md: { title: 'Appearance', malias: { 'plaintiff/petitioner name and address': 'pl', 'defendant/respondent name and address': 'df' },
    migrate: r => { [['pl', 'pln', 'pla'], ['df', 'dfn', 'dfa']].forEach(([o, n, a]) => { const d = r.multi[o]; if (d !== undefined && r.single[n] === undefined && r.multi[a] === undefined) { const [x, ...rest] = String(d).split('\n'); r.single[n] = x.trim(); r.multi[a] = rest.join('\n').trim(); } delete r.multi[o]; }); },
    sections: [
    { name: 'Case', fields: [['judge', 'Judge'], ['caseno', 'Case No.'], ['matter', 'In the matter of'], ['pln', 'Plaintiff/Petitioner name'], ['dfn', 'Defendant/Respondent name']], multi: [['pla', 'Plaintiff/Petitioner address'], ['dfa', 'Defendant/Respondent address']] },
    { name: 'Representation', fields: [['rep', 'Representing (1 plaintiff side, 2 defendant side, 0 none)'], ['rp', 'Represented party(ies) (3 one party, 4 all parties, 5 only the following, 0 none)'], ['only', 'Only the following party(ies)']] },
    { name: 'Attorney', fields: [['aname', 'Attorney name'], ['bar', 'Bar number'], ['firm', 'Firm name'], ['d1', 'Date'], ['sig1', 'Signature']] }
  ] }
};