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
                                        shown as "Fill in my details as" checkboxes; who = {name,org,title,badge,today}
   Any text field marked data-font="std" (Caveat, Courier New) or data-font="judge" (adds Special Elite) gets a font
   picker with bold and italic. In build(), print those values with api.fv(id, prefix) so the choice shows up.
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
#preview [data-f]:empty{display:inline-block;min-width:3.5em;min-height:1em;vertical-align:bottom}
#preview [data-f]:empty::before{content:attr(data-ph);color:#8a6d00;font:italic 400 .8em Arial,sans-serif;white-space:nowrap}
#preview [data-chk],#preview [data-sel]{cursor:pointer}
#preview [data-chk],#preview [data-sel] .cb{outline:1px dashed rgba(176,128,0,.6);outline-offset:1px;background:rgba(255,214,102,.26)}
#preview [data-chk]:hover,#preview [data-sel]:hover .cb{background:rgba(255,214,102,.6)}
}
#tb{position:fixed;z-index:50;display:flex;gap:4px;align-items:center;background:#1c2b45;color:#fff;border-radius:8px;padding:5px 6px;box-shadow:0 4px 14px rgba(0,0,0,.3);font:12px Arial,sans-serif;max-width:calc(100vw - 16px)}
#tb[hidden]{display:none}#tb .tn{font-weight:600;padding:0 6px 0 2px;max-width:160px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#tb .fx{display:contents}#tb.plain .fx{display:none}
#tb select{height:26px;border-radius:5px;border:0;font:12px Arial,sans-serif;padding:0 4px;background:#fff;color:#1c2b45}#tb select:disabled{opacity:.5}
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
  const st = Object.entries(api.styles()).filter(([, v]) => v.f || v.b || v.i);
  if (st.length) { o.push('## Field styles', ''); st.forEach(([id, v]) => o.push('- ' + id + ': ' + [v.f, v.f && v.s && v.s + 'pt', v.b && 'bold', v.i && 'italic'].filter(Boolean).join(', '))); o.push(''); }
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
      curGroup = groups.find(g => norm(g.heading) === norm(m[1])) || null; curItem = null; mode = norm(m[1]) === 'field styles' ? 'sty' : 'sec'; if (curGroup && !found.has(curGroup)) found.set(curGroup, []);
    } else if ((m = ln.match(/^[-*]\s+(.+?):\s?(.*)$/))) {
      const k = norm(m[1]);
      if (mode === 'sty') { const p = m[2].split(/[,;]/).map(x => x.trim()).filter(Boolean); styles[m[1].trim().toLowerCase()] = { f: p.find(x => !/^(bold|italic|\d+(\.\d+)?\s*pt)$/i.test(x)) || '', s: parseFloat((p.find(x => /^\d+(\.\d+)?\s*pt$/i.test(x)) || '0')) || 0, b: p.some(x => /^bold$/i.test(x)), i: p.some(x => /^italic$/i.test(x)) }; }
      else if (mode === 'item' && curItem) { const f = curGroup.fields.find(([, l]) => norm(l) === k); if (f) curItem[f[0]] = m[2].trim(); }
      else if (sl[k] || def.md.alias?.[k]) single[sl[k] || def.md.alias[k]] = m[2].trim();
    }
    i++;
  }
  return { single, multi, found, styles, groups };
}
export function fromMarkdown(def, api, txt) {
  const { single, multi, found, styles, groups } = parseMd(def, txt);
  Object.entries(single).forEach(([id, v]) => { const e = api.$(id); if (!e) return; if (e.type === 'checkbox') e.checked = /^(yes|true|x|1)$/i.test(v); else e.value = v; });
  Object.entries(multi).forEach(([id, v]) => { const e = api.$(id); if (e) e.value = v; });
  groups.forEach(g => g.set(api, found.get(g) || []));
  api.setStyles(styles);
}


