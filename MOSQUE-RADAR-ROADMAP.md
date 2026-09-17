# Mosque Radar — Project Roadmap & Architecture Guide

---

## 1. Project Purpose

**Mosque Radar** is a location-based web application designed to help people find mosques near their current location.

### Long-term Product Vision
1. **Find nearby mosques:** Users can open the app and instantly discover mosques around their current geographic location.
2. **Community submissions:** Users can submit mosques they discover to help expand the directory.
3. **Transparent discovery:** Other users can view community-submitted mosques once available.
4. **Detailed mosque information:** Records can include name, location/address name, geographic coordinates, and imagery.
5. **Trust & verification:** A structured verification workflow ensures user-submitted information is reviewed before being considered trustworthy/verified.
6. **Dynamic distance calculation:** Distance between the user and a mosque is calculated dynamically based on the user's real-time position.
7. **Primary database first:** MongoDB is our authoritative primary source of truth. External mosque or location APIs may be integrated later for discovery/enrichment, but will not replace our own database.

---

## 2. Current Stack

### Frontend
- **Framework:** React 19 (`react`, `react-dom`)
- **Bundler:** Vite 8 (`@vitejs/plugin-react`)
- **Language:** JavaScript / JSX
- **Styling:** Vanilla CSS (CSS variables, responsive styles, light/dark mode support)
- **Module System:** ECMAScript Modules (ESM)

### Backend
- **Runtime:** Node.js
- **Framework:** Express 5 (`express`)
- **Database ODM:** Mongoose 9 (`mongoose`)
- **Environment:** `dotenv`
- **CORS:** `cors`
- **Dev Tooling:** `nodemon`
- **Module System:** CommonJS (`"type": "commonjs"`)

### Database
- **Engine:** MongoDB (Local MongoDB server running on `127.0.0.1:27017` / MongoDB Atlas for production)

---

## 3. Current Architecture

```
User
  ↓
React Frontend (Vite)
  ↓ HTTP Requests
Express Backend API (Node.js)
  ↓ Mongoose
MongoDB Database
```

### Backend Responsibilities
- Exposing clean RESTful API routes
- Business logic execution
- Strict backend input validation (never trusting frontend data)
- Database queries and geospatial indexing
- Authentication and authorization (when introduced)
- Security enforcement (rate limiting, header hygiene, sanitize queries)
- External API integration (when appropriate)
- Protecting private keys and environment secrets

### Frontend Responsibilities
- Delivering a fast, accessible, responsive user interface
- Handling user interactions and local client state
- Client-side validation for smooth user experience (instant feedback)
- Calling our backend API endpoints
- Gracefully presenting loading, error, and success states
- Requesting browser geolocation permissions when needed
- **Never exposing private API keys or secrets in client-side code**

---

## 4. Current Project Status

