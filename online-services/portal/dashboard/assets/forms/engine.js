/* Shared engine for every drafting form: the editor layout, the live paginated preview, PDF, print, and Markdown save/load.
   A form is one script in this folder that default-exports a definition (see mc200a.js):
     id, number, title, footer            what the form is called and what prints at the foot of each page
     css({U,P,B})                         the document's own stylesheet (sizes scaled from the original form)
     panel                                HTML for the fields on the left
     init(api)                            optional: wire up anything dynamic, such as repeating counts
     usable(U)                            optional: usable height of each page (default 678 units)
     contHeader(api)                      optional: HTML repeated at the top of continuation pages
     build(api)                           returns the document as a list of blocks (see paginate)
     md                                   how fields map to Markdown: { title, sections:[{name, fields, multi, groups}] }
     roles                                optional: [{id,label,hint,for:/regex of account roles/,fill(api,who)->{fieldId:value}}]
                                        shown as "Fill in my details as" checkboxes; who = {name,org,title,badge,bar,today}
   Fields marked data-font="date" or data-font="sig" (name blocks count as sig) get a font picker: the person chooses which
   text types to unlock (Default, Handwriting, Stamp, Cursive), then a font from those types, plus size, bold and italic.
   data-font="none" opts a field out of every font setting. Fields with no data-font take the document's "Default text" font.
   The "Document fonts" box sets one font each for default text, date blocks and signature blocks. Any field can still
   override it. In build(), print every value with api.ed(...) and the styling is applied for you.
   The preview lives in its own frame, so portal styles never touch the document and the document never touches the portal. */
export const U = 1.3714, P = n => (n * U).toFixed(2) + 'px', B = '1.4px';
export const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const H2P = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
const norm = t => String(t || '').toLowerCase().replace(/\s+/g, ' ').trim();
export const keyOf = s => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

const BASE_CSS = `#preview.ro [data-f],#preview.ro [data-chk],#preview.ro [data-sel] .cb{background:none!important;outline:none!important;cursor:default!important}#preview.ro [data-f]:empty::before{content:none!important}
@page{size:letter;margin:0}*{box-sizing:border-box}
html{overflow-y:scroll}
body{margin:0;font-family:Arial,Helvetica,sans-serif;background:#e9ebee;color:#222}
#pwrap{margin:16px auto}#preview{width:816px;transform-origin:top left}
#measure{position:absolute;left:-9999px;top:0;visibility:hidden}
@media screen{
#preview [data-f]{background:rgba(255,214,102,.26);outline:1px dashed rgba(176,128,0,.55);outline-offset:1px;border-radius:2px;cursor:text;white-space:pre-wrap}
#preview .sv [data-f]{white-space:pre}
#preview [data-f]:hover{background:rgba(255,214,102,.5)}
#preview [data-f]:focus{outline:2px solid #1f3a68;background:rgba(31,58,104,.09)}
#preview [data-sys]{background:none!important;outline:none!important;cursor:default!important}#preview [data-sys]:empty::before{content:none!important}
#preview [data-f]:empty{display:inline-block;min-width:3.5em;min-height:1em;vertical-align:bottom}
#preview [data-f]:empty::before{content:attr(data-ph);color:#8a6d00;font:italic 400 .8em Arial,sans-serif;white-space:nowrap}
#preview [data-chk],#preview [data-sel]{cursor:pointer}
#preview [data-chk],#preview [data-sel] .cb{outline:1px dashed rgba(176,128,0,.6);outline-offset:1px;background:rgba(255,214,102,.26)}
#preview [data-chk]:hover,#preview [data-sel]:hover .cb{background:rgba(255,214,102,.6)}
}
#tb{position:fixed;z-index:50;display:flex;gap:4px;align-items:center;background:#1c2b45;color:#fff;border-radius:8px;padding:5px 6px;box-shadow:0 4px 14px rgba(0,0,0,.3);font:12px Arial,sans-serif;max-width:calc(100vw - 16px)}
#tb[hidden]{display:none}#tb .tn{font-weight:600;padding:0 6px 0 2px;max-width:160px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#tb .fx{display:contents}#tb.plain .fx{display:none}
#tb .tfb{display:flex;align-items:center;gap:6px;width:auto;min-width:96px;max-width:190px;padding:0 8px;justify-content:space-between}#tb .tfn{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:13px}#tb .tsm,#tb .tsp{width:30px;font-size:12px;font-weight:700}#tb .tsv{min-width:38px;text-align:center;font-size:12px}#tb button:disabled{opacity:.45;cursor:default}
#tb button{width:26px;height:26px;border:0;border-radius:5px;background:#fff;color:#1c2b45;cursor:pointer;font:13px Arial,sans-serif}#tb button[aria-pressed=true]{background:#ffd666}
@media print{#tb{display:none!important}}
@media print{body{background:#fff}#measure{display:none}#pwrap{width:auto!important;height:auto!important;margin:0}#preview{transform:none!important;margin:0}.page{margin:0!important;box-shadow:none!important;page-break-after:always}.page:last-child{page-break-after:auto}}`;

