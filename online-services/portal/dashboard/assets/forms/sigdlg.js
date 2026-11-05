/* The signing pop-up. Opens when someone clicks a signature block (or its Sign button) and offers everything the
   Signature card in Account Settings does, so nobody has to leave the document:
     Picture   use the saved signature picture, upload a new one, draw one, crop / straighten / clean it up, remove it
     Styled    the name typed in a handwriting or cursive font, or stamped as /s/ NAME in the stamp font
     Plain /s/ the name typed as  /s/ NAME  in the document's own font
   The name box starts with the signer's own name. It can be changed to anything: a signature is whatever the signer types.

   openSignDialog({ label, name, image, fonts, saveImage, removeImage, savePref, pref }) -> Promise
     fonts: [{ f, css, stamp }]   fonts this person may use for a typed signature
     saveImage(png), removeImage(), savePref('image'|'slash')   left out where the signature cannot be managed (the viewer)
   Resolves with { mode: 'image'|'font'|'stamp'|'slash', text, font } or null when cancelled. */
const CSS = `.sd{border:0;border-radius:12px;padding:0;width:min(540px,calc(100vw - 24px));max-height:calc(100vh - 24px);box-shadow:0 20px 50px rgba(9,22,40,.35);color:#1b2433;font:14px Arial,Helvetica,sans-serif}
.sd::backdrop{background:rgba(9,22,40,.45)}.sd *{box-sizing:border-box}.sd form{display:flex;flex-direction:column;max-height:calc(100vh - 24px)}
.sd-h{padding:14px 18px 8px}.sd-h h3{margin:0;font-size:17px}.sd-h small{color:#5a667a}
.sd-b{padding:0 18px 8px;overflow-y:auto}.sd-f{display:flex;gap:8px;justify-content:flex-end;padding:10px 18px 14px;border-top:1px solid #e3e8ef}
.sd label.sd-l{display:block;font-weight:600;font-size:12.5px;margin:6px 0 3px}.sd input[type=text]{width:100%;padding:8px 10px;border:1px solid #b9c2cf;border-radius:6px;font:inherit}
.sd-t{display:flex;gap:4px;margin:10px 0 8px;border-bottom:1px solid #dde3ec}.sd-t button{border:0;background:none;padding:8px 12px;font:inherit;font-weight:600;color:#5a667a;border-bottom:3px solid transparent;cursor:pointer}
.sd-t button[aria-selected=true]{color:#10264a;border-color:#10264a}
.sd-btn{border:1px solid #10264a;background:#10264a;color:#fff;border-radius:6px;padding:7px 14px;font:inherit;font-weight:600;cursor:pointer}.sd-btn.o{background:#fff;color:#10264a}.sd-btn:disabled{opacity:.45;cursor:not-allowed}
.sd-row{display:flex;gap:8px;flex-wrap:wrap;margin:8px 0}.sd-box{border:1px solid #c9d3e3;border-radius:6px;background:#fff;min-height:84px;display:flex;align-items:center;justify-content:center;padding:8px;margin:6px 0}
.sd-box img{max-width:100%;max-height:110px}.sd-box.ck{background:repeating-conic-gradient(#e9edf3 0 25%,#fff 0 50%) 0 0/16px 16px}
.sd-opt{display:flex;align-items:center;gap:10px;border:1px solid #dde3ec;border-radius:8px;padding:6px 10px;margin:5px 0;cursor:pointer}.sd-opt:has(input:checked){border-color:#10264a;background:#f1f5fb}
.sd-opt .s{flex:1;min-width:0;font-size:22px;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sd-pad{display:block;width:100%;height:150px;border:1px dashed #8a9bb5;border-radius:6px;background:#fff;touch-action:none;cursor:crosshair}
.sd-ed canvas{display:block;width:100%;border:1px solid #c9d3e3;border-radius:6px;background:#fff;cursor:crosshair;touch-action:none}
.sd-g{display:grid;gap:4px;margin:8px 0;font-size:12.5px}.sd-g label{display:flex;gap:8px;align-items:center}.sd-g input{flex:1}
.sd-m{font-size:12.5px;margin:6px 0;min-height:16px}.sd-m.bad{color:#b33}.sd-m.ok{color:#287a3e}.sd-d{display:flex;gap:6px;align-items:center;font-size:12.5px;color:#445;margin:6px 0 2px}`;

