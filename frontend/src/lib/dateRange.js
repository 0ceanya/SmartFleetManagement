export function startOfDayIso(dateStr) {
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export function endOfDayIso(dateStr) {
  const d = new Date(dateStr);
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}

function toInputDate(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function getCurrentMonthRange() {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  return { from: toInputDate(first), to: toInputDate(now) };
}

export function formatDate(iso) {
  if (!iso) return "-";
  return new Date(iso).toLocaleString();
}

export function formatDateOnly(iso) {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString();
}
