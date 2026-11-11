/* Service of process: showing a summons and filling in its proof of service. Used by the service link page and by Enforcement. */
import { mountForm } from './engine.js?v=33';
import { mdFromValues, proofSpec, usDate, usTime, FORM_NUM } from './service.js?v=1';

const CSS = `.sv-prev{background:#dfe5ef;border:1px solid #d3dae6;border-radius:8px;overflow:auto;padding:12px 0}.sv-prev .fd-panel{display:none!important}.sv-prev .fd-view{height:auto}.sv-prev iframe{width:100%!important}
.sv-pp{display:grid;gap:10px}.sv-pp .sv-g{border:1px solid #d3dae6;border-radius:8px;padding:12px 14px;background:#fff;display:grid;gap:10px}
.sv-pp label.sv-c{display:flex;gap:10px;align-items:flex-start;font-weight:600;color:#10264a;cursor:pointer}.sv-pp label.sv-c input{width:18px;height:18px;margin-top:2px;flex:none}
.sv-pp .sv-r{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px}.sv-pp .sv-f{display:grid;gap:4px;font-size:13px;color:#5b6678}.sv-pp .sv-f input{font:inherit;font-size:15px;padding:9px 11px;border:1px solid #c5cedd;border-radius:6px;color:#1b2433;background:#fff}
.sv-pp .sv-f input:focus{outline:3px solid #1f5fae55;border-color:#1f5fae}.sv-pp .sv-f input:disabled{background:#f1f4f9}.sv-pp [hidden]{display:none!important}`;
export function mountPreview(host, sr) {
  if (!document.getElementById('sv-css')) { const st = document.createElement('style'); st.id = 'sv-css'; st.textContent = CSS; document.head.appendChild(st); }
  let eng = null, n = 0;
  const draw = async values => {
    const my = ++n, def = (await import(`./${sr.formId}.js?v=2`)).default;
    host.classList.add('sv-prev'); const box = document.createElement('div'); const show = 'width:860px;max-width:100%;margin:0 auto';
    box.style.cssText = show + ';position:absolute;left:-99999px;top:0;visibility:hidden'; host.style.position = 'relative'; host.appendChild(box);   // the form must be in the page to load
    let next; try { next = await mountForm(def, box, { md: mdFromValues(def, values), readOnly: true }); } catch (e) { box.remove(); throw e; }
    if (my !== n) { next.destroy(); box.remove(); return; }
    eng?.destroy(); eng = next; [...host.children].forEach(c => { if (c !== box) c.remove(); }); box.style.cssText = show; const f = box.querySelector('iframe'); if (f) f.style.minHeight = '1100px';
  };
  return { draw, destroy: () => eng?.destroy() };
}
/* The process server's fields. onInput(values) runs on every change. Editable only when `editable` is true. */
export function proofPanel(host, sr, editable, onInput) {
  const spec = proofSpec(sr.formId), v = { ...sr.values };
  const toIn = (type, val) => type === 'date' ? (/^(\d{2})\/(\d{2})\/(\d{4})$/.test(val || '') ? val.replace(/^(\d{2})\/(\d{2})\/(\d{4})$/, '$3-$1-$2') : '') : type === 'time' ? (/(\d{1,2}):(\d{2}) (AM|PM)/.exec(val || '') ? (m => `${String((+m[1] % 12) + (m[3] === 'PM' ? 12 : 0)).padStart(2, '0')}:${m[2]}`)(/(\d{1,2}):(\d{2}) (AM|PM)/.exec(val)) : '') : val || '';
  const groups = [], loose = []; spec.forEach(f => { if (f.type === 'check' && !f.on) groups.push({ head: f, kids: [] }); else if (f.on) groups.find(g => g.head.id === f.on).kids.push(f); else loose.push(f); });
  const fld = f => `<label class="sv-f">${f.label}<input data-f="${f.id}" type="${f.type === 'money' ? 'text' : f.type === 'check' ? 'checkbox' : f.type}" value="${String(toIn(f.type, v[f.id])).replace(/"/g, '&quot;')}" ${f.ph ? `placeholder="${f.ph}"` : ''} ${editable ? '' : 'disabled'}></label>`;
  const render = () => { host.innerHTML = `<div class="sv-pp">${groups.map(g => `<div class="sv-g"><label class="sv-c"><input type="checkbox" data-f="${g.head.id}" ${v[g.head.id] ? 'checked' : ''} ${editable ? '' : 'disabled'}><span>${g.head.label}</span></label>${g.kids.length ? `<div class="sv-r" data-for="${g.head.id}" ${v[g.head.id] ? '' : 'hidden'}>${g.kids.map(fld).join('')}</div>` : ''}</div>`).join('')}<div class="sv-g"><div class="sv-r">${loose.map(fld).join('')}</div></div></div>`; };
  render();
  host.oninput = host.onchange = e => {
    const i = e.target.closest('[data-f]'); if (!i) return; const id = i.dataset.f, f = spec.find(x => x.id === id);
    v[id] = f.type === 'check' ? i.checked : f.type === 'date' ? usDate(i.value) : f.type === 'time' ? usTime(i.value) : i.value;
    if (f.type === 'check') host.querySelectorAll(`[data-for="${id}"]`).forEach(r => { r.hidden = !i.checked; });
    if (id === 'pchk' || id === 'schk' || id === 'uchk') { if (i.checked) v.nonc = false; }
    onInput?.({ ...v });
  };
  return { values: () => ({ ...v }) };
}
export const titleOf = sr => `${FORM_NUM[sr.formId] || 'Summons'} · ${sr.party?.name || ''}`;
