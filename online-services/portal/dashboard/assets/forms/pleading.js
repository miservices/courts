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
.rb{white-space:pre-wrap;word-wrap:break-word;tab-size:48px;margin-top:0}
.rb p,.rb div{margin:0;min-height:1em}.rb h1{font-size:16px;text-align:center;font-weight:bold;text-transform:uppercase;margin:0}.rb h2{font-size:16px;font-weight:bold;margin:0}.rb h3{font-size:16px;font-weight:bold;font-style:italic;margin:0}
.rb ol,.rb ul{margin:0;padding-left:48px}.rb table{border-collapse:collapse;width:100%}.rb td,.rb th{border:1px solid #000;padding:4px 6px;vertical-align:top}
.ul{margin-top:18px;white-space:pre-wrap;word-wrap:break-word}
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
 <div class="row r3"><div><label>Court heading</label><select id="bct"><option value="">Bold</option><option value="n">Not bold</option></select></div><div><label>Pleading name</label><select id="bti"><option value="">Bold</option><option value="n">Not bold</option></select></div><div><label>Headings</label><select id="bhd"><option value="">Bold</option><option value="n">Not bold</option></select></div></div>
 <div id="staffonly" hidden><label>Lines under the pleading name (court staff)</label><textarea id="under" rows="4" placeholder="At a session of said Court, held in the City of Flint, County of Genesee, State of Michigan, on ____________, 2026.&#10;&#10;PRESENT: HON. NAME, Circuit Court Judge"></textarea></div>
 <textarea id="intro" hidden></textarea>
 <label>Line spacing</label>
 <select id="spacing"><option value="1.3">Single</option><option value="1.65">1.5 lines</option><option value="2.1" selected>Double</option></select>

 <h2>Body</h2>
 <style>
  .rt-bar{display:flex;flex-wrap:wrap;gap:4px;align-items:center;padding:6px;border:1px solid #c9d3e3;border-bottom:0;border-radius:6px 6px 0 0;background:#f4f7fb;position:sticky;top:0;z-index:3}
  .rt-bar button,.rt-bar select{font:inherit;font-size:13px;min-width:30px;height:30px;padding:0 7px;border:1px solid #c9d3e3;border-radius:4px;background:#fff;color:#14233b;cursor:pointer;width:auto;margin:0}
  .rt-bar button:hover,.rt-bar select:hover{background:#e8eef8}
  .rt-bar input[type=color]{width:30px;height:30px;padding:2px;border:1px solid #c9d3e3;border-radius:4px;background:#fff;margin:0}
  .rt-bar i{width:1px;height:22px;background:#c9d3e3;margin:0 3px}
  #rte{min-height:320px;max-height:70vh;overflow:auto;border:1px solid #c9d3e3;border-radius:0 0 6px 6px;padding:18px 22px;background:#fff;color:#000;font-family:'Times New Roman',Times,serif;font-size:16px;white-space:pre-wrap;word-wrap:break-word;tab-size:48px;outline:none;line-height:1.6}
  #rte:focus{border-color:#1f3b73;box-shadow:0 0 0 2px rgba(31,59,115,.15)}
  #rte p,#rte div{margin:0;min-height:1em}#rte h1{font-size:16px;text-align:center;font-weight:bold;text-transform:uppercase;margin:0}#rte h2{font-size:16px;font-weight:bold;margin:0}#rte h3{font-size:16px;font-weight:bold;font-style:italic;margin:0}
  #rte ol,#rte ul{margin:0;padding-left:48px}#rte table{border-collapse:collapse;width:100%}#rte td,#rte th{border:1px solid #000;padding:4px 6px}
  #rte [data-pb]{border-top:2px dashed #8aa;margin:8px 0;height:0;min-height:0;position:relative}#rte [data-pb]::after{content:'Page break';position:absolute;top:-9px;left:50%;transform:translateX(-50%);background:#fff;padding:0 8px;font:11px Arial;color:#678}
 </style>
 <small class="fd-hint">Type the body here like a word processor. Tab indents the line, Shift+Tab takes it back. Use the toolbar for fonts, sizes, color, alignment, indents, spacing, lists, tables and page breaks. Nothing is restricted.</small>
 <div class="rt-bar" id="rtbar" role="toolbar" aria-label="Formatting">
  <button type="button" data-c="undo" title="Undo">&#8630;</button><button type="button" data-c="redo" title="Redo">&#8631;</button><i></i>
  <select id="rt-blk" aria-label="Paragraph style"><option value="p">Normal text</option><option value="h1">Centered heading</option><option value="h2">Heading</option><option value="h3">Subheading</option></select>
  <select id="rt-font" aria-label="Font"></select>
  <select id="rt-size" aria-label="Size"><option value="">Size</option><option value="8">8</option><option value="9">9</option><option value="10">10</option><option value="11">11</option><option value="12">12</option><option value="13">13</option><option value="14">14</option><option value="16">16</option><option value="18">18</option><option value="20">20</option><option value="24">24</option><option value="28">28</option><option value="32">32</option><option value="36">36</option><option value="48">48</option><option value="72">72</option></select><i></i>
  <button type="button" data-c="bold" title="Bold"><b>B</b></button><button type="button" data-c="italic" title="Italic"><i style="width:auto;background:none;margin:0">I</i></button><button type="button" data-c="underline" title="Underline"><u>U</u></button><button type="button" data-c="strikeThrough" title="Strikethrough"><s>S</s></button>
  <button type="button" data-c="superscript" title="Superscript">x&sup2;</button><button type="button" data-c="subscript" title="Subscript">x&#8322;</button>
  <input type="color" id="rt-fg" value="#000000" title="Text color" aria-label="Text color"><input type="color" id="rt-bg" value="#ffff00" title="Highlight color" aria-label="Highlight color"><i></i>
  <button type="button" data-c="justifyLeft" title="Align left">&#8676;</button><button type="button" data-c="justifyCenter" title="Center">&#8801;</button><button type="button" data-c="justifyRight" title="Align right">&#8677;</button><button type="button" data-c="justifyFull" title="Justify">&#9776;</button><i></i>
  <button type="button" data-c="ind+" title="Indent the whole paragraph">&#8594;&#9646;</button><button type="button" data-c="ind-" title="Outdent the whole paragraph">&#9646;&#8592;</button><button type="button" data-c="fi+" title="First-line indent">&#8677;T</button><button type="button" data-c="fi-" title="Remove first-line indent">T&#8676;</button>
  <select id="rt-ls" aria-label="Line spacing"><option value="">Spacing</option><option value="1">Single</option><option value="1.5">1.5</option><option value="2">Double</option><option value="2.5">2.5</option><option value="3">Triple</option></select>
  <select id="rt-ps" aria-label="Space between paragraphs"><option value="">Space after</option><option value="0">None</option><option value="6">6 pt</option><option value="12">12 pt</option><option value="24">24 pt</option></select><i></i>
  <button type="button" data-c="insertOrderedList" title="Numbered list">1.</button><button type="button" data-c="insertUnorderedList" title="Bullet list">&bull;</button>
  <button type="button" data-c="table" title="Insert table">&#9638;</button><button type="button" data-c="hr" title="Horizontal line">&#8212;</button><button type="button" data-c="pb" title="Page break">&#9094;</button><button type="button" data-c="clear" title="Clear formatting">Tx</button>
 </div>
 <div id="rte" contenteditable="true" spellcheck="true" role="textbox" aria-multiline="true" aria-label="Pleading body"><p><br></p></div>
 <textarea id="bodyhtml" hidden></textarea>

 <h2>Signature</h2>
 <label class="chk"><input type="checkbox" id="sigon" checked> <span>Include a signature block</span></label>
 <label>Closing line</label><input type="text" id="closing" value="Respectfully submitted,">
 <div class="row"><div><label>Date</label><input type="text" id="d1" data-font="date"></div><div><label>Signature (typed)</label><input type="text" id="sig1" data-font="sig"></div></div>
 <label>Name (type or print)</label><input type="text" id="aname" data-font="info">
 <div class="row"><div><label>Bar number</label><input type="text" id="bar" data-font="info"></div><div><label>Firm name (if applicable)</label><input type="text" id="firm" data-font="info"></div></div>
 <label>Address</label><textarea id="addr" rows="2" placeholder="Street, city, state ZIP" data-font="info"></textarea>
 <div class="row"><div><label>Phone</label><input type="text" id="ph" data-font="info"></div><div><label>Email</label><input type="text" id="em" data-font="info"></div></div>
`;



/* ---- the body: free-form formatted text, like a word processor ---- */
const OKTAG = new Set('P DIV SPAN B STRONG I EM U S STRIKE DEL SUB SUP BR H1 H2 H3 UL OL LI BLOCKQUOTE TABLE THEAD TBODY TR TD TH HR FONT'.split(' '));
const OKCSS = new Set(['font-family', 'font-size', 'font-weight', 'font-style', 'text-decoration', 'text-decoration-line', 'color', 'background-color', 'text-align', 'text-indent', 'margin-left', 'margin-right', 'margin-top', 'margin-bottom', 'padding-left', 'line-height', 'letter-spacing', 'text-transform', 'font-variant', 'list-style', 'list-style-type', 'width', 'border', 'vertical-align']);
export function clean(html) {
  const doc = new DOMParser().parseFromString('<body>' + String(html || '') + '</body>', 'text/html');
  const walk = el => {
    [...el.childNodes].forEach(n => {
      if (n.nodeType === 8) { n.remove(); return; }
      if (n.nodeType !== 1) return;
      if (!OKTAG.has(n.tagName)) { n.replaceWith(...n.childNodes); return; }
      const keep = []; [...n.attributes].forEach(a => { const k = a.name.toLowerCase();
        if (k === 'style') { const out = []; a.value.split(';').forEach(d => { const i = d.indexOf(':'); if (i < 0) return; const p = d.slice(0, i).trim().toLowerCase(), v = d.slice(i + 1).trim(); if (OKCSS.has(p) && v && !/url\s*\(|expression|javascript|@import|[<>{}]/i.test(v)) out.push(p + ':' + v); }); if (out.length) keep.push(['style', out.join(';')]); }
        else if (k === 'data-pb' && n.tagName === 'DIV') keep.push(['data-pb', '1']);
        else if (['colspan', 'rowspan', 'start'].includes(k) && /^\d{1,3}$/.test(a.value)) keep.push([k, a.value]);
        else if (k === 'size' && n.tagName === 'FONT' && /^[1-7]$/.test(a.value)) keep.push([k, a.value]);
        else if (k === 'face' && n.tagName === 'FONT' && /^[\w\s,'"-]+$/.test(a.value)) keep.push([k, a.value]);
        else if (k === 'color' && n.tagName === 'FONT' && /^#?[\w]+$/.test(a.value)) keep.push([k, a.value]); });
      [...n.attributes].forEach(a => n.removeAttribute(a.name)); keep.forEach(([k, v]) => n.setAttribute(k, v)); walk(n);
    });
  };
  walk(doc.body); return doc.body.innerHTML;
}
const escH = t => String(t || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
/* Older pleadings kept a list of blocks. They open as ordinary formatted text. */
function fromBlocks(intro, items) {
  let n = 0; const out = [];
  if (String(intro || '').trim()) out.push(`<p style="text-indent:48px">${escH(intro.trim()).replace(/\n/g, '<br>')}</p>`);
  (items || []).forEach(it => { const k = String(it.k || '').trim().toLowerCase(), t = escH(it.t || '').replace(/\n/g, '<br>');
    if (k === 'h') out.push(`<h1>${t}</h1>`); else if (k === 'p') out.push(`<p style="text-indent:48px">${t}</p>`); else { n++; out.push(`<p style="text-indent:48px">${n}.&emsp;${t}</p>`); } });
  return out.join('');
}
/* The text area is what is saved; the editor shows it. They are kept in step here. */
function bodyOf(api) {
  const rte = document.getElementById('rte'), ta = api.$('bodyhtml'); if (!rte) return '';
  if (!ta.value.trim() && api._legacy && (api._legacy.items.length || api._legacy.intro)) { ta.value = fromBlocks(api._legacy.intro || api.$('intro').value, api._legacy.items); api._legacy = null; api.$('intro').value = ''; }
  else if (!ta.value.trim() && api.$('intro').value.trim()) { ta.value = fromBlocks(api.$('intro').value, []); api.$('intro').value = ''; }
  const v = clean(ta.value);
  if (!rte.contains(document.activeElement) && clean(rte.innerHTML) !== v) rte.innerHTML = v || '<p><br></p>';
  return v;
}
const FONTS = ['Times New Roman', 'Arial', 'Courier New', 'Georgia', 'Verdana', 'Trebuchet MS', 'Tahoma', 'Garamond', 'Palatino Linotype', 'Book Antiqua', 'Century Schoolbook', 'Calibri', 'Cambria', 'Comic Sans MS', 'Impact', 'Lucida Console', 'Brush Script MT', 'Special Elite', 'Caveat', 'Dancing Script', 'Pacifico'];
function setupRte(api) {
  const rte = document.getElementById('rte'), ta = api.$('bodyhtml'), bar = document.getElementById('rtbar'); if (!rte || !bar) return;
  let saved = null; const sel = () => document.getSelection();
  document.addEventListener('selectionchange', () => { const s = sel(); if (s.rangeCount && rte.contains(s.anchorNode)) saved = s.getRangeAt(0).cloneRange(); });
  const font = document.getElementById('rt-font'); font.innerHTML = '<option value="">Font</option>' + FONTS.map(f => `<option value="${f}" style="font-family:'${f}'">${f}</option>`).join('');
  const grab = () => { rte.focus(); if (saved) { const s = sel(); s.removeAllRanges(); s.addRange(saved); } };
  const push = () => { ta.value = clean(rte.innerHTML); rte.dispatchEvent(new Event('input', { bubbles: true })); };
  const blocksIn = () => { const r = saved; if (!r) return []; const out = []; [...rte.children].forEach(c => { try { if (r.intersectsNode(c)) out.push(c); } catch { } }); return out.length ? out : [rte.lastElementChild].filter(Boolean); };
  const px = v => parseFloat(v) || 0;
  const exec = (c, v) => { grab(); document.execCommand('styleWithCSS', false, true); document.execCommand(c, false, v); };
  const fixSize = pt => { rte.querySelectorAll('span[style*="xxx-large"]').forEach(e => { e.style.fontSize = pt + 'pt'; }); rte.querySelectorAll('font[size="7"]').forEach(e => { const sp = document.createElement('span'); sp.style.fontSize = pt + 'pt'; while (e.firstChild) sp.appendChild(e.firstChild); e.replaceWith(sp); }); };
  try { document.execCommand('defaultParagraphSeparator', false, 'p'); } catch { }
  bar.addEventListener('mousedown', e => { if (e.target.closest('button')) e.preventDefault(); });
  bar.addEventListener('click', e => {
    const b = e.target.closest('button[data-c]'); if (!b) return; const c = b.dataset.c; grab();
    if (c === 'ind+' || c === 'ind-') blocksIn().forEach(x => { x.style.marginLeft = Math.max(0, px(x.style.marginLeft) + (c === 'ind+' ? 48 : -48)) + 'px'; });
    else if (c === 'fi+' || c === 'fi-') blocksIn().forEach(x => { x.style.textIndent = Math.max(0, px(x.style.textIndent) + (c === 'fi+' ? 48 : -48)) + 'px'; });
    else if (c === 'hr') exec('insertHorizontalRule');
    else if (c === 'pb') { const bl = blocksIn().at(-1), d = document.createElement('div'), p = document.createElement('p'); d.setAttribute('data-pb', '1'); p.innerHTML = '<br>'; if (bl) { bl.after(d); d.after(p); } else { rte.append(d, p); } const r = document.createRange(); r.setStart(p, 0); r.collapse(true); sel().removeAllRanges(); sel().addRange(r); }
    else if (c === 'table') { const r = Math.min(30, Math.max(1, parseInt(prompt('Rows', '3'), 10) || 0)), k = Math.min(10, Math.max(1, parseInt(prompt('Columns', '3'), 10) || 0)); if (!r || !k) return; exec('insertHTML', '<table>' + ('<tr>' + '<td><br></td>'.repeat(k) + '</tr>').repeat(r) + '</table><p><br></p>'); }
    else if (c === 'clear') { exec('removeFormat'); blocksIn().forEach(x => x.removeAttribute('style')); }
    else exec(c);
    push();
  });
  const apply = (id, fn) => document.getElementById(id).addEventListener('change', e => { const v = e.target.value; if (!v) return; grab(); fn(v); e.target.value = ''; push(); });
  apply('rt-font', v => exec('fontName', v));
  apply('rt-size', v => { exec('fontSize', '7'); fixSize(v); });
  apply('rt-blk', v => exec('formatBlock', v));
  apply('rt-ls', v => blocksIn().forEach(x => { x.style.lineHeight = v === '1' ? '1.3' : v === '1.5' ? '1.65' : v === '2' ? '2.1' : v === '2.5' ? '2.6' : '3.1'; }));
  apply('rt-ps', v => blocksIn().forEach(x => { x.style.marginBottom = v + 'pt'; }));
  document.getElementById('rt-blk').addEventListener('change', e => { e.target.value = 'p'; });
  document.getElementById('rt-fg').addEventListener('input', e => { exec('foreColor', e.target.value); push(); });
  document.getElementById('rt-bg').addEventListener('input', e => { exec('hiliteColor', e.target.value); push(); });
  rte.addEventListener('keydown', e => {
    if (e.key === 'Tab') { e.preventDefault(); if (e.shiftKey) { blocksIn().forEach(x => { x.style.marginLeft = Math.max(0, px(x.style.marginLeft) - 48) + 'px'; }); push(); } else document.execCommand('insertText', false, '\t'); }
  });
  rte.addEventListener('paste', e => { const h = e.clipboardData?.getData('text/html'); if (!h) return; e.preventDefault(); document.execCommand('insertHTML', false, clean(h)); });
  rte.addEventListener('input', () => { ta.value = clean(rte.innerHTML); });
  rte.addEventListener('blur', () => { ta.value = clean(rte.innerHTML); });
}

const nb = id => (typeof document !== 'undefined' && document.getElementById(id) && document.getElementById(id).value === 'n') ? ' style="font-weight:normal"' : '';
function caption(api, n) {
  const E = api.ed, { $ } = api, tp = $('tplace').value;
  const court = `<div class="ct"${nb('bct')}><div>${E('ct1')}</div><div>${E('ct2')}</div></div>`;
  const comma = (k, ph) => `${E(k, { ph })}${$(k).value.trim() ? ',' : ''}`;
  const left = `<div class="cl"><div>${comma('pln', 'Plaintiff name')}</div><div class="rl">${E('plrole', { ph: 'Plaintiff,' })}</div><div class="vv">v.</div><div>${comma('dfn', 'Defendant name')}</div><div class="rl">${E('dfrole', { ph: 'Defendant.' })}</div>${n === 3 ? '<div class="dl"><i></i>/</div>' : ''}</div>`;
  const parens = n >= 4 ? '<div class="pr">' + ')'.repeat(13).split('').map(c => '<span>' + c + '</span>').join('') + '</div>' : '';
  const right = `<div class="cr">${tp === 'below' ? '' : `<div class="pn"${nb('bti')}>${E('title', { ph: 'PLEADING NAME' })}</div>`}<div>${E('judge', { hon: true, blank: '____________' })}</div><div>Case No. ${E('caseno', { blank: '____________' })}</div></div>`;
  return `<div class="s${n}">${court}<div class="cap"><div class="lw">${left}${parens}</div>${right}</div></div>`;
}

function build(api, n) {
  const { $ } = api, E = api.ed, seq = [], lh = $('spacing').value || '2.1';
  seq.push({ html: caption(api, n) });
  if ($('tplace').value !== 'caption') seq.push({ html: `<div class="tt"${nb('bti')}>${E('title', { ph: 'PLEADING NAME' })}</div>` });
  if ($('under').value.trim()) seq.push({ html: `<div class="ul">${E('under', { multi: true, ph: 'Lines under the pleading name' })}</div>` });
  const body = bodyOf(api); if (body.replace(/<[^>]*>/g, '').trim() || /<(table|hr|img)|data-pb/.test(body)) seq.push({ rich: body, wrap: h => `<div class="rb" style="line-height:${lh}">${h}</div>` });
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
    fontOpen: true,
    css, panel: n === 1 ? panel.replace('<option value="both">In the caption and below it</option><option value="caption">In the caption only</option><option value="below">Below the caption only</option>', '<option value="below">Below the caption only</option><option value="both">In the caption and below it</option><option value="caption">In the caption only</option>') : n === 5 ? panel.replace('value="THE STATE OF MICHIGAN"', 'value="THE STATE OF MICHIGAN IN THE"').replace('value="IN THE 7TH JUDICIAL DISTRICT COURT FOR GENESEE"', 'value="7TH JUDICIAL DISTRICT COURT FOR GENESEE"') : panel, usable: () => 864,
    build: api => build(api, n),
    init(api) {
      if (n === 1 && /clerk|judge|justice|magistrate|judicial|court reporter|court administrator|reporter of decisions/i.test(api.role || '')) api.$('staffonly').hidden = false;
      setupRte(api);
    },
    contHeader: api => `<div class="ch">Case No. ${api.ed('caseno', { blank: '____________' })}</div>`,
    roles: [
      { id: 'attorney', label: 'Attorney signing this pleading', fill: (api, w) => ({ aname: w.name, sig1: w.name, d1: w.today, bar: w.bar, firm: w.org, addr: w.address, ph: w.phone, em: w.email }) },
      { id: 'party', label: 'Party filing without an attorney', fill: (api, w) => ({ aname: w.name, sig1: w.name, d1: w.today, addr: w.address, ph: w.phone, em: w.email }) }
    ],
    md: { title: 'General Pleading (Style ' + n + ')', sections: [
      { name: 'Case', fields: [['judge', 'Judge'], ['caseno', 'Case No.'], ['ct1', 'Court heading line 1'], ['ct2', 'Court heading line 2'], ['pln', 'Plaintiff name'], ['plrole', 'Plaintiff label'], ['dfn', 'Defendant name'], ['dfrole', 'Defendant label'], ['title', 'Pleading name'], ['tplace', 'Pleading name shown'], ['bct', 'Court heading weight'], ['bti', 'Pleading name weight'], ['bhd', 'Headings weight'], ['spacing', 'Line spacing']],
        multi: [['bodyhtml', 'Body (formatted text)'], ['intro', 'Opening text'], ['under', 'Lines under the pleading name']],
        groups: [{ heading: 'Body', item: 'Block', fields: BODY, get: () => [], set(api, items) { api._legacy = { items, intro: '' }; } }] },
      { name: 'Signature', fields: [['sigon', 'Include signature block'], ['closing', 'Closing line'], ['d1', 'Date'], ['sig1', 'Signature'], ['aname', 'Name'], ['bar', 'Bar number'], ['firm', 'Firm name'], ['ph', 'Phone'], ['em', 'Email']], multi: [['addr', 'Address']] }
    ] }
  };
}