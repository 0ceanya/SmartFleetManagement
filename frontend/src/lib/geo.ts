import type { GeocodeResult, OsrmRouteResult } from "@/lib/types";

const NOMINATIM_MIN_SPACING_MS = 1100;
const OSRM_TIMEOUT_MS = 8000;

const geocodeCache = new Map<string, GeocodeResult | null>();
const reverseGeocodeCache = new Map<string, string | null>();
let nominatimQueue: Promise<unknown> = Promise.resolve();

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function queueNominatimCall<T>(run: () => Promise<T>): Promise<T> {
  const result = nominatimQueue.then(run);
  nominatimQueue = result.then(
    () => wait(NOMINATIM_MIN_SPACING_MS),
    () => wait(NOMINATIM_MIN_SPACING_MS),
  );
  return result;
}

export function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  if (geocodeCache.has(address)) {
    return Promise.resolve(geocodeCache.get(address) ?? null);
  }

  return queueNominatimCall(async () => {
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`;
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      if (!res.ok) {
        geocodeCache.set(address, null);
        return null;
      }
      const body = await res.json();
      if (!Array.isArray(body) || body.length === 0) {
        geocodeCache.set(address, null);
        return null;
      }
      const match = body[0];
      const parsed: GeocodeResult = {
        lat: parseFloat(match.lat),
        lon: parseFloat(match.lon),
        displayName: match.display_name,
      };
      geocodeCache.set(address, parsed);
      return parsed;
    } catch {
      geocodeCache.set(address, null);
      return null;
    }
  });
}

export function reverseGeocode(lat: number, lon: number): Promise<string | null> {
  const key = `${lat.toFixed(6)},${lon.toFixed(6)}`;
  if (reverseGeocodeCache.has(key)) {
    return Promise.resolve(reverseGeocodeCache.get(key) ?? null);
  }

  return queueNominatimCall(async () => {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      if (!res.ok) {
        reverseGeocodeCache.set(key, null);
        return null;
      }
      const body = await res.json();
      const address = typeof body?.display_name === "string" ? body.display_name : null;
      reverseGeocodeCache.set(key, address);
      return address;
    } catch {
      reverseGeocodeCache.set(key, null);
      return null;
    }
  });
}

export async function fetchOsrmRoute(
  origin: GeocodeResult,
  destination: GeocodeResult,
): Promise<OsrmRouteResult | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), OSRM_TIMEOUT_MS);

  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${origin.lon},${origin.lat};${destination.lon},${destination.lat}?overview=full&geometries=geojson`;
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;

    const body = await res.json();
    const route = body?.routes?.[0];
    if (!route) return null;

    const coordinates: [number, number][] = (route.geometry?.coordinates ?? []).map(
      ([lon, lat]: [number, number]) => [lat, lon],
    );

    return {
      distanceKm: route.distance / 1000,
      durationMinutes: route.duration / 60,
      coordinates,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

export function haversineKm(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number },
): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;

  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return R * c;
}
