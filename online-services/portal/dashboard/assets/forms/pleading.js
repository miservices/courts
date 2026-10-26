/* General pleadings: one shared definition with five caption layouts (Pleading 1 to 5).
   Layouts follow the court's pleading templates:
     1  centered court heading; parties on the left, judge and case number on the right; one rule under the caption
     2  pleading name, judge and case number on the right; rules above and below the parties
     3  like 2, with a closing line ending in "/" under the last party
     4  parties with a rule below and a column of ")" beside them
     5  like 4 with rules above and below, and the court heading set left and plain
   The body is a list of blocks: headings, numbered paragraphs (numbered 1, 2, 3 across the whole pleading), and plain paragraphs. */

const css = () => `
.page{width:816px;height:1056px;position:relative;overflow:hidden;background:#fff;margin:0 auto 16px;box-shadow:0 1px 6px rgba(0,0,0,.25);padding:96px 96px 0;font-family:'Times New Roman',Times,serif;font-size:16px;line-height:1.3;color:#000}
.page *{box-sizing:border-box}
#preview{counter-reset:pg}.page{counter-increment:pg}
.pc{width:624px}
.foot{position:absolute;left:0;right:0;top:992px;text-align:center;font-size:14px;line-height:1}
.foot::after{content:counter(pg)}
.ct{text-align:center;font-weight:bold;line-height:1.3}
.s5 .ct{text-align:left;font-weight:normal}
.cap{display:flex;margin-top:30px;align-items:center}
.lw{display:flex;align-items:stretch;flex:none}
.cl{width:330px;flex:none;padding:8px 0}
.cl>div{margin:10px 0}
.cl .rl{padding-left:56px}.cl .vv{padding-left:20px}
.cr{flex:1;min-width:0;display:flex;flex-direction:column;justify-content:center;padding-left:26px}
.cr>div{margin:7px 0}
.cr .pn{font-weight:bold;text-transform:uppercase}
.s1 .cr{padding-left:34px}
.s1 .cap{padding-bottom:12px;border-bottom:1.4px solid #000}
.s2 .cl,.s5 .cl{border-top:1.4px solid #000;border-bottom:1.4px solid #000}
.s4 .cl{border-bottom:1.4px solid #000}
.s4 .cl,.s5 .cl{width:322px}
.pr{width:18px;flex:none;display:flex;flex-direction:column;justify-content:space-between;padding:10px 0 2px 4px;line-height:1}
.s4 .cr,.s5 .cr{padding-left:22px}
.dl{display:flex;align-items:flex-end;margin-top:4px}.dl i{display:block;width:290px;border-bottom:1.4px solid #000;height:16px}
.tt{text-align:center;font-weight:bold;text-transform:uppercase;margin-top:34px}
.ip{margin-top:14px;text-indent:48px;white-space:pre-wrap;word-wrap:break-word}
.hh{text-align:center;font-weight:bold;text-transform:uppercase;margin-top:26px;margin-bottom:4px}
.np,.pp{margin-top:10px;text-indent:48px;white-space:pre-wrap;word-wrap:break-word}
.np.cont,.pp.cont{text-indent:0;margin-top:0}
.sg{margin-top:34px;display:flex;align-items:flex-start}
.sg .dt{width:312px;flex:none}
.sg .rt{flex:1;min-width:0}
.sg .sl{border-bottom:1.4px solid #000;min-height:24px;padding-top:6px;margin-top:22px;white-space:pre}
.sg .sl>*{max-width:none;overflow:visible}
.sg .ln{margin-top:2px;white-space:pre-wrap;word-wrap:break-word}
.ch{text-align:right;margin-bottom:6px;font-size:14px;line-height:1.2}
`;

