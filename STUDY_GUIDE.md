# Evaluation Study Guide: Sphinx Feedback Portal Frontend

## Concepts
- **HTML structure**: each page has `<head>` (title, CSS links) and `<body>` with sections. Navbar and footer are empty placeholders (`<header id="site-header">`) filled by `main.js`, so they are written once.
- **CSS**: `style.css` holds colour variables (`--orange` etc.) and shared parts; each page has its own small file. Layout uses CSS grid and flexbox, with media queries at 900px and 760px. Animations use `@keyframes` and `transition`; `prefers-reduced-motion` turns them off.
- **JavaScript**: behaviour: building cards, validating, sending data, drawing the dashboard.
- **DOM manipulation**: JavaScript finds elements (`document.getElementById`), creates them (`createElement`), sets text (`textContent`) and adds them (`append`). We use `textContent` so user text can never run as HTML (prevents XSS).
- **Event listeners**: `element.addEventListener("submit", fn)` runs `fn` when the user acts (submit, change, click).
- **Form validation**: `validate(values)` returns a list of errors (no course, any rating missing). If the list is not empty we show messages and `return`, so `fetch` is never called.
- **Star rating**: each category has five hidden radio buttons (5 to 1) with star labels. CSS `flex-direction: row-reverse` flips them visually, and `input:checked ~ label` colours the chosen star and all stars to its left. The `change` event shows the word (Poor...Excellent).
- **JSON**: text format for data. `JSON.stringify(obj)` turns our object into text for sending; `response.json()` turns replies back to objects.
- **fetch, GET, POST**: `fetch(url, options)` sends an HTTP request. GET reads data (dashboard); POST sends data to store (form), with a JSON body and `Content-Type: application/json` header.
- **async/await**: `await` pauses a function until a slow task (network) finishes, without freezing the page. `try/catch` handles failures.
- **Frontend/backend communication**: form > JSON > `fetch` POST to `API_BASE_URL + "/api/feedback"` > Express saves to MongoDB > JSON reply > page shows success or error. The dashboard does GET requests and draws the replies.

## Key functions
- **`apiRequest(path, options)`** (config.js): `fetch` inside try/catch (network failure becomes a friendly error), parses JSON, throws if `!response.ok` using the server's `message`, otherwise returns the body. Every page uses it, so the URL exists in one place.
- **`renderLayout()`** (main.js): builds navbar and footer, highlights the current page, wires the mobile menu button.
- **`observeReveal()`**: an `IntersectionObserver` adds class `in` to `.reveal` elements when scrolled into view, which triggers the CSS transition.
- **`animateValue(el, target, decimals)`**: runs `requestAnimationFrame` for ~1 second and writes an eased number into the element (the counters).
- **`readValues()`** (feedback.js): collects every input into the exact JSON structure; anonymous blanks name/ID.
- **Submit handler**: `preventDefault` > `readValues` > `validate` > if errors show them and stop > disable button and show spinner > `await apiRequest(POST)` > success: reset form, show thank-you panel > failure: show red message and keep the data > `finally` re-enable the button.
- **`loadDashboard()`** (dashboard.js): shows loading > `Promise.all` of 3 GET requests > checks shapes > no data: empty state > otherwise fills stat cards, draws charts, comparison bars and the table > error: message and Try again button.
- **`renderTable()`**: filters `allFeedback` by the chosen course code and rebuilds rows with `createRow`.

## 10 likely questions
1. **Why no framework?** Four simple pages; vanilla JS shows the fundamentals and has no dependencies.
2. **How does a clicked course reach the form?** Link `feedback.html?course=CSC322`; `feedback.js` reads it with `URLSearchParams` and pre-selects the dropdown.
3. **How is invalid data blocked?** `validate` runs before `fetch`; errors stop the submit. The backend must validate too, as browsers can be bypassed.
4. **How does anonymous mode work?** The checkbox disables name/ID and the payload sends them empty with `isAnonymous: true`.
5. **How do the stars work without JavaScript logic?** Radio buttons plus CSS sibling selectors; JS only reads the checked value.
6. **Where is the API URL?** Only in `config.js`; switching to the cloud backend is a one-line change.
7. **What if the server fails?** `apiRequest` throws; the form shows an error and keeps the data; the dashboard shows an error with retry.
8. **How do you prevent XSS?** User text is inserted with `textContent` or text nodes, never `innerHTML`.
9. **Is the dashboard secure?** No: it's a demo without authentication; the backend must add login before production.
10. **What is development mode?** A flag that fakes the API in the browser for demos. It shows a banner, starts empty, never touches a database, and is off by default.

## Demo script (about 5 minutes)
1. Welcome page: logo animation, headline, shield photo, counters, scroll to "Why your feedback matters".
2. Click Explore Courses: seven cards, hover effect, point at icons.
3. Click Rate This Course on Cloud Architecture: course already selected.
4. Click Submit empty to show validation. Rate with stars, tick Anonymous, write comments, submit: spinner, then success panel.
5. DevTools > Network: show the POST request and JSON body.
6. Dashboard: counters, charts, comparison, table, course filter. Mention the no-authentication note.
7. Stop the backend and reload: error state with Try again.
8. Close: "All API settings live in config.js, ready for the Express/MongoDB backend."
