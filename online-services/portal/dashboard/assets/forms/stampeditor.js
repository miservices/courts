/* Stamp editor: court staff position the three court marks on a document - the "A TRUE COPY" stamp (it reads "A CERTIFIED COPY" on a certified copy),
   the court seal and the certification. Marks are never added or removed here; they are shown automatically where they apply.
   Works on a PDF (bytes) or on a court form (.md text).
   openStampEditor({ pdf, md, label, date, title, marks }) resolves { stamp, seal, cert } (each { x, y, page, rot, ink, scale }) or null when cancelled. */
import { stampSvg, certSvg, sealSvg, courtShort, mountForm, formOf } from './engine.js?v=33';
import { DEF_CERT, DEF_SEAL, todayStr } from './marks.js?v=3';

const DEF_STAMP = { x: 0.7, y: 0.004, page: 1, rot: -3, ink: 0.9, scale: 1 };
const INFO = {
  stamp: ['Court stamp', 'A TRUE COPY on every document. Reads A CERTIFIED COPY in the same spot on a certified copy.'],
  seal: ['Court seal', 'Printed on certified copies only, before the certification.'],
  cert: ['Certification', 'Printed on certified copies only, beside the seal.']
};
const CSS = `
.se{position:fixed;inset:0;z-index:99999;display:flex;flex-direction:column;background:#e4e9f2;font:14px/1.45 'Public Sans',system-ui,sans-serif;color:#1b2433}
.se *{box-sizing:border-box}
.se-top{display:flex;align-items:center;gap:14px;padding:12px 20px;background:#fff;border-bottom:1px solid #d3dae6;flex-wrap:wrap}
.se-ttl{flex:1;min-width:200px}.se-ttl h2{margin:0;font:700 17px 'Source Serif 4',Georgia,serif;color:#10264a}.se-ttl p{margin:1px 0 0;font-size:12.5px;color:#5b6678}
.se-st{font-size:12.5px;color:#5b6678;display:flex;align-items:center;gap:7px}.se-st i{width:8px;height:8px;border-radius:50%;background:#b8c2d4;display:inline-block}.se-st.d i{background:#e0a100}.se-st.d{color:#7a5a00}
.se-btn{font:600 14px 'Public Sans',system-ui,sans-serif;padding:9px 18px;border-radius:7px;border:1.5px solid #c5cedd;background:#fff;color:#10264a;cursor:pointer}.se-btn:hover{background:#f1f4f9}
.se-btn.p{background:#10264a;border-color:#10264a;color:#fff}.se-btn.p:hover{background:#1b3a6b}.se-btn:disabled{opacity:.45;cursor:default}
.se :focus-visible{outline:3px solid #1f5fae;outline-offset:2px}
.se-main{flex:1;min-height:0;display:grid;grid-template-columns:340px 1fr}
.se-side{overflow:auto;padding:16px;background:#f4f6fa;border-right:1px solid #d3dae6;display:flex;flex-direction:column;gap:12px}
.se-hint{font-size:12.5px;color:#5b6678;margin:0 2px 2px}
.se-card{background:#fff;border:1.5px solid #d3dae6;border-radius:10px;padding:12px 14px;cursor:pointer;transition:border-color .12s,box-shadow .12s}
.se-card[aria-current=true]{border-color:#1f5fae;box-shadow:0 0 0 3px rgba(31,95,174,.15)}
.se-ch{display:flex;align-items:center;gap:9px}.se-sw{width:12px;height:12px;border-radius:3px;flex:none}
.se-ch b{font-size:14px;color:#10264a;flex:1}.se-rs{font:600 12px 'Public Sans',sans-serif;color:#1f5fae;background:none;border:0;cursor:pointer;padding:2px 4px}.se-rs:hover{text-decoration:underline}
.se-cd{margin:4px 0 0;font-size:12.5px;color:#5b6678}
.se-ctl{display:none;margin-top:10px;gap:9px;flex-direction:column}.se-card[aria-current=true] .se-ctl{display:flex}
.se-row{display:grid;grid-template-columns:76px 1fr 44px;align-items:center;gap:8px;font-size:12.5px;color:#3a4558}.se-row output{text-align:right;font-variant-numeric:tabular-nums;color:#10264a;font-weight:600}
.se-row input{width:100%;accent-color:#10264a;height:20px}
.se-nudge{display:flex;align-items:center;gap:6px;font-size:12.5px;color:#3a4558}.se-nudge span{width:76px}
.se-nudge button{width:34px;height:30px;border:1.5px solid #c5cedd;border-radius:6px;background:#fff;color:#10264a;cursor:pointer;display:inline-flex;align-items:center;justify-content:center}.se-nudge button:hover{background:#eef2f9}
.se-body{overflow:auto;padding:22px 14px 70px;outline:0}.se-pages{margin:0 auto;width:max-content;max-width:100%}
#se-pages .fd-panel{display:none!important}#se-pages .fd-wrap{display:block}#se-pages .fd-view{height:auto;min-height:1200px}
#se-pages .fd-view,#se-pages .fd-wrap{width:100%}#se-pages iframe{width:100%!important}
.se-pg{position:relative;margin:0 auto 18px;background:#fff;box-shadow:0 2px 14px rgba(16,38,74,.25)}.se-pg canvas{display:block;width:100%;height:auto}
.se-pgn{position:absolute;right:-2px;top:-20px;font-size:11.5px;color:#5b6678}
.se-load{padding:70px 0;text-align:center;color:#5b6678}
.se-bk{position:absolute;inset:0;background:rgba(16,38,74,.45);display:flex;align-items:center;justify-content:center;z-index:5}
.se-dlg{background:#fff;border-radius:12px;padding:22px 24px;width:min(420px,92vw);box-shadow:0 12px 40px rgba(0,0,0,.35)}.se-dlg h3{margin:0 0 6px;font:700 18px 'Source Serif 4',Georgia,serif;color:#10264a}.se-dlg p{margin:0 0 18px;color:#5b6678}.se-dlg div{display:flex;gap:10px;justify-content:flex-end}
@media(max-width:860px){.se-main{grid-template-columns:1fr;grid-template-rows:auto 1fr}.se-side{max-height:44vh;border-right:0;border-bottom:1px solid #d3dae6}}`;
const CHEV = { l: 'M10 3 5 8l5 5', r: 'M6 3l5 5-5 5', u: 'M3 10l5-5 5 5', d: 'M3 6l5 5 5-5' };
const arrow = (d, label) => `<button type="button" data-n="${d}" aria-label="${label}"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${CHEV[d]}"/></svg></button>`;
const SW = { stamp: '#a31f1a', seal: '#1f5fae', cert: '#10264a' };

