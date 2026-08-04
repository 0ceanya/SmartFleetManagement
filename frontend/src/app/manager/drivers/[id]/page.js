"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, Grid, Typography, Chip, Divider, Breadcrumbs, Link as MuiLink, Alert } from "@mui/material";
import { apiFetch } from "@/lib/api";
import AuditTimeline from "@/components/manager/AuditTimeline";

export default function DriverDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [driver, setDriver] = useState(null);
  const [branchMap, setBranchMap] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return undefined;
    let cancelled = false;
    Promise.all([
      apiFetch(`/api/master-data/employees/${id}`),
      apiFetch("/api/master-data/branches").catch(() => []),
    ])
      .then(([e, branches]) => {
        if (cancelled) return;
        setDriver(e);
        const map = {};
        (branches || []).forEach((b) => {
          map[b.id] = b.name;
        });
        setBranchMap(map);
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
          <MuiLink component="button" onClick={() => router.push("/manager/drivers")} underline="hover">
            Drivers
          </MuiLink>
          <Typography color="text.primary">{driver?.name || id}</Typography>
        </Breadcrumbs>
      </Grid>

      {error && (
        <Grid item xs={12}>
          <Alert severity="error">Failed to load driver: {error}</Alert>
        </Grid>
      )}

      {driver && (
        <Grid item xs={12}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h5" fontWeight={700} mb={1}>{driver.name}</Typography>
              <Chip label={driver.isAvailable ? "Available" : "Unavailable"} size="small" color={driver.isAvailable ? "success" : "warning"} sx={{ mb: 2 }} />
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">Email</Typography>
                  <Typography variant="body2">{driver.email}</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">License Number</Typography>
                  <Typography variant="body2">{driver.licenseNumber}</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">Branch</Typography>
                  <Typography variant="body2">{branchMap[driver.branchId] || "-"}</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      )}

      <Grid item xs={12}>
        <AuditTimeline entityType="Driver" entityId={id} />
      </Grid>
    </Grid>
  );
}
