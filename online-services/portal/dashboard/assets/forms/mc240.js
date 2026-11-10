/* MC 240: Order After Arraignment and Pretrial Release Order (one packet).
   Completed by the court: the judge or magistrate, or court staff for them. */
import a200 from './mc200a.js?v=16';
import { defendants, hearingFill } from './caseinfo.js?v=3';

const css = args => a200.css(args) + (({ U, P, B }) => `
.u{text-align:left;padding-left:${P(4)}}
.h3 .jv{font-size:${P(8)};white-space:nowrap}
.pt .c5{flex:1;border-top:${B} solid #000;padding-left:${P(5)}}
.mt{width:${P(497.5)};border-bottom:${B} solid #000;padding:${P(9)} 0 ${P(9)} ${P(8)};line-height:${P(13)}}
.sb{width:max-content;min-width:${P(104)};margin:${P(16)} auto 0;border:${B} solid #333;padding:${P(5)} ${P(14)};text-align:center;font-weight:bold;line-height:${P(12)}}
.sb.l{margin:${P(22)} 0 0 ${P(209)}}
.pp{line-height:${P(14)};margin-top:${P(14)}}.pp.t{margin-top:${P(12)}}
.ob2{display:flex;align-items:flex-start;min-height:${P(18.5)};line-height:${P(14)}}.ob2 .cb{margin-top:${P(2.5)}}.ob2 .tx{flex:1;min-width:0;white-space:pre-wrap;word-wrap:break-word}
.in1{margin-left:${P(24)}}.in2{margin-left:${P(46)}}
.fi{display:flex;align-items:flex-end;margin-top:${P(11)};line-height:${P(14)}}.fi .u{min-width:${P(120)}}
.nl{margin:${P(3)} 0 0 ${P(24)};line-height:${P(14)}}.nl>div{display:flex;margin-top:${P(3)}}.nl>div>b{width:${P(18)};flex:none;font-weight:normal}
.note{font-size:${P(7.5)};font-weight:normal}
.rt{width:${P(497.5)};margin-top:${P(12)};font-size:${P(8.6)}}
.rt .rr{display:flex;align-items:center;border-bottom:${B} solid #000;min-height:${P(24.5)}}.rt .rr.h{font-weight:bold;font-size:${P(7.8)};min-height:${P(18)}}
.rt .rr>div:nth-child(1){width:${P(38)};padding-left:${P(6)}}.rt .rr>div:nth-child(2){width:${P(78)};display:flex;justify-content:center}.rt .rr>div:nth-child(3){width:${P(270)}}.rt .rr>div:nth-child(4){flex:1}
.rt .cb{margin:0}.rt .rr{font-size:${P(9.6)}}.rt .rr.h{font-size:${P(7.8)}}
.tl{display:flex;align-items:flex-start;line-height:${P(14)};margin-top:${P(3)}}.tl .cb{margin-top:${P(2.5)}}.tl .tx{flex:1;min-width:0;white-space:pre-wrap;word-wrap:break-word}
.gl{border-bottom:${B} solid #000;min-height:${P(16)};margin:${P(2)} 0 0 ${P(46)};padding-left:${P(3)};white-space:pre-wrap}
`)({ U: args.U, P: args.P, B: args.B });

