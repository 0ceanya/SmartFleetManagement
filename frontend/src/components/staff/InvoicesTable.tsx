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

export default function InvoicesTable({ invoices }: { invoices: any[] }) {
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

  const displayedInvoices = invoices.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Paper variant="outlined">
      <TableContainer>
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
          {displayedInvoices.map((invoice) => (
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
      <TablePagination
        rowsPerPageOptions={[10, 25, 50]}
        component="div"
        count={invoices.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Paper>
  );
}
