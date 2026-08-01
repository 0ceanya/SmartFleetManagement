import React from "react";

export default function EmployeeTable({ employees, branchMap, onEdit, onDelete, readOnly = false }) {
  if (!employees || employees.length === 0) {
    return <p className="p-6 text-sm text-gray-500 text-center">No employees found.</p>;
  }

  return (
    <table className="w-full text-sm text-left">
      <thead className="bg-gray-100 text-gray-600 text-xs font-bold uppercase border-b border-gray-200">
        <tr>
          <th className="p-3">Role Type</th>
          <th className="p-3">Name</th>
          <th className="p-3">Email</th>
          <th className="p-3">Branch</th>
          <th className="p-3">License / Department</th>
          {!readOnly && <th className="p-3 text-right">Actions</th>}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200">
        {employees.map((emp) => (
          <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
            <td className="p-3">
              <span
                className={`px-2 py-0.5 text-xs font-bold uppercase rounded ${
                  emp.type === "Driver"
                    ? "bg-blue-100 text-blue-800"
                    : emp.type === "Manager"
                    ? "bg-purple-100 text-purple-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {emp.type}
              </span>
            </td>
            <td className="p-3 font-semibold text-black">{emp.name}</td>
            <td className="p-3 text-gray-700 font-mono text-xs">{emp.email}</td>
            <td className="p-3 text-gray-700">{branchMap[emp.branchId] || emp.branchId}</td>
            <td className="p-3 text-gray-600 text-xs font-mono">
              {emp.licenseNumber ? `Lic: ${emp.licenseNumber}` : emp.department ? `Dept: ${emp.department}` : "-"}
            </td>
            {!readOnly && (
              <td className="p-3 text-right space-x-2">
                <button
                  type="button"
                  onClick={() => onEdit(emp)}
                  className="text-xs font-bold text-secondary hover:underline cursor-pointer"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(emp, "employees")}
                  className="text-xs font-bold text-accent hover:underline cursor-pointer"
                >
                  Delete
                </button>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
