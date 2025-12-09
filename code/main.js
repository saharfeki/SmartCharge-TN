/* main.js - Tunisia EV Map
   - expects data/stations.json (array of stations with keys id,name,lat,lng,power_kW,plug_type,operator)
*/
// ============================================
// OSRM ROUTING IMPLEMENTATION
// ============================================

// Add these constants at the top of main.js (after the existing constants)
const OSRM_API_URL = 'https://router.project-osrm.org/route/v1/driving/';
// Alternative OSRM servers if needed:
// - https://routing.openstreetmap.de/routed-car/route/v1/driving/
// - https://osrm.astuntechnology.com/route/v1/driving/

// OSRM routing function
async function calculateOSRMRoute(start, dest, viaStation = null) {
  try {
    // Show loading
    const routeResult = document.getElementById('routeResult');
    if (routeResult) {
      routeResult.textContent = 'Calculating route with OSRM...';
      routeResult.style.color = '#f59e0b';
    }

    // Build coordinates string for OSRM
    let coordinates;
    if (viaStation) {
      coordinates = `${start.lng},${start.lat};${viaStation.lng},${viaStation.lat};${dest.lng},${dest.lat}`;
    } else {
      coordinates = `${start.lng},${start.lat};${dest.lng},${dest.lat}`;
    }

    // OSRM API request
    const url = `${OSRM_API_URL}${coordinates}?overview=full&geometries=geojson&steps=true`;
    
    console.log('Fetching OSRM route from:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`OSRM API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.code !== 'Ok') {
      throw new Error(`OSRM routing error: ${data.message || 'Unknown error'}`);
    }
    
    // Extract route data
    const route = data.routes[0];
    
    // Get the geometry (coordinates array)
    const coordinatesArray = route.geometry.coordinates;
    
    // Convert from [lng, lat] to [lat, lng] for Leaflet
    const path = coordinatesArray.map(coord => [coord[1], coord[0]]);
    
    // Draw the route on map
    drawOSRMRoute(path, route, viaStation);
    
    // Display route information
    displayOSRMRouteInfo(route, viaStation);
    
    return route;
    
  } catch (error) {
    console.error('OSRM routing error:', error);
    
    // Fallback to straight line
    const routeResult = document.getElementById('routeResult');
    if (routeResult) {
      routeResult.innerHTML = `<div style="color: #ef4444;">OSRM Error: ${error.message}. Showing straight line.</div>`;
    }
    
    // Draw straight line as fallback
    let points = [[start.lat, start.lng], [dest.lat, dest.lng]];
    if (viaStation) {
      points = [[start.lat, start.lng], [viaStation.lat, viaStation.lng], [dest.lat, dest.lng]];
    }
    drawRouteLine(points);
    
    return null;
  }
}

// Draw OSRM route on map
function drawOSRMRoute(path, routeData, viaStation = null) {
  // Clear previous route
  routeLayer.clearLayers();
  
  // Create the route polyline
  const routePolyline = L.polyline(path, {
    color: '#3b82f6',
    weight: 6,
    opacity: 0.8,
    lineJoin: 'round',
    lineCap: 'round',
    dashArray: null
  }).addTo(routeLayer);
  
  // Add start marker
  if (path.length > 0) {
    const startIcon = L.divIcon({
      html: '<div style="background:#10b981;color:white;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);font-weight:bold">S</div>',
      className: '',
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });
    
    L.marker(path[0], { icon: startIcon })
      .addTo(routeLayer)
      .bindPopup('<b>Start Point</b>', { autoClose: false })
      .openPopup();
  }
  
  // Add charging station marker if applicable
  if (viaStation) {
    const stationIcon = L.divIcon({
      html: `<div style="background:#f59e0b;color:white;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);font-weight:bold">⚡</div>`,
      className: '',
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });
    
    // Find the point in path closest to the station
    let closestPoint = path[0];
    let minDistance = Infinity;
    
    path.forEach(point => {
      const dist = haversineKm(point[0], point[1], viaStation.lat, viaStation.lng);
      if (dist < minDistance) {
        minDistance = dist;
        closestPoint = point;
      }
    });
    
    L.marker(closestPoint, { icon: stationIcon })
      .addTo(routeLayer)
      .bindPopup(`<b>Charging Station</b><br>${viaStation.name}<br>${viaStation.power_kW} kW`, { autoClose: false })
      .openPopup();
  }
  
  // Add end marker
  if (path.length > 1) {
    const endIcon = L.divIcon({
      html: '<div style="background:#ef4444;color:white;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);font-weight:bold">E</div>',
      className: '',
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });
    
    L.marker(path[path.length - 1], { icon: endIcon })
      .addTo(routeLayer)
      .bindPopup('<b>Destination</b>', { autoClose: false })
      .openPopup();
  }
  
  // Fit bounds to show entire route
  setTimeout(() => {
    map.fitBounds(routePolyline.getBounds(), { 
      padding: [50, 50],
      maxZoom: 12
    });
  }, 500);
}