### What is COMPLETE (Phase 0 — Project Foundation)
- [x] Backend folder structure established (`config/`, `middleware/`, `routes/`, `server.js`).
- [x] MongoDB connection logic isolated into `backend/config/db.js`.
- [x] Environment configuration established via `.env` (`PORT`, `MONGO_URI`, `CLIENT_URL`) and guarded in `.gitignore`.
- [x] Process shutdown protection: Server refuses to start if `MONGO_URI` is missing or placeholder.
- [x] Express 5 compatibility preserved across all backend code.
- [x] Startup sequence enforced: database connection succeeds before `app.listen()` binds to port.
- [x] Global error-handling middleware (`backend/middleware/errorHandler.js`) returning standardized JSON (`{ success: false, message }`).
- [x] Health check endpoint `GET /api/test` implemented (`backend/routes/testRoutes.js`) returning `{ success: true, message: "Mosque Radar API is running" }`.
- [x] CORS configured with `CLIENT_URL` support.
- [x] Backend tested successfully on port 5000 against verified running local MongoDB instance.
- [x] Mosque Mongoose model and schema implemented (`backend/models/Mosque.js`) with GeoJSON `Point` coordinate validation.
- [x] `2dsphere` geospatial index registered on `location` field and verified in MongoDB.
- [x] Mosque API routes and controllers (`POST`, `GET`, `GET :id`, `PATCH :id`) implemented in `backend/controllers/mosqueController.js` and mounted at `/api/mosques`.
- [x] Untrusted input protection: submission status forced to `'pending'`, preventing unauthorized self-verification.
- [x] Error handling for Mongoose `ValidationError` and `CastError` with standardized 400 Bad Request responses.
- [x] Geospatial query endpoint `GET /api/mosques/nearby` implemented using `$geoNear` aggregation pipeline.
- [x] Real-time spherical distance calculation (in meters and kilometers) generated dynamically without static persistence.
- [x] Proximity sorting (nearest to farthest), radius filtering (`radius` and `radiusKm`), and default verified-only filtering.
- [x] Dedicated submission validation & sanitization pipeline (`backend/middleware/validateSubmission.js`) attached to `POST /api/mosques`.
- [x] Untrusted input defense: HTML/script tag stripping, character boundary enforcement, coordinate range bounds checking (`lng: [-180, 180]`, `lat: [-90, 90]`), and image array limits.
- [x] Actionable field-level validation error maps returned on `400 Bad Request`.
- [x] Image upload and validation pipeline implemented with `multer` (`backend/middleware/upload.js` and `POST /api/upload`).
- [x] Strict security hardening: 5MB size limit, MIME whitelist (`image/jpeg`, `image/png`, `image/webp`), and randomized safe filename generation.
- [x] Static image serving configured at `/uploads`, with zero raw binary buffers stored in MongoDB (URL references only).
- [x] Moderation review workflow implemented: `PATCH /api/mosques/:id/verify` for `verified` and `rejected` transitions.
- [x] Verification audit metadata recorded: `verifiedAt`, `verifiedBy`, and mandatory `rejectionReason` on rejection.
- [x] Dedicated FIFO moderation queue endpoint: `GET /api/mosques/moderation/queue`.
- [x] Public isolation confirmed: pending/rejected records excluded from public listings and nearby search by default.
- [x] Frontend application architecture (`components/`, `pages/`, `layouts/`, `services/`, `hooks/`, routing via `react-router-dom`, design tokens, and verified build).
- [x] Browser geolocation custom hook (`useGeolocation`) abstraction with permission and error handling.
- [x] Frontend-to-backend API integration & end-to-end verification (Vite dev proxy, centralized API client, live database queries, proximity sorting, and moderation workflow).
- [x] User registration, JWT authentication, and role-based permissions (`user`, `moderator`, `admin`).
- [x] User profile management and submission tracking ("Mosques I've submitted").
- [x] Protected moderation queue & decision endpoints (`/api/mosques/moderation/queue`, `/:id/verify`) guarded by `protect, authorize('moderator', 'admin')`.
- [x] Admin moderation center with status tabs (`pending`, `verified`, `rejected`), duplicate detection assistance, and inline editing.
- [x] Duplicate detection assistance endpoint (`GET /api/mosques/moderation/duplicates`) via proximity ($geoNear) and name similarity.
- [x] Moderation rejection audit with mandatory reason requirement.
- [x] Security HTTP headers configured with `helmet` (`nosniff`, `cross-origin` CORP, clickjacking defense).
- [x] Rate limiting configured with `express-rate-limit` (general API tier and brute-force mitigation on auth).
- [x] NoSQL operator injection defense middleware rejecting malicious `$`/`.` keys.
- [x] CORS origin lockdown and preflight verification.
- [x] Isolated backend unit test suite (`npm run test:unit`) covering Haversine distance calculations, GeoJSON coordinate boundaries, NoSQL sanitizer, role authorization, and bcrypt hashing (14/14 tests passing).
- [x] Frontend contract and architecture test suite (`npm test` in frontend) validating route registrations, API service contracts, and design tokens (42/42 tests passing).
- [x] Comprehensive end-to-end integration and security test suite (`npm run test:integration` - 41/41 tests passing).
- [x] Production deployment configuration: Render blueprint (`render.yaml`), Vercel SPA routing (`vercel.json`), Netlify/Cloudflare SPA redirects (`_redirects`), and frontend/backend `.env.example` templates.
- [x] Enhanced health monitoring endpoint (`GET /api/health` & `GET /api/test`) reporting database connectivity, readyState, and server uptime.
- [x] Automated MongoDB Atlas index verification (`Mosque.createIndexes()` on database connection).
- [x] Complete production deployment guide (`DEPLOYMENT-GUIDE.md`).

