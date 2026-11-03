"use strict";
const fs = require("fs");
const path = require("path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const feedbackRoutes = require("./routes/feedback");

const app = express();

app.disable("x-powered-by");
// Behind a hosting proxy (Render, Railway...) set TRUST_PROXY=1 so rate limiting sees real client IPs.
if (process.env.TRUST_PROXY) app.set("trust proxy", Number(process.env.TRUST_PROXY) || true);

// CSP written for this frontend: Font Awesome + Chart.js from cdnjs, Google Fonts,
// and the one inline script in each page head (allowed by its hash, not by 'unsafe-inline').
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "script-src": ["'self'", "https://cdnjs.cloudflare.com", "'sha256-qOhFsq0QMV2REqNwk5hGH5bZE9SkX6gt6yeyKdYPv+U='"],
        "style-src": ["'self'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
        "style-src-attr": ["'unsafe-inline'"], // a few style="--i:0" attributes in index.html
        "font-src": ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com", "data:"],
        "img-src": ["'self'", "data:"],
        "upgrade-insecure-requests": null, // would break plain http://localhost
      },
    },
  })
);

const origins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
app.use(cors({ origin: origins.length ? origins : true }));

app.use(express.json({ limit: "20kb" }));

app.get("/api/health", (_req, res) => res.json({ success: true, status: "ok" }));
app.use("/api/feedback", feedbackRoutes);
app.use("/api", (_req, res) => res.status(404).json({ success: false, message: "Not found." }));

/**
 * Serves the frontend from the same server (open http://localhost:5000).
 * Only the 4 pages and the css/js/assets folders are exposed, so backend files
 * (.env, package.json, source code) can never be downloaded, wherever the folders live.
 * Default location: the folder that contains the backend folder; override with FRONTEND_DIR.
 */
function mountFrontend() {
  const backendRoot = path.resolve(__dirname, "..");
  const dir = path.resolve(backendRoot, process.env.FRONTEND_DIR || "..");
  if (!fs.existsSync(path.join(dir, "index.html"))) return null;

  for (const sub of ["css", "js", "assets"]) app.use("/" + sub, express.static(path.join(dir, sub)));
  for (const page of ["index", "courses", "feedback", "dashboard"]) {
    const file = path.join(dir, page + ".html");
    app.get("/" + page + ".html", (_req, res) => res.sendFile(file));
  }
  app.get("/", (_req, res) => res.sendFile(path.join(dir, "index.html")));
  return dir;
}
app.locals.frontendDir = mountFrontend();

app.use((_req, res) => res.status(404).json({ success: false, message: "Not found." }));

// Central error handler: always JSON, never leaks stack traces.
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ success: false, message: "Invalid JSON in request body." });
  }
  if (err.type === "entity.too.large") {
    return res.status(413).json({ success: false, message: "Request is too large." });
  }
  if (err.name === "ValidationError") {
    return res.status(400).json({ success: false, message: "Invalid feedback data." });
  }
  console.error(err);
  res.status(500).json({ success: false, message: "Something went wrong on the server. Please try again." });
});

module.exports = app;