// Display OSRM route information
function displayOSRMRouteInfo(routeData, viaStation = null) {
  const distance = (routeData.distance / 1000).toFixed(1); // Convert to km
  const duration = Math.round(routeData.duration / 60); // Convert to minutes
  
  const routeResult = document.getElementById('routeResult');
  if (!routeResult) return;
  
  let html = `
    <div style="background:#f8fafc;border-radius:8px;padding:12px;margin-top:8px;border:1px solid #e5e7eb;">
      <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
        <span><strong>🚗 Real Distance:</strong></span>
        <span style="color:#3b82f6;font-weight:bold">${distance} km</span>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:12px;">
        <span><strong>⏱️ Estimated Time:</strong></span>
        <span style="color:#3b82f6;font-weight:bold">${duration} min</span>
      </div>
  `;
  
  if (viaStation) {
    html += `
      <div style="margin-top:8px;padding-top:8px;border-top:1px solid #e5e7eb;">
        <strong>⚡ Charging Stop:</strong> ${viaStation.name}<br>
        <small style="color:#6b7280">${viaStation.power_kW} kW • ${viaStation.plug_type}</small>
      </div>
    `;
  }
  
  // Add step-by-step instructions if available
  if (routeData.legs && routeData.legs.length > 0) {
    html += `<div style="margin-top:12px;max-height:200px;overflow-y:auto;">`;
    html += `<strong style="display:block;margin-bottom:6px;">📝 Turn-by-turn:</strong>`;
    
    routeData.legs.forEach((leg, legIndex) => {
      if (leg.steps) {
        leg.steps.forEach((step, stepIndex) => {
          if (stepIndex < 8) { // Limit to first 8 steps per leg
            const instruction = step.maneuver.instruction || `Continue for ${(step.distance/1000).toFixed(1)} km`;
            const distance = (step.distance / 1000).toFixed(1);
            html += `
              <div style="padding:6px 0;border-bottom:1px solid #f1f1f1;font-size:13px;">
                <div>${instruction}</div>
                <div style="color:#6b7280;font-size:12px;">${distance} km • ${Math.round(step.duration/60)} min</div>
              </div>
            `;
          }
        });
      }
    });
    
    html += `</div>`;
  }
  
  html += `</div>`;
  
  routeResult.innerHTML = html;
  routeResult.style.color = '';
}