### What is NOT YET BUILT (Optional Future Enhancements)
- [ ] External API integration (optional third-party mosque gap-filling / enrichment)

---

## 5. Phased Roadmap

### Phase 0 — Project Foundation
- **Goal:** Project inspection, architectural baseline, backend scaffolding, environment configuration, database connection, global error handler, and alive check.
- **Status:** **COMPLETE**

---

### Phase 1 — Mosque Data Model
- **Goal:** Design and implement the Mongoose schema and model for a Mosque entity.
- **Key Concepts:**
  - Name, location/address name, timestamps.
  - GeoJSON `Point` coordinates (`type: "Point"`, `coordinates: [longitude, latitude]`). Note: GeoJSON order is `[lng, lat]`, not `[lat, lng]`.
  - `2dsphere` geospatial indexing for proximity queries.
  - Image reference fields (URL / storage identifier).
  - Verification status (`pending`, `verified`, `rejected`) defaulting to `pending`.
  - Submitter metadata (optional anonymous or user reference).
- **Core Architectural Rule:**
  - **Do NOT store "distance" as a static property on the Mosque document.** Distance is relative to the observer's changing position. Store accurate coordinates; calculate or query distance dynamically.
- **Status:** **COMPLETE**

---

### Phase 2 — Mosque Backend API
- **Goal:** Build the core Express controllers and routes for managing mosque data.
- **Key Capabilities:**
  - `POST /api/mosques` — Create a new mosque submission (validated, defaults to `pending`).
  - `GET /api/mosques` — Retrieve mosques (with filtering for verified records).
  - `GET /api/mosques/:id` — Retrieve a single mosque by ID.
  - `PATCH /api/mosques/:id` — Update mosque details where appropriate.
  - Centralized input validation and predictable HTTP error status codes (400, 404, 500).
- **Status:** **COMPLETE**

---

### Phase 3 — Geolocation & Nearby Mosque Search
- **Goal:** Enable proximity-based discovery using geospatial queries.
- **Key Capabilities & Learning:**
  - Browser Geolocation API (`navigator.geolocation`).
  - Handling user coordinate permissions and fallbacks.
  - MongoDB `$near` and `$geoNear` aggregation pipeline queries.
  - Dynamic distance calculation in kilometers/meters.
  - Radius searches and sorting results by closest distance.
  - Performing server-side verified calculations rather than relying on unvalidated client claims.
- **Status:** **COMPLETE**

---

### Phase 4 — Mosque Submission
- **Goal:** Provide a secure pipeline for users to submit discovered mosques.
- **Key Capabilities:**
  - Submission schema: Name, address, coordinates, optional notes, image metadata.
  - Treating all incoming submission payloads as **untrusted input**.
  - Strict server-side sanitization and bounds checking (e.g., latitude [-90, 90], longitude [-180, 180]).
  - Returning actionable validation error messages to the client.
- **Status:** **COMPLETE**

---

### Phase 5 — Image Handling
- **Goal:** Design and implement safe, scalable image upload and storage.
- **Key Capabilities & Architectural Decisions:**
  - Evaluate storage targets: Cloud object storage (e.g., S3/Cloud Storage/Cloudinary) vs. local uploads.
  - Storing clean image URLs/identifiers in MongoDB, **never** raw binary buffers in document fields.
  - MIME type verification, file signature checks, file size limits.
  - Security hardening against malicious file uploads.
