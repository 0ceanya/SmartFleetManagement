"use client";

export default function OrderSummaryCard({ orderData, selectedOffering }) {
  return (
    <div className="border-2 border-white bg-tertiary p-6 space-y-4">
      <div className="border-b border-gray-300 pb-3 flex justify-between items-center">
        <h3 className="font-heading text-lg text-black uppercase tracking-wider">
          Order Summary
        </h3>
        <span className="bg-black text-white text-xs px-2.5 py-1 font-bold">
          READY TO SUBMIT
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-xs text-gray-500 block uppercase font-semibold">
            Offering Service
          </span>
          <p className="font-bold text-black">
            {selectedOffering?.name || "Not Selected"}
          </p>
          <p className="text-xs text-accent font-semibold">
            {selectedOffering?.basePrice || ""}
          </p>
        </div>

        <div>
          <span className="text-xs text-gray-500 block uppercase font-semibold">
            Total Cargo Weight
          </span>
          <p className="font-bold text-black">
            {orderData.orderWeightKg?.toFixed(2) || 0} kg
          </p>
          <p className="text-xs text-gray-600">
            {orderData.cargoItems?.length || 0} container item(s)
          </p>
        </div>

        <div>
          <span className="text-xs text-gray-500 block uppercase font-semibold">
            Customer Contact
          </span>
          <p className="font-bold text-black">{orderData.customerName}</p>
          <p className="text-xs text-gray-600">
            {orderData.customerPhone} — {orderData.customerEmail}
          </p>
        </div>

        <div>
          <span className="text-xs text-gray-500 block uppercase font-semibold">
            Route Overview
          </span>
          <p className="text-xs text-gray-800">
            <span className="font-bold">From:</span> {orderData.pickupAddress}
          </p>
          <p className="text-xs text-gray-800 mt-1">
            <span className="font-bold">To:</span> {orderData.deliveryAddress}
          </p>
        </div>
      </div>
    </div>
  );
}
