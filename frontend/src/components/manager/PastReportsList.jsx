import React from "react";

function formatDate(iso) {
  if (!iso) return "-";
  return new Date(iso).toLocaleString();
}

function rowKey(report) {
  return `${report.reportType}-${report.generatedAt}`;
}

export default function PastReportsList({ reports, selectedReport, onSelectReport, branchMap = {} }) {
  if (!reports || reports.length === 0) {
    return <p className="text-sm text-gray-500">No reports generated yet.</p>;
  }

  return (
    <table className="w-full text-sm text-left">
      <thead className="bg-gray-100 text-gray-600 text-xs font-bold uppercase border-b border-gray-200">
        <tr>
          <th className="p-2">Report Type</th>
          <th className="p-2">Branch</th>
          <th className="p-2">Generated At</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200">
        {reports.map((report) => {
          const key = rowKey(report);
          const isSelected = selectedReport && rowKey(selectedReport) === key;
          return (
            <tr
              key={key}
              onClick={() => onSelectReport(report)}
              className={`cursor-pointer hover:bg-slate-50 transition-colors ${isSelected ? "bg-tertiary" : ""}`}
            >
              <td className="p-2 font-medium">{report.reportType}</td>
              <td className="p-2 text-gray-600">{report.branchId ? branchMap[report.branchId] || report.branchId : "All"}</td>
              <td className="p-2 text-gray-600">{formatDate(report.generatedAt)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