export function openStampEditor({ pdf = null, md = null, label = '7TH DISTRICT COURT', date = '', title = 'Court document', marks = {} } = {}) {
  return new Promise(async resolve => {
    if (!document.getElementById('se-css')) { const st = document.createElement('style'); st.id = 'se-css'; st.textContent = CSS; document.head.appendChild(st); }
    const today = todayStr(), court = courtShort(label);
    const init = () => ({ stamp: { ...DEF_STAMP, ...(marks.stamp || {}) }, seal: { ...DEF_SEAL, ...(marks.seal || {}) }, cert: { ...DEF_CERT, ...(marks.cert || {}) } });
    let M = init(); const placed0 = { seal: marks.seal?.x !== undefined, cert: marks.cert?.x !== undefined }; let placed = { ...placed0 }, eng = null, sel = 'stamp', redraw = () => { };
    const snap = () => JSON.stringify([M, placed]); let base = snap();
    const root = document.createElement('div'); root.className = 'se'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-label', 'Position court marks'); root.tabIndex = -1;
    const card = k => `<div class="se-card" data-k="${k}" role="button" tabindex="0" aria-current="${k === sel}">
      <div class="se-ch"><span class="se-sw" style="background:${SW[k]}"></span><b>${INFO[k][0]}</b><button type="button" class="se-rs" data-rs="${k}">Reset</button></div><p class="se-cd">${INFO[k][1]}</p>
      <div class="se-ctl">
        <label class="se-row">Darkness<input type="range" data-f="ink" min="${k === 'seal' ? 25 : 0}" max="${k === 'seal' ? 100 : 150}"><output></output></label>
        <label class="se-row">Tilt<input type="range" data-f="rot" min="-20" max="20"><output></output></label>
        <label class="se-row">Size<input type="range" data-f="scale" min="50" max="200"><output></output></label>
        <div class="se-nudge"><span>Move</span>${arrow('l', 'Move left')}${arrow('u', 'Move up')}${arrow('d', 'Move down')}${arrow('r', 'Move right')}</div>
      </div></div>`;
    root.innerHTML = `<div class="se-top"><div class="se-ttl"><h2>Position court marks</h2><p></p></div><span class="se-st" id="se-st"><i></i><span>No changes</span></span><button class="se-btn" id="se-cancel" type="button">Cancel</button><button class="se-btn p" id="se-save" type="button" disabled>Save changes</button></div>
      <div class="se-main"><aside class="se-side"><p class="se-hint">Select a mark, then drag it on the page or use the arrows. Seal and certification appear only on certified copies, so they are shown here as guides.</p>${['stamp', 'seal', 'cert'].map(card).join('')}</aside>
      <div class="se-body" id="se-body" tabindex="-1"><div class="se-pages" id="se-pages"><div class="se-load">Opening the document…</div></div></div></div>`;
    root.querySelector('.se-ttl p').textContent = [title, label].filter(Boolean).join('  ·  ');
    document.body.appendChild(root); root.focus(); const $ = s => root.querySelector(s), box = $('#se-pages');
    const finish = v => { document.removeEventListener('keydown', onKey, true); try { eng?.destroy(); } catch { } root.remove(); resolve(v); };
    const dirty = () => snap() !== base;
    const askDiscard = () => { if (!dirty()) return finish(null); const bk = document.createElement('div'); bk.className = 'se-bk'; bk.innerHTML = '<div class="se-dlg" role="alertdialog" aria-label="Discard changes"><h3>Discard your changes?</h3><p>The new positions have not been saved.</p><div><button class="se-btn" type="button" data-a="keep">Keep editing</button><button class="se-btn p" type="button" data-a="drop">Discard</button></div></div>'; root.appendChild(bk); bk.querySelector('[data-a=keep]').focus();
      bk.onclick = e => { const a = e.target.dataset?.a; if (a === 'keep' || e.target === bk) bk.remove(); if (a === 'drop') finish(null); }; };
    const onKey = e => {
      if (e.key === 'Escape') { e.stopPropagation(); if (!root.querySelector('.se-bk')) askDiscard(); else root.querySelector('.se-bk').remove(); return; }
      if (/^Arrow/.test(e.key) && !/INPUT|TEXTAREA|SELECT/.test(e.target.tagName) && !root.querySelector('.se-bk')) { e.preventDefault(); const s = e.shiftKey ? 0.01 : 0.0025; nudge(e.key === 'ArrowLeft' ? -s : e.key === 'ArrowRight' ? s : 0, e.key === 'ArrowUp' ? -s : e.key === 'ArrowDown' ? s : 0); } };
    document.addEventListener('keydown', onKey, true);

    const sync = () => {
      root.querySelectorAll('.se-card').forEach(c => { const k = c.dataset.k, m = M[k]; c.setAttribute('aria-current', k === sel);
        c.querySelectorAll('.se-row').forEach(r => { const i = r.querySelector('input'), f = i.dataset.f, v = f === 'rot' ? (m.rot ?? 0) : f === 'ink' ? Math.round((m.ink ?? 1) * 100) : Math.round((m.scale ?? 1) * 100); i.value = v; r.querySelector('output').textContent = f === 'rot' ? v + '°' : v + '%'; }); });
      const d = dirty(), st = $('#se-st'); st.className = 'se-st' + (d ? ' d' : ''); st.lastChild.textContent = d ? 'Unsaved changes' : 'No changes'; $('#se-save').disabled = !d; };
    const stampView = () => ({ ...M.stamp, label, date: date || today });
    const certView = () => ({ ...M.cert, auto: !placed.cert, date: today, by: 'E-CERTIFICATION', court });
    const sealView = () => ({ ...M.seal, auto: !placed.seal, court: label });
    const select = k => { sel = k; sync(); redraw(); root.querySelector('.se-pages [data-mark="' + k + '"], .se-pages [style*="dashed"]')?.scrollIntoView({ block: 'center', behavior: 'smooth' }); };
    const seed = k => { if (k === 'stamp' || placed[k] || !eng) return; const d = eng.markDefaults(M.cert.scale, M.seal.scale); if (d?.[k]) M[k] = { ...M[k], x: d[k].x, y: d[k].y, page: d.page, scale: d[k].scale ?? M[k].scale }; };
    const nudge = (dx, dy) => { seed(sel); const m = M[sel]; M[sel] = { ...m, x: Math.min(.98, Math.max(0, +(m.x + dx).toFixed(4))), y: Math.min(.98, Math.max(0, +(m.y + dy).toFixed(4))) }; if (sel !== 'stamp') placed[sel] = true; sync(); redraw(); };

    root.addEventListener('click', e => {
      const rs = e.target.closest('[data-rs]'); if (rs) { e.stopPropagation(); const k = rs.dataset.rs; M[k] = init()[k]; if (k !== 'stamp') placed[k] = placed0[k]; select(k); return; }
      const nb = e.target.closest('[data-n]'); if (nb) { const s = e.shiftKey ? 0.01 : 0.0025, d = nb.dataset.n; nudge(d === 'l' ? -s : d === 'r' ? s : 0, d === 'u' ? -s : d === 'd' ? s : 0); return; }
      const c = e.target.closest('.se-card'); if (c && c.dataset.k !== sel && !e.target.closest('input')) select(c.dataset.k); });
    root.addEventListener('keydown', e => { const c = e.target.closest?.('.se-card'); if (c && e.target === c && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); select(c.dataset.k); } });
    root.addEventListener('input', e => { const i = e.target.closest('.se-row input'); if (!i) return; const k = e.target.closest('.se-card').dataset.k, f = i.dataset.f; if (k !== sel) sel = k; seed(k); M[k] = { ...M[k], [f]: f === 'rot' ? +i.value : +i.value / 100 }; if (k !== 'stamp') placed[k] = true; sync(); redraw(); });
    $('#se-cancel').onclick = askDiscard;
    $('#se-save').onclick = () => {
      const out = {}, r = n => +Number(n).toFixed(4);
      for (const k of ['stamp', 'seal', 'cert']) { let m = M[k];
        if (eng && k !== 'stamp' && !placed[k]) { const d = eng.markDefaults(M.cert.scale, M.seal.scale); if (d?.[k]) m = { ...m, x: d[k].x, y: d[k].y, page: d.page, scale: d[k].scale ?? m.scale }; }
        out[k] = { x: r(m.x), y: r(m.y), page: m.page ?? 0, rot: m.rot ?? 0, ink: r(m.ink ?? 1), scale: r(m.scale ?? 1) }; }
      finish(out); };

    try {
      if (md != null) {   /* a court form: the form engine draws the page and the marks */
        const { byNumber } = await import('./registry.js?v=8'), num = formOf(md), form = num && byNumber(num); if (!form) throw new Error('form');
        const def = (await import(`./${form.id}.js?v=24`)).default, host = document.createElement('div'); host.style.cssText = 'width:860px;max-width:100%;margin:0 auto'; box.replaceChildren(host); box.style.width = '100%';
        eng = await mountForm(def, host, { md, readOnly: true, stamp: stampView(), onStampMove: p => { M.stamp = { ...M.stamp, ...p }; sync(); }, marks: { cert: certView(), seal: sealView() },
          onMarkMove: (k, p) => { M[k] = { ...M[k], ...p }; placed[k] = true; sync(); } });
        redraw = () => { eng.setStamp(stampView()); eng.setMark('cert', certView()); eng.setMark('seal', sealView()); };
        host.querySelector('iframe')?.style && (host.querySelector('iframe').style.minHeight = '1200px');
      } else {   /* a PDF: pages drawn with pdf.js, marks laid over them */
        if (!window.pdfjsLib) await new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        const doc = await pdfjsLib.getDocument({ data: pdf.slice(0) }).promise, W = Math.min(816, Math.max(300, $('#se-body').clientWidth - 40)), pages = []; box.replaceChildren();
        for (let n = 1; n <= doc.numPages; n++) { const pg = await doc.getPage(n), v0 = pg.getViewport({ scale: 1 }), vp = pg.getViewport({ scale: W / v0.width * 2 }), cv = document.createElement('canvas'), w = document.createElement('div');
          cv.width = vp.width; cv.height = vp.height; w.className = 'se-pg'; w.style.width = W + 'px'; w.appendChild(cv); const nn = document.createElement('div'); nn.className = 'se-pgn'; nn.textContent = `Page ${n} of ${doc.numPages}`; w.appendChild(nn); box.appendChild(w); pages.push(w); await pg.render({ canvasContext: cv.getContext('2d'), viewport: vp }).promise; }
        const pageIdx = (m, d) => (m.page ? Math.min(pages.length, m.page) : d) - 1;
        const drag = (el, k) => el.addEventListener('pointerdown', e => { e.preventDefault(); if (sel !== k) { sel = k; sync(); } const r0 = el.getBoundingClientRect(), gx = e.clientX - r0.left, gy = e.clientY - r0.top; el.setPointerCapture(e.pointerId); el.style.cursor = 'grabbing'; let pos = null;
          const mv = ev => { const g = pages.find(q => { const b = q.getBoundingClientRect(); return ev.clientX >= b.left && ev.clientX <= b.right && ev.clientY >= b.top && ev.clientY <= b.bottom; }) || el.parentElement, b = g.getBoundingClientRect(),
              x = Math.min(1 - r0.width / b.width, Math.max(0, (ev.clientX - gx - b.left) / b.width)), y = Math.min(1 - r0.height / b.height, Math.max(0, (ev.clientY - gy - b.top) / b.height));
            if (g !== el.parentElement) g.appendChild(el); el.style.left = (x * 100).toFixed(3) + '%'; el.style.top = (y * 100).toFixed(3) + '%'; pos = { x: +x.toFixed(4), y: +y.toFixed(4), page: pages.indexOf(g) + 1 }; };
          const up = () => { el.removeEventListener('pointermove', mv); el.removeEventListener('pointerup', up); el.style.cursor = 'grab'; if (pos) { M[k] = { ...M[k], ...pos }; if (k !== 'stamp') placed[k] = true; sync(); redraw(); } };
          el.addEventListener('pointermove', mv); el.addEventListener('pointerup', up); });
        redraw = () => {
          pages.forEach(p => p.querySelectorAll('[data-mark],[data-stamp]').forEach(n => n.remove()));
          const add = (html, k, wpx, scale, pg) => { const h = document.createElement('div'); h.innerHTML = html; const el = h.firstElementChild; el.style.width = (wpx * (scale || 1) / 816 * 100) + '%'; el.style.height = 'auto'; el.removeAttribute('width'); el.removeAttribute('height'); el.style.cursor = 'grab';
            if (k === sel) { el.style.outline = '2px dashed #1f5fae'; el.style.outlineOffset = '3px'; } pages[pg].appendChild(el); drag(el, k); };
          add(stampSvg({ ...stampView(), move: true }), 'stamp', 176, M.stamp.scale, pageIdx(M.stamp, 0));
          add(sealSvg({ ...sealView(), move: true }), 'seal', 96, M.seal.scale, pageIdx(M.seal, pages.length));
          add(certSvg({ ...certView(), move: true }), 'cert', 216, M.cert.scale, pageIdx(M.cert, pages.length));
        };
      }
      sync(); redraw(); base = snap(); sync();
    } catch (e) { console.error(e); box.innerHTML = '<div class="se-load">We could not open this document in the stamp editor.</div>'; }
  });
}