- **Status:** **COMPLETE**

---

### Phase 6 — Verification System
- **Goal:** Establish a moderation workflow that separates unverified community submissions from verified records.
- **Key Capabilities:**
  - Explicit status states: `pending`, `verified`, `rejected`.
  - Default public discovery queries only show `verified` mosques (or clearly badge `pending` ones).
  - Verification audit metadata (who verified, timestamp, rejection reasons).
- **Status:** **COMPLETE**

---

### Phase 7 — Frontend Architecture
- **Goal:** Transform the default Vite template into a modular, production-ready React application.
- **Key Capabilities:**
  - Page routing (`react-router-dom`): Home, Explore Directory, Mosque Detail, Submit Mosque, Moderation Queue, and 404 page with `MainLayout` shell.
  - Clean component directory structure: `components/`, `pages/`, `layouts/`, `services/`, `hooks/`.
  - Reusable UI elements (`MosqueCard`, `Navbar`, `LoadingSpinner`, `Alert`, `Badge`, `Modal`).
  - Browser geolocation abstraction (`useGeolocation` hook) managing device GPS, permissions, timeouts, and manual coordinate overrides.
  - Design tokens, typography, and cohesive dark-mode glassmorphic styling.
  - React 19 strict hook compliance and clean ESLint checks.
- **Verification & Test Outcomes:**
  - `npm run lint`: Passed with 0 errors and 0 warnings.
  - `npm run build`: Production bundle generated cleanly (built in <1s).
  - Dev server verified locally via HTTP check on port 5173.
- **Status:** **COMPLETE**

---

### Phase 8 — Frontend/Backend Integration
- **Goal:** Wire the React client to the Express API.
- **Key Capabilities:**
  - Centralized API client module (`frontend/src/services/api.js`) with base URL configuration and error handling.
  - Vite dev server proxy setup (`/api` and `/uploads` mapped to `http://localhost:5000`) preventing local CORS issues.
  - Rendering mosque listings with live backend data from MongoDB.
  - Interactive "Add Mosque" submission form with real-time feedback, coordinate autofill, and image upload.
  - Shimmer glassmorphic loading skeletons (`MosqueSkeleton`), empty states, and user-friendly alert banners (`Alert`).
  - Safe development seed script (`npm run seed`) with realistic coordinates and metadata.
- **Verification & Test Outcomes:**
  - Automated test suite (`npm test` / `node scripts/verify-integration.js`): **12/12 integration tests passed**.
  - Verified live proximity queries (`GET /api/mosques/nearby`), radius filtering (2–25km), dynamic spherical distance calculations, submission moderation pipeline, and public directory isolation.
  - `npm run lint`: **0 errors, 0 warnings**.
  - `npm run build`: Production bundle built cleanly in <1s.
- **Status:** **COMPLETE**

---

### Phase 9 — Search & Discovery
- **Goal:** Provide rich search, filtering, and interactive map discovery.
- **Key Capabilities:**
  - Full-text search on `name` and `address` powered by MongoDB `$text` index with relevance scoring (`textScore`).
  - Proximity-based radius filtering on the Explore Directory (`2km`, `5km`, `10km`, `25km`, `All`) utilizing browser geolocation and `$geoNear`.
  - Interactive Leaflet map view (`MapView.jsx`) rendering custom-styled mosque markers with coordinates, details popup, Google Maps directions links, and dark-theme tile styling.
  - Seamless List ↔ Map toggle with zero redundant network requests.
  - Debounced search queries (300ms) with pagination and clear-filter controls.
  - Responsive grid layout (`.mosque-grid`) ensuring consistent card alignment across all viewports.
