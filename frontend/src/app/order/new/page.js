"use client";

import React, { useState } from "react";
import Header from "@/components/Header";
import OfferingCard from "@/components/OfferingCard";
import CargoForm from "@/components/CargoForm";
import Button from "@/components/ui/Button";

const mockOfferings = [
  {
    id: "off-1",
    name: "Supermarket Chain - Standard",
    tag: "Popular",
    description:
      "Ideal for scheduled replenishments delivered across multiple retail store locations during business hours.",
    estimatedTime: "24 - 48 hours",
    basePrice: "$1,200 / trip",
  },
  {
    id: "off-2",
    name: "Cold Chain & Preserve - Express",
    tag: "Specialized",
    description:
      "Refrigerated transport for perishable goods and fresh produce with prioritized dock unloading.",
    estimatedTime: "8 - 12 hours",
    basePrice: "$2,500 / trip",
  },
  {
    id: "off-3",
    name: "Bulk Consolidated - Saver",
    tag: "Cost-Optimized",
    description:
      "Consolidated freight for regional distribution warehouses. Flexible dispatch based on fleet schedule.",
    estimatedTime: "3 - 5 days",
    basePrice: "$850 / trip",
  },
];

export default function OrderPage() {
  const [selectedOfferingId, setSelectedOfferingId] = useState("off-1");

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {mockOfferings.map((item) => (
            <OfferingCard
              key={item.id}
              offering={item}
              isSelected={selectedOfferingId === item.id}
              onSelect={(id) => setSelectedOfferingId(id)}
            />
          ))}
        </div>
        <h1 className="text-3xl font-heading text-secondary mb-2">
          Route & Cargo Specifications
        </h1>
        <p className="text-sm text-gray-500 mb-5">
          Enter route and cargo details for supermarket replenishment.
        </p>
        <div className="mb-6">
          <CargoForm
            orderData={{}}
            onChange={(field, value) => {
              console.log(`Field: ${field}, Value: ${value}`);
            }}
          />
        </div>
        <div className="flex justify-end gap-4">
          <Button variant="outline">Cancel</Button>
          <Button>Continue</Button>
        </div>
      </div>
    </div>
  );
}
