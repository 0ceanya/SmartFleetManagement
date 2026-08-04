"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, Typography, Box, List, ListItem, ListItemText, Chip, Divider, CircularProgress, Alert } from "@mui/material";
import { apiFetch } from "@/lib/api";

function resolveActor(changedBy, employeesById) {
  if (!changedBy) return "System";
  const [role, id] = changedBy.split(":");
  if (!id) return role;
  const employee = employeesById[id];
  return employee ? `${role}: ${employee.name}` : changedBy;
}

export default function AuditTimeline({ entityType, entityId, changedBy, title = "Activity Log" }) {
  const [records, setRecords] = useState([]);
  const [employeesById, setEmployeesById] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Two filtering modes: by (entityType, entityId) for "what happened to this entity", or by
  // changedBy for "what did this actor do" (e.g. a staff member's own activity trail, which spans
  // many different entity types and can't be expressed as a single entityType/entityId pair).
  useEffect(() => {
    if (!entityId && !changedBy) return undefined;
    let cancelled = false;
    setLoading(true);
    setError(null);
    const query = changedBy
      ? "pageSize=200"
      : `entityType=${entityType}&entityId=${entityId}&pageSize=100`;
    Promise.all([
      apiFetch(`/api/audit/records?${query}`),
      apiFetch("/api/master-data/employees").catch(() => []),
    ])
      .then(([auditData, employees]) => {
        if (cancelled) return;
        const allRecords = auditData?.records || [];
        setRecords(changedBy ? allRecords.filter((r) => r.changedBy === changedBy) : allRecords);
        const map = {};
        (employees || []).forEach((e) => {
          map[e.id] = e;
        });
        setEmployeesById(map);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [entityType, entityId, changedBy]);

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" mb={2}>{title}</Typography>
        {loading && <CircularProgress size={18} />}
        {error && <Alert severity="error">Failed to load activity log: {error}</Alert>}
        {!loading && !error && records.length === 0 && (
          <Alert severity="info" sx={{ py: 0.5 }}>No activity recorded yet.</Alert>
        )}
        {!loading && !error && records.length > 0 && (
          <Box sx={{ maxHeight: 400, overflowY: "auto", border: "1px solid", borderColor: "divider", borderRadius: 1 }}>
            <List disablePadding dense>
              {records.map((rec, idx) => (
                <React.Fragment key={rec.id}>
                  <ListItem sx={{ py: 0.75 }}>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                          <Typography variant="body2" fontWeight={600}>{rec.eventType}</Typography>
                          <Chip label={resolveActor(rec.changedBy, employeesById)} size="small" variant="outlined" sx={{ height: 20, fontSize: 11 }} />
                          {idx === 0 && <Chip label="Latest" size="small" color="success" sx={{ height: 20, fontSize: 11 }} />}
                        </Box>
                      }
                      secondary={
                        <>
                          {rec.description}
                          <br />
                          {new Date(rec.createdAt).toLocaleString()}
                        </>
                      }
                    />
                  </ListItem>
                  {idx < records.length - 1 && <Divider component="li" />}
                </React.Fragment>
              ))}
            </List>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
