"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import RouteMap from "@/components/RouteMap";

function MapContent() {
  const router = useRouter();
  const params = useSearchParams();
  const origin = params.get("origin");
  const destination = params.get("destination");
  const originLabel = params.get("originLabel") || "Pickup";
  const destinationLabel = params.get("destinationLabel") || "Delivery";

  if (!origin || !destination) {
    return (
      <div className="flex items-center justify-center h-screen text-sm text-gray-500">
        No route info available.
      </div>
    );
  }

  return (
    <div className="relative w-full h-[100dvh]">
      <RouteMap
        originAddress={origin}
        destinationAddress={destination}
        originLabel={originLabel}
        destinationLabel={destinationLabel}
        heightClassName="h-[100dvh]"
      />
      <button
        onClick={() => router.back()}
        className="fixed top-4 left-4 z-50 bg-white border border-gray-300 shadow px-3 py-1.5 text-xs font-bold hover:bg-gray-50 cursor-pointer"
      >
        ← Back
      </button>
    </div>
  );
}

export default function MapPage() {
  return (
    <Suspense>
      <MapContent />
    </Suspense>
  );
}
