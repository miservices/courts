/* MC 01A-D: Summons, Summons to Entity, Summons to Governmental Entity, and Certificate of Non-Service.
   One module builds all four (make('a'|'b'|'c'|'d')); each form has its own small wrapper file (mc01a.js ...).
   Layout measured from the court's PDFs. */
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
`;

const mid = { a: 'SUMMONS', b: 'SUMMONS TO ENTITY', c: 'SUMMONS TO<br>GOVERNMENTAL ENTITY', d: 'CERTIFICATE OF NON-SERVICE' };
const dflabel = { a: 'Defendant/Respondent’s name and address', b: 'Defendant entity and authorized representative to be served', c: 'Governmental defendant (served upon the Attorney General)', d: 'Defendant/Respondent’s name and address' };
const TITLE = { a: 'Summons', b: 'Summons to Entity', c: 'Summons to Governmental Entity', d: 'Certificate of Non-Service' };

const SERVE = { a: ['p', 's'], b: ['p', 's'], c: ['m'] };   // personal, substituted, MiBRIDGES blocks (each: date, time, zone); publication follows a court order and is not a method of service (MCR 2.301(H))
const panelFor = k => {
  const inp = (id, l, ph = '', f = '') => `<label>${l}</label><input type="text" id="${id}"${ph ? ` placeholder="${ph}"` : ''}${f ? ` data-font="${f}"` : ''}>`;
  const row = (...c) => `<div class="row">${c.map(x => `<div>${x}</div>`).join('')}</div>`;
  const chk = (id, t) => `<div class="chk"><input type="checkbox" id="${id}"> ${t}</div>`;
  const area = (id, l, r = 2, ph = '') => `<label>${l}</label><textarea id="${id}" rows="${r}"${ph ? ` placeholder="${ph}"` : ''}></textarea>`;
  const hdr = `<h2>Header</h2>${row(inp('judge', 'Judge'), inp('caseno', 'Case No.'))}<h2>Parties</h2>${inp('pln', 'Plaintiff/Petitioner’s name', 'e.g. Jane Roe')}${area('pla', 'Plaintiff/Petitioner’s address', 2, 'Street, city, state ZIP')}${inp('dfn', k === 'a' || k === 'd' ? 'Defendant/Respondent’s name' : k === 'b' ? 'Defendant entity' : 'Defendant entity', 'e.g. John Doe')}${area('dfa', k === 'b' ? 'Entity address and authorized representative to be served (from the Department of State registration)' : k === 'c' ? 'Address of the governmental defendant, and the Michigan Attorney General as the person to be served' : 'Defendant/Respondent’s address', 2, 'Street, city, state ZIP')}`;
  if (k === 'd') return hdr + `<h2>Information (process server)</h2>
    ${chk('tp', 'Personal service')}${chk('ts', 'Substituted electronic service')}${chk('tm', 'Service through MiBRIDGES (governmental defendants)')}${chk('to', 'Other')}${area('tot1', 'Other attempt (line 1)', 1)}${area('tot2', 'Other attempt (line 2)', 1)}
    <h2>Reason service could not be completed</h2>${chk('rd', 'Defendant could not be located')}${chk('rm', 'Direct messages to the defendant were unavailable or disabled')}${chk('ra', 'Authorized representative could not be identified')}${chk('rg', 'The Michigan Attorney General could not be served through MiBRIDGES')}${chk('ro', 'Other')}${area('rot1', 'Other reason (line 1)', 1)}${area('rot2', 'Other reason (line 2)', 1)}
    <h2>Additional information</h2>${area('ad1', 'Line 1', 1)}${area('ad2', 'Line 2', 1)}${area('ad3', 'Line 3', 1)}${area('ad4', 'Line 4', 1)}
    <h2>Certificate (process server)</h2>${row(inp('cd', 'Date', '', 'date'), inp('cn', 'Name and title (type or print)', '', 'sig'))}${inp('csig', 'Signature (typed)', '', 'sig')}
    <h2>Return (clerk)</h2>${row(inp('rcv', 'Certificate received by clerk on'), inp('rclk', 'Court clerk (type or print)'))}
    <h2>Order (judge or magistrate)</h2>${chk('oacc', 'The certificate of non-service is accepted and filed')}${chk('orej', 'The certificate of non-service is rejected and shall not be filed because')}${area('orn1', 'Reason (line 1)', 1)}${area('orn2', 'Reason (line 2)', 1)}
    ${chk('ofd', 'The plaintiff shall have ___ additional days to effectuate service')}${inp('oday', 'Additional days')}${chk('oalias', 'An alias summons shall issue upon request of the plaintiff')}${chk('opub', 'Service by publication is ordered (MCR 2.301(H))')}${chk('oalt', 'Alternative service is authorized as follows')}${area('oalt1', 'Alternative service (line 1)', 1)}${area('oalt2', 'Alternative service (line 2)', 1)}
    ${chk('odis', 'The action is dismissed without prejudice for failure to timely effectuate service')}${chk('onfa', 'No further action is required at this time and this action may proceed without summons')}${chk('ooth', 'Other')}${area('ooth1', 'Other (line 1)', 1)}${area('ooth2', 'Other (line 2)', 1)}${area('ooth3', 'Other (line 3)', 1)}${area('ooth4', 'Other (line 4)', 1)}
    ${row(inp('odate', 'Date', '', 'date'), inp('ojname', 'Judge or Magistrate (type or print)', '', 'sig'))}${inp('ojsig', 'Signature (typed)', '', 'sig')}`;
  const blk = (s, t) => `${chk(s + 'chk', t)}${row(inp(s + 'd', 'Date', '', 'date'), inp(s + 't', 'Time'))}${inp(s + 'z', 'Timezone')}`;
  return hdr + `<h2>Civil case</h2>${chk('cv1', 'There is no other pending or resolved civil action arising out of the same transaction or occurrence')}${chk('cv2', 'A civil action between these parties was previously filed')}${row(inp('pcty', 'County'), inp('pcno', 'Case number'))}${inp('pjdg', 'Judge')}
    <select id="pst"><option value="0">— the action: leave unchecked —</option><option value="1">remains pending</option><option value="2">is no longer pending</option></select>
    <h2>Summons (clerk)</h2>${row(inp('iss', 'Issue date'), inp('exp', 'Expiration date'))}${row(inp('clk', 'Court clerk signature (typed)', '', 'sig'), inp('clkn', 'Court clerk (type or print)'))}
    <h2>Proof of service (process server)</h2>
    ${k === 'c' ? blk('m', 'Service through MiBRIDGES upon the Michigan Attorney General') : `${blk('p', 'Personal service')}${k !== 'a' ? inp('pn', 'Authorized representative served (name)') : ''}
    ${blk('s', 'Substituted electronic service')}${k !== 'a' ? inp('sn', 'Authorized representative mentioned (name)') : ''}`}
    ${chk('ackc', 'Acknowledgment of service was returned within 72 hours')}${chk('nonc', 'Non-service (a certificate of non-service, MC 01D, must be filed)')}
    ${inp('fee', 'Service fee assessed ($)')}${row(inp('pname', 'Name and title (type or print)', '', 'sig'), inp('psig', 'Signature (typed)', '', 'sig'))}
    <h2>Acknowledgment of service (optional)</h2>${k !== 'a' ? row(inp('akn2', 'Name', '', 'sig'), inp('akt', 'Title')) : ''}${row(inp('akd', 'Date', '', 'date'), inp('akn', 'Name (type or print)', '', 'sig'))}${inp('aks', 'Signature (typed)', '', 'sig')}`;
};

const hdr = (P, mid, j, c) => `<div class="hd"><div class="h1"><div class="b" style="padding-left:${P(33.5)}">STATE OF MICHIGAN</div>${globalThis.__mcSup ? '<div class="r">IN THE SUPREME COURT</div>' : '<div class="r">THE 7TH DISTRICT COURT FOR</div><div class="r">GENESEE COUNTY</div>'}</div><div class="h2">${mid}</div><div class="h3"><div><b>JUDGE</b><span class="jv">${j}</span></div><div><b>CASE NO.</b><span class="jv">${c}</span></div></div></div>`;
const cell = (l, v) => `<div class="lb">${l}</div><div class="vv">${v}</div>`;
const cbx = (on, key) => `<div class="cb"${key ? ` data-chk="${key}" title="Click to check or uncheck"` : ''}>${on ? '✓' : ''}</div>`;

const NOTICE = {
  a: ['You are being sued. The Plaintiff has filed a complaint against you in this court.',
    'YOU HAVE 7 DAYS after being served with this summons and a copy of the complaint to file and serve a responsive pleading or other permitted response as required by MCR 2.302. If you elected to receive service through MiBRIDGES, you have 10 days. If you <b>execute an acknowledgment of service within 72 hours</b> after service, your time to respond is <b>extended to 10 days</b> (14 days if you have 10).',
    'If you fail to respond within the time allowed, a default judgment may be entered against you for the relief requested in the complaint.',
    'If you have questions regarding your rights or obligations in this action, you should promptly seek legal advice.'],
  b: ['The plaintiff has commenced a civil action against the defendant entity identified above by filing a complaint with this court.',
    '<b>YOU HAVE 7 DAYS</b> after service of this summons and a copy of the complaint upon the defendant entity, through the authorized representative identified in the entity\'s registration records maintained by the Michigan Department of State, to file and serve a responsive pleading or other permitted response as required by MCR 2.302. If the entity elected to receive service through MiBRIDGES, it has 10 days.',
    'Executing an acknowledgment of service on behalf of the defendant entity within 72 hours after service is optional. A timely acknowledgment extends the time to respond from 7 days to 10 days (from 10 days to 14 days). It may be executed electronically through the service link and is automatically filed with the court.',
    'Failure to respond within the time permitted may result in the entry of a default judgment against the defendant entity for the relief requested in the complaint.',
    'If the defendant entity has questions regarding its rights or obligations in this action, it should promptly seek legal advice.'],
  c: ['The plaintiff has commenced a civil action against the governmental defendant identified above by filing a complaint with this court.',
    '<b>YOU HAVE 10 DAYS</b> after service of this summons and a copy of the complaint upon the Michigan Attorney General, as the designated recipient of process for the governmental defendant, through the Michigan Bureaucratic Routing and Intergovernmental Data Exchange System (MiBRIDGES), to file and serve a responsive pleading or other permitted response as required by MCR 2.302.',
    'Executing an acknowledgment of service within 72 hours after service is optional. A timely acknowledgment extends the time to respond from 10 days to 14 days. It may be executed electronically through the service link and is automatically filed with the court.',
    'Failure to respond within the time permitted may result in the entry of a default judgment against the governmental defendant for the relief requested in the complaint.',
    'If the governmental defendant has questions regarding its rights or obligations in this action, it should promptly seek legal advice.']
};
const SERVER = {
  a: '<b>TO PROCESS SERVER:</b> You must serve this summons, together with a copy of the complaint, within 30 days after it was issued (before the expiration date on the summons), and file proof of service with the court. If you are unable to complete service, you must indicate the unsuccessful attempt in the return of service and file a certificate of non-service (MC 01D) as required by MCR 2.301(H). Preserve all records relating to the service for at least 30 days after filing proof of service.',
  b: '<b>TO PROCESS SERVER:</b> You must serve this summons, together with a copy of the complaint, upon the authorized representative named on the summons, as identified in the entity\'s Michigan Department of State registration, within 30 days after it was issued (before the expiration date on the summons), and file proof of service with the court. If you are unable to complete service, you must indicate the unsuccessful attempt in the return of service and file a certificate of non-service (MC 01D) as required by MCR 2.301(H). Preserve all records relating to the service for at least 30 days after filing proof of service.',
  c: '<b>TO PROCESS SERVER:</b> You must serve this summons, together with a copy of the complaint, upon the Michigan Attorney General, exclusively through MiBRIDGES, within 30 days after it was issued (before the expiration date on the summons), and file proof of service with the court. If you are unable to complete service, you must indicate the unsuccessful attempt in the return of service and file a certificate of non-service (MC 01D) as required by MCR 2.301(H). Preserve all records relating to the service for at least 30 days after filing proof of service.'
};
const ACK = {
  b: ['I acknowledge receipt of this summons and a copy of the complaint. I understand that the defendant entity must file and serve a responsive pleading or other permitted response within the time prescribed by MCR 2.302, as extended by this acknowledgment, and that failure to timely respond may result in the entry of a default judgment against the defendant entity. I acknowledge that this acknowledgment confirms receipt only; it is not an admission or denial of any allegation, a waiver of any defense, or consent to the jurisdiction of the court, and it does not relieve the defendant entity of the obligation to respond.', 'certify that I am the authorized representative of the defendant entity identified in this action.'],
  c: ['I acknowledge receipt of this summons and a copy of the complaint. I understand that the governmental defendant must file and serve a responsive pleading or other permitted response within the time prescribed by MCR 2.302, as extended by this acknowledgment, and that failure to timely respond may result in the entry of a default judgment against the governmental defendant. I acknowledge that this acknowledgment confirms receipt only; it is not an admission or denial of any allegation, a waiver of any defense, or consent to the jurisdiction of the court, and it does not relieve the governmental defendant of the obligation to respond.', 'certify that I am the Michigan Attorney General or the Attorney General\'s designee, authorized to receive service on behalf of the governmental defendant identified in this action.']
};

function build(api, k) {
  const { $, P } = api, E = api.ed, seq = [], on = id => { const e = $(id); return !!(e && e.checked); }, sv = id => $(id)?.value;
  const caseHd = `<div class="ch">Case Number: <span class="cu">${E('caseno')}</span></div>`;
  const u = (id, w, o = {}) => `<span class="u" style="min-width:${P(w)}">${E(id, o)}</span>`;
  const chk = (id, inner, cls = '') => `<div class="oo ${cls}">${cbx(on(id), id)}<div class="tx${cls.includes('s') ? ' s' : ''}">${inner}</div></div>`;
  const box = (note, title, g = '') => `<div class="sx ${g}"><div class="sl2">${note}</div><div class="bx">${title}</div></div>`;
  const dtz = (s, lead) => `${lead} ${u(s + 'd', 82)} <i>(date)</i> at ${u(s + 't', 82)} <i>(time)</i> ${u(s + 'z', 120)} <i>(timezone)</i>`;
  const sig = () => `<div class="sg" style="margin-top:${P(8)};align-items:flex-start"><div class="sc" style="margin-left:${P(22)};width:${P(88)}"><div class="sv" style="margin-top:${P(14)}"><div class="in">$ ${E('fee', { ph: '0.00' })}</div></div><div class="sl" style="padding-left:0">Service fee assessed</div></div>
    <div class="sc" style="margin-left:${P(176)};width:${P(219)}"><div class="sv" style="margin-top:${P(14)}"><div class="in">${E('pname', { ph: 'Name and title' })}</div></div><div class="sl" style="padding-left:${P(5)}">Name and title (type or print)</div>
    <div class="sv" style="margin-top:${P(24)}"><div class="in">${E('psig', { pre: '/s/ ' })}</div></div><div class="sl" style="padding-left:${P(5)}">Signature (hand signature or /s/)</div></div></div>`;
  const parties = `<div class="pt"><div class="pa l">${cell('Plaintiff/Petitioner’s name and address', `<div>${E('pln')}</div><div>${E('pla', { multi: true })}</div>`)}</div><div class="pv">v</div><div class="pa rr">${cell(dflabel[k], `<div>${E('dfn')}</div><div>${E('dfa', { multi: true })}</div>`)}</div></div>`;
  seq.push({ html: hdr(P, mid[k], E('judge'), E('caseno')) + parties });

  if (k === 'd') {
    const ln = (id, ph) => `<div class="gl">${E(id, { multi: true, ph })}</div>`;
    seq.push({ html: box('Section to be completed by process server.', 'INFORMATION') + `<div style="margin-top:${P(14)}">I certify that I was provided with a summons and complaint for service in the above-captioned action and, after exercising due diligence, was unable to effectuate service before the expiration of the summons. The following efforts were made to locate and serve the defendant:</div>
      ${chk('tp', 'Personal service (Discord direct message).')}${chk('ts', 'Substituted electronic service (posted in the county Discord server with a mention).')}${chk('tm', 'Service through MiBRIDGES upon the Michigan Attorney General.')}${chk('to', 'Other:')}${ln('tot1', 'Describe')}${ln('tot2', '')}` });
    seq.push({ html: `<div class="b" style="margin-top:${P(24)}">REASONS THOSE EFFORTS WERE UNSUCCESSFUL</div>${chk('rd', 'Defendant could not be located.')}${chk('rm', 'Direct messages to the defendant were unavailable or disabled.')}${chk('ra', 'Authorized representative could not be identified.')}${chk('rg', 'The Michigan Attorney General could not be served through MiBRIDGES.')}${chk('ro', 'Other:')}${ln('rot1', 'Describe')}${ln('rot2', '')}` });
    seq.push({ html: `<div class="b" style="margin-top:${P(24)}">ADDITIONAL INFORMATION</div>${['ad1', 'ad2', 'ad3', 'ad4'].map(i => ln(i, '')).join('')}` });
    seq.push({ pb: 'new', head: caseHd, html: box('Section to be completed by process server.', 'CERTIFICATE') + `<div style="margin-top:${P(14)}">I certify that the foregoing information is true and accurate to the best of my knowledge and that service has not been completed. I understand that, under MCR 2.301(H)(3), the filing of this certificate constitutes the plaintiff's implied consent to an order directing service by publication.</div>
      <div class="sg" style="margin-top:${P(46)};align-items:flex-start"><div class="sc" style="margin-left:${P(17)};width:${P(109)}"><div class="sv"><div class="in">${E('cd')}</div></div><div class="sl">Date</div></div>
      <div class="sc" style="margin-left:${P(176)};width:${P(219)}"><div class="sv"><div class="in">${E('cn', { ph: 'Name and title' })}</div></div><div class="sl">Name and title (type or print)</div>
      <div class="sv" style="margin-top:${P(42)}"><div class="in">${E('csig', { pre: '/s/ ' })}</div></div><div class="sl">Signature (hand signature or /s/)</div></div></div>` });
    seq.push({ html: box('Return section to be completed by clerk.', 'RETURN') + `<div class="tb" style="height:${P(48)};margin-top:${P(12)}"><div style="width:${P(135)}"><div class="lb">Certificate received by clerk on:</div><div class="vv">${E('rcv')}</div></div><div style="flex:1"><div class="lb">Court clerk (type or print)</div><div class="vv">${E('rclk')}</div></div></div>` });
    const g2 = (id, ph) => `<div class="gl" style="margin-left:${P(7)}">${E(id, { multi: true, ph })}</div>`;
    seq.push({ pb: 'new', head: caseHd, html: box('Order section to be completed by judge/magistrate.', 'ORDER') + `<div class="b" style="margin-top:${P(12)}">IT IS ORDERED:</div>
      ${chk('oacc', 'The certificate of non-service is accepted and filed.')}${chk('orej', 'The certificate of non-service is rejected and shall not be filed because:')}${g2('orn1', 'Reason')}${g2('orn2', '')}
      <div class="b" style="margin-top:${P(24)}">IT IS FURTHER ORDERED:</div>
      <div style="margin-top:${P(4)}">${chk('opub', 'Service by publication is ordered under MCR 2.301(H). The defendant\'s name and known identifying information shall be entered in the publication notice registry at www.migovt.org/courts/service/publications/ and announced in the Discord server in which this action is pending.')}${chk('ofd', `The plaintiff shall have ${u('oday', 40)} additional days from the date of this order to effectuate service.`)}${chk('oalias', 'An alias summons shall issue upon request of the plaintiff.')}${chk('oalt', 'Alternative service is authorized as follows:')}</div>${g2('oalt1', 'Alternative service')}${g2('oalt2', '')}
      <div style="margin-top:${P(18)}">${chk('odis', 'The action is dismissed without prejudice for failure to timely effectuate service.')}${chk('onfa', 'No further action is required at this time and this action may proceed without summons.')}${chk('ooth', 'Other:')}</div>${['ooth1', 'ooth2', 'ooth3', 'ooth4'].map(i => g2(i, i === 'ooth1' ? 'Other' : '')).join('')}
      <div class="b" style="margin-top:${P(24)};padding-left:${P(5)}">IT IS SO ORDERED.</div>
      <div class="sg" style="margin-top:${P(34)};align-items:flex-start"><div class="sc" style="margin-left:${P(3)};width:${P(100)}"><div class="sv"><div class="in">${E('odate')}</div></div><div class="sl">Date</div></div>
      <div class="sc" style="margin-left:${P(186)};width:${P(219)}"><div class="sv"><div class="in">${E('ojname', { ph: 'Judge or Magistrate' })}</div></div><div class="sl">Judge or Magistrate (type or print)</div>
      <div class="sv" style="margin-top:${P(46)}"><div class="in">${E('ojsig', { pre: '/s/ ' })}</div></div><div class="sl">Signature</div></div></div>` });
    return seq;
  }
  /* summons forms */
  const civ = `<div class="b" style="margin-top:${P(12)}">Civil Case</div>${chk('cv1', 'There is no other pending or resolved civil action arising out of the same transaction or occurrence as alleged in the complaint.')}
    <div class="oo" style="margin-top:${P(2)}">${cbx(on('cv2'), 'cv2')}<div class="tx">A civil action between these parties or other parties arising out of the transaction or occurrence alleged in the complaint has been previously filed in ${u('pcty', 80)} County District Court where it was given case number ${u('pcno', 80)} and assigned to Judge ${u('pjdg', 112)}. The action:</div></div>
    <div class="oo in1" style="margin-left:${P(36)};margin-top:${P(1)}" data-sel="pst=1" title="Click to choose this">${cbx(sv('pst') === '1')}<div class="tx">remains pending.</div></div><div class="oo" style="margin-left:${P(36)}" data-sel="pst=2" title="Click to choose this">${cbx(sv('pst') === '2')}<div class="tx">is no longer pending.</div></div>
