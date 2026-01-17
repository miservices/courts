/* =========================
   FORMS PAGE LOGIC
========================= */

let activeCourt = "all";
let activeCategory = "all";
let allForms = [];

const categories = {
  all: ["all"],
  district: ["all"],
  supreme: ["all"]
};

/* ---------- FILTERS ---------- */
document.querySelectorAll("[data-court]").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("[data-court]").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    activeCourt = btn.dataset.court;
    activeCategory = "all";
    renderCategoryButtons();
    applyFilters();
  });
});

function setCategory(category, button) {
  activeCategory = category;
  document.querySelectorAll("#categoryFilters .filter-btn")
    .forEach(b => b.classList.remove("active"));
  button.classList.add("active");
  applyFilters();
}

function renderCategoryButtons() {
  const wrap = $("categoryFilters");
  wrap.innerHTML = "<strong>Category:</strong><br>";

  (categories[activeCourt] || ["all"]).forEach(cat => {
    const btn = document.createElement("button");
    btn.className = "filter-btn" + (cat === "all" ? " active" : "");
    btn.textContent = cat;
    btn.onclick = () => setCategory(cat, btn);
    wrap.appendChild(btn);
  });
}

/* ---------- SEARCH ---------- */
$("searchInput").addEventListener("keyup", applyFilters);

function highlightText(text, query) {
  if (!query) return text;
  return text.replace(new RegExp(`(${query})`, "gi"), `<span class="highlight">$1</span>`);
}

function applyFilters() {
  const q = $("searchInput").value.toLowerCase();
  let visible = 0;

  document.querySelectorAll(".form-card").forEach(card => {
    const title = card.dataset.title;
    const desc = card.dataset.desc;

    const match =
      (activeCourt === "all" || card.dataset.court === activeCourt) &&
      (activeCategory === "all" || card.dataset.category === activeCategory) &&
      (title.toLowerCase().includes(q) || desc.toLowerCase().includes(q));

    card.style.display = match ? "" : "none";

    if (match) {
      visible++;
      card.querySelector(".form-title").innerHTML = highlightText(title, q);
      card.querySelector(".form-desc").innerHTML = highlightText(desc, q);
    }
  });

  $("emptyState").style.display = visible ? "none" : "block";
}

/* ---------- RENDER ---------- */
function renderForms() {
  const list = $("formsList");
  list.innerHTML = $("emptyState").outerHTML;

  allForms.forEach(f => {
    const card = document.createElement("div");
    card.className = "form-card card";
    card.dataset.title = f.title;
    card.dataset.desc = f.description;
    card.dataset.category = f.category;
    card.dataset.court = f.court;

    card.onclick = () => openExternal(f.url);

    card.innerHTML = `
      <div>
        <div class="form-title">${f.title}</div>
        <div class="form-meta">${f.meta}</div>
        <div class="form-desc">${f.description}</div>
      </div>
      <a class="copy-btn" href="${f.url}" target="_blank" onclick="event.stopPropagation()">Open</a>
    `;

    list.appendChild(card);
  });

  renderCategoryButtons();
  applyFilters();
}

/* ---------- CSV LOAD ---------- */
Papa.parse(
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTaX3RHX7Xg10q0hs7sYOAOoUk_iPPYHD1UreZ0qdOSOoMbAFuWFnHZvGVxe-HIzSVr-BHCx3Hgn138/pub?output=csv",
  {
    download: true,
    header: true,
    complete: (res) => {
      allForms = res.data.map(r => {
        const court = r.Level.toLowerCase().includes("district") ? "district" : "supreme";
        const cat = r.Category.toLowerCase();

        if (!categories[court].includes(cat)) {
          categories[court].push(cat);
        }

        return {
          title: r.Name,
          meta: `${r.Number} • ${r.Level}`,
          description: r.Description,
          category: cat,
          court,
          url: r.Link
        };
      });

      renderForms();
      $("controls").classList.remove("controls-disabled");
      $("skeletons").remove();
    }
  }
);