// Enhanced routing function that uses OSRM
async function calculateRealRouteWithOSRM() {
  const destText = document.getElementById('destInput').value.trim();
  const dest = parseLatLng(destText);
  
  if (!startPoint) {
    alert('Please set a starting point (click map or use GPS)');
    return;
  }
  
  if (!dest) {
    alert('Set destination first (click "Set as destination" on a station or paste "lat, lng")');
    return;
  }
  
  const range = parseFloat(document.getElementById('rangeInput').value) || 300;
  const safety = parseFloat(document.getElementById('safetyInput').value) || 10;
  
  // Calculate straight-line distance first
  const directDistance = haversineKm(startPoint.lat, startPoint.lng, dest.lat, dest.lng);
  const effectiveRange = Math.max(0, range - safety);
  
  // Show initial message
  const routeResult = document.getElementById('routeResult');
  routeResult.innerHTML = `<div style="color:#6b7280">Calculating real road distance...</div>`;
  
  if (directDistance <= effectiveRange) {
    // Direct route possible - calculate real road distance
    const route = await calculateOSRMRoute(startPoint, dest);
    
    if (route) {
      const realDistance = (route.distance / 1000).toFixed(1);
      const duration = Math.round(route.duration / 60);
      
      // Compare straight-line vs real distance
      routeResult.innerHTML = `
        <div style="background:#f0f9ff;border-radius:8px;padding:12px;margin-top:8px;">
          <div style="display:flex;justify-content:space-between;">
            <span>📏 Straight-line:</span>
            <span>${directDistance.toFixed(1)} km</span>
          </div>
          <div style="display:flex;justify-content:space-between;font-weight:bold;color:#3b82f6;">
            <span>🛣️ Road distance:</span>
            <span>${realDistance} km</span>
          </div>
          <div style="display:flex;justify-content:space-between;margin-top:4px;">
            <span>⏱️ Drive time:</span>
            <span>${duration} min</span>
          </div>
          <div style="margin-top:8px;font-size:12px;color:#6b7280;">
            <i>Road distance is ${(realDistance - directDistance).toFixed(1)} km longer than straight-line</i>
          </div>
        </div>
      `;
    }
  } else {
    // Need charging station
    const suggestion = suggestStationForRoute(startPoint, dest, range, safety);
    
    if (suggestion.suggested) {
      const station = suggestion.suggested;
      
      // Calculate route with charging station
      const route = await calculateOSRMRoute(startPoint, dest, station);
      
      if (route) {
        const totalDistance = (route.distance / 1000).toFixed(1);
        const totalDuration = Math.round(route.duration / 60);
        
        // Calculate distances to station
        const startToStation = haversineKm(startPoint.lat, startPoint.lng, station.lat, station.lng);
        const stationToDest = haversineKm(station.lat, station.lng, dest.lat, dest.lng);
        
        routeResult.innerHTML = `
          <div style="background:#fffbeb;border-radius:8px;padding:12px;margin-top:8px;">
            <div style="color:#d97706;font-weight:bold;margin-bottom:8px;">🔋 Charging Required</div>
            <div style="display:flex;justify-content:space-between;">
              <span>📍 To station:</span>
              <span>${startToStation.toFixed(1)} km</span>
            </div>
            <div style="display:flex;justify-content:space-between;">
              <span>📍 Station to dest:</span>
              <span>${stationToDest.toFixed(1)} km</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-weight:bold;color:#3b82f6;margin-top:4px;">
              <span>🛣️ Total road distance:</span>
              <span>${totalDistance} km</span>
            </div>
            <div style="display:flex;justify-content:space-between;margin-top:4px;">
              <span>⏱️ Total time:</span>
              <span>${totalDuration} min</span>
            </div>
            <div style="margin-top:8px;padding:8px;background:#fef3c7;border-radius:4px;">
              <strong>⚡ ${station.name}</strong><br>
              <small>${station.power_kW} kW • ${station.plug_type} • ${station.operator}</small>
            </div>
          </div>
        `;
      }
    } else {
      routeResult.textContent = suggestion.message;
    }
  }
}

// Open route in external map
function openRouteInExternalMaps(start, dest, viaStation = null) {
  let origin = `${start.lat},${start.lng}`;
  let destination = `${dest.lat},${dest.lng}`;
  
  // Try to use Google Maps first
  let url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;
  
  if (viaStation) {
    url += `&waypoints=${viaStation.lat},${viaStation.lng}`;
  }
  
  // Open in new tab
  window.open(url, '_blank', 'noopener,noreferrer');
  
  // Also provide OpenStreetMap alternative
  const osmUrl = `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${origin};${destination}`;
  console.log('OSRM/OpenStreetMap URL:', osmUrl);
}

// ============================================
// UPDATE EXISTING FUNCTIONS
// ============================================

// Replace the existing calcRoute event listener in wireUI() function
// Find this in wireUI() and replace it:

// OLD (remove or comment out):
// document.getElementById('calcRoute').addEventListener('click', () => {
//   const destText = document.getElementById('destInput').value.trim();
//   const dest = parseLatLng(destText);
//   // ... existing code ...
// });

// NEW: Add this to wireUI() function:
document.getElementById('calcRoute').addEventListener('click', async () => {
  await calculateRealRouteWithOSRM();
});