- **Verification & Test Outcomes:**
  - Automated test suite (`npm test` / `node scripts/verify-integration.js`): **14/14 integration tests passed** (including text search and empty query assertions).
  - `npm run lint`: **0 errors, 0 warnings**.
  - `npm run build`: Production bundle built cleanly with Leaflet integration in <2s.
- **Status:** **COMPLETE**

---

### Phase 10 — Authentication & Authorization
- **Goal:** Introduce user identities and role-based permissions when required by business logic.
- **Key Capabilities:**
  - User registration and login (password hashing with `bcryptjs`, secure session/JWT tokens).
  - User profile and submission tracking ("Mosques I've submitted" via `GET /api/auth/my-submissions`).
  - Role definition (`user`, `moderator`, `admin`) and middleware enforcement (`protect`, `authorize`, `optionalAuth`).
  - Route protection: `/api/mosques/moderation/queue` and `PATCH /api/mosques/:id/verify` restricted to `moderator` and `admin`.
  - Frontend authentication layer: `AuthContext`, `useAuth` hook, `LoginPage`, `RegisterPage`, `ProfilePage`, and `ProtectedRoute` route wrapper.
- **Verification & Test Outcomes:**
  - Automated test suite (`npm test` / `node scripts/verify-integration.js`): **25/25 integration & auth tests passed**.
  - Verified user registration, duplicate email rejection (400), login authentication, bad password rejection (401), Bearer token profile fetch, unauthenticated access rejection (401), role-based forbidden access rejection (403), moderator queue access, authenticated submission attaching `createdBy`, moderator approval workflow, public directory synchronization, and user submission tracking.
  - `npm run lint`: **0 errors, 0 warnings**.
  - `npm run build`: Production bundle built cleanly in <1s.
- **Status:** **COMPLETE**

---

### Phase 11 — Admin & Moderation
- **Goal:** Provide administrative tools to govern community submissions.
- **Key Capabilities:**
  - Moderation queue endpoint & interface (`GET /api/mosques/moderation/queue`) with status filtering (`pending`, `verified`, `rejected`, `all`).
  - Proximity and text-similarity duplicate detection assistance (`GET /api/mosques/moderation/duplicates`).
  - Reusable moderation center UI (`ModerationPage.jsx`) with status tabs, duplicate warning drawers, and inline editing modal (`PATCH /api/mosques/:id`).
  - Strict audit logging for approvals and rejections (`verifiedBy`, `verifiedAt`, and mandatory `rejectionReason`).
- **Verification & Test Outcomes:**
  - Automated test suite (`npm test` / `node scripts/verify-integration.js`): **34/34 integration, auth & moderation tests passed**.
  - Verified duplicate detection by proximity within 500m, name similarity matching, unauthenticated (401) and non-moderator (403) route protection, inline editing of mosque details, mandatory rejection reason enforcement (400), moderator approval workflow, status filtering on queue queries, and public directory visibility synchronization.
  - `npm run lint`: **0 errors, 0 warnings**.
  - `npm run build`: Production bundle built cleanly in <1s.
- **Status:** **COMPLETE**

---

### Phase 12 — Security & Production Hardening
- **Goal:** Perform end-to-end security audit and production hardening.
- **Key Capabilities:**
  - Security HTTP headers via `helmet` (MIME sniffing prevention `nosniff`, frame clickjacking defense `SAMEORIGIN`, and `cross-origin` resource policy for `/uploads` images).
  - Multi-tier API rate limiting via `express-rate-limit` (300 req/15min general tier, 30 req/15min strict auth brute-force mitigation).
  - NoSQL operator injection defense middleware (`sanitizeInput.js`) recursively filtering prohibited `$`/`.` keys from query, body, and params.
  - CORS lockdown with preflight options validation against configured client origin.
  - Secret audits: `.env` guarded by `.gitignore`, `.env.example` template maintained, zero secrets exposed to frontend bundles.
