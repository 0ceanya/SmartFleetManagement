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
  Tooltip
} from "@mui/material";

export default function InvoicesTable({ invoices }: { invoices: any[] }) {
  const formatId = (id: string) => `${id.substring(0, 8)}...`;

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table sx={{ minWidth: 650 }} aria-label="invoices table">
        <TableHead>
          <TableRow>
            <TableCell><strong>Invoice #</strong></TableCell>
            <TableCell><strong>Order #</strong></TableCell>
            <TableCell><strong>Status</strong></TableCell>
            <TableCell><strong>Amount</strong></TableCell>
            <TableCell><strong>Created At</strong></TableCell>
            <TableCell align="right"><strong>Actions</strong></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow key={invoice.id} sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
              <TableCell component="th" scope="row">
                <Tooltip title={invoice.id} arrow>
                  <span>{formatId(invoice.id)}</span>
                </Tooltip>
              </TableCell>
              <TableCell>
                <Tooltip title={invoice.orderId} arrow>
                  <Link href={`/staff/orders/${invoice.orderId}`} className="text-blue-500 hover:underline">
                    {formatId(invoice.orderId)}
                  </Link>
                </Tooltip>
              </TableCell>
              <TableCell>
                <Chip
                  label={invoice.status}
                  color={
                    invoice.status === "Paid"
                      ? "success"
                      : invoice.status === "Void"
                      ? "error"
                      : "warning"
                  }
                  size="small"
                />
              </TableCell>
              <TableCell>${invoice.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
              <TableCell>{new Date(invoice.createdAt).toLocaleString()}</TableCell>
              <TableCell align="right">
                <Button component={Link} href={`/staff/billing/invoices/${invoice.id}`} variant="outlined" size="small">
                  View Details
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {invoices.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                No invoices found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
