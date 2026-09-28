# 🚀 Commute Buddy: Public Live Deployment Guide

This guide walks you step-by-step through making **Commute Buddy** live on the public internet so anyone can access it.

---

## 🌟 Architecture Overview for Deployment

```
[ Public Users / Mobile / Desktop ]
                │
                ▼
┌────────────────────────────────────────┐
│     Vercel / Netlify (Frontend)        │  <-- Free, Fast Global Edge CDN
│     React + TypeScript + Vite + Leaflet│
└──────────────────┬─────────────────────┘
                   │
                   │ (REST API / OSRM Proxy)
                   ▼
┌────────────────────────────────────────┐
│     Render / Railway (Backend API)     │  <-- Free Cloud Node.js Container
│     Express + Algorithm 1 + Scraper    │
└──────────────────┬─────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────┐
│   Aiven / PlanetScale (MySQL 3NF DB)   │  <-- Free Cloud Managed Database
│   schema.sql (6 Core Relational Entities)│
└────────────────────────────────────────┘
```

---

## ⚡ Method 1: Deploy Frontend to Vercel (Fastest & Free)

The frontend is already configured with `vercel.json` for single-page routing and production builds.

### Step 1: Push code to your GitHub repository
```bash
git add .
git commit -m "Upgrade to Commute Buddy research paper specifications"
git push origin main
```

### Step 2: Import into Vercel
1. Go to [https://vercel.com](https://vercel.com) and sign in with GitHub.
2. Click **"Add New..."** ➔ **"Project"**.
3. Select your repository (`Keyboard-warriors` or `Commute-Buddy`).
4. Keep the default settings:
   * **Framework Preset**: `Vite`
   * **Build Command**: `npm run build`
   * **Output Directory**: `dist`
5. Under **Environment Variables**, add:
   * `VITE_API_URL`: Your backend URL (e.g., `https://commute-buddy-api.onrender.com` or leave empty for offline/direct mode)
6. Click **Deploy**!
7. Within 60 seconds, you get a public URL like:
   `https://commute-buddy.vercel.app`

---

## 🖥️ Method 2: Deploy Backend to Render (Free Cloud Node.js)

### Step 1: Create a Render Account
1. Go to [https://render.com](https://render.com) and sign in with GitHub.
2. Click **"New +"** ➔ **"Web Service"**.
3. Connect your repository.

### Step 2: Configure Web Service
* **Name**: `commute-buddy-api`
* **Region**: Singapore or Frankfurt (or nearest to India)
* **Branch**: `main`
* **Root Directory**: `.`
* **Runtime**: `Node`
* **Build Command**: `npm install --legacy-peer-deps`
* **Start Command**: `node server/index.js`
* **Instance Type**: `Free`

### Step 3: Environment Variables
Add the following in Render:
* `PORT`: `3001`
* `NODE_ENV`: `production`

Click **Create Web Service**. Render will provision your API and give you a public URL like:
`https://commute-buddy-api.onrender.com`

---

## 🗄️ Method 3: Cloud MySQL Database Setup (Free)

To connect a live cloud MySQL database matching the paper's 3NF schema:

1. Sign up at [Aiven.io](https://aiven.io) or [Render MySQL](https://render.com) (free tiers available).
2. Create a new **MySQL** service.
3. Copy the Connection URI.
4. Import the schema:
```bash
mysql -h <host> -u <user> -p <database_name> < database/schema.sql
```
This automatically sets up all 6 tables with spatial composite indexes.

---

## 🔑 Method 4: Google OAuth 2.0 Sign-In Setup

To enable real Google Sign-In:

1. Visit [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project named **Commute Buddy**.
3. Go to **APIs & Services** ➔ **Credentials** ➔ **Create Credentials** ➔ **OAuth client ID**.
4. Application Type: **Web application**.
5. Authorized JavaScript origins:
   * `http://localhost:8080` (Local)
   * `https://your-app.vercel.app` (Live)
6. Authorized redirect URIs:
   * `http://localhost:8080`
   * `https://your-app.vercel.app`
7. Copy the **Client ID** and add it to your `.env` file:
```env
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

*(Note: If no Google Client ID is configured, Commute Buddy's built-in one-click OAuth simulator automatically handles authentication so your public demo works with zero friction!)*

---

## 🐳 Method 5: Run with Docker Anywhere

You can run the entire platform anywhere using Docker:

```bash
docker-compose up --build
```
* Frontend will run on port `8080`.
* Backend API will run on port `3001`.
