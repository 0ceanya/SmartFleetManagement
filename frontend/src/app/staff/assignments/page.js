"use client";

import * as React from "react";
import Link from "next/link";
import { Box, Typography, TextField, Button, Stack, Alert, CircularProgress, Select, MenuItem, InputLabel, FormControl } from "@mui/material";
import AssignmentsTable from "@/components/staff/AssignmentsTable";
import { apiFetch } from "@/lib/api";

export default function AssignmentsPage() {
  const [assignments, setAssignments] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  
  const [statusFilter, setStatusFilter] = React.useState("");
  const [idSearch, setIdSearch] = React.useState("");

  const fetchAssignments = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch("/api/fleet/assignments");
      setAssignments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchAssignments();
  }, []);

  const handleClear = () => {
    setStatusFilter("");
    setIdSearch("");
  };

  const filteredAssignments = React.useMemo(() => {
    return assignments.filter(a => {
      if (statusFilter && a.status !== statusFilter) return false;
      if (idSearch) {
        if (!a.id.toLowerCase().includes(idSearch.toLowerCase())) return false;
      }
      return true;
    });
  }, [assignments, statusFilter, idSearch]);

  return (
    <Box className="max-w-7xl mx-auto my-8 px-4">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4">
          Assignments
        </Typography>
        <Button component={Link} href="/staff/assignments/new" variant="contained" color="primary">
          Create New Assignment
        </Button>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            label="Search by Assignment ID"
            variant="outlined"
            size="small"
            value={idSearch}
            onChange={(e) => setIdSearch(e.target.value)}
            sx={{ minWidth: 250 }}
          />
          <FormControl sx={{ minWidth: 200 }} size="small">
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value=""><em>Any Status</em></MenuItem>
              <MenuItem value="Assigned">Assigned</MenuItem>
              <MenuItem value="Approved">Approved</MenuItem>
              <MenuItem value="Completed">Completed</MenuItem>
              <MenuItem value="Cancelled">Cancelled</MenuItem>
            </Select>
          </FormControl>
          <Button type="button" variant="outlined" onClick={handleClear}>
            Clear
          </Button>
        </Stack>
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
      ) : (
        <AssignmentsTable assignments={filteredAssignments} />
      )}
    </Box>
  );
}
