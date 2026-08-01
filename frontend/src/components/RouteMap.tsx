"use client";

import "leaflet/dist/leaflet.css";

import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import PlaceIcon from "@mui/icons-material/Place";
import WarehouseIcon from "@mui/icons-material/Warehouse";
import type * as Leaflet from "leaflet";
import { fetchOsrmRoute, geocodeAddress, haversineKm, reverseGeocode } from "@/lib/geo";
import muiTheme from "@/lib/muiTheme";
import type { GeocodeResult } from "@/lib/types";

const HANOI_CENTER: [number, number] = [21.0278, 105.8342];

function markerIconHtml(color: string, useWarehouseIcon: boolean) {
  const Icon = useWarehouseIcon ? WarehouseIcon : PlaceIcon;
  return renderToStaticMarkup(
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color,
        transform: "translate(-50%, -100%)",
      }}
    >
      <Icon style={{ fontSize: 36 }} />
    </div>,
  );
}

export interface RouteResolvedInfo {
  distanceKm: number;
  durationMinutes: number | null;
  isFallback: boolean;
}

export interface AddressCorrection {
  which: "origin" | "destination";
  address: string;
  lat: number;
  lon: number;
}

export interface RouteMapProps {
  originAddress: string;
  destinationAddress: string;
  originLabel?: string;
  destinationLabel?: string;
  destinationVariant?: "delivery" | "warehouse";
  onRouteResolved?: (info: RouteResolvedInfo) => void;
  onAddressCorrected?: (correction: AddressCorrection) => void;
  heightClassName?: string;
}

