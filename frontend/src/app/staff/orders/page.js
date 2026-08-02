"use client";

import * as React from "react";
import { 
  Box, Typography, TextField, Button, Stack, Alert, CircularProgress, 
  Select, MenuItem, InputLabel, FormControl, Grid, Paper, IconButton
} from "@mui/material";
import SwapVertIcon from '@mui/icons-material/SwapVert';
import OrdersTable from "@/components/staff/OrdersTable";
import { apiFetch } from "@/lib/api";

export default function OrdersPage() {
  const [allOrders, setAllOrders] = React.useState([]);
  const [customers, setCustomers] = React.useState({});
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
      const [ordersData, customersData] = await Promise.all([
        apiFetch("/api/orders"),
        apiFetch("/api/customers").catch(() => []) // gracefully handle if endpoint missing
      ]);
      setAllOrders(ordersData);
      
      const customerMap = {};
      customersData.forEach(c => {
        if (c && c.id) {
          customerMap[c.id.toLowerCase()] = c;
        }
      });
      setCustomers(customerMap);
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
  const filteredOrders = React.useMemo(() => {
    return allOrders
      .filter(order => {
        // Search by ID or Email
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const customerEmail = customers[order.customerId?.toLowerCase()]?.email?.toLowerCase() || "";
          
          if (!order.id?.toLowerCase().includes(q) && 
              !order.customerId?.toLowerCase().includes(q) &&
              !customerEmail.includes(q)) {
            return false;
          }
        }
        
        // Status filter
        if (statusFilter && order.status !== statusFilter) {
          return false;
        }
        
        // Date range filter
        if (startDate) {
          if (new Date(order.createdAt) < new Date(startDate)) return false;
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          if (new Date(order.createdAt) > end) return false;
        }
        
        return true;
      })
      .sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
      });
  }, [allOrders, customers, searchQuery, statusFilter, startDate, endDate, sortOrder]);

  return (
    <Box className="max-w-7xl mx-auto my-8 px-4">
      <Typography variant="h4" sx={{ mb: 4 }}>
        Orders Queue
      </Typography>

      <Paper variant="outlined" sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              label="Search Order/Customer ID or Email"
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
                <MenuItem value="Pending">Pending</MenuItem>
                <MenuItem value="PendingPayment">PendingPayment</MenuItem>
                <MenuItem value="Approved">Approved</MenuItem>
                <MenuItem value="Fulfilled">Fulfilled</MenuItem>
                <MenuItem value="Cancelled">Cancelled</MenuItem>
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
        <OrdersTable orders={filteredOrders} />
      )}
    </Box>
  );
}
