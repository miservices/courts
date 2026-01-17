const CSV_URL="https://docs.google.com/spreadsheets/d/e/2PACX-1vQZakTnz5DihZnyTEeO5iGB3u-9QXO_YCP9PCzeZJWm53QNAsauMav3dWNJ_ce_ZCwMHIghNa4ujx4U/pub?output=csv";
let cachedData=null,lastMatches=[];

function handleEnter(e){if(e.key==="Enter")searchCases();}
function showSkeletons(){
  results.innerHTML="";
  for(let i=0;i<3;i++){
    results.innerHTML+=`
      <div class="skeleton-card">
        <div class="skeleton skeleton-title"></div>
        <div class="case-meta">
          <div class="skeleton skeleton-line"></div>
          <div class="skeleton skeleton-line"></div>
          <div class="skeleton skeleton-line"></div>
          <div class="skeleton skeleton-line"></div>
        </div>
      </div>`;
  }
}

function parseCSV(text){
  return text.split(/\r?\n/).map(row=>{
    const values=[]; let current="", inQuotes=false;
    for(const ch of row){
      if(ch==='\"'){inQuotes=!inQuotes; continue;}
      if(ch===',' && !inQuotes){values.push(current); current=""; continue;}
      current+=ch;
    }
    values.push(current);
    return values.map(v=>v.trim());
  });
}

async function loadCSV(){if(cachedData)return cachedData; const r=await fetch(CSV_URL); cachedData=parseCSV(await r.text()); return cachedData;}
function get(row,header,name){const i=header.indexOf(name);return i>-1?row[i]||"":"";}
function parseDate(v){const d=new Date(v); return isNaN(d)?new Date(0):d;}
function parseNextHearing(v){if(!v) return null; const p=v.split(",").map(x=>x.trim()); return {date:p[0],court:p[1],type:p.slice(2).join(",")};}

function parseEvents(summary){
  if(!summary) return [];
  return summary.split("|").map(e=>{
    const parts = e.split("\\").map(v=>v.trim());
    return { date: parts[0] || "", party: parts[1]=="NADNS"?null:parts[1], judge: parts[2]=="NADNS"?null:parts[2], desc: parts[3]=="NADNS"?null:parts[3], url: parts[4]=="NADNS"?null:parts[4] };
  });
}

async function searchCases(){
  showSkeletons();
  const cq=caseSearch.value.toLowerCase();
  const tq=titleSearch.value.toLowerCase();
  const uq=userSearch.value.toLowerCase();
  const data=await loadCSV();
  const h=data[0];
  lastMatches=data.slice(1).filter(r=>
    (!cq||get(r,h,"Case No").toLowerCase().includes(cq)) &&
    (!tq||get(r,h,"Title").toLowerCase().includes(tq)) &&
    (!uq||get(r,h,"Filing Party").toLowerCase().includes(uq) ||
         get(r,h,"Opposing Party").toLowerCase().includes(uq))
  );
  lastMatches.sort((a,b)=>{
    const ca=get(a,h,"Court").toLowerCase();
    const cb=get(b,h,"Court").toLowerCase();
    if(ca==="supreme court"&&cb!=="supreme court")return-1;
    if(cb==="supreme court"&&ca!=="supreme court")return 1;
    return parseDate(get(b,h,"File Date"))-parseDate(get(a,h,"File Date"));
  });
  if(!lastMatches.length){results.innerHTML="No matching cases found.";return;}
  results.innerHTML="";
  lastMatches.forEach((r,i)=>{
    const court=get(r,h,"Court"),isSupreme=court.toLowerCase()==="supreme court";
    results.innerHTML+=`
      <div class="case-card ${isSupreme?"supreme":""}" onclick="showDetail(${i})">
        <div class="case-title">${get(r,h,"Title")}${isSupreme?`<span class="supreme-badge">SUPREME COURT</span>`:""}</div>
        <div class="case-meta">
          <div class="meta-item"><span>Case No</span>${get(r,h,"Case No")||"—"}</div>
          <div class="meta-item"><span>Court</span>${court||"—"}</div>
          <div class="meta-item"><span>Status</span><span class="status-badge">${get(r,h,"Status")||"—"}</span></div>
          <div class="meta-item"><span>Date Filed</span>${get(r,h,"File Date")||"—"}</div>
        </div>
      </div>`;
  });
}

function showDetail(i){
  const h=cachedData[0], r=lastMatches[i];
  const next=parseNextHearing(get(r,h,"Next Hearing"));
  const portal=get(r,h,"Link");
  const court=get(r,h,"Court"), isSupreme=court.toLowerCase()==="supreme court";
  const events=parseEvents(get(r,h,"Summary"));
  const grouped = {}; events.forEach(e=>{ if(!grouped[e.date]) grouped[e.date]=[]; grouped[e.date].push(e); });
  const safe = v => (!v || v==="NADNS") ? null : v;

  results.innerHTML=`
    <button class="back-button" onclick="searchCases()">← Back</button>
    <div class="detail-card">
      ${next?`<div class="hearing-banner">📅 Hearing Scheduled in the ${next.court} on ${next.date} · ${next.type}</div>`:""}
      <div class="detail-title">
        <span>${get(r,h,"Title")}</span>
        <div class="detail-actions" style="display:flex; gap:10px;">
          ${portal ? `<a href="${portal}" target="_blank"><button>Open Case Tracker</button></a>` : ""}
          <button class="print-button" onclick="window.print()" style="background:white; color:#000; border:1px solid #ccc; padding:5px 10px; cursor:pointer;">Print</button>
        </div>
      </div>
      <div class="detail-grid">
        ${[["Case No", get(r,h,"Case No")], ["Court", court], ["Status", get(r,h,"Status")], ["Judge", get(r,h,"Judge")], ["Matter", get(r,h,"Matter")], ["Filing Party", get(r,h,"Filing Party")], ["Opposing Party", get(r,h,"Opposing Party")], ["Date Filed", get(r,h,"File Date")], ["Date Closed", get(r,h,"Close Date")]].map(([label,val])=>`<div class="detail-field"><span>${label}</span>${safe(val)||"—"}</div>`).join("")}
      </div>
      <div class="timeline">
        ${Object.keys(grouped).map(date=>`
          <div class="timeline-event-group">
            <div class="timeline-event-date">${date}</div>
            ${grouped[date].map(e=>{
              return `<div class="timeline-event">
                <div class="timeline-event-meta">
                  ${e.party?`<span>Party: ${e.party}</span>`:""}
                  ${e.judge?`<span>Judge: ${e.judge}</span>`:""}
                </div>
                ${e.desc?`<div class="timeline-event-desc">${e.desc.replace(/\n/g,"<br>")}</div>`:""}
                ${e.url?`<a href="${e.url}" target="_blank">Download PDF</a>`:""}
              </div>`;
            }).join("")}
          </div>
        `).join("")}
      </div>
    </div>`;
}
