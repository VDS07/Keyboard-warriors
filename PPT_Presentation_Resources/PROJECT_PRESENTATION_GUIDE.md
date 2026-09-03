# Project Presentation / PPT Guide: COMMUTE BUDDY
> **Project Name**: Keyboard Warriors - Commute Buddy (Smart Housing & Commute-Aware Property Platform)  
> **Template Reference**: 16-Page Project Report / Slide Structure  

---

## 📸 Presentation Image Resources (Included in `images/` folder)

Here are the visual assets ready for your presentation slides:

| Slide / Section | Description | Image Path |
| :--- | :--- | :--- |
| **Slide 6-10: Database** | MySQL Command Line Terminal & Table Schemas | `./images/database_tables_terminal.png` |
| **Slide 11: System Architecture** | Full-Stack Architecture Diagram | `./images/architecture_diagram.png` |
| **Slide 13: UI - Login & Journey** | Landing, Auth & Role Selection Modal | `./images/app_ui_landing_login.png` |
| **Slide 14: UI - Live Commute Map** | Interactive Map with Multi-modal Filtering | `./images/app_ui_live_map.png` |
| **Slide 14 (Alt): UI - Owner Control Center** | Smart Pricing Engine & Inquiries | `./images/app_ui_owner_dashboard.png` |
| **Slide 15: UI - Market Analytics** | Platform Insights & Rental Distribution | `./images/app_ui_market_analytics.png` |

---

## 📑 Slide-by-Slide Content & Details (16-Slide Template Matching)

### Slide 1: Cover Page / Title Slide
* **Header / Institute**: DTE Code: 4151 \| Tulsiramji Gaikwad-Patil College of Engineering & Technology (An Autonomous Institute), Department of Computer Science & Engineering
* **Title**: A PROJECT REPORT ON  
  **COMMUTE BUDDY: SMART COMMUTE-AWARE PROPERTY & HOUSING MANAGEMENT SYSTEM**
* **Degree Statement**: Submitted in partial fulfillment of the requirement for the award of the degree of **Computer Science and Engineering**.
* **Submitted By (Team Keyboard Warriors)**:
  1. Student Name 1 (Team Member 1)
  2. Student Name 2 (Team Member 2)
  3. Student Name 3 (Team Member 3)
  4. Student Name 4 (Team Member 4)
* **Under the Guidance of**: Dr. Subhendu Fuladi (Faculty Member, Department of Computer Science & Engineering)

---

### Slide 2: Abstract
* **Text**:  
  **Commute Buddy** is a web-based, commute-aware real-estate and housing discovery platform developed to solve the modern urban challenge of property hunting. Traditional real-estate applications display distances strictly in radial kilometers, ignoring actual travel time, traffic bottlenecks, and transport modes (driving, transit, cycling, walking).  
  
  The proposed system provides a centralized interactive platform where property buyers can search listings bounded by exact travel time to their office/university location, while property owners benefit from an automated **Smart Pricing Engine** that suggests optimal rental prices based on localized commute advantage scores. Built with React.js, Express.js, Leaflet/Nominatim GIS, and Recharts, Commute Buddy eliminates guesswork, improves transparency, and optimizes housing search efficiency.

---

### Slide 3: Introduction & Objectives
* **Background**: Finding accommodation near workplaces manually or via conventional portals leads to inaccurate travel estimates, high commute costs, and unoptimized pricing.
* **Core Objectives**:
  * To provide a user-friendly, commute-focused housing discovery platform.
  * To enable multi-modal transport filtering (Drive, Public Transit, Cycling, Walking).
  * To empower property owners with dynamic AI/demand-score pricing insights.
  * To provide market analytics and livability scoring across major urban hubs.

---

### Slide 4: Problem Statement
* **Key Challenges in Conventional Systems**:
  1. Distance-based search ignores actual transit time and city traffic.
  2. Buyers struggle to calculate door-to-door commute times to their workplace.
  3. Property owners lack empirical data for setting optimal rental prices.
  4. Fragmented buyer-owner communication leads to low lead conversions.
  5. Absence of multi-city geospatial visual mapping.
  6. Lack of integrated platform analytics for real-estate trends.
  7. Manual record keeping for property listings increases operational friction.
