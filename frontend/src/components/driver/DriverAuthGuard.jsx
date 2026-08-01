"use client";

import React, { useEffect, useState } from "react";
import DriverLoginForm from "./DriverLoginForm";
import DriverHeader from "./DriverHeader";
import AppFooter from "@/components/AppFooter";

export default function DriverAuthGuard({ children }) {
  const [driverId, setDriverId] = useState(null);
  const [driverInfo, setDriverInfo] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    function checkSession() {
      if (typeof window !== "undefined") {
        const storedId = sessionStorage.getItem("smartfm.driverId");
        const storedInfo = sessionStorage.getItem("smartfm.driverInfo");

        if (storedId) {
          setDriverId(storedId);
          if (storedInfo) {
            try {
              setDriverInfo(JSON.parse(storedInfo));
            } catch {
              setDriverInfo(null);
            }
          }
        } else {
          setDriverId(null);
          setDriverInfo(null);
        }
      }
      setCheckingAuth(false);
    }

    checkSession();
  }, []);

  const handleLoginSuccess = (driver) => {
    setDriverId(driver.id);
    setDriverInfo(driver);
  };

  const handleSignOut = () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("smartfm.driverId");
      sessionStorage.removeItem("smartfm.driverEmail");
      sessionStorage.removeItem("smartfm.driverInfo");
    }
    setDriverId(null);
    setDriverInfo(null);
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <p className="text-xs text-gray-500 font-mono animate-pulse">
          Checking Driver Authentication Session...
        </p>
      </div>
    );
  }

  // If driver is not signed in, show driver login screen
  if (!driverId) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <DriverHeader />
        <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
          <DriverLoginForm onLoginSuccess={handleLoginSuccess} />
        </div>
        <AppFooter />
      </div>
    );
  }

  // Render children, passing driver context and sign out handler
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <DriverHeader driverId={driverId} driverInfo={driverInfo} onSignOut={handleSignOut} />
      <div className="flex-1 flex flex-col">
        {typeof children === "function" ? children({ driverId, driverInfo, handleSignOut }) : children}
      </div>
      <AppFooter />
    </div>
  );
}
