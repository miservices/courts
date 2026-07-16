import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import { getAuth, onAuthStateChanged, setPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";
import { getFirestore, doc, getDoc, getDocs, collection, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

const cfg = {
  apiKey:"AIzaSyA8sUFIq81cs6uQvqduardpGJ4R2DxO8NQ",
  authDomain:"micourt-dada6.firebaseapp.com",
  projectId:"micourt-dada6",
  storageBucket:"micourt-dada6.firebasestorage.app",
  messagingSenderId:"1013564619997",
  appId:"1:1013564619997:web:8f259dab457915758f6f34"
};

const app  = getApps().length ? getApp() : initializeApp(cfg);
const auth = getAuth(app);
const db   = getFirestore(app);
window._micourtAuth = auth;

// ── Every real page this dashboard has. One URL per page — no more client-side page-switching. ──
const BASE = '/courts/micourt/dashboard';
const ROUTES = {
  overview:   BASE + '/',
  cases:      BASE + '/my-cases/',
  hearings:   BASE + '/hearings/',
  filings:    BASE + '/filings/',
  financials: BASE + '/financials/',
  docket:     BASE + '/docket/',
  'all-cases':BASE + '/all-cases/',
  admin:      BASE + '/admin/',
  opinions:   BASE + '/opinions/',
  settings:   BASE + '/settings/',
};
const PAGE_TITLES = {
  overview:'Dashboard', cases:'My Cases', hearings:'Hearings', filings:'Electronic Filing',
  financials:'Fines & Fees', docket:'My Docket', 'all-cases':'All Cases', admin:'Administrative Tools',
  opinions:'Opinions & Orders', settings:'Account Settings',
};

const PAGE_ID = window.PAGE_ID || 'overview';

const CURRENT_USER = { name:'—', email:'—', pin:'—', role:'Portal User', barNumber:null, uid:null };
let ALL_CASES = [];
let CASES_LOADED = false;
let ALL_PENDING_FILINGS = [];
let currentRole  = 'Portal User';
let currentCourt = 'Genesee Co. District Court';

// Tiers whose "All Cases" page also shows a pending-review queue (this replaces the old separate Queue page).
const QUEUE_TIERS = ['clerk','sc-clerk','sc-asst-clerk','chief-judge'];
// Tiers whose docket page also lists upcoming proceedings inline (replaces a separate Hearings page).
const DOCKET_HEARING_TIERS = ['magistrate','judge','chief-judge','justice','chief-justice'];

// ── Admin tool definitions ──
const ADMIN_TOOLS_DISTRICT = [
  { icon:'📋', title:'Case Management',      sub:'Open, assign, close, and merge cases.',          href:'/courts/micourt/administration/cases/' },
  { icon:'📅', title:'Schedule Hearing',     sub:'Add or modify court proceedings.',               href:'/courts/micourt/administration/hearings/' },
  { icon:'👨‍⚖️', title:'Judicial Assignments', sub:'Assign judges and magistrates to cases.',       href:'/courts/micourt/administration/assignments/' },
  { icon:'📄', title:'Manage Filings',       sub:'Review, accept, or reject submitted documents.', href:'/courts/micourt/administration/filings/' },
  { icon:'💳', title:'Financial Orders',     sub:'Issue, modify, or waive fines and fees.',        href:'/courts/micourt/administration/financials/' },
  { icon:'📬', title:'Notices & Service',    sub:'Issue summons, subpoenas, and notices.',         href:'/courts/micourt/administration/notices/' },
  { icon:'🏛️', title:'Courtroom Calendar',   sub:'View and manage all courtroom schedules.',       href:'/courts/micourt/administration/calendar/' },
  { icon:'📊', title:'Court Reports',        sub:'Generate statistical and docket reports.',       href:'/courts/micourt/administration/reports/' },
  { icon:'🔎', title:'Search All Records',   sub:'Full access to the court record system.',        href:'/courts/micourt/administration/records/' },
];
const ADMIN_TOOLS_SC = [
  { icon:'📜', title:'Opinion Management',    sub:'Draft, circulate, and publish SC opinions.',    href:'/courts/micourt/administration/opinions/' },
  { icon:'📋', title:'Petition Review',       sub:'Review petitions for leave to appeal.',         href:'/courts/micourt/administration/petitions/' },
  { icon:'📅', title:'Oral Argument Schedule',sub:'Schedule and manage oral arguments.',           href:'/courts/micourt/administration/oral-arguments/' },
  { icon:'📊', title:'SC Reports',            sub:'Supreme Court statistics and docket reports.',  href:'/courts/micourt/administration/sc-reports/' },
  { icon:'🏛️', title:'Justice Assignments',   sub:'Assign justices to matters.',                   href:'/courts/micourt/administration/justice-assignments/' },
  { icon:'📁', title:'Record Requests',       sub:'Manage FOIA and public records requests.',      href:'/courts/micourt/administration/record-requests/' },
];

const ROLE_META = {
  'Portal User':                          { tier:'public',        court:'Genesee Co. District Court', sc:false },
  'Licensed Attorney':                    { tier:'attorney',      court:'Genesee Co. District Court', sc:false },
  'State Attorney':                       { tier:'state-atty',    court:'Genesee Co. District Court', sc:false },
  'Clerk':                                { tier:'clerk',         court:'Genesee Co. District Court', sc:false },
  'Magistrate Judge':                     { tier:'magistrate',    court:'Genesee Co. District Court', sc:false },
  'Judge':                                { tier:'judge',         court:'Genesee Co. District Court', sc:false },
  'Chief Judge':                          { tier:'chief-judge',   court:'Genesee Co. District Court', sc:false },
  'Clerk of the Supreme Court':           { tier:'sc-clerk',      court:'Michigan Supreme Court',     sc:true  },
  'Assistant Clerk of the Supreme Court': { tier:'sc-asst-clerk', court:'Michigan Supreme Court',     sc:true  },
  'Justice':                              { tier:'justice',       court:'Michigan Supreme Court',     sc:true  },
  'Chief Justice':                        { tier:'chief-justice', court:'Michigan Supreme Court',     sc:true  },
};

// Nav is deliberately short per role. Case list + pending review, and docket + hearings, are
// combined onto single pages instead of splitting them across separate sidebar entries.
const NAV_CONFIG = {
  public: [
    { section:'main', items:[
      { id:'overview',   icon:'🏠', label:'Overview' },
      { id:'cases',      icon:'📋', label:'My Cases' },
      { id:'hearings',   icon:'📅', label:'Hearings' },
      { id:'filings',    icon:'📤', label:'Electronic Filing' },
      { id:'financials', icon:'💳', label:'Fines & Fees' },
    ]},
    { section:'account', items:[{ id:'settings', icon:'⚙️', label:'Account Settings' }]},
  ],
  attorney: [
    { section:'main', items:[
      { id:'overview',   icon:'🏠', label:'Overview' },
      { id:'cases',      icon:'📋', label:'Client Cases' },
      { id:'hearings',   icon:'📅', label:'Hearings' },
      { id:'filings',    icon:'📤', label:'Electronic Filing' },
      { id:'financials', icon:'💳', label:'Financials' },
    ]},
    { section:'account', items:[{ id:'settings', icon:'⚙️', label:'Account Settings' }]},
  ],
  'state-atty': [
    { section:'main', items:[
      { id:'overview', icon:'🏠', label:'Overview' },
      { id:'cases',    icon:'📋', label:'Case Docket' },
      { id:'hearings', icon:'📅', label:'Hearings' },
      { id:'filings',  icon:'📤', label:'Electronic Filing' },
    ]},
    { section:'account', items:[{ id:'settings', icon:'⚙️', label:'Settings' }]},
  ],
  clerk: [
    { section:'main', items:[
      { id:'overview',  icon:'🏠', label:'Overview' },
      { id:'all-cases', icon:'🔎', label:'All Cases' },
      { id:'filings',   icon:'📤', label:'Electronic Filing' },
    ]},
    { section:'tools', items:[{ id:'admin', icon:'🛠️', label:'Admin Tools' }]},
    { section:'account', items:[{ id:'settings', icon:'⚙️', label:'Settings' }]},
  ],
  magistrate: [
    { section:'main', items:[
      { id:'overview',  icon:'🏠', label:'Overview' },
      { id:'docket',    icon:'⚖️', label:'My Docket' },
      { id:'all-cases', icon:'🔎', label:'All Cases' },
      { id:'filings',   icon:'📤', label:'Electronic Filing' },
    ]},
    { section:'tools', items:[{ id:'admin', icon:'🛠️', label:'Admin Tools' }]},
    { section:'account', items:[{ id:'settings', icon:'⚙️', label:'Settings' }]},
  ],
  judge: [
    { section:'main', items:[
      { id:'overview',  icon:'🏠', label:'Overview' },
      { id:'docket',    icon:'⚖️', label:'My Docket' },
      { id:'all-cases', icon:'🔎', label:'All Cases' },
      { id:'filings',   icon:'📤', label:'Electronic Filing' },
    ]},
    { section:'tools', items:[{ id:'admin', icon:'🛠️', label:'Admin Tools' }]},
    { section:'account', items:[{ id:'settings', icon:'⚙️', label:'Settings' }]},
  ],
  'chief-judge': [
    { section:'main', items:[
      { id:'overview',  icon:'🏠', label:'Overview' },
      { id:'docket',    icon:'⚖️', label:'My Docket' },
      { id:'all-cases', icon:'🔎', label:'All Cases' },
      { id:'filings',   icon:'📤', label:'Electronic Filing' },
    ]},
    { section:'tools', items:[{ id:'admin', icon:'🛠️', label:'Admin Tools' }]},
    { section:'account', items:[{ id:'settings', icon:'⚙️', label:'Settings' }]},
  ],
  'sc-clerk': [
    { section:'main', items:[
      { id:'overview',  icon:'🏠', label:'Overview' },
      { id:'all-cases', icon:'🔎', label:'All SC Cases' },
      { id:'filings',   icon:'📤', label:'Electronic Filing' },
    ]},
    { section:'tools', items:[{ id:'admin', icon:'🛠️', label:'Admin Tools' }]},
    { section:'account', items:[{ id:'settings', icon:'⚙️', label:'Settings' }]},
  ],
  'sc-asst-clerk': [
    { section:'main', items:[
      { id:'overview',  icon:'🏠', label:'Overview' },
      { id:'all-cases', icon:'🔎', label:'All SC Cases' },
      { id:'filings',   icon:'📤', label:'Electronic Filing' },
    ]},
    { section:'account', items:[{ id:'settings', icon:'⚙️', label:'Settings' }]},
  ],
  justice: [
    { section:'main', items:[
      { id:'overview',  icon:'🏠', label:'Overview' },
      { id:'docket',    icon:'⚖️', label:'My Docket' },
      { id:'opinions',  icon:'📜', label:'Opinions & Orders' },
      { id:'all-cases', icon:'🔎', label:'All SC Cases' },
    ]},
    { section:'tools', items:[{ id:'admin', icon:'🛠️', label:'Admin Tools' }]},
    { section:'account', items:[{ id:'settings', icon:'⚙️', label:'Settings' }]},
  ],
  'chief-justice': [
    { section:'main', items:[
      { id:'overview',  icon:'🏠', label:'Overview' },
      { id:'docket',    icon:'⚖️', label:'My Docket' },
      { id:'opinions',  icon:'📜', label:'Opinions & Orders' },
      { id:'all-cases', icon:'🔎', label:'All SC Cases' },
    ]},
    { section:'tools', items:[{ id:'admin', icon:'🛠️', label:'Admin Tools' }]},
    { section:'account', items:[{ id:'settings', icon:'⚙️', label:'Settings' }]},
  ],
};

// ── Helpers ──
function getTier(r) { return (ROLE_META[r]||ROLE_META['Portal User']).tier; }
function isScRole(r) { return !!(ROLE_META[r]||{}).sc; }
function isStaffTier(t) { return !['public','attorney','state-atty'].includes(t); }
function fmtMoney(n) { return '$'+Number(n||0).toLocaleString('en-US',{minimumFractionDigits:2}); }
function initials(n) { return (n||'').split(' ').filter(Boolean).map(w=>w[0]).slice(0,2).join(''); }
function fmtDate(s) {
  if (!s) return '—';
  const d = new Date(s);
  return isNaN(d)?s:d.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
}
function loadingHtml() {
  return `<div class="loading-inline"><span class="spin-sm"></span>Loading from Firestore…</div>`;
}
function el(id) { return document.getElementById(id); }

// ── Case title derivation (matches Firestore schema) ──
function getCaseTitle(c) {
  const t = (c.caseType||'').toLowerCase();
  const p = c.parties||{};
  if (t==='criminal'||t==='traffic') {
    const def = p.primaryDefendant?.name;
    return def ? `State of Michigan v. ${def}` : 'State of Michigan v. Unknown';
  }
  if (t==='civil') {
    const pl=p.primaryPlaintiff?.name, df=p.primaryDefendant?.name;
    if (pl&&df) return `${pl} v. ${df}`;
    if (pl) return `Ex parte ${pl}`;
    if (df) return `In re ${df}`;
  }
  if (t==='appellate'||t==='appeal') {
    const ap=p.appellant?.name, apl=p.appellee?.name;
    if (ap&&apl) return `${ap} v. ${apl}`;
    if (ap) return `Ex parte ${ap}`;
    const s=c.docketSummary?.split('.')[0]?.trim();
    return (s&&s.length<90)?s:(c.caseId||'Appellate Matter');
  }
  if (t==='administrative') {
    const pet=p.primaryPetitioner?.name||p.petitioner?.name, res=p.respondent?.name;
    if (pet&&res) return `${pet} v. ${res}`;
    if (pet) return `Ex parte ${pet}`;
    const s=c.docketSummary?.split('.')[0]?.trim();
    return (s&&s.length<90)?s:(c.administrativeSubtype||'Administrative Matter');
  }
  return c.caseId||'Case Record';
}

function getJudge(c) {
  return c.judge||(Array.isArray(c.judges)?c.judges[0]:null)||'—';
}

// ── Filtering ──
function getUserCases() {
  const name = (CURRENT_USER.name||'').toLowerCase().trim();
  if (!name||name==='—') return [];
  return ALL_CASES.filter(c => {
    const ps = JSON.stringify(c.parties||{}).toLowerCase();
    if (ps.includes(name)) return true;
    if (CURRENT_USER.uid && Array.isArray(c.relatedUserIds) && c.relatedUserIds.includes(CURRENT_USER.uid)) return true;
    return false;
  });
}

function getDocketCases() {
  const sc = isScRole(currentRole);
  const courtFilter = sc ? 'Michigan Supreme Court' : 'Genesee Co. District Court';
  const judgeName = (CURRENT_USER.name||'').toLowerCase().trim();
  return ALL_CASES.filter(c => {
    if (c.court !== courtFilter) return false;
    if (!judgeName||judgeName==='—') return false;
    const j = (c.judge||'').toLowerCase();
    const js = Array.isArray(c.judges)?c.judges.map(x=>x.toLowerCase()):[];
    return j.includes(judgeName)||js.some(x=>x.includes(judgeName));
  });
}

function getAllHearings(cases) {
  const out = [];
  cases.forEach(c => (c.hearings||[]).forEach(h => out.push({...h,_caseId:c.caseId,_caseTitle:getCaseTitle(c)})));
  return out.sort((a,b)=>new Date(a.date)-new Date(b.date));
}

function getAllFilings(cases) {
  const out = [];
  cases.forEach(c => (c.filings||[]).forEach(f => out.push({...f,_caseId:c.caseId,_caseFirestoreId:c._id})));
  return out.sort((a,b)=>new Date(b.dateFiled)-new Date(a.dateFiled));
}

function getAllFinancials(cases) {
  const out = [];
  cases.forEach(c => (c.financialOrders||[]).forEach(o => out.push({...o,_caseId:c.caseId})));
  return out;
}

// ── Render helpers ──
function statusPill(status) {
  const s=(status||'').toLowerCase().replace(/[-\s]/g,'');
  let cls='sp-active';
  if(s.includes('pretrial'))cls='sp-pretrial';
  else if(s.includes('pending'))cls='sp-pending';
  else if(s.includes('closed'))cls='sp-closed';
  else if(s.includes('dismissed'))cls='sp-dismissed';
  return `<span class="status-pill ${cls}">${status||'—'}</span>`;
}

function typeBadge(type) {
  const t=(type||'').toLowerCase();
  let cls='badge-civil';
  if(t==='criminal')cls='badge-criminal';
  else if(t==='appellate'||t==='appeal')cls='badge-appellate';
  else if(t==='traffic')cls='badge-traffic';
  else if(t==='administrative')cls='badge-administrative';
  return `<span class="badge ${cls}">${type||'Case'}</span>`;
}

function caseRowHtml(c) {
  const title=getCaseTitle(c), judge=getJudge(c), filed=fmtDate(c.dates?.filed);
  const now=new Date();
  const nextH=(c.hearings||[]).filter(h=>new Date(h.date)>=now).sort((a,b)=>new Date(a.date)-new Date(b.date))[0];
  const nextStr=nextH?fmtDate(nextH.date):null;
  return `<a class="case-row" href="/courts/micourt/cases/${encodeURIComponent(c._id||c.caseId)}/">
    <div class="cr-left">
      <div class="cr-num">${c.caseId}</div>
      <div class="cr-title">${title}</div>
      <div class="cr-meta">${c.court||'—'} · Filed ${filed} · ${judge}</div>
    </div>
    <div class="cr-right">
      ${typeBadge(c.caseType)}
      ${statusPill(c.status)}
      ${nextStr?`<span style="font-size:11px;color:var(--muted)">Next: ${nextStr}</span>`:''}
    </div>
    <span class="cr-open-hint">Open case ›</span>
  </a>`;
}

function hearingRowHtml(h) {
  if (!h.date) return '';
  const d=new Date(h.date), now=new Date();
  const month=d.toLocaleDateString('en-US',{month:'short'});
  const day=d.getDate(), year=d.getFullYear();
  const isToday=d.toDateString()===now.toDateString();
  const isPast=d<now&&!isToday;
  const cls=isToday?'hr-today':isPast?'hr-past':'hr-upcoming';
  const label=isToday?'Today':isPast?'Completed':'Upcoming';
  return `<div class="hearing-row">
    <div class="hr-date-box">
      <div class="hr-month">${month}</div><div class="hr-day">${day}</div><div class="hr-year">${year}</div>
    </div>
    <div class="hr-info">
      <div class="hr-type">${h.type||'Hearing'}</div>
      <div class="hr-case">${h._caseId||''}${h._caseTitle?' · '+h._caseTitle:''}</div>
      <div class="hr-meta">${h.officer||h.court||'—'}${h.courtroom?' · '+h.courtroom:''}</div>
    </div>
    <span class="hr-pill ${cls}">${label}</span>
  </div>`;
}

function filingRowHtml(f) {
  const st=(f.status||'').toLowerCase();
  let stCls='fs-pending', stLabel='Pending';
  if(st==='accepted'||st==='approved')  { stCls='fs-accepted'; stLabel='Accepted'; }
  else if(st==='rejected'||st==='denied'){ stCls='fs-rejected'; stLabel='Rejected'; }
  return `<div class="filing-row">
    <div class="filing-icon">📄</div>
    <div class="filing-info">
      <div class="filing-title">${f.title||'Untitled Filing'}</div>
      <div class="filing-meta">Case ${f._caseId||'—'} · Filed by ${f.filedBy||'—'} · ${fmtDate(f.dateFiled)}${f.role?' · <em>'+f.role+'</em>':''}</div>
      ${f.notes?`<div style="font-size:11.5px;color:var(--muted);margin-top:2px">${f.notes}</div>`:''}
      <span class="filing-status ${stCls}">${stLabel}</span>
      ${f.documentLink?`<a href="${f.documentLink}" target="_blank" style="font-size:11.5px;color:#1a4a7a;font-weight:700;text-decoration:none;margin-left:10px">View ↗</a>`:''}
    </div>
  </div>`;
}

function finRowHtml(o) {
  const paid=(o.payments||[]).reduce((s,p)=>s+(p.amount||0),0);
  const stl=(o.status||'').toLowerCase();
  let cls='fin-unpaid', stLabel='Unpaid';
  if(stl==='paid'){cls='fin-paid';stLabel='Paid';}
  else if(paid>0){cls='fin-partial';stLabel='Partial';}
  return `<div class="fin-row">
    <div><div class="fin-type">${o.type||'Financial Order'}</div><div class="fin-case">Case ${o._caseId||'—'}</div></div>
    <div style="text-align:right">
      <div class="fin-amount">${fmtMoney(o.amount)}</div>
      <span class="fin-status ${cls}">${stLabel}</span>
      ${paid>0&&stl!=='paid'?`<div style="font-size:10.5px;color:var(--muted);margin-top:2px">${fmtMoney(paid)} paid</div>`:''}
    </div>
  </div>`;
}

function docketRowHtml(c) {
  const title=getCaseTitle(c);
  const now=new Date();
  const nextH=(c.hearings||[]).filter(h=>new Date(h.date)>=now).sort((a,b)=>new Date(a.date)-new Date(b.date))[0];
  const nextStr=nextH?`${fmtDate(nextH.date)}${nextH.courtroom?' · '+nextH.courtroom:''}`:'—';
  return `<tr onclick="window.location.href='/courts/micourt/cases/${encodeURIComponent(c._id||c.caseId)}/'">
    <td><span class="dt-case-num">${c.caseId}</span></td>
    <td style="font-weight:600">${title}</td>
    <td>${typeBadge(c.caseType)}</td>
    <td style="font-size:11.5px;font-weight:600;color:var(--navy)">${nextStr}</td>
    <td>${statusPill(c.status)}</td>
  </tr>`;
}

function queueRowHtml(f) {
  const isNewCase=f.filingType==='new';
  const caption=isNewCase?`New ${f.caseType} case · ${f.court}`:`${f.caseId||'Existing case'} · ${f.caseType||''}`;
  return `<div class="queue-row"><div class="queue-priority qp-med"></div><div class="queue-info"><div class="queue-title">${f.documentType||'Filing'}${isNewCase?' <span style="color:var(--gold);font-weight:700">(New Case)</span>':''}</div><div class="queue-meta">From: ${f.filedBy||'—'}${f.isFilingAsCounsel?' (Attorney)':''} · Filed: ${fmtDate(f.dateFiled)} · ${caption}</div></div><a class="queue-action" href="/courts/micourt/filings/${encodeURIComponent(f._id)}/">Review →</a></div>`;
}

function emptyCaseState() {
  return `<div class="empty-state">
    <div class="ei">📂</div>
    <h4>No Cases Found</h4>
    <p>No cases are currently linked to your account. If you need to initiate a new matter, you can file electronically.</p>
    <div class="empty-state-actions">
      <a href="/courts/micourt/dashboard/filings/new/" class="btn-primary">📤 File a New Case</a>
    </div>
  </div>`;
}

function emptyFilingsState(hasCases) {
  if (!hasCases) {
    return `<div class="empty-state">
      <div class="ei">📤</div>
      <h4>No Filings Yet</h4>
      <p>You haven't submitted any documents electronically. Start by filing your case or a document with the court.</p>
      <div class="empty-state-actions">
        <a href="/courts/micourt/dashboard/filings/new/" class="btn-primary">📤 File a New Case</a>
      </div>
    </div>`;
  }
  return `<div class="empty-state">
    <div class="ei">📤</div>
    <h4>No Filings on Record</h4>
    <p>No electronic filings are associated with your cases yet.</p>
    <div class="empty-state-actions">
      <a href="/courts/micourt/dashboard/filings/new/" class="btn-primary">📤 File a Document</a>
    </div>
  </div>`;
}

// ── Nav ──
const SECTION_LABELS = { main:'Navigation', tools:'Court Tools', account:'Account' };

function buildNav(role) {
  const tier=getTier(role);
  const config=NAV_CONFIG[tier]||NAV_CONFIG.public;
  let html='';
  config.forEach(sec=>{
    html+=`<div class="sb-section"><span class="sb-section-label">${SECTION_LABELS[sec.section]||sec.section}</span>`;
    sec.items.forEach(item=>{
      const act=item.id===PAGE_ID?' active':'';
      html+=`<a class="sb-nav-item${act}" href="${ROUTES[item.id]}"><span class="sb-nav-icon">${item.icon}</span>${item.label}</a>`;
    });
    html+=`</div><hr class="sb-divider">`;
  });
  const navEl = el('sidebar-nav');
  if (navEl) navEl.innerHTML=html;
}

function renderCurrentPage() {
  const t=getTier(currentRole);
  switch(PAGE_ID){
    case 'overview':   renderOverview(t); break;
    case 'cases':      renderCases(t); break;
    case 'hearings':   renderHearings(); break;
    case 'filings':    renderFilings(); break;
    case 'financials': renderFinancials(); break;
    case 'docket':     renderDocket(t); break;
    case 'all-cases':  renderAllCases(t); break;
    case 'admin':      renderAdmin(); break;
    case 'opinions':   renderOpinions(); break;
    case 'settings':   renderSettings(); break;
  }
}
window.renderCurrentPage = renderCurrentPage;

// ── Page renders ──
function renderOverview(tier) {
  const content=el('overview-content');
  if(!content) return;
  if(!CASES_LOADED){content.innerHTML=loadingHtml();return;}

  const isPublic=tier==='public';
  const isAtty=tier==='attorney'||tier==='state-atty';
  const isClerk=['clerk','sc-clerk','sc-asst-clerk'].includes(tier);
  const isJudge=['magistrate','judge','chief-judge','justice','chief-justice'].includes(tier);

  if(isPublic||isAtty){
    const myCases=getUserCases();
    const activeCases=myCases.filter(c=>!['Closed','Dismissed'].includes(c.status));
    const allH=getAllHearings(myCases);
    const now=new Date();
    const upcoming=allH.filter(h=>new Date(h.date)>=now);
    const allFin=getAllFinancials(myCases);
    const balance=allFin.reduce((s,o)=>{
      const paid=(o.payments||[]).reduce((ss,p)=>ss+(p.amount||0),0);
      return s+Math.max(0,(o.amount||0)-paid);
    },0);
    const allFilings=getAllFilings(myCases);
    // Portal Users & Attorneys: overview quick actions is just "File a Document" — everything else lives on its own nav page already.
    content.innerHTML=`
      <div class="stat-row cols-4">
        <div class="stat-card gold"><span class="sc-icon">📋</span><span class="sc-label">Active Cases</span><span class="sc-value">${activeCases.length}</span><span class="sc-sub">${myCases.length} total</span></div>
        <div class="stat-card blue"><span class="sc-icon">📅</span><span class="sc-label">Upcoming Hearings</span><span class="sc-value">${upcoming.length}</span><span class="sc-sub">${upcoming[0]?'Next: '+fmtDate(upcoming[0].date):'None scheduled'}</span></div>
        <div class="stat-card ${balance>0?'red':'green'}"><span class="sc-icon">💳</span><span class="sc-label">Balance Due</span><span class="sc-value">${fmtMoney(balance)}</span><span class="sc-sub">${allFin.length} order(s)</span></div>
        <div class="stat-card navy"><span class="sc-icon">📤</span><span class="sc-label">Filings</span><span class="sc-value">${allFilings.length}</span><span class="sc-sub">${allFilings[0]?'Last: '+fmtDate(allFilings[0].dateFiled):'None submitted'}</span></div>
      </div>
      <div class="two-col">
        <div>
          <div class="card">
            <div class="card-hdr"><h3>${isAtty?'Client Cases':'My Cases'}</h3><a class="card-link" href="${ROUTES.cases}">View All →</a></div>
            <div class="card-body">${myCases.length?myCases.slice(0,6).map(caseRowHtml).join(''):emptyCaseState()}</div>
          </div>
        </div>
        <div>
          <div class="card">
            <div class="card-hdr"><h3>Quick Actions</h3></div>
            <div class="card-body-pad">
              <div class="qa-grid single">
                <a class="qa-btn" href="/courts/micourt/dashboard/filings/new/"><span class="qa-icon">📤</span><span class="qa-label">File a Document</span><span class="qa-sub">Submit electronically</span></a>
              </div>
            </div>
          </div>
          <div class="card">
            <div class="card-hdr"><h3>Upcoming Hearings</h3><a class="card-link" href="${ROUTES.hearings}">View All →</a></div>
            <div class="card-body">${upcoming.length?upcoming.slice(0,4).map(hearingRowHtml).join(''):`<div class="empty-state"><div class="ei">📅</div><h4>No Upcoming Hearings</h4><p>None currently scheduled.</p></div>`}</div>
          </div>
          ${balance>0?`<div class="card"><div class="card-hdr"><h3>Fines &amp; Fees</h3><a class="card-link" href="${ROUTES.financials}">Pay →</a></div><div class="card-body">${allFin.slice(0,3).map(finRowHtml).join('')}</div></div>`:''}
        </div>
      </div>`;
  } else if(isClerk){
    const cf=isScRole(currentRole)?'Michigan Supreme Court':'Genesee Co. District Court';
    const cc=ALL_CASES.filter(c=>c.court===cf);
    const now=new Date();
    const upH=getAllHearings(cc).filter(h=>new Date(h.date)>=now);
    content.innerHTML=`
      <div class="stat-row cols-4">
        <div class="stat-card gold"><span class="sc-icon">📋</span><span class="sc-label">Cases on Record</span><span class="sc-value">${cc.length}</span><span class="sc-sub">In this court</span></div>
        <div class="stat-card blue"><span class="sc-icon">⚖️</span><span class="sc-label">Active Cases</span><span class="sc-value">${cc.filter(c=>!['Closed','Dismissed'].includes(c.status)).length}</span><span class="sc-sub">Open matters</span></div>
        <div class="stat-card green"><span class="sc-icon">📤</span><span class="sc-label">Total Filings</span><span class="sc-value">${cc.reduce((s,c)=>s+(c.filings||[]).length,0)}</span><span class="sc-sub">On record</span></div>
        <div class="stat-card navy"><span class="sc-icon">📅</span><span class="sc-label">Upcoming Hearings</span><span class="sc-value">${upH.length}</span><span class="sc-sub">Scheduled</span></div>
      </div>
      <div class="two-col">
        <div>
          <div class="card">
            <div class="card-hdr"><h3>Recent Cases</h3><a class="card-link" href="${ROUTES['all-cases']}">View All →</a></div>
            <div class="card-body">${cc.slice(0,6).map(caseRowHtml).join('')||`<div class="empty-state"><div class="ei">📂</div><h4>No Cases</h4><p>No cases found for this court.</p></div>`}</div>
          </div>
        </div>
        <div>
          <div class="card">
            <div class="card-hdr"><h3>Quick Actions</h3></div>
            <div class="card-body-pad">
              <div class="qa-grid">
                <a class="qa-btn" href="${ROUTES['all-cases']}"><span class="qa-icon">🔎</span><span class="qa-label">Search Cases</span><span class="qa-sub">All records</span></a>
                <a class="qa-btn" href="${ROUTES.admin}"><span class="qa-icon">🛠️</span><span class="qa-label">Admin Tools</span><span class="qa-sub">Court management</span></a>
                <a class="qa-btn" href="/courts/micourt/administration/cases/new/"><span class="qa-icon">📋</span><span class="qa-label">Open New Case</span><span class="qa-sub">File complaint</span></a>
                <a class="qa-btn" href="/courts/micourt/administration/hearings/new/"><span class="qa-icon">📅</span><span class="qa-label">Schedule Hearing</span><span class="qa-sub">Add to calendar</span></a>
              </div>
            </div>
          </div>
        </div>
      </div>`;
  } else if(isJudge){
    const docket=getDocketCases();
    const now=new Date();
    const upH=getAllHearings(docket).filter(h=>new Date(h.date)>=now);
    content.innerHTML=`
      <div class="stat-row cols-4">
        <div class="stat-card gold"><span class="sc-icon">⚖️</span><span class="sc-label">Cases on Docket</span><span class="sc-value">${docket.length}</span><span class="sc-sub">Assigned matters</span></div>
        <div class="stat-card blue"><span class="sc-icon">📅</span><span class="sc-label">Upcoming Hearings</span><span class="sc-value">${upH.length}</span><span class="sc-sub">${upH[0]?'Next: '+fmtDate(upH[0].date):'None scheduled'}</span></div>
        <div class="stat-card navy"><span class="sc-icon">📜</span><span class="sc-label">Pending Decisions</span><span class="sc-value">${docket.filter(c=>['Pending','Pending Decision'].includes(c.status)).length}</span><span class="sc-sub">Awaiting opinion</span></div>
        <div class="stat-card green"><span class="sc-icon">✅</span><span class="sc-label">Closed Cases</span><span class="sc-value">${docket.filter(c=>c.status==='Closed').length}</span><span class="sc-sub">Disposed matters</span></div>
      </div>
      <div class="two-col">
        <div>
          <div class="card">
            <div class="card-hdr"><h3>My Docket</h3><a class="card-link" href="${ROUTES.docket}">Full Docket →</a></div>
            <div class="card-body"><div style="overflow-x:auto">
              <table class="docket-table">
                <thead><tr><th>Case No.</th><th>Title</th><th>Type</th><th>Next Proceeding</th><th>Status</th></tr></thead>
                <tbody>${docket.length?docket.slice(0,6).map(docketRowHtml).join(''):'<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--muted)">No cases assigned to your name in Firestore</td></tr>'}</tbody>
              </table>
            </div></div>
          </div>
        </div>
        <div>
          <div class="card">
            <div class="card-hdr"><h3>Quick Actions</h3></div>
            <div class="card-body-pad">
              <div class="qa-grid">
                <a class="qa-btn" href="${ROUTES['all-cases']}"><span class="qa-icon">🔎</span><span class="qa-label">All Cases</span><span class="qa-sub">Full court record</span></a>
                <a class="qa-btn" href="${ROUTES.admin}"><span class="qa-icon">🛠️</span><span class="qa-label">Admin Tools</span></a>
                ${(tier==='justice'||tier==='chief-justice')?`<a class="qa-btn" href="${ROUTES.opinions}"><span class="qa-icon">📜</span><span class="qa-label">Draft Opinion</span></a>`:''}
                <a class="qa-btn" href="/courts/micourt/administration/calendar/"><span class="qa-icon">📅</span><span class="qa-label">Court Calendar</span></a>
              </div>
            </div>
          </div>
          <div class="card">
            <div class="card-hdr"><h3>Upcoming Proceedings</h3><a class="card-link" href="${ROUTES.docket}">View All →</a></div>
            <div class="card-body">${upH.length?upH.slice(0,4).map(hearingRowHtml).join(''):`<div class="empty-state"><div class="ei">📅</div><h4>No Upcoming Hearings</h4><p>None scheduled.</p></div>`}</div>
          </div>
        </div>
      </div>`;
  }
}

function renderCases(tier) {
  const content=el('cases-content');
  if(!content) return;
  const actionEl=el('cases-action');
  const subEl=el('cases-sub');
  if(!CASES_LOADED){content.innerHTML=loadingHtml();return;}
  const staff=isStaffTier(tier);
  const data=staff?getDocketCases():getUserCases();
  if(subEl){
    if(tier==='attorney') subEl.textContent='Cases in which you are counsel of record.';
    else if(tier==='state-atty') subEl.textContent='Cases assigned to your office.';
  }

  if(data.length&&actionEl&&!staff) {
    actionEl.innerHTML=`<a href="/courts/micourt/dashboard/filings/new/" class="btn-outline">📤 File a Document</a>`;
  }

  content.innerHTML=`<div class="card"><div class="card-hdr"><h3>${staff?'Docket Cases':'My Cases'}</h3><span class="card-tag">${data.length} case${data.length!==1?'s':''}</span></div><div class="card-body">${data.length?data.map(caseRowHtml).join(''):emptyCaseState()}</div></div>`;
}

function renderHearings() {
  const content=el('hearings-content');
  if(!content) return;
  if(!CASES_LOADED){content.innerHTML=loadingHtml();return;}
  const cases=isStaffTier(getTier(currentRole))?getDocketCases():getUserCases();
  const hearings=getAllHearings(cases);
  content.innerHTML=`<div class="card"><div class="card-hdr"><h3>Scheduled Proceedings</h3><span class="card-tag">${hearings.length} total</span></div><div class="card-body">${hearings.length?hearings.map(hearingRowHtml).join(''):`<div class="empty-state"><div class="ei">📅</div><h4>No Hearings</h4><p>No hearings are currently scheduled.</p></div>`}</div></div>`;
}

function renderFilings() {
  const content=el('filings-content');
  if(!content) return;
  const actionEl=el('filings-action');
  if(!CASES_LOADED){content.innerHTML=loadingHtml();return;}

  const isStaff=isStaffTier(getTier(currentRole));
  const cases=isStaff?getDocketCases():getUserCases();
  const filings=getAllFilings(cases);
  const hasCases=cases.length>0;

  if(filings.length&&actionEl) {
    actionEl.innerHTML=`<a href="/courts/micourt/dashboard/filings/new/" class="btn-primary">📤 File Another Document</a>`;
  } else if(actionEl) {
    actionEl.innerHTML='';
  }

  const pendingCount=isStaff?filings.filter(f=>!f.accepted&&!(f.status==='Accepted'||f.status==='accepted')).length:0;

  content.innerHTML=`
    ${isStaff&&pendingCount>0?`<div class="queue-banner">⚠️ ${pendingCount} filing${pendingCount!==1?'s':''} pending review</div>`:''}
    <div class="card">
      <div class="card-hdr">
        <h3>${isStaff?'All Filings':'My Filings'}</h3>
        <span class="card-tag">${filings.length} document${filings.length!==1?'s':''}</span>
      </div>
      <div class="card-body">${filings.length?filings.map(filingRowHtml).join(''):emptyFilingsState(hasCases)}</div>
    </div>`;
}

function renderFinancials() {
  const content=el('financials-content');
  if(!content) return;
  if(!CASES_LOADED){content.innerHTML=loadingHtml();return;}
  const orders=getAllFinancials(getUserCases());
  const totalOwed=orders.reduce((s,o)=>s+(o.amount||0),0);
  const totalPaid=orders.reduce((s,o)=>s+(o.payments||[]).reduce((ss,p)=>ss+(p.amount||0),0),0);
  const balance=Math.max(0,totalOwed-totalPaid);
  content.innerHTML=`
    <div class="stat-row cols-3">
      <div class="stat-card navy"><span class="sc-label">Total Assessed</span><span class="sc-value">${fmtMoney(totalOwed)}</span></div>
      <div class="stat-card green"><span class="sc-label">Total Paid</span><span class="sc-value">${fmtMoney(totalPaid)}</span></div>
      <div class="stat-card ${balance>0?'red':'green'}"><span class="sc-label">Balance Due</span><span class="sc-value">${fmtMoney(balance)}</span></div>
    </div>
    <div class="card"><div class="card-hdr"><h3>Financial Orders</h3></div><div class="card-body">${orders.length?orders.map(finRowHtml).join(''):`<div class="empty-state"><div class="ei">💳</div><h4>No Financial Orders</h4><p>No fines or fees are currently on record.</p></div>`}</div></div>
    ${balance>0?`<div style="text-align:right;margin-top:4px"><a href="/courts/micourt/pay/" style="background:var(--navy);color:#fff;border:none;padding:12px 28px;border-radius:4px;font-size:14px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;text-decoration:none;display:inline-block">Pay Balance (${fmtMoney(balance)}) →</a></div>`:''}`;
}

function renderDocket(tier) {
  const content=el('docket-content');
  if(!content) return;
  if(!CASES_LOADED){content.innerHTML=loadingHtml();return;}
  const data=getDocketCases();
  const showHearings = DOCKET_HEARING_TIERS.includes(tier);
  let html = `<div class="card"><div class="card-hdr"><h3>Assigned Cases</h3><span class="card-tag">${data.length} matters</span></div><div class="card-body"><div style="overflow-x:auto"><table class="docket-table"><thead><tr><th>Case No.</th><th>Title</th><th>Type</th><th>Next Proceeding</th><th>Status</th></tr></thead><tbody>${data.length?data.map(docketRowHtml).join(''):'<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--muted)">No cases assigned to your name in Firestore</td></tr>'}</tbody></table></div></div></div>`;
  if (showHearings) {
    const now=new Date();
    const upH=getAllHearings(data).filter(h=>new Date(h.date)>=now);
    html += `<div class="card"><div class="card-hdr"><h3>Upcoming Proceedings</h3><span class="card-tag">${upH.length} scheduled</span></div><div class="card-body">${upH.length?upH.map(hearingRowHtml).join(''):`<div class="empty-state"><div class="ei">📅</div><h4>No Upcoming Proceedings</h4><p>Nothing scheduled for your docket right now.</p></div>`}</div></div>`;
  }
  content.innerHTML = html;
}

function renderAllCases(tier) {
  const content=el('all-cases-content');
  if(!content) return;
  const subEl=el('all-cases-sub');
  if(!CASES_LOADED){content.innerHTML=loadingHtml();return;}
  const sc=isScRole(currentRole);
  const cf=sc?'Michigan Supreme Court':'Genesee Co. District Court';
  if(subEl) subEl.textContent = sc?'All cases filed with the Michigan Supreme Court.':'All cases on record at the Genesee County District Court.';
  const data=ALL_CASES.filter(c=>c.court===cf);

  let queueHtml = '';
  if (QUEUE_TIERS.includes(tier)) {
    const pending=ALL_PENDING_FILINGS.filter(f=>{
      const st=(f.status||'').toLowerCase();
      return f.court===cf && !f.accepted && st!=='accepted' && st!=='rejected';
    }).sort((a,b)=>new Date(b.dateFiled)-new Date(a.dateFiled));
    queueHtml = `<div class="card"><div class="card-hdr"><h3>Pending Review</h3><span class="card-tag">${pending.length} items</span></div><div class="card-body">${pending.length?pending.map(queueRowHtml).join(''):`<div class="empty-state"><div class="ei">📥</div><h4>Queue Empty</h4><p>No pending items to review.</p></div>`}</div></div>`;
  }

  content.innerHTML=`
    ${queueHtml}
    <div style="margin-bottom:16px;display:flex;gap:10px">
      <input id="ac-search" placeholder="Search by case number, party, keyword…" style="flex:1;padding:10px 14px;border:1.5px solid var(--line);border-radius:4px;font-size:13.5px;font-family:'DM Sans',sans-serif;outline:none" onfocus="this.style.borderColor='var(--navy)'" onblur="this.style.borderColor='var(--line)'">
      <button onclick="window._acSearch()" style="background:var(--navy);color:#fff;border:none;padding:10px 20px;border-radius:4px;font-weight:700;font-size:13px;cursor:pointer;font-family:'DM Sans',sans-serif">Search</button>
      <button onclick="document.getElementById('ac-search').value='';window._acSearch()" style="background:none;border:1px solid var(--line);color:var(--muted);padding:10px 16px;border-radius:4px;font-size:13px;cursor:pointer;font-family:'DM Sans',sans-serif">Clear</button>
    </div>
    <div class="card">
      <div class="card-hdr"><h3>Case Records</h3><span class="card-tag" id="ac-count">${data.length} results</span></div>
      <div class="card-body" id="ac-results">${data.length?data.map(caseRowHtml).join(''):`<div class="empty-state"><div class="ei">📂</div><h4>No Cases Found</h4><p>No cases in this court.</p></div>`}</div>
    </div>`;

  window._acSearch=function(){
    const q=document.getElementById('ac-search').value.trim().toLowerCase();
    const filtered=data.filter(c=>{
      if(!q)return true;
      return getCaseTitle(c).toLowerCase().includes(q)||(c.caseId||'').toLowerCase().includes(q)||JSON.stringify(c.parties||{}).toLowerCase().includes(q)||(c.docketSummary||'').toLowerCase().includes(q);
    });
    document.getElementById('ac-results').innerHTML=filtered.length?filtered.map(caseRowHtml).join(''):`<div class="empty-state"><div class="ei">📂</div><h4>No Results</h4><p>Try a different search term.</p></div>`;
    document.getElementById('ac-count').textContent=`${filtered.length} results`;
  };
  const searchInput = document.getElementById('ac-search');
  if (searchInput) searchInput.addEventListener('keydown',e=>{if(e.key==='Enter')window._acSearch();});
}

function renderAdmin() {
  const content=el('admin-content');
  if(!content) return;
  const sc=isScRole(currentRole)&&currentCourt==='Michigan Supreme Court';
  const tools=sc?ADMIN_TOOLS_SC:ADMIN_TOOLS_DISTRICT;
  content.innerHTML=`<div class="admin-tool-grid">${tools.map(t=>`<a class="admin-tool" href="${t.href}"><span class="at-icon">${t.icon}</span><span class="at-title">${t.title}</span><span class="at-sub">${t.sub}</span></a>`).join('')}</div>`;
}

function renderOpinions() {
  const content=el('opinions-content');
  if(!content) return;
  if(!CASES_LOADED){content.innerHTML=loadingHtml();return;}
  const pending=ALL_CASES.filter(c=>c.court==='Michigan Supreme Court'&&['Pending','Pending Decision'].includes(c.status));
  const closed=ALL_CASES.filter(c=>c.court==='Michigan Supreme Court'&&c.status==='Closed'&&c.caseType==='Appellate').slice(0,5);
  const active=ALL_CASES.filter(c=>c.court==='Michigan Supreme Court'&&!['Closed','Dismissed'].includes(c.status));
  content.innerHTML=`
    <div class="stat-row cols-3">
      <div class="stat-card gold"><span class="sc-label">Pending Decisions</span><span class="sc-value">${pending.length}</span></div>
      <div class="stat-card green"><span class="sc-label">Closed SC Cases</span><span class="sc-value">${ALL_CASES.filter(c=>c.court==='Michigan Supreme Court'&&c.status==='Closed').length}</span></div>
      <div class="stat-card navy"><span class="sc-label">Active SC Matters</span><span class="sc-value">${active.length}</span></div>
    </div>
    <div class="card"><div class="card-hdr"><h3>Pending Decisions</h3><span class="card-tag">${pending.length} matters</span></div><div class="card-body">${pending.length?pending.map(caseRowHtml).join(''):`<div class="empty-state"><div class="ei">📜</div><h4>No Pending Decisions</h4><p>All matters are resolved.</p></div>`}</div></div>
    ${closed.length?`<div class="card"><div class="card-hdr"><h3>Recently Closed Appellate Cases</h3></div><div class="card-body">${closed.map(caseRowHtml).join('')}</div></div>`:''}`;
}

function renderSettings() {
  const content=el('settings-content');
  if(!content) return;
  const showBar=['Licensed Attorney','State Attorney'].includes(currentRole);
  const fields=[
    {label:'Full Name',value:CURRENT_USER.name},
    {label:'Email Address',value:CURRENT_USER.email},
    {label:'MiPASS PIN',value:CURRENT_USER.pin||'—'},
    {label:'Role',value:currentRole},
    ...(showBar?[{label:'Bar Number',value:CURRENT_USER.barNumber||'—'}]:[]),
  ];
  content.innerHTML=`
    <div class="two-col">
      <div class="card">
        <div class="card-hdr"><h3>Profile Information</h3></div>
        <div class="card-body-pad">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
            ${fields.map(f=>`<div><div style="font-size:10.5px;color:var(--muted);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px">${f.label}</div><div style="font-size:14px;font-weight:500;padding:9px 12px;background:var(--cream);border:1px solid var(--line);border-radius:3px">${f.value}</div></div>`).join('')}
          </div>
        </div>
      </div>
      <div>
        <div class="card">
          <div class="card-hdr"><h3>Notifications</h3></div>
          <div class="card-body-pad">
            ${['Case updates by email','Hearing reminders','Filing confirmations','Payment receipts'].map(n=>`<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f8f5f0"><span style="font-size:13px">${n}</span><div style="width:38px;height:22px;background:var(--navy);border-radius:11px;position:relative;cursor:pointer"><div style="position:absolute;right:3px;top:3px;width:16px;height:16px;background:#fff;border-radius:50%"></div></div></div>`).join('')}
          </div>
        </div>
        <div class="card">
          <div class="card-hdr"><h3>Account</h3></div>
          <div class="card-body-pad">
            <button onclick="signOutUser()" style="width:100%;padding:11px;background:var(--red-bg);color:var(--red);border:1px solid var(--red-bdr);border-radius:4px;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:700;cursor:pointer">Sign Out of MiCOURT</button>
          </div>
        </div>
      </div>
    </div>`;
}

function applyRole(role) {
  currentRole=role;
  const meta=ROLE_META[role]||ROLE_META['Portal User'];
  currentCourt=meta.court;

  el('sb-username').textContent=CURRENT_USER.name;
  el('sb-role-label').textContent=role;
  el('sb-avatar-initials').textContent=initials(CURRENT_USER.name);
  const wbName=el('wb-name'); if(wbName) wbName.textContent=CURRENT_USER.name;
  const wbRole=el('wb-role-badge'); if(wbRole) wbRole.textContent=role;
  const wbDate=el('wb-date-full'); if(wbDate) wbDate.textContent=new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'});
  el('topbar-court-name').textContent=currentCourt;
  el('topbar-title').textContent = PAGE_TITLES[PAGE_ID] || 'MiCOURT';

  const subs={
    'Portal User':'View your cases, upcoming hearings, and manage your court obligations.',
    'Licensed Attorney':'Manage your active matters, file documents, and track client cases.',
    'State Attorney':'Review your assigned cases, manage your docket, and coordinate with the court.',
    'Clerk':'Manage case records, filings, and the processing queue.',
    'Magistrate Judge':'Your docket is ready. Review assigned matters and upcoming proceedings.',
    'Judge':'Your docket is ready. Review assigned matters and upcoming proceedings.',
    'Chief Judge':'Court administration, your docket, and the filing queue.',
    'Clerk of the Supreme Court':'Manage Supreme Court filings, petitions, and records.',
    'Assistant Clerk of the Supreme Court':'Assist with Supreme Court filing and record management.',
    'Justice':'Your Supreme Court docket and pending opinions.',
    'Chief Justice':'Court leadership, opinion management, and full SC docket.',
  };
  const wbSub=el('wb-sub'); if(wbSub) wbSub.textContent=subs[role]||'Welcome to MiCOURT.';

  const switcher=el('court-switcher');
  if (switcher) meta.sc?switcher.classList.add('show'):switcher.classList.remove('show');

  buildNav(role);
  renderCurrentPage();
}

function switchCourt(court,btn) {
  document.querySelectorAll('.scs-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  currentCourt=court==='sc'?'Michigan Supreme Court':'Genesee Co. District Court';
  el('topbar-court-name').textContent=currentCourt;
  renderCurrentPage();
}
window.switchCourt=switchCourt;

async function signOutUser() {
  try{if(window._micourtAuth)await window._micourtAuth.signOut();}catch(e){}
  window.location.href='/courts/micourt/';
}
window.signOutUser=signOutUser;

// ── Boot ──
await setPersistence(auth, browserLocalPersistence);

const dateEl = el('topbar-date');
if (dateEl) dateEl.textContent = new Date().toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});

function setMsg(m) { const m2=el('auth-overlay-msg'); if(m2) m2.textContent = m; }

const unsub = onAuthStateChanged(auth, async (user) => {
  unsub();
  if (!user) {
    setMsg('Session expired. Redirecting…');
    setTimeout(() => { window.location.href='/courts/micourt/'; }, 1500);
    return;
  }
  setMsg('Loading your profile…');
  try {
    const snap = await getDoc(doc(db,'accounts',user.uid));
    if (!snap.exists()) {
      setMsg('Account not found. Redirecting…');
      setTimeout(() => { window.location.href='/courts/micourt/'; }, 1500);
      return;
    }
    const data = snap.data();
    CURRENT_USER.uid       = user.uid;
    CURRENT_USER.name      = data.name      || user.displayName || 'Unknown User';
    CURRENT_USER.email     = data.email     || user.email       || '—';
    CURRENT_USER.pin       = data.pin       || data.mipassPin   || '—';
    CURRENT_USER.role      = data.role      || 'Portal User';
    CURRENT_USER.barNumber = data.barNumber || null;

    updateDoc(doc(db,'accounts',user.uid),{lastLogin:serverTimestamp()}).catch(()=>{});

    setMsg('Loading case records…');
    try {
      const casesSnap = await getDocs(collection(db,'cases'));
      ALL_CASES = [];
      casesSnap.forEach(d => ALL_CASES.push({...d.data(), _id:d.id}));
      CASES_LOADED = true;
    } catch(err) {
      console.warn('Could not load cases:', err);
      CASES_LOADED = true;
    }

    try {
      const pfSnap = await getDocs(collection(db,'pendingFilings'));
      ALL_PENDING_FILINGS = [];
      pfSnap.forEach(d => ALL_PENDING_FILINGS.push({...d.data(), _id:d.id}));
    } catch(err) {
      console.warn('Could not load pending filings:', err);
    }

    const overlay = el('auth-overlay');
    if (overlay) overlay.classList.add('hidden');
    applyRole(CURRENT_USER.role);
  } catch(err) {
    setMsg('Error loading profile. Retrying…');
    setTimeout(() => { window.location.reload(); }, 3000);
  }
});

setTimeout(() => {
  const overlay = el('auth-overlay');
  if (overlay && !overlay.classList.contains('hidden')) {
    window.location.reload();
  }
}, 12000);