* **Conclusion**: Therefore, an integrated digital platform that automates travel-time calculations and dynamic pricing intelligence is required.

---

### Slide 5: Requirements & System Design Overview
* **Non-Functional Requirements**:
  * **Scalability**: Capable of handling simultaneous spatial search queries and map rendering.
  * **Security**: JWT-based session state, secure CORS policies, and role-based access control (Buyer vs Owner).
  * **Performance**: Sub-100ms client-side filter computation using TanStack Query & React Context.
* **Hardware & Software Requirements**:
  * **Frontend**: React.js, TypeScript, Tailwind CSS, Shadcn UI, Framer Motion, Leaflet / Mapbox.
  * **Backend**: Node.js, Express.js REST API.
  * **Database**: MySQL Relational Database.
  * **GIS Service**: OpenStreetMap / Nominatim Reverse Geocoding API.
  * **Minimum System Specs**: Intel Core i5, 8GB RAM, SSD Storage.
* **1.1 Database Design**: Primary entities include `users`, `properties`, `inquiries`, `bookings`, `analytics`.

---

### Slide 6: Database Tables Summary (MySQL Terminal View)
* **Image**: `./images/database_tables_terminal.png`
* **Tables Output**:
```sql
mysql> show tables in commute_buddy_db;
+-----------------------------------+
| Tables_in_commute_buddy_db        |
+-----------------------------------+
| properties                        |
| users                             |
| inquiries                         |
| bookings                          |
| payments                          |
| analytics                         |
+-----------------------------------+
6 rows in set (0.00 sec)
```

---

### Slide 7: Properties & Users Table Schemas
* **Properties Table (`desc properties;`)**:
```
+--------------------+---------------+------+-----+---------+----------------+
| Field              | Type          | Null | Key | Default | Extra          |
+--------------------+---------------+------+-----+---------+----------------+
| id                 | bigint        | NO   | PRI | NULL    | auto_increment |
| title              | varchar(255)  | YES  |     | NULL    |                |
| price              | decimal(10,2) | YES  |     | NULL    |                |
| recommended_price  | decimal(10,2) | YES  |     | NULL    |                |
| commute_advantage  | varchar(255)  | YES  |     | NULL    |                |
| demand_score       | int           | YES  |     | NULL    |                |
| lat                | double        | YES  |     | NULL    |                |
| lng                | double        | YES  |     | NULL    |                |
| views              | int           | YES  |     | 0       |                |
| inquiries          | int           | YES  |     | 0       |                |
| owner_name         | varchar(100)  | YES  |     | NULL    |                |
+--------------------+---------------+------+-----+---------+----------------+
```
* **Users Table (`desc users;`)**:
```
+------------+--------------+------+-----+---------+----------------+
| Field      | Type         | Null | Key | Default | Extra          |
+------------+--------------+------+-----+---------+----------------+
| user_id    | int          | NO   | PRI | NULL    | auto_increment |
| email      | varchar(255) | YES  | UNI | NULL    |                |
| role       | enum(...)    | YES  |     | 'buyer' |                |
| mobile     | varchar(15)  | YES  |     | NULL    |                |
| user_name  | varchar(100) | YES  |     | NULL    |                |
+------------+--------------+------+-----+---------+----------------+
```

---

### Slide 8: Inquiries & Analytics Table Schemas
* **Inquiries Table (`desc inquiries;`)**:
```
+---------------+--------------+------+-----+---------+----------------+
| Field         | Type         | Null | Key | Default | Extra          |
+---------------+--------------+------+-----+---------+----------------+
| inquiry_id    | bigint       | NO   | PRI | NULL    | auto_increment |
| property_id   | bigint       | YES  | MUL | NULL    |                |
| buyer_name    | varchar(100) | YES  |     | NULL    |                |
| buyer_phone   | varchar(15)  | YES  |     | NULL    |                |
| created_at    | datetime     | YES  |     | NOW()   |                |
+---------------+--------------+------+-----+---------+----------------+
```

