import React from "react";

export default function OfferingCard({ offering, isSelected, onSelect }) {
  return (
    <div
      onClick={() => onSelect(offering.id)}
      className={`relative cursor-pointer border-2 p-5 transition-all duration-200 ${
        isSelected ?
          "border-primary bg-white"
        : " bg-white border-white hover:shadow-xl hover:border-primary hover:bg-tertiary"
      }`}
    >
      {isSelected && (
        <div className="absolute top-4 right-4 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white text-xs font-bold">
          ✓
        </div>
      )}

      {offering.tag && (
        <span className="bg-accent px-3 py-1.5 text-xs font-medium text-white mb-2 inline-block">
          {offering.tag}
        </span>
      )}

      <h3 className="text-xl font-heading text-black mb-2">{offering.name}</h3>

      <p className="text-xs text-gray-600 mb-4">{offering.description}</p>

      <div className="flex items-center justify-between border-t border-black pt-3 text-sm">
        <div>
          <span className="text-gray-400 block text-xs">Estimated Time</span>
          <span className="font-semibold text-gray-700">
            {offering.estimatedTime}
          </span>
        </div>
        <div className="text-right">
          <span className="text-gray-400 block text-xs">Base Shipping Fee</span>
          <span className="font-bold text-accent text-base">
            {offering.basePrice}
          </span>
        </div>
      </div>
    </div>
  );
}
