/* Saving, sharing and live co-editing for drafted forms.
   This file is plain logic. A "backend" object does the talking to Firebase (see backend.js), so the same code can be tested without it.

   How a document lives:
   - The document itself is one small Markdown file in Cloud Storage (draftDocs/{id}/{file}.md).
   - Firestore keeps a tiny record per document: title, who it is shared with, a revision number, and the name of the current .md.
   - A save uploads a NEW file, then bumps the revision in a transaction only if nobody else saved first. The loser merges and tries again,
     so two people saving at once never overwrite each other.
   - Everyone watching the record sees the revision change, downloads the new .md and merges it into what they have on screen. */

const isObj = v => v && typeof v === 'object' && !Array.isArray(v);
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/* ---------- three-way merge ---------- */
function edit(base, v) {   // the one contiguous change that turns base into v
  const max = Math.min(base.length, v.length); let p = 0, s = 0;
  while (p < max && base[p] === v[p]) p++;
  while (s < max - p && base[base.length - 1 - s] === v[v.length - 1 - s]) s++;
  return { start: p, end: base.length - s, text: v.slice(p, v.length - s) };
}
export function mergeText(base, mine, theirs) {
  const a = edit(base, mine), b = edit(base, theirs);
  const overlap = (a.start < b.end && b.start < a.end) || (a.start === a.end && b.start === b.end && a.start === b.start);
  if (overlap) return { text: mine, conflict: true };
  const [x, y] = a.start <= b.start ? [a, b] : [b, a];
  return { text: base.slice(0, x.start) + x.text + base.slice(x.end, y.start) + y.text + base.slice(y.end), conflict: false };
}
export function merge3(base, mine, theirs, path = '', conflicts = []) {
  if (eq(mine, theirs)) return mine;
  if (eq(base, mine)) return theirs;       // only they changed it
  if (eq(base, theirs)) return mine;       // only I changed it
  if (typeof base === 'string' && typeof mine === 'string' && typeof theirs === 'string') {
    const r = mergeText(base, mine, theirs); if (r.conflict) conflicts.push(path); return r.text;
  }
  if (isObj(mine) && isObj(theirs)) {
    const b = isObj(base) ? base : {}, out = {};
    new Set([...Object.keys(mine), ...Object.keys(theirs)]).forEach(k => { const v = merge3(b[k], mine[k], theirs[k], path + '.' + k, conflicts); if (v !== undefined) out[k] = v; });
    return out;
  }
  if (Array.isArray(mine) && Array.isArray(theirs)) {
    const b = Array.isArray(base) ? base : [], out = [];
    for (let i = 0; i < Math.max(mine.length, theirs.length); i++) { const v = merge3(b[i], mine[i], theirs[i], path + '[' + i + ']', conflicts); if (v !== undefined) out.push(v); }
    return out;
  }
  conflicts.push(path); return mine;       // both changed the same thing: keep mine, say so
}
export function mergeStates(base, mine, theirs) { const conflicts = []; return { state: merge3(base || {}, mine, theirs, '', conflicts), conflicts }; }

/* ---------- who may do what ---------- */
export const roleIn = (meta, uid) => !meta ? null : meta.ownerUid === uid ? 'owner' : meta.roles?.[uid] || null;
export function accessOf(meta, uid) {
  const r = roleIn(meta, uid);
  if (r === 'owner' || r === 'edit') return 'edit';
  if (r === 'view') return meta.linkAccess === 'edit' ? 'edit' : 'view';
  return meta.linkAccess === 'edit' ? 'edit' : meta.linkAccess === 'view' ? 'view' : null;
}

const rand = () => Math.random().toString(36).slice(2, 8);
export const newClientId = () => Date.now().toString(36) + '-' + rand();

