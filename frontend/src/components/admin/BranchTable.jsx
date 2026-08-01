import React from "react";

export default function BranchTable({ branches, onEdit, onDelete, readOnly = false }) {
  if (!branches || branches.length === 0) {
    return <p className="p-6 text-sm text-gray-500 text-center">No branches found.</p>;
  }

  return (
    <table className="w-full text-sm text-left">
      <thead className="bg-gray-100 text-gray-600 text-xs font-bold uppercase border-b border-gray-200">
        <tr>
          <th className="p-3">Branch Name</th>
          <th className="p-3">City</th>
          <th className="p-3">ID</th>
          {!readOnly && <th className="p-3 text-right">Actions</th>}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200">
        {branches.map((branch) => (
          <tr key={branch.id} className="hover:bg-slate-50 transition-colors">
            <td className="p-3 font-semibold text-black">{branch.name}</td>
            <td className="p-3 text-gray-700">{branch.city}</td>
            <td className="p-3 font-mono text-xs text-gray-400">{branch.id}</td>
            {!readOnly && (
              <td className="p-3 text-right space-x-2">
                <button
                  type="button"
                  onClick={() => onEdit(branch)}
                  className="text-xs font-bold text-secondary hover:underline cursor-pointer"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(branch, "branches")}
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