const T = [['a', 'Personally appear for any examination, arraignment, trial, sentencing, or at any time and place as directed by this court. If represented by an attorney in this case, any notice to appear may be given to the defendant’s attorney instead of the defendant'],
  ['b', 'Abide by any judgment entered in this case and surrender to serve any sentence imposed.'], ['c', 'Do not commit any crime under state or local laws while released.'],
  ['d', 'Have no contact with any victim.'], ['e', 'Have no contact with any prosecution witness.'], ['f', 'Do not harass, intimidate, threaten, or retaliate against any victim or witness.'],
  ['g', 'Do not have (or cause any third party to have) any direct or indirect contact with the following person(s):', 'tgx'], ['h', 'Maintain employment if employed or actively seek employment if not.'],
  ['i', 'Surrender any driver’s license issued and refrain from operating any motor vehicle.'], ['j', 'Do not possess or purchase a firearm or other dangerous weapon.'],
  ['k', 'Report to or remain under the supervision of: <span class="note">(excluding custody order)</span>', 'tkx'], ['l', 'Submit to GPS monitoring or home confinement, as follows:', 'tlx'],
  ['m', 'Do not enter the following specified premises or areas:', 'tmx'],
  ['n', 'The county sheriff shall hold the defendant named above in its care and custody until bond is posted (or indefinitely if bond cannot be posted) and the terms and conditions specified in item 5 are acknowledged. The defendant shall be brought to all court appearances while in custody or as otherwise ordered.']];
const TD = ['a', 'b', 'c', 'n'];   // checked on a new form, as on the paper form

const chk = (id, t) => `<div class="chk"><input type="checkbox" id="${id}"> ${t}</div>`;
const panel = `
 <h2>Case</h2>
 <div class="row"><div><label>Judge</label><input type="text" id="judge"></div><div><label>Case No.</label><input type="text" id="caseno"></div></div>
 <label>Defendant's name</label><input type="text" id="defn" placeholder="e.g. John Doe">

 <h2>Arraignment</h2>
 <div class="row"><div><label>1. Date</label><input type="text" id="arrd" placeholder="e.g. 11/05/2026"></div><div><label>2. Time</label><input type="text" id="arrt" placeholder="e.g. 9:00 AM"></div></div>
 <label>3. Presiding: Hon.</label><input type="text" id="pres">
 <h2>Advisements</h2>
 <label>Advice of rights and plea information form</label>
 <select id="adv"><option value="0">— leave unchecked —</option><option value="1">4a. Presented, and the defendant signed the form</option><option value="2">4b. Presented, and the defendant refused to sign</option><option value="3">5. Not presented to the defendant</option></select>
 <h2>Plea</h2>
 <select id="plea"><option value="0">— leave unchecked —</option><option value="1">6. Not guilty</option><option value="2">7. Guilty</option><option value="3">8. No Contest</option><option value="4">9. Stood mute (not guilty entered)</option></select>
 <h2>Next proceeding</h2>
 <select id="nxt"><option value="0">— leave unchecked —</option><option value="1">11. Probable cause conference</option><option value="2">12. Preliminary Examination</option><option value="3">13. Sentencing</option><option value="4">14. Other</option></select>
 <label>14. Other (describe)</label><input type="text" id="nxo">
 <div class="row r3"><div><label>15a. Date</label><input type="text" id="n15d"></div><div><label>15b. Time</label><input type="text" id="n15t"></div><div><label>15c. Location</label><input type="text" id="n15l"></div></div>
 <h2>Order after arraignment</h2>
 ${chk('fo', 'Further orders are entered (item 5)')}
 <textarea id="fot" rows="3" placeholder="Item 5: further orders"></textarea>
 <div class="row"><div><label>Date</label><input type="text" id="od" data-font="date"></div><div><label>Judge or Magistrate (type or print)</label><input type="text" id="jname" data-font="sig"></div></div>
 <label>Signature (typed)</label><input type="text" id="jsig" data-font="sig">

 <h2>Pretrial release order: release type</h2>
 ${chk('rt1', '1. Personal Recognizance')}${chk('rt2', '2. Cash Bail')}<label>Cash bail amount $</label><input type="text" id="cash">
 ${chk('rt3', '3. Surety Bond')}<label>Surety bond amount $</label><input type="text" id="surety">${chk('rt4', '4. Bail Denied')}
 <label>5. Bond</label>
 <select id="bond"><option value="0">— leave unchecked —</option><option value="1">a. The defendant may post a new bond as prescribed under items 1-3</option><option value="2">b. Bond is denied by the court</option><option value="3">c. The bond previously ordered is continued</option></select>
 <h2>Terms and conditions</h2>
 ${T.map(([k, t]) => chk('t' + k, k + '. ' + t.replace(/<[^>]+>/g, '').slice(0, 70) + (t.length > 70 ? '…' : ''))).join('')}
 <label>g. Person(s) the defendant shall not contact</label><textarea id="tgx" rows="2"></textarea>
 <label>k. Report to or remain under the supervision of</label><textarea id="tkx" rows="2"></textarea>
 <label>l. GPS monitoring or home confinement, as follows</label><textarea id="tlx" rows="2"></textarea>
 <label>m. Premises or areas not to be entered</label><textarea id="tmx" rows="2"></textarea>
 ${chk('tm2', 'm. May go to the location once, accompanied by a peace officer, to remove personal belongings')}
 <h2>Denial of bail</h2>
 ${chk('d6', '6. Bail is denied. The court specifically finds:')}<textarea id="dfind" rows="4"></textarea>
 ${chk('d7', '7. The county sheriff shall maintain custody of the defendant')}
 <h2>Pretrial release order signature</h2>
 <div class="row"><div><label>Date</label><input type="text" id="od2" data-font="date"></div><div><label>Judge or Magistrate (type or print)</label><input type="text" id="jname2" data-font="sig"></div></div>
 <label>Signature (typed)</label><input type="text" id="jsig2" data-font="sig">
`;

