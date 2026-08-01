"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

import WidgetCard from "@/components/manager/WidgetCard";
import ReportBuilderPanel, { METRICS } from "@/components/manager/ReportBuilderPanel";
import KpiCardsRow from "@/components/manager/KpiCardsRow";
import PastReportsList from "@/components/manager/PastReportsList";
import AssignmentsTrendChart from "@/components/manager/AssignmentsTrendChart";
import AssignmentsByBranchChart from "@/components/manager/AssignmentsByBranchChart";
import AssignmentsByDriverChart from "@/components/manager/AssignmentsByDriverChart";
import AssignmentBrowser from "@/components/manager/AssignmentBrowser";
import IncidentFeed from "@/components/manager/IncidentFeed";
import MasterDataBrowser from "@/components/manager/MasterDataBrowser";
import AuditLog from "@/components/manager/AuditLog";

export default function ManagerDashboardPage() {
  const [role, setRole] = useState(null);

  const [branches, setBranches] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [warehouses, setWarehouses] = useState([]);

  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [visibleMetrics, setVisibleMetrics] = useState(METRICS.map((m) => m.key));

  const [assignmentFilter, setAssignmentFilter] = useState({ vehicleId: null, driverId: null });

  useEffect(() => {
    setRole(sessionStorage.getItem("smartfm.role"));
  }, []);

  useEffect(() => {
    Promise.all([
      apiFetch("/api/master-data/branches"),
      apiFetch("/api/master-data/employees"),
      apiFetch("/api/master-data/vehicles"),
      apiFetch("/api/master-data/warehouses"),
    ])
      .then(([branchesData, employeesData, vehiclesData, warehousesData]) => {
        setBranches(branchesData || []);
        setEmployees(employeesData || []);
        setVehicles(vehiclesData || []);
        setWarehouses(warehousesData || []);
      })
      .catch(() => {});
  }, []);

  const fetchReports = async () => {
    try {
      const data = await apiFetch("/api/reports");
      setReports(data || []);
    } catch {
      setReports([]);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const branchMap = useMemo(() => {
    const map = {};
    branches.forEach((b) => { map[b.id] = b.name; });
    return map;
  }, [branches]);

  const driverMap = useMemo(() => {
    const map = {};
    employees.filter((e) => e.type === "Driver").forEach((d) => { map[d.id] = d.name; });
    return map;
  }, [employees]);

  const drivers = useMemo(() => employees.filter((e) => e.type === "Driver"), [employees]);

  const vehicleMap = useMemo(() => {
    const map = {};
    vehicles.forEach((v) => { map[v.id] = v; });
    return map;
  }, [vehicles]);

  const handleReportGenerated = (report) => {
    setSelectedReport(report);
    fetchReports();
  };

  const handleToggleMetric = (key) => {
    setVisibleMetrics((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };

  return (
    <>
      <main className="max-w-[1600px] mx-auto my-8 px-4 flex-1 w-full">
        {role !== "manager" && (
          <div className="mb-6 border-l-4 border-accent bg-tertiary text-accent p-4 text-sm flex items-center justify-between shadow-sm">
            <span>Notice: You are currently viewing as &quot;{role || "Unset"}&quot;. Please switch to <strong>Manager</strong> role for full access.</span>
            <Link href="/" className="font-bold underline text-secondary hover:text-black">
              Go to Role Picker
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
          <div className="md:col-span-2 xl:col-span-4">
            <WidgetCard title="KPI Overview">
              <KpiCardsRow report={selectedReport} visibleMetrics={visibleMetrics} />
            </WidgetCard>
          </div>

          <div className="md:col-span-2 xl:col-span-2 h-80">
            <WidgetCard title="Assignments Trend">
              <AssignmentsTrendChart report={selectedReport} />
            </WidgetCard>
          </div>
          <div className="md:col-span-1 xl:col-span-1 h-80">
            <WidgetCard title="Assignments by Branch">
              <AssignmentsByBranchChart report={selectedReport} branchMap={branchMap} />
            </WidgetCard>
          </div>
          <div className="md:col-span-1 xl:col-span-1 h-80">
            <WidgetCard title="Assignments by Driver">
              <AssignmentsByDriverChart report={selectedReport} driverMap={driverMap} />
            </WidgetCard>
          </div>

          <div className="md:col-span-2 xl:col-span-4 h-[28rem]">
            <WidgetCard title="Assignment Browser">
              <AssignmentBrowser
                assignmentFilter={assignmentFilter}
                onClearFilter={() => setAssignmentFilter({ vehicleId: null, driverId: null })}
                vehicleMap={vehicleMap}
                driverMap={driverMap}
              />
            </WidgetCard>
          </div>

          <div className="md:col-span-1 xl:col-span-2 h-96">
            <WidgetCard title="Incident Feed">
              <IncidentFeed vehicleMap={vehicleMap} branchMap={branchMap} onDrillDown={setAssignmentFilter} />
            </WidgetCard>
          </div>
          <div className="md:col-span-1 xl:col-span-2 h-96">
            <WidgetCard title="Master Data">
              <MasterDataBrowser
                branches={branches}
                vehicles={vehicles}
                drivers={drivers}
                warehouses={warehouses}
                branchMap={branchMap}
              />
            </WidgetCard>
          </div>

          <div className="md:col-span-2 xl:col-span-4 h-96">
            <WidgetCard title="Audit Log">
              <AuditLog />
            </WidgetCard>
          </div>

          <div className="md:col-span-1 xl:col-span-2 h-80">
            <WidgetCard
              title="Past Reports"
              action={
                <Link href="/manager/reports" className="text-xs font-bold text-secondary hover:underline whitespace-nowrap">
                  Full report history &rarr;
                </Link>
              }
            >
              <PastReportsList
                reports={reports}
                selectedReport={selectedReport}
                onSelectReport={setSelectedReport}
                branchMap={branchMap}
              />
            </WidgetCard>
          </div>
          <div className="md:col-span-1 xl:col-span-2">
            <WidgetCard
              title="Report Builder"
              action={
                <Link href="/manager/reports" className="text-xs font-bold text-secondary hover:underline whitespace-nowrap">
                  See detail &rarr;
                </Link>
              }
            >
              <ReportBuilderPanel
                branches={branches}
                visibleMetrics={visibleMetrics}
                onToggleMetric={handleToggleMetric}
                onReportGenerated={handleReportGenerated}
              />
            </WidgetCard>
          </div>
        </div>
      </main>
    </>
  );
}
