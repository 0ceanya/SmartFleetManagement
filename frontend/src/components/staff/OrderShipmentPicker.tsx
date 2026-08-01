"use client";

import * as React from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { apiFetch } from "@/lib/api";
import type { OrderSummary, ShipmentSummary } from "@/lib/types";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString();
}

export interface OrderShipmentPickerProps {
  selectedShipmentIds: string[];
  onToggleShipment: (shipment: ShipmentSummary) => void;
}

export default function OrderShipmentPicker({
  selectedShipmentIds,
  onToggleShipment,
}: OrderShipmentPickerProps) {
  const [orders, setOrders] = React.useState<OrderSummary[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");
  const [expandedOrderId, setExpandedOrderId] = React.useState<string | null>(null);
  const [shipmentsByOrder, setShipmentsByOrder] = React.useState<Record<string, ShipmentSummary[]>>({});
  const [loadingShipmentsFor, setLoadingShipmentsFor] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await apiFetch<OrderSummary[]>("/api/orders");
        if (!cancelled) setOrders(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredOrders = orders.filter((order) => {
    if (!search.trim()) return true;
    const needle = search.trim().toLowerCase();
    return order.id.toLowerCase().includes(needle) || order.status.toLowerCase().includes(needle);
  });

  const handleToggleExpand = async (orderId: string) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
      return;
    }
    setExpandedOrderId(orderId);
    if (!shipmentsByOrder[orderId]) {
      setLoadingShipmentsFor(orderId);
      try {
        const details = await apiFetch<{ shipments: ShipmentSummary[] }>(`/api/orders/${orderId}`);
        setShipmentsByOrder((prev) => ({ ...prev, [orderId]: details.shipments }));
      } finally {
        setLoadingShipmentsFor(null);
      }
    }
  };

  return (
    <Stack spacing={2}>
      <TextField
        label="Search orders"
        size="small"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Order id or status"
      />

      {loading && (
        <Stack direction="row" spacing={1} alignItems="center">
          <CircularProgress size={20} />
          <Typography variant="body2">Loading orders...</Typography>
        </Stack>
      )}

      {error && <Alert severity="error">Failed to load orders: {error}</Alert>}

      {!loading && !error && (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell />
              <TableCell>Order ID</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Weight (kg)</TableCell>
              <TableCell>Created At</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredOrders.map((order) => {
              const isExpanded = expandedOrderId === order.id;
              const shipments = shipmentsByOrder[order.id];
              return (
                <React.Fragment key={order.id}>
                  <TableRow>
                    <TableCell>
                      <IconButton size="small" onClick={() => handleToggleExpand(order.id)}>
                        {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                    </TableCell>
                    <TableCell>{order.id}</TableCell>
                    <TableCell>{order.status}</TableCell>
                    <TableCell>{order.orderWeightKg}</TableCell>
                    <TableCell>{formatDate(order.createdAt)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={5} sx={{ p: 0, borderBottom: isExpanded ? undefined : "none" }}>
                      <Collapse in={isExpanded} unmountOnExit>
                        <Box sx={{ p: 2 }}>
                          {loadingShipmentsFor === order.id && (
                            <Stack direction="row" spacing={1} alignItems="center">
                              <CircularProgress size={16} />
                              <Typography variant="body2">Loading shipments...</Typography>
                            </Stack>
                          )}
                          {shipments && shipments.length === 0 && (
                            <Typography variant="body2" color="text.secondary">
                              No shipments on this order.
                            </Typography>
                          )}
                          {shipments && shipments.length > 0 && (
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell />
                                  <TableCell>Shipment ID</TableCell>
                                  <TableCell>Pickup</TableCell>
                                  <TableCell>Delivery</TableCell>
                                  <TableCell>Status</TableCell>
                                  <TableCell>Created At</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {shipments.map((shipment) => (
                                  <TableRow key={shipment.id}>
                                    <TableCell>
                                      <Checkbox
                                        checked={selectedShipmentIds.includes(shipment.id)}
                                        onChange={() => onToggleShipment(shipment)}
                                      />
                                    </TableCell>
                                    <TableCell>{shipment.id}</TableCell>
                                    <TableCell>{shipment.pickupAddress}</TableCell>
                                    <TableCell>{shipment.deliveryAddress}</TableCell>
                                    <TableCell>{shipment.status}</TableCell>
                                    <TableCell>{formatDate(shipment.createdAt)}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          )}
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      )}
    </Stack>
  );
}
