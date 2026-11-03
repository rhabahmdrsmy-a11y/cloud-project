/*
 * config.js: the ONLY place for API settings. Loaded first on every page.
 */
const CONFIG = {
  // Change to the deployed backend URL later, e.g. "https://your-api.example.com".
  // Use "" if the backend serves these files from the same address.
  API_BASE_URL: "http://localhost:5000",

  // Development mode: no backend needed. Submissions are kept ONLY in this browser tab
  // (sessionStorage) and a banner is shown on every page. Nothing is sent to a database.
  // Set to false when the backend is ready.
  DEV_MODE: false
};

/**
 * Calls the backend and returns the parsed JSON body.
 * Throws an Error with a readable message on network or HTTP errors.
 */
async function apiRequest(path, options = {}) {
  if (CONFIG.DEV_MODE) return devApi(path, options);

  let response;
  try {
    response = await fetch(CONFIG.API_BASE_URL + path, options);
  } catch (networkError) {
    throw new Error("Cannot reach the server. Check your connection and try again.");
  }

  let body = null;
  try { body = await response.json(); } catch (parseError) { /* no JSON body */ }

  if (!response.ok) {
    throw new Error((body && body.message) || `Server error (${response.status}). Please try again.`);
  }
  if (!body) throw new Error("The server returned an unreadable response.");
  return body;
}

/* ---------- Development mode only ---------- */
function devLoad() {
  try { return JSON.parse(sessionStorage.getItem("devFeedback") || "[]"); } catch (e) { return []; }
}

async function devApi(path, options) {
  await new Promise((resolve) => setTimeout(resolve, 500)); // simulate network delay
  const method = (options.method || "GET").toUpperCase();
  const store = devLoad();

  if (path === "/api/feedback" && method === "POST") {
    const item = JSON.parse(options.body);
    store.unshift({ ...item, _id: "dev-" + Date.now(), createdAt: new Date().toISOString() });
    sessionStorage.setItem("devFeedback", JSON.stringify(store));
    return { success: true, data: item };
  }
  if (path === "/api/feedback") return { success: true, data: store };
  if (path === "/api/feedback/stats") {
    const total = store.length;
    const sum = store.reduce((acc, f) => acc + f.ratings.overall, 0);
    return { success: true, data: {
      totalSubmissions: total,
      overallAverage: total ? sum / total : 0,
      coursesEvaluated: new Set(store.map((f) => f.courseCode)).size
    } };
  }
  if (path === "/api/feedback/stats/courses") {
    const groups = {};
    store.forEach((f) => {
      groups[f.courseCode] = groups[f.courseCode] || { courseCode: f.courseCode, courseName: f.courseName, sum: 0, count: 0 };
      groups[f.courseCode].sum += f.ratings.overall;
      groups[f.courseCode].count += 1;
    });
    return { success: true, data: Object.values(groups).map((g) => ({
      courseCode: g.courseCode, courseName: g.courseName, averageRating: g.sum / g.count, count: g.count
    })) };
  }
  throw new Error("Unknown endpoint in development mode.");
}
