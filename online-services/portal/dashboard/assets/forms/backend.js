/* The Firebase side of saved documents (used by drafts.js).
   Firestore  draftDocs/{id}              title, sharing, revision number, name of the current .md
   Storage    draftDocs/{id}/{file}.md    the document itself
   Firestore  accountDirectory/{uid}      name and email, so people can be found by name or email when sharing */
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, onSnapshot, query, where, runTransaction, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";
import { getStorage, ref, uploadString, getBytes, deleteObject } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-storage.js";

export function firebaseBackend({ db, app }) {
  const storage = getStorage(app), COL = 'draftDocs';
  const path = (id, file) => `${COL}/${id}/${file}`;
  const data = s => s.exists() ? { id: s.id, ...s.data() } : null;
  return {
    async create(meta) { const r = doc(collection(db, COL)); await setDoc(r, { ...meta, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }); return r.id; },
    async get(id) { return data(await getDoc(doc(db, COL, id))); },
    subscribe(id, cb, err) { return onSnapshot(doc(db, COL, id), s => cb(data(s)), err); },
    async putFile(id, file, text) { await uploadString(ref(storage, path(id, file)), text, 'raw', { contentType: 'text/markdown' }); },
    async getFile(id, file) { return new TextDecoder().decode(await getBytes(ref(storage, path(id, file)), 4 * 1024 * 1024)); },
    async delFile(id, file) { await deleteObject(ref(storage, path(id, file))); },
    /* Saves only if nobody else saved since baseRev. */
    async commit(id, baseRev, patch) {
      const r = doc(db, COL, id);
      return runTransaction(db, async tx => {
        const s = await tx.get(r); if (!s.exists()) throw new Error('This document no longer exists.');
        const d = s.data(); if ((d.rev || 0) !== baseRev) return { ok: false, meta: { id, ...d } };
        tx.update(r, { ...patch, rev: baseRev + 1, updatedAt: serverTimestamp() });
        return { ok: true, rev: baseRev + 1, prevFile: d.file || null };
      });
    },
    async update(id, patch) { await updateDoc(doc(db, COL, id), patch); },
    list(uid, cb, err) { return onSnapshot(query(collection(db, COL), where('members', 'array-contains', uid)), s => cb(s.docs.map(d => ({ id: d.id, ...d.data() }))), err); },
    async remove(id) {
      const m = data(await getDoc(doc(db, COL, id)));
      if (m?.file) await deleteObject(ref(storage, path(id, m.file))).catch(() => { });
      await deleteDoc(doc(db, COL, id));
    },
    async registerSelf({ uid, name, email, role }) {
      if (!uid || !name) return;
      await setDoc(doc(db, 'accountDirectory', uid), { uid, name, nameLower: name.trim().toLowerCase(), email: email || '', emailLower: (email || '').trim().toLowerCase(), role: role || '' }, { merge: true });
    },
    /* Exact full name or exact email. */
    async find(text) {
      const q = text.trim(), key = q.toLowerCase(), byMail = key.includes('@'), out = new Map();
      const add = (id, d) => out.set(id, { uid: id, name: d.name || '', email: d.email || '', role: d.role || '' });
      try { (await getDocs(query(collection(db, 'accountDirectory'), where(byMail ? 'emailLower' : 'nameLower', '==', key)))).docs.forEach(d => add(d.id, d.data())); } catch (e) { console.warn('Directory unavailable', e); }
      if (!out.size) { try { (await getDocs(query(collection(db, 'accounts'), where(byMail ? 'email' : 'name', '==', byMail ? key : q)))).docs.forEach(d => add(d.id, d.data())); } catch (e) { console.warn('Accounts unavailable', e); } }
      return [...out.values()];
    }
  };
}