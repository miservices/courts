/* Service of process: showing a summons and filling in its proof of service. Used by the service link page and by Enforcement. */
import { mountForm } from './engine.js?v=33';
import { mdFromValues, proofSpec, usDate, usTime, FORM_NUM } from './service.js?v=2';

const CSS = `.sv-prev{background:#dfe5ef;border:1px solid #d3dae6;border-radius:8px;overflow:auto;padding:12px 0}.sv-prev .fd-panel{display:none!important}.sv-prev .fd-view{height:auto}.sv-prev iframe{width:100%!important}
.sv-pp{display:grid;gap:10px}.sv-pp .sv-g{border:1px solid #d3dae6;border-radius:8px;padding:12px 14px;background:#fff;display:grid;gap:10px}
.sv-pp label.sv-c{display:flex;gap:10px;align-items:flex-start;font-weight:600;color:#10264a;cursor:pointer}.sv-pp label.sv-c input{width:18px;height:18px;margin-top:2px;flex:none}
.sv-pp .sv-r{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px}.sv-pp .sv-f{display:grid;gap:4px;font-size:13px;color:#5b6678}.sv-pp .sv-f input{font:inherit;font-size:15px;padding:9px 11px;border:1px solid #c5cedd;border-radius:6px;color:#1b2433;background:#fff}
.sv-pp .sv-f input:focus{outline:3px solid #1f5fae55;border-color:#1f5fae}.sv-pp .sv-f input:disabled{background:#f1f4f9}.sv-pp [hidden]{display:none!important}`;
export function mountPreview(host, sr) {
  injectCss();
  let eng = null, n = 0;
  const draw = async (values, sigs) => {
    const my = ++n, def = (await import(`./${sr.formId}.js?v=4`)).default;
    host.classList.add('sv-prev'); const box = document.createElement('div'); const show = 'width:860px;max-width:100%;margin:0 auto';
    box.style.cssText = show + ';position:absolute;left:-99999px;top:0;visibility:hidden'; host.style.position = 'relative'; host.appendChild(box);   // the form must be in the page to load
    let next; try { next = await mountForm(def, box, { md: mdFromValues(def, values, sigs || (sr.sig ? { clk: sr.sig } : {})), readOnly: true }); } catch (e) { box.remove(); throw e; }
    if (my !== n) { next.destroy(); box.remove(); return; }
    eng?.destroy(); eng = next; [...host.children].forEach(c => { if (c !== box) c.remove(); }); box.style.cssText = show; const f = box.querySelector('iframe'); if (f) f.style.minHeight = '1100px';
  };
  return { draw, destroy: () => eng?.destroy() };
}
/* The process server's fields. onInput(values) runs on every change. Editable only when `editable` is true.
   opts.name pre-fills "Name and title". Choosing how service was made works like a radio group. */
