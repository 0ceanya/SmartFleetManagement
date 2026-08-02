"use client";

import * as React from "react";
import { 
  Box, Typography, TextField, Button, Alert, CircularProgress, 
  Select, MenuItem, InputLabel, FormControl, Grid, Paper
} from "@mui/material";
import SwapVertIcon from '@mui/icons-material/SwapVert';
import InvoicesTable from "@/components/staff/InvoicesTable";
import { apiFetch } from "@/lib/api";

export default function BillingPage() {
  const [allInvoices, setAllInvoices] = React.useState([]);
  const [customers, setCustomers] = React.useState({});
  const [orders, setOrders] = React.useState({});
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("");
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [sortOrder, setSortOrder] = React.useState("desc");

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [invoicesData, customersData, ordersData] = await Promise.all([
        apiFetch("/api/billing/invoices"),
        apiFetch("/api/customers").catch(() => []),
        apiFetch("/api/orders").catch(() => [])
      ]);
      setAllInvoices(invoicesData);
      
      const customerMap = {};
      customersData.forEach(c => {
        if (c && c.id) {
          customerMap[c.id.toLowerCase()] = c;
        }
      });
      setCustomers(customerMap);

      const orderMap = {};
      ordersData.forEach(o => {
        if (o && o.id) {
          orderMap[o.id.toLowerCase()] = o;
        }
      });
      setOrders(orderMap);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  const handleClear = () => {
    setSearchQuery("");
    setStatusFilter("");
    setStartDate("");
    setEndDate("");
    setSortOrder("desc");
  };

  const toggleSort = () => {
    setSortOrder(prev => prev === "desc" ? "asc" : "desc");
  };

  // Apply filters
  const filteredInvoices = React.useMemo(() => {
    return allInvoices
      .filter(invoice => {
        // Search by Invoice ID, Order ID, or Customer Email
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          
          const order = orders[invoice.orderId?.toLowerCase()];
          const customerEmail = order ? customers[order.customerId?.toLowerCase()]?.email?.toLowerCase() : "";
          
          if (!invoice.id?.toLowerCase().includes(q) && 
              !invoice.orderId?.toLowerCase().includes(q) &&
              (!customerEmail || !customerEmail.includes(q))) {
            return false;
          }
        }
        
        // Status filter
        if (statusFilter && invoice.status !== statusFilter) {
          return false;
        }
        
        // Date range filter
        if (startDate) {
          if (new Date(invoice.createdAt) < new Date(startDate)) return false;
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          if (new Date(invoice.createdAt) > end) return false;
        }
        
        return true;
      })
      .sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
      });
  }, [allInvoices, customers, orders, searchQuery, statusFilter, startDate, endDate, sortOrder]);

  return (
    <Box className="max-w-7xl mx-auto my-8 px-4">
      <Typography variant="h4" sx={{ mb: 4 }}>
        Billing & Invoices
      </Typography>

      <Paper variant="outlined" sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              label="Search Invoice/Order ID or Email"
              variant="outlined"
              size="small"
              fullWidth
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value=""><em>Any Status</em></MenuItem>
                <MenuItem value="PendingPayment">PendingPayment</MenuItem>
                <MenuItem value="Paid">Paid</MenuItem>
                <MenuItem value="Void">Void</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
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
          <Grid item xs={12} md={2}>
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
          <Grid item xs={12} md={3} display="flex" gap={1}>
            <Button variant="outlined" onClick={toggleSort} startIcon={<SwapVertIcon />}>
              Sort: {sortOrder === "desc" ? "Newest" : "Oldest"}
            </Button>
            <Button variant="outlined" color="secondary" onClick={handleClear}>
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
        <InvoicesTable invoices={filteredInvoices} />
      )}
    </Box>
  );
}
