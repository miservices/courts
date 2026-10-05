/* MC 200A: Criminal Complaint and Affidavit of Probable Cause.
   Page layout, fields, and Markdown mapping are taken from the original standalone generator.
   Everything the shared engine needs is in the default export at the bottom. */

const css = ({ U, P, B }) => `
.page{width:816px;height:1056px;position:relative;overflow:hidden;background:#fff;margin:0 auto 16px;box-shadow:0 1px 6px rgba(0,0,0,.25);padding:${P(35)} ${P(49)} 0;font-family:Arial,Helvetica,sans-serif;color:#000;font-size:${P(9.6)};line-height:${P(14)}}
.page *{box-sizing:border-box}
.pc{width:${P(497.5)}}
.foot{position:absolute;left:0;right:0;top:${P(723.5)};text-align:center;font-weight:bold;font-size:${P(7.5)};line-height:${P(11)}}
.b{font-weight:bold}.r{text-align:right}.c{text-align:center}
.hd{display:flex;width:${P(497.5)};height:${P(44.5)};margin-top:${P(2)};border-top:${B} solid #000;border-bottom:${B} solid #000}
.h1{width:${P(165)};border-right:${B} solid #000;padding:${P(6.5)} ${P(5)} 0 0;line-height:${P(11.3)}}
.h2{width:${P(165)};border-right:${B} solid #000;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;font-weight:bold;line-height:${P(13)}}
.h3{flex:1;padding:${P(10.5)} 0 0 ${P(6.5)};line-height:${P(11.5)}}
.jv{margin-left:${P(6)};font-weight:normal}
.pt{display:flex;width:${P(492.5)};border-bottom:${B} solid #000;margin-top:${P(16.5)};min-height:${P(71.5)}}
.pt .c1,.pt .c3,.pt .c4{border-top:${B} solid #000}
.pt>div{border-right:${B} solid #000}.pt>div:last-child{border-right:0}
.pt .c1{width:${P(136)};flex:none;display:flex;align-items:center;justify-content:center;text-align:center;font-weight:bold;line-height:${P(11)}}
.pt .c2{width:${P(16)};flex:none;display:flex;align-items:center;justify-content:center;font-weight:bold}
.pt .c3{width:${P(217)};flex:none;padding-left:${P(5)}}
.pt .c4{flex:1;display:flex;flex-direction:column}
.pt .c4>div{min-height:${P(35.5)};padding-left:${P(5)}}.pt .c4>div:first-child{border-bottom:${B} solid #000}
.lb{font-size:${P(7.7)};line-height:${P(9)};padding-top:${P(5.5)}}
.vv{line-height:${P(12)};margin-top:${P(4.5)};padding-bottom:${P(5)};white-space:pre-wrap;word-wrap:break-word}
.cd{width:${P(492.5)};min-height:${P(32.5)};padding-left:${P(5)}}.cd .lb{padding-top:${P(7.5)}}
.cr{display:flex;width:${P(492.5)};border-top:${B} solid #000;border-bottom:${B} solid #000;min-height:${P(35)}}
.cr>div{padding-left:${P(5)}}.cr>div:nth-child(1){width:${P(152)};border-right:${B} solid #000}.cr>div:nth-child(2){width:${P(217)};border-right:${B} solid #000}.cr>div:nth-child(3){flex:1}
.wt{width:${P(492.5)};border-bottom:${B} solid #000;min-height:${P(66)};padding:${P(11)} 0 ${P(6)} ${P(5)}}
.ip{width:${P(496)};padding:${P(11.5)} 0 0 ${P(1)}}
.cn{width:${P(496)};padding:${P(20)} 0 0 ${P(1)}}.cn0{padding-top:${P(16)}}
.ct{font-weight:bold;line-height:${P(12)}}
.cx{margin-top:${P(1.75)};line-height:${P(16.5)}}
.sr{display:flex;align-items:stretch;margin-top:${P(37)}}
.sc{flex:none;display:flex;flex-direction:column}
.sv{flex:1 1 auto;display:flex;align-items:flex-end;min-height:${P(14)};line-height:${P(14)};border-bottom:${B} solid #000;text-align:center;overflow:hidden;white-space:nowrap}
.sv .in{flex:1;min-width:0}
.lf{text-align:left;padding-left:${P(5)}}
.sl{font-size:${P(7.7)};line-height:${P(9)};padding:${P(5.5)} 0 0 ${P(5)}}
.dc{width:${P(496)};padding:${P(20)} 0 0 ${P(1)};font-size:${P(6.8)};line-height:${P(10)}}
.ch{width:${P(497.5)};text-align:right;font-weight:bold;line-height:${P(12)};height:${P(12)}}
.u{display:inline-block;min-width:${P(85)};border-bottom:${B} solid #000;text-align:center;font-weight:normal;line-height:${P(11)}}
.or{display:flex;align-items:center;height:${P(22)};margin-top:${P(26)}}
.or .cap{width:${P(209)};padding-left:${P(5)};font-size:${P(7.5)}}
.or .ob{width:${P(80)};height:${P(22)};border:${B} solid #333;text-align:center;font-weight:bold;font-size:${P(10.5)};line-height:${P(19.5)}}
.oo{display:flex;align-items:center;height:${P(19.5)};white-space:nowrap}
.cb{width:${P(10)};height:${P(10)};border:${B} solid #333;border-radius:2px;flex:none;text-align:center;font-size:${P(10)};line-height:${P(8)};margin:0 ${P(5)} 0 ${P(2)}}
.ol{height:0;border-top:${B} solid #000}
.oi{display:flex;align-items:flex-start;min-height:${P(18.5)}}
.oi .cb{margin-top:${P(4.25)}}.oi .tx{padding-top:${P(2.25)};white-space:pre-wrap;word-wrap:break-word;flex:1}
.ap{width:${P(496)};padding-left:${P(1)}}
.nv{width:${P(492)};padding-left:${P(1)};white-space:pre-wrap;word-wrap:break-word}
.at{display:flex;width:${P(493)};border:${B} solid #000;margin-top:${P(26)};min-height:${P(35)}}
.at>div{padding-left:${P(5)};border-right:${B} solid #000}.at>div:last-child{border-right:0}
.at>div:nth-child(1){width:${P(179)}}.at>div:nth-child(2){width:${P(95)}}.at>div:nth-child(3){width:${P(53)}}.at>div:nth-child(4){flex:1}
.ad{display:flex;margin-top:${P(21)}}
`;

