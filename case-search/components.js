/* Michigan Courts — Shared Components */
(function () {
  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const navLinks = [
    { href: 'index.html', label: 'Home',                key: 'home' },
    { href: 'cases.html', label: 'Case Search',          key: 'cases' },
    { href: '#',          label: 'Court Finder',          key: 'finder' },
    { href: '#',          label: 'Opinions & Orders',     key: 'opinions' },
    { href: '#',          label: 'Forms & Filing',        key: 'forms' },
    { href: '#',          label: 'Judges & Justices',     key: 'judges' },
  ];
  const activePage = document.body.dataset.nav || '';
  const navHTML = navLinks.map(l =>
    `<a href="${l.href}" class="mc-nav-link${l.key === activePage ? ' mc-active' : ''}">${l.label}</a>`
  ).join('');

  document.getElementById('site-top').outerHTML = `
    <div class="mc-banner">This site is not a real court, does not have legal authority, and is not affiliated with or endorsed by any real court system or government agency.</div>
    <div class="mc-header">
      <div class="mc-header-top">
        <div><h1 class="mc-site-title">Michigan Courts</h1><p class="mc-site-sub">State Court Administrative Office</p></div>
        <div class="mc-header-right"><p class="mc-portal-label">Official Judicial Portal</p><div class="mc-date">${today}</div></div>
      </div>
      <nav class="mc-nav">${navHTML}<div class="mc-nav-right"><a href="cases.html" class="mc-nav-btn">Search Cases ›</a></div></nav>
    </div>`;

  document.getElementById('site-footer').outerHTML = `
    <div class="mc-footer">
      <p class="mc-footer-copy">© ${new Date().getFullYear()} Michigan Courts · State Court Administrative Office · P.O. Box 30048, Lansing, MI 48909</p>
      <a class="mc-footer-link" href="index.html">← Return to Home</a>
    </div>`;

  document.head.insertAdjacentHTML('beforeend', `<style id="mc-shared-css">
    .mc-banner{background:#111827!important;color:#9ca3af!important;text-align:center;padding:9px 20px;font-size:11.5px;font-family:'DM Sans',sans-serif;letter-spacing:.01em;border-bottom:1px solid #1f2937;line-height:1.5}
    .mc-header{background:#0a1628}
    .mc-header-top{display:flex;align-items:center;justify-content:space-between;padding:22px 40px 18px;border-bottom:1px solid #1e3a5f}
    .mc-site-title{font-family:'Merriweather',serif!important;color:#fff!important;font-size:22px;font-weight:300;letter-spacing:.01em;margin:0}
    .mc-site-sub{color:#7a9bbf!important;font-size:11px;font-family:'DM Sans',sans-serif;letter-spacing:.12em;text-transform:uppercase;margin:3px 0 0}
    .mc-header-right{text-align:right}
    .mc-portal-label{color:#7a9bbf!important;font-size:11px;font-family:'DM Sans',sans-serif;letter-spacing:.06em;text-transform:uppercase;margin:0}
    .mc-date{color:#c8a84b!important;font-size:13px;margin-top:3px;font-family:'DM Sans',sans-serif}
    .mc-nav{background:#0d1f3c;display:flex;align-items:center;padding:0 40px}
    .mc-nav-link{color:#a0b8d0!important;font-size:12.5px;font-family:'DM Sans',sans-serif;padding:14px 18px;text-decoration:none!important;letter-spacing:.04em;border-bottom:3px solid transparent;transition:color .15s,border-color .15s;display:inline-block}
    .mc-nav-link:hover{color:#fff!important;border-bottom-color:#c8a84b}
    .mc-active{color:#fff!important;border-bottom-color:#c8a84b!important}
    .mc-nav-right{margin-left:auto}
    .mc-nav-btn{background:#c8a84b!important;color:#0a1628!important;padding:8px 18px;border-radius:3px;font-size:12px;font-weight:600;font-family:'DM Sans',sans-serif;letter-spacing:.05em;text-decoration:none!important;border-bottom:none!important;display:inline-block}
    .mc-nav-btn:hover{background:#d4b85e!important}
    .mc-footer{background:#0a1628;padding:24px 40px;display:flex;justify-content:space-between;align-items:center;border-top:3px solid #c8a84b;margin-top:40px;font-family:'DM Sans',sans-serif}
    .mc-footer-copy{color:#4a6a8a!important;font-size:12px;margin:0}
    .mc-footer-link{color:#4a6a8a!important;text-decoration:none;font-size:12px}
    .mc-footer-link:hover{color:#7a9bbf!important}
  </style>`);
})();
