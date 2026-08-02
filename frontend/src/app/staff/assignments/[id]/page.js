"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { Box, Typography, Button, Alert, CircularProgress, Breadcrumbs } from "@mui/material";
import Link from "next/link";
import AssignmentCard from "@/components/staff/AssignmentCard";
import { apiFetch } from "@/lib/api";

export default function AssignmentDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id;

  const [assignment, setAssignment] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    if (!id) return;
    
    const fetchAssignment = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await apiFetch(`/api/fleet/assignments/${id}`);
        setAssignment(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    };

    fetchAssignment();
  }, [id]);

  return (
    <Box className="max-w-5xl mx-auto my-8 px-4">
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link href="/staff/assignments" className="hover:underline">
          Assignments
        </Link>
        <Typography color="text.primary">Details</Typography>
      </Breadcrumbs>

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4">
          Assignment View
        </Typography>
        <Button variant="outlined" onClick={() => router.back()}>
          Back
        </Button>
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
      ) : assignment ? (
        <AssignmentCard assignment={assignment} />
      ) : (
        !error && <Typography>Assignment not found.</Typography>
      )}
    </Box>
  );
}
