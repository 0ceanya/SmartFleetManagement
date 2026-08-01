"use client";

import * as React from "react";
import Link from "next/link";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { apiFetch } from "@/lib/api";
import RouteMap from "@/components/RouteMap";
import type { Offering, OrderDetails, Warehouse } from "@/lib/types";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString();
}

export default function OrderDetailView({ id }: { id: string }) {
  const [role] = React.useState<string | null>(() =>
    typeof window === "undefined" ? null : sessionStorage.getItem("smartfm.role"),
  );
  const [order, setOrder] = React.useState<OrderDetails | null>(null);
  const [offering, setOffering] = React.useState<Offering | null>(null);
  const [warehouses, setWarehouses] = React.useState<Record<string, Warehouse>>({});
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const orderData = await apiFetch<OrderDetails>(`/api/orders/${id}`);
        if (cancelled) return;
        setOrder(orderData);

        const offeringData = await apiFetch<Offering>(`/api/master-data/offerings/${orderData.offeringId}`);
        if (cancelled) return;
        setOffering(offeringData);

        const warehouseIds = Array.from(
          new Set(orderData.shipments.map((s) => s.warehouseId).filter((w): w is string => !!w)),
        );
        const warehouseResults = await Promise.all(
          warehouseIds.map((warehouseId) => apiFetch<Warehouse>(`/api/master-data/warehouses/${warehouseId}`)),
        );
        if (cancelled) return;
        const warehouseMap: Record<string, Warehouse> = {};
        warehouseResults.forEach((w) => {
          warehouseMap[w.id] = w;
        });
        setWarehouses(warehouseMap);
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
  }, [id]);

  return (
    <Box className="max-w-5xl mx-auto my-8 px-4">
      {role !== "customer" && role !== "staff" && (
        <Alert
          severity="warning"
          sx={{ mb: 3 }}
          action={
            <Link href="/" className="font-bold underline">
              Go to role picker
            </Link>
          }
        >
          Select Customer or Staff role first
        </Alert>
      )}

      <Typography variant="h4" sx={{ mb: 3 }}>
        Order Detail
      </Typography>

      {loading && (
        <Stack direction="row" spacing={1} alignItems="center">
          <CircularProgress size={20} />
          <Typography variant="body2">Loading order...</Typography>
        </Stack>
      )}

      {error && (
        <Card variant="outlined" sx={{ p: 2 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            Failed to load order: {error}
          </Alert>
          <Link href="/orders" className="font-bold underline text-sm">
            Back to orders
          </Link>
        </Card>
      )}

      {!loading && !error && order && (
        <Stack spacing={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Order Summary
              </Typography>
              <Stack direction="row" spacing={4} flexWrap="wrap" useFlexGap>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Order ID
                  </Typography>
                  <Typography variant="body2">{order.id}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Status
                  </Typography>
                  <Box>
                    <Chip label={order.status} size="small" />
                  </Box>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Weight (kg)
                  </Typography>
                  <Typography variant="body2">{order.orderWeightKg}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Created At
                  </Typography>
                  <Typography variant="body2">{formatDate(order.createdAt)}</Typography>
                </Box>
                {offering && (
                  <>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Offering
                      </Typography>
                      <Typography variant="body2">{offering.name}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Base Price
                      </Typography>
                      <Typography variant="body2">{offering.basePrice}</Typography>
                    </Box>
                  </>
                )}
              </Stack>
            </CardContent>
          </Card>

          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Cargo
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Description</TableCell>
                    <TableCell>Weight (kg)</TableCell>
                    <TableCell>Volume (cbm)</TableCell>
                    <TableCell>Hazardous</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {order.cargoes.map((cargo) => (
                    <TableRow key={cargo.id}>
                      <TableCell>{cargo.description}</TableCell>
                      <TableCell>{cargo.weightKg}</TableCell>
                      <TableCell>{cargo.volumeCbm ?? "-"}</TableCell>
                      <TableCell>{cargo.isHazardous ? "Yes" : "No"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {order.shipments.map((shipment) => {
            const warehouse = shipment.warehouseId ? warehouses[shipment.warehouseId] : null;
            return (
              <Card variant="outlined" key={shipment.id}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Typography variant="h6">Shipment {shipment.id}</Typography>
                    <Chip label={shipment.status} size="small" />
                  </Stack>
                  <Stack spacing={0.5} sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      <strong>Pickup:</strong> {shipment.pickupAddress}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Delivery:</strong> {shipment.deliveryAddress}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Created {formatDate(shipment.createdAt)}
                    </Typography>
                    {warehouse && (
                      <Typography variant="body2">
                        <strong>Staging warehouse:</strong> {warehouse.name} ({warehouse.address})
                      </Typography>
                    )}
                  </Stack>
                  <RouteMap
                    originAddress={shipment.pickupAddress}
                    destinationAddress={shipment.deliveryAddress}
                  />
                </CardContent>
              </Card>
            );
          })}
        </Stack>
      )}
    </Box>
  );
}
