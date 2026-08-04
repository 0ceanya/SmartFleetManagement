"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, Grid, Typography, Chip, Divider, Breadcrumbs, Link as MuiLink, Alert, List, ListItem, ListItemText } from "@mui/material";
import { apiFetch } from "@/lib/api";
import AuditTimeline from "@/components/manager/AuditTimeline";

export default function VehicleDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [vehicle, setVehicle] = useState(null);
  const [branchMap, setBranchMap] = useState({});
  const [incidents, setIncidents] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return undefined;
    let cancelled = false;
    Promise.all([
      apiFetch(`/api/master-data/vehicles/${id}`),
      apiFetch("/api/master-data/branches").catch(() => []),
      apiFetch("/api/incidents").catch(() => []),
    ])
      .then(([v, branches, allIncidents]) => {
        if (cancelled) return;
        setVehicle(v);
        const map = {};
        (branches || []).forEach((b) => {
          map[b.id] = b.name;
        });
        setBranchMap(map);
        setIncidents((allIncidents || []).filter((i) => i.vehicleId === id));
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Breadcrumbs>
          <MuiLink component="button" onClick={() => router.push("/manager/vehicles")} underline="hover">
            Vehicles
          </MuiLink>
          <Typography color="text.primary">{vehicle?.registrationNumber || id}</Typography>
        </Breadcrumbs>
      </Grid>

      {error && (
        <Grid item xs={12}>
          <Alert severity="error">Failed to load vehicle: {error}</Alert>
        </Grid>
      )}

      {vehicle && (
        <Grid item xs={12}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h5" fontWeight={700} mb={1}>{vehicle.registrationNumber}</Typography>
              <Chip label={vehicle.currentStatus} size="small" color={vehicle.currentStatus === "UnderMaintenance" ? "error" : "success"} sx={{ mb: 2 }} />
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">Vehicle Class</Typography>
                  <Typography variant="body2">{vehicle.vehicleClass}</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">Max Payload</Typography>
                  <Typography variant="body2">{vehicle.maxPayloadKg} kg</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">Branch</Typography>
                  <Typography variant="body2">{branchMap[vehicle.branchId] || "-"}</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      )}

      {incidents.length > 0 && (
        <Grid item xs={12}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" mb={1}>Incident History</Typography>
              <List disablePadding dense>
                {incidents.map((incident) => (
                  <ListItem key={incident.id} sx={{ py: 0.75 }}>
                    <ListItemText
                      primary={
                        <>
                          <Chip label={incident.severity} size="small" sx={{ mr: 1, height: 20, fontSize: 11 }} />
                          {incident.category}: {incident.description}
                        </>
                      }
                      secondary={new Date(incident.createdAt).toLocaleString()}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      )}

      <Grid item xs={12}>
        <AuditTimeline entityType="Vehicle" entityId={id} />
      </Grid>
    </Grid>
  );
}
