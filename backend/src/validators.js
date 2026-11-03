"use strict";

const { COURSES } = require("./courses");

const RATING_KEYS = ["overall", "teaching", "content", "organization"];
const TEXT_KEYS = ["likedMost", "difficulties", "suggestions"];
const MAX_TEXT = 1000;

const clean = (v) => (typeof v === "string" ? v.trim() : "");

/**
 * Validates and normalises a feedback payload.
 * Returns { value } on success or { error: "readable message" } on failure.
 * Never trusts the browser: the frontend validates too, but it can be bypassed.
 */
function parseFeedback(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "Request body must be a JSON object." };
  }

  const courseCode = clean(body.courseCode).toUpperCase();
  if (!courseCode) return { error: "Please select a course." };
  if (!Object.prototype.hasOwnProperty.call(COURSES, courseCode)) {
    return { error: "Unknown course. Please choose a course from the list." };
  }
  const courseName = COURSES[courseCode]; // never trust the client's course name

  const r = body.ratings;
  if (!r || typeof r !== "object" || Array.isArray(r)) {
    return { error: "Please rate all four categories." };
  }
  const ratings = {};
  for (const key of RATING_KEYS) {
    const n = r[key];
    if (typeof n !== "number" || !Number.isInteger(n) || n < 1 || n > 5) {
      return { error: `Rating "${key}" must be a whole number from 1 to 5.` };
    }
    ratings[key] = n;
  }

  const value = {
    courseCode,
    courseName,
    ratings,
    isAnonymous: body.isAnonymous === true,
    studentName: clean(body.studentName),
    studentId: clean(body.studentId),
  };

  if (value.studentName.length > 100) return { error: "Student name is too long." };
  if (value.studentId.length > 30) return { error: "Student ID is too long." };

  for (const key of TEXT_KEYS) {
    const t = clean(body[key]);
    if (t.length > MAX_TEXT) return { error: `"${key}" must be at most ${MAX_TEXT} characters.` };
    value[key] = t;
  }

  // Anonymous means anonymous: even if a client sends a name, we never store it.
  if (value.isAnonymous) {
    value.studentName = "";
    value.studentId = "";
  }

  return { value };
}

module.exports = { parseFeedback, RATING_KEYS, TEXT_KEYS };
