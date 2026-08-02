"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { Box, Typography, Button, Alert, CircularProgress, Breadcrumbs, Card, CardContent, Grid, Divider, Chip } from "@mui/material";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

export default function InvoiceDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id;

  const [invoice, setInvoice] = React.useState(null);
  const [receipt, setReceipt] = React.useState(null);
  const [order, setOrder] = React.useState(null);
  const [customer, setCustomer] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    if (!id) return;
    
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const invoiceData = await apiFetch(`/api/billing/invoices/${id}`);
        setInvoice(invoiceData);

        // Fetch receipt if paid
        if (invoiceData.status === "Paid") {
          try {
            const receiptData = await apiFetch(`/api/billing/invoices/${id}/receipt`);
            setReceipt(receiptData);
          } catch (err) {
            console.error("Failed to fetch receipt data:", err);
          }
        }

        // Fetch Order details
        if (invoiceData?.orderId) {
          try {
            const orderData = await apiFetch(`/api/orders/${invoiceData.orderId}`);
            setOrder(orderData);
            
            // Fetch Customer Details
            if (orderData?.customerId) {
              const customerData = await apiFetch(`/api/customers/${orderData.customerId}`);
              setCustomer(customerData);
            }
          } catch (err) {
            console.error("Failed to fetch order or customer data:", err);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  return (
    <Box className="max-w-6xl mx-auto my-8 px-4">
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link href="/staff/billing" className="hover:underline">
          Billing
        </Link>
        <Typography color="text.primary">Invoice Details</Typography>
      </Breadcrumbs>

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4">
          Invoice Details
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
      ) : invoice ? (
        <Grid container spacing={4}>
          {/* Invoice Summary */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Overview</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">Invoice ID</Typography>
                    <Typography variant="body2">{invoice.id}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">Amount</Typography>
                    <Typography variant="h6" color="primary">
                      ${invoice.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                    <Chip 
                      label={invoice.status} 
                      size="small" 
                      color={invoice.status === 'Paid' ? 'success' : invoice.status === 'Void' ? 'error' : 'warning'} 
                      sx={{ mt: 0.5 }} 
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">Created At</Typography>
                    <Typography variant="body2">{new Date(invoice.createdAt).toLocaleString()}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">Order ID</Typography>
                    <Link href={`/staff/orders/${invoice.orderId}`} className="text-blue-500 hover:underline">
                      <Typography variant="body2" color="primary">{invoice.orderId}</Typography>
                    </Link>
                  </Grid>
                </Grid>

                {receipt && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="h6" gutterBottom>Payment Receipt</Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" color="text.secondary">Receipt ID</Typography>
                        <Typography variant="body2">{receipt.id}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="subtitle2" color="text.secondary">Method</Typography>
                        <Typography variant="body2">{receipt.paymentMethod}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="subtitle2" color="text.secondary">Paid At</Typography>
                        <Typography variant="body2">{new Date(receipt.paidAt).toLocaleString()}</Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" color="text.secondary">Gateway Response</Typography>
                        <Typography variant="body2" sx={{ bgcolor: 'grey.100', p: 1, borderRadius: 1 }}>
                          {receipt.gatewayResponse}
                        </Typography>
                      </Grid>
                    </Grid>
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Customer Details */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Customer Details</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">Customer ID</Typography>
                    <Typography variant="body2">{customer ? customer.id : order ? order.customerId : 'Loading...'}</Typography>
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
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      ) : (
        !error && <Typography>Invoice not found.</Typography>
      )}
    </Box>
  );
}
