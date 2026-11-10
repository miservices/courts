/* Draws the court marks onto the pages of a PDF (pdf-lib): the "A TRUE COPY" stamp, the "CERTIFIED COPY" certification, the court seal and the
   document sticker. Used for downloads from the document viewer and for certified copies issued through Request Records.
   marks = { stamp, front (second stamp, e.g. A CERTIFIED COPY), cert, seal, sticker }  -  each placed by fraction of the page (x, y from the top left); page 0 / empty = last page. */
import { stampSvg, stickerSvg, certSvg, sealSvg, sealUrl } from './engine.js?v=33';
const K = 4;
const toPngBytes = async (svg, w, h) => {
  const img = new Image(); await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); });
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h; cv.getContext('2d').drawImage(img, 0, 0, w, h);
  return await (await fetch(cv.toDataURL('image/png'))).arrayBuffer();
};
const plain = (svg, w, h) => svg.replace(/ style="[^"]*"/, '').replace(/width="[\d.]+" height="[\d.]+"/, `width="${w}" height="${h}"`).replace(/^<svg /, m => m + (/xmlns=/.test(svg) ? '' : 'xmlns="http://www.w3.org/2000/svg" '));
export async function drawMarks(PDFLib, d, { stamp, front, cert, seal, sticker } = {}) {
  const { degrees } = PDFLib, pgs = d.getPages(), pageOf = n => pgs[n ? Math.min(pgs.length, Math.max(1, n)) - 1 : pgs.length - 1];
  if (sticker) {
    const sk = stickerSvg(sticker, K), sw = +/data-w="(\d+)"/.exec(sk)[1], png = await d.embedPng(await toPngBytes(sk, sw * K, 92 * K)), pg = pgs[0], { width, height } = pg.getSize(), w = width * (sw * .6 / 816), h = w * 92 / sw;
    pg.drawImage(png, { x: width - width * (16 / 816) - w, y: height * (5 / 1056), width: w, height: h });
  }
  for (const st of [stamp, front]) if (st) {
    const svg = plain(stampSvg({ ...st, x: 0, y: 0, move: false }), 176 * K, 76 * K), png = await d.embedPng(await toPngBytes(svg, 176 * K, 76 * K)), pg = pageOf(st.page || 1), { width, height } = pg.getSize(), w = width * (176 * (st.scale || 1) / 816), h = w * 95 / 220;
    pg.drawImage(png, { x: st.x * width, y: height - st.y * height - h, width: w, height: h, rotate: degrees(-(st.rot ?? -3)) });
  }
  if (cert) {
    const sc = cert.scale || 1, svg = plain(certSvg({ ...cert, x: 0, y: 0, ghost: false, move: false }), 270 * K, 150 * K), png = await d.embedPng(await toPngBytes(svg, 270 * K, 150 * K)), pg = pageOf(cert.page), { width, height } = pg.getSize(), w = width * (216 * sc / 816), h = w * 150 / 270;
    pg.drawImage(png, { x: cert.x * width, y: height - cert.y * height - h, width: w, height: h, rotate: degrees(-(cert.rot ?? 0)) });
  }
  if (seal) {
    const png = await d.embedPng(await (await fetch(sealUrl(seal.court))).arrayBuffer()), sc = seal.scale || 1, pg = pageOf(seal.page), { width, height } = pg.getSize(), w = width * (96 * sc / 816), h = w * png.height / png.width;
    pg.drawImage(png, { x: seal.x * width, y: height - seal.y * height - h, width: w, height: h, rotate: degrees(-(seal.rot ?? 0)), opacity: Math.min(1, Math.max(.25, seal.ink ?? 1)) });
  }
  return d;
}
/* Default places, used until a clerk moves them. */
export const DEF_CERT = { x: 0.233, y: 0.86, page: 0, rot: 0, ink: 1, scale: 1.1 };
export const DEF_SEAL = { x: 0.09, y: 0.855, page: 0, scale: 1, ink: 1 };
export const todayStr = () => { const t = new Date(), p = n => String(n).padStart(2, '0'); return `${p(t.getMonth() + 1)}/${p(t.getDate())}/${t.getFullYear()}`; };