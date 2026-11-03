/* courses.js: draws the seven course cards from COURSES (main.js). */
const courseGrid = document.getElementById("course-grid");

COURSES.forEach((course, index) => {
  const card = document.createElement("article");
  card.className = "course-card reveal";
  card.style.setProperty("--accent", course.accent);
  card.style.setProperty("--delay", index * 70 + "ms");
  // COURSES is our own static data (not user input), so innerHTML is safe here.
  card.innerHTML = `
    <div class="course-icon"><i class="fa-solid ${course.icon}"></i></div>
    <span class="course-code">${course.code}</span>
    <h3>${course.name}</h3>
    <p>${course.desc}</p>
    <a class="btn btn-primary" href="feedback.html?course=${course.code}"><i class="fa-solid fa-star"></i> Rate This Course</a>`;
  courseGrid.appendChild(card);
});
observeReveal(courseGrid);
