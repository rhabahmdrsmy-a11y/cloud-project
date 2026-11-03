# Sphinx Student Feedback Portal: Frontend

HTML5, CSS3 and vanilla JavaScript. Icons: Font Awesome 6 (CDN). Charts: Chart.js 4.4.1 (CDN). Fonts: Google Fonts (DM Sans, Playfair Display). No build step. An internet connection is needed for the CDNs.

```
frontend/
├── index.html  courses.html  feedback.html  dashboard.html
├── css/   style.css (shared + welcome)  courses.css  feedback.css  dashboard.css
├── js/    config.js (API settings)  main.js (shared)  courses.js  feedback.js  dashboard.js
├── assets/images/  sphinx-logo-horizontal.png  sphinx-logo-vertical.png  sphinx-campus.png  (your supplied files)
├── assets/icons/   (empty: icons come from Font Awesome)
├── README.md
└── STUDY_GUIDE.md
```
Script order on every page: `config.js` > `main.js` > page script (`dashboard.html` loads Chart.js first).

## Run
Serve the folder (VS Code Live Server, or `python -m http.server 5500` inside `frontend/`) and open `index.html`. Start the backend at the URL in `js/config.js`.

**Development mode (no backend):** set `DEV_MODE: true` in `config.js`. A banner appears on every page. Submissions are kept only in the browser tab (sessionStorage) so you can see the dashboard work. There is **no** pre-filled sample data and **nothing is saved to a database**. Set it back to `false` for real integration.

## Backend integration
Change the base URL only in `js/config.js`. The backend must enable CORS (`app.use(require("cors")())`).

**POST /api/feedback** (`Content-Type: application/json`)
```json
{ "studentName": "Student Name", "studentId": "12345", "isAnonymous": false,
  "courseCode": "CSC322", "courseName": "Cloud Architecture and Computing",
  "ratings": { "overall": 5, "teaching": 4, "content": 5, "organization": 4 },
  "likedMost": "Practical explanations", "difficulties": "Some complex topics", "suggestions": "More practical examples" }
```
- If `isAnonymous` is true, the frontend sends `studentName` and `studentId` as empty strings.
- Ratings are numbers 1-5 and always present. The three text fields and name/ID may be empty strings. The backend must validate again.
- Success: any 2xx. Error: non-2xx with `{ "success": false, "message": "Readable reason" }` (the message is shown to the student).

**GET /api/feedback** returns every submission:
```json
{ "success": true, "data": [ { "_id": "...", "studentName": "", "studentId": "", "isAnonymous": true, "courseCode": "CSC322", "courseName": "Cloud Architecture and Computing", "ratings": { "overall": 5, "teaching": 4, "content": 5, "organization": 4 }, "likedMost": "", "difficulties": "", "suggestions": "", "createdAt": "2026-11-01T12:00:00.000Z" } ] }
```
**GET /api/feedback/stats**
```json
{ "success": true, "data": { "totalSubmissions": 12, "overallAverage": 4.3, "coursesEvaluated": 5 } }
```
**GET /api/feedback/stats/courses** (overall-rating average per course)
```json
{ "success": true, "data": [ { "courseCode": "CSC322", "courseName": "Cloud Architecture and Computing", "averageRating": 4.6, "count": 5 } ] }
```
The rating distribution chart is counted in the browser from `GET /api/feedback`, so it needs no extra endpoint. Empty collections should return `data: []` (and zeros for stats), not an error.

If the response shape differs: list/stats paths and names are read in `dashboard.js` `loadDashboard()`, `renderStats()`, `renderCharts()`, `createRow()`; the POST body is built in `feedback.js` `readValues()`; error text is read in `config.js` `apiRequest()`.

## Security note
The dashboard is a **demonstration interface with no authentication**. Before real-world use the backend must protect `GET /api/feedback*` (login/roles). All user text is rendered with `textContent`/text nodes, never `innerHTML`.

## Images
Your three supplied files are used unchanged (logos are never stretched; the campus photo is cropped with `object-fit`). No external photos were added because I could not verify external image URLs from my environment.

## Testing
**Checked automatically (jsdom, mocked `fetch`):** all 7 course cards render with correct links; navbar has 4 links; course from `?course=` is pre-selected; empty submit shows 4 errors and sends nothing; valid anonymous submit POSTs the exact JSON above and shows the success panel; dashboard renders rows and stats from mocked responses; HTML in a comment is shown as text; filter and empty/error/no-data states work; JS syntax OK.

**Not verifiable by me, please check in a browser:**
| Area | How | Expected |
|---|---|---|
| Visuals/animations | Open each page | Hero lines rise in; shield-framed photo floats; cards reveal on scroll; counters count up |
| Images and icons | Look for broken images or empty icon squares | Logos and photo show; icons visible (needs internet for Font Awesome) |
| Charts | Dashboard with data (DEV_MODE after submitting a few forms) | Bar charts draw |
| Stars | Hover and click | Stars fill left to right, pop animation, word appears (Poor...Excellent) |
| Responsive | DevTools at 1440, 1024, 768, 375 px | No sideways page scroll; menu button on mobile; table scrolls inside its card |
| Console | F12 > Console on all pages | No red errors |
| Reduced motion | OS "reduce motion" on | Animations skipped, content still visible |