function toPng(img, o = {}) {   // scale down, make the paper see-through, trim the empty edges
  const thr = o.thr ?? 235, ink = o.ink ?? 0.8, W = 640, sc = Math.min(1, W / img.width, 200 / img.height), w = Math.max(1, Math.round(img.width * sc)), h = Math.max(1, Math.round(img.height * sc));
  const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(img, 0, 0, w, h);
  const d = x.getImageData(0, 0, w, h), p = d.data; let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let i = 0; i < p.length; i += 4) {
    const lum = (p[i] * 0.299 + p[i + 1] * 0.587 + p[i + 2] * 0.114), a = p[i + 3];
    const na = a * Math.min(1, Math.max(0, (thr - lum) / 90));
    p[i] = p[i + 1] = p[i + 2] = Math.max(0, lum * (1 - ink)); p[i + 3] = na;
    if (na > 24) { const k = i / 4, px = k % w, py = (k / w) | 0; if (px < x0) x0 = px; if (px > x1) x1 = px; if (py < y0) y0 = py; if (py > y1) y1 = py; }
  }
  if (x1 < 0) return '';
  x.putImageData(d, 0, 0); const pad = 4, cw = x1 - x0 + 1 + pad * 2, ch = y1 - y0 + 1 + pad * 2, out = document.createElement('canvas'); out.width = cw; out.height = ch;
  out.getContext('2d').drawImage(c, x0 - pad, y0 - pad, cw, ch, 0, 0, cw, ch); return out.toDataURL('image/png');
}
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

