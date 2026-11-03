"use strict";
const crypto = require("crypto");

/**
 * Protects the read endpoints (dashboard data).
 * Enabled only when ADMIN_API_KEY is set, so the current demo dashboard keeps working.
 * Before real use: set the key AND add a login to the dashboard that sends x-api-key
 * (or replace this with proper JWT/session auth).
 */
function adminAuth(req, res, next) {
  const expected = process.env.ADMIN_API_KEY;
  if (!expected) return next();

  const provided = String(req.get("x-api-key") || "");
  const a = crypto.createHash("sha256").update(provided).digest();
  const b = crypto.createHash("sha256").update(expected).digest();
  if (crypto.timingSafeEqual(a, b)) return next();

  return res.status(401).json({ success: false, message: "Unauthorized." });
}

module.exports = adminAuth;
