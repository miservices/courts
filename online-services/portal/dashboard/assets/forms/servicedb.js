/* Service of process: saving summons, service requests, acknowledgments and proofs of service (collection serviceRequests).
   Every case change is additive: a party gains service fields and the docket gains an entry. Nothing is removed. */
import { doc, getDoc, setDoc, updateDoc, runTransaction } from 'https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js';
import { outcomeOf, usDate, SR_STATUS, issueValues } from './service.js?v=2';

export const SERVICE_BASE = 'https://migovt.org/service/#/';
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
export async function newSummons(db, { court, caseId, caseFirestoreId, formId, party, values, complaint = [], by, status = 'sumreq', kind = 'summons', note = '' }) {
  const id = rid(), sr = { id, kind, court, caseId, caseFirestoreId: caseFirestoreId || caseId, formId: kind === 'summons' ? formId : null, party, values: values || {}, complaint, status: SR_STATUS[status], createdBy: by.name, createdByUid: by.uid, createdAt: Date.now(), requestedByUid: by.uid, serverUid: null, serverName: null, ...(note ? { note } : {}) };
  await setDoc(doc(db, 'serviceRequests', id), sr);
  const what = kind === 'subpoena' ? 'Subpoena' : 'Summons';
  if (status === 'sumreq' || status === 'subreq') { try { await caseEvent(db, sr, { type: 'service', description: `${what} requested for ${party.name} by ${by.name}.`, enteredBy: by.name }); } catch (e) { console.warn(e); } }
  return { ...sr, _id: id };
}
/* Court staff issue a summons (or subpoena) from the Process page. The clerk signs it; the request then drops off the Process list and is logged with who issued it and when. */
export async function issueProcess(db, sr, account, role, { sig = null } = {}) {
  const sub = sr.kind === 'subpoena', now = new Date(), id = sr._id || sr.id;
  const values = sub ? sr.values : issueValues(sr.values, { name: account.name, date: now });
  const issued = { by: account.name, byUid: account.uid, role: role || null, at: now.getTime(), signed: sig ? 'image' : 'slash' };
  const patch = { values, issued, status: sub ? SR_STATUS.subissued : SR_STATUS.issued, ...(sig ? { sig: { png: sig, name: account.name, uid: account.uid, at: now.toISOString() } } : { sig: { png: '', name: account.name, uid: account.uid, at: now.toISOString() } }) };
  await updateDoc(doc(db, 'serviceRequests', id), patch);
  await caseEvent(db, sr, { type: 'service', description: `${sub ? 'Subpoena' : 'Summons'} issued for ${sr.party.name} on ${usDate(now)}. Issued by ${account.name}${role ? ', ' + role : ''}.`, enteredBy: account.name, enteredByRole: role || null });
  return Object.assign(sr, patch);
}
export async function requestService(db, sr, by) {
  const p = { status: SR_STATUS.requested, requestedBy: by.name, requestedByUid: by.uid, requestedAt: Date.now() };
  await updateDoc(doc(db, 'serviceRequests', sr._id || sr.id), p); await caseEvent(db, sr, { type: 'service', description: `Service of process requested for ${sr.party.name} (${sr.values?.caseno || sr.caseId}). Requested by ${by.name}.` }); return Object.assign(sr, p);
}
export async function assignServer(db, sr, server) {
  const p = { serverUid: server.uid, serverName: server.name, assignedAt: Date.now(), status: SR_STATUS.assigned };
  await updateDoc(doc(db, 'serviceRequests', sr._id || sr.id), p); return Object.assign(sr, p);
}
async function caseEvent(db, sr, ev, patchFn) {
  const r = doc(db, colFor(sr.court), sr.caseFirestoreId);
  await runTransaction(db, async tx => { const s = await tx.get(r); if (!s.exists()) return; const d = s.data(), p = { events: addEv(d.events, { judge: d.judge || null, ...ev }), 'dates.lastUpdated': new Date().toISOString() }; if (patchFn) p.parties = mapParty(d, sr.party.name, patchFn); tx.update(r, p); });
}
/* The defendant signs the acknowledgment of service (they must be signed in). */
export async function acknowledge(db, sr, account, { title = '' } = {}) {
  const today = usDate(new Date()), ent = sr.formId !== 'mc01a', values = { ...sr.values, akd: today, akn: account.name, aks: '/s/ ' + account.name, ...(ent ? { akn2: account.name, akt: title } : {}) };
  const ack = { name: account.name, uid: account.uid, title: title || null, at: Date.now() };
  await updateDoc(doc(db, 'serviceRequests', sr._id || sr.id), { ack, values });
  try { await caseEvent(db, sr, { type: 'service', description: `${account.name} signed the acknowledgment of service for ${sr.party.name} on ${today}.`, enteredBy: account.name }, p => ({ ...p, acknowledged: true, acknowledgmentDate: new Date().toISOString().slice(0, 10) })); } catch (e) { console.warn('Could not update the case', e); }
  return Object.assign(sr, { ack, values });
}
/* File the proof of service: the service request is closed out and the case shows who was served, how and when. */
export async function fileProof(db, sr, values, account, role) {
  const o = outcomeOf(values), served = o.result === 'Served', date = isoOf(o.date) || new Date().toISOString().slice(0, 10), who = values.pname || account.name, id = sr._id || sr.id;
  const proof = { filedAt: Date.now(), filedBy: account.name, filedByUid: account.uid, filedByRole: role || null, result: o.result, method: o.method, date };
  await updateDoc(doc(db, 'serviceRequests', id), { values, proof, status: served ? SR_STATUS.served : SR_STATUS.notserved });
  const rec = { date, method: o.method, by: who, byUid: sr.serverUid || account.uid, address: sr.party.address || null };
  const desc = served ? `Proof of service: Summons and complaint served on ${sr.party.name} by ${o.method.toLowerCase()} on ${usDate(date)}, served by ${who}.` : `Attempted service of the summons and complaint on ${sr.party.name} was not completed (${who}).`;
  await caseEvent(db, sr, { type: 'service', description: desc, enteredBy: account.name, enteredByRole: role || null, comment: values.fee ? `Service fee assessed: $${String(values.fee).replace(/^\$/, '')}` : null },
    p => served ? { ...p, served: true, serviceDate: date, serviceMethod: o.method, servedBy: who, serviceAttempts: [...(p.serviceAttempts || []), { ...rec, result: 'Served' }] } : { ...p, serviceAttempts: [...(p.serviceAttempts || []), { ...rec, result: 'Not served' }] });
  try { await setDoc(doc(db, 'serviceReturns', 'SVC-' + id), { id: 'SVC-' + id, caseId: sr.caseId, caseFirestoreId: sr.caseFirestoreId, court: sr.court, parties: [sr.party.name], documents: 'Summons and complaint', result: o.result, ...rec, serviceRequestId: id }); } catch (e) { console.warn('Could not save the return', e); }
  return Object.assign(sr, { values, proof, status: served ? SR_STATUS.served : SR_STATUS.notserved });
}
export async function getRequest(db, id) { const s = await getDoc(doc(db, 'serviceRequests', id)); return s.exists() ? { ...s.data(), _id: s.id } : null; }