// Add Open in Maps button to route panel
function addMapButtons() {
  const routeControls = document.querySelector('.route-controls');
  if (!routeControls) return;
  
  // Check if buttons already exist
  if (document.getElementById('openMapsBtn')) return;
  
  // Create button container
  const buttonContainer = document.createElement('div');
  buttonContainer.style.marginTop = '12px';
  buttonContainer.style.display = 'flex';
  buttonContainer.style.gap = '8px';
  
  // Open in Google Maps button
  const openMapsBtn = document.createElement('button');
  openMapsBtn.id = 'openMapsBtn';
  openMapsBtn.className = 'btn secondary';
  openMapsBtn.style.flex = '1';
  openMapsBtn.innerHTML = '🗺️ Open in Maps';
  openMapsBtn.title = 'Open route in Google Maps for navigation';
  
  openMapsBtn.addEventListener('click', () => {
    const destText = document.getElementById('destInput').value.trim();
    const dest = parseLatLng(destText);
    
    if (!startPoint || !dest) {
      alert('Please set both start and destination points first');
      return;
    }
    
    // Check if we have a suggested station
    const routeResult = document.getElementById('routeResult').textContent;
    let viaStation = null;
    
    // Look for station name in route result
    if (routeResult.includes('Charging Station') || routeResult.includes('Suggest') || routeResult.includes('Closest')) {
      // Try to find the station from the message
      const stationMatch = routeResult.match(/Charging Station.*?>(.*?)</) || 
                          routeResult.match(/Suggest (.*?) \(/) ||
                          routeResult.match(/Closest: (.*?) \(/);
      
      if (stationMatch) {
        const stationName = stationMatch[1].trim();
        viaStation = stations.find(s => s.name.includes(stationName));
      }
    }
    
    openRouteInExternalMaps(startPoint, dest, viaStation);
  });
  
  // Clear Route button (if not already there)
  if (!document.getElementById('clearRouteOSRM')) {
    const clearBtn = document.createElement('button');
    clearBtn.id = 'clearRouteOSRM';
    clearBtn.className = 'btn-ghost';
    clearBtn.textContent = 'Clear';
    clearBtn.title = 'Clear route from map';
    
    clearBtn.addEventListener('click', () => {
      routeLayer.clearLayers();
      document.getElementById('routeResult').textContent = '';
      if (startMarker) startMarker.closePopup();
    });
    
    buttonContainer.appendChild(clearBtn);
  }
  
  buttonContainer.appendChild(openMapsBtn);
  routeControls.appendChild(buttonContainer);
}

// ============================================
// MODIFY THE BOOT FUNCTION
// ============================================

// Update the window load event to add the buttons
window.addEventListener('load', async () => {
  console.log("Initializing EV Map with OSRM routing...");
  
  // Initialize map
  initMap();
  console.log("Map initialized");
  
  // Wire UI controls
  wireUI();
  console.log("UI wired");
  
  // Load stations
  await loadStations();
  console.log("Stations loaded");
  
  // Add map buttons to route panel
  addMapButtons();
  console.log("Route buttons added");
  
  // Setup map move listener for unserved zones
  map.on('moveend', () => {
    const unservedToggle = document.getElementById('toggleUnserved');
    if (unservedToggle && unservedToggle.checked) {
      drawUnserved(true);
    }
  });
  
  console.log("EV Map with OSRM routing fully initialized");
  
  // Test OSRM connection
  testOSRMConnection();
});

// Test OSRM connection
async function testOSRMConnection() {
  try {
    const testUrl = `${OSRM_API_URL}9.8301351,37.2603063;10.2657944,36.8491697?overview=simplified`;
    const response = await fetch(testUrl);
    
    if (response.ok) {
      console.log('✅ OSRM API connection successful');
    } else {
      console.warn('⚠️ OSRM API connection issue, falling back to straight-line routing');
    }
  } catch (error) {
    console.warn('⚠️ OSRM API not reachable, will use straight-line routing as fallback');
  }
}

// ============================================
// ADDITIONAL HELPER FUNCTION
// ============================================

// Helper to format duration
function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}
// ---------- App state ----------
const DATA_PATH = 'data/station.json'; // Changed to match your actual filename
let stations = [];
let map;
let markersLayer, coverageLayer, heatLayer, unservedLayer, routeLayer, startMarker;
let heatLayerObj = null;
let startPoint = null;
const defaultCenter = [34.0, 9.5];
const defaultZoom = 7;

// ---------- Utilities ----------
function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = d => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2)**2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function parseLatLng(text) {
  if (!text) return null;
  const p = text.split(',').map(s => parseFloat(s.trim()));
  if (p.length !== 2 || p.some(x => Number.isNaN(x))) return null;
  return { lat: p[0], lng: p[1] };
}

