/* Shared money rules for My financials and Manage Financials. Pure functions: no Firebase, no page code.
   An order lives in case.financialOrders[] and stays readable by older pages:
     amount        what is owed now (original assessment + every adjustment)
     payments[]    every money movement; payments, refunds and reversals are signed so a plain sum is the net paid
     adjustments[] late fees, interest, reductions, credits and corrections; signed
   Nothing is ever deleted. A mistake is reversed with an offsetting entry. */
export const LATE_RATE = 0.20, GRACE_DAYS = 5, JUDGMENT_RATE = 5, MIN_INSTALLMENT = 10, DAY = 864e5;
export const TYPES = ['Civil Infraction Fine', 'Court Fine', 'Court Fee', 'Filing Fee', 'Court Costs', 'Restitution', 'Money Judgment', 'Probation Fee', 'Other'];
export const METHODS = ['Credit or debit card', 'Bank account (ACH)'], COUNTER = ['Cash', 'Check', 'Money order', 'Credit or debit card', 'Bank account (ACH)'];
export const r2 = n => Math.round((Number(n) || 0) * 100) / 100;
export const money = n => { const v = r2(n); return (v < 0 ? '-' : '') + Math.abs(v).toLocaleString('en-US', { style: 'currency', currency: 'USD' }); };
export const parseDay = s => { if (!s) return null; if (s instanceof Date) return isNaN(s) ? null : s; const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s)); const d = m ? new Date(+m[1], +m[2] - 1, +m[3]) : new Date(s); return isNaN(d) ? null : d; };
const endOfDay = d => { const e = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999); return e; };
const addMonths = (d, n) => { const e = new Date(d); const day = e.getDate(); e.setDate(1); e.setMonth(e.getMonth() + n); e.setDate(Math.min(day, new Date(e.getFullYear(), e.getMonth() + 1, 0).getDate())); return e; };
export const typeKind = t => /judgment/i.test(t || '') ? 'judgment' : /restitution/i.test(t || '') ? 'restitution' : /fine|fee|cost/i.test(t || '') ? 'fine-fee' : 'other';
export const lateEligible = o => typeKind(o.type) === 'fine-fee';
export const rateOf = o => o.interest && o.interest.rate != null && o.interest.rate !== '' ? Number(o.interest.rate) : typeKind(o.type) === 'judgment' ? JUDGMENT_RATE : 0;
export const paidOf = o => r2((o.payments || []).reduce((t, p) => t + Number(p.amount || 0), 0));
export const adjOf = o => r2((o.adjustments || []).filter(a => !a.corrects).reduce((t, a) => t + Number(a.amount || 0), 0));   // fees, interest and changes; a correction to the assessed amount (corrects: true) changes the original instead
const correctsOf = o => r2((o.adjustments || []).filter(a => a.corrects).reduce((t, a) => t + Number(a.amount || 0), 0));
export const balanceOf = o => r2(Number(o.amount || 0) - paidOf(o));
export const idOf = (c, i) => (c.financialOrders || [])[i]?.id || `${c.caseId || c._id}#${i + 1}`;
const uid = p => p + '-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase();
export const newId = uid;
export const confirmation = () => 'CNF-' + Date.now().toString(36).toUpperCase().slice(-6) + Math.random().toString(36).slice(2, 6).toUpperCase();

