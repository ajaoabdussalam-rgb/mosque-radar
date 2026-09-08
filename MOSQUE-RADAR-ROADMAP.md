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

### What is NOT YET BUILT (Do not treat as completed)
- [ ] Browser geolocation integration
- [ ] Mosque submission form and untrusted input validation pipeline
- [ ] Image upload, storage, and validation system
- [ ] Verification workflow (`pending`, `verified`, `rejected`)
- [ ] Frontend application architecture (pages, components, routing, API client)
- [ ] Frontend-to-backend API integration
- [ ] User authentication and role-based authorization
- [ ] Admin moderation dashboard
- [ ] External API integration
- [ ] Automated testing suite
- [ ] Production deployment and hardening

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
- **Status:** **CURRENT / NEXT IMPLEMENTATION TASK**

---

### Phase 5 — Image Handling
- **Goal:** Design and implement safe, scalable image upload and storage.
- **Key Capabilities & Architectural Decisions:**
  - Evaluate storage targets: Cloud object storage (e.g., S3/Cloud Storage/Cloudinary) vs. local uploads.
  - Storing clean image URLs/identifiers in MongoDB, **never** raw binary buffers in document fields.
  - MIME type verification, file signature checks, file size limits.
  - Security hardening against malicious file uploads.
- **Status:** PLANNED

---

### Phase 6 — Verification System
- **Goal:** Establish a moderation workflow that separates unverified community submissions from verified records.
- **Key Capabilities:**
  - Explicit status states: `pending`, `verified`, `rejected`.
  - Default public discovery queries only show `verified` mosques (or clearly badge `pending` ones).
  - Verification audit metadata (who verified, timestamp, rejection reasons).
- **Status:** PLANNED

---

### Phase 7 — Frontend Architecture
- **Goal:** Transform the default Vite template into a modular, production-ready React application.
- **Key Capabilities:**
  - Page routing (e.g., `react-router-dom`): Home, Discover/Map, Mosque Detail, Submit Mosque.
  - Clean component directory structure: `components/`, `pages/`, `layouts/`, `services/`, `hooks/`.
  - Reusable UI elements (cards, badges, modals, spinners, alerts).
  - Lightweight, predictable state management without unnecessary third-party overhead.
  - Design tokens, typography, and cohesive modern styling.
- **Status:** PLANNED

---

### Phase 8 — Frontend/Backend Integration
- **Goal:** Wire the React client to the Express API.
- **Key Capabilities:**
  - Centralized API client module with base URL configuration and error handling.
  - Vite dev server proxy setup to prevent local CORS issues.
  - Rendering mosque listings with live backend data.
  - Interactive "Add Mosque" submission form with real-time feedback.
  - Loading skeletons, empty states, and user-friendly error banners.
- **Status:** PLANNED

---

### Phase 9 — Search & Discovery
- **Goal:** Provide rich search, filtering, and optional external data enrichment.
- **Key Capabilities:**
  - Text search by mosque name or locality.
  - Radius filtering (e.g., 2km, 5km, 10km).
  - Map view integration (e.g., Leaflet or map provider).
  - **External API Evaluation:** Thoroughly evaluate whether third-party APIs (e.g., Overpass/OSM, Google Places) are needed to fill coverage gaps. If used, calls flow strictly through our backend, keys remain private, and results are marked as candidate/external data rather than automatically verified Mosque Radar records.
- **Status:** PLANNED

---

### Phase 10 — Authentication & Authorization
- **Goal:** Introduce user identities and role-based permissions when required by business logic.
- **Key Capabilities:**
  - User registration and login (password hashing with `bcrypt`, secure session/JWT tokens).
  - User profile and submission tracking ("Mosques I've submitted").
  - Role definition (`user`, `moderator`, `admin`).
- **Status:** PLANNED

---

### Phase 11 — Admin & Moderation
- **Goal:** Provide administrative tools to govern community submissions.
- **Key Capabilities:**
  - Moderation queue endpoint & interface for `pending` submissions.
  - One-click verify, reject, or edit actions.
  - Duplicate detection assistance.
- **Status:** PLANNED

---

### Phase 12 — Security & Production Hardening
- **Goal:** Perform end-to-end security audit and production hardening.
- **Key Capabilities:**
  - Security headers (`helmet`), API rate limiting (`express-rate-limit`).
  - NoSQL injection prevention and strict input sanitization.
  - CORS lockdown to production domain.
  - Secret audits (ensuring zero credentials in client bundles or git logs).
- **Status:** PLANNED

---

### Phase 13 — Testing
- **Goal:** Establish confidence with focused automated and integration tests.
- **Key Capabilities:**
  - Unit tests for distance calculations and validation rules.
  - API integration tests (Supertest) for endpoint contracts and error responses.
  - Geospatial query verification with sample coordinates.
  - Critical frontend flow testing.
- **Status:** PLANNED

---

### Phase 14 — Deployment
- **Goal:** Ship Mosque Radar to production infrastructure.
- **Key Capabilities:**
  - Production MongoDB Atlas provisioning and indexing.
  - Backend hosting (e.g., Render, Railway, Fly.io) with environment variable injection.
  - Frontend hosting (e.g., Vercel, Netlify, Cloudflare Pages).
  - Production build verification and health monitoring.
- **Status:** PLANNED

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
