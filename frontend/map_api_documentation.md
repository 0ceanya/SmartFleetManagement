# Map API and Rendering Documentation

This document explains how the application calculates street routes, fetches map data, and renders the map to the web, explicitly omitting any AI/machine-learning model details.

## 1. Viewing and Rendering the Map (Leaflet.js)

The interactive map on the frontend is powered by **Leaflet.js**, a popular open-source JavaScript library for mobile-friendly interactive maps.

*   **Initialization:** In [`static/js/routes.js`](file:///Users/quang/code/Group3_Assignment2B/static/js/routes.js), the map is initialized on the `div` with ID `map` (defined in [`templates/routes.html`](file:///Users/quang/code/Group3_Assignment2B/templates/routes.html)).
*   **Map Tiles (Base Map):** The actual map imagery is provided by standard OpenStreetMap (OSM) tile servers via the URL template `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`.
*   **Markers:** The Start (A) and End (B) points are created as draggable `L.marker` objects on the map.

## 2. Calculating Street Routes (OSRM & Valhalla)

To trace the routes along actual streets and roads instead of just drawing straight lines between points, the application uses external routing APIs.

### Backend Proxy (`src/api/app.py`)
The application has an endpoint at `/api/osrm` (`osrm_proxy` function) which proxies the requests to avoid CORS issues and provide a fallback mechanism.

1.  **Primary API (OSRM):** It first attempts to use the public **OSRM (Open Source Routing Machine)** server (`https://router.project-osrm.org/route/v1/driving/`). It requests the full geometry in GeoJSON format.
2.  **Fallback API (Valhalla):** If OSRM fails, it falls back to **Valhalla** via OpenStreetMap (`https://valhalla1.openstreetmap.de/route?json=`). Since Valhalla returns an encoded polyline (precision 6), the backend decodes this polyline into coordinates (`_decode_polyline6`) and transforms the response into the same GeoJSON format that OSRM uses.

### Frontend Consumption (`static/js/routes.js`)
*   The `fetchOsrmAlternatives()` function calls the backend `/api/osrm` endpoint with the coordinates of the Start and End pins.
*   **Rendering the Route:** Once the geometry (an array of latitude/longitude points) is received, the `renderRoutes()` function draws it on the map. It uses `L.polyline()` to draw the lines and includes an animation function (`animateRoutePolyline()`) that smoothly reveals the route along the road geometry.

## 3. Reverse Geocoding (Nominatim)

When you drag a pin on the map, the application translates those latitude/longitude coordinates into a human-readable address (like a street or neighborhood name) for the tooltips.

*   **Backend Proxy:** The `/api/geocode/reverse` endpoint in [`src/api/app.py`](file:///Users/quang/code/Group3_Assignment2B/src/api/app.py) calls the **Nominatim** API (`https://nominatim.openstreetmap.org/reverse`).
*   **Frontend Consumption:** The `reverseLabel(lat, lon)` function in [`static/js/routes.js`](file:///Users/quang/code/Group3_Assignment2B/static/js/routes.js) calls this proxy endpoint and caches the result. Functions like `refreshOriginTooltip()` use this data to update the pin tooltips (e.g., "A — San Carlos Street").
