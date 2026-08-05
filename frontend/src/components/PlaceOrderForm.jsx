"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import OfferingCard from "@/components/OfferingCard";
import CargoForm from "@/components/CargoForm";
import CustomerForm from "@/components/CustomerForm";
import AddressForm from "@/components/AddressForm";
import OrderSummaryCard from "@/components/OrderSummaryCard";
import Button from "@/components/ui/Button";
import { apiFetch } from "@/lib/api";

const VEHICLE_CLASS_ORDER = { Light: 0, Medium: 1, Heavy: 2 };

const defaultCargoItems = [
  {
    description: "Cargo 1",
    weightKg: 1,
    volumeCbm: 1,
    isHazardous: false,
  },
];

export default function PlaceOrderForm() {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [errorMsg, setErrorMsg] = useState(null);

  const [offerings, setOfferings] = useState([]);
  const [offeringsLoading, setOfferingsLoading] = useState(true);
  const [selectedOfferingId, setSelectedOfferingId] = useState(null);

  const [orderData, setOrderData] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    pickupAddress: "",
    deliveryAddress: "",
    cargoItems: defaultCargoItems,
    orderWeightKg: 250,
  });

  const [submitting, setSubmitting] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState(null);

  useEffect(() => {
    async function loadOfferings() {
      try {
        const data = await apiFetch("/api/master-data/offerings");
        const sorted = [...(data || [])].sort(
          (a, b) =>
            (VEHICLE_CLASS_ORDER[a.vehicleClass] ?? 99) -
            (VEHICLE_CLASS_ORDER[b.vehicleClass] ?? 99),
        );
        setOfferings(sorted);
        if (sorted.length > 0) setSelectedOfferingId(sorted[0].id);
      } catch (err) {
        setErrorMsg("Could not load offerings.");
      } finally {
        setOfferingsLoading(false);
      }
    }
    loadOfferings();
  }, []);

  const handleFieldChange = (field, value) => {
    setOrderData((prev) => ({ ...prev, [field]: value }));
    setErrorMsg(null);
  };

  const validateStep1 = () => {
    if (!selectedOfferingId) return "Please select a shipping offering.";
    if (!orderData.cargoItems || orderData.cargoItems.length === 0) {
      return "Please add at least one cargo container.";
    }
    for (let item of orderData.cargoItems) {
      if (!item.description || !item.weightKg || item.weightKg <= 0) {
        return "All cargo items must have a description and a valid weight (> 0 kg).";
      }
    }
    return null;
  };

  const validateStep2 = () => {
    if (!orderData.customerName.trim()) return "Customer name is required.";
    if (
      !orderData.customerEmail.trim() ||
      !orderData.customerEmail.includes("@")
    ) {
      return "Please enter a valid email address.";
    }
    if (!orderData.customerPhone.trim() || orderData.customerPhone.length < 8) {
      return "Please enter a valid phone number.";
    }
    return null;
  };

  const validateStep3 = () => {
    if (!orderData.pickupAddress.trim())
      return "Please complete the Pickup address fields.";
    if (!orderData.deliveryAddress.trim())
      return "Please complete the Delivery address fields.";
    return null;
  };

  const handleNextStep = () => {
    setErrorMsg(null);
    if (step === 1) {
      const err = validateStep1() || validateStep2() || validateStep3();
      if (err) return setErrorMsg(err);
      setStep(2);
    }
  };

  const handleSubmitOrder = async () => {
    setErrorMsg(null);
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

      setCreatedOrderId(order.id);
      setStep("success");
    } catch (err) {
      setErrorMsg(err.message || "Failed to place order. Please check again.");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedOfferingObj = offerings.find(
    (o) => o.id === selectedOfferingId,
  );

  // --- SUCCESS SCREEN ---
  if (step === "success") {
    return (
      <div className="w-full mx-auto p-8 bg-white text-center space-y-6">
        <div className="w-16 h-16 bg-accent text-white rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
          ✓
        </div>
        <div>
          <h2 className="text-3xl font-heading text-accent mb-2">
            Order Placed Successfully!
          </h2>
          <p className="text-sm text-gray-600">
            Your logistics replenishment order has been scheduled.
          </p>
          <p className="text-xs font-mono bg-gray-100 p-2 mt-3 border border-gray-300 inline-block">
            Order Reference ID:{" "}
            <span className="font-bold">{createdOrderId}</span>
          </p>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={() => {
              setStep(1);
              setCreatedOrderId(null);
            }}
          >
            + Place New Order
          </Button>
          <Button onClick={() => router.push(`/orders/${createdOrderId}`)}>
            View Placed Order
          </Button>
        </div>
      </div>
    );
  }

  // --- MAIN 4-STEP WIZARD ---
  return (
    <div className="w-full max-w-6xl mx-auto my-8 px-4">
      {/* Step Header */}
      <div className="border-b-2 border-black pb-4 mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-heading text-black mt-1">
            Order Information
          </h1>
        </div>
        <div className="text-xs font-semibold text-gray-500">
          {step === 1 && "Next: Review Order"}
        </div>
      </div>

      {errorMsg && (
        <div className="mb-6 border-l-4 border-accent bg-accent/10 p-4 text-sm font-medium text-black">
          {errorMsg}
        </div>
      )}

      {/* STEP 1: Offering & Cargo */}
      {step === 1 && (
        <div className="w-full space-y-8">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700 mb-3">
              1. Choose Preferred Offering
            </h2>
            {offeringsLoading ?
              <p className="text-sm text-gray-500">Loading offerings...</p>
            : <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {offerings.map((o) => (
                  <OfferingCard
                    key={o.id}
                    offering={{
                      id: o.id,
                      name: o.name,
                      description: o.description,
                      tag: o.vehicleClass,
                      estimatedTime: `${o.vehicleClass} vehicle`,
                      basePrice: `$${o.basePrice} / trip`,
                    }}
                    isSelected={selectedOfferingId === o.id}
                    onSelect={(id) => {
                      setSelectedOfferingId(id);
                      setErrorMsg(null);
                    }}
                  />
                ))}
              </div>
            }
          </div>

          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700 mb-3">
              2. Cargo Specifications
            </h2>
            <CargoForm orderData={orderData} onChange={handleFieldChange} />
          </div>

          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700 mb-3">
              3. Customer Information
            </h2>
            <div className="w-full">
              <CustomerForm
                orderData={orderData}
                onChange={handleFieldChange}
              />
            </div>
          </div>

          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700 mb-3">
              4. Route & Address Details
            </h2>
            <div className="w-full">
              <AddressForm orderData={orderData} onChange={handleFieldChange} />
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: Order Review & Final Summary */}
      {step === 2 && (
        <div className="w-full max-w-4xl mx-auto space-y-6">
          <div className="border-l-4 border-primary bg-primary/10 p-4 text-sm text-black">
            Please review your supermarket replenishment details below before
            placing the order.
          </div>
          <OrderSummaryCard
            orderData={orderData}
            selectedOffering={selectedOfferingObj}
          />
        </div>
      )}

      {/* Footer Buttons */}
      <div className="flex justify-between items-center mt-5 pt-4">
        <div>
          <Button variant="outline" onClick={() => router.push("/")}>
            Cancel
          </Button>
        </div>

        <div className="flex gap-3">
          {step > 1 && (
            <Button
              variant="outline"
              onClick={() => {
                setErrorMsg(null);
                setStep(step - 1);
              }}
            >
              ← Back
            </Button>
          )}

          {step < 2 ?
            <Button onClick={handleNextStep}>Continue →</Button>
          : <Button
              onClick={handleSubmitOrder}
              disabled={submitting}
              className="bg-accent text-white font-bold hover:bg-red-700"
            >
              {submitting ? "Placing Order..." : "Confirm & Place Order"}
            </Button>
          }
        </div>
      </div>
    </div>
  );
}
