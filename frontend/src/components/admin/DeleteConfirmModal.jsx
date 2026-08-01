import React from "react";
import Button from "@/components/ui/Button";

export default function DeleteConfirmModal({ deleteConfirmItem, deleteConfirmType, onCancel, onDelete, submitting }) {
  if (!deleteConfirmItem) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white w-full max-w-md p-6 shadow-xl border border-rose-300 relative">
        <h3 className="font-heading font-bold text-xl text-rose-700 mb-2">Confirm Delete</h3>
        <p className="text-sm text-gray-700 mb-4">
          Are you sure you want to permanently delete this item from the database?
        </p>
        <div className="p-3 bg-gray-100 font-mono text-xs text-gray-800 mb-6 border border-gray-200">
          <p><strong>Domain:</strong> {deleteConfirmType}</p>
          <p><strong>Name/ID:</strong> {deleteConfirmItem.name || deleteConfirmItem.registrationNumber || deleteConfirmItem.id}</p>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
          <button
            type="button"
            onClick={onDelete}
            disabled={submitting}
            className="bg-rose-600 hover:bg-rose-700 text-white font-heading px-6 py-3 font-semibold text-sm transition-colors cursor-pointer disabled:opacity-50"
          >
            {submitting ? "Deleting..." : "Delete Permanently"}
          </button>
        </div>
      </div>
    </div>
  );
}
