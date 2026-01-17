let activeCourt="all",activeCategory="all",allForms=[];
const categories={all:["all"],district:["all"],supreme:["all"]};
const searchInput=document.getElementById("searchInput");
const categoryFilters=document.getElementById("categoryFilters");
const formsList=document.getElementById("formsList");
const emptyState=document.getElementById("emptyState");

/* ===== Filters ===== */
function setCourt(c,b){
  activeCourt=c;activeCategory="all";
  document.querySelectorAll(".filter-btn").forEach(x=>x.classList.remove("active"));
  b.classList.add("active");
  renderCategoryButtons();applyFilters();
}
function setCategory(c,b){
  activeCategory=c;
  document.querySelectorAll("#categoryFilters .filter-btn").forEach(x=>x.classList.remove("active"));
  b.classList.add("active");applyFilters();
}
function renderCategoryButtons(){
  categoryFilters.innerHTML="<strong>Category:</strong><br>";
  (categories[activeCourt]||["all"]).forEach(c=>{
    const b=document.createElement("button");
    b.className="filter-btn"+(c==="all"?" active":"");
    b.textContent=c;
    b.onclick=()=>setCategory(c,b);
    categoryFilters.appendChild(b);
  });
}

/* ===== Search ===== */
function highlightText(t,q){
  if(!q)return t;
  return t.replace(new RegExp(`(${q})`,'gi'),'<span class="highlight">$1</span>');
}
function applyFilters(){
  const q=searchInput.value.toLowerCase();
  let v=0;
  document.querySelectorAll(".form-card").forEach(card=>{
    const t=card.dataset.title,d=card.dataset.desc;
    const ok=(activeCourt==="all"||card.dataset.court===activeCourt)
      &&(activeCategory==="all"||card.dataset.category===activeCategory)
      &&(t.toLowerCase().includes(q)||d.toLowerCase().includes(q));
    card.style.display=ok?"":"none";
    if(ok){
      v++;
      card.querySelector(".form-title").innerHTML=highlightText(t,q);
      card.querySelector(".form-desc").innerHTML=highlightText(d,q);
    }
  });
  emptyState.style.display=v?"none":"block";
}

/* ===== Render Forms ===== */
function renderForms(){
  formsList.innerHTML=emptyState.outerHTML;
  allForms.forEach(f=>{
    const d=document.createElement("div");
    d.className="form-card";
    d.dataset.title=f.title;
    d.dataset.desc=f.description;
    d.dataset.category=f.category;
    d.dataset.court=f.court;
    d.onclick=()=>window.open(f.url,"_blank");
    d.innerHTML=`
      <div>
        <div class="form-title">${f.title}</div>
        <div class="form-meta">${f.meta}</div>
        <div class="form-desc">${f.description}</div>
      </div>
      <a class="copy-btn" href="${f.url}" target="_blank" onclick="event.stopPropagation()">Open</a>`;
    formsList.appendChild(d);
  });
  renderCategoryButtons();applyFilters();
}

/* ===== CSV Load ===== */
Papa.parse(
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTaX3RHX7Xg10q0hs7sYOAOoUk_iPPYHD1UreZ0qdOSOoMbAFuWFnHZvGVxe-HIzSVr-BHCx3Hgn138/pub?output=csv",
{
  download:true,
  header:true,
  complete:(res)=>{
    allForms=res.data.map(r=>{
      const court=r.Level.toLowerCase().includes("district")?"district":"supreme";
      if(!categories[court].includes(r.Category.toLowerCase()))
        categories[court].push(r.Category.toLowerCase());
      return{
        title:r.Name,
        meta:`${r.Number} • ${r.Level}`,
        description:r.Description,
        category:r.Category.toLowerCase(),
        court,
        url:r.Link
      };
    });

    renderForms();

    /* Enable controls + remove skeletons */
    document.getElementById("controls").classList.remove("controls-disabled");
    document.getElementById("skeletons").remove();
  }
});
