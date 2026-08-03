// src/app/orders/[id]/OrderDetailView.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import type { Offering, OrderDetails, Warehouse } from "@/lib/types";

// Helper to format timestamps cleanly
function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getStatusChipClass(status: string) {
  const normalized = status.toLowerCase();
  if (normalized.includes("completed") || normalized.includes("delivered")) {
    return "bg-emerald-100 text-emerald-800";
  }
  if (normalized.includes("pending") || normalized.includes("processing")) {
    return "bg-amber-100 text-amber-800";
  }
  if (normalized.includes("cancelled") || normalized.includes("failed")) {
    return "bg-red-100 text-red-800";
  }
  return "bg-gray-100 text-gray-700";
}

export default function OrderDetailView({ id }: { id: string }) {
  const [role, setRole] = React.useState<string | null>(null);
  const [order, setOrder] = React.useState<OrderDetails | null>(null);
  const [offering, setOffering] = React.useState<Offering | null>(null);
  const [warehouses, setWarehouses] = React.useState<Record<string, Warehouse>>(
    {},
  );
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setRole(sessionStorage.getItem("smartfm.role"));
  }, []);

  React.useEffect(() => {
    let cancelled = false;

    async function loadOrderData() {
      setLoading(true);
      setError(null);
      try {
        // 1. Fetch main order details
        const orderData = await apiFetch<OrderDetails>(`/api/orders/${id}`);
        if (cancelled) return;
        setOrder(orderData);

        // 2. Fetch associated offering details
        if (orderData.offeringId) {
          const offeringData = await apiFetch<Offering>(
            `/api/master-data/offerings/${orderData.offeringId}`,
          );
          if (!cancelled) setOffering(offeringData);
        }

        // 3. Fetch unique warehouses used across shipments
        const warehouseIds = Array.from(
          new Set(
            orderData.shipments
              .map((s) => s.warehouseId)
              .filter((w): w is string => Boolean(w)),
          ),
        );

        if (warehouseIds.length > 0) {
          const warehouseResults = await Promise.all(
            warehouseIds.map((warehouseId) =>
              apiFetch<Warehouse>(`/api/master-data/warehouses/${warehouseId}`),
            ),
          );
          if (cancelled) return;

          const warehouseMap: Record<string, Warehouse> = {};
          warehouseResults.forEach((w) => {
            warehouseMap[w.id] = w;
          });
          setWarehouses(warehouseMap);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadOrderData();
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <div className="max-w-6xl mx-auto my-8 px-4">
      {/* Role Permission Warning */}
      {role !== "customer" && role !== "staff" && (
        <div className="mb-6 p-4 bg-amber-50 text-amber-900 text-sm flex items-center justify-between  ">
          <span>
            Please switch to a Customer or Staff role to perform administrative
            actions.
          </span>
          <Link href="/" className="font-medium underline hover:text-amber-700">
            Go to Role Picker
          </Link>
        </div>
      )}

      {/* Clean Page Header */}
      <div className="pb-6 mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b-2 border-black">
        <div>
          <Link
            href="/orders"
            className="text-xs font-medium text-gray-500 hover:text-black mb-1 inline-block"
          >
            ← Back to orders
          </Link>
          <div className="flex items-center gap-3 mt-1">
            <h1 className="text-2xl sm:text-3xl font-heading font-semibold text-gray-900">
              Order Detail
            </h1>
            {order && (
              <span className="font-mono text-xs font-medium bg-primary text-gray-600 px-2.5 py-1 rounded">
                #{order.id}
              </span>
            )}
          </div>
        </div>

        {order && (
          <div className="flex items-center gap-2">
            <span
              className={`text-xs bg-tertiary font-medium px-3 py-1 rounded-full ${getStatusChipClass(
                order.status,
              )}`}
            >
              {order.status}
            </span>
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="p-12 text-center space-y-3">
          <div className="inline-block w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-gray-500">
            Loading order details...
          </p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-6 bg-red-50 text-red-900   space-y-3">
          <h3 className="font-semibold text-base">Failed to load order</h3>
          <p className="text-sm">{error}</p>
          <div className="pt-1">
            <Link
              href="/orders"
              className="text-xs font-medium underline hover:text-red-700"
            >
              Back to orders
            </Link>
          </div>
        </div>
      )}

      {/* Main Content Layout (4 - 8 Grid) */}
      {!loading && !error && order && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN (4/12): Overview & Offering */}
          <div className="lg:col-span-4 space-y-6">
            {/* Overview Section */}
            <div className="bg-gray-50/80 p-6   space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
                Order Summary
              </h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">Order ID</span>
                  <span className="font-mono font-medium text-gray-900">
                    {order.id}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">
                    Total Weight
                  </span>
                  <span className="font-medium text-gray-900">
                    {order.orderWeightKg} kg
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">Created At</span>
                  <span className="text-gray-900 font-medium text-right">
                    {formatDate(order.createdAt)}
                  </span>
                </div>
              </div>
            </div>

            {/* Service Offering Section */}
            {offering && (
              <div className="bg-gray-50/80 p-6   space-y-3">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
                  Service Offering
                </h2>
                <div className="space-y-1">
                  <p className="text-base font-semibold text-gray-900">
                    {offering.name}
                  </p>
                  <div className="flex justify-between items-center text-sm pt-2">
                    <span className="text-gray-500 font-medium">
                      Base Price
                    </span>
                    <span className="font-medium text-gray-900">
                      {offering.basePrice}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN (8/12): Cargo & Shipments */}
          <div className="lg:col-span-8 space-y-8">
            {/* SECTION 1: Cargo Containers */}
            <div className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
                Cargo Items ({order.cargoes.length})
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 text-xs font-medium text-gray-500">
                      <th className="pb-3 pr-4">Description</th>
                      <th className="pb-3 px-4 text-right">Weight (kg)</th>
                      <th className="pb-3 px-4 text-right">Volume (cbm)</th>
                      <th className="pb-3 pl-4 text-center">Hazardous</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {order.cargoes.map((cargo) => (
                      <tr key={cargo.id} className="hover:bg-gray-50/50">
                        <td className="py-3 pr-4 font-medium text-gray-900">
                          {cargo.description}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-gray-600">
                          {cargo.weightKg}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-gray-600">
                          {cargo.volumeCbm ?? "-"}
                        </td>
                        <td className="py-3 pl-4 text-center">
                          {cargo.isHazardous ?
                            <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                              Yes
                            </span>
                          : <span className="bg-gray-100 text-gray-600 text-xs font-medium px-2.5 py-0.5 rounded-full">
                              No
                            </span>
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SECTION 2: Shipments */}
            <div className="space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
                Shipments ({order.shipments.length})
              </h2>

              <div className="space-y-4">
                {order.shipments.map((shipment) => {
                  const warehouse =
                    shipment.warehouseId ?
                      warehouses[shipment.warehouseId]
                    : null;

                  return (
                    <div
                      key={shipment.id}
                      className="bg-gray-50/80 p-6   space-y-4"
                    >
                      {/* Status Chip & Date */}
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`text-xs font-medium px-3 py-1 rounded-full ${getStatusChipClass(
                            shipment.status,
                          )}`}
                        >
                          {shipment.status}
                        </span>
                        <span className="text-xs text-gray-400 font-medium">
                          {formatDate(shipment.createdAt)}
                        </span>
                      </div>

                      {/* Route Details */}
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-xs font-medium text-gray-400 block">
                            Pickup
                          </span>
                          <p className="font-medium text-gray-900">
                            {shipment.pickupAddress}
                          </p>
                        </div>

                        <div>
                          <span className="text-xs font-medium text-gray-400 block">
                            Delivery
                          </span>
                          <p className="font-medium text-gray-900">
                            {shipment.deliveryAddress}
                          </p>
                        </div>

                        {warehouse && (
                          <div className="pt-1">
                            <span className="text-xs font-medium text-gray-400 block">
                              Staging Warehouse
                            </span>
                            <p className="font-medium text-gray-700">
                              {warehouse.name} ({warehouse.address})
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Map Link Action */}
                      <div className="pt-2">
                        <Link
                          href={`/map?origin=${encodeURIComponent(
                            shipment.pickupAddress,
                          )}&destination=${encodeURIComponent(
                            shipment.deliveryAddress,
                          )}`}
                          className="text-xs font-medium text-gray-700 hover:text-black underline"
                        >
                          See Map →
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
