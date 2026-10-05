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
     prefill(api, account, role)          optional: fill in what we already know about the person
   The preview lives in its own frame, so portal styles never touch the document and the document never touches the portal. */
export const U = 1.3714, P = n => (n * U).toFixed(2) + 'px', B = '1.4px';
export const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const H2P = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
const norm = t => String(t || '').toLowerCase().replace(/\s+/g, ' ').trim();
export const keyOf = s => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

const BASE_CSS = `@page{size:letter;margin:0}*{box-sizing:border-box}
body{margin:0;font-family:Arial,Helvetica,sans-serif;background:#e9ebee;color:#222}
#pwrap{margin:16px auto}#preview{width:816px;transform-origin:top left}
#measure{position:absolute;left:-9999px;top:0;visibility:hidden}
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
  return o.join('\n');
}
export function formOf(text) {   // which form a saved .md belongs to, or null
  const lines = String(text).replace(/\r/g, '').split('\n').slice(0, 40).join('\n');
  const m = /^form:\s*(.+?)\s*$/mi.exec(lines) || /^#\s+(.+?)\s*$/m.exec(lines);
  return m ? m[1] : null;
}
export function fromMarkdown(def, api, txt) {
  const lines = txt.replace(/\r/g, '').split('\n');
  if (keyOf(formOf(txt)) !== keyOf(def.number)) throw new Error(`This file is not a ${def.number} form (no "form: ${def.number}" found).`);
  const single = {}, multi = {}, found = new Map(); let curGroup = null, curItem = null, i = 0, mode = '';
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
      curGroup = groups.find(g => norm(g.heading) === norm(m[1])) || null; curItem = null; mode = 'sec'; if (curGroup && !found.has(curGroup)) found.set(curGroup, []);
    } else if ((m = ln.match(/^[-*]\s+(.+?):\s?(.*)$/))) {
      const k = norm(m[1]);
      if (mode === 'item' && curItem) { const f = curGroup.fields.find(([, l]) => norm(l) === k); if (f) curItem[f[0]] = m[2].trim(); }
      else if (sl[k]) single[sl[k]] = m[2].trim();
    }
    i++;
  }
  Object.entries(single).forEach(([id, v]) => { const e = api.$(id); if (!e) return; if (e.type === 'checkbox') e.checked = /^(yes|true|x|1)$/i.test(v); else e.value = v; });
  Object.entries(multi).forEach(([id, v]) => { const e = api.$(id); if (e) e.value = v; });
  groups.forEach(g => g.set(api, found.get(g) || []));
}

/* ---------- Mount a form into a host element ---------- */
export async function mountForm(def, host, { account, role, md, onDirty } = {}) {
  host.innerHTML = `<div class="fd-wrap"><div class="fd-panel" id="fd-panel"><h3>${esc(def.number)}</h3><small class="fd-hint">Fill in the fields. The document updates as you type and adds pages as needed.</small>${def.panel}
    <div class="fd-btns"><button type="button" class="btn" data-fd="pdf">Download PDF</button><button type="button" class="btn outline" data-fd="md">Download .md</button><button type="button" class="btn outline" data-fd="load">Load .md</button><button type="button" class="btn outline" data-fd="print">Print</button><input type="file" data-fd-file accept=".md,.markdown,.txt,text/markdown,text/plain" hidden></div><small class="fd-msg" id="fd-msg" role="status"></small></div>
    <div class="fd-view" id="fd-view"></div></div>`;
  const $ = id => host.querySelector('#' + id), qa = sel => [...host.querySelectorAll(sel)], k = { U, P, B };
  const frame = document.createElement('iframe'); frame.className = 'fd-frame'; frame.title = def.number + ' preview';
  frame.srcdoc = `<!doctype html><html><head><meta charset="utf-8"><style>${BASE_CSS}${def.css(k)}</style></head><body><div id="pwrap"><div id="preview"></div></div><div id="measure" class="page" style="height:auto;box-shadow:none"><div class="pc" id="mbox" style="display:flow-root"></div></div></body></html>`;
  await new Promise(res => { frame.onload = res; $('fd-view').appendChild(frame); });
  const fd = frame.contentDocument, fw = frame.contentWindow, preview = fd.getElementById('preview'), mbox = fd.getElementById('mbox'), pwrap = fd.getElementById('pwrap');
  const api = { $, qa, esc, P, B, U, account, role, val: id => esc($(id).value.trim()), render: () => render(), note: (t, bad) => { const m = $('fd-msg'); m.textContent = t; m.style.color = bad ? '#b33' : '#287a3e'; } };
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
  function fit() {
    const s = Math.min(1, (frame.clientWidth - 32) / 816); preview.style.transform = `scale(${s})`;
    pwrap.style.width = (816 * s) + 'px'; pwrap.style.height = (preview.offsetHeight * s) + 'px'; frame.style.height = (preview.offsetHeight * s + 32) + 'px';
  }
  function render() {
    const pages = paginate(def.build(api));
    preview.innerHTML = pages.map(p => `<div class="page"><div class="pc">${p.join('')}</div><div class="foot">${esc(def.footer || def.number)}</div></div>`).join(''); fit();
  }
  const ro = new ResizeObserver(() => fit()); ro.observe($('fd-view'));
  if (def.init) def.init(api);
  if (def.prefill && account) def.prefill(api, account, role);
  if (md) { try { fromMarkdown(def, api, md); api.note('Loaded your saved draft.'); } catch (e) { api.note(e.message, true); } }
  let dirty = false; const mark = () => { if (!dirty) { dirty = true; onDirty?.(); } };
  $('fd-panel').addEventListener('input', () => { render(); mark(); });
  render();

  const fileName = ext => def.number.replace(/\s+/g, '_') + '.' + ext;
  async function pdf(btn) {
    const label = btn.textContent; btn.textContent = 'Generating…'; btn.disabled = true;
    try {
      if (!fw.html2pdf) await new Promise((res, rej) => { const s = fd.createElement('script'); s.src = H2P; s.onload = res; s.onerror = () => rej(new Error('load')); fd.head.appendChild(s); });
      const wrap = fd.createElement('div'); wrap.style.cssText = 'position:absolute;left:-10000px;top:0;width:816px';
      const el = preview.cloneNode(true); el.style.transform = 'none'; el.id = 'pdfsrc';
      el.querySelectorAll('.page').forEach(p => { p.style.margin = '0'; p.style.boxShadow = 'none'; p.style.height = '1055px'; });
      wrap.appendChild(el); fd.body.appendChild(wrap);
      try { await fw.html2pdf().set({ margin: 0, filename: fileName('pdf'), image: { type: 'jpeg', quality: .98 }, html2canvas: { scale: 2.5, useCORS: true, scrollY: 0 }, jsPDF: { unit: 'pt', format: 'letter', orientation: 'portrait' }, pagebreak: { mode: ['css'], after: '.page' } }).from(el).save(); }
      finally { wrap.remove(); }
    } catch (e) { api.note('We could not make the PDF here. Choose Print and save as PDF instead.', true); }
    btn.textContent = label; btn.disabled = false;
  }
  host.querySelector('.fd-btns').addEventListener('click', e => {
    const b = e.target.closest('[data-fd]'); if (!b) return; const a = b.dataset.fd;
    if (a === 'pdf') pdf(b);
    else if (a === 'print') { fw.focus(); fw.print(); }
    else if (a === 'load') host.querySelector('[data-fd-file]').click();
    else if (a === 'md') { const blob = new Blob([toMarkdown(def, api)], { type: 'text/markdown' }), l = document.createElement('a'); l.href = URL.createObjectURL(blob); l.download = fileName('md'); document.body.appendChild(l); l.click(); setTimeout(() => { URL.revokeObjectURL(l.href); l.remove(); }, 500); api.note('Saved ' + fileName('md')); dirty = false; }
  });
  host.querySelector('[data-fd-file]').addEventListener('change', async e => {
    const f = e.target.files[0]; if (!f) return;
    try { fromMarkdown(def, api, await f.text()); render(); api.note('Loaded ' + f.name); mark(); } catch (er) { api.note(er.message, true); }
    e.target.value = '';
  });
  return { api, destroy() { ro.disconnect(); host.innerHTML = ''; }, isDirty: () => dirty };
}