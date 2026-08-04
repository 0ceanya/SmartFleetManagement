"use client";

import * as React from "react";
import Link from "next/link";
import Alert from "@mui/material/Alert";
import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import FormControlLabel from "@mui/material/FormControlLabel";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import OrderShipmentPicker from "@/components/staff/OrderShipmentPicker";
import RouteMap from "@/components/RouteMap";
import { apiFetch } from "@/lib/api";

export default function CreateAssignmentPage() {
  const [role, setRole] = React.useState(null);

  const [drivers, setDrivers] = React.useState([]);
  const [vehicles, setVehicles] = React.useState([]);


  const [selectedShipments, setSelectedShipments] = React.useState([]);
  const [selectedDriver, setSelectedDriver] = React.useState(null);
  const [selectedVehicle, setSelectedVehicle] = React.useState(null);

  const [includeRoute, setIncludeRoute] = React.useState(true);
  const [routeDistanceKm, setRouteDistanceKm] = React.useState("");
  const [routeDurationMinutes, setRouteDurationMinutes] = React.useState("");

  const [submitting, setSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState(null);
  const [submitResult, setSubmitResult] = React.useState(null);

  React.useEffect(() => {
    setRole(sessionStorage.getItem("smartfm.role"));
  }, []);

  React.useEffect(() => {
    async function load() {
      const [employees, vehicleList] = await Promise.all([
        apiFetch("/api/master-data/employees"),
        apiFetch("/api/master-data/vehicles"),
      ]);
      setDrivers(employees.filter((e) => e.type === "Driver"));
      setVehicles(vehicleList);
    }
    load();
  }, []);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shipmentId = params.get("shipmentId");
    const orderId = params.get("orderId");
    if (shipmentId && orderId) {
      apiFetch(`/api/orders/${orderId}`)
        .then((orderData) => {
          const shipment = orderData.shipments.find((s) => s.id === shipmentId);
          if (shipment) {
            setSelectedShipments((prev) => {
              if (prev.some((s) => s.id === shipmentId)) return prev;
              return [...prev, shipment];
            });
          }
        })
        .catch(console.error);
    }
  }, []);

  const handleToggleShipment = (shipment) => {
    setSelectedShipments((prev) => {
      const exists = prev.some((s) => s.id === shipment.id);
      if (exists) return prev.filter((s) => s.id !== shipment.id);
      return [...prev, shipment];
    });
  };

  const firstShipment = selectedShipments[0] ?? null;
  const mapDestinationAddress = firstShipment?.deliveryAddress;
  const mapDestinationLabel = "Delivery";
  const mapDestinationVariant = "delivery";

  const handleRouteResolved = React.useCallback((info) => {
    setRouteDistanceKm(info.distanceKm.toFixed(1));
    setRouteDurationMinutes(info.durationMinutes !== null ? Math.round(info.durationMinutes).toString() : "");
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitResult(null);

    if (selectedShipments.length === 0 || !selectedDriver || !selectedVehicle) {
      setSubmitError("At least one shipment, a driver, and a vehicle are required.");
      return;
    }

    const request = {
      shipmentIds: selectedShipments.map((s) => s.id),
      driverId: selectedDriver.id,
      vehicleId: selectedVehicle.id,
      route:
        includeRoute && firstShipment
          ? {
              originAddress: firstShipment.pickupAddress,
              destinationAddress: mapDestinationAddress ?? firstShipment.deliveryAddress,
              distanceKm: routeDistanceKm.trim() ? parseFloat(routeDistanceKm) : null,
              estimatedDurationMinutes: routeDurationMinutes.trim() ? parseInt(routeDurationMinutes, 10) : null,
            }
          : null,
    };

    setSubmitting(true);
    try {
      const result = await apiFetch("/api/fleet/assignments", {
        method: "POST",
        body: JSON.stringify(request),
      });
      setSubmitResult(result);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  };

  const resultDriver = submitResult ? drivers.find((d) => d.id === submitResult.driverId) : null;
  const resultVehicle = submitResult ? vehicles.find((v) => v.id === submitResult.vehicleId) : null;

  return (
    <Box className="max-w-5xl mx-auto my-8 px-4">
      {role !== "staff" && (
        <Alert
          severity="warning"
          sx={{ mb: 3 }}
          action={
            <Link href="/" className="font-bold underline">
              Go to role picker
            </Link>
          }
        >
          Select Staff role first
        </Alert>
      )}

      <Typography variant="h4" sx={{ mb: 3 }}>
        Create Assignment
      </Typography>

      <Stack spacing={3}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Select Shipments
            </Typography>
            <OrderShipmentPicker
              selectedShipmentIds={selectedShipments.map((s) => s.id)}
              onToggleShipment={handleToggleShipment}
            />
            {selectedShipments.length > 0 && (
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 2 }}>
                {selectedShipments.map((s) => (
                  <Chip
                    key={s.id}
                    label={s.id}
                    onDelete={() => handleToggleShipment(s)}
                    size="small"
                  />
                ))}
              </Stack>
            )}
            {selectedShipments.length > 1 && (
              <Alert severity="info" sx={{ mt: 2 }}>
                Only the first selected shipment&apos;s pickup is shown on the map below; all
                selected shipments are still included in the assignment.
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Driver &amp; Vehicle
            </Typography>
            <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
              <Autocomplete
                options={drivers}
                getOptionLabel={(d) => d.name}
                value={selectedDriver}
                onChange={(_, value) => setSelectedDriver(value)}
                sx={{ minWidth: 240 }}
                renderInput={(params) => <TextField {...params} label="Driver" />}
              />
              <Autocomplete
                options={vehicles}
                getOptionLabel={(v) => v.registrationNumber}
                value={selectedVehicle}
                onChange={(_, value) => setSelectedVehicle(value)}
                sx={{ minWidth: 240 }}
                renderInput={(params) => <TextField {...params} label="Vehicle" />}
              />
            </Stack>
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="h6">Route</Typography>
              <FormControlLabel
                control={<Switch checked={includeRoute} onChange={(e) => setIncludeRoute(e.target.checked)} />}
                label="Include route"
              />
            </Stack>

            {!firstShipment && (
              <Typography variant="body2" color="text.secondary">
                Select a shipment above to preview its route.
              </Typography>
            )}

            {firstShipment && mapDestinationAddress && (
              <Stack spacing={2}>
                <RouteMap
                  originAddress={firstShipment.pickupAddress}
                  destinationAddress={mapDestinationAddress}
                  destinationLabel={mapDestinationLabel}
                  destinationVariant={mapDestinationVariant}
                  onRouteResolved={handleRouteResolved}
                />
                <Stack direction="row" spacing={2}>
                  <TextField
                    label="Distance (km)"
                    type="number"
                    size="small"
                    value={routeDistanceKm}
                    onChange={(e) => setRouteDistanceKm(e.target.value)}
                  />
                  <TextField
                    label="Duration (minutes)"
                    type="number"
                    size="small"
                    value={routeDurationMinutes}
                    onChange={(e) => setRouteDurationMinutes(e.target.value)}
                  />
                </Stack>
              </Stack>
            )}
          </CardContent>
        </Card>

        <Box component="form" onSubmit={handleSubmit}>
          <Button type="submit" variant="contained" disabled={submitting}>
            {submitting ? "Creating..." : "Create Assignment"}
          </Button>
        </Box>

        {submitError && <Alert severity="error">{submitError}</Alert>}

        {submitResult && (
          <Card variant="outlined">
            <CardContent>
              <Alert severity="success" sx={{ mb: 2 }}>
                Assignment created successfully.
              </Alert>
              <Stack spacing={0.5}>
                <Typography variant="body2">
                  <strong>Assignment ID:</strong> {submitResult.id}
                </Typography>
                <Typography variant="body2">
                  <strong>Status:</strong> {submitResult.status}
                </Typography>
                <Typography variant="body2">
                  <strong>Driver:</strong> {resultDriver ? resultDriver.name : submitResult.driverId}
                </Typography>
                <Typography variant="body2">
                  <strong>Vehicle:</strong>{" "}
                  {resultVehicle ? resultVehicle.registrationNumber : submitResult.vehicleId}
                </Typography>
                <Typography variant="body2">
                  <strong>Shipments:</strong> {submitResult.shipmentIds.join(", ")}
                </Typography>
                {submitResult.route && (
                  <Typography variant="body2">
                    <strong>Route:</strong> {submitResult.route.originAddress} to{" "}
                    {submitResult.route.destinationAddress}
                    {submitResult.route.distanceKm !== null && ` (${submitResult.route.distanceKm} km)`}
                  </Typography>
                )}
              </Stack>
            </CardContent>
          </Card>
        )}
      </Stack>
    </Box>
  );
}
