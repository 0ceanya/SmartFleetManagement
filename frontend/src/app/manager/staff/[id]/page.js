"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, Grid, Typography, Divider, Breadcrumbs, Link as MuiLink, Alert } from "@mui/material";
import { apiFetch } from "@/lib/api";
import AuditTimeline from "@/components/manager/AuditTimeline";

export default function StaffDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [staff, setStaff] = useState(null);
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
        setStaff(e);
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
          <MuiLink component="button" onClick={() => router.push("/manager/staff")} underline="hover">
            Staff
          </MuiLink>
          <Typography color="text.primary">{staff?.name || id}</Typography>
        </Breadcrumbs>
      </Grid>

      {error && (
        <Grid item xs={12}>
          <Alert severity="error">Failed to load staff member: {error}</Alert>
        </Grid>
      )}

      {staff && (
        <Grid item xs={12}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h5" fontWeight={700} mb={2}>{staff.name}</Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">Email</Typography>
                  <Typography variant="body2">{staff.email}</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">Department</Typography>
                  <Typography variant="body2">{staff.department}</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">Branch</Typography>
                  <Typography variant="body2">{branchMap[staff.branchId] || "-"}</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      )}

      <Grid item xs={12}>
        <AuditTimeline changedBy={`Staff:${id}`} title="Activity Log (assignments approved, orders processed)" />
      </Grid>
    </Grid>
  );
}
