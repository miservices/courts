/* The Firebase side of saved documents (used by drafts.js).
   Firestore  draftDocs/{id}              title, sharing, revision number, name of the current .md
   Storage    draftDocs/{id}/{file}.md    the document itself
   Firestore  accountDirectory/{uid}      name and email, so people can be found by name or email when sharing */
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, onSnapshot, query, where, runTransaction, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";
import { getStorage, ref, uploadString, getBytes, deleteObject } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-storage.js";

export function firebaseBackend({ db, app }) {
  const storage = getStorage(app), COL = 'draftDocs'; let pool = null, poolAt = 0;
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
    /* The person's favorite fonts follow them across devices (kept on their own directory entry). */
    async getFavs(uid) { try { const s = await getDoc(doc(db, 'accountDirectory', uid)); return s.exists() && Array.isArray(s.data().fontFavs) ? s.data().fontFavs : []; } catch (e) { console.warn('Favorites unavailable', e); return null; } },
    async setFavs(uid, list) { await setDoc(doc(db, 'accountDirectory', uid), { fontFavs: list }, { merge: true }); },
    /* Type-ahead: accounts whose name or email matches what was typed so far. The account list is read once and
       kept for a minute, so each keystroke is answered from memory. Only name, email, role and uid are used. */
    async search(text, limit = 8) {
      const q = String(text || '').trim().toLowerCase(); if (q.length < 1) return [];
      if (!pool || Date.now() - poolAt > 60000) {
        const m = new Map(), add = (id, d) => { const e = { uid: id, name: (d.name || '').trim(), email: (d.email || '').trim(), role: d.role || '' }; if (e.name || e.email) m.set(id, { ...(m.get(id) || {}), ...e }); };
        try { (await getDocs(collection(db, 'accounts'))).docs.forEach(d => add(d.id, d.data())); } catch (e) { console.warn('Accounts unavailable', e); }
        try { (await getDocs(collection(db, 'accountDirectory'))).docs.forEach(d => { if (!m.has(d.id)) add(d.id, d.data()); }); } catch (e) { console.warn('Directory unavailable', e); }
        pool = [...m.values()]; poolAt = Date.now();
      }
      const score = p => { const n = p.name.toLowerCase(), e = p.email.toLowerCase();
        if (n === q || e === q) return 0; if (n.startsWith(q)) return 1; if (n.split(/\s+/).some(w => w.startsWith(q))) return 2; if (e.startsWith(q)) return 3; if (n.includes(q)) return 4; if (e.includes(q)) return 5; return 9; };
      return pool.map(p => [score(p), p]).filter(x => x[0] < 9).sort((a, b) => a[0] - b[0] || a[1].name.localeCompare(b[1].name)).slice(0, limit).map(x => x[1]);
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