const panel = `
 <h2>Header</h2>
 <div class="row"><div><label>Judge</label><input type="text" id="judge"></div><div><label>Case No.</label><input type="text" id="caseno"></div></div>
 <label>Court heading, line 1</label><input type="text" id="ct1" value="THE STATE OF MICHIGAN">
 <label>Court heading, line 2</label><input type="text" id="ct2" value="IN THE 7TH JUDICIAL DISTRICT COURT FOR GENESEE">

 <h2>Parties</h2>
 <label>Plaintiff / Petitioner name(s)</label><input type="text" id="pln" placeholder="e.g. JANE ROE">
 <label>Label under the name</label><input type="text" id="plrole" value="Plaintiff,">
 <label>Defendant / Respondent name(s)</label><input type="text" id="dfn" placeholder="e.g. ABC ENTERPRISES and JOHN AND JANE DOE">
 <label>Label under the name</label><input type="text" id="dfrole" value="Defendant.">

 <h2>Pleading</h2>
 <label>Pleading name</label><input type="text" id="title" placeholder="e.g. COMPLAINT">
 <label>Show the pleading name</label>
 <select id="tplace"><option value="both">In the caption and below it</option><option value="caption">In the caption only</option><option value="below">Below the caption only</option></select>
 <label>Opening text (under the pleading name)</label><textarea id="intro" rows="4"></textarea>
 <label>Line spacing</label>
 <select id="spacing"><option value="1.3">Single</option><option value="1.65">1.5 lines</option><option value="2.1" selected>Double</option></select>

 <h2>Body</h2>
 <small class="fd-hint">Each block is a heading or one paragraph. Numbered paragraphs are numbered 1, 2, 3 in order across the whole pleading.</small>
 <div id="blocks"></div>
 <div class="row r3" style="margin-top:6px"><button class="btn outline" id="addh" type="button">+ Heading</button><button class="btn outline" id="addn" type="button">+ Numbered</button><button class="btn outline" id="addp" type="button">+ Plain</button></div>

 <h2>Signature</h2>
 <label class="chk"><input type="checkbox" id="sigon" checked> <span>Include a signature block</span></label>
 <label>Closing line</label><input type="text" id="closing" value="Respectfully submitted,">
 <div class="row"><div><label>Date</label><input type="text" id="d1" data-font="date"></div><div><label>Signature (typed)</label><input type="text" id="sig1" data-font="sig"></div></div>
 <label>Name (type or print)</label><input type="text" id="aname" data-font="info">
 <div class="row"><div><label>Bar number</label><input type="text" id="bar" data-font="info"></div><div><label>Firm name (if applicable)</label><input type="text" id="firm" data-font="info"></div></div>
 <label>Address</label><textarea id="addr" rows="2" placeholder="Street, city, state ZIP" data-font="info"></textarea>
 <div class="row"><div><label>Phone</label><input type="text" id="ph" data-font="info"></div><div><label>Email</label><input type="text" id="em" data-font="info"></div></div>
`;

const KINDS = [['h', 'Heading'], ['n', 'Numbered paragraph'], ['p', 'Plain paragraph']];
const MV = 'background:none;border:0;padding:0 0 0 10px;font-size:12px;cursor:pointer;color:#345';

function label(api) {
  let n = 0; const l = api.qa('.blk');
  l.forEach(b => { const k = b.querySelector('.f-k').value; b.querySelector('.bl-n').textContent = k === 'h' ? 'Heading' : k === 'n' ? 'Paragraph ' + (++n) : 'Plain paragraph'; });
  l.forEach((b, i) => { b.querySelector('.up').hidden = i === 0; b.querySelector('.dn').hidden = i === l.length - 1; });
}
function addBlock(api, k = 'n', t = '') {
  const d = document.createElement('div'); d.className = 'cnt blk';
  d.innerHTML = `<div class="top"><b class="bl-n"></b><span><button type="button" class="up" style="${MV}">Up</button><button type="button" class="dn" style="${MV}">Down</button><button type="button" class="rm" style="padding-left:10px">Remove</button></span></div>
 <select class="f-k" aria-label="Block type" style="margin-top:6px">${KINDS.map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}</select>
 <textarea class="f-t" rows="3" aria-label="Text" style="margin-top:6px"></textarea>`;
  d.querySelector('.f-k').value = k; d.querySelector('.f-t').value = t;
  const box = api.$('blocks'), touch = () => box.dispatchEvent(new Event('input', { bubbles: true }));
  d.querySelector('.rm').onclick = () => { d.remove(); label(api); touch(); };
  d.querySelector('.up').onclick = () => { const p = d.previousElementSibling; if (p) { p.before(d); label(api); touch(); } };
  d.querySelector('.dn').onclick = () => { const x = d.nextElementSibling; if (x) { x.after(d); label(api); touch(); } };
  d.querySelector('.f-k').onchange = () => label(api);
  box.appendChild(d); label(api); return d;
}

