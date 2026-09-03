# 🏙️ Keyboard Warriors — Commute-First Real Estate Platform

A modern, high-performance real estate discovery platform built around commute time and location anchoring. Find apartments, homes, and plots within your maximum daily commute from your office, campus, or workplace.

---

## 🌟 Key Features

- 🗺️ **Live Commute Map**: Interactive Leaflet engine with high-resolution dark retina tiles, dynamic commute radius aura, shortest-path polylines, and distance badges.
- ⏱️ **Commute Radius Search**: Instant filtering based on Drive, Transit, Cycle, or Walk travel times.
- 🧮 **Financial & Commute Calculator**: Mortgage EMI breakdowns, fuel & transport cost estimations, and investment ROI tradeoffs.
- 🏡 **Property Owner / Seller Portal**: Multi-step wizard with interactive map location pinning.
- 📊 **Market Analytics**: Neighborhood price per sqft trends, supply vs. demand metrics, and commute efficiency indexes.
- 🚀 **Next-Gen Spatial AI Blueprint**: See [`MASTER_PROMPT.md`](./MASTER_PROMPT.md) for the complete production prompt to recreate and expand this platform with 3D Spatial Maps, Isochrones, and AI Agents.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, Shadcn UI primitives
- **Maps & GIS**: Leaflet (token-free, high-performance dark raster tiles from CARTO & Esri)
- **Backend**: Node.js, Express.js (REST API layer)
- **Data & Charts**: Recharts, OpenStreetMap Nominatim Geocoding API

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install --legacy-peer-deps
```

### 2. Run Development Server
```bash
npm run dev
```
- **Frontend**: [http://localhost:8080/](http://localhost:8080/)
- **Backend API**: [http://localhost:3001/](http://localhost:3001/)

### 3. Build for Production
```bash
npm run build
```

---

## 📄 Re-creation & Expansion Prompt

Check out [`MASTER_PROMPT.md`](./MASTER_PROMPT.md) for the full architectural prompt to build and deploy an enterprise-grade version from scratch.
