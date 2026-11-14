/* MC 328A: Scheduling Order (Civil). Layout measured from the court's PDF. */
import { plaintiffs, defendants } from './caseinfo.js?v=3';

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

.rs{border-top:${B} solid #000;border-bottom:${B} solid #000;text-align:center;font-weight:bold;padding:${P(6)} 0;margin-top:${P(16)}}
.rh{display:flex;font-weight:bold;font-size:${P(7.6)};padding:${P(6)} 0;border-bottom:${B} solid #000}.rh .a{width:${P(40)};text-align:center}.rh .b2{flex:1;padding-left:${P(8)}}.rh .c{width:${P(94)};padding-left:${P(6)}}
.rw{display:flex;border-bottom:${B} solid #000}.rw .rf{width:${P(40)};text-align:center;padding-top:${P(7)};flex:none}
.rw .rq{flex:1;min-width:0;border-left:${P(1.2)} solid #000;padding:${P(7)} ${P(8)} ${P(8)} ${P(8)};line-height:${P(12.2)};display:flex;align-items:flex-start}.rw .rq .tx{flex:1;min-width:0}
.rw .rd{width:${P(94)};flex:none;border-left:${B} solid #000;border-right:${B} solid #000;padding:${P(5)} ${P(5)};line-height:${P(13)}}
.rw .rd .oo{align-items:center}.rw .rd .oo .tx{padding-left:${P(2)}}
.ar{border-bottom:${B} solid #000;min-height:${P(64)};margin-top:${P(2)};padding:${P(3)} ${P(3)};line-height:${P(13)};white-space:pre-wrap;word-wrap:break-word}.ar0{min-height:${P(190)};border-bottom:0}
.tl2{display:flex;align-items:flex-end;line-height:${P(13)};margin-top:${P(10)}}.tl2 .u{margin-left:${P(3)}}
`;
const JUDGE = /judge|magistrate|justice/i;

/* Rows of the schedule: [ref, section, bold title, text, deadline id, checkbox id (optional)] */
const SEC = {
  'PLEADINGS AND PARTIES': [
    [1, 'Amendments to pleadings.', 'Deadline a party may amend a complaint, answer, or other pleading without further permission of the court, as permitted by the applicable rules. This in itself does not grant parties the ability to freely file amendments as a matter of course before the deadline if the court rules or order of this court otherwise requires including but not limited to MCR 2.206(B).', 'dl1'],
    [2, 'Responsive pleadings outstanding.', 'One or more parties have not yet filed a required answer, reply, or other responsive pleading. The court has accordingly established a deadline for the filing of all outstanding responsive pleadings.', 'dl2', 'c2'],
    [3, 'Addition of parties.', 'Deadline for each party to add or join additional plaintiffs, defendants, or other necessary parties to the action.', 'dl3']],
  'DISCOVERY': [
    ['4', 'Initial discovery disclosures; default.', 'The parties shall exchange initial discovery disclosures within the time prescribed by the applicable court rules.', 'DEF', 'c4a'],
    ['', 'Initial discovery disclosures; custom.', 'The parties shall exchange initial discovery disclosures within the period established by the court.', 'dl4b', 'c4b'],
    [5, 'Discovery requests.', "Deadline for each party to serve all discovery requests sufficiently in advance to allow the opposing party's response period to expire on or before the discovery completion deadline.", 'dl5'],
    [6, 'Discovery motions filed.', 'Deadline for each party to file motions concerning discovery disputes, including motions to compel or for protective orders.', 'dl6']],
  'WITNESSES AND EXPERTS': [
    [8, 'Plaintiff’s witness list.', 'Deadline for plaintiff to file and serve the witness list and submit proof of service. Failure to comply with this provision may result in exclusion of the witness(es) at trial or other appropriate sanctions.', 'dl8'],
    [9, 'Defendant’s witness list.', 'Deadline for defendant to file and serve the witness list and submit proof of service. Failure to comply with this provision may result in exclusion of the witness(es) at trial or other appropriate sanctions.', 'dl9'],
    [10, 'Plaintiff’s expert disclosures.', 'Deadline for plaintiff to identify expert witnesses and provide the required information concerning their opinions, qualifications, and reports, and to file proof of service. Failure to comply with this provision may result in exclusion of the witness(es) at trial or other appropriate sanctions.', 'dl10'],
    [11, 'Defendant’s expert disclosures.', 'Deadline for defendant to identify expert witnesses and provide the required information concerning their opinions, qualifications, and reports, and to file proof of service. Failure to comply with this provision may result in exclusion of the witness(es) at trial or other appropriate sanctions.', 'dl11'],
    [12, 'Rebuttal expert disclosures.', 'Deadline for each party to identify rebuttal expert witnesses and provide the required information concerning their opinions, qualifications, and reports, limited to rebuttal of expert testimony disclosed by an opposing party, and to file proof of service. Failure to comply with this provision may result in exclusion of the witness(es) at trial or other appropriate sanctions.', 'dl12']],
  'EXHIBITS': [
    [13, 'Plaintiff’s exhibit list.', 'Deadline for plaintiff to identify and disclose all exhibits intended to be offered into evidence at trial, including demonstrative and documentary exhibits, and to provide copies to all opposing parties. Failure to comply with this provision may result in exclusion of the exhibit(s) at trial or other appropriate sanctions.', 'dl13'],
    [14, 'Defendant’s exhibit list.', 'Deadline for defendant to identify and disclose all exhibits intended to be offered into evidence at trial, including demonstrative and documentary exhibits, and to provide copies to all opposing parties. Failure to comply with this provision may result in exclusion of the exhibit(s) at trial or other appropriate sanctions.', 'dl14'],
    [15, 'Exhibit exchange.', 'Deadline for each party to exchange copies of all proposed trial exhibits with all opposing parties, including documentary, photographic, physical, and demonstrative evidence. Each party shall identify any exhibit that is subject to an objection as to admissibility, authenticity, or use at trial. Failure to comply with this provision may result in exclusion of the exhibit(s) at trial or other appropriate sanctions.', 'dl15']],
  'MOTIONS': [
    [17, 'Dispositive motions.', 'Deadline for each party to file and serve all dispositive motions, including motions for summary disposition or other motions seeking a final determination of one or more claims or defenses.', 'dl17'],
    [18, 'Motions in limine.', 'Deadline for each party to file and serve motions requesting the admission or exclusion of specified evidence at trial, including objections concerning the admissibility, relevance, or prejudicial effect of anticipated evidence.', 'dl18'],
    [19, 'Other pretrial motions.', 'Deadline for each party to file and serve all remaining motions requiring resolution before trial that are not otherwise governed by a separate deadline, including motions concerning procedural matters, witness testimony, or other matters affecting trial preparation.', 'dl19']]
};
/* the free-text items that follow a table: after which section, number, label, field */
const AFTER = { 'DISCOVERY': [7, 'Discovery limitations or additional requirements:', 'x7'], 'EXHIBITS': [16, 'Additional exhibit requirements:', 'x16'], 'MOTIONS': [20, 'Additional motion requirements:', 'x20'] };
const ROWS = Object.values(SEC).flat();

const panel = () => {
  const inp = (id, l, ph = '', f = '') => `<label>${l}</label><input type="text" id="${id}"${ph ? ` placeholder="${ph}"` : ''}${f ? ` data-font="${f}"` : ''}>`;
  const row = (...c) => `<div class="row">${c.map(x => `<div>${x}</div>`).join('')}</div>`;
  const chk = (id, t) => `<div class="chk"><input type="checkbox" id="${id}"> ${t}</div>`;
  const area = (id, l, r = 2) => `<label>${l}</label><textarea id="${id}" rows="${r}"></textarea>`;
  let h = `<h2>Header</h2>${row(inp('judge', 'Judge'), inp('caseno', 'Case No.'))}<h2>Parties</h2>${inp('pln', 'Plaintiff/Petitioner’s name', 'e.g. Jane Roe')}${area('pla', 'Plaintiff/Petitioner’s address')}${inp('dfn', 'Defendant/Respondent’s name', 'e.g. John Doe')}${area('dfa', 'Defendant/Respondent’s address')}
    <h2>Scheduling conference</h2>${chk('c1', '1. A scheduling conference was conducted')}${row(inp('sd', 'a. Date', '', 'date'), inp('st', 'b. Time'))}${inp('sp', 'c. Presiding: Hon.')}${chk('c2x', '2. A scheduling conference was not conducted')}`;
  for (const [name, rows] of Object.entries(SEC)) {
    h += `<h2>${name[0] + name.slice(1).toLowerCase()}</h2>`;
    for (const r of rows) {
      const label = `${r[0] ? r[0] + '. ' : ''}${r[1].replace(/\.$/, '')}`;
      if (r[4]) h += chk(r[4], label);
      if (r[3] === 'DEF') h += chk('df4', 'Deadline: Default') + chk('cu4', 'Deadline: custom date') + inp('dl4', 'Custom deadline date', '', 'date');
      else h += inp(r[3], (r[4] ? '' : label + ' — ') + 'deadline', '', 'date');
    }
    if (AFTER[name]) h += area(AFTER[name][2], `${AFTER[name][0]}. ${AFTER[name][1].replace(/:$/, '')}`, 3);
  }
  h += `<h2>Other provisions</h2>${chk('c21', '21. Arbitration not requested')}${chk('c22', '22. Alternative dispute resolution')}${chk('c23', '23. Mandatory settlement conference')}${row(inp('ma', 'a. Date', '', 'date'), inp('mt', 'b. Time'))}${inp('ml', 'c. Location')}
    ${chk('c24', '24. Trial schedule')}<label>Trial type</label><select id="tj"><option value="0">— leave unchecked —</option><option value="1">Jury</option><option value="2">Bench</option></select>${chk('c25', '25. Additional requirements')}${area('x25', 'Additional requirements', 5)}
    <h2>Judge or magistrate</h2>${row(inp('od', 'Date', '', 'date'), inp('ojn', 'Judge or magistrate (type or print)', '', 'sig'))}${inp('ojs', 'Signature (typed)', '', 'sig')}`;
  return h;
};

const hdr = (P, j, c) => `<div class="hd"><div class="h1"><div class="b" style="padding-left:${P(33.5)}">STATE OF MICHIGAN</div>${globalThis.__mcSup ? '<div class="r">IN THE SUPREME COURT</div>' : '<div class="r">THE 7TH DISTRICT COURT FOR</div><div class="r">GENESEE COUNTY</div>'}</div><div class="h2">SCHEDULING ORDER (CIVIL)</div><div class="h3"><div><b>JUDGE</b><span class="jv">${j}</span></div><div><b>CASE NO.</b><span class="jv">${c}</span></div></div></div>`;
const cell = (l, v) => `<div class="lb">${l}</div><div class="vv">${v}</div>`;
const cbx = (on, key) => `<div class="cb"${key ? ` data-chk="${key}" title="Click to check or uncheck"` : ''}>${on ? '✓' : ''}</div>`;

function build(api) {
  const { $, P } = api, E = api.ed, seq = [], on = id => { const e = $(id); return !!(e && e.checked); }, sv = id => $(id)?.value;
  const u = (id, w, o = {}) => `<span class="u" style="min-width:${P(w)}">${E(id, o)}</span>`;
  const chk = (id, inner) => `<div class="oo">${cbx(on(id), id)}<div class="tx">${inner}</div></div>`;
  const box = (note, title) => `<div class="sx"><div class="sl2">${note}</div><div class="bx">${title}</div></div>`;
  const caseHd = `<div class="ch">Case Number: <span class="cu">${E('caseno')}</span></div>`;
  const parties = `<div class="pt"><div class="pa l">${cell('Plaintiff/Petitioner’s name and address', `<div>${E('pln')}</div><div>${E('pla', { multi: true })}</div>`)}</div><div class="pv">v</div><div class="pa rr">${cell('Defendant/Respondent’s name and address', `<div>${E('dfn')}</div><div>${E('dfa', { multi: true })}</div>`)}</div></div>`;
  const area = (id, big) => `<div class="ar ${big ? 'ar0' : ''}">${E(id, { multi: true })}</div>`;
  seq.push({ html: hdr(P, E('judge'), E('caseno')) + parties });
  seq.push({ html: `<div style="margin-top:${P(18)}">${chk('c1', '1. A scheduling conference was conducted on:')}</div>
    <div class="tl2" style="margin-left:${P(34)}">a. Date: ${u('sd', 104)}<span style="margin-left:${P(10)}">b. Time: </span>${u('st', 104)}</div>
    <div class="tl2" style="margin-left:${P(34)}">c. Presiding: Hon. ${u('sp', 262)}</div>
    <div style="margin-top:${P(16)}">${chk('c2x', '2. A scheduling conference was not conducted.')}</div>` });
  seq.push({ html: box('', 'ORDER') + `<div class="b" style="margin-top:${P(14)}">IT IS ORDERED:</div><div style="margin-top:${P(4)}">Pursuant to the direction of this Court and the provisions of MCR 5.202, the following matters were considered, agreed upon, or by the Court directed and ordered as follows:</div>` });
  const dead = r => {
    if (r[3] === 'DEF') return `${chk('df4', 'Default')}<div style="margin-top:${P(4)}">${chk('cu4', E('dl4'))}</div>`;
    return E(r[3]);
  };
  for (const [name, rows] of Object.entries(SEC)) {
    rows.forEach((r, i) => {
      const title = `<b>${r[1]}</b> ${r[2]}`;
      const head = i === 0 ? `<div class="rs">${name}</div><div class="rh"><div class="a">Ref.</div><div class="b2">Requirement</div><div class="c">Deadline</div></div>` : '';
      const left = r[4] ? `<div class="oo" style="flex:1">${cbx(on(r[4]), r[4])}<div class="tx">${title}</div></div>` : `<div class="tx">${title}</div>`;
      seq.push({ html: `${head}<div class="rw"><div class="rf">${r[0]}</div><div class="rq">${left}</div><div class="rd">${dead(r)}</div></div>` });
    });
    if (AFTER[name]) seq.push({ html: `<div class="b" style="margin-top:${P(10)}">${AFTER[name][0]}. ${AFTER[name][1]}</div>${area(AFTER[name][2])}` });
  }
  seq.push({ html: `<div style="margin-top:${P(18)}">${chk('c21', '<b>21. Arbitration not requested.</b> No party has requested arbitration in this matter. The parties may stipulate to submit the case to binding arbitration by filing a stipulated order within 10 days after entry of this order. The case may be referred to binding arbitration upon the agreement of all parties and approval of the court.')}</div>
    ${chk('c22', '<b>22. Alternative dispute resolution.</b> This action is referred to alternative dispute resolution in accordance with the procedures and requirements established by the court\'s order for alternative dispute resolution. All parties shall comply with the deadlines and directives prescribed therein.')}` });
  seq.push({ html: `<div style="margin-top:${P(14)}">${chk('c23', '<b>23. Mandatory settlement conference.</b> The mandatory settlement conference is ordered as follows:')}</div>
    <div class="tl2">a. Date: ${u('ma', 126)}</div><div class="tl2">b. Time: ${u('mt', 126)}</div><div class="tl2">c. Location: ${u('ml', 230)}</div>` });
  seq.push({ html: `<div style="margin-top:${P(14)}">${chk('c24', `<b>24. Trial schedule.</b> A <span data-sel="tj=1" title="Click to choose">${sv('tj') === '1' ? '☑' : '☐'}</span> jury <span data-sel="tj=2" title="Click to choose">${sv('tj') === '2' ? '☑' : '☐'}</span> bench trial has been scheduled. See the notice to appear.`)}</div>
    ${chk('c25', '<b>25. Additional requirements.</b> The parties shall comply with the following additional requirements:')}${area('x25', true)}` });
  seq.push({ html: `<div style="margin-top:${P(14)}">26. This scheduling order governs all proceedings in this action unless otherwise modified by the court. A party seeking modification shall file a written motion stating with particularity the grounds supporting the requested modification. The parties may not modify or extend any deadline by stipulation without approval of the court. The court may modify this order upon a showing of good cause or as otherwise permitted by court rule.</div>
    <div style="margin-top:${P(14)}">27. Any deadlines established by this order remain in effect unless modified by the court.</div>` });
  seq.push({ html: `<div class="b" style="margin-top:${P(30)}">IT IS SO ORDERED.</div>
    <div class="sg" style="margin-top:${P(36)};align-items:flex-start"><div class="sc" style="margin-left:${P(342)};width:${P(220)}"><div class="sv"><div class="in">${E('ojn', { ph: 'Judge or magistrate' })}</div></div><div class="sl">Judge or magistrate (type or print)</div></div></div>
    <div class="sg" style="margin-top:${P(40)};align-items:flex-start"><div class="sc" style="margin-left:${P(3)};width:${P(110)}"><div class="sv"><div class="in">${E('od')}</div></div><div class="sl">Date</div></div><div class="sc" style="margin-left:${P(229)};width:${P(220)}"><div class="sv"><div class="in">${E('ojs', { pre: '/s/ ' })}</div></div><div class="sl">Signature</div></div></div>` });
  return seq;
}

const dlFields = ROWS.map(r => r[3] === 'DEF' ? null : [r[3], `${r[0] ? 'Item ' + r[0] : 'Item 4 (custom)'} deadline`]).filter(Boolean);
const rowChecks = ROWS.filter(r => r[4]).map(r => [r[4], `${r[1].replace(/\.$/, '')}`]);
const COURT = ['c1', 'sd', 'st', 'sp', 'c2x', 'c2', 'c4a', 'df4', 'cu4', 'dl4', 'c4b', ...ROWS.map(r => r[3]).filter(x => x !== 'DEF'), 'x7', 'x16', 'x20', 'c21', 'c22', 'c23', 'ma', 'mt', 'ml', 'c24', 'tj', 'c25', 'x25', 'od', 'ojn', 'ojs'];
export default {
  id: 'mc328a', number: 'MC 328A', title: 'Scheduling Order (Civil)', footer: 'MC 328A',
  css, panel: panel(), usable: U => 684 * U, build,
  fromCase: c => ({ pln: plaintiffs(c).join(', '), dfn: defendants(c).join(', ') }),
  contHeader: api => `<div class="ch">Case Number: <span class="cu">${api.ed('caseno')}</span></div>`,
  courtKeys: COURT,
  courtNote: 'This order is completed by the judge or magistrate.',
  roles: [{ id: 'judge', label: 'Judge or magistrate', for: JUDGE, fill: (api, w) => ({ ojn: w.name, ojs: w.name, od: w.today }) }],
  md: {
    title: 'Scheduling Order (Civil)', malias: { 'plaintiff/petitioner name and address': 'pl', 'defendant/respondent name and address': 'df' },
    sections: [
      { name: 'Case', fields: [['judge', 'Judge'], ['caseno', 'Case No.'], ['pln', 'Plaintiff/Petitioner name'], ['dfn', 'Defendant/Respondent name']], multi: [['pla', 'Plaintiff/Petitioner address'], ['dfa', 'Defendant/Respondent address']] },
      { name: 'Scheduling conference', fields: [['c1', 'Conference conducted'], ['sd', 'Conference date'], ['st', 'Conference time'], ['sp', 'Presiding'], ['c2x', 'Conference not conducted']] },
      { name: 'Deadlines', fields: [...rowChecks.filter(x => x[0] !== 'c4a' && x[0] !== 'c4b'), ['c4a', 'Initial disclosures default'], ['df4', 'Initial disclosures deadline default'], ['cu4', 'Initial disclosures custom deadline'], ['dl4', 'Initial disclosures default row custom date'], ['c4b', 'Initial disclosures custom'], ...dlFields], multi: [['x7', 'Discovery limitations'], ['x16', 'Additional exhibit requirements'], ['x20', 'Additional motion requirements']] },
      { name: 'Other provisions', fields: [['c21', 'Arbitration not requested'], ['c22', 'Alternative dispute resolution'], ['c23', 'Mandatory settlement conference'], ['ma', 'Settlement conference date'], ['mt', 'Settlement conference time'], ['ml', 'Settlement conference location'], ['c24', 'Trial schedule'], ['tj', 'Trial type (1 jury, 2 bench, 0 none)'], ['c25', 'Additional requirements']], multi: [['x25', 'Additional requirements text']] },
      { name: 'Judge or magistrate', fields: [['ojn', 'Judge or magistrate'], ['od', 'Date'], ['ojs', 'Signature']] }
    ]
  }
};