function caption(api, n) {
  const E = api.ed, { $ } = api, tp = $('tplace').value;
  const court = `<div class="ct"><div>${E('ct1')}</div><div>${E('ct2')}</div></div>`;
  const comma = (k, ph) => `${E(k, { ph })}${$(k).value.trim() ? ',' : ''}`;
  const left = `<div class="cl"><div>${comma('pln', 'Plaintiff name')}</div><div class="rl">${E('plrole', { ph: 'Plaintiff,' })}</div><div class="vv">v.</div><div>${comma('dfn', 'Defendant name')}</div><div class="rl">${E('dfrole', { ph: 'Defendant.' })}</div>${n === 3 ? '<div class="dl"><i></i>/</div>' : ''}</div>`;
  const parens = n >= 4 ? '<div class="pr">' + ')'.repeat(13).split('').map(c => '<span>' + c + '</span>').join('') + '</div>' : '';
  const right = `<div class="cr">${tp === 'below' ? '' : `<div class="pn">${E('title', { ph: 'PLEADING NAME' })}</div>`}<div>${E('judge', { hon: true, blank: '____________' })}</div><div>Case No. ${E('caseno', { blank: '____________' })}</div></div>`;
  return `<div class="s${n}">${court}<div class="cap"><div class="lw">${left}${parens}</div>${right}</div></div>`;
}

function build(api, n) {
  const { $ } = api, E = api.ed, seq = [], lh = $('spacing').value || '2.1';
  seq.push({ html: caption(api, n) });
  if ($('tplace').value !== 'caption') seq.push({ html: `<div class="tt">${E('title', { ph: 'PLEADING NAME' })}</div>` });
  seq.push({ txt: $('intro').value.replace(/\r/g, ''), make: (t, first) => `<div class="ip" style="line-height:${lh};${first ? '' : 'text-indent:0;margin-top:0'}">${api.edt('intro', t, { ph: 'Opening text' })}</div>` });
  let num = 0;
  api.qa('.blk').forEach((b, i) => {
    const k = b.querySelector('.f-k').value, v = b.querySelector('.f-t').value.replace(/\r/g, ''), key = '@' + i + '.t';
    if (k === 'h') { seq.push({ html: `<div class="hh">${E(key, { ph: 'HEADING' })}</div>` }); return; }
    const mine = k === 'n' ? ++num : 0;
    seq.push({ txt: v, make: (t, first) => `<div class="${k === 'n' ? 'np' : 'pp'}${first ? '' : ' cont'}" style="line-height:${lh}">${first && mine ? mine + '.&emsp;' : ''}${api.edt(key, t, { ph: k === 'n' ? 'Paragraph text' : 'Text' })}</div>` });
  });
  if ($('sigon').checked) {
    const L = (k, pre, ph) => $(k).value.trim() ? `<div class="ln">${pre || ''}${E(k, { ph })}</div>` : '';
    seq.push({ html: `<div class="sg"><div class="dt">Dated: ${E('d1', { ph: 'Date' })}</div><div class="rt"><div>${E('closing', { ph: 'Respectfully submitted,' })}</div>
      <div class="sl">${E('sig1', { pre: '/s/ ', ph: 'Signature' })}</div>
      <div class="ln">${E('aname', { ph: 'Name' })}</div>${L('bar', 'Bar No. ', 'Bar number')}${L('firm', '', 'Firm name')}${$('addr').value.trim() ? `<div class="ln">${E('addr', { multi: true, ph: 'Address' })}</div>` : ''}${L('ph', 'Phone: ', 'Phone')}${L('em', 'Email: ', 'Email')}</div></div>` });
  }
  return seq;
}

