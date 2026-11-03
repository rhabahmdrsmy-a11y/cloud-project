/*
 * dashboard.js: loads real data from the backend and draws cards, charts and the table.
 * Endpoints: GET /api/feedback, /api/feedback/stats, /api/feedback/stats/courses
 */
const stateBox = document.getElementById("dash-state");
const content = document.getElementById("dash-content");
const filterSelect = document.getElementById("course-filter");
const tableBody = document.getElementById("feedback-body");
const tableWrap = document.getElementById("table-wrap");
const tableEmpty = document.getElementById("table-empty");
const tableCount = document.getElementById("table-count");

let allFeedback = [];
let courseChart = null;
let distributionChart = null;

/* Course filter options come from COURSES (main.js) */
COURSES.forEach((c) => filterSelect.add(new Option(`${c.code} \u2014 ${c.name}`, c.code)));

/* ----- States ----- */
function showState(type, message, withRetry) {
  content.hidden = true;
  stateBox.className = "state-box " + type;
  stateBox.replaceChildren();
  if (type === "loading") stateBox.append(createEl("div", "spinner"));
  else if (type === "empty") {
    const logo = createEl("img", "state-logo");
    logo.src = "assets/images/sphinx-logo-vertical.png";
    logo.alt = "Sphinx University";
    stateBox.append(logo);
  } else stateBox.innerHTML = '<div class="state-icon"><i class="fa-solid fa-circle-exclamation"></i></div>';
  stateBox.append(createEl("p", "", message));
  if (type === "empty") {
    const link = createEl("a", "btn btn-primary", "Open the courses page");
    link.href = "courses.html";
    stateBox.append(link);
  }
  if (withRetry) {
    const retry = createEl("button", "btn btn-primary", "Try again");
    retry.type = "button";
    retry.addEventListener("click", loadDashboard);
    stateBox.append(retry);
  }
}

/* ----- Rendering helpers ----- */
function ratingBadge(value) {
  const badge = createEl("span", "badge");
  badge.append(createEl("i", "fa-solid fa-star"), document.createTextNode(String(value)));
  return badge;
}

function formatDate(iso) {
  const date = new Date(iso);
  return isNaN(date) ? "Unknown" : date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function renderStats(stats) {
  animateValue(document.getElementById("stat-total"), Number(stats.totalSubmissions) || 0, 0);
  animateValue(document.getElementById("stat-average"), Number(stats.overallAverage) || 0, 1);
  animateValue(document.getElementById("stat-courses"), Number(stats.coursesEvaluated) || 0, 0);
}

function renderCharts(courseStats) {
  if (typeof Chart === "undefined") {
    document.querySelectorAll(".chart-box").forEach((box) => box.replaceChildren(createEl("p", "muted", "Charts could not load (Chart.js CDN unreachable).")));
    return;
  }
  Chart.defaults.font.family = '"DM Sans", system-ui, sans-serif';
  if (courseChart) courseChart.destroy();
  if (distributionChart) distributionChart.destroy();

  courseChart = new Chart(document.getElementById("chart-courses"), {
    type: "bar",
    data: { labels: courseStats.map((c) => c.courseCode),
      datasets: [{ label: "Average overall rating", data: courseStats.map((c) => Number(c.averageRating.toFixed(2))), backgroundColor: "#F58220", borderRadius: 6 }] },
    options: { responsive: true, maintainAspectRatio: false, indexAxis: "y",
      scales: { x: { min: 0, max: 5 } },
      plugins: { legend: { display: false }, tooltip: { callbacks: { title: (items) => courseStats[items[0].dataIndex].courseName } } } }
  });

  // Rating distribution: how many submissions gave 1..5 stars overall (counted from backend records)
  const counts = [1, 2, 3, 4, 5].map((n) => allFeedback.filter((f) => f.ratings && f.ratings.overall === n).length);
  distributionChart = new Chart(document.getElementById("chart-distribution"), {
    type: "bar",
    data: { labels: ["1 star", "2 stars", "3 stars", "4 stars", "5 stars"],
      datasets: [{ label: "Submissions", data: counts, backgroundColor: ["#333333", "#555555", "#E39A2D", "#F58220", "#C96510"], borderRadius: 6 }] },
    options: { responsive: true, maintainAspectRatio: false,
      scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }, plugins: { legend: { display: false } } }
  });
}

