"use client";

import React, { useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { apiFetch } from "@/lib/api";

function formatDate(iso) {
  if (!iso) return "-";
  return new Date(iso).toLocaleString();
}

function statusClasses(status) {
  switch (status) {
    case "Fulfilled":
      return "bg-emerald-100 text-emerald-800";
    case "Cancelled":
      return "bg-rose-100 text-rose-800";
    case "Active":
      return "bg-indigo-100 text-indigo-800";
    case "Approved":
      return "bg-sky-100 text-sky-800";
    default:
      return "bg-amber-100 text-amber-800";
  }
}

export default function MyOrdersPage() {
  const [email, setEmail] = useState("");
  const [orders, setOrders] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchedEmail, setSearchedEmail] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      setError("Enter the email you used when placing your order.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch(`/api/orders?customerEmail=${encodeURIComponent(trimmed)}`);
      setOrders(data || []);
      setSearchedEmail(trimmed);
    } catch (err) {
      setError(err.message);
      setOrders(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto my-8 px-4 w-full">
      <h1 className="text-3xl font-heading text-secondary mb-2">My Orders</h1>
      <p className="text-sm text-gray-500 mb-6">
        Enter the email address you used when placing an order to track it or see completed orders.
      </p>

      <form onSubmit={handleSearch} className="bg-white p-6 mb-8 flex flex-col sm:flex-row gap-3 items-end">
        <div className="flex-1 w-full">
          <label className="block text-xs font-semibold text-gray-600 mb-1">Email</label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 text-sm"
          />
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? "Searching..." : "Find My Orders"}
        </Button>
      </form>

      {error && <p className="text-sm text-accent mb-4">{error}</p>}

      {orders !== null && (
        <div className="bg-white">
          <h2 className="font-bold text-sm text-secondary uppercase tracking-wider p-4 pb-0">
            Orders for {searchedEmail}
          </h2>

          {orders.length === 0 ? (
            <p className="text-sm text-gray-500 p-4">No orders found for this email.</p>
          ) : (
            <table className="w-full text-sm mt-2">
              <thead>
                <tr className="bg-tertiary text-left">
                  <th className="p-3 text-xs font-bold uppercase tracking-wider">Status</th>
                  <th className="p-3 text-xs font-bold uppercase tracking-wider">Order Weight</th>
                  <th className="p-3 text-xs font-bold uppercase tracking-wider">Placed At</th>
                  <th className="p-3 text-xs font-bold uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-t border-gray-200">
                    <td className="p-3">
                      <span className={`px-2 py-0.5 text-xs font-bold uppercase rounded ${statusClasses(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="p-3">{order.orderWeightKg} kg</td>
                    <td className="p-3">{formatDate(order.createdAt)}</td>
                    <td className="p-3 text-right">
                      <Link href={`/orders/${order.id}`} className="text-xs font-bold text-secondary hover:underline">
                        Track / View Details &rarr;
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