const panel = `
 <h2>Header</h2>
 <div class="row"><div><label>Judge</label><input type="text" id="judge"></div><div><label>Case No.</label><input type="text" id="caseno"></div></div>
 <label>Defendant's full name</label><input type="text" id="def">
 <label>Victim or complainant</label><input type="text" id="victim">
 <label>Complaining witness</label><input type="text" id="cw">
 <label>Co-defendant(s) (if known)</label><input type="text" id="codef">
 <div class="row"><div><label>City/Twp/Village</label><input type="text" id="city" value="City of Flint"></div><div><label>County</label><input type="text" id="county" value="Genesee County"></div></div>
 <label>Date: on or about</label><input type="text" id="date" placeholder="e.g. 09/28/2026">
 <label>Witnesses</label><textarea id="wit" rows="2"></textarea>

 <h2>Counts</h2>
 <div id="counts"></div>
 <button class="btn outline" id="addc" type="button">+ Add count</button>

 <h2>Complaint signatures</h2>
 <div class="row"><div><label>Date (witness)</label><input type="text" id="d1" data-font="std"></div><div><label>Date (prosecutor)</label><input type="text" id="d2" data-font="std"></div></div>
 <label>Complaining witness' signature (typed)</label><input type="text" id="sig1" data-font="std">
 <label>Prosecutor's signature (typed)</label><input type="text" id="sig2" data-font="std">

 <h2>Order (judge / magistrate)</h2>
 <label>Order</label>
 <select id="ordsel"><option value="0">— leave unchecked —</option><option value="1">1. Accepted – warrant shall issue</option><option value="2">2. Accepted – summons shall issue</option><option value="3">3. Rejected – no probable cause</option></select>
 <div class="row"><div><label>Date</label><input type="text" id="od" data-font="judge"></div><div><label>Name (type or print)</label><input type="text" id="jname" data-font="judge"></div></div>
 <label>Signature (typed)</label><input type="text" id="jsig" data-font="judge">

 <h2>Affidavit of probable cause</h2>
 <label>Affiant name</label><input type="text" id="aff">
 <label>The defendant did the following</label><textarea id="narr" rows="8"></textarea>
 <label>Facts are based upon</label>
 <div class="chk"><input type="checkbox" id="b1"> My personal observations</div>
 <div class="chk"><input type="checkbox" id="b2"> Statements by witnesses or victims</div>
 <div class="chk"><input type="checkbox" id="b3"> Physical evidence</div>
 <div class="chk"><input type="checkbox" id="b4"> Records or documents</div>
 <div class="chk"><input type="checkbox" id="b5"> Other</div>
 <textarea id="other" rows="2" placeholder="Other (describe)"></textarea>
 <div class="row"><div><label>Agency</label><input type="text" id="agency"></div><div><label>Title</label><input type="text" id="title"></div></div>
 <div class="row"><div><label>Badge No.</label><input type="text" id="badge"></div><div><label>Name (type or print)</label><input type="text" id="aname"></div></div>
 <div class="row"><div><label>Date</label><input type="text" id="d3"></div><div><label>Electronic signature (/s/)</label><input type="text" id="esig"></div></div>
`;

