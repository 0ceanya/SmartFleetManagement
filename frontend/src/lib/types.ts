export type OrderStatusValue = "Pending" | "Approved" | "Active" | "Fulfilled" | "Cancelled";
export type AssignmentStatusValue = "Pending" | "Assigned" | "Loaded" | "Delivering" | "Delivered" | "Rejected";
export type ShipmentStatusValue = "Created" | "Assigned" | "InTransit" | "Delivered" | "Cancelled";

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
  status: ShipmentStatusValue;
  createdAt: string;
}

export interface InvoiceSummary {
  id: string;
  orderId: string;
  amount: number;
  status: string;
  createdAt: string;
}

export interface Receipt {
  invoiceId: string;
  amountPaid: number;
  paymentMethod: string;
  gatewayResponse: string;
  issuedAt: string;
}

export interface OrderDetails {
  id: string;
  customerId: string;
  offeringId: string;
  orderWeightKg: number;
  status: OrderStatusValue;
  createdAt: string;
  cargoes: Cargo[];
  shipments: ShipmentSummary[];
  invoice: InvoiceSummary | null;
}

export interface OrderSummary {
  id: string;
  customerId: string;
  offeringId: string;
  orderWeightKg: number;
  status: OrderStatusValue;
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

export interface AssignmentShipmentResponse {
  id: string;
  orderId: string;
  pickupAddress: string;
  deliveryAddress: string;
  status: ShipmentStatusValue;
  customerName: string;
  customerPhone: string;
}

export interface AssignmentResponse {
  id: string;
  shipmentIds: string[];
  shipments: AssignmentShipmentResponse[];
  driverId: string;
  vehicleId: string;
  route: RouteResponse | null;
  status: AssignmentStatusValue;
  createdAt: string;
}

export interface LoadManifestResponse {
  shipmentId: string;
  cargoIds: string[];
  cargoDescriptions: string[];
  totalWeightKg: number;
  containsHazardous: boolean;
  createdAt: string;
  loadedCargoIds: string[];
  isPickupResolved: boolean;
  isDropoffResolved: boolean;
  damagedOrMissingItems: string[] | null;
}

export interface GeocodeAddressComponents {
  road?: string;
  suburb?: string;
  quarter?: string;
  village?: string;
  city_district?: string;
  city?: string;
  town?: string;
  state?: string;
}

export interface GeocodeResult {
  lat: number;
  lon: number;
  displayName: string;
  address?: GeocodeAddressComponents;
}

export interface OsrmRouteResult {
  distanceKm: number;
  durationMinutes: number;
  coordinates: [number, number][];
}
