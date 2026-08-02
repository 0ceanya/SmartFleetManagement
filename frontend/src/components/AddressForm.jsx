"use client";

import React, { useState, useEffect } from "react";
import RouteMap from "@/components/RouteMap";

const CITIES = [
  "Hà Nội",
  "TP. Hồ Chí Minh",
  "Đà Nẵng",
  "Hải Phòng",
  "Cần Thơ",
  "Bình Dương",
  "Đồng Nai",
];

export default function RouteAddressStep({ orderData, onChange }) {
  const [pickup, setPickup] = useState({
    city: "Hà Nội",
    ward: "",
    street: "",
  });

  const [delivery, setDelivery] = useState({
    city: "Hà Nội",
    ward: "",
    street: "",
  });

  const combineAddress = (addr) => {
    const parts = [
      addr.street.trim(),
      addr.ward.trim(),
      addr.city.trim(),
    ].filter((p) => p.length > 0);
    return parts.join(", ");
  };

  const handlePickupChange = (field, value) => {
    const updated = { ...pickup, [field]: value };
    setPickup(updated);
    onChange("pickupAddress", combineAddress(updated));
  };

  const handleDeliveryChange = (field, value) => {
    const updated = { ...delivery, [field]: value };
    setDelivery(updated);
    onChange("deliveryAddress", combineAddress(updated));
  };

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <div className="lg:col-span-5 space-y-6">
        {/* PICKUP BOX */}
        <div className="bg-white p-5 space-y-4">
          <div className="border-b border-gray-200 pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-accent">
              Origin Point
            </span>
            <h3 className="font-heading text-lg text-black mt-0.5">
              Pickup Address *
            </h3>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
                City / Province
              </label>
              <input
                type="text"
                list="cities-list"
                placeholder="e.g. Hà Nội"
                value={pickup.city}
                onChange={(e) => handlePickupChange("city", e.target.value)}
                className="w-full border border-gray-300 p-2.5 text-sm focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
                District & Ward
              </label>
              <input
                type="text"
                placeholder="e.g. Phường Hàng Bài, Hoàn Kiếm"
                value={pickup.ward}
                onChange={(e) => handlePickupChange("ward", e.target.value)}
                className="w-full border border-gray-300 p-2.5 text-sm focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
                Detailed Street Address
              </label>
              <input
                type="text"
                placeholder="e.g. 45 Trần Hưng Đạo, Tòa nhà A"
                value={pickup.street}
                onChange={(e) => handlePickupChange("street", e.target.value)}
                className="w-full border border-gray-300 p-2.5 text-sm focus:border-primary focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* DELIVERY BOX */}
        <div className="bg-white p-5 space-y-4">
          <div className="border-b border-gray-200 pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              Destination Point
            </span>
            <h3 className="font-heading text-lg text-black mt-0.5">
              Delivery Address *
            </h3>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
                City / Province
              </label>
              <input
                type="text"
                list="cities-list"
                placeholder="e.g. Hà Nội"
                value={delivery.city}
                onChange={(e) => handleDeliveryChange("city", e.target.value)}
                className="w-full border border-gray-300 p-2.5 text-sm focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
                District & Ward
              </label>
              <input
                type="text"
                placeholder="e.g. Phường Quảng An, Tây Hồ"
                value={delivery.ward}
                onChange={(e) => handleDeliveryChange("ward", e.target.value)}
                className="w-full border border-gray-300 p-2.5 text-sm focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
                Detailed Street Address
              </label>
              <input
                type="text"
                placeholder="e.g. 12 Xuân Diệu, Ngõ 4"
                value={delivery.street}
                onChange={(e) => handleDeliveryChange("street", e.target.value)}
                className="w-full border border-gray-300 p-2.5 text-sm focus:border-primary focus:outline-none"
              />
            </div>
          </div>
        </div>

        <datalist id="cities-list">
          {CITIES.map((city) => (
            <option key={city} value={city} />
          ))}
        </datalist>
      </div>

      <div className="lg:col-span-7 ">
        <RouteMap
          originAddress={orderData.pickupAddress || "Hà Nội"}
          destinationAddress={orderData.deliveryAddress || "Hà Nội"}
          heightClassName="h-[540px]"
        />
      </div>
    </div>
  );
}
