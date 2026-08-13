import { fmtMoney, fmtDate, getUserCases, getDocketCases, getCourtCases, getAllHearings, getAllFilings, getAllFinancials, caseRowHtml, hearingRowHtml, finRowHtml, docketRowHtml, emptyCaseState } from '../data.js';
import { ROUTES } from '../sidebar.js';

const WELCOME_COPY = {
  'Portal User': 'View your cases, upcoming hearings, and manage your court obligations.',
  'Licensed Attorney': 'Manage your active matters, file documents, and track client cases.',
  'State Attorney': 'Review your assigned cases, manage your docket, and coordinate with the court.',
  'Clerk': 'Manage case records, filings, and the review queue.',
  'Magistrate Judge': 'Your docket is ready. Review assigned matters and upcoming proceedings.',
  'Judge': 'Your docket is ready. Review assigned matters and upcoming proceedings.',
  'Chief Judge': 'Court administration, your docket, and the filing queue.',
  'Clerk of the Supreme Court': 'Manage Supreme Court filings, petitions, and records.',
  'Assistant Clerk of the Supreme Court': 'Assist with Supreme Court filing and record management.',
  'Justice': 'Your Supreme Court docket and pending opinions.',
  'Chief Justice': 'Court leadership, opinion management, and full SC docket.',
};

