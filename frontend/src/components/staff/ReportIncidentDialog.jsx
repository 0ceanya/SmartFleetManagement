"use client";

import * as React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Stack,
  Autocomplete
} from "@mui/material";
import { apiFetch } from "@/lib/api";

const CATEGORIES = [
  "CargoDamage",
  "CargoMissing",
  "CustomerComplaint",
  "VehicleBreakdown",
  "Accident",
  "Other",
];

const SEVERITIES = ["Critical", "High", "Medium", "Low"];

export default function ReportIncidentDialog({ open, onClose, onSuccess }) {
  const [shipmentId, setShipmentId] = React.useState("");
  const [category, setCategory] = React.useState(CATEGORIES[0]);
  const [severity, setSeverity] = React.useState("High");
  const [description, setDescription] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState(null);

  // Available shipments loaded from orders for easy selection
  const [shipmentOptions, setShipmentOptions] = React.useState([]);
  const [loadingShipments, setLoadingShipments] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setShipmentId("");
      setCategory(CATEGORIES[0]);
      setSeverity("High");
      setDescription("");
      setError(null);

      // Fetch active orders & shipments to populate autocomplete options
      setLoadingShipments(true);
      apiFetch("/api/orders")
        .then(async (orders) => {
          const shipmentsList = [];
          // Fetch detailed info for each order to retrieve shipment IDs
          const orderDetailsPromises = (orders || []).slice(0, 20).map((o) =>
            apiFetch(`/api/orders/${o.id}`).catch(() => null)
          );
          const orderDetails = await Promise.all(orderDetailsPromises);
          
          orderDetails.forEach((detail) => {
            if (detail?.shipments) {
              detail.shipments.forEach((s) => {
                shipmentsList.push({
                  id: s.id,
                  label: `Shipment ${s.id.substring(0, 8)}... (${s.pickupAddress || "Pickup"} -> ${s.deliveryAddress || "Delivery"})`,
                });
              });
            }
          });
          setShipmentOptions(shipmentsList);
        })
        .catch(() => setShipmentOptions([]))
        .finally(() => setLoadingShipments(false));
    }
  }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!shipmentId.trim()) {
      setError("Shipment ID is required.");
      return;
    }
    if (!description.trim()) {
      setError("Description is required.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        shipmentId: shipmentId.trim(),
        description: description.trim(),
        severity,
        category,
      };
      await apiFetch("/api/incidents", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      onSuccess?.("Incident reported successfully.");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Report New Incident</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent dividers>
          <Stack spacing={3}>
            {error && <Alert severity="error">{error}</Alert>}

            <Autocomplete
              freeSolo
              options={shipmentOptions}
              getOptionLabel={(option) =>
                typeof option === "string" ? option : option.id
              }
              renderOption={(props, option) => (
                <li {...props} key={option.id}>
                  {option.label}
                </li>
              )}
              loading={loadingShipments}
              value={shipmentId}
              onInputChange={(event, newValue) => {
                setShipmentId(newValue || "");
              }}
              onChange={(event, newValue) => {
                if (typeof newValue === "string") {
                  setShipmentId(newValue);
                } else if (newValue && newValue.id) {
                  setShipmentId(newValue.id);
                }
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Shipment ID *"
                  placeholder="Select or enter Shipment UUID"
                  required
                  fullWidth
                  size="small"
                  helperText="Choose an existing shipment or paste a valid Shipment UUID"
                />
              )}
            />

            <FormControl fullWidth size="small">
              <InputLabel>Category *</InputLabel>
              <Select
                value={category}
                label="Category *"
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIES.map((c) => (
                  <MenuItem key={c} value={c}>
                    {c}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>Severity *</InputLabel>
              <Select
                value={severity}
                label="Severity *"
                onChange={(e) => setSeverity(e.target.value)}
              >
                {SEVERITIES.map((s) => (
                  <MenuItem key={s} value={s}>
                    {s}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Description *"
              placeholder="Describe what occurred, impact, and any immediate actions taken..."
              multiline
              rows={4}
              required
              fullWidth
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} disabled={submitting} color="inherit">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="error"
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : null}
          >
            {submitting ? "Submitting..." : "Report Incident"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
