"use client";

import React from "react";

export default function CustomerForm({ orderData, onChange }) {
  return (
    <div className="bg-white p-6 space-y-4">
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
          Customer Name *
        </label>
        <input
          type="text"
          placeholder="e.g. Nguyen Van A"
          value={orderData.customerName || ""}
          onChange={(e) => onChange("customerName", e.target.value)}
          className="w-full border border-gray-300 p-3 text-sm focus:border-primary focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
            Email Address *
          </label>
          <input
            type="email"
            placeholder="name@company.com"
            value={orderData.customerEmail || ""}
            onChange={(e) => onChange("customerEmail", e.target.value)}
            className="w-full border border-gray-300 p-3 text-sm focus:border-primary focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
            Phone Number *
          </label>
          <input
            type="tel"
            placeholder="+84 90 123 4567"
            value={orderData.customerPhone || ""}
            onChange={(e) => onChange("customerPhone", e.target.value)}
            className="w-full border border-gray-300 p-3 text-sm focus:border-primary focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
}