function renderComparison(courseStats) {
  const box = document.getElementById("comparison");
  box.replaceChildren();
  [...courseStats].sort((a, b) => b.averageRating - a.averageRating).forEach((c) => {
    const row = createEl("div", "cmp-row");
    const label = createEl("div");
    label.append(createEl("strong", "", c.courseCode), document.createTextNode(" " + c.courseName));
    const bar = createEl("div", "cmp-bar");
    const fill = createEl("div", "cmp-fill");
    bar.append(fill);
    const value = createEl("div");
    value.append(createEl("strong", "", c.averageRating.toFixed(1)), createEl("small", "", ` (${c.count})`));
    row.append(label, bar, value);
    box.append(row);
    requestAnimationFrame(() => { fill.style.width = (c.averageRating / 5) * 100 + "%"; });
  });
}

function createRow(item) {
  const row = document.createElement("tr");
  const r = item.ratings || {};

  const courseCell = createEl("td");
  courseCell.append(createEl("span", "cell-code", item.courseCode), document.createTextNode(item.courseName));
  row.append(courseCell);

  ["overall", "teaching", "content", "organization"].forEach((key) => {
    const cell = createEl("td");
    cell.append(ratingBadge(r[key] ?? "-"));
    row.append(cell);
  });

  const commentCell = createEl("td");
  [["Liked", item.likedMost], ["Difficulties", item.difficulties], ["Suggestions", item.suggestions]].forEach(([label, text]) => {
    if (!text) return;
    const line = createEl("span", "comment");
    line.append(createEl("b", "", label + ": "), document.createTextNode(text)); // text nodes: safe
    commentCell.append(line);
  });
  if (!commentCell.hasChildNodes()) commentCell.append(createEl("span", "muted", "No comments"));
  row.append(commentCell);

  const studentCell = createEl("td");
  if (item.isAnonymous) studentCell.append(createEl("span", "pill-anon", "Anonymous"));
  else studentCell.textContent = [item.studentName, item.studentId].filter(Boolean).join(" \u00b7 ") || "Not provided";
  row.append(studentCell);

  row.append(createEl("td", "", formatDate(item.createdAt)));
  return row;
}

function renderTable() {
  const code = filterSelect.value;
  const visible = code ? allFeedback.filter((f) => f.courseCode === code) : allFeedback;
  tableCount.textContent = `Showing ${visible.length} of ${allFeedback.length} submissions`;
  if (visible.length === 0) tableBody.replaceChildren();
  tableWrap.hidden = visible.length === 0;
  tableEmpty.hidden = visible.length !== 0;
  if (visible.length === 0) {
    tableEmpty.replaceChildren(createEl("div", "state-icon"), createEl("p", "", "No feedback for this course yet."));
    tableEmpty.firstChild.innerHTML = '<i class="fa-regular fa-folder-open"></i>';
    return;
  }
  tableBody.replaceChildren(...visible.map(createRow));
}

/* ----- Load ----- */
async function loadDashboard() {
  showState("loading", "Loading dashboard...");
  try {
    const [list, stats, perCourse] = await Promise.all([
      apiRequest("/api/feedback"),
      apiRequest("/api/feedback/stats"),
      apiRequest("/api/feedback/stats/courses")
    ]);
    if (!Array.isArray(list.data) || !stats.data || !Array.isArray(perCourse.data)) {
      throw new Error("The server response does not have the expected format.");
    }
    allFeedback = list.data;
    if (allFeedback.length === 0) {
      showState("empty", "No feedback has been submitted yet. Results will appear here once students start rating courses.");
      return;
    }
    stateBox.className = "state-box";
    stateBox.replaceChildren();
    content.hidden = false;
    renderStats(stats.data);
    renderCharts(perCourse.data);
    renderComparison(perCourse.data);
    renderTable();
  } catch (error) {
    showState("error", "Could not load the dashboard. " + error.message, true);
  }
}

filterSelect.addEventListener("change", renderTable);
loadDashboard();