/* ---------- one open document ---------- */
export class DraftSession {
  /* adapter: { getMd(), stateFromMd(md), curState(), applyState(state), setPeople(list) }  (the form editor) */
  constructor({ backend, adapter, uid, name, formId, title, docId = null, meta = null, clientId = newClientId(), debounce = 1200, maxWait = 6000, heartbeat = 30000, onStatus = () => { }, onMeta = () => { }, onConflict = () => { }, onCreated = () => { } }) {
    Object.assign(this, { backend, adapter, uid, name, formId, title, docId, meta, clientId, debounce, maxWait, heartbeatMs: heartbeat, onStatus, onMeta, onConflict, onCreated });
    this.baseRev = meta?.rev || 0; this.baseMd = null; this.saving = false; this.again = false; this.pulling = false; this.dirtyAt = 0; this.timer = null; this.retry = null; this.closed = false; this.unsub = null; this.hb = null;
    this.canEdit = docId ? accessOf(meta, uid) === 'edit' : true;
  }
  /* Call once the editor is showing the loaded document. fresh = a brand-new document (no file yet). */
  attach({ save = false } = {}) {
    this.baseMd = this.docId && this.meta?.file ? this.adapter.getMd() : (save ? null : this.adapter.getMd());
    if (this.docId) this._subscribe();
    if (save) this.touch(); else this.onStatus(this.docId ? 'All changes saved' : 'Not saved yet. Your changes save automatically.', this.docId ? 'ok' : '');
  }
  isDirty() { return this.canEdit && this.adapter.getMd() !== this.baseMd; }
  hasPending() { return !!this.timer || this.saving || this.again; }

  touch() {
    if (this.closed || !this.canEdit) return;
    const now = Date.now(); if (!this.dirtyAt) this.dirtyAt = now;
    clearTimeout(this.timer); clearTimeout(this.retry);
    this.timer = setTimeout(() => { this.timer = null; this.save(); }, Math.max(0, Math.min(this.debounce, this.maxWait - (now - this.dirtyAt))));
    this.onStatus('Unsaved changes…', 'busy');
  }

  async save(force = false) {
    if (this.closed || !this.canEdit) return;
    if (this.saving) { this.again = true; return; }
    clearTimeout(this.timer); this.timer = null; this.saving = true; this.onStatus('Saving…', 'busy');
    try {
      for (let attempt = 0; attempt < 5; attempt++) {
        const md = this.adapter.getMd();
        if (md === this.baseMd && !(force && !this.docId)) { this.dirtyAt = 0; this.onStatus('All changes saved', 'ok'); break; }
        if (!this.docId) await this._create();
        const file = Date.now().toString(36) + '-' + rand() + '.md';
        await this.backend.putFile(this.docId, file, md);
        const r = await this.backend.commit(this.docId, this.baseRev, { file, updatedBy: this.uid, updatedByName: this.name, updatedClient: this.clientId, size: md.length, title: this.title });
        if (r.ok) {
          this.baseRev = r.rev; this.baseMd = md; this.dirtyAt = 0; this.meta = { ...(this.meta || {}), file, rev: r.rev, title: this.title };
          if (r.prevFile && r.prevFile !== file) this.backend.delFile(this.docId, r.prevFile).catch(() => { });
          this.onStatus('All changes saved', 'ok'); break;
        }
        await this.backend.delFile(this.docId, file).catch(() => { });   // somebody saved first: drop ours, merge theirs, go again
        await this._pull(r.meta);
        if (attempt === 4) throw new Error('busy');
      }
    } catch (e) {
      console.error(e); this.onStatus('Could not save. Trying again…', 'bad');
      if (!this.closed) { clearTimeout(this.retry); this.retry = setTimeout(() => this.save(), 5000); }
    } finally {
      this.saving = false;
      if (this.again) { this.again = false; this.touch(); } else this._maybePull();
    }
  }

  async _create() {
    const m = { formId: this.formId, title: this.title, ownerUid: this.uid, ownerName: this.name, members: [this.uid], roles: { [this.uid]: 'edit' }, names: { [this.uid]: this.name }, linkAccess: 'none', rev: 0, file: null };
    this.docId = await this.backend.create(m); this.meta = { id: this.docId, ...m }; this.baseRev = 0; this._subscribe(); this.onCreated(this.docId, this.meta);
  }