---

### Slide 9: System Architecture & Diagrams Overview
* **Diagram Types Included**:
  1. **Entity Relationship Diagram (ERD)**: Relates Property, Owner, Buyer, and Inquiries.
  2. **Data Flow Diagram (DFD)**: Illustrates Geocoding & Travel Time filter pipeline.
  3. **System Architecture Diagram**: End-to-End full stack presentation model.

---

### Slide 10 - 11: Full System Architecture
* **Image**: `./images/architecture_diagram.png`
* **Architectural Layers**:
  * **Presentation Layer**: React 18, Tailwind CSS, Lucide Icons, Leaflet Maps.
  * **Service Layer**: Node.js Express REST API endpoints (`/api/properties`, `/api/owner/stats`).
  * **Integration Layer**: Nominatim Geocoding API, OpenStreetMap tile server.
  * **Data Layer**: MySQL Relational Store with indexed lat/lng coordinates.

---

### Slide 12: Implementation & Features
* **1.3 Technologies Used**:
  * **React.js & Vite**: Fast frontend component rendering.
  * **Express.js & Node**: Lightweight RESTful microservices.
  * **Leaflet & Nominatim**: Open-source GIS routing and spatial mapping.
  * **Recharts**: Interactive data visualizers for rental trends.
* **1.4 Features Implemented**:
  * **Commute-Aware Filtering**: Filter homes by office address and travel time (15–60 mins).
  * **Multi-Modal Transit Support**: Drive, Public Transit, Bicycle, Walking.
  * **Smart Pricing Engine**: Automated recommendation alerts for underpriced/overpriced units.
  * **Market Analytics Center**: Real-time distribution by price tier and property type.

---

### Slide 13: Application UI - Authentication & Role Selection
* **Image**: `./images/app_ui_landing_login.png`
* **Description**: Smooth login interface with an interactive dual-card modal allowing users to enter as a **Property Owner** or **Property Buyer**.

---

### Slide 14: Application UI - Interactive Commute Map & Owner Center
* **Images**: `./images/app_ui_live_map.png` and `./images/app_ui_owner_dashboard.png`
* **Description**:
  * **Live Map (`/map`)**: Shows workplace anchor, travel-time buffer, and property markers across major cities.
  * **Owner Dashboard (`/owner`)**: Tracks impressions, inquiry rates, and underpriced listing alerts with AI demand score indicators.

---

### Slide 15: Technical Stack Summary Table

| Category | Technologies Used |
| :--- | :--- |
| **Frontend Framework** | HTML5, CSS3, JavaScript (ES6+), React 18 (TypeScript), Vite |
| **UI Components & Styling**| Tailwind CSS, Shadcn UI, Framer Motion, Lucide Icons |
| **State & Data Fetching** | TanStack React Query, React Context API (`SearchContext`) |
| **Geospatial & Mapping** | Leaflet.js, React-Leaflet, OpenStreetMap, Nominatim API |
| **Backend & APIs** | Node.js, Express.js, RESTful APIs, CORS Middleware |
| **Charts & Visualizations**| Recharts (Line Charts, Bar Charts, Progress Metrics) |
| **Database & Analytics** | MySQL 8.0 Relational Database |

---

### Slide 16: Conclusion & References
* **Conclusion**:
  **Commute Buddy** successfully digitizes real-estate discovery by replacing static distance measurements with dynamic, commute-time intelligence. The platform empowers buyers to save daily travel hours and helps owners maximize revenue through smart pricing insights. Future enhancements include real-time live traffic integration, automated lease agreements, and predictive ML rental forecasting.
* **References**:
  1. React.js Documentation – https://react.dev
  2. Express.js API Guide – https://expressjs.com
  3. Nominatim API Docs – https://nominatim.org
  4. Leaflet Interactive Maps – https://leafletjs.com
  5. Tailwind CSS Guidelines – https://tailwindcss.com