`;
  seq.push({ html: civ });
  seq.push({ html: box('Summons section to be completed by clerk.', 'SUMMONS') + `<div style="margin-top:${P(10)}"><b>NOTICE TO THE DEFENDANT:</b> In the name of the people of the State of Michigan${k === 'a' ? ',' : ''} you are notified:</div>
    <div class="np">${NOTICE[k].map((t, i) => `<div><span>${i + 1}.</span><span>${t}</span></div>`).join('')}</div>` });
  seq.push({ html: `<div class="tb" style="height:${P(76)}"><div style="width:${P(127)}"><div class="lb">Issue date</div><div class="vv">${E('iss')}</div></div><div style="width:${P(127)}"><div class="lb">Expiration date</div><div class="vv">${E('exp')}</div></div><div style="flex:1"><div class="lb">Court clerk (signature)</div><div class="vv">${E('clk', { pre: '/s/ ' })}</div><div class="lb" style="margin-top:${P(2)}">${E('clkn')}</div></div></div>` });
  /* proof of service */
  const intro = `<div style="margin-top:${P(14)}">I certify that I have served the summons and complaint in this action in full compliance with the requirements of MCR 2.301, and that service was effectuated by the method specified below.</div>`;
  const dt = p => `${u(p + 'd', 82)} <i>(date)</i> at ${u(p + 't', 82)} <i>(time)</i> ${u(p + 'z', 130)} <i>(timezone)</i>`;
  const pers = k === 'a' ? `<b>PERSONAL SERVICE.</b> Service was made by Discord direct message to the defendant, with the statement required by MCR 2.301(D) and a link to each document served, on ${dt('p')}.`
    : `<b>PERSONAL SERVICE.</b> Service was made by Discord direct message, with the statement required by MCR 2.301(D) and a link to each document served, to ${u('pn', 124)} <i>(name)</i>, the authorized representative identified in the entity's Michigan Department of State registration, on ${dt('p')}.`;
  const subs = k === 'a' ? `<b>SUBSTITUTED ELECTRONIC SERVICE.</b> Service was made by posting the service notice, a link to each document served, and a direct mention of the defendant in the Discord server designated for the county, on ${dt('s')}, because direct messaging was unavailable or prevented.`
    : `<b>SUBSTITUTED ELECTRONIC SERVICE.</b> Service was made by posting the service notice, a link to each document served, and a direct mention of ${u('sn', 124)} <i>(name)</i>, the authorized representative, in the Discord server designated for the county, on ${dt('s')}, because direct messaging was unavailable or prevented.`;
  const mib = `<b>SERVICE THROUGH MiBRIDGES.</b> Service was made upon the Michigan Attorney General, as the designated recipient of process for the governmental defendant, exclusively through the Michigan Bureaucratic Routing and Intergovernmental Data Exchange System (MiBRIDGES), on ${dt('m')}.`;
  const ack = '<b>ACKNOWLEDGMENT OF SERVICE.</b> An acknowledgment of service was executed within 72 hours after service.';
  const non = `<b>NON-SERVICE.</b> I was unable to complete service upon the defendant${k === 'a' ? '' : k === 'b' ? ' entity' : ' entity'} after due diligence. I will file a certificate of non-service (form MC 01D) with the court as required by MCR 2.301(H).`;
  const pos = (id, t, cl = '') => `<div class="oo pos${cl ? ' s' : ''}">${cbx(on(id), id)}<div class="tx ${cl}">${t}</div></div>`;
  const posHtml = box('Section to be completed by process server.', 'PROOF OF SERVICE') + intro
    + `<div style="margin-top:${P(5)}">${k === 'c' ? pos('mchk', mib) : pos('pchk', pers) + pos('schk', subs)}${pos('ackc', ack, 's')}${pos('nonc', non, 's')}</div>` + sig();
  const ackHtml = box('Section to be completed optionally.', 'ACKNOWLEDGMENT OF SERVICE', 'g') + (k === 'a'
    ? `<div style="margin-top:${P(14)}">I acknowledge that I have received service of this summons and a copy of the complaint in this action. I understand that I am being sued and that I am required to file and serve a responsive pleading or other permitted response within the time prescribed by MCR 2.302, as extended by this acknowledgment, and that failure to timely respond may result in the entry of a default judgment against me for the relief requested in the complaint. I acknowledge that this acknowledgment confirms receipt only; it is not an admission or denial of any allegation, a waiver of any defense, or consent to the jurisdiction of the court, and it does not relieve me of the obligation to respond.</div>`
    : `<div style="margin-top:${P(14)}">I, ${u('akn2', 160)}, <i>(name)</i>, serving as ${u('akt', 160)} <i>(title)</i>, ${ACK[k][1]}</div><div style="margin-top:${P(10)}">${ACK[k][0]}</div>`)
    + `<div class="tb" style="height:${P(40)}"><div style="width:${P(88)}"><div class="lb">Date</div><div class="vv">${E('akd')}</div></div><div style="width:${P(169)}"><div class="lb">Name (type or print)</div><div class="vv">${E('akn')}</div></div><div style="flex:1"><div class="lb">Signature (hand signature or /s/)</div><div class="vv">${E('aks', { pre: '/s/ ' })}</div></div></div>`;
  /* page 2: the service notice and the optional acknowledgment; last page: the proof of service */
  const svcHtml = box('Service section not to be altered.', 'SERVICE') + (k === 'a' ? `<div style="margin-top:${P(10)}"><b>TO DEFENDANT:</b> Executing the acknowledgment of service is optional. You may execute it electronically through the service link within 72 hours after service, and it is then filed with the court automatically. A timely acknowledgment extends your time to respond from 7 days to 10 days (from 10 days to 14 days if you are served through MiBRIDGES). It does not admit or deny anything in the complaint.</div><div style="margin-top:${P(11)}">${SERVER.a}</div>` : `<div style="margin-top:${P(10)}">${SERVER[k]}</div>`);
  seq.push({ pb: 'new', head: caseHd, html: svcHtml });
  seq.push({ html: ackHtml });
  seq.push({ pb: 'new', head: caseHd, html: posHtml });
  return seq;
}