export function openSignDialog(o = {}) {
  return new Promise(resolve => {
    if (!document.getElementById('sd-css')) { const st = document.createElement('style'); st.id = 'sd-css'; st.textContent = CSS; document.head.appendChild(st); }
    const fonts = o.fonts || [], manage = !!o.saveImage; let image = o.image || '', tab = image ? 'pic' : (fonts.length ? 'sty' : 'pln'), done = false;
    const dlg = document.createElement('dialog'); dlg.className = 'sd'; dlg.setAttribute('aria-label', 'Sign');
    dlg.innerHTML = `<form method="dialog"><div class="sd-h"><h3>Sign: ${esc(o.label || 'signature line')}</h3><small>Choose how this line is signed. You can change the name to sign.</small></div>
      <div class="sd-b"><label class="sd-l" for="sd-name">Name to sign</label><input type="text" id="sd-name" value="${esc(o.name || '')}" autocomplete="off" spellcheck="false" maxlength="80">
      <div class="sd-t" role="tablist"><button type="button" role="tab" data-t="pic">Picture</button><button type="button" role="tab" data-t="sty">Styled</button><button type="button" role="tab" data-t="pln">Plain /s/</button></div>
      <div class="sd-m" id="sd-m" role="status"></div>
      <div data-p="pic"><div class="sd-box ck" id="sd-pv"></div>
        <div class="sd-row"><button type="button" class="sd-btn" id="sd-usepic">Sign with this picture</button>${manage ? '<label class="sd-btn o" for="sd-file" style="cursor:pointer">Upload a picture</label><input type="file" id="sd-file" accept="image/png,image/jpeg,image/webp" hidden><button type="button" class="sd-btn o" id="sd-draw">Draw it</button><button type="button" class="sd-btn o" id="sd-rm">Remove picture</button>' : ''}</div>
        ${manage ? `<div id="sd-pad" hidden><canvas class="sd-pad" id="sd-cv" width="1200" height="360" aria-label="Draw your signature here"></canvas><div class="sd-row"><button type="button" class="sd-btn" id="sd-padok">Save drawing</button><button type="button" class="sd-btn o" id="sd-padclr">Clear</button><button type="button" class="sd-btn o" id="sd-padno">Cancel</button></div></div>
        <div id="sd-ed" class="sd-ed" hidden><small>Drag on the picture to crop it. Adjust the sliders until the preview looks right, then save.</small><canvas id="sd-edcv"></canvas>
          <div class="sd-box ck" style="min-height:60px"><img id="sd-edpv" alt=""></div>
          <div class="sd-g"><label>Straighten <input type="range" id="sd-fine" min="-15" max="15" step="0.5" value="0"></label><label>Remove background <input type="range" id="sd-thr" min="120" max="250" step="1" value="235"></label><label>Ink darkness <input type="range" id="sd-ink" min="0" max="100" step="1" value="80"></label></div>
          <div class="sd-row"><button type="button" class="sd-btn o" id="sd-rl">Rotate left</button><button type="button" class="sd-btn o" id="sd-rr">Rotate right</button><button type="button" class="sd-btn o" id="sd-rc">Reset crop</button><button type="button" class="sd-btn" id="sd-edok">Save picture</button><button type="button" class="sd-btn o" id="sd-edno">Cancel</button></div></div>` : ''}</div>
      <div data-p="sty" hidden>${fonts.length ? '<div id="sd-fonts"></div><div class="sd-row"><button type="button" class="sd-btn" id="sd-usesty">Sign in this style</button></div>' : '<p>No typed styles are available for this line.</p>'}</div>
      <div data-p="pln" hidden><div class="sd-box" id="sd-plpv"></div><div class="sd-row"><button type="button" class="sd-btn" id="sd-usepln">Sign with /s/</button></div></div>
      ${o.savePref ? '<label class="sd-d"><input type="checkbox" id="sd-def"> Use my choice here as my default for new signatures</label>' : ''}</div>
      <div class="sd-f"><button type="button" class="sd-btn o" id="sd-cancel">Cancel</button></div></form>`;
    document.body.appendChild(dlg);
    const q = s => dlg.querySelector(s), qa = s => [...dlg.querySelectorAll(s)], name = () => q('#sd-name').value.trim();
    const msg = (t, bad) => { const m = q('#sd-m'); m.textContent = t || ''; m.className = 'sd-m' + (t ? (bad ? ' bad' : ' ok') : ''); };
    const finish = r => { if (done) return; done = true; if (r && o.savePref && q('#sd-def')?.checked) o.savePref(r.mode === 'image' ? 'image' : 'slash'); dlg.close(); dlg.remove(); resolve(r); };
    const pick = mode => { const t = name(); if (!t) { msg('Type the name to sign.', true); return; } finish({ mode, text: t, font: mode === 'font' || mode === 'stamp' ? q('input[name=sd-f]:checked')?.value || '' : '' }); };
    function paint() {
      qa('.sd-t button').forEach(b => b.setAttribute('aria-selected', String(b.dataset.t === tab))); qa('[data-p]').forEach(p => p.hidden = p.dataset.p !== tab);
      const nm = name() || 'Your name';
      q('#sd-pv').innerHTML = image ? `<img src="${esc(image)}" alt="Your signature picture">` : '<span style="color:#5a667a">No signature picture yet.' + (manage ? ' Upload or draw one.' : '') + '</span>';
      q('#sd-usepic').disabled = !image; if (q('#sd-rm')) q('#sd-rm').hidden = !image;
      q('#sd-plpv').innerHTML = `<span style="font:10pt 'Times New Roman',serif;color:#000">/s/ ${esc(nm)}</span>`;
      const fl = q('#sd-fonts'); if (fl) { const keep = q('input[name=sd-f]:checked')?.value; fl.innerHTML = fonts.map((x, i) => `<label class="sd-opt"><input type="radio" name="sd-f" value="${esc(x.f)}"${(keep ? keep === x.f : i === 0) ? ' checked' : ''}><span class="s" style="${esc(x.css)}">${esc(x.stamp ? '/s/ ' + nm : nm)}</span><small style="color:#5a667a">${esc(x.stamp ? 'Stamp' : x.f)}</small></label>`).join(''); }
    }
    qa('.sd-t button').forEach(b => b.onclick = () => { tab = b.dataset.t; msg(''); paint(); });
    q('#sd-name').addEventListener('input', paint);
    q('#sd-usepic').onclick = () => pick('image'); q('#sd-usepln').onclick = () => pick('slash');
    q('#sd-usesty')?.addEventListener('click', () => { const v = q('input[name=sd-f]:checked')?.value, x = fonts.find(f => f.f === v); if (!x) { msg('Choose a style.', true); return; } pick(x.stamp ? 'stamp' : 'font'); });
    q('#sd-cancel').onclick = () => finish(null); dlg.addEventListener('cancel', e => { e.preventDefault(); finish(null); }); dlg.addEventListener('click', e => { if (e.target === dlg) finish(null); });
    if (manage) {
      const save = async png => {
        if (!png) { msg('We could not find a signature in that picture. Use dark ink on a light background.', true); return false; }
        if (png.length > 250000) { msg('That picture is too detailed. Try a simpler or smaller one.', true); return false; }
        try { await o.saveImage(png); image = png; msg(o.memoryOnly ? 'Your signature picture is ready to use.' : 'Your signature picture is saved to your account.'); paint(); return true; }
        catch (er) { console.error(er); msg(er?.code === 'permission-denied' ? 'The Firestore rules must let people write their own userSignatures record. (permission-denied)' : 'We could not save your signature. Try again.', true); return false; }
      };
      const ED = { img: null, rot: 0, crop: null, out: '' };
      const base = () => {
        const im = ED.img, a = (ED.rot + (+q('#sd-fine').value || 0)) * Math.PI / 180, w = im.width, h = im.height;
        const cw = Math.abs(w * Math.cos(a)) + Math.abs(h * Math.sin(a)), ch = Math.abs(w * Math.sin(a)) + Math.abs(h * Math.cos(a)), k = Math.min(1, 1200 / Math.max(cw, ch));
        const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(cw * k)); c.height = Math.max(1, Math.round(ch * k)); const x = c.getContext('2d');
        x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.translate(c.width / 2, c.height / 2); x.rotate(a); x.scale(k, k); x.drawImage(im, -w / 2, -h / 2); return c;
      };
      const edDraw = () => {
        if (!ED.img) return; const b = base(), cv = q('#sd-edcv'), x = cv.getContext('2d'); cv.width = b.width; cv.height = b.height; x.drawImage(b, 0, 0);
        let r = ED.crop; if (r && (r.w < 8 || r.h < 8)) r = ED.crop = null;
        if (r) { x.fillStyle = 'rgba(10,25,50,.5)'; x.fillRect(0, 0, cv.width, r.y); x.fillRect(0, r.y + r.h, cv.width, cv.height - r.y - r.h); x.fillRect(0, r.y, r.x, r.h); x.fillRect(r.x + r.w, r.y, cv.width - r.x - r.w, r.h); x.strokeStyle = '#1f3b73'; x.lineWidth = Math.max(2, cv.width / 300); x.strokeRect(r.x, r.y, r.w, r.h); }
        let s = b; if (r) { s = document.createElement('canvas'); s.width = Math.round(r.w); s.height = Math.round(r.h); s.getContext('2d').drawImage(b, r.x, r.y, r.w, r.h, 0, 0, s.width, s.height); }
        ED.out = toPng(s, { thr: +q('#sd-thr').value, ink: +q('#sd-ink').value / 100 }); q('#sd-edpv').src = ED.out || ''; q('#sd-edpv').alt = ED.out ? 'Signature preview' : 'Nothing found. Lower “Remove background” or crop differently.';
      };
      const edOpen = im => { ED.img = im; ED.rot = 0; ED.crop = null; q('#sd-fine').value = 0; q('#sd-thr').value = 235; q('#sd-ink').value = 80; q('#sd-pad').hidden = true; q('#sd-ed').hidden = false; edDraw(); q('#sd-ed').scrollIntoView({ block: 'nearest' }); };
      const cv = q('#sd-edcv'); let a = null; const ept = e => { const r = cv.getBoundingClientRect(); return [Math.max(0, Math.min(cv.width, (e.clientX - r.left) * cv.width / r.width)), Math.max(0, Math.min(cv.height, (e.clientY - r.top) * cv.height / r.height))]; };
      cv.onpointerdown = e => { a = ept(e); ED.crop = { x: a[0], y: a[1], w: 0, h: 0 }; cv.setPointerCapture(e.pointerId); };
      cv.onpointermove = e => { if (!a) return; const p = ept(e); ED.crop = { x: Math.min(a[0], p[0]), y: Math.min(a[1], p[1]), w: Math.abs(p[0] - a[0]), h: Math.abs(p[1] - a[1]) }; edDraw(); };
      cv.onpointerup = cv.onpointercancel = () => { a = null; edDraw(); };
      ['#sd-fine', '#sd-thr', '#sd-ink'].forEach(i => { q(i).oninput = () => { if (i === '#sd-fine') ED.crop = null; edDraw(); }; });
      q('#sd-rl').onclick = () => { ED.rot -= 90; ED.crop = null; edDraw(); }; q('#sd-rr').onclick = () => { ED.rot += 90; ED.crop = null; edDraw(); }; q('#sd-rc').onclick = () => { ED.crop = null; edDraw(); };
      q('#sd-edno').onclick = () => { q('#sd-ed').hidden = true; ED.img = null; };
      q('#sd-edok').onclick = async () => { if (await save(ED.out)) { q('#sd-ed').hidden = true; ED.img = null; } };
      q('#sd-file').onchange = e => {
        const f = e.target.files[0]; e.target.value = ''; if (!f) return;
        if (!/^image\/(png|jpeg|webp)$/.test(f.type)) { msg('Choose a PNG, JPG or WebP picture.', true); return; }
        if (f.size > 5 * 1048576) { msg('That picture is over 5 MB.', true); return; }
        const u = URL.createObjectURL(f), im = new Image(); im.onload = () => { URL.revokeObjectURL(u); edOpen(im); }; im.onerror = () => { URL.revokeObjectURL(u); msg('We could not read that picture.', true); }; im.src = u;
      };
      const pc = q('#sd-cv'), cx = pc.getContext('2d'); let down = false, ink = false, last = null;
      const reset = () => { cx.clearRect(0, 0, pc.width, pc.height); ink = false; }; cx.lineCap = cx.lineJoin = 'round'; cx.lineWidth = 7; cx.strokeStyle = '#111';
      const pt = e => { const r = pc.getBoundingClientRect(); return [(e.clientX - r.left) * pc.width / r.width, (e.clientY - r.top) * pc.height / r.height]; };
      pc.onpointerdown = e => { down = true; ink = true; pc.setPointerCapture(e.pointerId); last = pt(e); cx.beginPath(); cx.arc(last[0], last[1], 3.5, 0, 7); cx.fillStyle = '#111'; cx.fill(); };
      pc.onpointermove = e => { if (!down) return; const p = pt(e); cx.beginPath(); cx.moveTo(last[0], last[1]); cx.lineTo(p[0], p[1]); cx.stroke(); last = p; };
      pc.onpointerup = pc.onpointercancel = () => { down = false; };
      q('#sd-draw').onclick = () => { q('#sd-ed').hidden = true; q('#sd-pad').hidden = false; reset(); msg(''); };
      q('#sd-padclr').onclick = reset; q('#sd-padno').onclick = () => { q('#sd-pad').hidden = true; };
      q('#sd-padok').onclick = () => { if (!ink) { msg('Draw your signature first.', true); return; } const im = new Image(); im.onload = async () => { if (await save(toPng(im))) q('#sd-pad').hidden = true; }; im.src = pc.toDataURL('image/png'); };
      q('#sd-rm').onclick = async () => { try { await o.removeImage(); image = ''; msg('Your signature picture was removed.'); paint(); } catch (er) { console.error(er); msg('We could not remove it. Try again.', true); } };
    }
    dlg.querySelector('form').addEventListener('submit', e => e.preventDefault()); dlg.addEventListener('close', () => finish(null));
    paint(); dlg.showModal(); q('#sd-name').focus(); q('#sd-name').select();
  });
}