export async function renderPage(store, mount) {
  const tier = store.tier;
  mount.setHeader({ title: 'Dashboard', subtitle: 'Your MiCOURT summary and quick actions.' });

  const isPublicish = ['public', 'attorney', 'state-atty'].includes(tier);
  const isClerk = ['clerk', 'sc-clerk', 'sc-asst-clerk'].includes(tier);
  const isJudge = ['magistrate', 'judge', 'chief-judge', 'justice', 'chief-justice'].includes(tier);

  let body = `
    <div class="welcome-banner">
      <div>
        <div class="wb-title">Welcome back, <em>${store.user?.name || '—'}</em></div>
        <div class="wb-sub">${WELCOME_COPY[store.role] || 'Welcome to MiCOURT.'}</div>
      </div>
      <div class="wb-right">
        <div class="wb-role-badge">${store.role}</div>
        <div class="wb-date">${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</div>
      </div>
    </div>`;

  if (isPublicish) {
    const myCases = getUserCases(store.cases, store.user);
    const activeCases = myCases.filter(c => !['Closed', 'Dismissed'].includes(c.status));
    const now = new Date();
    const upcoming = getAllHearings(myCases).filter(h => new Date(h.date) >= now);
    const allFin = getAllFinancials(myCases);
    const balance = allFin.reduce((s, o) => { const paid = (o.payments || []).reduce((ss, p) => ss + (p.amount || 0), 0); return s + Math.max(0, (o.amount || 0) - paid); }, 0);
    const allFilings = getAllFilings(myCases);

    body += `
      <div class="stat-row cols-4">
        <div class="stat-card gold"><span class="sc-icon">📋</span><span class="sc-label">Active Cases</span><span class="sc-value">${activeCases.length}</span><span class="sc-sub">${myCases.length} total</span></div>
        <div class="stat-card blue"><span class="sc-icon">📅</span><span class="sc-label">Upcoming Hearings</span><span class="sc-value">${upcoming.length}</span><span class="sc-sub">${upcoming[0] ? 'Next: ' + fmtDate(upcoming[0].date) : 'None scheduled'}</span></div>
        <div class="stat-card ${balance > 0 ? 'red' : 'green'}"><span class="sc-icon">💳</span><span class="sc-label">Balance Due</span><span class="sc-value">${fmtMoney(balance)}</span><span class="sc-sub">${allFin.length} order(s)</span></div>
        <div class="stat-card navy"><span class="sc-icon">📤</span><span class="sc-label">Filings</span><span class="sc-value">${allFilings.length}</span><span class="sc-sub">${allFilings[0] ? 'Last: ' + fmtDate(allFilings[0].dateFiled) : 'None submitted'}</span></div>
      </div>
      <div class="two-col">
        <div>
          <div class="card">
            <div class="card-hdr"><h3>${tier === 'attorney' ? 'Client Cases' : tier === 'state-atty' ? 'Case Docket' : 'My Cases'}</h3><a class="card-link" href="${ROUTES['cases-mine']}">View All →</a></div>
            <div class="card-body">${myCases.length ? myCases.slice(0, 6).map(caseRowHtml).join('') : emptyCaseState()}</div>
          </div>
        </div>
        <div>
          <div class="card">
            <div class="card-hdr"><h3>Quick Actions</h3></div>
            <div class="card-body-pad"><div class="qa-grid single">
              <a class="qa-btn" href="${ROUTES['filings-new']}"><span class="qa-icon">📤</span><span class="qa-label">File a Document</span><span class="qa-sub">Submit electronically</span></a>
            </div></div>
          </div>
          <div class="card">
            <div class="card-hdr"><h3>Upcoming Hearings</h3><a class="card-link" href="${ROUTES.hearings}">View All →</a></div>
            <div class="card-body">${upcoming.length ? upcoming.slice(0, 4).map(hearingRowHtml).join('') : `<div class="empty-state"><div class="ei">📅</div><h4>No Upcoming Hearings</h4><p>None currently scheduled.</p></div>`}</div>
          </div>
          ${balance > 0 ? `<div class="card"><div class="card-hdr"><h3>Fines &amp; Fees</h3><a class="card-link" href="${ROUTES.financials}">Pay →</a></div><div class="card-body">${allFin.slice(0, 3).map(finRowHtml).join('')}</div></div>` : ''}
        </div>
      </div>`;
  } else if (isClerk) {
    const cc = getCourtCases(store.cases, store.isSc);
    const now = new Date();
    const upH = getAllHearings(cc).filter(h => new Date(h.date) >= now);
    const pendingCount = (store.pendingFilings || []).filter(f => {
      const st = (f.status || '').toLowerCase();
      return f.court === store.court && !f.accepted && st !== 'accepted' && st !== 'rejected';
    }).length;
    body += `
      <div class="stat-row cols-4">
        <div class="stat-card gold"><span class="sc-icon">📋</span><span class="sc-label">Cases on Record</span><span class="sc-value">${cc.length}</span><span class="sc-sub">In this court</span></div>
        <div class="stat-card blue"><span class="sc-icon">⚖️</span><span class="sc-label">Active Cases</span><span class="sc-value">${cc.filter(c => !['Closed', 'Dismissed'].includes(c.status)).length}</span><span class="sc-sub">Open matters</span></div>
        <div class="stat-card ${pendingCount > 0 ? 'red' : 'green'}"><span class="sc-icon">🗂️</span><span class="sc-label">Pending Review</span><span class="sc-value">${pendingCount}</span><span class="sc-sub">Filings queue</span></div>
        <div class="stat-card navy"><span class="sc-icon">📅</span><span class="sc-label">Upcoming Hearings</span><span class="sc-value">${upH.length}</span><span class="sc-sub">Scheduled</span></div>
      </div>
      <div class="two-col">
        <div><div class="card">
          <div class="card-hdr"><h3>Recent Cases</h3><a class="card-link" href="${ROUTES.cases}">View All →</a></div>
          <div class="card-body">${cc.slice(0, 6).map(caseRowHtml).join('') || `<div class="empty-state"><div class="ei">📂</div><h4>No Cases</h4><p>No cases found for this court.</p></div>`}</div>
        </div></div>
        <div><div class="card">
          <div class="card-hdr"><h3>Quick Actions</h3></div>
          <div class="card-body-pad"><div class="qa-grid">
            <a class="qa-btn" href="${ROUTES.cases}"><span class="qa-icon">🔎</span><span class="qa-label">Search Cases</span><span class="qa-sub">All records</span></a>
            <a class="qa-btn" href="${ROUTES['filings-manage']}"><span class="qa-icon">🗂️</span><span class="qa-label">Manage Filings</span><span class="qa-sub">${pendingCount} pending</span></a>
            <a class="qa-btn" href="${ROUTES['case-management']}"><span class="qa-icon">🛠️</span><span class="qa-label">Case Management</span><span class="qa-sub">Court administration</span></a>
            <a class="qa-btn" href="/courts/micourt/administration/hearings/new/"><span class="qa-icon">📅</span><span class="qa-label">Schedule Hearing</span><span class="qa-sub">Add to calendar</span></a>
          </div></div>
        </div></div>
      </div>`;
  } else if (isJudge) {
    const docket = getDocketCases(store.cases, store.user, store.isSc);
    const now = new Date();
    const upH = getAllHearings(docket).filter(h => new Date(h.date) >= now);
    body += `
      <div class="stat-row cols-4">
        <div class="stat-card gold"><span class="sc-icon">⚖️</span><span class="sc-label">Cases on Docket</span><span class="sc-value">${docket.length}</span><span class="sc-sub">Assigned matters</span></div>
        <div class="stat-card blue"><span class="sc-icon">📅</span><span class="sc-label">Upcoming Hearings</span><span class="sc-value">${upH.length}</span><span class="sc-sub">${upH[0] ? 'Next: ' + fmtDate(upH[0].date) : 'None scheduled'}</span></div>
        <div class="stat-card navy"><span class="sc-icon">📜</span><span class="sc-label">Pending Decisions</span><span class="sc-value">${docket.filter(c => ['Pending', 'Pending Decision'].includes(c.status)).length}</span><span class="sc-sub">Awaiting opinion</span></div>
        <div class="stat-card green"><span class="sc-icon">✅</span><span class="sc-label">Closed Cases</span><span class="sc-value">${docket.filter(c => c.status === 'Closed').length}</span><span class="sc-sub">Disposed matters</span></div>
      </div>
      <div class="two-col">
        <div><div class="card">
          <div class="card-hdr"><h3>My Docket</h3><a class="card-link" href="${ROUTES.docket}">Full Docket →</a></div>
          <div class="card-body"><div style="overflow-x:auto"><table class="docket-table">
            <thead><tr><th>Case No.</th><th>Title</th><th>Type</th><th>Next Proceeding</th><th>Status</th></tr></thead>
            <tbody>${docket.length ? docket.slice(0, 6).map(docketRowHtml).join('') : '<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--muted)">No cases assigned to your name in Firestore</td></tr>'}</tbody>
          </table></div></div>
        </div></div>
        <div>
          <div class="card">
            <div class="card-hdr"><h3>Quick Actions</h3></div>
            <div class="card-body-pad"><div class="qa-grid">
              <a class="qa-btn" href="${ROUTES.cases}"><span class="qa-icon">🔎</span><span class="qa-label">All Cases</span><span class="qa-sub">Full court record</span></a>
              <a class="qa-btn" href="${ROUTES['case-management']}"><span class="qa-icon">🛠️</span><span class="qa-label">Case Management</span></a>
              <a class="qa-btn" href="/courts/micourt/administration/calendar/"><span class="qa-icon">📅</span><span class="qa-label">Court Calendar</span></a>
            </div></div>
          </div>
          <div class="card">
            <div class="card-hdr"><h3>Upcoming Proceedings</h3><a class="card-link" href="${ROUTES.docket}">View All →</a></div>
            <div class="card-body">${upH.length ? upH.slice(0, 4).map(hearingRowHtml).join('') : `<div class="empty-state"><div class="ei">📅</div><h4>No Upcoming Hearings</h4><p>None scheduled.</p></div>`}</div>
          </div>
        </div>
      </div>`;
  }

  mount.setBody(body);
}