/* ---------- Mount a form into a host element ---------- */
const FONTS = { std: ['Caveat', 'Courier New'], judge: ['Caveat', 'Courier New', 'Special Elite'] };
const FCSS = { 'Caveat': "font-family:'Caveat',cursive;font-size:1.25em", 'Courier New': "font-family:'Courier New',Courier,monospace", 'Special Elite': "font-family:'Special Elite','Courier New',monospace" };
const FSIZES = [8, 9, 10, 11, 12, 13, 14, 15, 16];
const GFONTS = 'https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&family=Special+Elite&display=swap';
const today = () => { const d = new Date(); return String(d.getMonth() + 1).padStart(2, '0') + '/' + String(d.getDate()).padStart(2, '0') + '/' + d.getFullYear(); };

export async function mountForm(def, host, { account, role, md, onDirty, onEdit, readOnly = false, actions = [], onAction } = {}) {
  const who = { name: (account?.name || account?.displayName || '').trim(), org: account?.organization || '', title: account?.title || account?.jobTitle || '', badge: account?.badgeNumber || account?.badge || '', today: today() };
  const roles = (def.roles || []).filter(r => !r.for || r.for.test(role || ''));
  const roleBox = roles.length && who.name ? `<div class="fd-roles"><b>Fill in my details as</b><small class="fd-hint">${esc(who.name)}. Tick every role you hold on this form. Untick to clear what it filled in.</small>${roles.map(r => `<label class="chk"><input type="checkbox" data-role="${esc(r.id)}"> <span>${esc(r.label)}${r.hint ? ` <small class="fd-hint">${esc(r.hint)}</small>` : ''}</span></label>`).join('')}</div>` : '';
  host.innerHTML = `<div class="fd-wrap"><div class="fd-panel" id="fd-panel"><h3>${esc(def.number)}</h3><small class="fd-hint">Fill in the fields. The document updates as you type and adds pages as needed.</small><div class="fd-tools"><button type="button" class="btn outline sm" data-fd="undo" title="Undo (Ctrl+Z)" disabled>Undo</button><button type="button" class="btn outline sm" data-fd="redo" title="Redo (Ctrl+Y)" disabled>Redo</button><details class="fd-keys"><summary>Shortcuts</summary><dl><dt>Ctrl+Z</dt><dd>Undo</dd><dt>Ctrl+Y or Ctrl+Shift+Z</dt><dd>Redo</dd><dt>Ctrl+B</dt><dd>Bold</dd><dt>Ctrl+I</dt><dd>Italic</dd><dt>Ctrl+Shift+&gt; or &lt;</dt><dd>Larger or smaller text</dd><dt>Ctrl+S</dt><dd>Save</dd><dt>Ctrl+P</dt><dd>Print</dd><dt>Tab</dt><dd>Next field</dd><dt>Esc</dt><dd>Close the font bar</dd></dl><small class="fd-hint">Bold, italic and size apply to fields that have font options (size needs a font other than the default). On a Mac, use Command instead of Ctrl.</small></details></div><fieldset class="fd-fs0"${readOnly ? ' disabled' : ''}>${roleBox}${def.panel}</fieldset>
    <div class="fd-status" id="fd-status" role="status" aria-live="polite"></div><div class="fd-people" id="fd-people"></div>
    <div class="fd-btns">${actions.includes('save') ? '<button type="button" class="btn" data-fd="save">Save</button>' : ''}${actions.includes('share') ? '<button type="button" class="btn outline" data-fd="share">Share</button>' : ''}<div class="fd-dl"><button type="button" class="btn outline" data-fd="download" aria-haspopup="menu" aria-expanded="false">Download</button><div class="fd-menu" role="menu" hidden><button type="button" role="menuitem" data-fd="pdf">PDF document</button><button type="button" role="menuitem" data-fd="md">Markdown file (.md)</button></div></div><button type="button" class="btn outline" data-fd="print">Print</button></div><small class="fd-msg" id="fd-msg" role="status"></small></div>
    <div class="fd-view" id="fd-view"></div></div>`;
  const $ = id => host.querySelector('#' + id), qa = sel => [...host.querySelectorAll(sel)], k = { U, P, B };
  const wrap = host.querySelector('.fd-wrap');

  /* font pickers */
  const sty = {}, bars = [];
  qa('[data-font]').forEach(el => {
    const bar = document.createElement('div'); bar.className = 'fd-fx'; bar.dataset.for = el.id;
    bar.innerHTML = `<select class="fd-ff" aria-label="Font">${['', ...(FONTS[el.dataset.font] || FONTS.std)].map(f => `<option value="${f}">${f || 'Default font'}</option>`).join('')}</select><select class="fd-fs" aria-label="Size in points" disabled><option value="">Size</option>${FSIZES.map(n => `<option value="${n}">${n} pt</option>`).join('')}</select><button type="button" class="fd-fb" aria-pressed="false" aria-label="Bold" title="Bold (Ctrl+B)"><b>B</b></button><button type="button" class="fd-fi" aria-pressed="false" aria-label="Italic" title="Italic (Ctrl+I)"><i>I</i></button>`;
    el.insertAdjacentElement('afterend', bar); bars.push(bar); sty[el.id] = { f: '', s: 0, b: false, i: false };
  });
  const readBar = bar => { const f = bar.querySelector('.fd-ff').value; sty[bar.dataset.for] = { f, s: f ? parseFloat(bar.querySelector('.fd-fs').value) || 0 : 0, b: bar.querySelector('.fd-fb').getAttribute('aria-pressed') === 'true', i: bar.querySelector('.fd-fi').getAttribute('aria-pressed') === 'true' }; };
  const syncBar = bar => { const v = sty[bar.dataset.for] || {}; bar.querySelector('.fd-ff').value = v.f || ''; const z = bar.querySelector('.fd-fs'); z.disabled = !v.f; z.value = v.f && v.s ? String(v.s) : ''; bar.querySelector('.fd-fb').setAttribute('aria-pressed', !!v.b); bar.querySelector('.fd-fi').setAttribute('aria-pressed', !!v.i); };

  const frame = document.createElement('iframe'); frame.className = 'fd-frame'; frame.title = def.number + ' preview';
  frame.srcdoc = `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="${GFONTS}"><style>${BASE_CSS}${def.css(k)}</style></head><body><div id="pwrap"><div id="preview"></div></div><div id="measure" class="page" style="height:auto;box-shadow:none"><div class="pc" id="mbox" style="display:flow-root"></div></div><div id="tb" hidden><span class="tn"></span><span class="fx"><select class="tf" aria-label="Font"></select><select class="ts" aria-label="Size in points"></select><button type="button" class="tbb" aria-pressed="false" aria-label="Bold" title="Bold (Ctrl+B)"><b>B</b></button><button type="button" class="tbi" aria-pressed="false" aria-label="Italic" title="Italic (Ctrl+I)"><i>I</i></button></span></div></body></html>`;
  await new Promise(res => { frame.onload = res; $('fd-view').appendChild(frame); });
  const fd = frame.contentDocument, fw = frame.contentWindow, preview = fd.getElementById('preview'), mbox = fd.getElementById('mbox'), pwrap = fd.getElementById('pwrap');
  if (readOnly) preview.classList.add('ro');
  const val = id => esc($(id).value.trim());
  const PLAIN = (() => { const d = fd.createElement('div'); d.contentEditable = 'plaintext-only'; return d.contentEditable === 'plaintext-only' ? 'plaintext-only' : 'true'; })();
  const src = key => key[0] === '@' ? def.resolve?.(api, key.slice(1)) : $(key);
  const labelOf = el => { let p = el.previousElementSibling; if (!p || p.tagName !== 'LABEL') p = el.parentElement?.querySelector('label'); return (p?.textContent || '').trim(); };
  const styleOf = key => { const s = sty[key]; if (!s) return ''; let o = ''; if (s.f) { o += FCSS[s.f] + ';'; if (s.s) o += `font-size:${P(s.s)};line-height:1.25;`; } if (s.b) o += 'font-weight:700;'; if (s.i) o += 'font-style:italic;'; return o; };
  const api = {
    $, qa, esc, P, B, U, account, role, who, val,
    /* A value that can be edited right on the preview. o: {pre, ph, blank, multi, style, text, off}
       pre    text printed before it (e.g. "/s/ "), only when there is a value
       blank  what prints when the field is empty (the form's own blank line, e.g. "___")
       style  extra inline style (e.g. text-transform) */
    ed(key, o = {}) {
      const e = src(key), raw = o.text !== undefined ? o.text : (e ? String(e.value || '').replace(/\r/g, '') : ''), blank = !raw && o.blank, st = styleOf(key) + (o.style || '');
      const body = `<span data-f="${esc(key)}" data-ph="${esc(o.ph || (e ? labelOf(e) : key))}"${o.off !== undefined ? ` data-off="${o.off}" data-len="${raw.length}"` : ''}${o.multi ? ' data-multi="1"' : ''}${blank ? ' data-blank="1"' : ''}${st ? ` style="${esc(st)}"` : ''} ${readOnly ? '' : ` contenteditable="${PLAIN}"`} spellcheck="false">${esc(blank ? o.blank : raw)}${o.multi && raw.endsWith('\n') ? '\n' : ''}</span>`;
      return raw && o.pre ? esc(o.pre) + body : body;
    },
    edt: (key, t, o = {}) => api.ed(key, { ...o, text: t, off: api.seg || 0, multi: true }),   // one page's share of a long text
    seg: 0,
    styles: () => sty,
    setStyles(m) { Object.keys(sty).forEach(id => sty[id] = { f: '', s: 0, b: false, i: false, ...(m?.[id] || {}) }); bars.forEach(syncBar); },
    render: () => { render(); commit(false); }, note: (t, bad) => { const m = $('fd-msg'); m.textContent = t; m.style.color = bad ? '#b33' : '#287a3e'; }
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
  function showTb(el) {
    const key = el.dataset.f, s = sty[key], bar = bars.find(b => b.dataset.for === key), e = src(key);
    tb.querySelector('.tn').textContent = (e && labelOf(e)) || key; tb.classList.toggle('plain', !s);
    if (s && bar) {
      const tf = tb.querySelector('.tf'), ts = tb.querySelector('.ts');
      tf.innerHTML = [...bar.querySelector('.fd-ff').options].map(o => `<option value="${esc(o.value)}">${esc(o.textContent)}</option>`).join('');
      ts.innerHTML = '<option value="">Size</option>' + FSIZES.map(n => `<option value="${n}">${n} pt</option>`).join('');
      tf.value = s.f; ts.value = s.f && s.s ? String(s.s) : ''; ts.disabled = !s.f;
      tb.querySelector('.tbb').setAttribute('aria-pressed', !!s.b); tb.querySelector('.tbi').setAttribute('aria-pressed', !!s.i);
    }
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
    rendering = true; const keep = fd.documentElement.scrollTop;
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
    const cur = sty[key]; if (!cur) return; const n = { ...cur, ...patch }; if (!n.f) n.s = 0; sty[key] = n; bars.forEach(syncBar); mark(); commit(false); if (editing) render(); else later();
  }
  function stepSize(key, dir) {
    const cur = sty[key]; if (!cur || !cur.f) return; const base = cur.s || 10;
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
  fd.addEventListener('mousedown', e => { if (!e.target.closest('[data-f],#tb')) { editing = false; active = null; tb.hidden = true; } });
  tb.addEventListener('mousedown', e => { if (!e.target.closest('select')) e.preventDefault(); });
  tb.addEventListener('change', e => {
    if (!active) return; const f = tb.querySelector('.tf').value, z = parseFloat(tb.querySelector('.ts').value) || 0;
    editing = true; setStyle(active.key, e.target.classList.contains('tf') ? { f, s: 0 } : { s: z });
  });
  tb.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b || !active) return; const cur = sty[active.key] || {};
    editing = true; setStyle(active.key, b.classList.contains('tbb') ? { b: !cur.b } : { i: !cur.i });
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
    Object.keys(sty).forEach(id => { s[id] = { f: '', s: 0, b: false, i: false, ...(p.styles[id] || {}) }; });
    return { f, m, g, s };
  }
  function applyState(st) {   // only touches what differs, so nobody loses their place while typing
    const put = (id, v) => { const e = $(id); if (!e || v === undefined) return; if (e.type === 'checkbox') { if (e.checked !== !!v) e.checked = !!v; } else if (e.value.trim() !== String(v).trim()) e.value = v; };
    Object.entries(st.f || {}).forEach(([id, v]) => put(id, v)); Object.entries(st.m || {}).forEach(([id, v]) => put(id, v));
    let gi = 0; def.md.sections.forEach(sec => (sec.groups || []).forEach(x => { const items = st.g?.[gi++]; if (!items) return; const cur = x.get(api).map(it => Object.fromEntries(x.fields.map(([k]) => [k, it[k] || '']))); if (JSON.stringify(cur) !== JSON.stringify(items)) x.set(api, items); }));
    const want = {}; Object.keys(sty).forEach(id => { want[id] = { f: '', s: 0, b: false, i: false, ...(st.s?.[id] || {}) }; }); if (JSON.stringify(want) !== JSON.stringify(sty)) api.setStyles(want);
    render(); hist = [snap()]; hi = 0; lastTyping = false; updUndo();
  }
  const undo = () => jump(-1), redo = () => jump(1);
  const focusKey = () => { const a = document.activeElement; if (a && panel.contains(a) && a !== document.body) return sty[a.id] ? a.id : null; return editing && active ? active.key : null; };
  function onKey(e) {
    if (!host.isConnected || !(e.ctrlKey || e.metaKey) || e.altKey) return;
    if (readOnly && e.key.toLowerCase() !== 'p') return;
    if (e.target?.closest?.('dialog,[data-fd-file]')) return;
    const k = e.key.toLowerCase();
    if (k === 'z' && !e.shiftKey) { undo(); e.preventDefault(); }
    else if (k === 'y' || (k === 'z' && e.shiftKey)) { redo(); e.preventDefault(); }
    else if (k === 'b' || k === 'i') { const key = focusKey(); if (key && sty[key]) { setStyle(key, k === 'b' ? { b: !sty[key].b } : { i: !sty[key].i }); e.preventDefault(); } }
    else if (e.shiftKey && (e.key === '>' || e.key === '<' || e.key === '.' || e.key === ',')) { const key = focusKey(); if (key && sty[key]) { stepSize(key, e.key === '>' || e.key === '.' ? 1 : -1); e.preventDefault(); } }
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
  panel.addEventListener('input', e => { const bar = e.target.closest('.fd-fx'); if (bar) { readBar(bar); syncBar(bar); } later(); mark(); commit(!bar); });
  panel.addEventListener('click', e => {
    const b = e.target.closest('.fd-fb,.fd-fi'); if (!b) return;
    b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') !== 'true'); readBar(b.closest('.fd-fx')); syncBar(b.closest('.fd-fx')); later(); mark(); commit(false);
  });
  /* Fill in my details as ... */
  const applied = {};
  panel.addEventListener('change', e => {
    const c = e.target.closest('[data-role]'); if (!c) return; const r = roles.find(x => x.id === c.dataset.role); if (!r) return;
    if (c.checked) { const got = {}; Object.entries(r.fill(api, who) || {}).forEach(([id, v]) => { const el = $(id); if (el && v) { el.value = v; got[id] = v; } }); applied[r.id] = got; }
    else { Object.entries(applied[r.id] || {}).forEach(([id, v]) => { const el = $(id); if (el && el.value === v) el.value = ''; }); delete applied[r.id]; }
    render(); mark(); commit(false);
  });
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
    else if (a === 'save' || a === 'share') onAction?.(a);
  });
  const statusEl = $('fd-status'), peopleEl = $('fd-people');
  const setStatus = (t, kind = '') => { statusEl.textContent = t; statusEl.dataset.k = kind; };
  const initials = n => String(n || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
  const setPeople = list => { peopleEl.innerHTML = list.length ? `<span class="fd-ph">Here now</span>${list.map(p => `<span class="fd-chip" title="${esc(p.name)}">${esc(initials(p.name))}</span>`).join('')}<span class="fd-pn">${esc(list.map(p => p.name).join(', '))}</span>` : ''; };
  return { api, getMd, stateFromMd, curState: () => stateFromMd(getMd()), applyState, setStatus, setPeople, destroy() { document.removeEventListener('keydown', onKey); document.removeEventListener('click', outside); ro.disconnect(); removeEventListener('resize', size); host.innerHTML = ''; }, isDirty: () => dirty };
}