// Give older orders the new fields without changing what they owe.
export function normalize(o, id) {
  const n = { ...o, id: o.id || id, payments: [...(o.payments || [])], adjustments: [...(o.adjustments || [])], garnishments: [...(o.garnishments || [])] };
  n.amount = r2(n.amount); n.originalAmount = r2(n.amount - adjOf(n));
  return n;
}
export const lateDeadline = o => { const d = parseDay(o.dueDate); return d ? new Date(endOfDay(d).getTime() + GRACE_DAYS * DAY) : null; };
const dateK = (s, start, k) => s.frequency === 'weekly' ? new Date(start.getTime() + 7 * k * DAY) : s.frequency === 'biweekly' ? new Date(start.getTime() + 14 * k * DAY) : addMonths(start, k);
export function planState(o, now = new Date()) {
  const s = o.schedule; if (!s || !['Active', 'Defaulted'].includes(s.status)) return null;
  const inst = Number(s.installment), start = parseDay(s.startDate); if (!(inst > 0) || !start) return null;
  const paid = Math.max(0, paidOf(o)), total = Number(o.amount || 0); let dueNow = 0, missed = null, next = null;
  for (let k = 0; k < 600; k++) {
    const d = dateK(s, start, k), cum = Math.min(total, inst * (k + 1));
    if (d <= now) { dueNow = Math.max(dueNow, cum - paid); if (!missed && paid < cum - 0.005 && now > new Date(endOfDay(d).getTime() + GRACE_DAYS * DAY)) missed = d; if (cum >= total) break; }
    else { next = d; break; }
  }
  return { pastDue: !!missed, missedSince: missed, dueNow: r2(Math.max(0, dueNow)), next, nextAmount: next ? r2(Math.min(inst, Math.max(0, total - paid))) : 0, installment: inst };
}
// Posts what has come due: a plan that fell more than 5 days behind is marked defaulted, the one-time 20% late fee, and monthly interest.
export function accrue(input, now = new Date()) {
  const o = normalize(input, input.id), posted = []; let changed = false;
  if (o.schedule?.status === 'Active') { const ps = planState(o, now); if (ps?.pastDue) { o.schedule = { ...o.schedule, status: 'Defaulted', defaultedAt: now.toISOString() }; posted.push({ kind: 'plan-default', amount: 0, reason: `Payment plan defaulted: the installment due ${ps.missedSince.toLocaleDateString('en-US')} was more than ${GRACE_DAYS} days late.` }); changed = true; } }
  const dl = lateDeadline(o), planOn = o.schedule?.status === 'Active';
  if (!o.lateFeeAt && lateEligible(o) && dl && now > dl && !planOn) {
    const paidBy = r2((o.payments || []).filter(p => { const d = parseDay(p.date); return d && d <= dl; }).reduce((t, p) => t + Number(p.amount || 0), 0)), basis = Math.max(0, r2(o.amount - paidBy));
    o.lateFeeAt = now.toISOString(); changed = true;
    if (basis > 0) { const fee = r2(basis * LATE_RATE); o.adjustments.push({ id: uid('ADJ'), kind: 'late-fee', amount: fee, date: dl.toISOString(), reason: `Late fee of ${LATE_RATE * 100}% added: not paid within ${GRACE_DAYS} days after the due date.`, by: 'System', auto: true }); o.amount = r2(o.amount + fee); posted.push({ kind: 'late-fee', amount: fee, reason: 'Late fee' }); }
  }
  const rate = rateOf(o);
  if (rate > 0) {
    let from = parseDay(o.interest?.lastAccrued || o.assessmentDate || o.dueDate); let guard = 0;
    while (from && addMonths(from, 1) <= now && guard++ < 120) {
      const to = addMonths(from, 1), net = r2((o.adjustments || []).filter(a => a.kind === 'interest' || a.reversesKind === 'interest').reduce((t, a) => t + a.amount, 0)), principal = Math.max(0, r2(o.amount - net - paidOf(o)));
      if (principal <= 0) { from = to; o.interest = { ...(o.interest || {}), rate, lastAccrued: to.toISOString() }; changed = true; continue; }
      const i = r2(principal * rate / 1200);
      if (i > 0) { o.adjustments.push({ id: uid('ADJ'), kind: 'interest', amount: i, date: to.toISOString(), reason: `Interest at ${rate}% per year on ${money(principal)}.`, by: 'System', auto: true }); o.amount = r2(o.amount + i); posted.push({ kind: 'interest', amount: i, reason: 'Interest' }); }
      from = to; o.interest = { ...(o.interest || {}), rate, lastAccrued: to.toISOString() }; changed = true;
    }
  }
  o.originalAmount = r2(o.amount - adjOf(o));
  return { order: o, posted, changed };
}
export const makePayment = (o, { amount, method, by, byUid, byRole, note, kind = 'payment', date, ...rest }) => ({ id: uid('PMT'), confirmation: confirmation(), kind, amount: r2(amount), date: (date || new Date()).toISOString?.() || date, method: method || null, by: by || null, byUid: byUid || null, byRole: byRole || null, note: note || null, ...rest });
export function statusOf(o, now = new Date()) {
  const bal = balanceOf(o), pills = [], dl = lateDeadline(o), due = parseDay(o.dueDate), gar = (o.garnishments || []).some(g => g.status === 'Active');
  if (bal < -0.004) pills.push(['warn', 'Credit balance']); else if (bal <= 0.004 && o.amount > 0) pills.push(['done', 'Paid in full']); else if (o.amount <= 0 && o.originalAmount > 0) pills.push(['plain', 'Waived']);
  if (bal > 0.004) {
    if (o.schedule?.status === 'Defaulted') pills.push(['bad', 'Plan defaulted']); else if (o.schedule?.status === 'Active') pills.push(['live', 'Payment plan']);
    if (due && endOfDay(due) < now && o.schedule?.status !== 'Active') pills.push(['bad', 'Past due']); else if (!o.schedule && due) pills.push(['live', 'Due ' + due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })]);
    if (o.planRequest?.status === 'Requested') pills.push(['mid', 'Plan requested']);
  }
  if (gar) pills.push(['warn', 'Garnishment']);
  return pills;
}
export const isOpen = o => balanceOf(o) > 0.004;
export const isPastDue = (o, now = new Date()) => { const d = parseDay(o.dueDate); return isOpen(o) && d && endOfDay(d) < now && o.schedule?.status !== 'Active'; };
const KIND = { payment: 'Payment', garnishment: 'Garnishment collected', refund: 'Refund', 'credit-in': 'Credit applied', 'credit-out': 'Credit transferred out', correction: 'Correction' }, AKIND = { 'late-fee': 'Late fee', interest: 'Interest', reduction: 'Reduction', increase: 'Increase', waiver: 'Waiver', credit: 'Credit', correction: 'Correction' };
export const kindLabel = p => KIND[p.kind || 'payment'] || 'Payment', adjLabel = a => AKIND[a.kind] || 'Adjustment';
// Everything that changed the balance, oldest first, with a running balance.
export function ledger(o) {
  const rows = [{ t: parseDay(o.assessmentDate)?.getTime() ?? 0, date: o.assessmentDate, label: 'Assessed', desc: o.description || o.type || 'Financial order', charge: r2(o.originalAmount - correctsOf(o)), credit: 0, by: o.assessedBy || null, ord: 0 }];
  (o.adjustments || []).forEach(a => rows.push({ t: new Date(a.date).getTime() || 0, date: a.date, label: adjLabel(a), desc: a.reason || '', charge: a.amount > 0 ? a.amount : 0, credit: a.amount < 0 ? -a.amount : 0, by: a.by, reversed: a.reversed, id: a.id, ord: 1, auto: a.auto }));
  (o.payments || []).forEach(p => rows.push({ t: new Date(p.date).getTime() || 0, date: p.date, label: kindLabel(p), desc: [p.method, p.confirmation, p.note].filter(Boolean).join(' · '), charge: p.amount < 0 ? -p.amount : 0, credit: p.amount > 0 ? p.amount : 0, by: p.by, reversed: p.reversed, id: p.id, ord: 2, pay: true }));
  rows.sort((a, b) => a.t - b.t || a.ord - b.ord); let run = 0; rows.forEach(r => { run = r2(run + r.charge - r.credit); r.balance = run; }); return rows;
}
export function caseParties(c) { if (Array.isArray(c.parties)) return c.parties.filter(x => x && x.name); const o = []; Object.values(c.parties || {}).forEach(v => Array.isArray(v) ? v.forEach(x => x && o.push(x)) : v && typeof v === 'object' && o.push(v)); return o.filter(x => x.name); }

// After any money movement: a paid-off order closes its payment plan and any garnishment.
export function settle(o) {
  if (balanceOf(o) <= 0.004) { if (o.schedule && ['Active', 'Defaulted'].includes(o.schedule.status)) o.schedule = { ...o.schedule, status: 'Completed', completedAt: new Date().toISOString() }; o.garnishments = (o.garnishments || []).map(g => g.status === 'Active' ? { ...g, status: 'Satisfied', endedAt: new Date().toISOString() } : g); }
  return o;
}