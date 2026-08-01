"use client";

import React, { useState } from "react";
import Button from "@/components/ui/Button";
import { apiFetch } from "@/lib/api";

function endOfDayIso(dateStr) {
  const d = new Date(dateStr);
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}

function startOfDayIso(dateStr) {
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export const METRICS = [
  { key: "totalAssignments", label: "Total Assignments" },
  { key: "activeVehicles", label: "Active Vehicles" },
  { key: "incidentCount", label: "Incident Count" },
  { key: "totalCargoWeightKg", label: "Total Cargo Weight" },
  { key: "revenue", label: "Revenue" },
];

const emptyForm = { reportType: "", from: "", to: "", branchId: "" };

export default function ReportBuilderPanel({ branches, visibleMetrics, onToggleMetric, onReportGenerated }) {
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(null);

  const handleFormChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setSubmitError(null);
    setSubmitSuccess(null);

    if (!form.reportType.trim() || !form.from || !form.to) {
      setFormError("Report type, from date, and to date are all required.");
      return;
    }
    if (new Date(form.to) < new Date(form.from)) {
      setFormError("To must not be earlier than From.");
      return;
    }

    setSubmitting(true);
    try {
      const report = await apiFetch("/api/reports", {
        method: "POST",
        body: JSON.stringify({
          reportType: form.reportType.trim(),
          from: startOfDayIso(form.from),
          to: endOfDayIso(form.to),
          branchId: form.branchId || null,
        }),
      });
      setSubmitSuccess("Report generated successfully.");
      onReportGenerated(report);
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="block text-xs font-semibold text-gray-600 mb-1">Report Type</label>
          <input
            type="text"
            placeholder="e.g. FleetUtilization"
            value={form.reportType}
            onChange={(e) => handleFormChange("reportType", e.target.value)}
            className="w-full border border-gray-300 p-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">From</label>
          <input
            type="date"
            value={form.from}
            onChange={(e) => handleFormChange("from", e.target.value)}
            className="w-full border border-gray-300 p-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">To</label>
          <input
            type="date"
            value={form.to}
            onChange={(e) => handleFormChange("to", e.target.value)}
            className="w-full border border-gray-300 p-2 text-sm"
          />
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-semibold text-gray-600 mb-1">Branch (optional)</label>
          <select
            value={form.branchId}
            onChange={(e) => handleFormChange("branchId", e.target.value)}
            className="w-full border border-gray-300 p-2 text-sm bg-white"
          >
            <option value="">All Branches (fleet-wide)</option>
            {(branches || []).map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <span className="block text-xs font-semibold text-gray-600 mb-1">Visible Metrics</span>
        <div className="flex flex-wrap gap-3">
          {METRICS.map((m) => (
            <label key={m.key} className="flex items-center gap-1.5 text-xs text-gray-700">
              <input
                type="checkbox"
                checked={visibleMetrics.includes(m.key)}
                onChange={() => onToggleMetric(m.key)}
              />
              {m.label}
            </label>
          ))}
        </div>
      </div>

      <Button type="submit" disabled={submitting}>
        {submitting ? "Generating..." : "Generate Report"}
      </Button>

      {formError && <p className="text-sm text-accent">{formError}</p>}
      {submitError && <p className="text-sm text-accent">Failed to generate report: {submitError}</p>}
      {submitSuccess && <p className="text-sm text-secondary">{submitSuccess}</p>}
    </form>
  );
}
