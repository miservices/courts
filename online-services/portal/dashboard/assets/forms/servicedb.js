/* Service of process: saving summons, service requests, acknowledgments and proofs of service (collection serviceRequests).
   Every case change is additive: a party gains service fields and the docket gains an entry. Nothing is removed. */
import { doc, getDoc, setDoc, updateDoc, runTransaction } from 'https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js';
import { outcomeOf, usDate, SR_STATUS, issueValues, certValues, mdFromValues, SUMMONS_DAYS, SECOND_SUMMONS_DAYS, ACK_HOURS, responseDays, extendedDays, addDays } from './service.js?v=4';

export const SERVICE_BASE = 'https://migovt.org/courts/online-services/portal/dashboard/service/#/';
export const linkOf = sr => SERVICE_BASE + (sr._id || sr.id);
const STAFF = ['court reporter', 'law clerk', 'judicial assistant', 'deputy clerk', 'county clerk', 'court administrator', 'magistrate', 'judge', 'chief judge', 'deputy clerk of the supreme court', 'clerk of the supreme court', 'reporter of decisions', 'state court administrator', 'justice', 'chief justice'];
export const isStaffRole = r => STAFF.includes(String(r || '').trim().toLowerCase());
/* May this person fill in and file the proof of service? The assigned process server, or court staff overseeing it. */
export const canFile = (sr, account, role) => !!account && !sr.proof?.filedAt && sr.kind !== 'subpoena' && sr.status !== SR_STATUS.sumreq && (isStaffRole(role) || (!!sr.serverUid && sr.serverUid === account.uid));
const colFor = court => court === 'Michigan Supreme Court' ? 'mscCases' : 'cases';
const rid = () => { const a = new Uint8Array(15); crypto.getRandomValues(a); return [...a].map(x => 'abcdefghjkmnpqrstuvwxyz23456789'[x % 31]).join(''); };
const isoOf = us => { const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(us || '')); return m ? `${m[3]}-${m[1]}-${m[2]}` : ''; };
const nextNo = ev => (ev || []).reduce((m, e) => Math.max(m, e.eventNumber || 0), 0) + 1;
const addEv = (ev, e) => [...(ev || []), { eventNumber: nextNo(ev), sealed: false, type: 'event', date: new Date().toISOString(), ...e }];
const mapParty = (d, name, fn) => (Array.isArray(d.parties) ? d.parties : []).map(p => p && p.name === name ? fn(p) : p);

/* A summons or subpoena request. kind 'summons' (one per defendant, form MC 01A-C) or 'subpoena' (no form yet). It starts as "requested";
   court staff issue it from the Process page. status: 'sumreq' | 'subreq' | 'issued' | 'subissued'. */