const hdr=(P,B,mid,j,c)=>`<div class="hd"><div class="h1"><div class="b" style="padding-left:${P(33.5)}">STATE OF MICHIGAN</div><div class="r">THE DISTRICT COURT FOR</div><div class="r">GENESEE COUNTY</div></div><div class="h2">${mid}</div><div class="h3"><div><b>JUDGE</b><span class="jv">${j}</span></div><div><b>CASE NO.</b><span class="jv">${c}</span></div></div></div>`;
const cell=(l,v)=>`<div class="lb">${l}</div><div class="vv">${v}</div>`;
const blank=(v,b)=>v||b;
const cb=(on,key)=>`<div class="cb"${key?` data-chk="${key}" title="Click to check or uncheck"`:''}>${on?'✓':''}</div>`;


function build(api){
 const {$,qa,P,B,esc}=api, V=api.val, E=api.ed;
 const seq=[];
 /* page 1: complaint */
 seq.push({html:hdr(P,B,'CRIMINAL COMPLAINT',E('judge'),E('caseno'))});
 seq.push({html:`<div class="pt"><div class="c1">THE PEOPLE OF THE<br>STATE OF MICHIGAN</div><div class="c2">v</div>
   <div class="c3">${cell('Defendant’s full name',E('def'))}</div>
   <div class="c4"><div>${cell('Victim or complainant',E('victim'))}</div><div>${cell('Complaining witness',E('cw'))}</div></div></div>
   <div class="cd">${cell('Co-defendant(s) (if known)',E('codef'))}</div>
   <div class="cr"><div>${cell('City/Twp/Village',E('city'))}</div><div>${cell('County',E('county'))}</div><div>${cell('Date: on or about',E('date'))}</div></div>
   <div class="wt"><div class="lb" style="padding-top:${P(5)}">Witnesses:</div><div class="vv" style="padding-bottom:0">${E('wit',{multi:true})}</div></div>`});
 seq.push({html:`<div class="ip">The complaining witness, upon a sworn complaint, states that on or about the date range provided above, in Genesee County, Michigan, the defendant, did:</div>`});
 [...qa('.cnt')].forEach((c,i)=>{
  const e=(k,blank,style)=>E('@'+i+'.'+k,{blank,style});
  seq.push({html:`<div class="cn ${i?'':'cn0'}"><div class="ct">COUNT ${i+1}: ${e('ch','[CHARGE NAME]','text-transform:uppercase')}</div><div class="cx">${e('cl','[CLASSIFICATION]')}: punishable by imprisonment for not more than ${e('mi','___')} minutes ${e('se','___')} seconds, or a fine of not more than $${e('fi','______')} or both.</div></div>`});
 });
 seq.push({html:`<div class="ip" style="padding-top:${P(37)}">The complaining witness asks that the defendant be apprehended and dealt with according to law.</div>
  <div class="sr"><div class="sc" style="width:${P(98)}"><div class="sv lf"><div class="in">${E('d1')}</div></div><div class="sl">Date</div></div><div class="sc" style="margin-left:${P(199)};width:${P(99)}"><div class="sv lf"><div class="in">${E('d2')}</div></div><div class="sl">Date</div></div></div>
  <div class="sr" style="margin-top:${P(35.5)}"><div class="sc" style="width:${P(197)}"><div class="sv lf"><div class="in">${E('sig1',{pre:'/s/ '})}</div></div><div class="sl">Complaining witness’ signature</div></div><div class="sc" style="margin-left:${P(100)};width:${P(196)}"><div class="sv lf"><div class="in">${E('sig2',{pre:'/s/ '})}</div></div><div class="sl">Prosecutor’s signature</div></div></div>
  <div class="dc">The complaining witness and prosecuting authority declare under the penalties of perjury that they have examined this document and that its contents are true to the best of their information, knowledge, and belief.</div>`});

 /* order page */
 const sel=$('ordsel').value;
 const oo=(n,t)=>`<div class="oo" data-sel="ordsel=${n}" title="Click to choose this order">${cb(sel==n)}<div>${n}. ${t}</div></div>`;
 seq.push({pb:'cont',html:`<div class="or"><div class="cap">Order section to be completed by judge/magistrate.</div><div class="ob">ORDER</div></div>
  <div class="b" style="margin-top:${P(12)};line-height:${P(12)}">IT IS ORDERED:</div>
  <div style="margin-top:${P(4.25)}">${oo(1,'The complaint is <b>ACCEPTED</b>. A warrant shall issue for the arrest of the defendant.')}${oo(2,'The complaint is <b>ACCEPTED</b>. A summons shall issue requiring the defendant to appear before the court.')}${oo(3,'The criminal complaint is <b>REJECTED</b> because probable cause has not been established.')}</div>
  <div class="sr" style="margin-top:${P(72)}"><div class="sc" style="margin-left:${P(3)};width:${P(98)}"><div class="sv lf"><div class="in">${E('od')}</div></div><div class="sl">Date</div></div><div class="sc" style="margin-left:${P(182)};width:${P(213)}"><div class="sv lf"><div class="in">${E('jname')}</div></div><div class="sl">Judge or Magistrate (type or print)</div></div></div>
  <div class="sr" style="margin-top:${P(41.5)}"><div class="sc" style="margin-left:${P(283)};width:${P(213)}"><div class="sv lf"><div class="in">${E('jsig',{pre:'/s/ '})}</div></div><div class="sl">Signature</div></div></div>`});

 /* blank page */
 seq.push({pb:'blank',html:`<div class="c" style="padding-top:${P(314)}"><div class="b" style="font-size:${P(19.4)};line-height:${P(22)}">THIS PAGE IS INTENTIONALLY LEFT BLANK</div><div style="margin-top:${P(20.5)};font-size:${P(11.8)};line-height:${P(15)}">COMPLAINT ON PREVIOUS PAGE(S)<br>AFFIDAVIT OF PROBABLE CAUSE ON NEXT PAGE(S)</div></div>`});

 /* affidavit */
 const nm=E('aff',{blank:'________________________________________'});
 seq.push({pb:'new',html:hdr(P,B,'AFFIDAVIT OF<br>PROBABLE CAUSE',E('judge'),E('caseno'))});
 seq.push({html:`<div class="ap" style="padding-top:${P(14.5)}">I, ${nm}, being first duly sworn (or declaring under penalty of perjury), state as follows:</div>
  <div class="ap" style="padding-top:${P(9)}">I am the complaining witness in this matter and have personal knowledge of the facts contained in this affidavit of probable cause, except those facts stated upon information and belief, which I believe to be true.</div>`});
 seq.push({txt:$('narr').value.replace(/\r/g,''),make:(t,first)=>(first?`<div class="ap b" style="padding-top:${P(14)}">The defendant, on the date and at the location described, did the following:</div>`:'')+`<div class="nv" style="${first?`margin-top:${P(6)};min-height:${P(28)}`:''}">${api.edt('narr',t,{ph:'The defendant did the following'})}</div>`});
 const it=(n,t,extra)=>`<div class="oi">${cb($('b'+n).checked,'b'+n)}<div class="tx">${n}. ${t}${extra||''}</div></div>`;
 const oth=E('other',{multi:true,ph:'Other basis'});
 seq.push({html:`<div class="ap b" style="padding-top:${P(24)}">The facts contained in this affidavit are based upon: <span style="font-size:${P(7.5)};font-weight:normal">(select all that apply)</span></div>
  <div style="margin-top:${P(3.75)}">${it(1,'My personal observations.')}${it(2,'Statements made by witnesses or victims.')}${it(3,'Physical evidence.')}${it(4,'Records or documents.')}${it(5,'Other: ',oth)}</div>
  <div class="at"><div><div class="lb">Agency</div><div class="vv">${E('agency')}</div></div><div><div class="lb">Title</div><div class="vv">${E('title')}</div></div><div><div class="lb">Badge No.</div><div class="vv">${E('badge')}</div></div><div><div class="lb">Name (type or print)</div><div class="vv">${E('aname')}</div></div></div>
  <div class="ad"><div style="width:${P(208)};padding-left:${P(5)};font-size:${P(7.5)};line-height:${P(9.3)};padding-top:${P(0)}">I declare under the penalties of perjury that this affidavit has been examined by me and that its contents are true to the best of my information, knowledge and belief.</div>
   <div class="sc" style="margin-left:${P(25)};width:${P(70)}"><div class="sv lf"><div class="in">${E('d3')}</div></div><div class="sl">Date</div></div>
   <div class="sc" style="margin-left:${P(26)};width:${P(162)}"><div class="sv" style="text-align:left;padding-left:${P(6)}"><div class="in">${E('esig',{pre:'/s/ '})}</div></div><div class="sl" style="padding-left:${P(6)}">Affiant electronic signature</div></div></div>`});
 return seq;
}

