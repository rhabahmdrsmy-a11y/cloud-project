"use strict";
const express = require("express");
const rateLimit = require("express-rate-limit");
const Feedback = require("../models/Feedback");
const adminAuth = require("../middleware/adminAuth");
const { parseFeedback } = require("../validators");

const router = express.Router();
const round1 = (n) => Math.round(n * 10) / 10;

// Limit submissions per IP to slow down spam.
const submitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many submissions. Please try again later." },
});

// POST /api/feedback  (public: students)
router.post("/", submitLimiter, async (req, res, next) => {
  try {
    const { value, error } = parseFeedback(req.body);
    if (error) return res.status(400).json({ success: false, message: error });

    const doc = await Feedback.create(value);
    res.status(201).json({ success: true, data: doc });
  } catch (err) {
    next(err);
  }
});

// GET /api/feedback  (dashboard)
router.get("/", adminAuth, async (_req, res, next) => {
  try {
    const data = await Feedback.find().sort({ createdAt: -1 }).lean();
    for (const d of data) delete d.__v;
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// GET /api/feedback/stats
router.get("/stats", adminAuth, async (_req, res, next) => {
  try {
    const [row] = await Feedback.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          avg: { $avg: "$ratings.overall" },
          courses: { $addToSet: "$courseCode" },
        },
      },
    ]);
    res.json({
      success: true,
      data: {
        totalSubmissions: row ? row.total : 0,
        overallAverage: row ? round1(row.avg) : 0,
        coursesEvaluated: row ? row.courses.length : 0,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/feedback/stats/courses
router.get("/stats/courses", adminAuth, async (_req, res, next) => {
  try {
    const rows = await Feedback.aggregate([
      { $sort: { createdAt: 1 } },
      {
        $group: {
          _id: "$courseCode",
          courseName: { $last: "$courseName" },
          averageRating: { $avg: "$ratings.overall" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    const data = rows.map((r) => ({
      courseCode: r._id,
      courseName: r.courseName,
      averageRating: round1(r.averageRating),
      count: r.count,
    }));
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
