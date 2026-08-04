"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, Grid, Typography, Chip, Divider, Breadcrumbs, Link as MuiLink, Alert, List, ListItem, ListItemText } from "@mui/material";
import { apiFetch } from "@/lib/api";
import AuditTimeline from "@/components/manager/AuditTimeline";
import { formatDate } from "@/lib/dateRange";

export default function OrderDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return undefined;
    let cancelled = false;
    apiFetch(`/api/orders/${id}`)
      .then((o) => {
        if (cancelled) return;
        setOrder(o);
        return apiFetch(`/api/customers/${o.customerId}`).catch(() => null);
      })
      .then((c) => {
        if (!cancelled) setCustomer(c);
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
          <MuiLink component="button" onClick={() => router.push("/manager/orders")} underline="hover">
            Orders
          </MuiLink>
          <Typography color="text.primary">{id?.split("-")[0]?.toUpperCase()}</Typography>
        </Breadcrumbs>
      </Grid>

      {error && (
        <Grid item xs={12}>
          <Alert severity="error">Failed to load order: {error}</Alert>
        </Grid>
      )}

      {order && (
        <Grid item xs={12}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h5" fontWeight={700} mb={1}>Order {id.split("-")[0].toUpperCase()}</Typography>
              <Chip label={order.status} size="small" sx={{ mb: 2 }} />
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">Customer</Typography>
                  <Typography variant="body2">{customer?.name || "-"}</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">Created</Typography>
                  <Typography variant="body2">{formatDate(order.createdAt)}</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">Order Weight</Typography>
                  <Typography variant="body2">{order.orderWeightKg} kg</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">Invoice</Typography>
                  <Typography variant="body2">{order.invoice ? order.invoice.status : "No invoice"}</Typography>
                </Grid>
              </Grid>

              {order.cargoes?.length > 0 && (
                <>
                  <Typography variant="subtitle2" mt={3} mb={1}>Cargo</Typography>
                  <List disablePadding dense>
                    {order.cargoes.map((c) => (
                      <ListItem key={c.id} sx={{ py: 0.5 }}>
                        <ListItemText primary={c.description} secondary={`${c.weightKg} kg${c.isHazardous ? " - Hazardous" : ""}`} />
                      </ListItem>
                    ))}
                  </List>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      )}

      <Grid item xs={12}>
        <AuditTimeline entityType="Order" entityId={id} />
      </Grid>
    </Grid>
  );
}
