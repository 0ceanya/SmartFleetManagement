"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, Grid, Typography, Chip, Divider, Breadcrumbs, Link as MuiLink, Alert } from "@mui/material";
import { apiFetch } from "@/lib/api";
import AuditTimeline from "@/components/manager/AuditTimeline";
import { formatDate } from "@/lib/dateRange";

export default function AssignmentDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [assignment, setAssignment] = useState(null);
  const [driver, setDriver] = useState(null);
  const [vehicle, setVehicle] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return undefined;
    let cancelled = false;
    apiFetch(`/api/fleet/assignments/${id}`)
      .then((a) => {
        if (cancelled) return;
        setAssignment(a);
        return Promise.all([
          apiFetch(`/api/master-data/employees/${a.driverId}`).catch(() => null),
          apiFetch(`/api/master-data/vehicles/${a.vehicleId}`).catch(() => null),
        ]);
      })
      .then((result) => {
        if (cancelled || !result) return;
        setDriver(result[0]);
        setVehicle(result[1]);
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
          <MuiLink component="button" onClick={() => router.push("/manager/assignments")} underline="hover">
            Assignments
          </MuiLink>
          <Typography color="text.primary">{id?.split("-")[0]?.toUpperCase()}</Typography>
        </Breadcrumbs>
      </Grid>

      {error && (
        <Grid item xs={12}>
          <Alert severity="error">Failed to load assignment: {error}</Alert>
        </Grid>
      )}

      {assignment && (
        <Grid item xs={12}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h5" fontWeight={700} mb={1}>Assignment {id.split("-")[0].toUpperCase()}</Typography>
              <Chip label={assignment.status} size="small" sx={{ mb: 2 }} />
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">Driver</Typography>
                  <Typography variant="body2">{driver?.name || "-"}</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">Vehicle</Typography>
                  <Typography variant="body2">{vehicle?.registrationNumber || "-"}</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">Route</Typography>
                  <Typography variant="body2">
                    {assignment.route ? `${assignment.route.originAddress} -> ${assignment.route.destinationAddress}` : "Direct delivery"}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">Created</Typography>
                  <Typography variant="body2">{formatDate(assignment.createdAt)}</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      )}

      <Grid item xs={12}>
        <AuditTimeline entityType="Assignment" entityId={id} />
      </Grid>
    </Grid>
  );
}
