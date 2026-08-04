"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { startOfDayIso, endOfDayIso, getCurrentMonthRange } from "@/lib/dateRange";
import WidgetCard from "./WidgetCard";

function buildQuery(params) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") qs.set(key, value);
  });
  return qs.toString();
}

function buildFilterSignature(params) {
  return Object.entries(params)
    .map(([key, value]) => `${key}=${value ?? ""}`)
    .sort()
    .join("&");
}

export default function EntityPageLayout({
  title,
  fetchEndpoint,
  data: externalData,
  loading: externalLoading,
  error: externalError,
  onFilterChange,
  cards = [],
  showSearch = true,
  searchPlaceholder = "Search...",
  searchParam = "search",
  filters = [],
  columns,
  rowsAccessor,
  detailRoute,
  rowKey,
  bodySlot,
  refreshKey,
}) {
  const router = useRouter();
  const defaultRange = useMemo(() => getCurrentMonthRange(), []);
  const [from, setFrom] = useState(defaultRange.from);
  const [to, setTo] = useState(defaultRange.to);
  const [search, setSearch] = useState("");
  const [filterValues, setFilterValues] = useState({});
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState("asc");
  const lastFilterSignatureRef = useRef(null);

  const [internalData, setInternalData] = useState(null);
  const [internalResolvedKey, setInternalResolvedKey] = useState(null);
  const [internalError, setInternalError] = useState(null);

  const filterParams = useMemo(() => {
    const params = {
      from: from ? startOfDayIso(from) : undefined,
      to: to ? endOfDayIso(to) : undefined,
      [searchParam]: search || undefined,
    };
    filters.forEach((f) => {
      params[f.param] = filterValues[f.param] || undefined;
    });
    return params;
  }, [from, to, search, filterValues, filters, searchParam]);

  const filterSignature = useMemo(() => buildFilterSignature(filterParams), [filterParams]);

  useEffect(() => {
    if (lastFilterSignatureRef.current === filterSignature) return;
    lastFilterSignatureRef.current = filterSignature;
    onFilterChange?.(filterParams);
  }, [filterParams, filterSignature, onFilterChange]);

  const requestKey = useMemo(() => buildQuery(filterParams), [filterParams]);

  useEffect(() => {
    if (!fetchEndpoint) return;
    let cancelled = false;
    apiFetch(`${fetchEndpoint}${requestKey ? `?${requestKey}` : ""}`)
      .then((result) => {
        if (!cancelled) {
          setInternalData(result);
          setInternalResolvedKey(requestKey);
          setInternalError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setInternalError(err.message);
          setInternalResolvedKey(requestKey);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [fetchEndpoint, requestKey, refreshKey]);

  const data = fetchEndpoint ? internalData : externalData;
  const loading = fetchEndpoint ? internalResolvedKey !== requestKey : externalLoading;
  const error = fetchEndpoint
    ? internalResolvedKey === requestKey
      ? internalError
      : null
    : externalError;

  const rows = useMemo(() => {
    const rawRows = data && rowsAccessor ? rowsAccessor(data) : [];
    if (!sortKey) return rawRows;
    const sorted = [...rawRows].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (av === bv) return 0;
      return av > bv ? 1 : -1;
    });
    return sortDir === "asc" ? sorted : sorted.reverse();
  }, [data, rowsAccessor, sortKey, sortDir]);

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-heading text-2xl font-bold text-secondary">{title}</h1>

      {cards.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {cards.map((card) => {
            const value = data ? card.accessor(data) : "-";
            const isDanger = card.danger?.(value);
            return (
              <div
                key={card.key}
                className={`bg-white border p-4 shadow-sm ${isDanger ? "border-accent" : "border-gray-300"}`}
              >
                <p className="text-xs uppercase tracking-wider text-gray-500 font-bold">{card.label}</p>
                <p className={`text-2xl font-heading font-bold mt-1 ${isDanger ? "text-accent" : "text-secondary"}`}>
                  {value ?? "-"}
                </p>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {showSearch && (
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-300 p-1.5 text-sm w-56"
          />
        )}
        {filters.map((f) => (
          <select
            key={f.key}
            value={filterValues[f.param] || ""}
            onChange={(e) => setFilterValues((v) => ({ ...v, [f.param]: e.target.value }))}
            className="border border-gray-300 p-1.5 text-sm bg-white"
          >
            <option value="">{f.label}</option>
            {f.options.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        ))}
        <label className="text-xs text-gray-500 ml-2">From</label>
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="border border-gray-300 p-1.5 text-sm" />
        <label className="text-xs text-gray-500">To</label>
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="border border-gray-300 p-1.5 text-sm" />
      </div>

      {loading && <p className="text-sm text-gray-500">Loading...</p>}
      {error && <p className="text-sm text-accent">Failed to load: {error}</p>}

      {!loading && !error && bodySlot && bodySlot(data, { filterParams })}

      {!loading && !error && !bodySlot && columns && (
        <WidgetCard title={`${rows.length} result${rows.length === 1 ? "" : "s"}`}>
          <div className="overflow-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-100 text-gray-600 text-xs font-bold uppercase border-b border-gray-200 sticky top-0">
                <tr>
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className="p-2 cursor-pointer select-none"
                      onClick={() => toggleSort(col.key)}
                    >
                      {col.label}
                      {sortKey === col.key ? (sortDir === "asc" ? " ▲" : " ▼") : ""}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {rows.map((row) => (
                  <tr
                    key={rowKey ? rowKey(row) : row.id}
                    className={`hover:bg-slate-50 transition-colors ${detailRoute ? "cursor-pointer" : ""}`}
                    onClick={detailRoute ? () => router.push(detailRoute(row)) : undefined}
                  >
                    {columns.map((col) => (
                      <td key={col.key} className="p-2 text-gray-700">
                        {col.render ? col.render(row) : row[col.key]}
                      </td>
                    ))}
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={columns.length} className="p-4 text-center text-gray-500">
                      No results match the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </WidgetCard>
      )}
    </div>
  );
}
