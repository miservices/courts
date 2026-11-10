/* Stamp editor: a full-screen view of a document where court staff move and adjust the three court marks - the "A TRUE COPY" stamp (shown as
   "A CERTIFIED COPY" on a certified copy), the court seal and the certification - and nothing else. Marks cannot be added or removed here; they are
   shown automatically where they apply. Works on a PDF (bytes) or on a court form (.md text).
   openStampEditor({ pdf, md, label, date, marks }) resolves { stamp, seal, cert } (each { x, y, page, rot, ink, scale }) or null when cancelled.  */
import { stampSvg, certSvg, sealSvg, courtShort, mountForm, formOf } from './engine.js?v=33';
import { DEF_CERT, DEF_SEAL, todayStr } from './marks.js?v=3';

const DEF_STAMP = { x: 0.7, y: 0.004, page: 1, rot: -3, ink: 0.9, scale: 1 };
const CSS = `.se{position:fixed;inset:0;z-index:99999;background:#0c1d38;display:flex;flex-direction:column;font:14px/1.4 'Public Sans',system-ui,sans-serif;color:#fff}
.se *{box-sizing:border-box}.se-bar{display:flex;gap:10px 22px;align-items:center;flex-wrap:wrap;padding:10px 18px;background:#10264a;border-bottom:1px solid rgba(255,255,255,.2)}
.se-bar b{font-weight:700}.se-g{display:flex;gap:10px;align-items:center;flex-wrap:wrap;padding-right:18px;border-right:1px solid rgba(255,255,255,.2)}
.se-g label{display:flex;align-items:center;gap:5px;font-size:12.5px;color:#cfdcf2}.se-g input[type=range]{width:84px}
.se button{font:inherit;font-weight:700;padding:7px 16px;border-radius:4px;border:2px solid #fff;background:transparent;color:#fff;cursor:pointer}.se button.p{background:#fff;color:#10264a}
.se button:focus-visible,.se input:focus-visible{outline:3px solid #ffd666;outline-offset:2px}.se-sp{flex:1}
.se-body{flex:1;overflow:auto;padding:22px 12px 60px;background:#2a3a55}.se-pages{margin:0 auto;width:max-content;max-width:100%}
#se-pages .fd-panel{display:none!important}#se-pages .fd-wrap{display:block}#se-pages .fd-view{height:auto;min-height:1200px}
#se-pages .fd-view,#se-pages .fd-wrap{width:100%}#se-pages iframe{width:100%!important}
.se-pg{position:relative;margin:0 auto 18px;background:#fff;box-shadow:0 3px 18px rgba(0,0,0,.45)}.se-pg canvas{display:block;width:100%;height:auto}
.se-note{padding:6px 18px;background:#16325f;color:#cfdcf2;font-size:12.5px}`;