  /* bring in the newest saved version and merge it with what is on screen */
  async _pull(meta) {
    meta = meta || await this.backend.get(this.docId);
    if (!meta || (meta.rev || 0) <= this.baseRev || !meta.file) return false;
    const md = await this.backend.getFile(this.docId, meta.file);
    const theirs = this.adapter.stateFromMd(md), base = this.baseMd ? this.adapter.stateFromMd(this.baseMd) : {}, mine = this.adapter.curState();
    const { state, conflicts } = mergeStates(base, mine, theirs);
    this.adapter.applyState(state);
    this.baseRev = meta.rev; this.baseMd = eq(state, theirs) ? this.adapter.getMd() : md; this.meta = { ...this.meta, ...meta };
    if (conflicts.length) this.onConflict(conflicts, meta.updatedByName || 'Someone');
    return true;
  }
  _maybePull() {
    const m = this.meta; if (this.closed || !this.docId || this.pulling || this.saving || !m || m.updatedClient === this.clientId || (m.rev || 0) <= this.baseRev) return;
    this.pulling = true;
    this._pull(m).then(got => { if (got) { this.onStatus('Updated with ' + (m.updatedByName || 'a collaborator') + '’s changes', 'ok'); if (this.isDirty()) this.touch(); } })
      .catch(e => { console.error(e); this.onStatus('Could not load the latest changes. Trying again…', 'bad'); setTimeout(() => this._maybePull(), 4000); })
      .finally(() => { this.pulling = false; if (this.meta && (this.meta.rev || 0) > this.baseRev && this.meta.updatedClient !== this.clientId) setTimeout(() => this._maybePull(), 50); });
  }

  _subscribe() {
    if (this.unsub || !this.docId) return;
    this.unsub = this.backend.subscribe(this.docId, meta => {
      if (!meta) { this.onStatus('This document was deleted.', 'bad'); this.onMeta(null); return; }
      this.meta = { ...this.meta, ...meta }; this.onMeta(this.meta);
      const now = Date.now(), here = Object.entries(meta.presence || {}).filter(([u, p]) => u !== this.uid && now - (p.t || 0) < 75000).map(([u, p]) => ({ uid: u, name: p.name || 'Someone' }));
      this.adapter.setPeople(here); this._maybePull();
    }, e => { console.error(e); this.onStatus('Lost the connection to this document.', 'bad'); });
    this._beat(); this.hb = setInterval(() => this._beat(), this.heartbeatMs);
  }
  _beat() { if (this.closed || !this.docId || !this.canEdit || (typeof document !== 'undefined' && document.hidden)) return; this.backend.update(this.docId, { ['presence.' + this.uid]: { name: this.name, t: Date.now(), c: this.clientId } }).catch(() => { }); }

  setTitle(t) { this.title = t; if (this.docId && this.canEdit) this.backend.update(this.docId, { title: t }).catch(() => { }); }
  async flush() { clearTimeout(this.timer); this.timer = null; if (!this.canEdit) return; while (this.saving) await new Promise(r => setTimeout(r, 30)); if (this.isDirty()) await this.save(); }
  close() { this.closed = true; clearTimeout(this.timer); clearTimeout(this.retry); clearInterval(this.hb); this.unsub?.(); this.unsub = null; }

  /* ---- sharing (owner only; the Firestore rules enforce it too) ---- */
  async _share(fn) {
    if (!this.docId || this.meta?.ownerUid !== this.uid) throw new Error('Only the owner can change sharing.');
    const m = this.meta, patch = fn({ members: [...(m.members || [])], roles: { ...(m.roles || {}) }, names: { ...(m.names || {}) } }, m);
    await this.backend.update(this.docId, patch); this.meta = { ...m, ...patch }; this.onMeta(this.meta);
  }
  setLinkAccess(mode) { return this._share(() => ({ linkAccess: mode })); }
  addMember(uid, name, role) { return this._share(s => { if (!s.members.includes(uid)) s.members.push(uid); s.roles[uid] = role; s.names[uid] = name; return s; }); }
  setRole(uid, role) { return this._share(s => { s.roles[uid] = role; return s; }); }
  removeMember(uid) { return this._share(s => { s.members = s.members.filter(x => x !== uid); delete s.roles[uid]; delete s.names[uid]; return s; }); }
}