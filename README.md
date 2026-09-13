# ⚡ SmartCharge TN

**SmartCharge TN** is a web-based GIS platform designed to improve **electric vehicle (EV) charging accessibility in Tunisia**.

The platform enables users to locate nearby charging stations, check availability, plan routes, and explore spatial analyses such as **coverage areas, heatmaps, and underserved zones**.

Developed as part of an **Agile Scrum project**, SmartCharge TN combines modern web technologies with GIS-based analysis to provide an interactive and localized EV charging solution.

---

## 🚀 Features

### 👤 User Features

* 🗺️ Interactive map of EV charging stations
* 🔎 Filter stations by type, network, and location
* 🧭 Route planning to selected charging stations
* ⚡ Charging station availability *(mock real-time data)*
* 👤 User profile management
* 🚗 Vehicle information and battery range management

### 🗺️ GIS & Spatial Analysis

* 📍 Charging station visualization using **Leaflet.js**
* 🔥 Demand heatmaps
* 📐 Station coverage radius analysis
* 🚫 Identification of underserved areas
* 🌍 Spatial visualization of charging infrastructure
* 📌 Interactive station coordinate management

### 🔧 Admin Features

* ➕ Add charging stations
* ✏️ Edit station information and coordinates
* 🗑️ Delete charging stations
* 📊 Export station and usage data
* 📈 Dashboard analytics *(partially implemented)*
* 📢 Broadcast alerts *(planned)*

---

## 🛠️ Technologies

| Category               | Technologies                         |
| ---------------------- | ------------------------------------ |
| **Frontend**           | HTML5, CSS3, JavaScript              |
| **Web Mapping**        | Leaflet.js                           |
| **Routing**            | Leaflet Routing Machine              |
| **Spatial Analysis**   | Heatmaps, buffers, coverage analysis |
| **Data Management**    | JSON, LocalStorage                   |
| **Project Management** | Jira, Scrum                          |
| **Future Backend**     | Firebase / REST API                  |

---

## 📂 Project Structure

```text
SmartCharge-TN/
│
├── code/
│   ├── index.html          # Landing & login page
│   ├── map.html            # Main map interface
│   ├── css/                # Stylesheets
│   ├── js/                 # Application logic
│   └── data/               # Station & GeoJSON data
│
├── docs/
│   ├── presentation.pdf    # Project presentation
│   ├── report.pdf          # Full project report
│   └── demo_video.mp4      # Platform demonstration
│
├── README.md
├── LICENSE
└── .gitignore
```

---

## ▶️ Run Locally

### Option 1 — Open Directly

Open the following file in your web browser:

```text
code/index.html
```

> ⚠️ Some browsers may restrict local JSON requests when opening HTML files directly. If the application does not work correctly, use a local server.

### Option 2 — Run with a Local Server

Using Python:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000/code/index.html
```

### Option 3 — VS Code Live Server

1. Install the **Live Server** extension.
2. Right-click `code/index.html`.
3. Select **Open with Live Server**.
