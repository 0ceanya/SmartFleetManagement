"use client";

import React, { useState } from "react";
import Button from "@/components/ui/Button";
import { apiFetch } from "@/lib/api";
import { startOfDayIso, endOfDayIso, formatDate } from "@/lib/dateRange";
import EntityPageLayout from "@/components/manager/EntityPageLayout";

const emptyForm = { reportType: "", from: "", to: "" };

export default function ManagerReportsPage() {
  const [range, setRange] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [expandedKey, setExpandedKey] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(null);

  const cards = [
    { key: "total", label: "Reports Generated (Total)", accessor: (data) => data.length },
    {
      key: "period",
      label: "Generated This Period",
      accessor: (data) =>
        range
          ? data.filter((r) => new Date(r.generatedAt) >= new Date(range.from) && new Date(r.generatedAt) <= new Date(range.to)).length
          : "-",
    },
    {
      key: "last",
      label: "Last Generated Date",
      accessor: (data) => {
        const latest = data.reduce((l, r) => (!l || new Date(r.generatedAt) > new Date(l) ? r.generatedAt : l), null);
        return formatDate(latest);
      },
    },
  ];

  const handleFormChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

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
      await apiFetch("/api/reports/generate", {
        method: "POST",
        body: JSON.stringify({
          reportType: form.reportType.trim(),
          from: startOfDayIso(form.from),
          to: endOfDayIso(form.to),
        }),
      });
      setSubmitSuccess("Report generated successfully.");
      setForm(emptyForm);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <EntityPageLayout
      title="Reports"
      fetchEndpoint="/api/reports"
      onFilterChange={setRange}
      cards={cards}
      showSearch={false}
      refreshKey={refreshKey}
      bodySlot={(reports) => (
        <div className="flex flex-col gap-4">
          <div className="bg-white border border-gray-300 p-6">
            <h2 className="font-bold text-sm text-secondary uppercase tracking-wider mb-4">Generate Report</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="md:col-span-2">
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
                <input type="date" value={form.from} onChange={(e) => handleFormChange("from", e.target.value)} className="w-full border border-gray-300 p-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">To</label>
                <input type="date" value={form.to} onChange={(e) => handleFormChange("to", e.target.value)} className="w-full border border-gray-300 p-2 text-sm" />
              </div>
              <div className="md:col-span-4">
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Generating..." : "Generate Report"}
                </Button>
              </div>
            </form>
            {formError && <p className="text-sm text-accent mt-3">{formError}</p>}
            {submitError && <p className="text-sm text-accent mt-3">Failed to generate report: {submitError}</p>}
            {submitSuccess && <p className="text-sm text-secondary mt-3">{submitSuccess}</p>}
          </div>

          <div className="bg-white border border-gray-300">
            <h2 className="font-bold text-sm text-secondary uppercase tracking-wider p-4 pb-0">Past Reports</h2>
            {reports.length === 0 && <p className="text-sm text-gray-500 p-4">No reports generated yet.</p>}
            {reports.length > 0 && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-tertiary text-left">
                    <th className="p-3 text-xs font-bold uppercase tracking-wider">Report Type</th>
                    <th className="p-3 text-xs font-bold uppercase tracking-wider">From</th>
                    <th className="p-3 text-xs font-bold uppercase tracking-wider">To</th>
                    <th className="p-3 text-xs font-bold uppercase tracking-wider">Generated At</th>
                    <th className="p-3 text-xs font-bold uppercase tracking-wider">Actor</th>
                    <th className="p-3 text-xs font-bold uppercase tracking-wider"></th>
                  </tr>
                </thead>
                <tbody>
                  {[...reports].reverse().map((report) => {
                    const key = report.id;
                    const isExpanded = expandedKey === key;
                    return (
                      <React.Fragment key={key}>
                        <tr className="border-t border-gray-200">
                          <td className="p-3 font-medium">{report.reportType}</td>
                          <td className="p-3">{formatDate(report.from)}</td>
                          <td className="p-3">{formatDate(report.to)}</td>
                          <td className="p-3">{formatDate(report.generatedAt)}</td>
                          <td className="p-3">{report.actor}</td>
                          <td className="p-3 text-right">
                            <button
                              type="button"
                              onClick={() => setExpandedKey(isExpanded ? null : key)}
                              className="text-xs font-bold text-secondary hover:underline cursor-pointer"
                            >
                              {isExpanded ? "Hide" : "View"}
                            </button>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="border-t border-gray-200 bg-gray-50">
                            <td colSpan={6} className="p-3">
                              <pre className="whitespace-pre-wrap font-mono text-xs text-gray-800">{report.content}</pre>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    />
  );
}
