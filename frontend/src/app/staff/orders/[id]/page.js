"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { Box, Typography, Button, Alert, CircularProgress, Breadcrumbs, Card, CardContent, Grid, Divider, List, ListItem, ListItemText, Chip } from "@mui/material";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id;

  const [order, setOrder] = React.useState(null);
  const [customer, setCustomer] = React.useState(null);
  const [assignments, setAssignments] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    if (!id) return;
    
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const orderData = await apiFetch(`/api/orders/${id}`);
        setOrder(orderData);

        // Fetch customer details
        if (orderData?.customerId) {
          try {
            const customerData = await apiFetch(`/api/customers/${orderData.customerId}`);
            setCustomer(customerData);
          } catch (err) {
            console.error("Failed to fetch customer data:", err);
          }
        }

        // Fetch all assignments to match shipment to assignment for navigation
        const assignmentsData = await apiFetch(`/api/fleet/assignments`);
        setAssignments(assignmentsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const getAssignmentIdForShipment = (shipmentId) => {
    const found = assignments.find(a => a.shipmentIds.includes(shipmentId));
    return found ? found.id : null;
  };

  return (
    <Box className="max-w-6xl mx-auto my-8 px-4">
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link href="/staff/orders" className="hover:underline">
          Orders
        </Link>
        <Typography color="text.primary">Details</Typography>
      </Breadcrumbs>

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4">
          Order Details
        </Typography>
        <Button variant="outlined" onClick={() => router.back()}>
          Back
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : order ? (
        <Grid container spacing={4}>
          {/* Order Summary & Customer Details */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Overview</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">Order ID</Typography>
                    <Typography variant="body2">{order.id}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                    <Chip label={order.status} size="small" />
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">Total Weight (kg)</Typography>
                    <Typography variant="body2">{order.orderWeightKg}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">Created At</Typography>
                    <Typography variant="body2">{new Date(order.createdAt).toLocaleString()}</Typography>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />
                
                <Typography variant="h6" gutterBottom>Customer & Billing</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">Customer ID</Typography>
                    <Typography variant="body2">{order.customerId}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">Customer Name</Typography>
                    <Typography variant="body2">{customer ? customer.name : 'Loading...'}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">Customer Email</Typography>
                    <Typography variant="body2">{customer ? customer.email : 'Loading...'}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">Customer Phone</Typography>
                    <Typography variant="body2">{customer ? customer.phone : 'Loading...'}</Typography>
                  </Grid>
                  {order.invoice ? (
                    <>
                      <Grid item xs={6}>
                        <Typography variant="subtitle2" color="text.secondary">Invoice ID</Typography>
                        <Typography variant="body2">{order.invoice.id}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="subtitle2" color="text.secondary">Invoice Amount</Typography>
                        <Typography variant="body2">${order.invoice.amount}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="subtitle2" color="text.secondary">Invoice Status</Typography>
                        <Chip label={order.invoice.status} size="small" color={order.invoice.status === 'Paid' ? 'success' : 'warning'} sx={{ mt: 0.5 }} />
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="subtitle2" color="text.secondary">Invoice Created At</Typography>
                        <Typography variant="body2">{new Date(order.invoice.createdAt).toLocaleString()}</Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Button 
                          component={Link} 
                          href={`/staff/billing/invoices/${order.invoice.id}`} 
                          variant="outlined" 
                          size="small" 
                          sx={{ mt: 1 }}
                        >
                          View Invoice
                        </Button>
                      </Grid>
                    </>
                  ) : (
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">Invoice</Typography>
                      <Typography variant="body2" color="text.secondary">No invoice found</Typography>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Cargo Details */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Cargo Details ({order.cargoes.length})</Typography>
                {order.cargoes.length > 0 ? (
                  <List disablePadding>
                    {order.cargoes.map((cargo, idx) => (
                      <React.Fragment key={cargo.id}>
                        <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                          <ListItemText
                            primary={cargo.description}
                            secondary={
                              <React.Fragment>
                                Weight: {cargo.weightKg} kg 
                                {cargo.volumeCbm !== null ? ` | Vol: ${cargo.volumeCbm} cbm` : ''}
                                {cargo.isHazardous ? ' | Hazardous' : ''}
                              </React.Fragment>
                            }
                          />
                        </ListItem>
                        {idx < order.cargoes.length - 1 && <Divider component="li" />}
                      </React.Fragment>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary">No cargo items.</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Shipments Details */}
          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>Shipments ({order.shipments.length})</Typography>
                {order.shipments.length > 0 ? (
                  <List disablePadding>
                    {order.shipments.map((shipment, idx) => {
                      const assignmentId = getAssignmentIdForShipment(shipment.id);
                      return (
                        <React.Fragment key={shipment.id}>
                          <ListItem sx={{ px: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <ListItemText
                              primary={`Shipment ${shipment.id.split('-')[0].toUpperCase()} - Status: ${shipment.status}`}
                              secondary={
                                <React.Fragment>
                                  From: {shipment.pickupAddress} <br />
                                  To: {shipment.deliveryAddress}
                                </React.Fragment>
                              }
                            />
                            {assignmentId ? (
                              <Button 
                                component={Link} 
                                href={`/staff/assignments/${assignmentId}`} 
                                variant="contained" 
                                size="small"
                              >
                                Assignment {assignmentId.substring(0, 8)}
                              </Button>
                            ) : (
                              <Button 
                                component={Link} 
                                href={`/staff/assignments/new?shipmentId=${shipment.id}&orderId=${order.id}`} 
                                variant="outlined" 
                                size="small"
                                color="secondary"
                              >
                                Create Assignment
                              </Button>
                            )}
                          </ListItem>
                          {idx < order.shipments.length - 1 && <Divider component="li" />}
                        </React.Fragment>
                      );
                    })}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary">No shipments available.</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Tracking Section */}
          <Grid item xs={12}>
            <TrackingSection shipments={order.shipments} getAssignmentIdForShipment={getAssignmentIdForShipment} />
          </Grid>

        </Grid>
      ) : (
        !error && <Typography>Order not found.</Typography>
      )}
    </Box>
  );
}

function TrackingSection({ shipments, getAssignmentIdForShipment }) {
  const [trackingByAssignment, setTrackingByAssignment] = React.useState({});
  const [loadingTracking, setLoadingTracking] = React.useState(false);

  // Build list of unique assignmentIds from shipments that have one
  const assignmentIds = React.useMemo(() => {
    const ids = new Set();
    shipments.forEach(s => {
      const aid = getAssignmentIdForShipment(s.id);
      if (aid) ids.add(aid);
    });
    return [...ids];
  }, [shipments, getAssignmentIdForShipment]);

  const assignmentIdsKey = assignmentIds.join(',');

  React.useEffect(() => {
    if (assignmentIds.length === 0) return;
    let cancelled = false;
    const fetchAll = async () => {
      setLoadingTracking(true);
      try {
        const results = await Promise.all(
          assignmentIds.map(aid =>
            apiFetch(`/api/tracking/records?assignmentId=${aid}`)
              .then(records => ({ aid, records }))
              .catch(() => ({ aid, records: [] }))
          )
        );
        if (!cancelled) {
          const map = {};
          results.forEach(({ aid, records }) => { map[aid] = records; });
          setTrackingByAssignment(map);
        }
      } finally {
        if (!cancelled) setLoadingTracking(false);
      }
    };
    fetchAll();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignmentIdsKey]);

  if (assignmentIds.length === 0) return null;

  return (
    <Card variant="outlined">
      <CardContent>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <Typography variant="h6">Tracking</Typography>
          {loadingTracking && <CircularProgress size={18} />}
        </Box>

        {assignmentIds.map((aid, aidIdx) => {
          const records = trackingByAssignment[aid] || [];
          const latest = records[records.length - 1];

          // Find which shipments belong to this assignment
          const relatedShipments = shipments.filter(s => getAssignmentIdForShipment(s.id) === aid);

          return (
            <Box key={aid} mb={aidIdx < assignmentIds.length - 1 ? 4 : 0}>
              {/* Assignment header */}
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                <Box>
                  <Typography variant="subtitle1" fontWeight={600}>
                    Assignment&nbsp;
                    <Typography component="span" variant="subtitle1" color="text.secondary" fontFamily="monospace">
                      {aid.substring(0, 8).toUpperCase()}
                    </Typography>
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {relatedShipments.map(s => `Shipment ${s.id.split('-')[0].toUpperCase()}`).join(', ')}
                  </Typography>
                </Box>
                {latest && (
                  <Chip
                    size="small"
                    color="success"
                    label={`Last ping: ${new Date(latest.createdAt).toLocaleString()}`}
                  />
                )}
              </Box>

              {loadingTracking ? (
                <Typography variant="body2" color="text.secondary">Loading tracking data…</Typography>
              ) : records.length === 0 ? (
                <Alert severity="info" sx={{ py: 0.5 }}>No tracking records for this assignment yet.</Alert>
              ) : (
                <>
                  {/* Latest position summary */}
                  <Box
                    sx={{
                      display: 'flex',
                      gap: 3,
                      p: 1.5,
                      mb: 2,
                      borderRadius: 1,
                      bgcolor: 'action.hover',
                    }}
                  >
                    <Box>
                      <Typography variant="caption" color="text.secondary">Latest Lat</Typography>
                      <Typography variant="body2" fontFamily="monospace">{latest.lat.toFixed(6)}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Latest Lon</Typography>
                      <Typography variant="body2" fontFamily="monospace">{latest.lon.toFixed(6)}</Typography>
                    </Box>
                    {latest.waypoint && (
                      <Box>
                        <Typography variant="caption" color="text.secondary">Waypoint</Typography>
                        <Typography variant="body2">{latest.waypoint}</Typography>
                      </Box>
                    )}
                    <Box>
                      <Typography variant="caption" color="text.secondary">Total Pings</Typography>
                      <Typography variant="body2">{records.length}</Typography>
                    </Box>
                  </Box>

                  {/* Waypoint timeline */}
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                    GPS History ({records.length} records)
                  </Typography>
                  <Box
                    sx={{
                      maxHeight: 260,
                      overflowY: 'auto',
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                    }}
                  >
                    <List disablePadding dense>
                      {[...records].reverse().map((rec, recIdx) => (
                        <React.Fragment key={rec.id}>
                          <ListItem sx={{ py: 0.75 }}>
                            <ListItemText
                              primary={
                                <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                                  <Typography variant="body2" fontFamily="monospace" fontSize={12}>
                                    {rec.lat.toFixed(6)}, {rec.lon.toFixed(6)}
                                  </Typography>
                                  {rec.waypoint && (
                                    <Chip label={rec.waypoint} size="small" variant="outlined" sx={{ height: 20, fontSize: 11 }} />
                                  )}
                                  {recIdx === 0 && (
                                    <Chip label="Latest" size="small" color="success" sx={{ height: 20, fontSize: 11 }} />
                                  )}
                                </Box>
                              }
                              secondary={new Date(rec.createdAt).toLocaleString()}
                            />
                          </ListItem>
                          {recIdx < records.length - 1 && <Divider component="li" />}
                        </React.Fragment>
                      ))}
                    </List>
                  </Box>
                </>
              )}

              {aidIdx < assignmentIds.length - 1 && <Divider sx={{ mt: 3 }} />}
            </Box>
          );
        })}
      </CardContent>
    </Card>
  );
}
