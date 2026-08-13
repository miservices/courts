// data.js — pure helpers for shaping Firestore case/filing data into UI pieces.
// No Firebase or DOM boot logic lives here; every page module imports from this file.

export function fmtMoney(n) { return '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2 }); }
export function initials(n) { return (n || '').split(' ').filter(Boolean).map(w => w[0]).slice(0, 2).join(''); }
export function fmtDate(s) {
  if (!s) return '—';
  const d = new Date(s);
  return isNaN(d) ? s : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
export function loadingHtml() { return `<div class="loading-inline"><span class="spin-sm"></span>Loading from Firestore…</div>`; }

export function getCaseTitle(c) {
  const t = (c.caseType || '').toLowerCase();
  const p = c.parties || {};
  if (t === 'criminal' || t === 'traffic') {
    const def = p.primaryDefendant?.name;
    return def ? `State of Michigan v. ${def}` : 'State of Michigan v. Unknown';
  }
  if (t === 'civil') {
    const pl = p.primaryPlaintiff?.name, df = p.primaryDefendant?.name;
    if (pl && df) return `${pl} v. ${df}`;
    if (pl) return `Ex parte ${pl}`;
    if (df) return `In re ${df}`;
  }
  if (t === 'appellate' || t === 'appeal') {
    const ap = p.appellant?.name, apl = p.appellee?.name;
    if (ap && apl) return `${ap} v. ${apl}`;
    if (ap) return `Ex parte ${ap}`;
    const s = c.docketSummary?.split('.')[0]?.trim();
    return (s && s.length < 90) ? s : (c.caseId || 'Appellate Matter');
  }
  if (t === 'administrative') {
    const pet = p.primaryPetitioner?.name || p.petitioner?.name, res = p.respondent?.name;
    if (pet && res) return `${pet} v. ${res}`;
    if (pet) return `Ex parte ${pet}`;
    const s = c.docketSummary?.split('.')[0]?.trim();
    return (s && s.length < 90) ? s : (c.administrativeSubtype || 'Administrative Matter');
  }
  return c.caseId || 'Case Record';
}

export function getJudge(c) { return c.judge || (Array.isArray(c.judges) ? c.judges[0] : null) || '—'; }

export function getUserCases(cases, user) {
  const name = (user?.name || '').toLowerCase().trim();
  if (!name) return [];
  return (cases || []).filter(c => {
    const ps = JSON.stringify(c.parties || {}).toLowerCase();
    if (ps.includes(name)) return true;
    if (user?.uid && Array.isArray(c.relatedUserIds) && c.relatedUserIds.includes(user.uid)) return true;
    return false;
  });
}

export function getDocketCases(cases, user, isSc) {
  const courtFilter = isSc ? 'Michigan Supreme Court' : 'Genesee Co. District Court';
  const judgeName = (user?.name || '').toLowerCase().trim();
  return (cases || []).filter(c => {
    if (c.court !== courtFilter) return false;
    if (!judgeName) return false;
    const j = (c.judge || '').toLowerCase();
    const js = Array.isArray(c.judges) ? c.judges.map(x => x.toLowerCase()) : [];
    return j.includes(judgeName) || js.some(x => x.includes(judgeName));
  });
}

export function getCourtCases(cases, isSc) {
  const cf = isSc ? 'Michigan Supreme Court' : 'Genesee Co. District Court';
  return (cases || []).filter(c => c.court === cf);
}

export function getAllHearings(cases) {
  const out = [];
  (cases || []).forEach(c => (c.hearings || []).forEach(h => out.push({ ...h, _caseId: c.caseId, _caseTitle: getCaseTitle(c) })));
  return out.sort((a, b) => new Date(a.date) - new Date(b.date));
}

export function getAllFilings(cases) {
  const out = [];
  (cases || []).forEach(c => (c.filings || []).forEach(f => out.push({ ...f, _caseId: c.caseId, _caseFirestoreId: c._id })));
  return out.sort((a, b) => new Date(b.dateFiled) - new Date(a.dateFiled));
}

export function getAllFinancials(cases) {
  const out = [];
  (cases || []).forEach(c => (c.financialOrders || []).forEach(o => out.push({ ...o, _caseId: c.caseId })));
  return out;
}

export function statusPill(status) {
  const s = (status || '').toLowerCase().replace(/[-\s]/g, '');
  let cls = 'sp-active';
  if (s.includes('pretrial')) cls = 'sp-pretrial';
  else if (s.includes('pending')) cls = 'sp-pending';
  else if (s.includes('closed')) cls = 'sp-closed';
  else if (s.includes('dismissed')) cls = 'sp-dismissed';
  return `<span class="status-pill ${cls}">${status || '—'}</span>`;
}

export function typeBadge(type) {
  const t = (type || '').toLowerCase();
  let cls = 'badge-civil';
  if (t === 'criminal') cls = 'badge-criminal';
  else if (t === 'appellate' || t === 'appeal') cls = 'badge-appellate';
  else if (t === 'traffic') cls = 'badge-traffic';
  else if (t === 'administrative') cls = 'badge-administrative';
  return `<span class="badge ${cls}">${type || 'Case'}</span>`;
}

export function caseRowHtml(c) {
  const title = getCaseTitle(c), judge = getJudge(c), filed = fmtDate(c.dates?.filed);
  const now = new Date();
  const nextH = (c.hearings || []).filter(h => new Date(h.date) >= now).sort((a, b) => new Date(a.date) - new Date(b.date))[0];
  const nextStr = nextH ? fmtDate(nextH.date) : null;
  return `<a class="case-row" href="/courts/micourt/cases/${encodeURIComponent(c._id || c.caseId)}/">
    <div class="cr-left">
      <div class="cr-num">${c.caseId}</div>
      <div class="cr-title">${title}</div>
      <div class="cr-meta">${c.court || '—'} · Filed ${filed} · ${judge}</div>
    </div>
    <div class="cr-right">
      ${typeBadge(c.caseType)}
      ${statusPill(c.status)}
      ${nextStr ? `<span style="font-size:11px;color:var(--muted)">Next: ${nextStr}</span>` : ''}
    </div>
    <span class="cr-open-hint">Open case ›</span>
  </a>`;
}

export function hearingRowHtml(h) {
  if (!h.date) return '';
  const d = new Date(h.date), now = new Date();
  const month = d.toLocaleDateString('en-US', { month: 'short' });
  const day = d.getDate(), year = d.getFullYear();
  const isToday = d.toDateString() === now.toDateString();
  const isPast = d < now && !isToday;
  const cls = isToday ? 'hr-today' : isPast ? 'hr-past' : 'hr-upcoming';
  const label = isToday ? 'Today' : isPast ? 'Completed' : 'Upcoming';
  return `<div class="hearing-row">
    <div class="hr-date-box"><div class="hr-month">${month}</div><div class="hr-day">${day}</div><div class="hr-year">${year}</div></div>
    <div class="hr-info">
      <div class="hr-type">${h.type || 'Hearing'}</div>
      <div class="hr-case">${h._caseId || ''}${h._caseTitle ? ' · ' + h._caseTitle : ''}</div>
      <div class="hr-meta">${h.officer || h.court || '—'}${h.courtroom ? ' · ' + h.courtroom : ''}</div>
    </div>
    <span class="hr-pill ${cls}">${label}</span>
  </div>`;
}

export function filingRowHtml(f) {
  const st = (f.status || '').toLowerCase();
  let stCls = 'fs-pending', stLabel = 'Pending';
  if (st === 'accepted' || st === 'approved') { stCls = 'fs-accepted'; stLabel = 'Accepted'; }
  else if (st === 'rejected' || st === 'denied') { stCls = 'fs-rejected'; stLabel = 'Rejected'; }
  return `<div class="filing-row">
    <div class="filing-icon">📄</div>
    <div class="filing-info">
      <div class="filing-title">${f.title || f.documentType || 'Untitled Filing'}</div>
      <div class="filing-meta">Case ${f._caseId || '—'} · Filed by ${f.filedBy || '—'} · ${fmtDate(f.dateFiled)}${f.role ? ' · <em>' + f.role + '</em>' : ''}</div>
      ${f.notes ? `<div style="font-size:11.5px;color:var(--muted);margin-top:2px">${f.notes}</div>` : ''}
      <span class="filing-status ${stCls}">${stLabel}</span>
      ${f.documentLink ? `<a href="${f.documentLink}" target="_blank" style="font-size:11.5px;color:#1a4a7a;font-weight:700;text-decoration:none;margin-left:10px">View ↗</a>` : ''}
    </div>
  </div>`;
}

export function finRowHtml(o) {
  const paid = (o.payments || []).reduce((s, p) => s + (p.amount || 0), 0);
  const stl = (o.status || '').toLowerCase();
  let cls = 'fin-unpaid', stLabel = 'Unpaid';
  if (stl === 'paid') { cls = 'fin-paid'; stLabel = 'Paid'; }
  else if (paid > 0) { cls = 'fin-partial'; stLabel = 'Partial'; }
  return `<div class="fin-row">
    <div><div class="fin-type">${o.type || 'Financial Order'}</div><div class="fin-case">Case ${o._caseId || '—'}</div></div>
    <div style="text-align:right">
      <div class="fin-amount">${fmtMoney(o.amount)}</div>
      <span class="fin-status ${cls}">${stLabel}</span>
      ${paid > 0 && stl !== 'paid' ? `<div style="font-size:10.5px;color:var(--muted);margin-top:2px">${fmtMoney(paid)} paid</div>` : ''}
    </div>
  </div>`;
}

export function docketRowHtml(c) {
  const title = getCaseTitle(c);
  const now = new Date();
  const nextH = (c.hearings || []).filter(h => new Date(h.date) >= now).sort((a, b) => new Date(a.date) - new Date(b.date))[0];
  const nextStr = nextH ? `${fmtDate(nextH.date)}${nextH.courtroom ? ' · ' + nextH.courtroom : ''}` : '—';
  return `<tr onclick="window.location.href='/courts/micourt/cases/${encodeURIComponent(c._id || c.caseId)}/'">
    <td><span class="dt-case-num">${c.caseId}</span></td>
    <td style="font-weight:600">${title}</td>
    <td>${typeBadge(c.caseType)}</td>
    <td style="font-size:11.5px;font-weight:600;color:var(--navy)">${nextStr}</td>
    <td>${statusPill(c.status)}</td>
  </tr>`;
}

export function queueRowHtml(f) {
  const isNewCase = f.filingType === 'new';
  const caption = isNewCase ? `New ${f.caseType || 'case'}${f.court ? ' · ' + f.court : ''}` : `${f.caseId || 'Existing case'}${f.caseType ? ' · ' + f.caseType : ''}`;
  return `<div class="queue-row"><div class="queue-priority qp-med"></div><div class="queue-info"><div class="queue-title">${f.documentType || 'Filing'}${isNewCase ? ' <span style="color:var(--gold);font-weight:700">(New Case)</span>' : ''}</div><div class="queue-meta">From: ${f.filedBy || '—'}${f.isFilingAsCounsel ? ' (Attorney)' : ''} · Filed: ${fmtDate(f.dateFiled)} · ${caption}</div></div><a class="queue-action" href="/courts/micourt/filings/${encodeURIComponent(f._id)}/">Review →</a></div>`;
}

export function emptyCaseState() {
  return `<div class="empty-state">
    <div class="ei">📂</div>
    <h4>No Cases Found</h4>
    <p>No cases are currently linked to your account. If you need to initiate a new matter, you can file electronically.</p>
    <div class="empty-state-actions"><a href="/courts/micourt/dashboard/filings/new/" class="btn-primary">📤 File a New Case</a></div>
  </div>`;
}

export function emptyFilingsState(hasCases) {
  if (!hasCases) {
    return `<div class="empty-state">
      <div class="ei">📤</div><h4>No Filings Yet</h4>
      <p>You haven't submitted any documents electronically. Start by filing your case or a document with the court.</p>
      <div class="empty-state-actions"><a href="/courts/micourt/dashboard/filings/new/" class="btn-primary">📤 File a New Case</a></div>
    </div>`;
  }
  return `<div class="empty-state">
    <div class="ei">📤</div><h4>No Filings on Record</h4>
    <p>No electronic filings are associated with your cases yet.</p>
    <div class="empty-state-actions"><a href="/courts/micourt/dashboard/filings/new/" class="btn-primary">📤 File a Document</a></div>
  </div>`;
}

export function restrictedState({ title, message, linkHref, linkLabel, icon = '🔒' }) {
  return `<div class="empty-state">
    <div class="ei">${icon}</div><h4>${title}</h4><p>${message}</p>
    ${linkHref ? `<div class="empty-state-actions"><a href="${linkHref}" class="btn-primary">${linkLabel}</a></div>` : ''}
  </div>`;
}