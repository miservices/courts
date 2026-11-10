/* MC 500: Request for Certified Court Records Copies (two pages: the request, then the court's response).
   One layout drives both the on-screen form and the PDF.  Coordinates are measured from the court's PDF (612 x 792 pt).
   mc500Data(receipt)  turns a recordReceipts document into the data the form needs (older receipts work too)
   mc500Html(PDFLib, data) -> HTML for the two pages        mc500Pdf(PDFLib, data) -> Uint8Array PDF  */

const K = 72 / 70;                                   // layout numbers below are in 70-dpi pixels
const mdy = t => { const d = new Date(t); return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`; };
const money = n => '$' + Number(n || 0).toFixed(2);

export function mc500Data(r) {
  const sup = /supreme/i.test(r.court || ''), county = (/^(.*?)\s+(co\.|county)/i.exec(r.court || '') || [])[1] || 'Genesee';
  const rec = { desc: r.description || '', date: r.recordDate || '', pages: r.pages || 0, search: r.searchFee || 0, copy: r.copyFee || 0, total: r.total || 0 };
  return {
    name: r.requesterName || '', court: r.court || '', caseNo: r.caseId || '', matter: r.matter || '', receipt: r.receipt || '',
    head: sup ? ['THE SUPREME COURT'] : ['THE DISTRICT COURT FOR', county.toUpperCase() + ' COUNTY'],
    kind: r.kind || 'record', rec, delivery: r.delivery || 'Electronic', dated: mdy(r.issuedAt || Date.now()), issued: mdy(r.issuedAt || Date.now()), free: !!r.free
  };
}

async function layout(PDFLib, d) {
  const tmp = await PDFLib.PDFDocument.create(), hb = await tmp.embedFont(PDFLib.StandardFonts.Helvetica), hbb = await tmp.embedFont(PDFLib.StandardFonts.HelveticaBold);
  const wrap = (s, size, maxPx) => { const out = []; let line = ''; String(s || '').split(/\s+/).forEach(w => { const t = line ? line + ' ' + w : w; if (hb.widthOfTextAtSize(t, size) > maxPx / K && line) { out.push(line); line = w; } else line = t; }); out.push(line); return out; };
  const P1 = [], P2 = [];
  const T = (P, x, y, str, o = {}) => P.push({ t: 'text', x, y, str, size: o.size || 9.5, bold: !!o.bold, align: o.align || 'left' });
  const L = (P, x1, y1, x2, y2, w = .75) => P.push({ t: 'line', x1, y1, x2, y2, w });
  const C = (P, x, y, on) => P.push({ t: 'check', x, y, on: !!on });
  const R = (P, x, y, w, h, lw = .9) => P.push({ t: 'rect', x, y, w, h, lw });
  const U = (P, x1, x2, y, str, o = {}) => { L(P, x1, y + 6, x2, y + 6); if (str) T(P, x1 + 3, y, str, o); };   // a filled-in blank
  const k = d.kind;

  /* page 1: the request */
  L(P1, 50, 38, 545, 38, 1); L(P1, 50, 82, 545, 82, 1); L(P1, 215, 38, 215, 82, 1);
  T(P1, 82, 48, 'STATE OF MICHIGAN', { bold: true, size: 8.5 }); d.head.forEach((h, i) => T(P1, 132, 60 + i * 11, h, { size: 8.5, align: 'center' }));
  T(P1, 254, 59, 'REQUEST FOR CERTIFIED COURT RECORDS COPIES', { bold: true, size: 8.5 });
  T(P1, 50, 117, 'I,'); U(P1, 62, 218, 117, d.name); T(P1, 222, 117, ', request certified copies of court record(s) as follows:'); T(P1, 57, 128, 'Print or type your name', { size: 5.8 });
  T(P1, 50, 145, '1. I request records from the following case:');
  T(P1, 65, 162, 'a. Court:'); U(P1, 107, 333, 162, d.court);
  T(P1, 65, 179, 'b. Case No.:'); U(P1, 123, 242, 179, d.caseNo);
  T(P1, 65, 196, 'c. In the matter of:'); U(P1, 150, 541, 196, d.matter);
  T(P1, 50, 219, '2. I request certified copies of the following records maintained by the court in the case identified in item 1:');
  let y = 237;
  [['a. Documents:', 'record'], ['b. Docket entries:', 'docket'], ['c. Court opinions:', 'opinion']].forEach(([lab, key], i) => {
    C(P1, 60, y, k === key); T(P1, 75, y, lab); y += 26;
    if (k === key) { const ls = wrap('- ' + d.rec.desc + (d.rec.date ? ` (${d.rec.date})` : ''), 9.5, 460); ls.forEach((l, j) => T(P1, 75, y + j * 13, l)); y += (ls.length - 1) * 13; } else T(P1, 75, y, 'NONE');
    y += i < 2 ? (k === key ? 27 : 25 + 3) : 26;
  });
  y -= 26 - 26;
  T(P1, 50, y, '3. My preferred delivery method is:'); y += 16;
  ['Electronic', 'Mail', 'In-Person Pickup'].forEach((m, i) => { C(P1, 60, y, d.delivery === m); T(P1, 75, y, 'abc'[i] + '. ' + m); y += 14.5; });
  y += 18; T(P1, 50, y, 'I certify that the information provided in this request is true and complete to the best of my knowledge. I understand'); T(P1, 50, y + 15, 'that the issuance of certified copies may be subject to applicable fees.');
  y += 52; T(P1, 50, y, 'DATED:', { bold: true }); U(P1, 88, 135, y, d.dated);
  C(P1, 58, y + 32, true); T(P1, 75, y + 32, 'This request was submitted and administered through an automated electronic system.');
  T(P1, 306, 729, 'MC 500', { bold: true, size: 6.5, align: 'center' });

  /* page 2: the court's response */
  T(P2, 379, 40, 'Receipt Number:', { bold: true }); U(P2, 457, 545, 40, d.receipt, { size: 9 });
  T(P2, 54, 83, 'Section to be completed by court staff only.', { size: 6.3 }); R(P2, 242, 70, 115, 25, 1.4); T(P2, 299, 83, 'COURT RESPONSE', { bold: true, size: 8.5, align: 'center' });
  T(P2, 50, 114, '1. The court has reviewed the request for certified copies identified above and makes the following determination:');
  [['a. The requested records are available and will be issued as certified copies.', true], ['b. Certain requested records will be issued as certified copies.', false], ['c. The request is denied for the following reason(s):', false]].forEach(([s, on], i) => { C(P2, 60, 133 + i * 15, on); T(P2, 75, 133 + i * 15, s); });
  T(P2, 50, 254, '2. The following records have been approved for certification and issued pursuant to this request:');
  const table = (top, cols, rows, pad = 7) => {   // cols: [{x (left edge), w, align}] ; header is part of rows[0]
    let yy = top; L(P2, 50, yy, 545, yy, 1.2);
    rows.forEach((row, ri) => {
      const lines = Math.max(...row.map((cell, ci) => cell.lines.length)), h = ri === 0 ? 22 : Math.max(32, lines * 12 + 14);
      row.forEach((cell, ci) => cell.lines.forEach((ln, li) => T(P2, cols[ci].align === 'right' ? cols[ci].x + cols[ci].w - 6 : cols[ci].align === 'center' ? cols[ci].x + cols[ci].w / 2 : cols[ci].x + 5, yy + (ri === 0 ? 11 : 15) + li * 12, ln, { size: ri === 0 ? 6.4 : 9, bold: ri === 0, align: cols[ci].align || 'left' })));
      yy += h; L(P2, 50, yy, 545, yy, ri === 0 ? .9 : .9);
      if (ri > 0) cols.slice(1).forEach(c => L(P2, c.x, yy - h, c.x, yy, .9));
    }); return yy;
  };
  const plain = (s, w) => ({ lines: wrap(s, 9, w) });
  let e = table(275, [{ x: 50, w: 380 }, { x: 430, w: 66 }, { x: 496, w: 49, align: 'center' }],
    [[{ lines: ['Record description'] }, { lines: ['Date of record'] }, { lines: ['Pages'] }], [plain(d.rec.desc, 360), { lines: [d.rec.date] }, { lines: [String(d.rec.pages)], }]]);
  C(P2, 50, e + 57, true); T(P2, 65, e + 57, '3. The following fees have been assessed in connection with this request:');
  const cols = [{ x: 50, w: 253 }, { x: 303, w: 47, align: 'center' }, { x: 350, w: 58 }, { x: 408, w: 52 }, { x: 460, w: 85, align: 'right' }];
  const f = table(e + 85, cols, [[{ lines: ['Record name'] }, { lines: ['Pages'] }, { lines: ['Search fee'] }, { lines: ['Copy fee'] }, { lines: ['Total'] }],
    [plain(d.rec.desc, 235), { lines: [String(d.rec.pages)] }, { lines: [money(d.rec.search)] }, { lines: [d.free ? '$0.00' : money(d.rec.copy)] }, { lines: [money(d.rec.total)] }]]);
  R(P2, 408, f, 137, 22, .9); T(P2, 542, f + 12, 'TOTAL: ' + money(d.rec.total), { bold: true, align: 'right' });
  const g = f + 62; T(P2, 50, g, `4. This certification has been assigned the following receipt number: ${d.receipt}.`);
  T(P2, 50, g + 55, 'I certify that the records issued pursuant to this request are true and accurate copies of the records maintained by'); T(P2, 50, g + 69, 'this court. Each certified record bears the certification of the clerk of the court and the official seal of the court.');
  const s = Math.max(g + 126, 639); U(P2, 50, 150, s - 8, d.issued); L(P2, 332, s - 2, 545, s - 2); T(P2, 57, s + 10, 'Date issued', { size: 6.3 }); T(P2, 338, s + 10, 'Clerk of the court signature', { size: 6.3 });
  T(P2, 306, 729, 'MC 500', { bold: true, size: 6.5, align: 'center' });
  return { pages: [P1, P2], hb, hbb };
}

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export async function mc500Html(PDFLib, d) {
  const { pages } = await layout(PDFLib, d), S = K * 816 / 612;   // layout px -> css px on an 816 px wide page
  return `<style>.mc500{width:816px;height:1056px;position:relative;overflow:hidden;background:#fff;margin:0 auto 16px;box-shadow:0 1px 6px rgba(0,0,0,.25);font-family:Arial,Helvetica,sans-serif;color:#000}.mc500 *{position:absolute;box-sizing:border-box;white-space:pre}</style>`
    + pages.map(P => `<div class="mc500">${P.map(p => {
      if (p.t === 'text') { const fs = p.size * 816 / 612, tx = p.x * S, ty = p.y * S - fs * .62, base = `top:${ty.toFixed(1)}px;font-size:${fs.toFixed(2)}px;line-height:${(fs * 1.25).toFixed(2)}px;${p.bold ? 'font-weight:bold;' : ''}`;
        return p.align === 'center' ? `<div style="${base}left:${(tx - 300).toFixed(1)}px;width:600px;text-align:center">${esc(p.str)}</div>` : p.align === 'right' ? `<div style="${base}left:${(tx - 600).toFixed(1)}px;width:600px;text-align:right">${esc(p.str)}</div>` : `<div style="${base}left:${tx.toFixed(1)}px">${esc(p.str)}</div>`; }
      if (p.t === 'line') { const x1 = p.x1 * S, x2 = p.x2 * S, y1 = p.y1 * S, y2 = p.y2 * S, w = Math.max(1, p.w * 816 / 612); return x1 === x2 ? `<div style="left:${x1}px;top:${y1}px;width:${w}px;height:${y2 - y1}px;background:#000"></div>` : `<div style="left:${x1}px;top:${y1}px;width:${x2 - x1}px;height:${w}px;background:#000"></div>`; }
      if (p.t === 'rect') return `<div style="left:${p.x * S}px;top:${p.y * S}px;width:${p.w * S}px;height:${p.h * S}px;border:${Math.max(1, p.lw * 1.33)}px solid #000"></div>`;
      if (p.t === 'check') { const s = 10 * S; return `<div style="left:${p.x * S}px;top:${p.y * S - s * .55}px;width:${s}px;height:${s}px;border:1.2px solid #333;border-radius:2px;text-align:center;font-size:${s}px;line-height:${s - 2}px">${p.on ? '&#10003;' : ''}</div>`; }
      return ''; }).join('')}</div>`).join('');
}

export async function mc500Pdf(PDFLib, d) {
  const { pages } = await layout(PDFLib, d), doc = await PDFLib.PDFDocument.create(), F = await doc.embedFont(PDFLib.StandardFonts.Helvetica), B = await doc.embedFont(PDFLib.StandardFonts.HelveticaBold), black = PDFLib.rgb(0, 0, 0);
  for (const P of pages) {
    const pg = doc.addPage([612, 792]);
    for (const p of P) {
      if (p.t === 'text') { const f = p.bold ? B : F, w = f.widthOfTextAtSize(p.str, p.size), x = p.x * K - (p.align === 'center' ? w / 2 : p.align === 'right' ? w : 0); pg.drawText(p.str, { x, y: 792 - p.y * K - p.size * .35, size: p.size, font: f, color: black }); }
      else if (p.t === 'line') pg.drawLine({ start: { x: p.x1 * K, y: 792 - p.y1 * K }, end: { x: p.x2 * K, y: 792 - p.y2 * K }, thickness: p.w, color: black });
      else if (p.t === 'rect') pg.drawRectangle({ x: p.x * K, y: 792 - (p.y + p.h) * K, width: p.w * K, height: p.h * K, borderWidth: p.lw, borderColor: black });
      else if (p.t === 'check') { const s = 10 * K, x = p.x * K, y = 792 - p.y * K - s * .55; pg.drawRectangle({ x, y, width: s, height: s, borderWidth: .8, borderColor: PDFLib.rgb(.2, .2, .2) });
        if (p.on) { pg.drawLine({ start: { x: x + s * .2, y: y + s * .5 }, end: { x: x + s * .43, y: y + s * .2 }, thickness: 1.1, color: black }); pg.drawLine({ start: { x: x + s * .43, y: y + s * .2 }, end: { x: x + s * .82, y: y + s * .8 }, thickness: 1.1, color: black }); } }
    }
  }
  return doc.save();
}