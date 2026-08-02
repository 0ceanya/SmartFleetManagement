"use client";

import React, { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

export default function LoadManifestChecklist({ shipmentId, onManifestChange }) {
  const [manifest, setManifest] = useState(null);
  const [loadedCargoIds, setLoadedCargoIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [starting, setStarting] = useState(false);

  const fetchManifest = async () => {
    if (!shipmentId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch(`/api/fleet/shipments/${shipmentId}/load-manifest`);
      setManifest(data);
      setLoadedCargoIds(data.loadedCargoIds || []);
      onManifestChange?.(data);
    } catch (err) {
      setError(err.message || "Failed to load cargo manifest.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchManifest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shipmentId]);

  const toggleItem = async (cargoId) => {
    const previous = loadedCargoIds;
    const next = previous.includes(cargoId)
      ? previous.filter((id) => id !== cargoId)
      : [...previous, cargoId];
    setLoadedCargoIds(next);
    try {
      const data = await apiFetch(`/api/fleet/shipments/${shipmentId}/load-manifest/loaded-items`, {
        method: "PUT",
        body: JSON.stringify({ loadedCargoIds: next }),
      });
      setManifest(data);
    } catch (err) {
      setError(err.message || "Failed to save loaded item.");
      setLoadedCargoIds(previous);
    }
  };

  const handleStart = async () => {
    setStarting(true);
    setError(null);
    try {
      const data = await apiFetch(`/api/fleet/shipments/${shipmentId}/load-manifest/start`, {
        method: "POST",
      });
      setManifest(data);
      onManifestChange?.(data);
    } catch (err) {
      setError(err.message || "Failed to start loading.");
    } finally {
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-300 p-6 shadow-xs text-xs text-gray-500">
        Loading cargo manifest...
      </div>
    );
  }

  if (!manifest) {
    return (
      <div className="bg-white border border-gray-300 p-6 shadow-xs text-xs text-rose-600">
        Warning: {error || "Cargo manifest unavailable."}
      </div>
    );
  }

  const allChecked = manifest.cargoIds.length > 0 && manifest.cargoIds.every((id) => loadedCargoIds.includes(id));

  return (
    <div className="bg-white border border-gray-300 p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b pb-3">
        <h2 className="text-lg font-heading text-secondary font-bold">Load Manifest</h2>
        {manifest.isPickupResolved && (
          <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 uppercase">Loaded</span>
        )}
      </div>

      {error && (
        <div className="bg-rose-50 border-l-4 border-rose-500 p-3 text-xs text-rose-800 font-medium">
          Warning: {error}
        </div>
      )}

      {manifest.cargoIds.length === 0 ? (
        <p className="text-xs text-gray-500">No cargo items recorded for this shipment.</p>
      ) : (
        <div className="space-y-2">
          {manifest.cargoIds.map((cargoId, index) => {
            const isLoaded = loadedCargoIds.includes(cargoId);
            return (
              <div
                key={cargoId}
                className="flex items-center gap-2 text-xs text-gray-700 border border-gray-200 p-2"
              >
                <label className="flex items-center gap-2 flex-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isLoaded}
                    onChange={() => toggleItem(cargoId)}
                    disabled={manifest.isPickupResolved}
                  />
                  {manifest.cargoDescriptions[index]}
                </label>
                {!isLoaded && !manifest.isPickupResolved && (
                  <button
                    type="button"
                    onClick={() => toggleItem(cargoId)}
                    aria-label="Scan QR to check off item"
                    title="Scan QR"
                    className="shrink-0 w-8 h-8 flex items-center justify-center bg-secondary text-white hover:bg-secondary-hover transition-colors cursor-pointer"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                      <path d="M3 7V4a1 1 0 0 1 1-1h3M17 3h3a1 1 0 0 1 1 1v3M21 17v3a1 1 0 0 1-1 1h-3M7 21H4a1 1 0 0 1-1-1v-3" />
                      <path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" />
                    </svg>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!manifest.isPickupResolved && (
        <button
          type="button"
          onClick={handleStart}
          disabled={!allChecked || starting}
          className="w-full bg-primary hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed text-white font-heading font-bold text-xs py-2.5 transition-colors cursor-pointer"
        >
          {starting ? "Starting..." : "Start"}
        </button>
      )}
    </div>
  );
}
