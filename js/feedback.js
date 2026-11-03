/*
 * feedback.js: the course evaluation form.
 * Flow: read form -> validate -> build JSON -> POST /api/feedback -> show result.
 */
const CATEGORIES = [
  { key: "overall", label: "Overall course rating", icon: "fa-award" },
  { key: "teaching", label: "Teaching quality", icon: "fa-chalkboard-user" },
  { key: "content", label: "Course content", icon: "fa-book-open" },
  { key: "organization", label: "Course organization", icon: "fa-list-check" }
];
const RATING_WORDS = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];

const form = document.getElementById("feedback-form");
const courseSelect = document.getElementById("course-select");
const courseSummary = document.getElementById("course-summary");
const anonymousBox = document.getElementById("isAnonymous");
const submitBtn = document.getElementById("submit-btn");
const alertBox = document.getElementById("form-alert");
const successPanel = document.getElementById("success-panel");

/* ----- Build the page ----- */
COURSES.forEach((c) => courseSelect.add(new Option(`${c.code} \u2014 ${c.name}`, c.code)));
const preselected = new URLSearchParams(location.search).get("course");
if (getCourse(preselected)) courseSelect.value = preselected; // course chosen on courses.html

// Stars are listed 5 to 1 on purpose; CSS reverses them (see feedback.css).
document.getElementById("rating-groups").innerHTML = CATEGORIES.map((cat) => `
  <fieldset class="rating-group">
    <legend><i class="fa-solid ${cat.icon}"></i> ${cat.label} <span class="req">*</span></legend>
    <div class="rating-row">
      <div class="stars">
        ${[5, 4, 3, 2, 1].map((n) => `
          <input type="radio" name="rating-${cat.key}" id="${cat.key}-${n}" value="${n}">
          <label for="${cat.key}-${n}" title="${n} star${n > 1 ? "s" : ""}"><i class="fa-solid fa-star"></i><span class="sr-only">${n}</span></label>`).join("")}
      </div>
      <span class="rating-word" id="word-${cat.key}"></span>
    </div>
    <p class="field-error" id="err-${cat.key}"></p>
  </fieldset>`).join("");

function updateCourseSummary() {
  const course = getCourse(courseSelect.value);
  courseSummary.replaceChildren();
  if (!course) { courseSummary.append(createEl("span", "muted", "Choose a course to begin.")); return; }
  const icon = createEl("div", "ico");
  icon.innerHTML = `<i class="fa-solid ${course.icon}"></i>`;
  const text = createEl("div");
  text.append(createEl("strong", "", course.code), createEl("span", "", course.name));
  courseSummary.append(icon, text);
}
updateCourseSummary();

/* ----- Events ----- */
courseSelect.addEventListener("change", () => { updateCourseSummary(); clearError("course"); });

anonymousBox.addEventListener("change", () => {
  ["studentName", "studentId"].forEach((id) => {
    const input = document.getElementById(id);
    input.disabled = anonymousBox.checked;
    if (anonymousBox.checked) input.value = "";
  });
});

form.addEventListener("change", (event) => {
  const match = /^rating-(\w+)$/.exec(event.target.name || "");
  if (match) {
    document.getElementById("word-" + match[1]).textContent = RATING_WORDS[event.target.value];
    clearError(match[1]);
  }
});

function setError(key, message) {
  document.getElementById("err-" + key).textContent = message;
}
function clearError(key) { setError(key, ""); }

/* ----- Read + validate ----- */
function readValues() {
  const ratings = {};
  CATEGORIES.forEach((cat) => {
    const checked = form.querySelector(`input[name="rating-${cat.key}"]:checked`);
    ratings[cat.key] = checked ? Number(checked.value) : null;
  });
  const course = getCourse(courseSelect.value);
  const anonymous = anonymousBox.checked;
  return {
    studentName: anonymous ? "" : document.getElementById("studentName").value.trim(),
    studentId: anonymous ? "" : document.getElementById("studentId").value.trim(),
    isAnonymous: anonymous,
    courseCode: course ? course.code : "",
    courseName: course ? course.name : "",
    ratings,
    likedMost: document.getElementById("likedMost").value.trim(),
    difficulties: document.getElementById("difficulties").value.trim(),
    suggestions: document.getElementById("suggestions").value.trim()
  };
}

/** Returns a list of {key, message}; empty list means the form is valid. */
function validate(values) {
  const errors = [];
  if (!values.courseCode) errors.push({ key: "course", message: "Please select a course." });
  CATEGORIES.forEach((cat) => {
    if (!values.ratings[cat.key]) errors.push({ key: cat.key, message: "Please choose a rating from 1 to 5 stars." });
  });
  return errors;
}

function showAlert(message) {
  alertBox.textContent = message;
  alertBox.className = "alert error";
  alertBox.hidden = false;
}

function setLoading(isLoading) {
  submitBtn.disabled = isLoading;
  submitBtn.querySelector("i").className = isLoading ? "fa-solid fa-spinner" : "fa-solid fa-paper-plane";
  submitBtn.querySelector("span").textContent = isLoading ? "Submitting..." : "Submit Feedback";
}

/* ----- Submit ----- */
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  alertBox.hidden = true;

  const values = readValues();
  const errors = validate(values);
  ["course", ...CATEGORIES.map((c) => c.key)].forEach(clearError);
  errors.forEach((e) => setError(e.key, e.message));
  if (errors.length > 0) {
    const first = document.getElementById("err-" + errors[0].key);
    first.scrollIntoView({ behavior: REDUCED_MOTION ? "auto" : "smooth", block: "center" });
    return; // nothing is sent while the form is invalid
  }

  setLoading(true);
  try {
    await apiRequest("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values)
    });
    form.reset();                       // reset only after a successful response
    anonymousBox.dispatchEvent(new Event("change"));
    CATEGORIES.forEach((c) => { document.getElementById("word-" + c.key).textContent = ""; });
    updateCourseSummary();
    form.hidden = true;
    successPanel.hidden = false;
    window.scrollTo({ top: 0 });
  } catch (error) {
    showAlert(error.message);           // values are kept so the student can retry
  } finally {
    setLoading(false);
  }
});

document.getElementById("another-btn").addEventListener("click", () => {
  successPanel.hidden = true;
  form.hidden = false;
  courseSelect.value = "";
  updateCourseSummary();
});
