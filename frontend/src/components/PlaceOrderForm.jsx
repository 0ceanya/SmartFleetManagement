"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import OfferingCard from "@/components/OfferingCard";
import CargoForm from "@/components/CargoForm";
import Button from "@/components/ui/Button";
import { apiFetch } from "@/lib/api";

const defaultCargoItems = [
  { description: "Cargo 1 - Fresh Produce Pallet", weightKg: 250, volumeCbm: 1.2, isHazardous: false },
];

function totalWeight(cargoItems) {
  return cargoItems.reduce((sum, c) => sum + (Number(c.weightKg) || 0), 0);
}

export default function PlaceOrderForm() {
  const router = useRouter();

  const [offerings, setOfferings] = useState([]);
  const [offeringsLoading, setOfferingsLoading] = useState(true);
  const [offeringsError, setOfferingsError] = useState(null);
  const [selectedOfferingId, setSelectedOfferingId] = useState(null);

  const [orderData, setOrderData] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    pickupAddress: "",
    deliveryAddress: "",
    cargoItems: defaultCargoItems,
    orderWeightKg: totalWeight(defaultCargoItems),
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    async function loadOfferings() {
      setOfferingsLoading(true);
      setOfferingsError(null);
      try {
        const data = await apiFetch("/api/master-data/offerings");
        setOfferings(data || []);
        if (data && data.length > 0) setSelectedOfferingId(data[0].id);
      } catch (err) {
        setOfferingsError(err.message);
      } finally {
        setOfferingsLoading(false);
      }
    }
    loadOfferings();
  }, []);

  const handleFieldChange = (field, value) => {
    setOrderData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setSubmitError(null);

    if (!orderData.customerName.trim() || !orderData.customerEmail.trim() || !orderData.customerPhone.trim()) {
      setSubmitError("Customer name, email, and phone are required.");
      return;
    }
    if (!selectedOfferingId) {
      setSubmitError("Select an offering.");
      return;
    }
    if (!orderData.pickupAddress.trim() || !orderData.deliveryAddress.trim()) {
      setSubmitError("Pickup and delivery addresses are required.");
      return;
    }

    setSubmitting(true);
    try {
      const order = await apiFetch("/api/orders", {
        method: "POST",
        body: JSON.stringify({
          customerName: orderData.customerName,
          customerEmail: orderData.customerEmail,
          customerPhone: orderData.customerPhone,
          offeringId: selectedOfferingId,
          pickupAddress: orderData.pickupAddress,
          deliveryAddress: orderData.deliveryAddress,
          orderWeightKg: orderData.orderWeightKg || null,
          cargoItems: orderData.cargoItems.map((c) => ({
            description: c.description,
            weightKg: Number(c.weightKg) || 0,
            volumeCbm: c.volumeCbm || null,
            isHazardous: !!c.isHazardous,
          })),
        }),
      });
      router.push(`/orders/${order.id}`);
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const displayOfferings = offerings.map((o) => ({
    id: o.id,
    name: o.name,
    description: o.description,
    tag: o.vehicleClass,
    estimatedTime: `${o.vehicleClass} vehicle`,
    basePrice: `$${o.basePrice} / trip`,
  }));

  return (
    <div>
      <Header />
      <div className="max-w-4xl mx-auto my-8">
        <h1 className="font-heading text-secondary mb-6">Step 1 of 3</h1>
        <h1 className="text-3xl font-heading text-secondary mb-2">
          Choose your preferred offering
        </h1>
        <p className="text-sm text-gray-500 mb-5">
          Please select the shipping option that best fits your needs.
        </p>

        {offeringsLoading && <p className="text-sm text-gray-500 mb-6">Loading offerings...</p>}
        {offeringsError && (
          <p className="text-sm text-accent mb-6">Failed to load offerings: {offeringsError}</p>
        )}

        {!offeringsLoading && !offeringsError && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {displayOfferings.map((item) => (
              <OfferingCard
                key={item.id}
                offering={item}
                isSelected={selectedOfferingId === item.id}
                onSelect={(id) => setSelectedOfferingId(id)}
              />
            ))}
          </div>
        )}

        <h1 className="text-3xl font-heading text-secondary mb-2">Customer Details</h1>
        <div className="bg-white p-6 mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Name</label>
            <input
              type="text"
              value={orderData.customerName}
              onChange={(e) => handleFieldChange("customerName", e.target.value)}
              className="w-full border border-gray-300 p-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Email</label>
            <input
              type="email"
              value={orderData.customerEmail}
              onChange={(e) => handleFieldChange("customerEmail", e.target.value)}
              className="w-full border border-gray-300 p-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Phone</label>
            <input
              type="text"
              value={orderData.customerPhone}
              onChange={(e) => handleFieldChange("customerPhone", e.target.value)}
              className="w-full border border-gray-300 p-2 text-sm"
            />
          </div>
        </div>

        <h1 className="text-3xl font-heading text-secondary mb-2">
          Route &amp; Cargo Specifications
        </h1>
        <p className="text-sm text-gray-500 mb-5">
          Enter route and cargo details for supermarket replenishment.
        </p>
        <div className="mb-6">
          <CargoForm orderData={orderData} onChange={handleFieldChange} />
        </div>

        {submitError && <p className="text-sm text-accent mb-4">{submitError}</p>}

        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={() => router.push("/")}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Placing Order..." : "Continue"}
          </Button>
        </div>
      </div>
    </div>
  );
}
