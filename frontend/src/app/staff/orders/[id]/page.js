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
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">Invoice ID</Typography>
                    <Typography variant="body2" color="text.secondary">N/A (Not in API)</Typography>
                  </Grid>
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
                                View Assignment
                              </Button>
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                Not assigned
                              </Typography>
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

        </Grid>
      ) : (
        !error && <Typography>Order not found.</Typography>
      )}
    </Box>
  );
}