const BODY = [['k', 'Type (h heading, n numbered paragraph, p plain paragraph)'], ['t', 'Text']];

export function make(n) {
  return {
    id: 'plead' + n, number: 'Pleading ' + n, title: 'General Pleading (Style ' + n + ')', footer: '​', font: 'Times New Roman',
    fontPolicy: { body: ['default'], date: ['default', 'hand', 'stamp'], info: ['default', 'hand', 'stamp'], sig: ['default', 'hand', 'stamp', 'cursive'] },
    css, panel: n === 1 ? panel.replace('<option value="both">In the caption and below it</option><option value="caption">In the caption only</option><option value="below">Below the caption only</option>', '<option value="below">Below the caption only</option><option value="both">In the caption and below it</option><option value="caption">In the caption only</option>') : n === 5 ? panel.replace('value="THE STATE OF MICHIGAN"', 'value="THE STATE OF MICHIGAN IN THE"').replace('value="IN THE 7TH JUDICIAL DISTRICT COURT FOR GENESEE"', 'value="7TH JUDICIAL DISTRICT COURT FOR GENESEE"') : panel, usable: () => 864,
    build: api => build(api, n),
    init(api) {
      addBlock(api, 'n');
      api.$('addh').onclick = () => { addBlock(api, 'h'); api.render(); };
      api.$('addn').onclick = () => { addBlock(api, 'n'); api.render(); };
      api.$('addp').onclick = () => { addBlock(api, 'p'); api.render(); };
      api.$('blocks').addEventListener('change', e => { if (e.target.classList.contains('f-k')) api.render(); });
    },
    contHeader: api => `<div class="ch">Case No. ${api.ed('caseno', { blank: '____________' })}</div>`,
    resolve: (api, k) => { const m = /^(\d+)\.t$/.exec(k); return m && api.qa('.blk')[+m[1]]?.querySelector('.f-t'); },
    roles: [
      { id: 'attorney', label: 'Attorney signing this pleading', fill: (api, w) => ({ aname: w.name, sig1: w.name, d1: w.today, bar: w.bar, firm: w.org, addr: w.address, ph: w.phone, em: w.email }) },
      { id: 'party', label: 'Party filing without an attorney', fill: (api, w) => ({ aname: w.name, sig1: w.name, d1: w.today, addr: w.address, ph: w.phone, em: w.email }) }
    ],
    md: { title: 'General Pleading (Style ' + n + ')', sections: [
      { name: 'Case', fields: [['judge', 'Judge'], ['caseno', 'Case No.'], ['ct1', 'Court heading line 1'], ['ct2', 'Court heading line 2'], ['pln', 'Plaintiff name'], ['plrole', 'Plaintiff label'], ['dfn', 'Defendant name'], ['dfrole', 'Defendant label'], ['title', 'Pleading name'], ['tplace', 'Pleading name shown'], ['spacing', 'Line spacing']],
        multi: [['intro', 'Opening text']],
        groups: [{ heading: 'Body', item: 'Block', fields: BODY,
          get: api => api.qa('.blk').map(b => ({ k: b.querySelector('.f-k').value, t: b.querySelector('.f-t').value.trim() })),
          set(api, items) { api.$('blocks').innerHTML = ''; (items.length ? items : [{ k: 'n' }]).forEach(it => addBlock(api, ['h', 'n', 'p'].includes(String(it.k || '').trim().toLowerCase()) ? String(it.k).trim().toLowerCase() : 'n', it.t || '')); label(api); } }] },
      { name: 'Signature', fields: [['sigon', 'Include signature block'], ['closing', 'Closing line'], ['d1', 'Date'], ['sig1', 'Signature'], ['aname', 'Name'], ['bar', 'Bar number'], ['firm', 'Firm name'], ['ph', 'Phone'], ['em', 'Email']], multi: [['addr', 'Address']] }
    ] }
  };
}
