"use strict";
const mongoose = require("mongoose");

const rating = { type: Number, required: true, min: 1, max: 5, validate: Number.isInteger };

const feedbackSchema = new mongoose.Schema(
  {
    studentName: { type: String, default: "", trim: true, maxlength: 100 },
    studentId: { type: String, default: "", trim: true, maxlength: 30 },
    isAnonymous: { type: Boolean, default: false },
    courseCode: { type: String, required: true, trim: true, uppercase: true, maxlength: 20, index: true },
    courseName: { type: String, default: "", trim: true, maxlength: 150 },
    ratings: {
      overall: rating,
      teaching: rating,
      content: rating,
      organization: rating,
    },
    likedMost: { type: String, default: "", maxlength: 1000 },
    difficulties: { type: String, default: "", maxlength: 1000 },
    suggestions: { type: String, default: "", maxlength: 1000 },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: {
      transform(_doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

feedbackSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Feedback", feedbackSchema);