const PCSS = `.sv-pp{display:grid;gap:18px;font-size:15px;color:#1b2433}.sv-pp h4{margin:0 0 8px;font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:#5b6678;font-weight:700}
.sv-pp .sv-opts{display:grid;gap:8px}.sv-pp .sv-o{border:1.5px solid #d3dae6;border-radius:10px;background:#fff;transition:border-color .12s,background .12s,box-shadow .12s;overflow:hidden}
.sv-pp .sv-o.on{border-color:#1f5fae;background:#f3f7fd;box-shadow:0 0 0 3px #1f5fae1f}.sv-pp .sv-o.bad.on{border-color:#a3392f;background:#fdf4f3;box-shadow:0 0 0 3px #a3392f1f}
.sv-pp .sv-h{display:flex;gap:12px;align-items:center;padding:12px 14px;cursor:pointer;margin:0;font-weight:600;color:#10264a;line-height:1.3}.sv-pp .sv-h small{display:block;font-weight:400;color:#5b6678;font-size:13px;margin-top:1px}
.sv-pp .sv-h input{position:absolute;opacity:0;pointer-events:none}.sv-pp .sv-dot{flex:none;width:20px;height:20px;border-radius:50%;border:2px solid #aab5c8;background:#fff;display:grid;place-items:center}
.sv-pp .on .sv-dot{border-color:#1f5fae;background:#1f5fae;box-shadow:inset 0 0 0 4px #fff}.sv-pp .bad.on .sv-dot{border-color:#a3392f;background:#a3392f}
.sv-pp .sv-h:has(input:focus-visible){outline:3px solid #1f5fae55;outline-offset:-3px}.sv-pp .sv-h.dis{cursor:default}
.sv-pp .sv-r{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding:2px 14px 14px 46px}.sv-pp .sv-r.one{grid-template-columns:1fr}
.sv-pp .sv-f{display:grid;gap:5px;font-size:13px;color:#5b6678;font-weight:500;margin:0}.sv-pp .sv-f.w2{grid-column:1/-1}
.sv-pp .sv-f input{font:inherit;font-size:15px;height:40px;padding:0 11px;border:1px solid #c5cedd;border-radius:6px;color:#1b2433;background:#fff;box-sizing:border-box;width:100%;min-width:0}
.sv-pp .sv-f input:focus{outline:3px solid #1f5fae44;border-color:#1f5fae}.sv-pp .sv-f input:disabled{background:#f1f4f9;color:#44506a}
.sv-pp .sv-ack{display:flex;gap:12px;align-items:center;padding:12px 14px;border:1.5px solid #d3dae6;border-radius:10px;background:#fff;cursor:pointer;font-weight:600;color:#10264a;margin:0}.sv-pp .sv-ack input{width:18px;height:18px;flex:none;margin:0}
.sv-pp .sv-ack.on{border-color:#1f5fae;background:#f3f7fd}.sv-pp .sv-sig{display:grid;grid-template-columns:140px 1fr 1fr;gap:12px;padding:14px;border:1px solid #d3dae6;border-radius:10px;background:#fafcfe}
.sv-pp .sv-money{position:relative}.sv-pp .sv-money b{position:absolute;left:11px;bottom:0;height:40px;line-height:40px;color:#5b6678;font-weight:500}.sv-pp .sv-money input{padding-left:24px}
@media(max-width:640px){.sv-pp .sv-r{grid-template-columns:1fr 1fr;padding-left:14px}.sv-pp .sv-f.w2{grid-column:1/-1}.sv-pp .sv-sig{grid-template-columns:1fr}}
.sv-sum{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px 22px;padding:14px 16px;border:1px solid #d3dae6;border-radius:10px;background:#f7f9fc;margin-bottom:18px}.sv-sum div{min-width:0}.sv-sum dt{font-size:12px;color:#5b6678;text-transform:uppercase;letter-spacing:.05em;margin:0 0 2px}.sv-sum dd{margin:0;font-weight:600;color:#10264a;overflow-wrap:anywhere}`;
const esc2 = x => String(x ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export function summaryHtml(sr) {
  injectCss();
  const docs = (sr.complaint || []).length ? (sr.complaint || []).map(d => d.url ? `<a href="${esc2(d.url)}" target="_blank" rel="noopener">${esc2(d.name || 'Complaint')}</a>` : esc2(d.name)).join('<br>') : 'Summons and complaint';
  return `<dl class="sv-sum"><div><dt>Defendant</dt><dd>${esc2(sr.party?.name)}</dd></div><div><dt>Case</dt><dd>${esc2(sr.caseId)}</dd></div><div><dt>Address</dt><dd>${esc2(sr.party?.address) || 'Not on file'}</dd></div><div><dt>Documents to serve</dt><dd>${docs}</dd></div></dl>`;
}
function injectCss() { if (!document.getElementById('sv-css')) { const st = document.createElement('style'); st.id = 'sv-css'; st.textContent = CSS + PCSS; document.head.appendChild(st); } }
export function proofPanel(host, sr, editable, onInput, opts = {}) {
  injectCss();
  const spec = proofSpec(sr.formId), v = { ...sr.values }, METH = ['pchk', 'schk', 'uchk', 'nonc'];
  if (editable && !v.pname && opts.name) v.pname = opts.name;
  const toIn = (type, val) => type === 'date' ? (/^(\d{2})\/(\d{2})\/(\d{4})$/.test(val || '') ? val.replace(/^(\d{2})\/(\d{2})\/(\d{4})$/, '$3-$1-$2') : '') : type === 'time' ? (m => m ? `${String((+m[1] % 12) + (m[3] === 'PM' ? 12 : 0)).padStart(2, '0')}:${m[2]}` : '')(/(\d{1,2}):(\d{2}) (AM|PM)/.exec(val || '')) : (val ?? '');
  const by = id => spec.find(x => x.id === id), kids = id => spec.filter(f => f.on === id);
  const dis = editable ? '' : 'disabled';
  const inp = f => `<label class="sv-f${f.id === 'pn' || f.id === 'sn' ? ' w2' : ''}">${f.label}<input data-f="${f.id}" type="${f.type === 'money' ? 'text' : f.type}" value="${esc2(toIn(f.type, v[f.id]))}" ${f.ph ? `placeholder="${esc2(f.ph)}"` : ''} ${dis}></label>`;
  const sub = { pchk: 'Sent by direct message to the person', schk: 'The person’s settings did not allow direct messages', uchk: 'The person could not be messaged or mentioned', nonc: 'A certificate of non-service (MC 01D) must then be filed' };
  const lab = id => (by(id).label.split(': ')[0]);
  const opt = id => { const f = by(id), on = !!v[id], ks = kids(id), det = f.label.includes(': ') ? f.label.split(': ').slice(1).join(': ') : '';
    return `<div class="sv-o ${id === 'nonc' ? 'bad' : ''} ${on ? 'on' : ''}" data-o="${id}"><label class="sv-h ${editable ? '' : 'dis'}"><input type="checkbox" data-f="${id}" ${on ? 'checked' : ''} ${dis}><span class="sv-dot"></span><span>${id === 'nonc' ? 'Service could not be completed' : lab(id)}<small>${id === 'nonc' ? sub.nonc : det ? det[0].toUpperCase() + det.slice(1) : sub[id]}</small></span></label>${ks.length ? `<div class="sv-r" data-for="${id}" ${on ? '' : 'hidden'}>${ks.map(inp).join('')}</div>` : ''}</div>`; };
  const meths = METH.filter(id => by(id));
  host.innerHTML = `<div class="sv-pp"><div><h4>How was service made?</h4><div class="sv-opts">${meths.map(opt).join('')}</div></div>
    <div><h4>Acknowledgment</h4><label class="sv-ack ${v.ackc ? 'on' : ''}"><input type="checkbox" data-f="ackc" ${v.ackc ? 'checked' : ''} ${dis}>An acknowledgment of service was returned within 24 hours</label>${by('msp') ? `<label class="sv-ack ${v.msp ? 'on' : ''}" style="margin-top:8px"><input type="checkbox" data-f="msp" ${v.msp ? 'checked' : ''} ${dis}>${by('msp').label}</label>` : ''}</div>
    <div><h4>Fee and signature</h4><div class="sv-sig"><label class="sv-f sv-money">${by('fee').label}<b>$</b><input data-f="fee" type="text" inputmode="decimal" value="${esc2(String(v.fee ?? '').replace(/^\$/, ''))}" placeholder="0.00" ${dis}></label>${inp(by('pname')).replace(' w2', '')}${inp(by('psig')).replace(' w2', '')}</div></div></div>`;
  const tz = (() => { try { const z = opts.tz || Intl.DateTimeFormat().resolvedOptions().timeZone, n = new Intl.DateTimeFormat('en-US', { timeZone: z, timeZoneName: 'long' }).formatToParts(new Date()).find(x => x.type === 'timeZoneName')?.value || ''; return n.replace(/\s+(Standard|Daylight|Summer)?\s*Time$/i, '').replace(/^(.*?)\s*$/, '$1'); } catch { return ''; } })();
  const setIn = (id, val) => { v[id] = val; const el = host.querySelector(`[data-f="${id}"]`); if (el) el.value = toIn(by(id).type, val); };
  host.oninput = host.onchange = e => {
    const i = e.target.closest('[data-f]'); if (!i || !editable) return; const id = i.dataset.f, f = by(id);
    if (id === 'fee') v.fee = i.value.trim() ? '$' + i.value.trim().replace(/^\$/, '') : '';
    else v[id] = f.type === 'check' ? i.checked : f.type === 'date' ? usDate(i.value) : f.type === 'time' ? usTime(i.value) : i.value;
    if (METH.includes(id)) {
      if (i.checked) { METH.forEach(m => { if (m !== id && by(m)) v[m] = false; });
        if (id !== 'nonc') { const n = new Date(), z = k => String(k).padStart(2, '0'); if (!v[id[0] + 'd']) setIn(id[0] + 'd', usDate(`${n.getFullYear()}-${z(n.getMonth() + 1)}-${z(n.getDate())}`)); if (!v[id[0] + 't']) setIn(id[0] + 't', usTime(`${z(n.getHours())}:${z(n.getMinutes())}`)); if (!v[id[0] + 'z'] && tz) setIn(id[0] + 'z', tz); } }
      else v[id] = false;
      host.querySelectorAll('.sv-o').forEach(o => { const k = o.dataset.o, on = !!v[k]; o.classList.toggle('on', on); const inp0 = o.querySelector(`[data-f="${k}"]`); if (inp0) inp0.checked = on; const r = o.querySelector('.sv-r'); if (r) r.hidden = !on; });
    }
    if (id === 'ackc' || id === 'msp') i.closest('.sv-ack').classList.toggle('on', i.checked);
    onInput?.({ ...v });
  };
  return { values: () => ({ ...v }) };
}
export const titleOf = sr => `${FORM_NUM[sr.formId] || 'Summons'} · ${sr.party?.name || ''}`;
