"use client";

import React, { useState } from "react";
import Button from "@/components/ui/Button";

export default function DeclineAssignmentModal({ assignment, onClose, onSubmit, submitting, error }) {
  const [reason, setReason] = useState("");

  if (!assignment) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      shipmentId: assignment.shipmentIds?.[0] || assignment.id,
      description: reason,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border-2 border-black max-w-lg w-full p-6 shadow-2xl space-y-4">
        <div className="flex justify-between items-start border-b pb-3">
          <div>
            <h3 className="text-lg font-heading font-bold text-secondary">Decline Assignment</h3>
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

        <p className="text-xs text-gray-600">
          This assignment will be marked Rejected and returned to staff for reassignment to another driver.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-gray-700 mb-1">
              Reason <span className="text-rose-600">*</span>
            </label>
            <textarea
              rows={4}
              required
              placeholder="Why are you declining this assignment?"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
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
              {submitting ? "Submitting..." : "Confirm Decline"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
