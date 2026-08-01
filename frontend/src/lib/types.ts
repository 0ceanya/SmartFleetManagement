export interface Cargo {
  id: string;
  description: string;
  weightKg: number;
  volumeCbm: number | null;
  isHazardous: boolean;
}

export interface ShipmentSummary {
  id: string;
  pickupAddress: string;
  deliveryAddress: string;
  warehouseId: string | null;
  status: string;
  createdAt: string;
}

export interface OrderDetails {
  id: string;
  customerId: string;
  offeringId: string;
  orderWeightKg: number;
  status: string;
  createdAt: string;
  cargoes: Cargo[];
  shipments: ShipmentSummary[];
}

export interface OrderSummary {
  id: string;
  customerId: string;
  offeringId: string;
  orderWeightKg: number;
  status: string;
  createdAt: string;
}

export interface Offering {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  maxWeightKg: number;
  maxVolumeCbm: number;
  vehicleClass: string;
}

export interface Warehouse {
  id: string;
  name: string;
  address: string;
  branchId: string;
  capacityKg: number;
}

export interface Employee {
  id: string;
  type: string;
  name: string;
  email: string;
  branchId: string;
  licenseNumber: string | null;
  isAvailable: boolean;
  department: string | null;
}

export interface Vehicle {
  id: string;
  registrationNumber: string;
  currentStatus: string;
  branchId: string;
  maxPayloadKg: number;
  vehicleClass: string;
}

export interface RouteRequestPayload {
  originAddress: string;
  destinationAddress: string;
  waypoints?: string[] | null;
  distanceKm: number | null;
  estimatedDurationMinutes: number | null;
}

export interface CreateAssignmentRequest {
  shipmentIds: string[];
  driverId: string;
  vehicleId: string;
  route?: RouteRequestPayload | null;
  warehouseId?: string | null;
}

export interface RouteResponse {
  id: string;
  originAddress: string;
  destinationAddress: string;
  waypoints: string[] | null;
  distanceKm: number | null;
  estimatedDurationMinutes: number | null;
}

export interface AssignmentResponse {
  id: string;
  shipmentIds: string[];
  driverId: string;
  vehicleId: string;
  route: RouteResponse | null;
  status: string;
  createdAt: string;
}

export interface GeocodeResult {
  lat: number;
  lon: number;
  displayName: string;
}

export interface OsrmRouteResult {
  distanceKm: number;
  durationMinutes: number;
  coordinates: [number, number][];
}