export function openStampEditor({ pdf = null, md = null, label = '7TH DISTRICT COURT', date = '', marks = {} } = {}) {
  return new Promise(async resolve => {
    if (!document.getElementById('se-css')) { const st = document.createElement('style'); st.id = 'se-css'; st.textContent = CSS; document.head.appendChild(st); }
    const today = todayStr(), court = courtShort(label), sup = /supreme/i.test(label);
    const init = () => ({ stamp: { ...DEF_STAMP, ...(marks.stamp || {}) }, seal: { ...DEF_SEAL, ...(marks.seal || {}) }, cert: { ...DEF_CERT, ...(marks.cert || {}) } });
    let M = init(); const placed = { seal: marks.seal?.x !== undefined, cert: marks.cert?.x !== undefined }; let prev = false, eng = null;
    const root = document.createElement('div'); root.className = 'se'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-label', 'Stamp editor'); root.tabIndex = -1;
    const grp = (k, t) => `<span class="se-g" data-k="${k}"><b>${t}</b><label>Ink <input type="range" data-f="ink" min="${k === 'seal' ? 25 : 0}" max="${k === 'seal' ? 100 : 150}"></label><label>Tilt <input type="range" data-f="rot" min="-20" max="20"></label><label>Size <input type="range" data-f="scale" min="50" max="200"></label></span>`;
    root.innerHTML = `<div class="se-bar"><b>Stamp editor</b><span class="se-g" data-k="stamp" style="border:0"><label>Stamp darkness <input type="range" data-f="ink" min="0" max="150"></label></span><span class="se-sp"></span><button type="button" id="se-cancel">Cancel</button><button type="button" class="p" id="se-save">Save</button></div>
      <div class="se-note">Drag the stamp, seal and certification where you want them. Everything else is automatic: a certified copy gets the seal and certification and the stamp reads "A CERTIFIED COPY" in the same spot.</div><div class="se-body"><div class="se-pages" id="se-pages"></div></div>`;
    document.body.appendChild(root); root.focus(); const $ = s => root.querySelector(s), box = $('#se-pages');
    const finish = v => { document.removeEventListener('keydown', esc, true); try { eng?.destroy(); } catch { } root.remove(); resolve(v); };
    const esc = e => { if (e.key === 'Escape') { e.stopPropagation(); finish(null); } }; document.addEventListener('keydown', esc, true);
    const sync = () => root.querySelectorAll('.se-g').forEach(g => { const m = M[g.dataset.k]; g.querySelectorAll('input').forEach(i => { const f = i.dataset.f; i.value = f === 'rot' ? (m.rot ?? 0) : f === 'ink' ? Math.round((m.ink ?? 1) * 100) : Math.round((m.scale ?? 1) * 100); }); });
    const stampView = () => ({ ...M.stamp, ghost: true, label, date: prev ? today : date || today, title: prev ? 'A CERTIFIED COPY' : undefined });
    const certView = () => ({ ...M.cert, auto: !placed.cert, ghost: true, date: today, by: 'E-CERTIFICATION', court });
    const sealView = () => ({ ...M.seal, auto: !placed.seal, ghost: true, court: label });
    const ink = e => { const k = e.target.closest('.se-g').dataset.k, f = e.target.dataset.f, v = f === 'rot' ? +e.target.value : +e.target.value / 100; M[k] = { ...M[k], [f]: v }; if (k !== 'stamp') placed[k] = placed[k] || false; redraw(); };
    root.querySelectorAll('.se-g input').forEach(i => i.oninput = ink);
    $('#se-cancel').onclick = () => finish(null);
    $('#se-save').onclick = () => {
      const out = {}, r = n => +Number(n).toFixed(4);
      for (const k of ['stamp', 'seal', 'cert']) { let m = M[k];
        if (eng && k !== 'stamp' && !placed[k]) { const d = eng.markDefaults(M.cert.scale, M.seal.scale); if (d?.[k]) m = { ...m, x: d[k].x, y: d[k].y, page: d.page, scale: d[k].scale ?? m.scale }; }
        out[k] = { x: r(m.x), y: r(m.y), page: m.page ?? 0, rot: m.rot ?? 0, ink: r(m.ink ?? 1), scale: r(m.scale ?? 1) }; }
      finish(out); };

    let redraw = () => { };
    try {
      if (md != null) {   /* a court form: the form engine draws the page and the marks */
        const { byNumber } = await import('./registry.js?v=8'), num = formOf(md), form = num && byNumber(num); if (!form) throw new Error('form');
        const def = (await import(`./${form.id}.js?v=22`)).default, host = document.createElement('div'); host.style.cssText = 'width:860px;max-width:100%;margin:0 auto'; box.style.width = '100%'; box.appendChild(host);
        eng = await mountForm(def, host, { md, readOnly: true, stamp: stampView(), onStampMove: p => { M.stamp = { ...M.stamp, ...p }; }, marks: { cert: certView(), seal: sealView() },
          onMarkMove: (k, p) => { M[k] = { ...M[k], ...p }; placed[k] = true; } });
        redraw = () => { eng.setStamp(stampView()); eng.setMark('cert', certView()); eng.setMark('seal', sealView()); };
        host.querySelector('iframe')?.style && (host.querySelector('iframe').style.minHeight = '1200px');
      } else {   /* a PDF: pages drawn with pdf.js, marks laid over them */
        if (!window.pdfjsLib) await new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        const doc = await pdfjsLib.getDocument({ data: pdf.slice(0) }).promise, W = Math.min(816, Math.max(320, root.clientWidth - 48)), pages = [];
        for (let n = 1; n <= doc.numPages; n++) { const pg = await doc.getPage(n), v0 = pg.getViewport({ scale: 1 }), vp = pg.getViewport({ scale: W / v0.width * 2 }), cv = document.createElement('canvas'), w = document.createElement('div');
          cv.width = vp.width; cv.height = vp.height; w.className = 'se-pg'; w.style.width = W + 'px'; w.appendChild(cv); box.appendChild(w); pages.push(w); await pg.render({ canvasContext: cv.getContext('2d'), viewport: vp }).promise; }
        const pageIdx = (m, d) => (m.page ? Math.min(pages.length, m.page) : d) - 1;
        const drag = (el, k) => el.addEventListener('pointerdown', e => { e.preventDefault(); const r0 = el.getBoundingClientRect(), gx = e.clientX - r0.left, gy = e.clientY - r0.top; el.setPointerCapture(e.pointerId); el.style.cursor = 'grabbing'; let pos = null;
          const mv = ev => { const g = pages.find(q => { const b = q.getBoundingClientRect(); return ev.clientX >= b.left && ev.clientX <= b.right && ev.clientY >= b.top && ev.clientY <= b.bottom; }) || el.parentElement, b = g.getBoundingClientRect(),
              x = Math.min(1 - r0.width / b.width, Math.max(0, (ev.clientX - gx - b.left) / b.width)), y = Math.min(1 - r0.height / b.height, Math.max(0, (ev.clientY - gy - b.top) / b.height));
            if (g !== el.parentElement) g.appendChild(el); el.style.left = (x * 100).toFixed(3) + '%'; el.style.top = (y * 100).toFixed(3) + '%'; pos = { x: +x.toFixed(4), y: +y.toFixed(4), page: pages.indexOf(g) + 1 }; };
          const up = () => { el.removeEventListener('pointermove', mv); el.removeEventListener('pointerup', up); el.style.cursor = 'grab'; if (pos) { M[k] = { ...M[k], ...pos }; if (k !== 'stamp') placed[k] = true; } };
          el.addEventListener('pointermove', mv); el.addEventListener('pointerup', up); });
        redraw = () => {
          pages.forEach(p => p.querySelectorAll('[data-mark],[data-stamp]').forEach(n => n.remove()));
          const add = (html, k, wpx, scale, pg) => { const h = document.createElement('div'); h.innerHTML = html; const el = h.firstElementChild; el.style.width = (wpx * (scale || 1) / 816 * 100) + '%'; el.style.height = 'auto'; el.removeAttribute('width'); el.removeAttribute('height'); el.style.cursor = 'grab'; pages[pg].appendChild(el); drag(el, k); };
          add(stampSvg({ ...stampView(), move: true, ghost: true }), 'stamp', 176, M.stamp.scale, pageIdx(M.stamp, 0));
          add(sealSvg({ ...sealView(), move: true }), 'seal', 96, M.seal.scale, pageIdx(M.seal, pages.length));
          add(certSvg({ ...certView(), move: true }), 'cert', 216, M.cert.scale, pageIdx(M.cert, pages.length));
        };
      }
      sync(); redraw();
    } catch (e) { console.error(e); box.innerHTML = '<p style="padding:30px;font-size:16px">We could not open the stamp editor for this document.</p>'; }
  });
}