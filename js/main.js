/*
 * main.js: shared by every page.
 * Course data, navbar/footer, scroll reveal, counters and page transitions.
 */
const REDUCED_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// The seven courses (single source of truth for all pages). Icons are Font Awesome classes.
const COURSES = [
  { code: "CSC322", name: "Cloud Architecture and Computing", icon: "fa-cloud", accent: "#F58220",
    desc: "Designing scalable, distributed systems and services that run in the cloud." },
  { code: "GEN211", name: "Intellectual Property", icon: "fa-copyright", accent: "#333333",
    desc: "How creative and technical work is protected: copyrights, patents and trademarks." },
  { code: "AI314", name: "Agent Based Systems", icon: "fa-robot", accent: "#D96A0B",
    desc: "Autonomous agents that perceive, decide and cooperate to solve problems." },
  { code: "AI315", name: "Computational Cognitive Science", icon: "fa-brain", accent: "#E39A2D",
    desc: "Modelling how minds process information using computational methods." },
  { code: "AIE42", name: "Software Architecture and Interoperability", icon: "fa-network-wired", accent: "#B85410",
    desc: "Structuring large software systems so separate components work together." },
  { code: "BAS212", name: "Operations Research", icon: "fa-calculator", accent: "#555555",
    desc: "Mathematical modelling and optimization for better decisions." },
  { code: "CSC313", name: "Computer Graphics and Vision", icon: "fa-eye", accent: "#F58220",
    desc: "How computers create, process and interpret images and visual scenes." }
];

function getCourse(code) {
  return COURSES.find((course) => course.code === code) || null;
}

/** Builds the navbar and footer from static, trusted strings. */
function renderLayout() {
  const page = document.body.dataset.page;
  const links = [
    ["index.html", "home", "fa-house", "Home"],
    ["courses.html", "courses", "fa-book-open", "Courses"],
    ["feedback.html", "feedback", "fa-pen-to-square", "Give Feedback"],
    ["dashboard.html", "dashboard", "fa-chart-column", "Dashboard"]
  ];
  const header = document.getElementById("site-header");
  if (header) {
    header.className = "navbar";
    header.innerHTML = `
      <div class="container nav-inner">
        <a class="brand" href="index.html"><img src="assets/images/sphinx-logo-horizontal.png" alt="Sphinx University"></a>
        <button class="nav-toggle" type="button" aria-label="Toggle menu" aria-expanded="false"><i class="fa-solid fa-bars"></i></button>
        <nav class="nav-links" id="nav-links">
          ${links.map(([href, key, icon, label]) =>
            `<a href="${href}" class="${key === page ? "active" : ""}"${key === page ? ' aria-current="page"' : ""}><i class="fa-solid ${icon}"></i>${label}</a>`).join("")}
        </nav>
      </div>`;
    const toggle = header.querySelector(".nav-toggle");
    const nav = header.querySelector(".nav-links");
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    if (CONFIG.DEV_MODE) {
      const banner = document.createElement("div");
      banner.className = "dev-banner";
      banner.textContent = "DEVELOPMENT MODE: data is stored only in this browser tab. Nothing is saved to the database.";
      header.insertAdjacentElement("afterend", banner);
    }
  }
  const footer = document.getElementById("site-footer");
  if (footer) {
    footer.className = "site-footer";
    footer.innerHTML = `
      <div class="container">
        <div class="footer-grid">
          <img class="footer-logo" src="assets/images/sphinx-logo-horizontal.png" alt="Sphinx University">
          <nav class="footer-links">
            ${links.map(([href, , icon, label]) => `<a href="${href}"><i class="fa-solid ${icon}"></i> ${label}</a>`).join("")}
            <a href="https://www.sphinx.edu.eg" target="_blank" rel="noopener"><i class="fa-solid fa-globe"></i> www.sphinx.edu.eg</a>
          </nav>
        </div>
        <p class="footer-note"><i class="fa-regular fa-copyright"></i> Sphinx University Student Feedback Portal. University project.</p>
      </div>`;
  }
}

/** Fades elements in when they scroll into view (.reveal). Call again after adding new ones. */
let revealObserver = null;
function observeReveal(root = document) {
  const items = root.querySelectorAll(".reveal:not(.in)");
  if (!("IntersectionObserver" in window)) { items.forEach((el) => el.classList.add("in")); return; }
  if (!revealObserver) {
    revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { entry.target.classList.add("in"); revealObserver.unobserve(entry.target); }
      });
    }, { threshold: 0.12 });
  }
  items.forEach((el) => revealObserver.observe(el));
}

/** Counts a number up inside an element. */
function animateValue(el, target, decimals = 0, duration = 1100) {
  if (REDUCED_MOTION) { el.textContent = target.toFixed(decimals); return; }
  const startTime = performance.now();
  function step(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = (target * eased).toFixed(decimals);
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

/** Elements with data-count start counting when visible. */
function setupCounters() {
  const counters = document.querySelectorAll("[data-count]");
  if (!("IntersectionObserver" in window)) { counters.forEach((el) => { el.textContent = el.dataset.count; }); return; }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animateValue(entry.target, Number(entry.target.dataset.count));
        observer.unobserve(entry.target);
      }
    });
  });
  counters.forEach((el) => observer.observe(el));
}

/** Short fade-out before navigating to another page of this site. */
function setupPageTransitions() {
  document.addEventListener("click", (event) => {
    const link = event.target.closest("a[href]");
    if (!link || link.target || event.metaKey || event.ctrlKey || REDUCED_MOTION) return;
    const url = new URL(link.href, location.href);
    if (url.origin !== location.origin || (url.pathname === location.pathname && url.hash)) return;
    event.preventDefault();
    document.body.classList.add("leaving");
    setTimeout(() => { location.href = link.href; }, 200);
  });
  window.addEventListener("pageshow", () => document.body.classList.remove("leaving"));
}

/** Small helper: creates an element with optional class and text (safe, uses textContent). */
function createEl(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}

renderLayout();
observeReveal();
setupCounters();
setupPageTransitions();
