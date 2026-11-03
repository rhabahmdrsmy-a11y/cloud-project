"use strict";
require("dotenv").config();
const mongoose = require("mongoose");
const app = require("./src/app");

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/sphinx_feedback";

async function start() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  }

  if (!process.env.ADMIN_API_KEY) {
    console.warn("WARNING: ADMIN_API_KEY is not set. GET /api/feedback* is public (demo mode).");
  }

  app.listen(PORT, () => {
    console.log(`API running on http://localhost:${PORT}`);
    if (app.locals.frontendDir) console.log(`Website:       http://localhost:${PORT}  (serving ${app.locals.frontendDir})`);
    else console.log("Frontend not found next to the backend folder: open it with Live Server, or set FRONTEND_DIR in .env.");
  });
}

start();
