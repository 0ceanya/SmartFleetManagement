import * as React from "react";
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  Paper,
  Box
} from "@mui/material";
import type { AssignmentResponse } from "@/lib/types";

export default function AssignmentCard({ assignment }: { assignment: AssignmentResponse }) {
  const [driver, setDriver] = React.useState<any>(null);

  React.useEffect(() => {
    if (assignment?.driverId) {
      import("@/lib/api").then(({ apiFetch }) => {
        apiFetch(`/api/master-data/employees/${assignment.driverId}`)
          .then((data) => setDriver(data))
          .catch((err) => console.error("Failed to fetch driver details:", err));
      });
    }
  }, [assignment?.driverId]);

  return (
    <Card variant="outlined" sx={{ mb: 4 }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            Assignment Details
          </Typography>
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
          />
        </Box>

        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle2" color="text.secondary">Assignment ID</Typography>
            <Typography variant="body1">{assignment.id}</Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="subtitle2" color="text.secondary">Driver Info</Typography>
            <Typography variant="body2">
              <strong>Name:</strong> {driver ? driver.name : assignment.driverId}
            </Typography>
            <Typography variant="body2">
              <strong>Email:</strong> {driver ? driver.email : "Loading..."}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Typography variant="subtitle2" color="text.secondary">Vehicle ID</Typography>
            <Typography variant="body1">{assignment.vehicleId}</Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle2" color="text.secondary">Created At</Typography>
            <Typography variant="body1">{new Date(assignment.createdAt).toLocaleString()}</Typography>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle1" gutterBottom>Route Details</Typography>
        {assignment.route ? (
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="text.secondary">Origin</Typography>
              <Typography variant="body2">{assignment.route.originAddress}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="text.secondary">Destination</Typography>
              <Typography variant="body2">{assignment.route.destinationAddress}</Typography>
            </Grid>
            {assignment.route.distanceKm !== null && (
              <Grid item xs={6} sm={3}>
                <Typography variant="subtitle2" color="text.secondary">Distance</Typography>
                <Typography variant="body2">{assignment.route.distanceKm} km</Typography>
              </Grid>
            )}
            {assignment.route.estimatedDurationMinutes !== null && (
              <Grid item xs={6} sm={3}>
                <Typography variant="subtitle2" color="text.secondary">Duration</Typography>
                <Typography variant="body2">{assignment.route.estimatedDurationMinutes} mins</Typography>
              </Grid>
            )}
          </Grid>
        ) : (
          <Typography variant="body2" color="text.secondary">No route information available.</Typography>
        )}

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle1" gutterBottom>Shipments ({assignment.shipments.length})</Typography>
        {assignment.shipments.length > 0 ? (
          <Paper variant="outlined" sx={{ maxHeight: 300, overflow: "auto" }}>
            <List disablePadding>
              {assignment.shipments.map((shipment, index) => (
                <React.Fragment key={shipment.id}>
                  <ListItem alignItems="flex-start">
                    <ListItemText
                      primary={`Shipment ${shipment.id.split('-')[0].toUpperCase()} - Status: ${shipment.status}`}
                      secondary={
                        <React.Fragment>
                          <Typography variant="body2" color="text.primary" component="span">
                            Order: {shipment.orderId}
                          </Typography>
                          <br />
                          From: {shipment.pickupAddress}
                          <br />
                          To: {shipment.deliveryAddress}
                        </React.Fragment>
                      }
                    />
                  </ListItem>
                  {index < assignment.shipments.length - 1 && <Divider component="li" />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        ) : (
          <Typography variant="body2" color="text.secondary">No shipments associated.</Typography>
        )}
      </CardContent>
    </Card>
  );
}