const hdr = (P, B, mid, j, c) => `<div class="hd"><div class="h1"><div class="b" style="padding-left:${P(33.5)}">STATE OF MICHIGAN</div>${globalThis.__mcSup ? '<div class="r">IN THE SUPREME COURT</div>' : '<div class="r">THE 7TH DISTRICT COURT FOR</div><div class="r">GENESEE COUNTY</div>'}</div><div class="h2">${mid}</div><div class="h3"><div><b>JUDGE</b><span class="jv">${j}</span></div><div><b>CASE NO.</b><span class="jv">${c}</span></div></div></div>`;
const cb = (on, key) => `<div class="cb"${key ? ` data-chk="${key}" title="Click to check or uncheck"` : ''}>${on ? '✓' : ''}</div>`;

function build(api, part) {
  const { $, P, B } = api, E = api.ed, seq = [], on = id => $(id).checked, sv = id => $(id).value;
  const caseHd = `<div class="ch">Case Number: <span class="u">${E('caseno')}</span></div>`;
  const matter = `<div class="mt"><b>In the matter of:</b> The People of the State of Michigan v. ${E('defn', { blank: '[Defendant Name]' })}</div>`;
  const sig = (d, n, s, g = 44, g2 = 34) => `<div class="sr" style="margin-top:${P(g)}"><div class="sc" style="margin-left:${P(283)};width:${P(213)}"><div class="sv lf"><div class="in">${E(n)}</div></div><div class="sl">Judge or Magistrate (type or print)</div></div></div>
   <div class="sr" style="margin-top:${P(g2)}"><div class="sc" style="margin-left:${P(3)};width:${P(98)}"><div class="sv lf"><div class="in">${E(d)}</div></div><div class="sl">Date</div></div><div class="sc" style="margin-left:${P(182)};width:${P(213)}"><div class="sv lf"><div class="in">${E(s, { pre: '/s/ ' })}</div></div><div class="sl">Signature</div></div></div>`;
  const sel = (id, n, t, cls = '') => `<div class="oo ${cls}" data-sel="${id}=${n}" title="Click to choose this">${cb(sv(id) == n)}<div>${t}</div></div>`;
  const u = (k, w) => `<span class="u" style="min-width:${P(w)}">${E(k)}</span>`;
  const A = part !== 'b', Bp = part !== 'a', adv = A ? sv('adv') : 0, nxt = A ? sv('nxt') : 0;

  seq.push({ ch: caseHd });
  if (A) {
  seq.push({ html: hdr(P, B, 'ORDER AFTER ARRAIGNMENT', E('judge'), E('caseno')) });
  seq.push({ html: `<div class="pt"><div class="c1">THE PEOPLE OF THE<br>STATE OF MICHIGAN</div><div class="c2">v</div><div class="c5"><div class="lb">Defendant’s full name</div><div class="vv">${E('defn')}</div></div></div>${matter}` });
  seq.push({ html: `<div class="sb">ARRAIGNMENT</div><div class="pp t">The defendant appeared before the court for arraignment pursuant to MCR 6.501(A) on:</div>
    <div class="fi">1. Date:&nbsp;${u('arrd', 120)}<span style="margin-left:${P(14)}">2. Time:&nbsp;</span>${u('arrt', 120)}</div><div class="fi">3. Presiding: Hon.&nbsp;${u('pres', 280)}</div>` });
  seq.push({ html: `<div class="sb">ADVISEMENTS</div><div class="pp t">All necessary advice and notifications required under MCR 6.501(B) were made to the defendant on the record.</div>
    <div class="oo">${cb(adv == 1 || adv == 2)}<div>4. The advice of rights and plea Information form was presented to the defendant and;</div></div>
    ${sel('adv', 1, 'a. the defendant signed the form.', 'in1')}${sel('adv', 2, 'b. the defendant refused to sign the form after being afforded the procedures required by MCR 6.501(F).', 'in1')}
    ${sel('adv', 3, '5. The advice of rights and plea Information form was not presented to the defendant.')}` });
  seq.push({ html: `<div class="sb">PLEA</div><div class="pp t">The court addressed the defendant’s plea per MCR 6.501(C) and the defendant entered the following plea:</div>
    ${sel('plea', 1, '6. Not guilty')}${sel('plea', 2, '7. Guilty')}${sel('plea', 3, '8. No Contest')}${sel('plea', 4, '9. Stood mute. A plea of not guilty was entered on the defendant\'s behalf.')}` });
  seq.push({ html: `<div class="sb">NEXT PROCEEDING</div><div class="pp t">Following the arraignment, the court schedules the defendant's next proceeding as follows:</div>
    ${sel('nxt', 1, '11. Probable cause conference')}${sel('nxt', 2, '12. Preliminary Examination')}${sel('nxt', 3, '13. Sentencing')}
    <div class="oo" data-sel="nxt=4" title="Click to choose this">${cb(nxt == 4)}<div>14. Other:&nbsp;</div>${u('nxo', 300)}</div>` });
  seq.push({ html: `<div class="pp t">15. The next proceeding shall be held as follows:</div><div class="fi">a. Date:&nbsp;${u('n15d', 120)}</div><div class="fi">b. Time:&nbsp;${u('n15t', 120)}</div><div class="fi">c. Location:&nbsp;${u('n15l', 260)}</div>` });
  seq.push({ html: `<div class="or"><div class="cap">To be considered section 2 when citing items. (i,e 2.1)</div><div class="ob">ORDER</div></div>
    <div class="b" style="margin-top:${P(12)};line-height:${P(12)}">IT IS ORDERED:</div>
    <div class="nl"><div><b>1.</b><span>The defendant shall fully comply with each and every applicable provision, directive, finding, requirement, and scheduled proceeding set forth in items 1 through 15 of this order.</span></div>
     <div><b>2.</b><span>Compliance with this order shall continue unless modified by subsequent order of the court.</span></div>
     <div><b>3.</b><span>The defendant shall further comply with all applicable terms, conditions, and requirements contained in any accompanying pretrial release order, which is incorporated herein by reference to the extent applicable.</span></div>
     <div><b>4.</b><span>Failure to comply with this order or any accompanying order of the court may subject the defendant to sanctions or other proceedings as authorized by law.</span></div></div>` });
  seq.push({ html: `<div class="oo" style="margin-top:${P(10)}">${cb(on('fo'), 'fo')}<div><b>IT IS FURTHER ORDERED:</b> <span class="note">(If this box is not checked, no further orders are entered)</span></div></div>
    <div class="nl"><div><b>5.</b><span style="flex:1;white-space:pre-wrap;min-height:${P(34)}">${E('fot', { multi: true, ph: 'Further orders' })}</span></div></div>` });
  seq.push({ html: sig('od', 'jname', 'jsig') });
  }
  if (part === undefined) seq.push({ pb: 'blank', html: `<div class="c" style="padding-top:${P(314)}"><div class="b" style="font-size:${P(19.4)};line-height:${P(22)}">THIS PAGE IS INTENTIONALLY LEFT BLANK</div><div style="margin-top:${P(20.5)};font-size:${P(11.8)};line-height:${P(15)}">ORDER AFTER ARRAIGNMENT ON PREVIOUS PAGE(S)<br>PRETRIAL RELEASE ORDER ON NEXT PAGE(S)</div></div>` });

  /* pretrial release order */
  if (Bp) {
  seq.push({ pb: part === 'b' ? undefined : 'new', html: hdr(P, B, part === 'b' ? `<div style="text-align:center;line-height:${P(12)}">PRETRIAL RELEASE ORDER</div><div style="display:flex;justify-content:center;align-items:center;margin-top:${P(1)};line-height:${P(12)}">${cb(on('amd'), 'amd')}<span>AMENDED</span></div>` : 'PRETRIAL RELEASE ORDER<br>(INITIAL ORDER)', E('judge'), E('caseno')) });
  seq.push({ ch: caseHd });
  seq.push({ html: `<div class="pt"><div class="c1">THE PEOPLE OF THE<br>STATE OF MICHIGAN</div><div class="c2">v</div><div class="c5"><div class="lb">Defendant’s full name</div><div class="vv">${E('defn')}</div></div></div>${matter}` });
  const row = (n, k, t, d) => `<div class="rr"><div>${n}</div><div>${cb(on(k), k)}</div><div>${t}</div><div>${d}</div></div>`;
  seq.push({ html: `<div class="rt"><div class="rr h"><div>Item</div><div>Ordered (Y/N)</div><div>Release Type</div><div>Amount / Details</div></div>
    ${row(1, 'rt1', 'Personal Recognizance', 'N/A')}${row(2, 'rt2', 'Cash Bail', '$' + u('cash', 70))}${row(3, 'rt3', 'Surety Bond', '$' + u('surety', 70))}${row(4, 'rt4', 'Bail Denied', 'See detailed order')}</div>` });
  const bond = sv('bond');
  seq.push({ html: `<div class="b" style="margin-top:${P(18)};line-height:${P(12)}">IT IS ORDERED:</div><div class="pp" style="margin-top:${P(8)}">5. Bond is as follows:</div>
    ${sel('bond', 1, 'a. The defendant may post a new bond as prescribed under items 1-3.', 'in1')}${sel('bond', 2, 'b. Bond is denied by the court.', 'in1')}${sel('bond', 3, 'c. The bond previously ordered is continued.', 'in1')}
    <div class="pp" style="margin-top:${P(10)}">5. The defendant shall comply with the following terms and conditions that are checked:</div>` });
  T.forEach(([k, t, tx]) => {
    let h = `<div class="tl in1">${cb(on('t' + k), 't' + k)}<div class="tx">${k === 'l' ? 'L' : k}. ${t}</div></div>`;
    if (tx) h += `<div class="gl">${E(tx, { multi: true, ph: 'Details' })}</div>`;
    if (k === 'm') h += `<div class="tl in2">${cb(on('tm2'), 'tm2')}<div class="tx">May go to the above location once, accompanied by a peace officer, to remove personal belongings.</div></div>`;
    seq.push({ html: h });
  });
  seq.push({ html: `<div class="or" style="margin-top:${P(14)}"><div class="cap">Complete section only if bail is denied.</div><div class="ob" style="width:${P(120)}">DENIAL OF BAIL</div></div>
    <div class="b" style="margin-top:${P(12)};line-height:${P(12)}">IT IS FURTHER ORDERED THAT:</div>
    <div class="oo" style="margin-top:${P(6)}">${cb(on('d6'), 'd6')}<div>6. Bail is denied pursuant to Mich. Const. 2026, art. 1, sec. 15. The court specifically finds:</div></div>
    <div class="gl" style="margin-left:${P(24)};min-height:${P(30)}">${E('dfind', { multi: true, ph: 'Findings' })}</div>
    <div class="ob2" style="margin-top:${P(8)}">${cb(on('d7'), 'd7')}<div class="tx">7. The county sheriff shall maintain custody of the defendant until further order of the court or the conclusion of this action, unless otherwise provided by law.</div></div>` });
  seq.push({ html: `<div class="or" style="margin-top:${P(10)};justify-content:center"><div class="ob" style="width:${P(104)}">FINAL ORDER</div></div>
    <div class="b" style="margin-top:${P(12)};line-height:${P(12)}">IT IS FINALLY ORDERED:</div>
    <div class="nl"><div><b>1.</b><span>All findings, determinations, terms, conditions, and directives contained in this pretrial release order, including any checked or completed provisions, are hereby adopted and entered as the order of the court.</span></div>
     <div><b>2.</b><span>This order shall remain in full force and effect unless modified or vacated by subsequent order of the court.</span></div>
     <div><b>3.</b><span>The defendant, the sheriff, the clerk, and all other persons subject to this order shall comply with its applicable provisions.</span></div></div>
    <div class="b" style="margin-top:${P(6)};line-height:${P(14)}">IT IS SO ORDERED.</div>` });
  seq.push({ html: sig('od2', 'jname2', 'jsig2', 30, 24) });
  }
  return seq;
}