export const make = k => {
  return {
    id: 'mc01' + k, number: 'MC 01' + k.toUpperCase(), title: TITLE[k], footer: 'MC 01' + k.toUpperCase(),
    css, panel: panelFor(k), usable: U => 684 * U, build: api => build(api, k),
    fromCase: c => ({ pln: plaintiffs(c).join(', '), dfn: defendants(c).join(', ') }),
    contHeader: api => `<div class="ch">Case Number: <span class="cu">${api.ed('caseno')}</span></div>`,
    courtKeys: k === 'd' ? ['rcv', 'rclk', 'oacc', 'orej', 'orn1', 'orn2', 'opub', 'ofd', 'oday', 'oalias', 'oalt', 'oalt1', 'oalt2', 'odis', 'onfa', 'ooth', 'ooth1', 'ooth2', 'ooth3', 'ooth4', 'odate', 'ojname', 'ojsig'] : ['iss', 'exp', 'clk', 'clkn'],
    courtNote: k === 'd' ? 'The return and order sections are completed by the clerk and by the judge or magistrate.' : 'The issue date, expiration date and clerk are completed by the court.',
    roles: k === 'd' ? [
      { id: 'server', label: 'Process server', fill: (api, w) => ({ cn: w.name, csig: w.name, cd: w.today }) },
      { id: 'clerk', label: 'Court clerk', for: /clerk/i, fill: (api, w) => ({ rclk: w.name, rcv: w.today }) },
      { id: 'judge', label: 'Judge or magistrate', for: /judge|magistrate|justice/i, fill: (api, w) => ({ ojname: w.name, ojsig: w.name, odate: w.today }) }
    ] : [
      { id: 'clerk', label: 'Court clerk issuing the summons', for: /clerk/i, fill: (api, w) => ({ clk: w.name, clkn: w.name, iss: w.today }) },
      { id: 'server', label: 'Process server', fill: (api, w) => ({ pname: w.name, psig: w.name }) }
    ],
    md: { title: TITLE[k], malias: { 'plaintiff/petitioner name and address': 'pl', 'defendant/respondent name and address': 'df' },
      sections: k === 'd' ? [
        { name: 'Case', fields: [['judge', 'Judge'], ['caseno', 'Case No.'], ['pln', 'Plaintiff/Petitioner name'], ['dfn', 'Defendant/Respondent name']], multi: [['pla', 'Plaintiff/Petitioner address'], ['dfa', 'Defendant/Respondent address']] },
        { name: 'Information', fields: [['tp', 'Personal service'], ['ts', 'Substituted electronic service'], ['tm', 'Service through MiBRIDGES'], ['to', 'Other attempt'], ['rd', 'Defendant could not be located'], ['rm', 'Direct messages unavailable or disabled'], ['ra', 'Authorized representative could not be identified'], ['rg', 'Attorney General could not be served through MiBRIDGES'], ['ro', 'Other reason']], multi: [['tot1', 'Other attempt, line 1'], ['tot2', 'Other attempt, line 2'], ['rot1', 'Other reason, line 1'], ['rot2', 'Other reason, line 2'], ['ad1', 'Additional information, line 1'], ['ad2', 'Additional information, line 2'], ['ad3', 'Additional information, line 3'], ['ad4', 'Additional information, line 4']] },
        { name: 'Certificate', fields: [['cd', 'Certificate date'], ['cn', 'Name and title'], ['csig', 'Signature'], ['rcv', 'Certificate received by clerk on'], ['rclk', 'Court clerk']] },
        { name: 'Order', fields: [['oacc', 'Certificate accepted and filed'], ['orej', 'Certificate rejected'], ['opub', 'Service by publication ordered'], ['ofd', 'Additional days to effectuate service'], ['oday', 'Number of additional days'], ['oalias', 'Alias summons shall issue'], ['oalt', 'Alternative service authorized'], ['odis', 'Action dismissed without prejudice'], ['onfa', 'No further action required'], ['ooth', 'Other order'], ['odate', 'Order date'], ['ojname', 'Judge or magistrate'], ['ojsig', 'Signature']], multi: [['orn1', 'Rejected because, line 1'], ['orn2', 'Rejected because, line 2'], ['oalt1', 'Alternative service, line 1'], ['oalt2', 'Alternative service, line 2'], ['ooth1', 'Other, line 1'], ['ooth2', 'Other, line 2'], ['ooth3', 'Other, line 3'], ['ooth4', 'Other, line 4']] }
      ] : [
        { name: 'Case', fields: [['judge', 'Judge'], ['caseno', 'Case No.'], ['pln', 'Plaintiff/Petitioner name'], ['dfn', 'Defendant name']], multi: [['pla', 'Plaintiff/Petitioner address'], ['dfa', 'Defendant address']] },
        { name: 'Civil case', fields: [['cv1', 'No other pending or resolved civil action'], ['cv2', 'Civil action previously filed'], ['pcty', 'Previously filed in County'], ['pcno', 'Previous case number'], ['pjdg', 'Previous judge'], ['pst', 'The action (0 none, 1 remains pending, 2 no longer pending)']] },
        { name: 'Summons', fields: [['iss', 'Issue date'], ['exp', 'Expiration date'], ['clk', 'Court clerk signature'], ['clkn', 'Court clerk']] },
        { name: 'Proof of service', fields: [...SERVE[k].flatMap(s => [[s + 'chk', { p: 'Personal service', s: 'Substituted electronic service', m: 'Service through MiBRIDGES' }[s]], [s + 'd', { p: 'Personal service date', s: 'Substituted service date', m: 'MiBRIDGES service date' }[s]], [s + 't', { p: 'Personal service time', s: 'Substituted service time', m: 'MiBRIDGES service time' }[s]], [s + 'z', { p: 'Personal service timezone', s: 'Substituted service timezone', m: 'MiBRIDGES service timezone' }[s]]]), ...(k === 'b' ? [['pn', 'Authorized representative served'], ['sn', 'Authorized representative mentioned']] : []), ['ackc', 'Acknowledgment returned'], ['nonc', 'Non-service'], ['fee', 'Service fee assessed'], ['pname', 'Name and title'], ['psig', 'Signature']] },
        { name: 'Acknowledgment of service', fields: [...(k !== 'a' ? [['akn2', 'Acknowledging name'], ['akt', 'Acknowledging title']] : []), ['akd', 'Date'], ['akn', 'Name'], ['aks', 'Signature']] }
      ] }
  };
};
export default make('a');