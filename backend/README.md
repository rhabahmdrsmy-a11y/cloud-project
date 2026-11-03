# Sphinx Student Feedback Portal: Backend

Node.js + Express + MongoDB (Mongoose). Implements exactly the API described in the frontend README.

## Where to put it
Put the `backend` folder **inside** the frontend project folder, next to `index.html`:
```
sphinx-student-feedback-portal/
├── index.html  courses.html  feedback.html  dashboard.html
├── css/  js/  assets/
└── backend/        <- this folder
```

## Run
```
cd backend
npm install
copy .env.example .env      (Mac/Linux: cp .env.example .env)
npm start
```
Then open **http://localhost:5000**. The same server serves the website and the API, so there is no CORS or Live Server setup. `js/config.js` already points to `http://localhost:5000` with `DEV_MODE: false`.

Needs MongoDB: a local installation, or a free MongoDB Atlas cluster (put its connection string in `MONGODB_URI` in `.env`).

Using Live Server instead (port 5500)? It still works: the API allows other origins by default. Set `CORS_ORIGIN` before real deployment.

Only the four pages and the `css`, `js`, `assets` folders are served; backend files such as `.env` are never exposed.

Deploying online: set `API_BASE_URL: ""` in `config.js` if the backend serves the pages, set `TRUST_PROXY=1`, `CORS_ORIGIN`, `MONGODB_URI`, and `ADMIN_API_KEY` as environment variables on the host.

## Endpoints
| Method | Path | Notes |
|---|---|---|
| POST | /api/feedback | Public. Validates, stores, returns 201 `{success, data}` or 400 `{success:false, message}` |
| GET | /api/feedback | All submissions, newest first |
| GET | /api/feedback/stats | `totalSubmissions`, `overallAverage`, `coursesEvaluated` (zeros when empty) |
| GET | /api/feedback/stats/courses | Average overall rating + count per course (`[]` when empty) |
| GET | /api/health | Health check |

## What the server enforces (the browser can be bypassed)
- `courseCode` must be one of the 7 courses in `src/courses.js` (keep it in sync with `COURSES` in `js/main.js`); the course name is taken from the server list;
-  four ratings (`overall, teaching, content, organization`) must be whole numbers 1-5.
- Text fields trimmed and limited to 1000 chars; name 100; student ID 30.
- If `isAnonymous` is true, name and ID are discarded server-side.
- JSON body limit 20 KB, rate limit on POST (30 per 15 min per IP), `helmet` headers, CORS allow-list via `CORS_ORIGIN`.
- Errors are always JSON with a readable `message`; no stack traces are sent.

## Security: protecting the dashboard
`GET /api/feedback*` is public by default so the current demo dashboard works. To lock it, set `ADMIN_API_KEY` in `.env`; the GET routes then require an `x-api-key` header. The dashboard has no login screen yet, so for real use add one (or move to JWT auth). Never put the key inside frontend code that students can open.

## Tests
`npm test` runs the validation tests (no database needed).

## Structure
```
server.js              connects to MongoDB, starts the server
src/app.js             middleware, routes, error handling
src/courses.js         the 7 allowed courses
src/validators.js      payload validation and normalisation
src/models/Feedback.js Mongoose schema
src/routes/feedback.js the 4 endpoints
src/middleware/adminAuth.js optional API-key protection
```