export default function RouteMap({
  originAddress,
  destinationAddress,
  originLabel = "Pickup",
  destinationLabel = "Delivery",
  destinationVariant = "delivery",
  onRouteResolved,
  onAddressCorrected,
  heightClassName = "h-80",
}: RouteMapProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = React.useRef<Leaflet.Map | null>(null);
  const layerGroupRef = React.useRef<Leaflet.LayerGroup | null>(null);
  const routeLineRef = React.useRef<Leaflet.Polyline | null>(null);
  const originPointRef = React.useRef<GeocodeResult | null>(null);
  const destinationPointRef = React.useRef<GeocodeResult | null>(null);

  const [loading, setLoading] = React.useState(true);
  const [originError, setOriginError] = React.useState<string | null>(null);
  const [destinationError, setDestinationError] = React.useState<string | null>(null);
  const [fallbackNote, setFallbackNote] = React.useState<string | null>(null);
  const [summary, setSummary] = React.useState<string | null>(null);
  const [correctedOrigin, setCorrectedOrigin] = React.useState<string | null>(null);
  const [correctedDestination, setCorrectedDestination] = React.useState<string | null>(null);

  const drawRoute = React.useCallback(
    async (L: typeof Leaflet, layerGroup: Leaflet.LayerGroup) => {
      const origin = originPointRef.current;
      const destination = destinationPointRef.current;
      if (!origin || !destination) return;

      if (routeLineRef.current) {
        layerGroup.removeLayer(routeLineRef.current);
        routeLineRef.current = null;
      }

      const osrmRoute = await fetchOsrmRoute(origin, destination);
      if (osrmRoute) {
        routeLineRef.current = L.polyline(osrmRoute.coordinates, {
          color: muiTheme.palette.primary.main,
          weight: 4,
        }).addTo(layerGroup);
        setFallbackNote(null);
        setSummary(
          `Distance: ${osrmRoute.distanceKm.toFixed(1)} km, Duration: ${Math.round(osrmRoute.durationMinutes)} min`,
        );
        onRouteResolved?.({
          distanceKm: osrmRoute.distanceKm,
          durationMinutes: osrmRoute.durationMinutes,
          isFallback: false,
        });
      } else {
        const approxKm = haversineKm(origin, destination);
        routeLineRef.current = L.polyline(
          [
            [origin.lat, origin.lon],
            [destination.lat, destination.lon],
          ],
          {
            color: muiTheme.palette.error.main,
            weight: 3,
            dashArray: "8 8",
          },
        ).addTo(layerGroup);
        setFallbackNote("A driving route couldn't be computed; showing an approximate straight-line distance.");
        setSummary(`Approximate distance: ${approxKm.toFixed(1)} km`);
        onRouteResolved?.({ distanceKm: approxKm, durationMinutes: null, isFallback: true });
      }
    },
    [onRouteResolved],
  );

  const handleDragEnd = React.useCallback(
    async (which: "origin" | "destination", marker: Leaflet.Marker) => {
      const { lat, lng } = marker.getLatLng();
      const point: GeocodeResult = { lat, lon: lng, displayName: "" };
      if (which === "origin") originPointRef.current = point;
      else destinationPointRef.current = point;

      const label = which === "origin" ? originLabel : destinationLabel;
      marker.setTooltipContent(`${label}: locating...`);

      const address = await reverseGeocode(lat, lng);
      const resolvedText = address ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      marker.setTooltipContent(`${label}: ${resolvedText}`);

      if (which === "origin") setCorrectedOrigin(resolvedText);
      else setCorrectedDestination(resolvedText);

      onAddressCorrected?.({ which, address: resolvedText, lat, lon: lng });

      const map = mapInstanceRef.current;
      const layerGroup = layerGroupRef.current;
      if (map && layerGroup) {
        const L = (await import("leaflet")).default;
        await drawRoute(L, layerGroup);
      }
    },
    [drawRoute, onAddressCorrected, originLabel, destinationLabel],
  );

  React.useEffect(() => {
    let cancelled = false;

    async function setup() {
      setLoading(true);
      setOriginError(null);
      setDestinationError(null);
      setFallbackNote(null);
      setSummary(null);
      setCorrectedOrigin(null);
      setCorrectedDestination(null);

      const L = (await import("leaflet")).default;
      if (cancelled) return;

      if (!mapInstanceRef.current && containerRef.current) {
        const map = L.map(containerRef.current).setView(HANOI_CENTER, 6);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "(c) OpenStreetMap contributors",
          maxZoom: 19,
        }).addTo(map);
        mapInstanceRef.current = map;
        layerGroupRef.current = L.layerGroup().addTo(map);
      }

      const map = mapInstanceRef.current;
      const layerGroup = layerGroupRef.current;
      if (!map || !layerGroup) return;
      layerGroup.clearLayers();
      routeLineRef.current = null;

      const origin = await geocodeAddress(originAddress);
      if (cancelled) return;
      if (!origin) setOriginError(`Address not found: ${originAddress}`);
      originPointRef.current = origin;

      const destination = await geocodeAddress(destinationAddress);
      if (cancelled) return;
      if (!destination) setDestinationError(`Address not found: ${destinationAddress}`);
      destinationPointRef.current = destination;

      const points: [number, number][] = [];

      if (origin) {
        points.push([origin.lat, origin.lon]);
        const marker = L.marker([origin.lat, origin.lon], {
          draggable: true,
          icon: L.divIcon({
            html: markerIconHtml(muiTheme.palette.primary.main, false),
            className: "",
            iconSize: [36, 36],
            iconAnchor: [18, 36],
          }),
        })
          .bindTooltip(`${originLabel}: ${origin.displayName || originAddress}`, {
            permanent: true,
            direction: "top",
            offset: [0, -34],
          })
          .addTo(layerGroup);
        marker.on("dragend", () => handleDragEnd("origin", marker));
      }

      if (destination) {
        points.push([destination.lat, destination.lon]);
        const marker = L.marker([destination.lat, destination.lon], {
          draggable: true,
          icon: L.divIcon({
            html: markerIconHtml(muiTheme.palette.secondary.main, destinationVariant === "warehouse"),
            className: "",
            iconSize: [36, 36],
            iconAnchor: [18, 36],
          }),
        })
          .bindTooltip(`${destinationLabel}: ${destination.displayName || destinationAddress}`, {
            permanent: true,
            direction: "top",
            offset: [0, -34],
          })
          .addTo(layerGroup);
        marker.on("dragend", () => handleDragEnd("destination", marker));
      }

      if (points.length > 0) {
        map.fitBounds(points.length === 1 ? [points[0], points[0]] : points, {
          padding: [40, 40],
          maxZoom: 14,
        });
      }

      if (!origin || !destination) {
        setLoading(false);
        return;
      }

      await drawRoute(L, layerGroup);
      setLoading(false);
    }

    setup();

    return () => {
      cancelled = true;
    };
  }, [originAddress, destinationAddress, originLabel, destinationLabel, destinationVariant, drawRoute, handleDragEnd]);

  React.useEffect(() => {
    return () => {
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack spacing={1}>
        <Box ref={containerRef} className={heightClassName} sx={{ width: "100%" }} />
        <Typography variant="caption" color="text.secondary">
          Drag a pin to correct its location.
        </Typography>
        {loading && (
          <Stack direction="row" spacing={1} alignItems="center">
            <CircularProgress size={16} />
            <Typography variant="body2">Loading map...</Typography>
          </Stack>
        )}
        {originError && <Alert severity="error">{originError}</Alert>}
        {destinationError && <Alert severity="error">{destinationError}</Alert>}
        {fallbackNote && <Alert severity="warning">{fallbackNote}</Alert>}
        {summary && <Typography variant="body2">{summary}</Typography>}
        {(correctedOrigin || correctedDestination) && (
          <Alert severity="info">
            {correctedOrigin && (
              <>
                Corrected {originLabel.toLowerCase()}: {correctedOrigin}
                <br />
              </>
            )}
            {correctedDestination && (
              <>Corrected {destinationLabel.toLowerCase()}: {correctedDestination}</>
            )}
          </Alert>
        )}
      </Stack>
    </Paper>
  );
}
