"use client";

import * as React from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  Tooltip,
  TablePagination
} from "@mui/material";
import type { OrderSummary } from "@/lib/types";

export default function OrdersTable({ orders }: { orders: OrderSummary[] }) {
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const formatId = (id: string) => `${id.substring(0, 8)}...`;

  const displayedOrders = orders.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Paper variant="outlined">
      <TableContainer>
        <Table sx={{ minWidth: 650 }} aria-label="orders table">
          <TableHead>
          <TableRow>
            <TableCell><strong>Order #</strong></TableCell>
            <TableCell><strong>Customer ID</strong></TableCell>
            <TableCell><strong>Status</strong></TableCell>
            <TableCell><strong>Weight (kg)</strong></TableCell>
            <TableCell><strong>Created At</strong></TableCell>
            <TableCell align="right"><strong>Actions</strong></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {displayedOrders.map((order) => (
            <TableRow key={order.id} sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
              <TableCell component="th" scope="row">
                <Tooltip title={order.id} arrow>
                  <span>{formatId(order.id)}</span>
                </Tooltip>
              </TableCell>
              <TableCell>
                <Tooltip title={order.customerId} arrow>
                  <span>{formatId(order.customerId)}</span>
                </Tooltip>
              </TableCell>
              <TableCell>
                <Chip
                  label={order.status}
                  color={
                    order.status === "Pending"
                      ? "warning"
                      : order.status === "Fulfilled"
                      ? "success"
                      : order.status === "Cancelled"
                      ? "error"
                      : "primary"
                  }
                  size="small"
                />
              </TableCell>
              <TableCell>{order.orderWeightKg}</TableCell>
              <TableCell>{new Date(order.createdAt).toLocaleString()}</TableCell>
              <TableCell align="right">
                <Button component={Link} href={`/staff/orders/${order.id}`} variant="outlined" size="small">
                  View Details
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {orders.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                No orders found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[10, 25, 50]}
        component="div"
        count={orders.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Paper>
  );
}