/* Repeating counts */
function addCount(api) {
  const d = document.createElement('div'); d.className = 'cnt';
  d.innerHTML = `<div class="top"><b class="cn-n"></b><button type="button" class="rm">Remove</button></div>
 <label>Charge name</label><input type="text" class="f-ch">
 <label>Classification (e.g. Misdemeanor)</label><input type="text" class="f-cl">
 <div class="row r3"><div><label>Minutes</label><input type="text" class="f-mi"></div><div><label>Seconds</label><input type="text" class="f-se"></div><div><label>Fine $</label><input type="text" class="f-fi"></div></div>`;
  d.querySelector('.rm').onclick = () => { d.remove(); numberCounts(api); api.render(); };
  api.$('counts').appendChild(d); numberCounts(api); return d;
}
function numberCounts(api) { const l = api.qa('.cnt'); l.forEach((c, i) => { c.querySelector('.cn-n').textContent = 'Count ' + (i + 1); c.querySelector('.rm').style.display = l.length > 1 ? '' : 'none'; }); }
const CNT = [['ch', 'Charge name'], ['cl', 'Classification'], ['mi', 'Minutes'], ['se', 'Seconds'], ['fi', 'Fine']];

export default {
  id: 'mc200a', number: 'MC 200A', title: 'Criminal Complaint and Affidavit of Probable Cause', footer: 'MC 200A',
  css, panel,
  init(api) { addCount(api); api.$('addc').onclick = () => { addCount(api); api.render(); }; },
  contHeader: api => `<div class="ch">Case Number: <span class="u">${api.ed('caseno')}</span></div>`,
  resolve: (api, k) => { const m = /^(\d+)\.(\w+)$/.exec(k); return m && api.qa('.cnt')[+m[1]]?.querySelector('.f-' + m[2]); },
  build,
  roles: [
    { id: 'cw', label: 'Complaining witness', fill: (api, w) => ({ cw: w.name, sig1: w.name, d1: w.today }) },
    { id: 'affiant', label: 'Affiant', hint: 'usually the complaining witness too', fill: (api, w) => ({ aff: w.name, aname: w.name, esig: w.name, d3: w.today, agency: w.org, title: w.title, badge: w.badge }) },
    { id: 'prosecutor', label: 'Prosecutor', fill: (api, w) => ({ sig2: w.name, d2: w.today }) },
    { id: 'judge', label: 'Judge or magistrate', for: /judge|magistrate/i, fill: (api, w) => ({ jname: w.name, jsig: w.name, od: w.today }) }
  ],
  md: { title: 'Criminal Complaint and Affidavit of Probable Cause', sections: [
    { name: 'Parties and venue', fields: [['judge','Judge'],['caseno','Case No.'],['def','Defendant full name'],['victim','Victim or complainant'],['cw','Complaining witness'],['codef','Co-defendants'],['city','City/Twp/Village'],['county','County'],['date','Date on or about']],
      multi: [['wit','Witnesses']],
      groups: [{ heading: 'Counts', item: 'Count', fields: CNT,
        get: api => api.qa('.cnt').map(c => Object.fromEntries(CNT.map(([k]) => [k, c.querySelector('.f-' + k).value.trim()]))),
        set(api, items) { api.$('counts').innerHTML = ''; (items.length ? items : [{}]).forEach(it => { const d = addCount(api); CNT.forEach(([k]) => d.querySelector('.f-' + k).value = it[k] || ''); }); numberCounts(api); } }] },
    { name: 'Complaint signatures', fields: [['d1','Complaint date (witness)'],['d2','Complaint date (prosecutor)'],['sig1','Complaining witness signature'],['sig2','Prosecutor signature']] },
    { name: 'Order', fields: [['ordsel','Order selection (0 none, 1 warrant, 2 summons, 3 rejected)'],['od','Order date'],['jname','Judge or magistrate name'],['jsig','Judge or magistrate signature']] },
    { name: 'Affidavit', fields: [['aff','Affiant name'],['b1','Basis - personal observations'],['b2','Basis - statements by witnesses or victims'],['b3','Basis - physical evidence'],['b4','Basis - records or documents'],['b5','Basis - other'],['agency','Agency'],['title','Title'],['badge','Badge No.'],['aname','Affiant name (printed)'],['d3','Affidavit date'],['esig','Affiant electronic signature']],
      multi: [['narr','Narrative'],['other','Other basis']] }
  ] }
};