/* ---------- Markdown: one schema, used both ways ---------- */
export function toMarkdown(def, api) {
  const gv = id => { const e = api.$(id); return e.type === 'checkbox' ? (e.checked ? 'yes' : 'no') : e.value.replace(/\r?\n/g, ' ').trim(); };
  const o = ['---', 'form: ' + def.number, 'title: ' + def.title, '---', '', '# ' + def.number, ''];
  def.md.sections.forEach(s => {
    o.push('## ' + s.name, '');
    (s.fields || []).forEach(([id, l]) => o.push('- ' + l + ': ' + gv(id)));
    o.push('');
    (s.multi || []).forEach(([id, l]) => o.push('### ' + l, '', '```text', api.$(id).value.trim(), '```', ''));
    (s.groups || []).forEach(g => {
      o.push('## ' + g.heading, '');
      g.get(api).forEach((it, i) => { o.push('### ' + g.item + ' ' + (i + 1), ''); g.fields.forEach(([k, l]) => o.push('- ' + l + ': ' + String(it[k] ?? '').replace(/\r?\n/g, ' ').trim())); o.push(''); });
    });
  });
  const tok = v => [v.f, v.s && v.s + 'pt', v.b > 0 && 'bold', v.b < 0 && 'not bold', v.i > 0 && 'italic', v.i < 0 && 'not italic', v.t && v.t !== 'default' && 'types:' + v.t].filter(Boolean).join(', ');
  const all = Object.entries(api.styles()).filter(([, v]) => tok(v)), dn = { '~body': 'text', '~date': 'date', '~sig': 'signature' };
  const dfl = all.filter(([id]) => id[0] === '~'), st = all.filter(([id]) => id[0] !== '~');
  if (dfl.length) { o.push('## Default fonts', ''); dfl.forEach(([id, v]) => o.push('- ' + dn[id] + ': ' + tok(v))); o.push(''); }
  if (st.length) { o.push('## Field styles', ''); st.forEach(([id, v]) => o.push('- ' + id + ': ' + tok(v))); o.push(''); }
  return o.join('\n');
}
export function formOf(text) {   // which form a saved .md belongs to, or null
  const lines = String(text).replace(/\r/g, '').split('\n').slice(0, 40).join('\n');
  const m = /^form:\s*(.+?)\s*$/mi.exec(lines) || /^#\s+(.+?)\s*$/m.exec(lines);
  return m ? m[1] : null;
}
/* Reads a saved .md into plain data (no page needed). */
export function parseMd(def, txt) {
  const lines = txt.replace(/\r/g, '').split('\n');
  if (keyOf(formOf(txt)) !== keyOf(def.number)) throw new Error(`This file is not a ${def.number} form (no "form: ${def.number}" found).`);
  const single = {}, multi = {}, styles = {}, found = new Map(); let curGroup = null, curItem = null, i = 0, mode = '';
  const sl = {}, ml = {}, groups = []; def.md.sections.forEach(s => { (s.fields || []).forEach(([id, l]) => sl[norm(l)] = id); (s.multi || []).forEach(([id, l]) => ml[norm(l)] = id); (s.groups || []).forEach(g => groups.push(g)); });
  Object.entries(def.md.malias || {}).forEach(([l, id]) => ml[norm(l)] = id);
  while (i < lines.length) {
    const ln = lines[i]; let m;
    if ((m = ln.match(/^###\s+(.+?)\s*$/))) {
      const t = norm(m[1]);
      if (curGroup && new RegExp('^' + norm(curGroup.item).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s+\\d+').test(t)) { curItem = {}; found.get(curGroup).push(curItem); mode = 'item'; }
      else if (ml[t]) {
        mode = 'multi'; let j = i + 1; while (j < lines.length && lines[j].trim() === '') j++;
        const buf = [];
        if (lines[j] && /^```/.test(lines[j])) { j++; while (j < lines.length && !/^```/.test(lines[j])) buf.push(lines[j++]); i = j; }
        else { while (j < lines.length && !/^#{1,3}\s/.test(lines[j])) buf.push(lines[j++]); i = j - 1; }
        multi[ml[t]] = buf.join('\n').trim();
      }
    } else if ((m = ln.match(/^##\s+(.+?)\s*$/))) {
      curGroup = groups.find(g => norm(g.heading) === norm(m[1])) || null; curItem = null; mode = norm(m[1]) === 'field styles' ? 'sty' : norm(m[1]) === 'default fonts' ? 'dfl' : 'sec'; if (curGroup && !found.has(curGroup)) found.set(curGroup, []);
    } else if ((m = ln.match(/^[-*]\s+(.+?):\s?(.*)$/))) {
      const k = norm(m[1]);
      if (mode === 'sty' || mode === 'dfl') {
        const p = m[2].split(/[,;]/).map(x => x.trim()).filter(Boolean), isMeta = x => /^(not bold|bold|not italic|italic|\d+(\.\d+)?\s*pt|types:.*)$/i.test(x), ty = p.find(x => /^types:/i.test(x));
        const id = mode === 'dfl' ? ({ text: '~body', body: '~body', date: '~date', signature: '~sig', sig: '~sig' })[m[1].trim().toLowerCase()] : m[1].trim().toLowerCase();
        if (id) styles[id] = { f: p.find(x => !isMeta(x)) || '', s: parseFloat((p.find(x => /^\d+(\.\d+)?\s*pt$/i.test(x)) || '0')) || 0, b: p.some(x => /^bold$/i.test(x)) ? 1 : p.some(x => /^not bold$/i.test(x)) ? -1 : 0, i: p.some(x => /^italic$/i.test(x)) ? 1 : p.some(x => /^not italic$/i.test(x)) ? -1 : 0, t: ty ? ty.slice(6).trim() : '' };
      }
      else if (mode === 'item' && curItem) { const f = curGroup.fields.find(([, l]) => norm(l) === k); if (f) curItem[f[0]] = m[2].trim(); }
      else if (sl[k] || def.md.alias?.[k]) single[sl[k] || def.md.alias[k]] = m[2].trim();
    }
    i++;
  }
  const res = { single, multi, found, styles, groups }; def.md.migrate?.(res); return res;
}
export function fromMarkdown(def, api, txt) {
  const { single, multi, found, styles, groups } = parseMd(def, txt);
  Object.entries(single).forEach(([id, v]) => { const e = api.$(id); if (!e) return; if (e.type === 'checkbox') e.checked = /^(yes|true|x|1)$/i.test(v); else e.value = v; });
  Object.entries(multi).forEach(([id, v]) => { const e = api.$(id); if (e) e.value = v; });
  groups.forEach(g => g.set(api, found.get(g) || []));
  api.setStyles(styles);
}


/* ---------- Mount a form into a host element ---------- */
const TYPES = [
  { id: 'default', label: 'Default', fonts: ['Arial', 'Courier New'] },
  { id: 'hand', label: 'Handwriting', fonts: ['Caveat', 'Reenie Beanie', 'Indie Flower', 'Schoolbell'] },
  { id: 'stamp', label: 'Stamp', fonts: ['Special Elite'] },
  { id: 'cursive', label: 'Cursive', fonts: ['Cedarville Cursive', 'Alex Brush', 'Satisfy', 'Allura', 'Kaushan Script', 'Great Vibes', 'Mrs Saint Delafield', 'Arizonia', 'Corinthia', 'Herr Von Muellerhoff', 'Mr De Haviland', 'Whisper', 'Water Brush', 'Mr Dafoe'] }
];
export const FONT_TYPES = TYPES;
const STAFF_RE = /clerk|judge|justice|magistrate|judicial|court reporter|court administrator|reporter of decisions/i, ATTY_RE = /attorney/i;
/* Courier New is for court staff; the stamp font is for attorneys and court staff. */
/* kind: 'body' | 'date' | 'sig'. The stamp font is for dates and signatures only, never body text. */
export const fontAllowed = (f, role, kind) => f === 'Courier New' ? STAFF_RE.test(role || '') : f === 'Special Elite' ? kind !== 'body' && (STAFF_RE.test(role || '') || ATTY_RE.test(role || '')) : true;
export const fontLock = (f, kind) => f === 'Courier New' ? 'Court staff only' : f === 'Special Elite' ? (kind === 'body' ? 'Dates and signatures only' : 'Attorneys and court staff only') : '';
export const FONT_WARNING = 'Your default text font has to be readable. Most judges do not accept cursive fonts, and a few do not accept any handwriting font. Use Arial unless you know your judge allows something else.';
const FB = { hand: 'cursive', stamp: "'Courier New',monospace", cursive: 'cursive' };
const SCALE = { 'Caveat': 1.25, 'Reenie Beanie': 1.35, 'Indie Flower': 1.05, 'Schoolbell': 1.05, 'Cedarville Cursive': 1.2, 'Alex Brush': 1.4, 'Satisfy': 1.15, 'Allura': 1.45, 'Kaushan Script': 1.1, 'Great Vibes': 1.45, 'Mrs Saint Delafield': 1.7, 'Arizonia': 1.35, 'Corinthia': 1.8, 'Herr Von Muellerhoff': 1.7, 'Mr De Haviland': 1.6, 'Whisper': 1.55, 'Water Brush': 1.45, 'Mr Dafoe': 1.2 };
const typeOf = f => (TYPES.find(t => t.fonts.includes(f)) || {}).id || '';
const famOf = f => f === 'Arial' || !f ? 'Arial,Helvetica,sans-serif' : f === 'Courier New' ? "'Courier New',Courier,monospace" : `'${f}',${FB[typeOf(f)] || 'cursive'}`;
export const fontCss = f => 'font-family:' + famOf(f) + (SCALE[f] ? `;font-size:${SCALE[f]}em` : '');
const parseTypes = t => { const l = String(t || '').split('+').filter(x => TYPES.some(y => y.id === x)); return l.length ? TYPES.filter(y => l.includes(y.id)).map(y => y.id) : ['default']; };
const normT = (t, f) => { const set = new Set(parseTypes(t)); if (f && typeOf(f)) set.add(typeOf(f)); return TYPES.filter(y => set.has(y.id)).map(y => y.id).join('+'); };
const nb = x => x === true ? 1 : x === false || x == null ? 0 : Math.sign(+x) || 0;
const blankSt = () => ({ f: '', s: 0, b: 0, i: 0, t: 'default' });
const normSt = v => ({ f: v?.f || '', s: +v?.s || 0, b: nb(v?.b), i: nb(v?.i), t: normT(v?.t, v?.f) });
const FSIZES = [8, 9, 10, 11, 12, 13, 14, 15, 16];
export const GFONTS = 'https://fonts.googleapis.com/css2?' + ['Caveat:wght@400;700', 'Reenie+Beanie', 'Indie+Flower', 'Schoolbell', 'Special+Elite', 'Cedarville+Cursive', 'Alex+Brush', 'Satisfy', 'Allura', 'Kaushan+Script', 'Great+Vibes', 'Mrs+Saint+Delafield', 'Arizonia', 'Corinthia', 'Herr+Von+Muellerhoff', 'Mr+De+Haviland', 'Whisper', 'Water+Brush', 'Mr+Dafoe'].map(f => 'family=' + f).join('&') + '&display=swap';
const STAR = '<svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><path d="M10 2.2l2.4 5 5.5.7-4 3.8 1 5.4L10 14.4 5.1 17.1l1-5.4-4-3.8 5.5-.7z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>';
const FP_CSS = `.fp{position:fixed;z-index:2147483000;width:320px;max-width:calc(100vw - 16px);max-height:min(430px,calc(100vh - 16px));display:flex;flex-direction:column;background:#fff;color:#1b2433;border:1px solid #b9c2cf;border-radius:10px;box-shadow:0 14px 36px rgba(9,22,40,.3);font:13px Arial,Helvetica,sans-serif;overflow:hidden}
.fp *{box-sizing:border-box}.fp button{font:inherit;color:inherit;cursor:pointer}
.fp-types{display:flex;flex-wrap:wrap;gap:5px;padding:9px 10px;background:#f4f7fb;border-bottom:1px solid #dde3ec}
.fp-types .fp-t{border:1px solid #b9c2cf;border-radius:14px;background:#fff;padding:3px 10px;font-size:12px;font-weight:600;color:#10264a}
.fp-types .fp-t[aria-pressed=true]{background:#10264a;border-color:#10264a;color:#fff}
.fp-list{overflow-y:auto;padding:4px 6px 8px;overscroll-behavior:contain}
.fp-h{font-size:11px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:#5a667a;padding:10px 6px 3px}
.fp-r{display:flex;align-items:center;gap:2px}
.fp-o{flex:1;min-width:0;display:flex;flex-direction:column;align-items:flex-start;text-align:left;border:0;background:none;border-radius:6px;padding:5px 8px;line-height:1.25}
.fp-o:disabled{opacity:.5;cursor:not-allowed}.fp-o:disabled:hover{background:none}.fp-o:hover:not(:disabled),.fp-o:focus-visible{background:#e8eef8;outline:none}.fp-o[aria-selected=true]{background:#dbe6f7}
.fp-o .fp-s{display:block;max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:19px;line-height:1.3}
.fp-o small{font-size:11px;color:#5a667a}.fp-o.fp-d{padding:8px}.fp-o.fp-d span{font-weight:600}
.fp-f{flex:none;width:30px;height:30px;border:0;background:none;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#8a95a8}
.fp-f svg{fill:none}.fp-f:hover{background:#e8eef8;color:#10264a}.fp-f[aria-pressed=true]{color:#c58a00}.fp-f[aria-pressed=true] svg{fill:currentColor}`;
const today = () => { const d = new Date(); return String(d.getMonth() + 1).padStart(2, '0') + '/' + String(d.getDate()).padStart(2, '0') + '/' + d.getFullYear(); };

export async function mountForm(def, host, { account, role, md, onDirty, onEdit, readOnly = false, actions = [], onAction, favs: favList, onFavs, onFontNotice, onNote } = {}) {
  const allow = (f, key) => fontAllowed(f, role, key ? kindOf(key) : undefined);
  const who = { name: (account?.name || account?.displayName || '').trim(), org: account?.organization || '', title: account?.title || account?.jobTitle || '', badge: account?.badgeNumber || account?.badge || '', bar: account?.barNumber || account?.barNo || '', today: today() };
  const roles = (def.roles || []).filter(r => !r.for || r.for.test(role || ''));
  const roleBox = roles.length && who.name ? `<div class="fd-roles"><b>Fill in my details as</b><small class="fd-hint">${esc(who.name)}. Tick every role you hold on this form. Untick to clear what it filled in.</small>${roles.map(r => `<label class="chk"><input type="checkbox" data-role="${esc(r.id)}"> <span>${esc(r.label)}${r.hint ? ` <small class="fd-hint">${esc(r.hint)}</small>` : ''}</span></label>`).join('')}</div>` : '';
  const hasD = /data-font="date"/.test(def.panel), hasS = /data-font="(sig|std|judge)"/.test(def.panel);
  const dfRow = (k, t, h) => `<div class="fd-dr"><b>${t}</b>${h ? ` <small class="fd-hint">${h}</small>` : ''}<div class="fd-fx" data-for="~${k}"></div></div>`;
  const dfBox = `<details class="fd-dfl"><summary>Document fonts</summary><small class="fd-hint">One font for each kind of text across the whole document. Any date or signature field can still use its own font below.</small>${dfRow('body', 'Default text', 'fields like "The defendant did the following"')}${hasD ? dfRow('date', 'Date blocks') : ''}${hasS ? dfRow('sig', 'Signature blocks', 'and name blocks (type or print)') : ''}</details><div class="fd-warn" id="fd-warn" role="note" hidden>${esc(FONT_WARNING)}</div>`;
  const caseCard = `<div class="fd-case" id="fd-case"><b>Case</b><div class="fd-cv" id="fd-cv"></div><small class="fd-hint">The case number and judge are added by the court system when this is filed. They cannot be typed in.</small></div>`;
  host.innerHTML = `<div class="fd-wrap"><div class="fd-panel" id="fd-panel"><h3>${esc(def.number)}</h3><small class="fd-hint">Fill in the fields. The document updates as you type and adds pages as needed.</small><div class="fd-tools"><button type="button" class="btn outline sm" data-fd="undo" title="Undo (Ctrl+Z)" disabled>Undo</button><button type="button" class="btn outline sm" data-fd="redo" title="Redo (Ctrl+Y)" disabled>Redo</button><details class="fd-keys"><summary>Shortcuts</summary><dl><dt>Ctrl+Z</dt><dd>Undo</dd><dt>Ctrl+Y or Ctrl+Shift+Z</dt><dd>Redo</dd><dt>Ctrl+B</dt><dd>Bold</dd><dt>Ctrl+I</dt><dd>Italic</dd><dt>Ctrl+Shift+&gt; or &lt;</dt><dd>Larger or smaller text</dd><dt>Ctrl+S</dt><dd>Save</dd><dt>Ctrl+P</dt><dd>Print</dd><dt>Tab</dt><dd>Next field</dd><dt>Esc</dt><dd>Close the font bar</dd></dl><small class="fd-hint">Bold, italic and size apply to fields that have font options (size needs a font other than the default). On a Mac, use Command instead of Ctrl.</small></details></div><fieldset class="fd-fs0"${readOnly ? ' disabled' : ''}>${roleBox}${dfBox}${def.panel}</fieldset>
    <div class="fd-status" id="fd-status" role="status" aria-live="polite"></div><div class="fd-people" id="fd-people"></div>
    <div class="fd-btns">${actions.includes('save') ? '<button type="button" class="btn" data-fd="save">Save</button>' : ''}${actions.includes('share') ? '<button type="button" class="btn outline" data-fd="share">Share</button>' : ''}${actions.includes('file') ? '<button type="button" class="btn" data-fd="file">File</button>' : ''}<div class="fd-dl"><button type="button" class="btn outline" data-fd="download" aria-haspopup="menu" aria-expanded="false">Download</button><div class="fd-menu" role="menu" hidden><button type="button" role="menuitem" data-fd="pdf">PDF document</button><button type="button" role="menuitem" data-fd="md">Markdown file (.md)</button></div></div><button type="button" class="btn outline" data-fd="print">Print</button></div><small class="fd-msg" id="fd-msg" role="status"></small></div>
    <div class="fd-view" id="fd-view"></div></div>`;
  const $ = id => host.querySelector('#' + id), qa = sel => [...host.querySelectorAll(sel)], k = { U, P, B };
  if (!document.getElementById('fd-gfonts')) { const l = document.createElement('link'); l.id = 'fd-gfonts'; l.rel = 'stylesheet'; l.href = GFONTS; document.head.appendChild(l); const st = document.createElement('style'); st.id = 'fd-fp-css'; st.textContent = FP_CSS; document.head.appendChild(st); }
  const favs = new Set(favList ?? (() => { try { return JSON.parse(localStorage.getItem('fd-font-favs') || '[]'); } catch { return []; } })());
  const saveFavs = () => { const l = TYPES.flatMap(t => t.fonts).filter(f => favs.has(f)); if (onFavs) onFavs(l); else { try { localStorage.setItem('fd-font-favs', JSON.stringify(l)); } catch { } } };
  const wrap = host.querySelector('.fd-wrap');
  /* Case number and judge are never typed: they come from the case record (Choose case). */
  const cnE = $('caseno'), jdE = $('judge');
  if (cnE) {
    [cnE, jdE].forEach(e => { if (e) { e.readOnly = true; e.tabIndex = -1; } });
    const row = cnE.closest('.row') || cnE.parentElement; row.style.display = 'none'; row.insertAdjacentHTML('beforebegin', caseCard);
  }
  const paintCase = () => { const v = $('fd-cv'); if (!v || !cnE) return; const c = cnE.value.trim(), j = jdE?.value.trim() || ''; v.innerHTML = c ? `<b>${esc(c)}</b>${j ? `<span>${esc(j)}</span>` : ''}` : '<span class="m">' + (def.opensCase ? 'Assigned when the case is opened' : 'Added when you file') + '</span>'; };

  /* font pickers: sty[id] for each field with options, sty['~body'|'~date'|'~sig'] for the document-wide defaults */
  const sty = {}, bars = [];
  const barInner = () => `<button type="button" class="fd-fp" aria-haspopup="dialog" aria-expanded="false"><span class="fd-fpn"></span><svg viewBox="0 0 12 12" width="10" height="10" aria-hidden="true"><path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></button><select class="fd-fs" aria-label="Size in points"><option value="">Auto</option>${FSIZES.map(n => `<option value="${n}">${n} pt</option>`).join('')}</select><button type="button" class="fd-fb" aria-pressed="false" aria-label="Bold" title="Bold (Ctrl+B)"><b>B</b></button><button type="button" class="fd-fi" aria-pressed="false" aria-label="Italic" title="Italic (Ctrl+I)"><i>I</i></button>`;
  qa('[data-font]').forEach(el => {
    if (el.dataset.font === 'none') return;
    const bar = document.createElement('div'); bar.className = 'fd-fx'; bar.dataset.for = el.id; bar.innerHTML = barInner();
    el.insertAdjacentElement('afterend', bar); bars.push(bar); sty[el.id] = blankSt();
  });
  qa('.fd-fx[data-for^="~"]').forEach(bar => { bar.innerHTML = barInner(); bars.push(bar); sty[bar.dataset.for] = blankSt(); });
  const kindOf = key => key === '~body' ? 'body' : key === '~date' ? 'date' : key === '~sig' ? 'sig' : catOf(key);
  const catOf = key => { if (key[0] === '~') return null; const v = src(key)?.dataset?.font; return v === 'none' ? null : v === 'date' ? 'date' : v ? 'sig' : 'body'; };
  /* what a field actually looks like: its own choice where it made one, otherwise the document default for its kind */
  const effOf = key => {
    if (key[0] === '~') { const v = sty[key] || blankSt(); return { f: v.f, s: v.s, b: v.b > 0, i: v.i > 0, own: true, d: null }; }
    const c = catOf(key), d = (c && sty['~' + c]) || blankSt(), v = sty[key] || blankSt(), pick = (a, z) => a ? a > 0 : z > 0;
    return { f: v.f || d.f || '', s: v.s || (v.f ? 0 : d.s), b: pick(v.b, d.b), i: pick(v.i, d.i), own: !!v.f, d };
  };
  const styleOf = key => {
    if (!catOf(key)) return ''; const e = effOf(key); let o = '';
    if (e.f) { o += fontCss(e.f) + ';'; if (e.s) o += `font-size:${P(e.s)};line-height:1.25;`; }
    if (e.b) o += 'font-weight:700;'; if (e.i) o += 'font-style:italic;'; return o;
  };
  const warnSync = () => { const w = $('fd-warn'); if (w) w.hidden = !(sty['~body']?.f && typeOf(sty['~body'].f) !== 'default'); };
  const syncBar = bar => {
    warnSync();
    const key = bar.dataset.for, v = sty[key] || blankSt(), e = effOf(key), nm = e.f || 'Arial', n = bar.querySelector('.fd-fpn');
    n.textContent = key[0] === '~' || v.f ? nm : 'Document default · ' + nm; n.style.fontFamily = famOf(e.f);
    const z = bar.querySelector('.fd-fs'); z.disabled = !e.f; z.value = e.f && v.s ? String(v.s) : '';
    bar.querySelector('.fd-fb').setAttribute('aria-pressed', e.b); bar.querySelector('.fd-fi').setAttribute('aria-pressed', e.i);
  };

  const frame = document.createElement('iframe'); frame.className = 'fd-frame'; frame.title = def.number + ' preview';
  frame.srcdoc = `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="${GFONTS}"><style>${BASE_CSS}${FP_CSS}${def.css(k)}</style></head><body><div id="pwrap"><div id="preview"></div></div><div id="measure" class="page" style="height:auto;box-shadow:none"><div class="pc" id="mbox" style="display:flow-root"></div></div><div id="tb" hidden><span class="tn"></span><span class="fx"><button type="button" class="tfb" aria-haspopup="dialog" aria-label="Font"><span class="tfn"></span><svg viewBox="0 0 12 12" width="10" height="10" aria-hidden="true"><path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></button><button type="button" class="tsm" aria-label="Smaller text" title="Smaller (Ctrl+Shift+&lt;)">A−</button><span class="tsv" aria-live="polite"></span><button type="button" class="tsp" aria-label="Larger text" title="Larger (Ctrl+Shift+&gt;)">A+</button><button type="button" class="tbb" aria-pressed="false" aria-label="Bold" title="Bold (Ctrl+B)"><b>B</b></button><button type="button" class="tbi" aria-pressed="false" aria-label="Italic" title="Italic (Ctrl+I)"><i>I</i></button></span></div></body></html>`;
  await new Promise(res => { frame.onload = res; $('fd-view').appendChild(frame); });
  const fd = frame.contentDocument, fw = frame.contentWindow, preview = fd.getElementById('preview'), mbox = fd.getElementById('mbox'), pwrap = fd.getElementById('pwrap');
  if (readOnly) preview.classList.add('ro');
  const val = id => esc($(id).value.trim());
  const PLAIN = (() => { const d = fd.createElement('div'); d.contentEditable = 'plaintext-only'; return d.contentEditable === 'plaintext-only' ? 'plaintext-only' : 'true'; })();
  const src = key => key[0] === '@' ? def.resolve?.(api, key.slice(1)) : $(key);
  const labelOf = el => { let p = el.previousElementSibling; if (!p || p.tagName !== 'LABEL') p = el.parentElement?.querySelector('label'); return (p?.textContent || '').trim(); };
  const api = {
    $, qa, esc, P, B, U, account, role, who, val,
    /* A value that can be edited right on the preview. o: {pre, ph, blank, multi, style, text, off}
       pre    text printed before it (e.g. "/s/ "), only when there is a value
       blank  what prints when the field is empty (the form's own blank line, e.g. "___")
       style  extra inline style (e.g. text-transform) */
    ed(key, o = {}) {
      const e = src(key), raw = o.text !== undefined ? o.text : (e ? String(e.value || '').replace(/\r/g, '') : ''), blank = !raw && o.blank, sys = key === 'caseno' || key === 'judge', st = (sys ? fontCss('Special Elite') + ';' : styleOf(key)) + (o.style || '');   // case number and judge are stamped by the system
      const body = `<span data-f="${esc(key)}" data-ph="${esc(o.ph || (e ? labelOf(e) : key))}"${o.off !== undefined ? ` data-off="${o.off}" data-len="${raw.length}"` : ''}${o.multi ? ' data-multi="1"' : ''}${blank ? ' data-blank="1"' : ''}${sys ? ' data-sys="1"' : ''}${st ? ` style="${esc(st)}"` : ''} ${readOnly || sys ? '' : ` contenteditable="${PLAIN}"`} spellcheck="false">${esc(blank ? o.blank : raw)}${o.multi && raw.endsWith('\n') ? '\n' : ''}</span>`;
      const fx = effOf(key).f, pre = o.pre && /\/s\//.test(o.pre) && fx && typeOf(fx) !== 'default' ? '' : o.pre;   // a styled signature is not prefixed with /s/
      return raw && pre ? esc(pre) + body : body;
    },
    edt: (key, t, o = {}) => api.ed(key, { ...o, text: t, off: api.seg || 0, multi: true }),   // one page's share of a long text
    seg: 0,
    styles: () => sty,
    setStyles(m) { Object.keys(sty).forEach(id => sty[id] = normSt(m?.[id])); bars.forEach(syncBar); },
    render: () => { render(); commit(false); }, note: (t, bad) => { onNote?.(t, bad); const m = $('fd-msg'); m.textContent = t; m.style.color = bad ? '#b33' : '#287a3e'; }
  };
  const AVN = (def.usable ? def.usable(U) : 678 * U), meas = html => { mbox.innerHTML = html; return mbox.getBoundingClientRect().height; };

  /* Blocks: {html} stays whole; {txt, make(text, first)} may be split across pages; {pb:'new'|'cont'|'blank', html?} forces a new page. */
  function paginate(seq) {
    const pages = []; let cur, used;
    const start = mode => { cur = []; pages.push(cur); used = 0; cur.has = false; if (mode === 'cont' && def.contHeader) { const h = def.contHeader(api); cur.push(h); used = meas(h); } };
    start('new');
    for (const it of seq) {
      if (it.pb) { start(it.pb); if (it.html) { cur.push(it.html); used += meas(it.html); cur.has = true; } continue; }
      if (it.html !== undefined) { const h = meas(it.html); if (used + h > AVN && cur.has) start('cont'); cur.push(it.html); used += h; cur.has = true; continue; }
      let rest = it.txt, first = true;
      for (;;) {
        api.seg = it.txt.length - rest.length;
        const full = it.make(rest, first), h = meas(full);
        if (used + h <= AVN) { cur.push(full); used += h; cur.has = true; break; }
        const tk = rest.split(/(\s+)/); let lo = 0, hi = tk.length;
        while (lo < hi) { const m = (lo + hi + 1) >> 1; if (used + meas(it.make(tk.slice(0, m).join('').trimEnd(), first)) <= AVN) lo = m; else hi = m - 1; }
        if (!tk.slice(0, lo).join('').trimEnd()) { if (cur.has) { start('cont'); continue; } lo = tk.length; }
        cur.push(it.make(tk.slice(0, lo).join('').trimEnd(), first)); cur.has = true;
        rest = tk.slice(lo).join('').trimStart(); first = false;
        if (!rest) break;
        start('cont');
      }
    }
    return pages;
  }
  /* The preview scrolls inside its own frame (smoother than scrolling the whole portal page), and the panel scrolls on its own. */
  const wide = () => matchMedia('(min-width:901px)').matches;
  function size() { if (!wide()) { wrap.style.height = ''; return; } wrap.style.height = Math.max(480, innerHeight - wrap.getBoundingClientRect().top - 16) + 'px'; }
  function fit() {
    const s = Math.min(1, (fd.documentElement.clientWidth - 32) / 816); preview.style.transform = `scale(${s})`;
    pwrap.style.width = (816 * s) + 'px'; pwrap.style.height = (preview.offsetHeight * s) + 'px';
  }
  /* ---- editing on the preview ---- */
  const tb = fd.getElementById('tb'); let active = null, editing = false, rendering = false;
  const caretOf = el => { const sel = fd.getSelection(); if (!sel.rangeCount || !el.contains(sel.anchorNode)) return 0; const r = fd.createRange(); r.selectNodeContents(el); r.setEnd(sel.anchorNode, sel.anchorOffset); return r.toString().length; };
  const setCaret = (el, n) => {
    const w = fd.createTreeWalker(el, NodeFilter.SHOW_TEXT), sel = fd.getSelection(), r = fd.createRange(); let t, acc = 0, done = false;
    while ((t = w.nextNode())) { if (acc + t.length >= n) { r.setStart(t, n - acc); done = true; break; } acc += t.length; }
    if (!done) { r.selectNodeContents(el); r.collapse(false); } else r.collapse(true);
    sel.removeAllRanges(); sel.addRange(r);
  };
  const fieldsOf = key => [...preview.querySelectorAll('[data-f]')].filter(e => e.dataset.f === key);
  function placeTb(el) {
    if (!el || !el.isConnected) { tb.hidden = true; return; }
    const r = el.getBoundingClientRect(), vw = fd.documentElement.clientWidth, vh = fd.documentElement.clientHeight; tb.hidden = false;
    const h = tb.offsetHeight, w = tb.offsetWidth; let top = r.top - h - 8; if (top < 6) top = Math.min(r.bottom + 8, vh - h - 6);
    tb.style.top = Math.max(6, top) + 'px'; tb.style.left = Math.max(8, Math.min(r.left, vw - w - 8)) + 'px';
  }
  function paintTb(key) {
    const s = sty[key], e = effOf(key), nm = e.f || 'Arial';
    tb.querySelector('.tfn').textContent = s && !s.f ? 'Document default · ' + nm : nm; tb.querySelector('.tfn').style.fontFamily = famOf(e.f);
    tb.querySelector('.tsv').textContent = e.f && (e.s || '') ? e.s + ' pt' : 'Auto';
    tb.querySelector('.tsm').disabled = tb.querySelector('.tsp').disabled = !e.f;
    tb.querySelector('.tbb').setAttribute('aria-pressed', e.b); tb.querySelector('.tbi').setAttribute('aria-pressed', e.i);
  }
  function showTb(el) {
    const key = el.dataset.f, s = sty[key], e = src(key);
    tb.querySelector('.tn').textContent = (e && labelOf(e)) || key; tb.classList.toggle('plain', !s);
    if (s) paintTb(key);
    placeTb(el);
  }
  function restore() {
    if (!active || !editing) { if (!editing) tb.hidden = true; return; }
    let el, local = active.caret || 0;
    if (active.abs !== undefined) { const c = fieldsOf(active.key).filter(e => e.dataset.off !== undefined); el = c.find(e => active.abs <= +e.dataset.off + +e.dataset.len) || c[c.length - 1]; if (el) local = Math.max(0, active.abs - +el.dataset.off); }
    else el = fieldsOf(active.key)[active.idx || 0];
    if (!el) { tb.hidden = true; return; }
    el.focus({ preventScroll: true }); setCaret(el, local); showTb(el);
  }
  function render() {
    paintCase(); rendering = true; const keep = fd.documentElement.scrollTop;
    const pages = paginate(def.build(api));
    preview.innerHTML = pages.map(p => `<div class="page"><div class="pc">${p.join('')}</div><div class="foot">${esc(def.footer || def.number)}</div></div>`).join(''); fit();
    fd.documentElement.scrollTop = keep; rendering = false; restore();
  }
  function fromPreview(el) {
    const key = el.dataset.f, tgt = src(key); if (!tgt) return;
    let text = (PLAIN === 'plaintext-only' ? el.textContent : el.innerText).replace(/ /g, ' '); if (!el.dataset.multi) text = text.replace(/\s*\n\s*/g, ' '); else text = text.replace(/\n$/, ''); if (!text.trim()) text = '';
    const caret = caretOf(el);
    if (el.dataset.off !== undefined) { const off = +el.dataset.off, len = +el.dataset.len; tgt.value = tgt.value.slice(0, off) + text + tgt.value.slice(off + len); el.dataset.len = text.length; active = { key, abs: off + caret }; }
    else { tgt.value = text; active = { key, idx: fieldsOf(key).indexOf(el), caret }; }
    editing = true; mark(); commit(true); later();
  }
  function setStyle(key, patch) {
    const cur = sty[key]; if (!cur) return;
    if (patch.f && !allow(patch.f, key)) { api.note(fontLock(patch.f, kindOf(key)) + ': ' + patch.f + ' is not available here.', true); return; }
    const n = { ...cur, ...patch };   // the size you chose stays when you pick another font
    n.t = normT(n.t, n.f); sty[key] = n; bars.forEach(syncBar); if (active && sty[active.key]) paintTb(active.key);
    if (key === '~body' && patch.f && typeOf(patch.f) !== 'default' && patch.f !== cur.f) onFontNotice?.(typeOf(patch.f), patch.f, FONT_WARNING);
    mark(); commit(false); if (editing) render(); else later();
  }
  function toggleBI(key, which) {   // which: 'b' | 'i'. Stored as 1 on, -1 off, 0 follow the document default
    const e = effOf(key), want = !e[which], dv = (e.d ? e.d[which] : 0) > 0;
    setStyle(key, { [which]: e.d && want === dv ? 0 : want ? 1 : -1 });
  }
  function stepSize(key, dir) {
    const e = effOf(key); if (!e.f) return; const base = e.s || 10;
    const next = dir > 0 ? FSIZES.find(n => n > base) : [...FSIZES].reverse().find(n => n < base); if (next) setStyle(key, { s: next });
  }
  preview.addEventListener('input', e => { if (e.isComposing) return; const el = e.target.closest?.('[data-f]'); if (el) fromPreview(el); });
  preview.addEventListener('compositionend', e => { const el = e.target.closest?.('[data-f]'); if (el) fromPreview(el); });
  preview.addEventListener('focusin', e => {
    const el = e.target.closest?.('[data-f]'); if (!el) return; editing = true;
    if (el.dataset.blank) { delete el.dataset.blank; el.dataset.wb = '1'; el.textContent = ''; }
    if (!active || active.key !== el.dataset.f || active.abs === undefined && active.idx !== fieldsOf(el.dataset.f).indexOf(el)) active = el.dataset.off !== undefined ? { key: el.dataset.f, abs: +el.dataset.off } : { key: el.dataset.f, idx: fieldsOf(el.dataset.f).indexOf(el), caret: 0 };
    showTb(el);
  });
  preview.addEventListener('focusout', e => {
    const el = e.target; if (rendering || !el.isConnected || !el.dataset?.wb) return; delete el.dataset.wb;
    if (el.textContent) return;
    if (!e.relatedTarget || !(preview.contains(e.relatedTarget) || tb.contains(e.relatedTarget))) { editing = false; active = null; tb.hidden = true; }
    later();
  });
  preview.addEventListener('keydown', e => {
    const el = e.target.closest?.('[data-f]'); if (!el) return;
    if (e.key === 'Enter' && !el.dataset.multi) e.preventDefault();
    if (e.key === 'Escape') { el.blur(); editing = false; active = null; tb.hidden = true; }
  });
  preview.addEventListener('click', e => {
    if (readOnly) return;
    const c = e.target.closest?.('[data-chk]'); if (c) { const i = $(c.dataset.chk); if (i) { i.checked = !i.checked; mark(); render(); commit(false); } return; }
    const o = e.target.closest?.('[data-sel]'); if (o) { const [id, v] = o.dataset.sel.split('='), i = $(id); if (i) { if (i.value === v) i.selectedIndex = 0; else i.value = v; mark(); render(); commit(false); } }
  });
  fd.addEventListener('mousedown', e => { if (!e.target.closest('[data-f],#tb,.fp')) { editing = false; active = null; tb.hidden = true; } });
  tb.addEventListener('mousedown', e => e.preventDefault());
  tb.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b || !active || b.disabled) return; editing = true;
    if (b.classList.contains('tfb')) { if (pick && pick.anchor === b) closePicker(); else openPicker(active.key, b, fd, true); return; }
    closePicker();
    if (b.classList.contains('tbb')) toggleBI(active.key, 'b'); else if (b.classList.contains('tbi')) toggleBI(active.key, 'i');
    else if (b.classList.contains('tsm')) stepSize(active.key, -1); else if (b.classList.contains('tsp')) stepSize(active.key, 1);
  });
  fd.addEventListener('scroll', () => { const el = active && fieldsOf(active.key)[active.idx || 0] || fd.activeElement?.closest?.('[data-f]'); if (!tb.hidden && el) placeTb(el); }, true);
  fw.addEventListener('blur', () => setTimeout(() => { if (!fd.hasFocus()) { editing = false; tb.hidden = true; } }, 250));
  /* ---- undo / redo: one history for the whole form (every field, count and font choice) ---- */
  let hist = [], hi = 0, lastAt = 0, lastTyping = false;
  function snap() {
    const f = {}, mm = {}, g = [];
    def.md.sections.forEach(sec => { (sec.fields || []).forEach(([id]) => { const e = $(id); if (e) f[id] = e.type === 'checkbox' ? e.checked : e.value; }); (sec.multi || []).forEach(([id]) => { const e = $(id); if (e) mm[id] = e.value; }); (sec.groups || []).forEach(x => g.push(x.get(api))); });
    return JSON.stringify({ f, m: mm, g, s: sty });
  }
  function unsnap(str) {
    const st = JSON.parse(str); let gi = 0;
    def.md.sections.forEach(sec => { (sec.fields || []).forEach(([id]) => { const e = $(id); if (e && id in st.f) { if (e.type === 'checkbox') e.checked = !!st.f[id]; else e.value = st.f[id]; } }); (sec.multi || []).forEach(([id]) => { const e = $(id); if (e && id in st.m) e.value = st.m[id]; }); (sec.groups || []).forEach(x => x.set(api, st.g[gi++] || [])); });
    api.setStyles(st.s);
  }
  function updUndo() { const u = host.querySelector('[data-fd=undo]'), r = host.querySelector('[data-fd=redo]'); if (u) u.disabled = hi <= 0; if (r) r.disabled = hi >= hist.length - 1; }
  function commit(typing) {
    const s2 = snap(); if (s2 === hist[hi]) return; const now = Date.now();
    if (typing && lastTyping && now - lastAt < 900 && hi > 0 && hi === hist.length - 1) hist[hi] = s2;
    else { hist.length = hi + 1; hist.push(s2); hi++; if (hist.length > 300) { hist.shift(); hi--; } }
    lastAt = now; lastTyping = typing; updUndo();
  }
  function jump(d) {
    const n = hi + d; if (n < 0 || n >= hist.length) return; hi = n; lastTyping = false; unsnap(hist[hi]); mark(); render(); updUndo();
  }
  /* ---- the saved form (.md) as plain data, for merging what several people typed ---- */
  const getMd = () => toMarkdown(def, api);
  const isCb = id => $(id)?.type === 'checkbox';
  function stateFromMd(txt) {
    const p = parseMd(def, txt), f = {}, m = {}, g = [], s = {};
    def.md.sections.forEach(sec => {
      (sec.fields || []).forEach(([id]) => { if (id in p.single) f[id] = isCb(id) ? /^(yes|true|x|1)$/i.test(p.single[id]) : p.single[id]; });
      (sec.multi || []).forEach(([id]) => { if (id in p.multi) m[id] = p.multi[id]; });
      (sec.groups || []).forEach(x => g.push((p.found.get(x) || []).map(it => Object.fromEntries(x.fields.map(([k]) => [k, it[k] || '']))))); });
    Object.keys(p.single).forEach(id => { if (!(id in f) && !(id in m) && $(id)) f[id] = isCb(id) ? /^(yes|true|x|1)$/i.test(p.single[id]) : p.single[id]; });
    Object.keys(sty).forEach(id => { s[id] = normSt(p.styles[id]); });
    return { f, m, g, s };
  }
  function applyState(st) {   // only touches what differs, so nobody loses their place while typing
    const put = (id, v) => { const e = $(id); if (!e || v === undefined) return; if (e.type === 'checkbox') { if (e.checked !== !!v) e.checked = !!v; } else if (e.value.trim() !== String(v).trim()) e.value = v; };
    Object.entries(st.f || {}).forEach(([id, v]) => put(id, v)); Object.entries(st.m || {}).forEach(([id, v]) => put(id, v));
    let gi = 0; def.md.sections.forEach(sec => (sec.groups || []).forEach(x => { const items = st.g?.[gi++]; if (!items) return; const cur = x.get(api).map(it => Object.fromEntries(x.fields.map(([k]) => [k, it[k] || '']))); if (JSON.stringify(cur) !== JSON.stringify(items)) x.set(api, items); }));
    const want = {}; Object.keys(sty).forEach(id => { want[id] = normSt(st.s?.[id]); }); if (JSON.stringify(want) !== JSON.stringify(sty)) api.setStyles(want);
    render(); hist = [snap()]; hi = 0; lastTyping = false; updUndo();
  }
  const undo = () => jump(-1), redo = () => jump(1);
  /* c: { caseno, judge } or null. Judge is already formatted (Hon. J. Doe). */
  function setCase(c) { if (!cnE) return; cnE.value = c?.caseno || ''; if (jdE) jdE.value = c?.judge || ''; render(); mark(); commit(false); }
  const focusKey = () => { const a = document.activeElement; if (a && panel.contains(a) && a !== document.body) return sty[a.id] ? a.id : null; return editing && active ? active.key : null; };
  function onKey(e) {
    if (!host.isConnected || !(e.ctrlKey || e.metaKey) || e.altKey) return;
    if (readOnly && e.key.toLowerCase() !== 'p') return;
    if (e.target?.closest?.('dialog,[data-fd-file]')) return;
    const k = e.key.toLowerCase();
    if (k === 'z' && !e.shiftKey) { undo(); e.preventDefault(); }
    else if (k === 'y' || (k === 'z' && e.shiftKey)) { redo(); e.preventDefault(); }
    else if (k === 'b' || k === 'i') { const key = focusKey(); if (key && sty[key] && key[0] !== '~') { toggleBI(key, k); e.preventDefault(); } }
    else if (e.shiftKey && (e.key === '>' || e.key === '<' || e.key === '.' || e.key === ',')) { const key = focusKey(); if (key && sty[key] && key[0] !== '~') { stepSize(key, e.key === '>' || e.key === '.' ? 1 : -1); e.preventDefault(); } }
    else if (k === 's' && !e.shiftKey) { if (onAction && actions.includes('save')) onAction('save'); else saveMd(); e.preventDefault(); }
    else if (k === 'p' && !e.shiftKey) { fw.focus(); fw.print(); e.preventDefault(); }
  }
  document.addEventListener('keydown', onKey); fd.addEventListener('keydown', onKey);
  let raf = 0; const later = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(render); };
  const ro = new ResizeObserver(() => { size(); fit(); }); ro.observe($('fd-view'));
  addEventListener('resize', size); size();
  fd.fonts?.addEventListener?.('loadingdone', later);
  if (def.init) def.init(api);
  if (md) { try { fromMarkdown(def, api, md); api.note('Loaded your saved draft.'); } catch (e) { api.note(e.message, true); } }
  let dirty = false; const mark = () => { if (!dirty) { dirty = true; onDirty?.(); } onEdit?.(); };
  const panel = $('fd-panel');
  panel.addEventListener('focusin', () => { editing = false; active = null; tb.hidden = true; });
  panel.addEventListener('input', e => { if (e.target.closest('.fd-fx')) return; later(); mark(); commit(true); });
  panel.addEventListener('change', e => { const z = e.target.closest('.fd-fs'); if (z) setStyle(z.closest('.fd-fx').dataset.for, { s: parseFloat(z.value) || 0 }); });
  panel.addEventListener('click', e => {
    const fp = e.target.closest('.fd-fp'); if (fp) { if (pick && pick.anchor === fp) closePicker(); else openPicker(fp.closest('.fd-fx').dataset.for, fp, document, false); return; }
    const b = e.target.closest('.fd-fb,.fd-fi'); if (!b) return;
    toggleBI(b.closest('.fd-fx').dataset.for, b.classList.contains('fd-fb') ? 'b' : 'i');
  });
  /* Fill in my details as ... */
  const applied = {};
  panel.addEventListener('change', e => {
    const c = e.target.closest('[data-role]'); if (!c) return; const r = roles.find(x => x.id === c.dataset.role); if (!r) return;
    if (c.checked) { const got = {}; Object.entries(r.fill(api, who) || {}).forEach(([id, v]) => { const el = $(id); if (el && v) { el.value = v; got[id] = v; } }); applied[r.id] = got; }
    else { Object.entries(applied[r.id] || {}).forEach(([id, v]) => { const el = $(id); if (el && el.value === v) el.value = ''; }); delete applied[r.id]; }
    render(); mark(); commit(false);
  });
  /* ---- the font picker (one implementation, shown in the panel and over the preview) ---- */
  let pick = null;
  function closePicker() {
    if (!pick) return; const p = pick; pick = null; p.el.remove(); p.off(); p.anchor.setAttribute?.('aria-expanded', 'false');
    if (!p.inFrame && p.anchor.isConnected) p.anchor.focus({ preventScroll: true });
  }
  function openPicker(key, anchor, doc, inFrame) {
    closePicker(); const el = doc.createElement('div'); el.className = 'fp'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Choose a font');
    const sample = () => { const v = String(key[0] === '~' ? '' : src(key)?.value || '').trim().split('\n')[0].slice(0, 28); return v || (key === '~body' ? 'Sample text' : key === '~date' || catOf(key) === 'date' ? '10/04/2026' : 'Jane Q. Public'); };
    const paint = () => {
      const keepTop = el.querySelector('.fp-list')?.scrollTop || 0, s = sty[key], types = parseTypes(s.t), smp = esc(sample());
      const row = f => !allow(f, key) ? `<div class="fp-r"><button type="button" class="fp-o" role="option" disabled aria-disabled="true" data-f="${esc(f)}"><span class="fp-s" style="${fontCss(f)}">${smp}</span><small>${esc(f)} · ${esc(fontLock(f, kindOf(key)))}</small></button></div>` : `<div class="fp-r"><button type="button" class="fp-o" role="option" data-f="${esc(f)}" aria-selected="${s.f === f}"><span class="fp-s" style="${fontCss(f)}">${smp}</span><small>${esc(f)}</small></button><button type="button" class="fp-f" data-fav="${esc(f)}" aria-pressed="${favs.has(f)}" aria-label="${favs.has(f) ? 'Remove ' + esc(f) + ' from favorites' : 'Add ' + esc(f) + ' to favorites'}" title="${favs.has(f) ? 'Remove from favorites' : 'Save as a favorite'}">${STAR}</button></div>`;
      const fl = TYPES.flatMap(t => t.fonts).filter(f => favs.has(f) && allow(f, key));
      const dd = key[0] === '~' ? '' : `<button type="button" class="fp-o fp-d" role="option" data-f="" aria-selected="${!s.f}"><span>Use document default</span><small>${esc(effOf(key).d?.f || 'Arial')}</small></button>`;
      el.innerHTML = `<div class="fp-types" role="group" aria-label="Text types">${TYPES.map(t => `<button type="button" class="fp-t" data-t="${t.id}" aria-pressed="${types.includes(t.id)}">${t.label}</button>`).join('')}</div><div class="fp-list" role="listbox" aria-label="Fonts">${dd}${fl.length ? `<div class="fp-h">Favorites</div>${fl.map(row).join('')}` : ''}${TYPES.filter(t => types.includes(t.id)).map(t => `<div class="fp-h">${t.label}</div>${t.fonts.map(row).join('')}`).join('')}</div>`;
      el.querySelector('.fp-list').scrollTop = keepTop;
    };
    const place = () => {
      const r = anchor.getBoundingClientRect(), vw = doc.documentElement.clientWidth, vh = doc.documentElement.clientHeight, w = Math.min(320, vw - 16), h = el.offsetHeight;
      el.style.width = w + 'px'; el.style.left = Math.max(8, Math.min(r.left, vw - w - 8)) + 'px';
      let top = r.bottom + 6; if (top + h > vh - 8) top = Math.max(8, r.top - h - 6); el.style.top = top + 'px';
    };
    paint(); doc.body.appendChild(el); place(); anchor.setAttribute('aria-expanded', 'true');
    el.addEventListener('mousedown', e => { if (inFrame) e.preventDefault(); });
    el.addEventListener('click', e => {
      const t = e.target.closest('.fp-t'), f = e.target.closest('.fp-f'), o = e.target.closest('.fp-o');
      if (t) { const cur = new Set(parseTypes(sty[key].t)); if (cur.has(t.dataset.t)) { if (cur.size > 1) cur.delete(t.dataset.t); } else cur.add(t.dataset.t); setStyle(key, { t: TYPES.filter(y => cur.has(y.id)).map(y => y.id).join('+') }); paint(); place(); }
      else if (f) { const n = f.dataset.fav; if (favs.has(n)) favs.delete(n); else favs.add(n); saveFavs(); paint(); }
      else if (o && !o.disabled) { const n = o.dataset.f; setStyle(key, { f: n }); closePicker(); }
    });
    const onDown = e => { if (!el.contains(e.target) && !anchor.contains(e.target)) closePicker(); };
    const onKeyP = e => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closePicker(); }
      else if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && !inFrame) { const os = [...el.querySelectorAll('.fp-o')], i = os.indexOf(doc.activeElement); os[(i + (e.key === 'ArrowDown' ? 1 : -1) + os.length) % os.length]?.focus(); e.preventDefault(); }
    };
    const onScroll = e => { if (el.contains(e.target)) return; if (!anchor.isConnected) closePicker(); else place(); };
    doc.addEventListener('mousedown', onDown, true); doc.addEventListener('keydown', onKeyP, true); doc.addEventListener('scroll', onScroll, true); (doc.defaultView || window).addEventListener('resize', closePicker);
    pick = { el, anchor, inFrame, off: () => { doc.removeEventListener('mousedown', onDown, true); doc.removeEventListener('keydown', onKeyP, true); doc.removeEventListener('scroll', onScroll, true); (doc.defaultView || window).removeEventListener('resize', closePicker); } };
    if (!inFrame) (el.querySelector('.fp-o[aria-selected=true]') || el.querySelector('.fp-o'))?.focus({ preventScroll: true });
  }
  bars.forEach(syncBar);
  warnSync();
  render();
  hist = [snap()]; hi = 0; updUndo();

  const fileName = ext => def.number.replace(/\s+/g, '_') + '.' + ext;
  async function pdf(btn) {
    const dlb = host.querySelector('[data-fd=download]'); api.note('Creating the PDF…'); dlb.disabled = true;
    try {
      if (!fw.html2pdf) await new Promise((res, rej) => { const s = fd.createElement('script'); s.src = H2P; s.onload = res; s.onerror = () => rej(new Error('load')); fd.head.appendChild(s); });
      try { const used = [...new Set(Object.values(sty).map(v => v.f).filter(Boolean))]; await Promise.all(used.map(f => fd.fonts.load(`16px "${f}"`))); await fd.fonts.ready; } catch (e) { /* fall back to system fonts */ }
      const holder = fd.createElement('div'); holder.style.cssText = 'position:absolute;left:-10000px;top:0;width:816px';
      const el = preview.cloneNode(true); el.style.transform = 'none'; el.id = 'pdfsrc';
      el.querySelectorAll('[contenteditable]').forEach(n => { n.removeAttribute('contenteditable'); n.removeAttribute('data-ph'); n.removeAttribute('data-f'); });
      el.querySelectorAll('.page').forEach(p => { p.style.margin = '0'; p.style.boxShadow = 'none'; p.style.height = '1055px'; });
      holder.appendChild(el); fd.body.appendChild(holder);
      try { await fw.html2pdf().set({ margin: 0, filename: fileName('pdf'), image: { type: 'jpeg', quality: .98 }, html2canvas: { scale: 2.5, useCORS: true, scrollY: 0 }, jsPDF: { unit: 'pt', format: 'letter', orientation: 'portrait' }, pagebreak: { mode: ['css'], after: '.page' } }).from(el).save(); }
      finally { holder.remove(); }
    } catch (e) { api.note('We could not make the PDF here. Choose Print and save as PDF instead.', true); }
    dlb.disabled = false;
  }
  function saveMd() { const blob = new Blob([toMarkdown(def, api)], { type: 'text/markdown' }), l = document.createElement('a'); l.href = URL.createObjectURL(blob); l.download = fileName('md'); document.body.appendChild(l); l.click(); setTimeout(() => { URL.revokeObjectURL(l.href); l.remove(); }, 500); api.note('Downloaded ' + fileName('md')); }
  const menu = host.querySelector('.fd-menu'), dlBtn = host.querySelector('[data-fd=download]');
  const closeMenu = () => { menu.hidden = true; dlBtn.setAttribute('aria-expanded', 'false'); };
  const outside = e => { if (!host.contains(e.target) || !e.target.closest('.fd-dl')) closeMenu(); };
  document.addEventListener('click', outside);
  host.addEventListener('click', e => {
    const b = e.target.closest('[data-fd]'); if (!b) return; const a = b.dataset.fd;
    if (a === 'download') { menu.hidden = !menu.hidden; dlBtn.setAttribute('aria-expanded', String(!menu.hidden)); return; }
    closeMenu();
    if (a === 'undo') undo(); else if (a === 'redo') redo();
    else if (a === 'pdf') pdf(b);
    else if (a === 'print') { fw.focus(); fw.print(); }
    else if (a === 'md') saveMd();
    else if (a === 'save' || a === 'share' || a === 'file') onAction?.(a);
  });
  const statusEl = $('fd-status'), peopleEl = $('fd-people');
  const setStatus = (t, kind = '') => { statusEl.textContent = t; statusEl.dataset.k = kind; };
  const initials = n => String(n || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
  const setPeople = list => { peopleEl.innerHTML = list.length ? `<span class="fd-ph">Here now</span>${list.map(p => `<span class="fd-chip" title="${esc(p.name)}">${esc(initials(p.name))}</span>`).join('')}<span class="fd-pn">${esc(list.map(p => p.name).join(', '))}</span>` : ''; };
  return { api, setCase, getCase: () => ({ caseno: cnE?.value.trim() || '', judge: jdE?.value.trim() || '' }), exportPdf: () => pdf(), exportMd: saveMd, print: () => { fw.focus(); fw.print(); }, getMd, stateFromMd, curState: () => stateFromMd(getMd()), applyState, setStatus, setPeople, destroy() { closePicker(); document.removeEventListener('keydown', onKey); document.removeEventListener('click', outside); ro.disconnect(); removeEventListener('resize', size); host.innerHTML = ''; }, isDirty: () => dirty };
}