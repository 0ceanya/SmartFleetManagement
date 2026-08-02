function hashSeed(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return hash;
}

const WEATHER_OPTIONS = ["Clear", "Rain", "Cloudy", "Storm"];
const TRAFFIC_OPTIONS = ["Light", "Moderate", "Heavy"];
const CATEGORY_OPTIONS = ["Standard", "Express", "Fragile", "Bulk"];

// Simulated - not persisted, presentation only
export function simulateWeather(seedId) {
  return WEATHER_OPTIONS[hashSeed(seedId) % WEATHER_OPTIONS.length];
}

// Simulated - not persisted, presentation only
export function simulateTraffic(seedId) {
  return TRAFFIC_OPTIONS[hashSeed(`${seedId}-traffic`) % TRAFFIC_OPTIONS.length];
}

// Simulated - not persisted, presentation only
export function simulateCategory(seedId, vehicleClass) {
  if (vehicleClass) return vehicleClass;
  return CATEGORY_OPTIONS[hashSeed(`${seedId}-category`) % CATEGORY_OPTIONS.length];
}

// Simulated - not persisted, presentation only
export function simulateEcoPoints(seedId, distanceKm) {
  const base = distanceKm ? Math.round(distanceKm / 10) : (hashSeed(`${seedId}-eco`) % 40) + 10;
  return Math.max(5, base);
}

export function deriveArea(deliveryAddress) {
  if (!deliveryAddress) return "Unknown";
  const parts = deliveryAddress.split(",").map((p) => p.trim()).filter(Boolean);
  return parts.length > 0 ? parts[parts.length - 1] : deliveryAddress;
}

export function formatOrderDateTime(isoString) {
  if (!isoString) return { date: "N/A", time: "N/A" };
  const parsed = new Date(isoString);
  return {
    date: parsed.toLocaleDateString(),
    time: parsed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  };
}

export function getPeriodRange(period) {
  const now = new Date();
  if (period === "thisMonth") {
    return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: now };
  }
  if (period === "lastMonth") {
    return {
      start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
      end: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999),
    };
  }
  if (period === "thisYear") {
    return { start: new Date(now.getFullYear(), 0, 1), end: now };
  }
  return { start: null, end: null };
}