// ---------- Init map ----------
function initMap() {
  map = L.map('map', { center: defaultCenter, zoom: defaultZoom, preferCanvas: true });
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  markersLayer = L.layerGroup().addTo(map);
  coverageLayer = L.layerGroup().addTo(map);
  unservedLayer = L.layerGroup().addTo(map);
  routeLayer = L.layerGroup().addTo(map);

  // click on map sets start
  map.on('click', (e) => {
    setStart(e.latlng.lat, e.latlng.lng);
  });
}

// ---------- Load stations function ----------
async function loadStations() {
  try {
    console.log("Attempting to load stations from:", DATA_PATH);
    
    const response = await fetch(DATA_PATH);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
    }
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error(`Expected JSON but got: ${contentType}`);
    }
    
    const data = await response.json();
    console.log("Successfully loaded stations:", data);
    
    if (!Array.isArray(data)) {
      throw new Error("Data is not an array");
    }
    
    // Store globally
    stations = data;
    
    // Render stations on map
    renderStations();
    
    return data;
    
  } catch (error) {
    console.error("Error loading stations:", error);
    console.error("Full error:", error.message);
    
    // Try alternative path
    console.log("Trying alternative path: ./data/station.json");
    try {
      const altResponse = await fetch('./data/station.json');
      if (altResponse.ok) {
        const altData = await altResponse.json();
        console.log("Loaded from alternative path:", altData);
        stations = altData;
        renderStations();
        return altData;
      }
    } catch (altError) {
      console.error("Alternative path also failed:", altError);
    }
    
    // Show friendly error
    alert(`Could not load stations. Please check:\n1. File exists at: ${DATA_PATH}\n2. File contains valid JSON\n3. Server is running\n\nError: ${error.message}`);
    
    // Add some fallback test markers
    addFallbackMarkers();
    
    return [];
  }
}

// Fallback markers if file can't be loaded
function addFallbackMarkers() {
  console.log("Adding fallback markers...");
  
  const fallbackStations = [
    {id:"TN001", name:"TotalEnergies - Bizerte", lat:37.2603063, lng:9.8301351, power_kW:22, plug_type:"Type 2", operator:"TotalEnergies"},
    {id:"TN002", name:"TotalEnergies - Tunis", lat:36.8491697, lng:10.2657944, power_kW:22, plug_type:"Type 2", operator:"TotalEnergies"},
    {id:"TN003", name:"TotalEnergies - Sousse", lat:35.8403812, lng:10.6221662, power_kW:50, plug_type:"Type 2", operator:"TotalEnergies"}
  ];
  
  stations = fallbackStations;
  renderStations();
}

// ---------- Create marker icon ----------
function createIcon(power_kW) {
  let color = '#10b981'; // green
  if (power_kW >= 50) color = '#f59e0b'; // amber
  if (power_kW >= 150) color = '#ef4444'; // red
  const html = `
    <div style="width:44px;height:44px;display:flex;align-items:center;justify-content:center">
      <svg width="44" height="44" viewBox="0 0 44 44">
        <circle cx="22" cy="22" r="18" fill="${color}" stroke="#fff" stroke-width="3"></circle>
        <text x="22" y="27" text-anchor="middle" font-size="11" fill="#fff" font-weight="700">${power_kW}</text>
      </svg>
    </div>`;
  return L.divIcon({ html, className: '', iconSize: [44,44], iconAnchor: [22,44], popupAnchor: [0,-44] });
}

