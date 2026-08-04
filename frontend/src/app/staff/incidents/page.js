"use client";

import * as React from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Grid,
  Paper,
  Snackbar,
  Stack
} from "@mui/material";
import SwapVertIcon from "@mui/icons-material/SwapVert";
import AddIcon from "@mui/icons-material/Add";
import IncidentsTable from "@/components/staff/IncidentsTable";
import ReportIncidentDialog from "@/components/staff/ReportIncidentDialog";
import { apiFetch } from "@/lib/api";

const CATEGORIES = [
  "CargoDamage",
  "CargoMissing",
  "CustomerComplaint",
  "VehicleBreakdown",
  "Accident",
  "AssignmentDecline",
  "Other",
];

const SEVERITIES = ["Critical", "High", "Medium", "Low"];

export default function IncidentsPage() {
  const [allIncidents, setAllIncidents] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState("");
  const [severityFilter, setSeverityFilter] = React.useState("");
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [sortOrder, setSortOrder] = React.useState("desc");

  // Modal & Notification
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [snackbarMessage, setSnackbarMessage] = React.useState(null);

  const fetchIncidents = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch("/api/incidents");
      setAllIncidents(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchIncidents();
  }, []);

  const handleClear = () => {
    setSearchQuery("");
    setCategoryFilter("");
    setSeverityFilter("");
    setStartDate("");
    setEndDate("");
    setSortOrder("desc");
  };

  const toggleSort = () => {
    setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"));
  };

  const handleSuccess = (msg) => {
    setSnackbarMessage(msg);
    fetchIncidents();
  };

  // Apply search & filters
  const filteredIncidents = React.useMemo(() => {
    return allIncidents
      .filter((incident) => {
        // Search query check (ID, shipmentId, vehicleId, description, category)
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const matchesId = incident.id?.toLowerCase().includes(q);
          const matchesShipment = incident.shipmentId?.toLowerCase().includes(q);
          const matchesVehicle = incident.vehicleId?.toLowerCase().includes(q);
          const matchesDesc = incident.description?.toLowerCase().includes(q);
          const matchesCategory = incident.category?.toLowerCase().includes(q);

          if (!matchesId && !matchesShipment && !matchesVehicle && !matchesDesc && !matchesCategory) {
            return false;
          }
        }

        // Category filter
        if (categoryFilter && incident.category !== categoryFilter) {
          return false;
        }

        // Severity filter
        if (severityFilter && incident.severity !== severityFilter) {
          return false;
        }

        // Date range filter
        if (startDate) {
          if (new Date(incident.createdAt) < new Date(startDate)) return false;
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          if (new Date(incident.createdAt) > end) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
      });
  }, [allIncidents, searchQuery, categoryFilter, severityFilter, startDate, endDate, sortOrder]);

  return (
    <Box className="max-w-7xl mx-auto my-8 px-4 w-full">
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} mb={4} gap={2}>
        <div>
          <Typography variant="h4" fontWeight={700}>
            Incidents & Issues
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Monitor and report operational incidents across fleet shipments and vehicles.
          </Typography>
        </div>
        <Button
          variant="contained"
          color="error"
          startIcon={<AddIcon />}
          onClick={() => setDialogOpen(true)}
          sx={{ fontWeight: 600 }}
        >
          Report Incident
        </Button>
      </Stack>

      <Paper variant="outlined" sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={2}>
            <TextField
              label="Search"
              placeholder="Search ID, vehicle..."
              variant="outlined"
              size="small"
              fullWidth
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Category</InputLabel>
              <Select
                value={categoryFilter}
                label="Category"
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <MenuItem value="">
                  <em>All Categories</em>
                </MenuItem>
                {CATEGORIES.map((c) => (
                  <MenuItem key={c} value={c}>
                    {c}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Severity</InputLabel>
              <Select
                value={severityFilter}
                label="Severity"
                onChange={(e) => setSeverityFilter(e.target.value)}
              >
                <MenuItem value="">
                  <em>All Severities</em>
                </MenuItem>
                {SEVERITIES.map((s) => (
                  <MenuItem key={s} value={s}>
                    {s}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              label="Start Date"
              type="date"
              size="small"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              label="End Date"
              type="date"
              size="small"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={2} display="flex" gap={1} justifyContent={{ xs: "flex-start", md: "flex-end" }}>
            <Button variant="outlined" onClick={toggleSort} size="small" sx={{ minWidth: 40, px: 1 }}>
              <SwapVertIcon fontSize="small" />
            </Button>
            <Button variant="outlined" color="secondary" onClick={handleClear} size="small">
              Clear
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : (
        <IncidentsTable incidents={filteredIncidents} />
      )}

      <ReportIncidentDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSuccess={handleSuccess}
      />

      <Snackbar
        open={!!snackbarMessage}
        autoHideDuration={6000}
        onClose={() => setSnackbarMessage(null)}
        message={snackbarMessage}
      />
    </Box>
  );
}
