"use client";

import React, { useState } from "react";
import Button from "@/components/ui/Button";

const CATEGORIES = ["CargoDamage", "CargoMissing", "CustomerComplaint", "VehicleBreakdown", "Accident", "Other"];
const SEVERITIES = ["Critical", "High", "Medium", "Low"];

export default function ReportIncidentModal({ assignment, onClose, onSubmit, submitting, error }) {
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [severity, setSeverity] = useState("High");
  const [description, setDescription] = useState("");

  if (!assignment) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      shipmentId: assignment.shipmentIds?.[0] || assignment.id,
      description,
      severity,
      category,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border-2 border-black max-w-lg w-full p-6 shadow-2xl space-y-4">
        <div className="flex justify-between items-start border-b pb-3">
          <div>
            <h3 className="text-lg font-heading font-bold text-secondary">Report Incident</h3>
            <p className="text-xs text-gray-500 font-mono mt-0.5">Assignment ID: {assignment.id}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-black font-bold text-xs uppercase tracking-wider cursor-pointer"
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-gray-700 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border border-gray-300 p-2 font-medium bg-white"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">Severity Level</label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="w-full border border-gray-300 p-2 font-medium bg-white"
            >
              {SEVERITIES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">
              Description <span className="text-rose-600">*</span>
            </label>
            <textarea
              rows={4}
              required
              placeholder="Provide specific details about the incident..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-gray-300 p-2.5 font-sans focus:border-primary focus:outline-none"
            />
          </div>

          {error && (
            <p className="text-rose-600 font-bold bg-rose-50 p-2 border border-rose-200">{error}</p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-rose-600 hover:bg-rose-700 text-white font-heading font-bold text-xs px-5 py-2 cursor-pointer transition-colors disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit Incident"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