const F = ['judge', 'caseno', 'defn', 'arrd', 'arrt', 'pres', 'adv', 'plea', 'nxt', 'nxo', 'n15d', 'n15t', 'n15l', 'fo', 'od', 'jname', 'jsig', 'rt1', 'rt2', 'cash', 'rt3', 'surety', 'rt4', 'bond', ...T.map(([k]) => 't' + k), 'tm2', 'd6', 'd7', 'od2', 'jname2', 'jsig2'];
const L = { amd: 'Amended pretrial release order', judge: 'Judge', caseno: 'Case No.', defn: 'Defendant name', arrd: 'Arraignment date', arrt: 'Arraignment time', pres: 'Presiding', adv: 'Advisement (0 none, 1 signed 4a, 2 refused 4b, 3 not presented 5)', plea: 'Plea (0 none, 1 not guilty, 2 guilty, 3 no contest, 4 stood mute)', nxt: 'Next proceeding (0 none, 1 PC conference, 2 preliminary exam, 3 sentencing, 4 other)', nxo: 'Next proceeding other', n15d: 'Next proceeding date', n15t: 'Next proceeding time', n15l: 'Next proceeding location', fo: 'Further orders entered', od: 'Order date', jname: 'Order judge or magistrate name', jsig: 'Order signature', rt1: 'Release - personal recognizance', rt2: 'Release - cash bail', cash: 'Cash bail amount', rt3: 'Release - surety bond', surety: 'Surety bond amount', rt4: 'Release - bail denied', bond: 'Bond (0 none, 1 new bond, 2 denied, 3 continued)', tm2: 'Premises - may return once with officer', d6: 'Bail denied finding', d7: 'Sheriff maintains custody', od2: 'Release order date', jname2: 'Release order judge or magistrate name', jsig2: 'Release order signature' };
T.forEach(([k]) => { L['t' + k] = 'Term ' + k; });
const fields = ids => ids.map(id => [id, L[id]]);