// ---------- Render stations ----------
function renderStations(filter = '') {
  if (!markersLayer) return;
  
  markersLayer.clearLayers();
  const listDiv = document.getElementById('stationList');
  if (!listDiv) return;
  
  listDiv.innerHTML = '';

  const q = (filter || '').toLowerCase();
  let shown = 0;

  stations.forEach(st => {
    // Validate station data
    if (!st.lat || !st.lng) {
      console.warn("Station missing coordinates:", st);
      return;
    }

    // Filter by search
    const hay = `${st.name || ''} ${st.operator || ''} ${st.plug_type || ''}`.toLowerCase();
    if (q && !hay.includes(q)) return;

    shown++;

    // Create marker
    const icon = createIcon(st.power_kW || 22);
    const marker = L.marker([st.lat, st.lng], { icon }).addTo(markersLayer);

    // Create popup
    const popupHtml = `
      <div style="min-width:240px;font-family:Inter,Arial,sans-serif">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div style="font-weight:700">${st.name || 'Unnamed Station'}</div>
          <div style="font-size:12px;padding:4px 8px;border-radius:999px;background:${st.power_kW>=150? '#ef4444' : st.power_kW>=50 ? '#f59e0b' : '#10b981'};color:white">
            ${st.power_kW || 22} kW
          </div>
        </div>
        <div style="color:#6b7280;margin-top:6px">${st.operator || ''}</div>
        <div style="display:flex;gap:8px;margin-top:8px;font-size:13px">
          <div>⚡ <strong>${st.power_kW || 22}</strong> kW</div>
          <div>🔌 ${st.plug_type || ''}</div>
        </div>
        <div style="margin-top:10px;display:flex;gap:8px">
          <button class="btn-popup" data-id="${st.id}" data-action="set-start">Start here</button>
          <button class="btn-popup" data-id="${st.id}" data-action="set-dest">Set as destination</button>
        </div>
      </div>`;

    marker.bindPopup(popupHtml, { minWidth: 240 });

    // Handle popup button clicks
    marker.on('popupopen', () => {
      const popupEl = marker.getPopup().getElement();
      if (!popupEl) return;
      
      popupEl.querySelectorAll('.btn-popup').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = btn.getAttribute('data-id');
          const action = btn.getAttribute('data-action');
          const s = stations.find(x => x.id === id);
          if (!s) return;
          
          if (action === 'set-start') {
            setStart(s.lat, s.lng);
            marker.closePopup();
          } else if (action === 'set-dest') {
            document.getElementById('destInput').value = `${s.lat}, ${s.lng}`;
            marker.closePopup();
            map.panTo([s.lat, s.lng], { animate: true });
          }
        });
      });
    });

    // Add to sidebar list
    const item = document.createElement('div');
    item.className = 'station-item';
    item.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div>
          <div style="font-weight:700">${st.name || 'Unnamed Station'}</div>
          <div class="muted small">${st.operator || ''} • ${st.plug_type || ''}</div>
        </div>
        <div style="text-align:right">
          <div style="font-weight:700">${st.power_kW || 22} kW</div>
          <button class="btn-small" style="margin-top:6px">View</button>
        </div>
      </div>`;
    
    item.querySelector('.btn-small').addEventListener('click', (e) => {
      e.stopPropagation();
      map.setView([st.lat, st.lng], 13, { animate: true });
      marker.openPopup();
    });
    
    listDiv.appendChild(item);
  });

  const countsElement = document.getElementById('counts');
  if (countsElement) {
    countsElement.textContent = `${shown} shown • ${stations.length} total`;
  }
}

// ---------- Overlays ----------
function drawCoverage(show) {
  if (!coverageLayer) return;
  coverageLayer.clearLayers();
  if (!show) return;
  
  stations.forEach(st => {
    if (st.lat && st.lng) {
      L.circle([st.lat, st.lng], {
        radius: 5000,
        color: st.power_kW >= 150 ? '#ef4444' : st.power_kW >= 50 ? '#f59e0b' : '#10b981',
        fillColor: st.power_kW >= 150 ? '#ef4444' : st.power_kW >= 50 ? '#f59e0b' : '#10b981',
        fillOpacity: 0.08,
        weight: 1
      }).addTo(coverageLayer);
    }
  });
}

function drawHeat(show) {
  if (!show) {
    if (heatLayerObj) { heatLayerObj.remove(); heatLayerObj = null; }
    return;
  }
  const pts = stations.filter(s => s.lat && s.lng).map(s => [s.lat, s.lng, 0.6]);
  heatLayerObj = L.heatLayer(pts, { radius: 25, blur: 15, maxZoom: 12 }).addTo(map);
}

function drawUnserved(show) {
  if (!unservedLayer) return;
  unservedLayer.clearLayers();
  if (!show) return;
  
  const thresholdKm = 60;
  const bounds = map.getBounds();
  const north = bounds.getNorth(), south = bounds.getSouth();
  const west = bounds.getWest(), east = bounds.getEast();
  const latStep = Math.max(0.4, (north - south) / 12);
  const lngStep = Math.max(0.4, (east - west) / 12);

  for (let lat = south; lat <= north; lat += latStep) {
    for (let lng = west; lng <= east; lng += lngStep) {
      let nearest = Infinity;
      for (const s of stations) {
        if (s.lat && s.lng) {
          const d = haversineKm(lat, lng, s.lat, s.lng);
          if (d < nearest) nearest = d;
        }
      }
      if (nearest > thresholdKm) {
        L.circle([lat, lng], { radius: 15000, color: '#ff6b6b', fillOpacity: 0.03, weight: 0.6 }).addTo(unservedLayer);
      }
    }
  }
}

// ---------- Routing ----------
function setStart(lat, lng) {
  startPoint = { lat, lng };
  if (!startMarker) {
    startMarker = L.marker([lat, lng], { draggable: true }).addTo(map).bindPopup('Start').openPopup();
    startMarker.on('dragend', e => {
      const p = e.target.getLatLng();
      setStart(p.lat, p.lng);
    });
  } else {
    startMarker.setLatLng([lat, lng]).openPopup();
  }
  
  const startPreview = document.getElementById('startPreview');
  if (startPreview) {
    startPreview.textContent = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
}

function clearRoute() {
  if (routeLayer) routeLayer.clearLayers();
  const routeResult = document.getElementById('routeResult');
  if (routeResult) routeResult.textContent = '';
}

function drawRouteLine(points) {
  if (!routeLayer) return;
  routeLayer.clearLayers();
  L.polyline(points, { color: '#5a45ff', weight: 4, opacity: 0.9 }).addTo(routeLayer);
  map.fitBounds(L.latLngBounds(points), { padding: [40,40] });
}

function suggestStationForRoute(start, dest, rangeKm, safetyKm) {
  const effective = Math.max(0, rangeKm - safetyKm);
  const direct = haversineKm(start.lat, start.lng, dest.lat, dest.lng);
  
  if (direct <= effective) {
    return { reachable: true, message: `Directly reachable — ${direct.toFixed(1)} km` };
  }

  const candidates = stations.map(s => {
    const dStart = haversineKm(start.lat, start.lng, s.lat, s.lng);
    const dToDest = haversineKm(s.lat, s.lng, dest.lat, dest.lng);
    return { station: s, dStart, dToDest, score: dStart + dToDest };
  }).filter(c => c.dStart <= effective);

  if (candidates.length) {
    candidates.sort((a,b) => a.score - b.score);
    const best = candidates[0];
    return {
      reachable: false,
      suggested: best.station,
      message: `Not directly reachable. Suggest ${best.station.name} (start→station ${best.dStart.toFixed(1)} km, station→dest ${best.dToDest.toFixed(1)} km)`
    };
  }

  // fallback: nearest station to start
  const nearest = stations.map(s => ({ s, d: haversineKm(start.lat, start.lng, s.lat, s.lng) })).sort((a,b)=>a.d-b.d)[0];
  return { reachable: false, suggested: nearest.s, message: `No reachable intermediate found. Closest: ${nearest.s.name} (${nearest.d.toFixed(1)} km)` };
}

// ---------- UI wiring ----------
function wireUI() {
  // User display
  try {
    const userRaw = localStorage.getItem('evUser');
    if (userRaw) {
      const u = JSON.parse(userRaw);
      document.getElementById('userName').textContent = u.name || u.email || 'User';
    } else {
      document.getElementById('userName').textContent = 'Guest';
    }
  } catch (e) {
    console.warn("Could not load user:", e);
  }

  // Search
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      renderStations(e.target.value);
    });
  }
  
  const clearSearch = document.getElementById('clearSearch');
  if (clearSearch) {
    clearSearch.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      renderStations('');
    });
  }

  // Toggles
  const toggleCoverage = document.getElementById('toggleCoverage');
  if (toggleCoverage) {
    toggleCoverage.addEventListener('change', (e) => drawCoverage(e.target.checked));
  }
  
  const toggleHeat = document.getElementById('toggleHeat');
  if (toggleHeat) {
    toggleHeat.addEventListener('change', (e) => drawHeat(e.target.checked));
  }
  
  const toggleUnserved = document.getElementById('toggleUnserved');
  if (toggleUnserved) {
    toggleUnserved.addEventListener('change', (e) => drawUnserved(e.target.checked));
  }

  // GPS buttons
  const useGps = document.getElementById('useGps');
  if (useGps) {
    useGps.addEventListener('click', () => {
      if (!navigator.geolocation) return alert('Geolocation not supported');
      navigator.geolocation.getCurrentPosition(pos => {
        setStart(pos.coords.latitude, pos.coords.longitude);
        map.setView([pos.coords.latitude, pos.coords.longitude], 12, { animate: true });
      }, (err) => alert('Geolocation error: ' + err.message));
    });
  }
  
  const locateFab = document.getElementById('locateFab');
  if (locateFab) {
    locateFab.addEventListener('click', () => {
      if (!navigator.geolocation) return alert('Geolocation not supported');
      navigator.geolocation.getCurrentPosition(pos => {
        setStart(pos.coords.latitude, pos.coords.longitude);
        map.setView([pos.coords.latitude, pos.coords.longitude], 12, { animate: true });
      }, (err) => alert('Geolocation error: ' + err.message));
    });
  }

  // Route controls
  const calcRoute = document.getElementById('calcRoute');
  if (calcRoute) {
    calcRoute.addEventListener('click', () => {
      const destInput = document.getElementById('destInput');
      if (!destInput) return;
      
      const destText = destInput.value.trim();
      const dest = parseLatLng(destText);
      
      if (!startPoint) return alert('Please set a starting point (click map or use GPS)');
      if (!dest) return alert('Set destination first (click "Set as destination" on a station or paste "lat, lng")');

      const rangeInput = document.getElementById('rangeInput');
      const safetyInput = document.getElementById('safetyInput');
      const range = parseFloat(rangeInput ? rangeInput.value : 300) || 300;
      const safety = parseFloat(safetyInput ? safetyInput.value : 10) || 10;

      const suggestion = suggestStationForRoute(startPoint, dest, range, safety);
      
      const routeResult = document.getElementById('routeResult');
      if (routeResult) routeResult.textContent = suggestion.message;

      if (suggestion.reachable) {
        drawRouteLine([[startPoint.lat, startPoint.lng], [dest.lat, dest.lng]]);
      } else if (suggestion.suggested) {
        const s = suggestion.suggested;
        drawRouteLine([[startPoint.lat, startPoint.lng], [s.lat, s.lng], [dest.lat, dest.lng]]);
      }
    });
  }

  const clearRouteBtn = document.getElementById('clearRoute');
  if (clearRouteBtn) {
    clearRouteBtn.addEventListener('click', clearRoute);
  }

  // Route panel collapse
  const routeToggle = document.getElementById('routeToggle');
  const routePanel = document.getElementById('routePanel');
  if (routeToggle && routePanel) {
    let collapsed = false;
    routeToggle.addEventListener('click', () => {
      collapsed = !collapsed;
      routePanel.style.width = collapsed ? '54px' : '360px';
      routeToggle.textContent = collapsed ? '◀' : '▶';
    });
  }

  // Logout
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('evUser');
      window.location.href = 'index.html';
    });
  }
}

// ---------- Initialize everything ----------
window.addEventListener('load', async () => {
  console.log("Initializing EV Map...");
  
  // Initialize map
  initMap();
  console.log("Map initialized");
  
  // Wire UI controls
  wireUI();
  console.log("UI wired");
  
  // Load stations
  await loadStations();
  console.log("Stations loaded");
  
  // Setup map move listener for unserved zones
  map.on('moveend', () => {
    const unservedToggle = document.getElementById('toggleUnserved');
    if (unservedToggle && unservedToggle.checked) {
      drawUnserved(true);
    }
  });
  
  console.log("EV Map fully initialized");
});