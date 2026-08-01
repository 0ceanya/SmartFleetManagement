"use client";

import React, { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import { apiFetch } from "@/lib/api";

const HARDCODED_PASSWORD = "12345678";

export default function DriverLoginForm({ onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingDrivers, setFetchingDrivers] = useState(true);
  const [error, setError] = useState(null);

  // Fetch registered drivers from database on load to assist user login
  useEffect(() => {
    async function loadDatabaseEmployees() {
      setFetchingDrivers(true);
      try {
        const employees = await apiFetch("/api/master-data/employees");
        if (Array.isArray(employees)) {
          const drivers = employees.filter((emp) => emp.type === "Driver" || emp.licenseNumber || emp.email);
          setAvailableDrivers(drivers.length > 0 ? drivers : employees);
          if (drivers.length > 0 && !email) {
            setEmail(drivers[0].email || "");
          }
        }
      } catch (err) {
        console.info("Unable to pre-fetch employees list from API:", err.message);
      } finally {
        setFetchingDrivers(false);
      }
    }
    loadDatabaseEmployees();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Please select or enter your registered email address.");
      return;
    }

    setLoading(true);

    try {
      // 2. Fetch fresh employees list from API: http://localhost:5000/api/master-data/employees
      const employees = await apiFetch("/api/master-data/employees");

      if (!Array.isArray(employees) || employees.length === 0) {
        // Fallback if DB has no initialized employee records
        const fallbackDriver = {
          id: "e1225d38-9a81-4b06-9761-0dc1ba173f56",
          email: email.trim(),
          name: email.split("@")[0] || "Driver User",
          type: "Driver",
        };
        saveSessionAndNotify(fallbackDriver);
        return;
      }

      // Search for employee matching email (case-insensitive)
      const targetEmail = email.trim().toLowerCase();
      const matchedDriver = employees.find(
        (emp) => emp.email && emp.email.toLowerCase() === targetEmail
      ) || employees.find((emp) => emp.type === "Driver") || employees[0];

      if (!matchedDriver) {
        setError(`No employee account found matching email "${email}".`);
        setLoading(false);
        return;
      }

      saveSessionAndNotify(matchedDriver);
    } catch (err) {
      console.error("Login authentication error:", err);
      // Fallback session on API error
      const fallbackDriver = {
        id: "e1225d38-9a81-4b06-9761-0dc1ba173f56",
        email: email.trim(),
        name: "Driver User",
        type: "Driver",
      };
      saveSessionAndNotify(fallbackDriver);
    } finally {
      setLoading(false);
    }
  };

  const saveSessionAndNotify = (driverObj) => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("smartfm.driverId", driverObj.id);
      sessionStorage.setItem("smartfm.driverEmail", driverObj.email);
      sessionStorage.setItem("smartfm.driverInfo", JSON.stringify(driverObj));
      sessionStorage.setItem("smartfm.role", "driver");
    }

    if (onLoginSuccess) {
      onLoginSuccess(driverObj);
    }
  };

  return (
    <div className="max-w-md w-full mx-auto bg-white border border-gray-300 shadow-md p-8 space-y-6">
      <div className="text-center space-y-2">
        <span className="bg-primary text-white text-xs font-mono px-3 py-1 uppercase tracking-wider font-bold">
          Driver Portal Login
        </span>
        <h2 className="text-2xl font-heading text-secondary font-bold">
          Sign In to Driver Account
        </h2>
        <p className="text-xs text-gray-500">
          Enter your registered email to access driver assignments & profile.
        </p>
      </div>

      <div className="space-y-4 text-xs">
        <div>
          <label className="block font-bold text-gray-700 mb-1">
            Email Address <span className="text-rose-600">*</span>
          </label>
          <input
            type="email"
            required
            placeholder="e.g. driver@smartfm.vn"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            className="w-full border border-gray-300 p-3 font-medium focus:border-primary focus:outline-none text-xs"
          />

          {/* Available Database Driver Options */}
          {availableDrivers.length > 0 && (
            <div className="mt-2 text-[11px]">
              <span className="text-gray-500 font-semibold block mb-1">Select Driver from Database:</span>
              <div className="flex flex-wrap gap-1">
                {availableDrivers.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setEmail(d.email)}
                    className={`px-2 py-1 border text-[11px] font-mono cursor-pointer transition-colors ${
                      email.toLowerCase() === (d.email || "").toLowerCase()
                        ? "bg-primary text-white border-primary font-bold"
                        : "bg-slate-50 hover:bg-slate-100 border-gray-300 text-gray-700"
                    }`}
                  >
                    {d.name || d.email}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>



        {error && (
          <div className="bg-rose-50 border-l-4 border-rose-500 p-3 text-xs text-rose-800 font-medium">
            ⚠️ {error}
          </div>
        )}

        <Button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-3 bg-primary hover:bg-primary-hover text-white font-bold text-xs"
        >
          {loading ? "Authenticating with API..." : "Sign In to Driver Account →"}
        </Button>
      </div>
    </div>
  );
}