const SEC = [
  [{ name: 'Parties and case', fields: fields(['judge', 'caseno', 'defn']) }, '*'],
  [{ name: 'Arraignment', fields: fields(['arrd', 'arrt', 'pres', 'adv', 'plea', 'nxt', 'nxo', 'n15d', 'n15t', 'n15l']) }, 'a'],
  [{ name: 'Order after arraignment', fields: fields(['fo', 'od', 'jname', 'jsig']), multi: [['fot', 'Further orders']] }, 'a'],
  [{ name: 'Release type', fields: fields(['rt1', 'rt2', 'cash', 'rt3', 'surety', 'rt4', 'bond']) }, 'b'],
  [{ name: 'Terms and conditions', fields: fields([...T.map(([k]) => 't' + k), 'tm2']), multi: [['tgx', 'Term g persons'], ['tkx', 'Term k supervision'], ['tlx', 'Term l GPS or home confinement'], ['tmx', 'Term m premises']] }, 'b'],
  [{ name: 'Denial of bail', fields: fields(['d6', 'd7']), multi: [['dfind', 'Findings']] }, 'b'],
  [{ name: 'Release order signature', fields: fields(['od2', 'jname2', 'jsig2']) }, 'b']
];
const idsFor = part => { const ids = new Set(SEC.filter(([, p]) => !part || p === part || p === '*').flatMap(([s]) => [...s.fields.map(f => f[0]), ...(s.multi || []).map(m => m[0])])); if (part === 'b') ids.add('amd'); return ids; };
const keep = (fn, part) => (api, w) => Object.fromEntries(Object.entries(fn(api, w)).filter(([k]) => idsFor(part).has(k)));
const panelFor = part => {
  const a = panel.indexOf('<h2>Arraignment</h2>'), b = panel.indexOf('<h2>Pretrial release order: release type</h2>');
  if (!part) return panel;
  return part === 'a' ? panel.slice(0, b) : panel.slice(0, a) + `<div class="chk"><input type="checkbox" id="amd"> Amended pretrial release order</div>` + panel.slice(b);
};

