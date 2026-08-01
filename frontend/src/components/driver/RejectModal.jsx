"use client";

import React, { useState } from "react";
import Button from "@/components/ui/Button";

export default function RejectModal({ assignment, onClose, onSubmit, submitting, error }) {
  const [incidentDescription, setIncidentDescription] = useState("");
  const [severity, setSeverity] = useState("High");

  if (!assignment) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      assignmentId: assignment.id,
      shipmentId: assignment.shipmentIds?.[0] || assignment.id,
      description: incidentDescription,
      severity,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border-2 border-black max-w-lg w-full p-6 shadow-2xl space-y-4">
        <div className="flex justify-between items-start border-b pb-3">
          <div>
            <h3 className="text-lg font-heading font-bold text-secondary">
              Reject Assignment / Report Issue
            </h3>
            <p className="text-xs text-gray-500 font-mono mt-0.5">
              Assignment ID: {assignment.id}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-black font-bold text-lg cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-gray-700 mb-1">
              Severity Level
            </label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="w-full border border-gray-300 p-2 font-medium bg-white"
            >
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">
              Rejection Reason / Incident Description <span className="text-rose-600">*</span>
            </label>
            <textarea
              rows={4}
              required
              placeholder="Provide specific details explaining your reason for rejecting this assignment..."
              value={incidentDescription}
              onChange={(e) => setIncidentDescription(e.target.value)}
              className="w-full border border-gray-300 p-2.5 font-sans focus:border-primary focus:outline-none"
            />
          </div>

          {error && (
            <p className="text-rose-600 font-bold bg-rose-50 p-2 border border-rose-200">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={submitting}
              className="text-xs py-2 px-4"
            >
              Cancel
            </Button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-rose-600 hover:bg-rose-700 text-white font-heading font-bold text-xs px-5 py-2 cursor-pointer transition-colors disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit Rejection"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
