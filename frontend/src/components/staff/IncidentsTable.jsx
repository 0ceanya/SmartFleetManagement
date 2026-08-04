"use client";

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Tooltip,
  TablePagination,
  Typography
} from "@mui/material";

export default function IncidentsTable({ incidents = [] }) {
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const formatId = (id) => (id ? `${id.substring(0, 8)}...` : "-");

  const getSeverityChipColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case "critical":
        return "error";
      case "high":
        return "warning";
      case "medium":
        return "info";
      case "low":
        return "default";
      default:
        return "default";
    }
  };

  const displayedIncidents = incidents.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Paper variant="outlined">
      <TableContainer>
        <Table sx={{ minWidth: 650 }} aria-label="incidents table">
          <TableHead>
            <TableRow>
              <TableCell><strong>Incident #</strong></TableCell>
              <TableCell><strong>Category</strong></TableCell>
              <TableCell><strong>Severity</strong></TableCell>
              <TableCell><strong>Shipment ID</strong></TableCell>
              <TableCell><strong>Vehicle ID</strong></TableCell>
              <TableCell><strong>Description</strong></TableCell>
              <TableCell align="right"><strong>Reported At</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {displayedIncidents.map((incident) => (
              <TableRow key={incident.id} hover sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                <TableCell component="th" scope="row">
                  <Tooltip title={incident.id} arrow>
                    <Typography variant="body2" sx={{ fontFamily: "monospace", fontWeight: 600 }}>
                      {formatId(incident.id)}
                    </Typography>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight={500}>
                    {incident.category || "General"}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={incident.severity || "Unknown"}
                    color={getSeverityChipColor(incident.severity)}
                    size="small"
                    sx={{ fontWeight: 600 }}
                  />
                </TableCell>
                <TableCell>
                  {incident.shipmentId ? (
                    <Tooltip title={incident.shipmentId} arrow>
                      <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
                        {formatId(incident.shipmentId)}
                      </Typography>
                    </Tooltip>
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell>
                  {incident.vehicleId ? (
                    <Tooltip title={incident.vehicleId} arrow>
                      <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
                        {formatId(incident.vehicleId)}
                      </Typography>
                    </Tooltip>
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell sx={{ maxWidth: 300 }}>
                  <Tooltip title={incident.description} arrow>
                    <Typography
                      variant="body2"
                      sx={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {incident.description}
                    </Typography>
                  </Tooltip>
                </TableCell>
                <TableCell align="right">
                  {incident.createdAt ? new Date(incident.createdAt).toLocaleString() : "-"}
                </TableCell>
              </TableRow>
            ))}
            {incidents.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    No incidents found matching the specified filters.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[10, 25, 50]}
        component="div"
        count={incidents.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Paper>
  );
}
