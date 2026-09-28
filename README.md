# 🧭 Commute Buddy: A Smart Commute-Aware Real-Estate and Housing Discovery Platform

[![Paper](https://img.shields.io/badge/Research_Paper-TGPCET_Nagpur-purple.svg)](#research-paper-attribution)
[![Frontend](https://img.shields.io/badge/Frontend-React_18_+_TypeScript_+_Vite-61dafb.svg)](#tech-stack)
[![Backend](https://img.shields.io/badge/Backend-Node.js_+_Express_REST-green.svg)](#backend-architecture)
[![GIS](https://img.shields.io/badge/GIS-OpenStreetMap_+_Leaflet_+_OSRM-3388ff.svg)](#geospatial-engine)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](#license)

> **"What can I reach from my workplace within a time budget I choose?"**  
> Commute Buddy inverts the conventional real-estate search paradigm by treating the user's workplace, rather than an arbitrary locality name or radial buffer, as the primary anchor of the entire search session.

---

## 👥 Research Paper Attribution & Authors

* **Title**: Commute Buddy: A Smart Commute-Aware Real-Estate and Housing Discovery Platform
* **Authors**:
  * **Vallabh Shingroop**
  * **Rasika Khure**
  * **Purva Mahale**
  * **Yash Kolhe**
  * **Vedant Kharabe**
* **Affiliation**: Department of Computer Science and Engineering, Tulsiramji Gaikwad Patil College of Engineering and Technology (TGPCET), Nagpur, Maharashtra, India.

---

## 🌟 Key Research Contributions & System Features

### 1. Algorithm 1: Two-Stage Commute-Filtering Pipeline
* **Coarse Spatial Index Query**: Identifies candidates $C \leftarrow \text{SpatialIndexQuery}(P, W, v_{\max}(m) \cdot T_{\max})$.
* **Haversine Lower-Bound Pruning**: Evaluates closed-form great-circle distance $d_h \leftarrow \text{Haversine}(W, p)$. If $\frac{d_h}{v_{\max}(m)} > T_{\max}$, the property is safely pruned in $O(1)$ microseconds.
* **Authoritative Network Routing**: Queries the road-network routing engine for actual road duration $T(W, p, m) \le T_{\max}$.

### 2. Multi-Factor Transparent Ranking (Equation 6)
Unlike opaque black-box algorithms, Commute Buddy scores each feasible property via an explainable weighted composite:
$$S(p) = w_1 \left(1 - \frac{T(W, p, m)}{T_{\max}}\right) + w_2 \hat{B}(p) + w_3 \hat{A}(p)$$
* $\hat{B}(p)$: Normalized Price-Fit Score
* $\hat{A}(p)$: Normalized Area-Fit Score
* $w_1, w_2, w_3$: User-adjustable weights (default equal thirds: $0.334, 0.333, 0.333$).

### 3. Open Geospatial Stack & Turn-by-Turn Road Polylines (Section XII)
* **Base Map**: OpenStreetMap (OSM) & Dark CARTO raster tiles.
* **Rendering**: Leaflet client-side engine with responsive viewports.
* **Geocoding & Reverse-Geocoding**: OpenStreetMap Nominatim engine.
* **Shortest Path Routing**: OSRM road-network engine rendering true turn-by-turn road polylines ($W \to p$).

### 4. Two-Sided Marketplace & Owner Control Center (Section XV & XVI)
* **Property Lifecycle**: Direct listing, price edits, and removal with precise map-click coordinate pinning.
* **Property Analysis (Section XVI-A)**: Track total seeker views, inquiries, and the **commute discovery distribution histogram** ($<10\text{m}$, $10\text{--}20\text{m}$, $20\text{--}30\text{m}$, $30+\text{m}$).
* **ML Smart Pricing (Section XVI-B)**: Multivariate hedonic regression price valuation based on structural specs + commute accessibility advantage.

### 5. Scraper Ingestion Pipeline (99acres & Multi-Site Scraper)
* Automated ingestion service normalizing scraped properties from `99acres-com-scraper` and `multi-site-real-estate-scraper` into the 3NF relational schema.

---

## 🗄️ Relational 3NF Database Schema (Figure 2)

The platform implements 6 core normalized entities located in [`database/schema.sql`](./database/schema.sql):
1. **`USERS`**: Google OAuth 2.0 identity with Seeker / Owner account-level role flags.
2. **`PROPERTIES`**: Listings with composite indexes on `(latitude, longitude)` for Algorithm 1 and `(owner_id, status)` for Owner Center queries.
3. **`INQUIRIES`**: 1:N relations for seeker inquiries and viewing requests.
4. **`BOOKINGS`**: Scheduled property inspection visits.
5. **`PAYMENTS`**: Transaction settlements for token bookings and deposits.
6. **`ANALYTICS`**: Write-behind asynchronous tracking of views and commute-discovery distributions.

---

## 🚀 Getting Started Locally

### 1. Install Dependencies
```bash
npm install --legacy-peer-deps
```

### 2. Start Frontend & Backend Development Servers
```bash
npm run dev
```
* **Frontend Web App**: [http://localhost:8080/](http://localhost:8080/)
* **Backend REST API**: [http://localhost:3001/](http://localhost:3001/)

### 3. Run Production Build
```bash
npm run build
```

---

## 🌐 Public Live Deployment

For complete, step-by-step instructions on deploying Commute Buddy live to the public for free via **Vercel**, **Render**, and **Aiven / PlanetScale**, see [`DEPLOYMENT_GUIDE.md`](./DEPLOYMENT_GUIDE.md).

---

## 📜 Citation

If you use Commute Buddy in your academic work, please cite:
```bibtex
@article{shingroop2026commutebuddy,
  title={Commute Buddy: A Smart Commute-Aware Real-Estate and Housing Discovery Platform},
  author={Shingroop, Vallabh and Khure, Rasika and Mahale, Purva and Kolhe, Yash and Kharabe, Vedant},
  journal={Department of Computer Science and Engineering, Tulsiramji Gaikwad Patil College of Engineering and Technology},
  year={2026},
  address={Nagpur, Maharashtra, India}
}
```
