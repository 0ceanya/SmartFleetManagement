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
import { fetchOsrmRoute, geocodeAddress, haversineKm } from "@/lib/geo";
import muiTheme from "@/lib/muiTheme";

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

export interface RouteMapProps {
  originAddress: string;
  destinationAddress: string;
  originLabel?: string;
  destinationLabel?: string;
  destinationVariant?: "delivery" | "warehouse";
  onRouteResolved?: (info: RouteResolvedInfo) => void;
  heightClassName?: string;
}

export default function RouteMap({
  originAddress,
  destinationAddress,
  originLabel = "Pickup",
  destinationLabel = "Delivery",
  destinationVariant = "delivery",
  onRouteResolved,
  heightClassName = "h-80",
}: RouteMapProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = React.useRef<Leaflet.Map | null>(null);
  const layerGroupRef = React.useRef<Leaflet.LayerGroup | null>(null);

  const [loading, setLoading] = React.useState(true);
  const [originError, setOriginError] = React.useState<string | null>(null);
  const [destinationError, setDestinationError] = React.useState<string | null>(null);
  const [fallbackNote, setFallbackNote] = React.useState<string | null>(null);
  const [summary, setSummary] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function setup() {
      setLoading(true);
      setOriginError(null);
      setDestinationError(null);
      setFallbackNote(null);
      setSummary(null);

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

      const origin = await geocodeAddress(originAddress);
      if (cancelled) return;
      if (!origin) {
        setOriginError(`Address not found: ${originAddress}`);
      }

      const destination = await geocodeAddress(destinationAddress);
      if (cancelled) return;
      if (!destination) {
        setDestinationError(`Address not found: ${destinationAddress}`);
      }

      const points: [number, number][] = [];

      if (origin) {
        points.push([origin.lat, origin.lon]);
        L.marker([origin.lat, origin.lon], {
          icon: L.divIcon({
            html: markerIconHtml(muiTheme.palette.primary.main, false),
            className: "",
            iconSize: [36, 36],
            iconAnchor: [18, 36],
          }),
        })
          .bindPopup(originLabel)
          .addTo(layerGroup);
      }

      if (destination) {
        points.push([destination.lat, destination.lon]);
        L.marker([destination.lat, destination.lon], {
          icon: L.divIcon({
            html: markerIconHtml(
              muiTheme.palette.secondary.main,
              destinationVariant === "warehouse",
            ),
            className: "",
            iconSize: [36, 36],
            iconAnchor: [18, 36],
          }),
        })
          .bindPopup(destinationLabel)
          .addTo(layerGroup);
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

      const osrmRoute = await fetchOsrmRoute(origin, destination);
      if (cancelled) return;

      if (osrmRoute) {
        L.polyline(osrmRoute.coordinates, {
          color: muiTheme.palette.primary.main,
          weight: 4,
        }).addTo(layerGroup);
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
        L.polyline([[origin.lat, origin.lon], [destination.lat, destination.lon]], {
          color: muiTheme.palette.error.main,
          weight: 3,
          dashArray: "8 8",
        }).addTo(layerGroup);
        setFallbackNote("A driving route couldn't be computed; showing an approximate straight-line distance.");
        setSummary(`Approximate distance: ${approxKm.toFixed(1)} km`);
        onRouteResolved?.({
          distanceKm: approxKm,
          durationMinutes: null,
          isFallback: true,
        });
      }

      setLoading(false);
    }

    setup();

    return () => {
      cancelled = true;
    };
  }, [originAddress, destinationAddress, originLabel, destinationLabel, destinationVariant, onRouteResolved]);

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
      </Stack>
    </Paper>
  );
}
