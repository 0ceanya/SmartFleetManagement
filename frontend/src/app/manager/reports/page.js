"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
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

function formatDate(iso) {
  if (!iso) return "-";
  return new Date(iso).toLocaleString();
}

function rowKey(report) {
  return `${report.reportType}-${report.generatedAt}`;
}

const emptyForm = { reportType: "", from: "", to: "" };

export default function ManagerReportsPage() {
  const [role, setRole] = useState(null);

  const [reports, setReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [reportsError, setReportsError] = useState(null);

  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(null);

  const [expandedKey, setExpandedKey] = useState(null);

  useEffect(() => {
    setRole(sessionStorage.getItem("smartfm.role"));
  }, []);

  const fetchReports = async () => {
    setLoadingReports(true);
    setReportsError(null);
    try {
      const data = await apiFetch("/api/reports");
      setReports(data || []);
    } catch (err) {
      setReportsError(err.message);
    } finally {
      setLoadingReports(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const totalReports = reports.length;

  const latestReportDate = reports.reduce((latest, r) => {
    if (!r.generatedAt) return latest;
    if (!latest) return r.generatedAt;
    return new Date(r.generatedAt) > new Date(latest) ? r.generatedAt : latest;
  }, null);

  const now = new Date();
  const reportsThisMonth = reports.filter((r) => {
    if (!r.generatedAt) return false;
    const d = new Date(r.generatedAt);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).length;

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
      await apiFetch("/api/reports", {
        method: "POST",
        body: JSON.stringify({
          reportType: form.reportType.trim(),
          from: startOfDayIso(form.from),
          to: endOfDayIso(form.to),
        }),
      });
      setSubmitSuccess("Report generated successfully.");
      setForm(emptyForm);
      await fetchReports();
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="max-w-5xl mx-auto my-8 px-4">
        {role !== "manager" && (
          <div className="mb-6 border border-accent bg-tertiary text-accent p-3 text-sm flex items-center justify-between">
            <span>Select Manager role first</span>
            <Link href="/" className="font-bold underline">
              Go to role picker
            </Link>
          </div>
        )}

        <h1 className="text-3xl font-heading text-secondary mb-6">Reports</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white border border-gray-200 p-4">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Total Reports Generated
            </span>
            <p className="text-2xl font-bold text-black">{totalReports}</p>
          </div>
          <div className="bg-white border border-gray-200 p-4">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Latest Report Date
            </span>
            <p className="text-2xl font-bold text-black">{formatDate(latestReportDate)}</p>
          </div>
          <div className="bg-white border border-gray-200 p-4">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Reports This Month
            </span>
            <p className="text-2xl font-bold text-black">{reportsThisMonth}</p>
          </div>
        </div>

        <div className="bg-white border border-gray-300 p-6 mb-8">
          <h2 className="font-bold text-sm text-secondary uppercase tracking-wider mb-4">
            Generate Report
          </h2>
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
          <h2 className="font-bold text-sm text-secondary uppercase tracking-wider p-4 pb-0">
            Past Reports
          </h2>

          {loadingReports && <p className="text-sm text-gray-500 p-4">Loading reports...</p>}

          {reportsError && (
            <p className="text-sm text-accent p-4">Failed to load reports: {reportsError}</p>
          )}

          {!loadingReports && !reportsError && reports.length === 0 && (
            <p className="text-sm text-gray-500 p-4">No reports generated yet.</p>
          )}

          {!loadingReports && !reportsError && reports.length > 0 && (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-tertiary text-left">
                  <th className="p-3 text-xs font-bold uppercase tracking-wider">Report Type</th>
                  <th className="p-3 text-xs font-bold uppercase tracking-wider">From</th>
                  <th className="p-3 text-xs font-bold uppercase tracking-wider">To</th>
                  <th className="p-3 text-xs font-bold uppercase tracking-wider">Generated At</th>
                  <th className="p-3 text-xs font-bold uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => {
                  const key = rowKey(report);
                  const isExpanded = expandedKey === key;
                  return (
                    <React.Fragment key={key}>
                      <tr className="border-t border-gray-200">
                        <td className="p-3 font-medium">{report.reportType}</td>
                        <td className="p-3">{formatDate(report.from)}</td>
                        <td className="p-3">{formatDate(report.to)}</td>
                        <td className="p-3">{formatDate(report.generatedAt)}</td>
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
                          <td colSpan={5} className="p-3">
                            <pre className="whitespace-pre-wrap font-mono text-xs text-gray-800">
                              {report.content}
                            </pre>
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
    </div>
  );
}
