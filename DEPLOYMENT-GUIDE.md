# Mosque Radar — Production Deployment Guide

This guide provides step-by-step instructions for deploying Mosque Radar to production infrastructure.

---

## Architecture Overview

```
User Browser
    │
    ▼
Frontend (Vercel / Netlify / Cloudflare Pages)
    │
    │ HTTPS (VITE_API_URL)
    ▼
Backend API (Render / Railway / Fly.io)
    │
    │ TLS / MongoDB Wire Protocol
    ▼
Database (MongoDB Atlas Cluster)
```

---

## Step 1: Provision MongoDB Atlas Cluster

1. Log into [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a new Project (e.g. `Mosque-Radar`).
3. Deploy a free **M0 Sandbox** or dedicated cluster in your target region (e.g. `AWS / eu-west-1` or `AWS / us-east-1`).
4. **Configure Database Access:**
   - Go to **Security > Database Access**.
   - Click **Add New Database User**.
   - Authentication Method: **Password**.
   - Create a user (e.g. `mosqueradar_admin`) and generate a strong password.
   - Role: **Read and write to any database**.
5. **Configure Network Access:**
   - Go to **Security > Network Access**.
   - Click **Add IP Address**.
   - Select **Allow Access From Anywhere** (`0.0.0.0/0`) so dynamic cloud hosting IPs (Render/Railway) can connect.
6. **Get Connection String:**
   - Click **Connect > Drivers (Node.js)**.
   - Copy your connection string:
     ```
     mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/mosque-radar?retryWrites=true&w=majority
     ```
   - Replace `<password>` with your database user password.

> [!NOTE]
> When the backend connects to MongoDB Atlas for the first time, `backend/config/db.js` automatically executes `Mosque.createIndexes()`, ensuring the required `2dsphere` geospatial and text search indexes exist without manual shell commands.

---

## Step 2: Deploy Backend to Render (or Railway)

### Option A: Using Render

1. Sign in to [Render](https://render.com).
2. Click **New + > Web Service**.
3. Connect your GitHub repository (`mosque-radar`).
4. Configure service settings:
   - **Name:** `mosque-radar-api`
   - **Root Directory:** `backend`
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Health Check Path:** `/api/health`
5. **Environment Variables:**
   Add the following environment variables in the Render dashboard:
   | Variable | Value | Description |
   | :--- | :--- | :--- |
   | `NODE_ENV` | `production` | Enables production optimizations & rate limiters |
   | `PORT` | `5000` | Port for Express listener |
   | `MONGO_URI` | `mongodb+srv://...` | Your MongoDB Atlas connection string from Step 1 |
   | `CLIENT_URL` | `https://your-frontend-app.vercel.app` | Allowed CORS origin (update once frontend is deployed) |
   | `JWT_SECRET` | *(64-char random string)* | Strong secret key for signing user auth tokens |
   | `JWT_EXPIRES_IN` | `30d` | JWT session lifetime |
6. Click **Create Web Service**.
7. Once deployed, note your backend URL: e.g. `https://mosque-radar-api.onrender.com`.

---

## Step 3: Deploy Frontend to Vercel (or Netlify)

### Option A: Using Vercel

1. Sign in to [Vercel](https://vercel.com).
2. Click **Add New > Project** and import your `mosque-radar` repository.
3. Configure Project Settings:
   - **Framework Preset:** `Vite`
   - **Root Directory:** Click `Edit` and select `frontend`.
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`
4. **Environment Variables:**
   Add the backend API endpoint:
   | Variable | Value |
   | :--- | :--- |
   | `VITE_API_URL` | `https://mosque-radar-api.onrender.com/api` |
5. Click **Deploy**.

> [!TIP]
> The repository includes `frontend/vercel.json` and `frontend/public/_redirects` to handle Single-Page Application (SPA) routing, ensuring that refreshing on `/explore`, `/profile`, or `/moderation` resolves cleanly to `index.html` without returning 404.

---

## Step 4: Finalize CORS Binding

Now that your frontend has an active production domain (e.g. `https://mosque-radar.vercel.app`):
1. Return to your backend hosting dashboard (Render / Railway).
2. Update the `CLIENT_URL` environment variable:
   ```
   CLIENT_URL=https://mosque-radar.vercel.app
   ```
3. Save changes — the backend will redeploy with the strict production CORS origin locked down.

---

## Step 5: Production Health & Smoke Test Checklist

Verify the deployed stack:

- [ ] **Health Check:**
  Navigate to `https://mosque-radar-api.onrender.com/api/health`.
  Verify it returns HTTP 200 with `{ "success": true, "status": "healthy", "database": { "connected": true } }`.
- [ ] **Initial Database Seed (Optional):**
  From your local terminal with production `MONGO_URI` in `.env`:
  ```bash
  npm run seed
  ```
  This seeds the initial verified mosques and administrator accounts (`admin@mosqueradar.com`, `mod@mosqueradar.com`).
- [ ] **Explore Page & Map:**
  Open `https://mosque-radar.vercel.app/explore` and verify that live mosque markers appear on the Leaflet map and card list.
- [ ] **Geolocation Discovery:**
  Click "Locate Me" to test browser GPS radius filtering against the production `$geoNear` aggregation pipeline.
- [ ] **Moderation Workflow:**
  Sign into `/login` with `mod@mosqueradar.com` / `Mod123!`.
  Visit `/moderation` and verify that duplicate warnings and inline editing operate as expected.
- [ ] **Security Headers:**
  Run `curl -I https://mosque-radar-api.onrender.com/api/test` and confirm `X-Content-Type-Options: nosniff` and `Cross-Origin-Resource-Policy: cross-origin` are present.