- **Verification & Test Outcomes:**
  - Automated test suite (`npm test` / `node scripts/verify-integration.js`): **41/41 integration, auth, moderation & security tests passed**.
  - Verified `X-Content-Type-Options: nosniff`, `Cross-Origin-Resource-Policy: cross-origin`, `X-Frame-Options: SAMEORIGIN`, `RateLimit-Limit: 300` headers, NoSQL body injection `$gt` rejection (400), NoSQL query injection `$where` rejection (400), and CORS preflight options responses.
  - `npm run lint`: **0 errors, 0 warnings**.
  - `npm run build`: Production bundle built cleanly in <1s.
- **Status:** **COMPLETE**

---

### Phase 13 — Testing
- **Goal:** Establish confidence with focused automated, unit, contract, and integration tests.
- **Key Capabilities:**
  - Isolated backend unit tests (`backend/scripts/verify-unit.js`): Haversine distance calculations, GeoJSON coordinate boundaries, NoSQL injection sanitizer, role-based authorization, and bcrypt password hashing.
  - End-to-end integration and security test suite (`backend/scripts/verify-integration.js`): full lifecycle testing across directory queries, proximity sorting, text search, user authentication, role gates, moderation queue, duplicate detection, and security headers.
  - Frontend contract and architecture test suite (`frontend/scripts/verify-frontend.js`): router route completeness, page registrations, centralized API client methods, and design system tokens.
  - Standardized npm test commands: `npm run test:unit`, `npm run test:integration`, and unified `npm test`.
- **Verification & Test Outcomes:**
  - Backend unit tests (`npm run test:unit`): **14/14 passed**.
  - Backend integration & security tests (`npm run test:integration`): **41/41 passed**.
  - Frontend contract & architecture tests (`npm test` in `frontend`): **42/42 passed**.
  - Cross-stack total: **97/97 tests passed** with zero failures.
  - `npm run lint`: **0 errors, 0 warnings**.
  - `npm run build`: Production bundle built cleanly in <1s.
- **Status:** **COMPLETE**

---

