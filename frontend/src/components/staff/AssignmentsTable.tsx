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
import type { AssignmentResponse } from "@/lib/types";
import { apiFetch } from "@/lib/api";

function DriverName({ driverId }: { driverId: string }) {
  const [name, setName] = React.useState<string>("Loading...");

  React.useEffect(() => {
    if (driverId) {
      apiFetch(`/api/master-data/employees/${driverId}`)
        .then((data: any) => setName(data.name || driverId))
        .catch(() => setName(driverId));
    }
  }, [driverId]);

  return <>{name}</>;
}

export default function AssignmentsTable({ assignments }: { assignments: AssignmentResponse[] }) {
  const formatId = (id: string) => `${id.substring(0, 8)}...`;

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table sx={{ minWidth: 650 }} aria-label="assignments table">
        <TableHead>
          <TableRow>
            <TableCell><strong>Assignment #</strong></TableCell>
            <TableCell><strong>Status</strong></TableCell>
            <TableCell><strong>Driver Name</strong></TableCell>
            <TableCell><strong>Vehicle ID</strong></TableCell>
            <TableCell><strong>Shipments count</strong></TableCell>
            <TableCell><strong>Created At</strong></TableCell>
            <TableCell align="right"><strong>Actions</strong></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {assignments.map((assignment) => (
            <TableRow key={assignment.id} sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
              <TableCell component="th" scope="row">
                <Tooltip title={assignment.id} arrow>
                  <span>{formatId(assignment.id)}</span>
                </Tooltip>
              </TableCell>
              <TableCell>
                <Chip
                  label={assignment.status}
                  color={
                    assignment.status === "Assigned"
                      ? "warning"
                      : assignment.status === "Approved"
                        ? "info"
                        : assignment.status === "Completed"
                          ? "success"
                          : "default"
                  }
                  size="small"
                />
              </TableCell>
              <TableCell><DriverName driverId={assignment.driverId} /></TableCell>
              <TableCell>
                <Tooltip title={assignment.vehicleId} arrow>
                  <span>{formatId(assignment.vehicleId)}</span>
                </Tooltip>
              </TableCell>
              <TableCell>{assignment.shipmentIds.length}</TableCell>
              <TableCell>{new Date(assignment.createdAt).toLocaleString()}</TableCell>
              <TableCell align="right">
                <Button component={Link} href={`/staff/assignments/${assignment.id}`} variant="outlined" size="small">
                  View Details
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {assignments.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                No assignments found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