export const make = part => ({
  id: part ? 'mc240' + part : 'mc240', number: part ? 'MC 240' + part.toUpperCase() : 'MC 240', title: part === 'a' ? 'Order After Arraignment' : part === 'b' ? 'Pretrial Release Order' : 'Arraignment Order Packet', footer: part ? 'MC 240' + part.toUpperCase() : 'MC 240',
  css, panel: panelFor(part), usable: U => 686 * U,
  fromCase: c => { const h = hearingFill(c, /arraign/i); return { defn: defendants(c).join(', '), ...(h ? { arrd: h.date, arrt: h.time } : {}) }; },
  init(api) { TD.forEach(k => { const e = api.$('t' + k); if (e) e.checked = true; }); },
  contHeader: api => `<div class="ch">Case Number: <span class="u">${api.ed('caseno')}</span></div>`,
  build: api => build(api, part),
  courtKeys: [...idsFor(part)].filter(id => !['judge', 'caseno'].includes(id)), courtNote: 'This order is completed by the judge or magistrate, or by court staff for them.',
  roles: [
    { id: 'judge', label: 'Judge or magistrate', for: /judge|magistrate|justice/i, fill: keep((api, w) => ({ pres: w.name, jname: w.name, jsig: w.name, od: w.today, jname2: w.name, jsig2: w.name, od2: w.today }), part) },
    { id: 'chambers', label: 'Court staff completing the order for the judge', hint: 'fills the dates only', for: /law clerk|judicial assistant|deputy clerk|county clerk|court administrator|court reporter/i, fill: keep((api, w) => ({ od: w.today, od2: w.today }), part) }
  ],
  md: { title: part === 'a' ? 'Order After Arraignment' : part === 'b' ? 'Pretrial Release Order' : 'Arraignment Order Packet', sections: SEC.filter(([, p]) => !part || p === part || p === '*').map(([sec]) => part === 'b' && sec.name === 'Release type' ? { ...sec, fields: [['amd', L.amd], ...sec.fields] } : sec) }
});

export default make();