### Phase 14 — Deployment
- **Goal:** Ship Mosque Radar to production infrastructure.
- **Key Capabilities:**
  - Automated MongoDB Atlas indexing: `Mosque.createIndexes()` executes on connection, ensuring `2dsphere` geospatial and text search indexes exist automatically on fresh production clusters.
  - Backend deployment infrastructure: blueprint descriptor (`render.yaml`), health check path (`/api/health`), and environment variable templates.
  - Frontend SPA routing configuration: Vercel rewrite rules (`vercel.json`), Netlify/Cloudflare redirects (`_redirects`), and production bundle optimization.
  - Comprehensive production deployment guide ([DEPLOYMENT-GUIDE.md](file:///c:/Users/DELL/Desktop/mosque-radar/DEPLOYMENT-GUIDE.md)) covering MongoDB Atlas, Render, Vercel, CORS origin lockdown, and smoke test checklists.
  - Enhanced production health monitor endpoint (`GET /api/health` & `GET /api/test`) returning database connection state, readyState, and server uptime.
- **Verification & Test Outcomes:**
  - Full automated suite: **97/97 tests passed** (14 backend unit, 41 backend integration/security, 42 frontend contract).
  - Production builds: Backend starts with automated index verification; frontend builds cleanly via `vite build` in <1s.
  - Production health check verified returning structured JSON with uptime and database status.
- **Status:** **COMPLETE**

---

## 6. Learning Objectives

For each milestone, the developer should understand the underlying fundamentals rather than treating generated code as a black box:

- **HTML & Semantics:** Accessible markup, semantic tags (`<main>`, `<section>`, `<article>`, `<nav>`), form labels, ARIA landmarks.
- **CSS Architecture:** Responsive design without heavy frameworks, CSS variables, flexbox, grid, mobile-first layouts, color contrast.
- **JavaScript & Async:** Event loop, Promises, `async/await`, error boundaries, array manipulation, immutable updates.
- **React Fundamentals:** Component lifecycle, state vs. props, effect management, custom hooks, form handling, error states.
- **HTTP & REST:** HTTP methods (GET, POST, PATCH, DELETE), status codes (200, 201, 400, 401, 403, 404, 500), headers, payload formats.
- **Express & Middleware:** Request lifecycle, middleware pipelines, 4-argument error handlers, router modularization.
- **MongoDB & Mongoose:** Documents vs. relational tables, schema design, type casting, schema validators, indexing strategies.
- **Geospatial & GeoJSON:** Coordinate reference systems (WGS84), longitude-first standard in GeoJSON, 2dsphere spherical math, `$near` queries.
- **Security:** Defense in depth, least privilege, untrusted input philosophy, CORS policies, XSS prevention, avoiding secret leaks.

---

## 7. Decision Log

### Decision 1 — MongoDB is the primary source of truth
* **Context:** Mosque data could theoretically be fetched on-the-fly from external mapping APIs.
* **Decision:** Our MongoDB database will store and serve Mosque Radar data. External APIs may later be evaluated for gap-filling or discovery, but they will never silently overwrite or replace our primary database.

### Decision 2 — Distance is dynamic, not static
* **Context:** Mosques have locations; users have locations.
* **Decision:** We will **never** store a static "distance" attribute on a mosque document. Distance depends on the observer's location. Mosque documents store coordinates; distance is calculated dynamically via geospatial queries (`$near`, `$geoNear`) or mathematical utility functions.

### Decision 3 — User submissions are untrusted input
* **Context:** Users can submit mosque names, addresses, and coordinates from client devices.
* **Decision:** Any client payload can be spoofed or manipulated. Frontend validation exists solely for user experience. The Express backend enforces mandatory, strict validation on every field before database insertion.

### Decision 4 — Secrets stay on the backend
* **Context:** Web applications often require API keys, database connection strings, and tokens.
* **Decision:** Secrets, database connection strings, and third-party API credentials must never be committed to git or exposed in Vite/React client bundles. All external integrations requiring credentials will be proxied through our Express backend.

### Decision 5 — Progressive development
* **Context:** Large monolithic leaps lead to unreviewed, brittle code and poor understanding.
* **Decision:** Features are built incrementally, tested, verified, and understood before proceeding to the next roadmap phase.

---

## 8. Agent Rules for this Project

1. **One feature at a time:** Do not implement multiple unrelated features simultaneously.
2. **Explicit architectural consent:** Never silently change architectural decisions or database patterns without explaining the rationale and obtaining consent.
3. **Real completion criteria:** A feature is only complete when:
   - Implementation code exists and follows project conventions.
   - It has been tested and verified (automated or manual test log).
   - Obvious bugs and edge cases are handled.
   - The changes are reported clearly to the developer.
4. **Preserve working code:** Do not delete or rewrite working implementations without a clear, justified reason.
5. **No dependency bloat:** Do not install third-party libraries without explaining why standard libraries/vanilla patterns are insufficient.
6. **No over-engineering:** Build what the current phase requires. Avoid generic enterprise abstractions until complexity warrants them.
7. **Maintain roadmap accuracy:** Update this roadmap document after completing major milestones (status, test outcomes, newly discovered constraints).
8. **Never fabricate test results:** If a service or database cannot be tested, report the exact limitation rather than claiming it passed.
9. **Scope discipline:** When tasked with a feature, implement only that feature. Avoid scope creep.

---

## 9. Instructions for Future Sessions

Any developer or AI agent continuing work on this repository must adhere to the following workflow:

1. **Read this file first (`MOSQUE-RADAR-ROADMAP.md`).**
2. **Inspect the actual codebase:** Check `backend/` and `frontend/` to ground yourself in the actual current code state.
3. **Compare code vs. roadmap:** Do not assume the roadmap is more accurate than working code, and do not assume code matches the roadmap without inspecting it. Report any discrepancies immediately.
4. **Identify current completed feature and next planned feature.**
5. **Await developer authorization** before initiating implementation of the next phase.
