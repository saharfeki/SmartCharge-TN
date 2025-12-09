SmartCharge TN

A web-based platform designed to help Electric Vehicle (EV) owners in Tunisia easily locate nearby charging stations, visualize coverage and unserved areas, plan optimal routes, and explore heatmap-based spatial analysis for better charging accessibility.

SmartCharge TN was built as part of an Agile Scrum project, following structured iterations with product backlogs, sprint backlogs, task boards, burndown charts, and continuous refinement.
The platform delivers a modern and interactive mapping solution using HTML, CSS, JavaScript, Leaflet.js, and GIS layers.

1. Project Overview

Electric vehicle owners in Tunisia currently struggle to find reliable, real-time information about charging stations. Existing solutions like Google Maps, PlugShare, or STEG's station list are incomplete, not updated, or lack Tunisian localization and interactive GIS capabilities.

SmartCharge TN solves this problem by providing:

A centralized, user-friendly map of all EV charging stations

Availability of real-time status (occupied / free)

Route planning from the user location to any station

Heatmaps to show high-demand zones

Coverage analysis of existing stations

Identification of underserved areas

Admin tools to manage and update stations

This platform is designed to support EV drivers, city planners, and energy providers.

2. Key Features
User Features

View all charging stations on a dynamic map

Filter stations by type, network, or location

Real-time navigation to any station

Update personal profile (vehicle type, battery range, etc.)

View real-time availability (free/occupied)

Read and leave reviews (planned but not completed in Sprint 3)

GIS & Analytical Features

Heatmap showing high-demand charging zones

Coverage radius visualization for each station

Routing engine (shortest path with Leaflet Routing Machine)

Identification of unserved areas

Administrative map tools for adding/editing station coordinates

Admin Features

Manage charging stations (add, edit, delete)

Send broadcast alerts to users (planned in Sprint 3)

Export usage data and station information

Dashboard analytics for decision-making (partial completion)

3. Project Structure
SmartCharge-TN/
├─ code/
│  ├─ index.html              # login + landing page
│  ├─ map.html                # main map interface
│  ├─ css/                    # stylesheets
│  ├─ js/                     # application logic (routing, filters, events)
│  └─ data/                   # stations.json + GeoJSON files
├─ docs/
│  ├─ presentation.pdf        # project slides
│  ├─ report.pdf              # full written report
│  └─ demo_video.mp4          # demo of the platform
├─ README.md
├─ LICENSE
└─ .gitignore

4. How to Run the Project Locally
Option A — Open Directly

Simply open index.html using any browser.

Option B — Run with a Local Server (recommended)

Because some browsers block JSON requests:

Windows (PowerShell):

python -m http.server 8000


Then open:

http://localhost:8000/code/index.html


VS Code Live Server

Install extension “Live Server”

Right-click index.html

Click “Open with Live Server”

5. Technologies Used

Frontend: HTML5, CSS3, JavaScript

GIS Engine: Leaflet.js

Routing: Leaflet Routing Machine

Spatial Analysis: Heatmaps, buffers, unserved area detection

Database (simulated): JSON + LocalStorage

Backend (future extension): Firebase / REST API

Scrum Tools: Jira Software, Sprint Plan, Burndown Charts

6. Agile & Project Management

SmartCharge TN was developed following Scrum methodology:

Completed Deliverables

Product Backlog

Sprint Backlog (Sprint 1–3)

Sprint Planning

Release Plan

Task Boards (JIRA)

Burndown Charts for all sprints

Sprint Reviews & Retrospectives

Working demo of Release 1 & partial Release 2

Sprint Summary

Sprint 1: Successfully delivered core platform (authentication, map, admin CRUD).

Sprint 2: Delivered routing, heatmap, coverage, filters, and profile.

Sprint 3: Partial completion (only alerts, partial analytics).

7. Known Limitations

Authentication is simulated (no real Firebase backend).

Real-time station availability uses mock data.

Review system incomplete.

Admin analytics dashboard partially implemented.

Mobile responsiveness could be improved.

8. Future Improvements

Connect a real backend (Firebase / Node.js).

Integrate live charging availability APIs from STEG or private operators.

Deploy the platform online (GitHub Pages or Vercel).

Add clustering for performance with large datasets.

Add user account persistence (favorites, history, notifications).

9. License

This project is licensed under the MIT License.
Feel free to modify, reuse, and extend it.

10. Author

Developed by Sahar Feki as part of an Agile course project, demonstrating full lifecycle management using Scrum and modern web GIS technologies.