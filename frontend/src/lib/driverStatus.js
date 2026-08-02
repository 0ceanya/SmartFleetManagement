const STATUS_CHIP_CLASSES = {
  Pending: "bg-amber-500 text-white",
  Assigned: "bg-blue-600 text-white",
  Loaded: "bg-blue-600 text-white",
  Delivering: "bg-blue-600 text-white",
  Delivered: "bg-emerald-600 text-white",
  Rejected: "bg-rose-600 text-white",
};

export function getStatusChipClasses(status) {
  return STATUS_CHIP_CLASSES[status] || "bg-gray-500 text-white";
}
