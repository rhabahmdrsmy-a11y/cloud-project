"use strict";
const assert = require("assert");
const { parseFeedback } = require("../src/validators");

const good = {
  studentName: " Sara ", studentId: "123", isAnonymous: false,
  courseCode: "csc322", courseName: "Cloud Architecture and Computing",
  ratings: { overall: 5, teaching: 4, content: 5, organization: 4 },
  likedMost: "Practical", difficulties: "", suggestions: "More labs",
};

// valid payload is normalised
let r = parseFeedback(good);
assert.ok(!r.error);
assert.strictEqual(r.value.courseCode, "CSC322");
assert.strictEqual(r.value.studentName, "Sara");

// course name comes from the server list, not the client
r = parseFeedback({ ...good, courseName: "Hacked name" });
assert.strictEqual(r.value.courseName, "Cloud Architecture and Computing");

// every real course code from the frontend is accepted
for (const code of ["CSC322","GEN211","AI314","AI315","AIE42","BAS212","CSC313"]) {
  assert.ok(!parseFeedback({ ...good, courseCode: code }).error, code);
}

// anonymous wipes identity even if client sent it
r = parseFeedback({ ...good, isAnonymous: true });
assert.strictEqual(r.value.studentName, "");
assert.strictEqual(r.value.studentId, "");

// bad inputs
const bad = [
  null, [], "x",
  { ...good, courseCode: "" },
  { ...good, courseCode: "<script>" },
  { ...good, courseCode: "XYZ999" },
  { ...good, courseCode: "__proto__" },
  { ...good, courseCode: "constructor" },
  { ...good, ratings: undefined },
  { ...good, ratings: { ...good.ratings, overall: 0 } },
  { ...good, ratings: { ...good.ratings, teaching: 6 } },
  { ...good, ratings: { ...good.ratings, content: 3.5 } },
  { ...good, ratings: { ...good.ratings, organization: "5" } },
  { ...good, likedMost: "x".repeat(1001) },
];
for (const b of bad) assert.ok(parseFeedback(b).error, "should reject " + JSON.stringify(b));

console.log("validators: all tests passed");