export async function newSummons(db, { court, caseId, caseFirestoreId, formId, party, values, complaint = [], by, status = 'sumreq', kind = 'summons', note = '', second = false }) {
  const id = rid(), sr = { id, kind, court, caseId, caseFirestoreId: caseFirestoreId || caseId, formId: kind === 'summons' ? formId : null, party, values: values || {}, complaint, status: SR_STATUS[status], createdBy: by.name, createdByUid: by.uid, createdAt: Date.now(), requestedByUid: by.uid, serverUid: null, serverName: null, ...(note ? { note } : {}), ...(second ? { second: true } : {}) };
  const clean = JSON.parse(JSON.stringify(sr));   // Firestore rejects undefined values
  await setDoc(doc(db, 'serviceRequests', id), clean);
  if (status === 'sumreq' || status === 'subreq') { try { await caseEvent(db, clean, { type: 'event', svc: true, description: `${by.name} requested ${kind === 'subpoena' ? 'subpoena' : 'summons'} for ${party.name}.`, enteredBy: by.name }); } catch (e) { console.warn(e); } }
  return { ...clean, _id: id };
}
/* Court staff issue a summons (or subpoena) from the Process page. The clerk signs it; the request then drops off the Process list and is logged with who issued it and when. */
export async function issueProcess(db, sr, account, role, { sig = null } = {}) {
  const sub = sr.kind === 'subpoena', now = new Date(), id = sr._id || sr.id;
  const values = sub ? sr.values : issueValues(sr.values, { name: account.name, date: now, days: sr.second ? SECOND_SUMMONS_DAYS : SUMMONS_DAYS });
  const issued = { by: account.name, byUid: account.uid, role: role || null, at: now.getTime(), signed: sig ? 'image' : 'slash' };
  // An issued summons goes straight to the process servers (status "Service requested"); nobody has to ask again.
  const patch = { values, issued, status: sub ? SR_STATUS.subissued : SR_STATUS.requested, ...(sub ? {} : { requestedAt: Date.now() }), sig: { png: sig || '', name: account.name, uid: account.uid, at: now.toISOString() } };
  await updateDoc(doc(db, 'serviceRequests', id), patch);
  Object.assign(sr, patch);
  // One docket entry, filed with the issued summons.
  await caseEvent(db, sr, { type: 'filing', svc: true, description: `${account.name} issued ${sub ? 'subpoena' : 'summons'} for ${sr.party.name}.`, docName: `${sub ? 'Subpoena' : 'Summons'} - ${sr.party.name}`, documentLink: sub ? null : linkOf(sr), filedBy: account.name, role: role || null, enteredBy: account.name, enteredByRole: role || null });
  return sr;
}
export async function assignServer(db, sr, server) {
  const p = { serverUid: server.uid, serverName: server.name, assignedAt: Date.now(), status: SR_STATUS.assigned };
  await updateDoc(doc(db, 'serviceRequests', sr._id || sr.id), p); return Object.assign(sr, p);
}
async function caseEvent(db, sr, ev, patchFn) {
  const r = doc(db, colFor(sr.court), sr.caseFirestoreId);
  await runTransaction(db, async tx => { const s = await tx.get(r); if (!s.exists()) return; const d = s.data(), p = { 'dates.lastUpdated': new Date().toISOString() }; if (ev) p.events = addEv(d.events, { judge: d.judge || null, ...ev }); if (patchFn) p.parties = mapParty(d, sr.party.name, patchFn); tx.update(r, p); });
}
/* May the defendant still sign the acknowledgment? MCR 2.302(B): within 72 hours of service. Before the proof is filed the service is still happening, so it is open. */
export const ackOpen = sr => !sr.ack && !(sr.proof?.filedAt && (sr.proof.result !== 'Served' || Date.now() > (sr.proof.servedAt || sr.proof.filedAt) + ACK_HOURS * 36e5));
/* The defendant signs the acknowledgment of service (they must be signed in). It is entered on the docket as a filing, and the response deadline is extended (MCR 2.302(B), (C)). */
export async function acknowledge(db, sr, account, { title = '' } = {}) {
  if (!ackOpen(sr)) throw new Error('The 72 hours to acknowledge service have passed.');
  const today = usDate(new Date()), ent = sr.formId !== 'mc01a', values = { ...sr.values, akd: today, akn: account.name, aks: '/s/ ' + account.name, ...(ent ? { akn2: account.name, akt: title } : {}) };
  const ack = { name: account.name, uid: account.uid, title: title || null, at: Date.now() };
  await updateDoc(doc(db, 'serviceRequests', sr._id || sr.id), { ack, values });
  const base = responseDays(sr.formId), ext = p => ({ ...p, acknowledged: true, acknowledgmentDate: new Date().toISOString().slice(0, 10), ...(p.serviceDate && !p.ackExtended ? { responseDue: addDays(p.serviceDate, extendedDays(p.responseDays || base)), responseDays: extendedDays(p.responseDays || base), ackExtended: true } : {}) });
  try { await caseEvent(db, sr, { type: 'filing', svc: true, description: `Acknowledgment of service filed by ${account.name}.`, docName: `Acknowledgment of Service - ${sr.party.name}`, documentLink: linkOf(sr), filedBy: account.name, enteredBy: account.name }, ext); } catch (e) { console.warn('Could not update the case', e); }
  return Object.assign(sr, { ack, values });
}
/* File the proof of service: the service request is closed out and the case shows who was served, how and when. */
export async function fileProof(db, sr, values, account, role) {
  const o = outcomeOf(values), served = o.result === 'Served', date = isoOf(o.date) || new Date().toISOString().slice(0, 10), who = values.pname || account.name, id = sr._id || sr.id;
  const t24 = (m => m ? `${String((+m[1] % 12) + (m[3] === 'PM' ? 12 : 0)).padStart(2, '0')}:${m[2]}` : '12:00')(/(\d{1,2}):(\d{2}) (AM|PM)/.exec(values.pt || values.st || values.mt || '')), servedAt = served ? (Date.parse(`${date}T${t24}:00`) || Date.now()) : null;
  const proof = { filedAt: Date.now(), filedBy: account.name, filedByUid: account.uid, filedByRole: role || null, result: o.result, method: o.method, date, ...(servedAt ? { servedAt } : {}) };
  await updateDoc(doc(db, 'serviceRequests', id), { values, proof, status: served ? SR_STATUS.served : SR_STATUS.notserved });
  const rec = { date, method: o.method, by: who, byUid: sr.serverUid || account.uid, address: sr.party.address || null };
  // Service could not be completed: the certificate of non-service (MC 01D) is filed for the server.
  let cert = null;
  if (!served) { try { cert = await fileCertificate(db, sr, values, account, who); } catch (e) { console.warn('Could not file the certificate of non-service', e); } }
  const desc = served ? `${sr.party.name} was served by ${who}. Proof of service filed.` : `${who} could not effectuate service on ${sr.party.name}.`;
  await caseEvent(db, sr, { type: 'event', svc: true, description: desc, enteredBy: account.name, enteredByRole: role || null},
    p => served ? { ...p, served: true, serviceDate: date, serviceMethod: o.method, servedBy: who, ...dueFor(sr, values, date, !!(p.acknowledged || sr.ack)), serviceAttempts: [...(p.serviceAttempts || []), { ...rec, result: 'Served' }] } : { ...p, serviceAttempts: [...(p.serviceAttempts || []), { ...rec, result: 'Not served' }] });
  if (cert) { try { await caseEvent(db, sr, { type: 'filing', svc: true, description: `Certificate of non-service filed by ${who}.`, docName: `Certificate of Non-Service - ${sr.party.name}`, documentLink: cert.url, filedBy: who, role: role || null, enteredBy: account.name, enteredByRole: role || null }); await updateDoc(doc(db, 'serviceRequests', id), { 'proof.certificate': cert }); } catch (e) { console.warn(e); } }
  try { await setDoc(doc(db, 'serviceReturns', 'SVC-' + id), { id: 'SVC-' + id, caseId: sr.caseId, caseFirestoreId: sr.caseFirestoreId, court: sr.court, parties: [sr.party.name], documents: 'Summons and complaint', result: o.result, ...rec, serviceRequestId: id }); } catch (e) { console.warn('Could not save the return', e); }
  return Object.assign(sr, { values, proof, status: served ? SR_STATUS.served : SR_STATUS.notserved });
}
/* The response is due 7 days after service (10 through MiBRIDGES); an acknowledgment adds 3 days (4 on a 10-day period). MCR 2.302(A), (B). */
const dueFor = (sr, values, date, acked) => { const base = responseDays(sr.formId, !!values.mchk), days = values.ackc || acked ? extendedDays(base) : base; return { responseDue: addDays(date, days), responseDays: days, ackExtended: days !== base }; };
export async function getRequest(db, id) { const s = await getDoc(doc(db, 'serviceRequests', id)); return s.exists() ? { ...s.data(), _id: s.id } : null; }

const VIEWER = 'https://migovt.org/courts/documents/#/';
/* Build the MC 01D from the proof, save it with the court's other filed documents, and return where it lives. */
async function fileCertificate(db, sr, values, account, who) {
  const def = (await import('./mc01d.js?v=5')).default, vals = certValues(sr, values, { name: who });
  const md = mdFromValues(def, vals), st = await import('https://www.gstatic.com/firebasejs/11.0.0/firebase-storage.js');
  const nm = `MC01D_${String(sr.party.name).replace(/[^A-Za-z0-9]+/g, '_')}.md`, path = `filingUploads/${sr.caseId}/${Date.now()}-${nm}`;
  await st.uploadBytes(st.ref(st.getStorage(), path), new Blob([md], { type: 'text/markdown' }), { contentType: 'text/markdown' });
  try { await setDoc(doc(db, 'docStamps', path.split('/').join('__')), { path, docId: `SVC-${sr._id || sr.id}`, label: 'FILED', date: usDate(new Date()), x: 0.7, y: 0.004, page: 1, filedByUid: account.uid, filedAt: Date.now(), filed: true }); } catch (e) { console.warn(e); }
  return { path, url: VIEWER + path.split('/').map(encodeURIComponent).join('/'), at: Date.now() };
}