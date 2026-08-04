"use client";

import React, { useState, useEffect, useRef } from "react";
import RouteMap from "@/components/RouteMap";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import { apiFetch } from "@/lib/api";

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
  const hasLoadedPickupwarehouses = useRef(false);

  const [pickupOptions, setPickupOptions] = useState([]);
  const [pickupWarehouseId, setPickupWarehouseId] = useState("");
  const [pickup, setPickup] = useState({
    address: "",
    ward: "",
    street: "",
  });

  const [delivery, setDelivery] = useState({
    address: "Hà Nội",
    ward: "",
    street: "",
  });
  const [deliveryPin, setDeliveryPin] = useState(null);

  useEffect(() => {
    if (hasLoadedPickupwarehouses.current) return;
    hasLoadedPickupwarehouses.current = true;

    async function loadPickupwarehouses() {
      try {
        const data = await apiFetch("/api/master-data/warehouses");
        const warehouses = data || [];
        setPickupOptions(warehouses);

        if (warehouses.length > 0) {
          const firstWarehouse = warehouses[0];
          const initialPickup = {
            address: firstWarehouse.address || "",
            ward: "",
            street: "",
          };
          setPickupWarehouseId(firstWarehouse.id);
          setPickup(initialPickup);
          onChange("pickupAddress", combineAddress(initialPickup));
        }
      } catch {
        setPickupOptions([]);
      }
    }

    loadPickupwarehouses();
  }, [onChange]);

  const combineAddress = (addr) => {
    const parts = [
      addr.street.trim(),
      addr.ward.trim(),
      addr.address.trim(),
      "Việt Nam",
    ].filter((p) => p.length > 0);
    return parts.join(", ");
  };

  const handlePickupWarehouseChange = (WarehouseId) => {
    const selectedWarehouse = pickupOptions.find(
      (Warehouse) => Warehouse.id === WarehouseId,
    );
    if (!selectedWarehouse) return;

    const updated = {
      address: selectedWarehouse.address || "",
      ward: "",
      street: "",
    };

    setPickupWarehouseId(WarehouseId);
    setPickup(updated);
    onChange("pickupAddress", combineAddress(updated));
  };

  const handleDeliveryChange = (field, value) => {
    const updated = { ...delivery, [field]: value };
    setDelivery(updated);
    setDeliveryPin(null);
    onChange("deliveryAddress", combineAddress(updated));
  };

  const handleDeliverySuggestionSelected = (picked) => {
    const components = picked.address || {};
    const ward =
      components.suburb ||
      components.quarter ||
      components.village ||
      components.city_district ||
      "";
    const city = components.city || components.town || components.state || "";

    const updated = {
      ...delivery,
      ward: ward || delivery.ward,
      address: city || delivery.address,
    };

    setDelivery(updated);
    setDeliveryPin(picked);
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
                Pickup Warehouse
              </label>
              <select
                value={pickupWarehouseId}
                onChange={(e) => handlePickupWarehouseChange(e.target.value)}
                className="w-full border border-gray-300 p-2.5 text-sm focus:border-primary focus:outline-none bg-white"
              >
                {pickupOptions.length === 0 ?
                  <option value="">Loading pickup locations...</option>
                : pickupOptions.map((Warehouse) => (
                    <option key={Warehouse.id} value={Warehouse.id}>
                      {Warehouse.name} — {Warehouse.address}
                    </option>
                  ))
                }
              </select>
            </div>

            <div className="rounded border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
              <div className="font-semibold text-gray-900">
                Selected pickup point
              </div>
              <div className="text-gray-600 mt-1">
                {pickup.address || "No Warehouse selected"}
              </div>
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
                address / Province
              </label>
              <input
                type="text"
                list="cities-list"
                placeholder="e.g. Hà Nội"
                value={delivery.address}
                onChange={(e) =>
                  handleDeliveryChange("address", e.target.value)
                }
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
              <AddressAutocomplete
                placeholder="e.g. 12 Xuân Diệu, Ngõ 4"
                value={delivery.street}
                onInputChange={(value) => handleDeliveryChange("street", value)}
                onSelect={handleDeliverySuggestionSelected}
                buildQuery={(streetText) =>
                  combineAddress({ ...delivery, street: streetText })
                }
              />
              <p className="text-xs text-gray-500 mt-1">
                Start typing to see matching addresses and drop a pinpoint.
              </p>
            </div>
          </div>
        </div>

        <datalist id="cities-list">
          {CITIES.map((address) => (
            <option key={address} value={address} />
          ))}
        </datalist>
      </div>

      <div className="lg:col-span-7 ">
        <RouteMap
          originAddress={orderData.pickupAddress || "Hà Nội"}
          destinationAddress={orderData.deliveryAddress || "Hà Nội"}
          destinationCoordinates={deliveryPin}
          heightClassName="h-[540px]"
        />
      </div>
    </div>
  );
}
