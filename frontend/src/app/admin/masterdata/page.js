"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { apiFetch } from "@/lib/api";

import MasterDataKpiCards from "@/components/admin/MasterDataKpiCards";
import BranchTable from "@/components/admin/BranchTable";
import WarehouseTable from "@/components/admin/WarehouseTable";
import EmployeeTable from "@/components/admin/EmployeeTable";
import VehicleTable from "@/components/admin/VehicleTable";
import OfferingTable from "@/components/admin/OfferingTable";
import MasterDataModal from "@/components/admin/MasterDataModal";
import DeleteConfirmModal from "@/components/admin/DeleteConfirmModal";

export default function AdminMasterDataPage() {
  const [role, setRole] = useState(null);
  const [activeTab, setActiveTab] = useState("branches");

  // Data states
  const [branches, setBranches] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [offerings, setOfferings] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState("");
  const [editingItem, setEditingItem] = useState(null);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState(null);
  const [deleteConfirmType, setDeleteConfirmType] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [branchForm, setBranchForm] = useState({ name: "", city: "" });
  const [warehouseForm, setWarehouseForm] = useState({ name: "", address: "", branchId: "", capacityKg: "" });
  const [employeeForm, setEmployeeForm] = useState({
    employeeRole: "Driver",
    name: "",
    email: "",
    branchId: "",
    licenseNumber: "",
    department: "",
  });
  const [vehicleForm, setVehicleForm] = useState({ registrationNumber: "", branchId: "", vehicleClass: "Light", status: "Available" });
  const [offeringForm, setOfferingForm] = useState({
    name: "",
    description: "",
    basePrice: "",
    maxWeightKg: "",
    maxVolumeCbm: "",
    vehicleClass: "Light",
  });

  useEffect(() => {
    setRole(sessionStorage.getItem("smartfm.role"));
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [branchesData, warehousesData, employeesData, vehiclesData, offeringsData] = await Promise.all([
        apiFetch("/api/master-data/branches"),
        apiFetch("/api/master-data/warehouses"),
        apiFetch("/api/master-data/employees"),
        apiFetch("/api/master-data/vehicles"),
        apiFetch("/api/master-data/offerings"),
      ]);
      setBranches(branchesData || []);
      setWarehouses(warehousesData || []);
      setEmployees(employeesData || []);
      setVehicles(vehiclesData || []);
      setOfferings(offeringsData || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const branchMap = useMemo(() => {
    const map = {};
    branches.forEach((b) => {
      map[b.id] = b.name;
    });
    return map;
  }, [branches]);

  const showNotification = (msg, isError = false) => {
    if (isError) {
      setActionError(msg);
      setTimeout(() => setActionError(null), 5000);
    } else {
      setActionSuccess(msg);
      setTimeout(() => setActionSuccess(null), 4000);
    }
  };

  // --- Modal Launchers ---
  const openCreateBranchModal = () => {
    setBranchForm({ name: "", city: "" });
    setEditingItem(null);
    setModalType("createBranch");
    setModalOpen(true);
  };

  const openEditBranchModal = (branch) => {
    setEditingItem(branch);
    setBranchForm({ name: branch.name, city: branch.city });
    setModalType("editBranch");
    setModalOpen(true);
  };

  const openCreateWarehouseModal = () => {
    setWarehouseForm({ name: "", address: "", branchId: branches[0]?.id || "", capacityKg: 10000 });
    setEditingItem(null);
    setModalType("createWarehouse");
    setModalOpen(true);
  };

  const openEditWarehouseModal = (wh) => {
    setEditingItem(wh);
    setWarehouseForm({ name: wh.name, address: wh.address, branchId: wh.branchId, capacityKg: wh.capacityKg });
    setModalType("editWarehouse");
    setModalOpen(true);
  };

  const openCreateEmployeeModal = () => {
    setEmployeeForm({
      employeeRole: "Driver",
      name: "",
      email: "",
      branchId: branches[0]?.id || "",
      licenseNumber: "",
      department: "Operations",
    });
    setEditingItem(null);
    setModalType("createEmployee");
    setModalOpen(true);
  };

  const openEditEmployeeModal = (emp) => {
    setEditingItem(emp);
    setEmployeeForm({
      employeeRole: emp.type || "Driver",
      name: emp.name,
      email: emp.email,
      branchId: emp.branchId,
      licenseNumber: emp.licenseNumber || "",
      department: emp.department || "",
    });
    setModalType("editEmployee");
    setModalOpen(true);
  };

  const openCreateVehicleModal = () => {
    setVehicleForm({ registrationNumber: "", branchId: branches[0]?.id || "", vehicleClass: "Light", status: "Available" });
    setEditingItem(null);
    setModalType("createVehicle");
    setModalOpen(true);
  };

  const openEditVehicleStatusModal = (veh) => {
    setEditingItem(veh);
    setVehicleForm({ registrationNumber: veh.registrationNumber, branchId: veh.branchId, vehicleClass: veh.vehicleClass, status: veh.currentStatus });
    setModalType("editVehicleStatus");
    setModalOpen(true);
  };

  const openCreateOfferingModal = () => {
    setOfferingForm({
      name: "",
      description: "",
      basePrice: 150000,
      maxWeightKg: 1000,
      maxVolumeCbm: 3,
      vehicleClass: "Light",
    });
    setEditingItem(null);
    setModalType("createOffering");
    setModalOpen(true);
  };

  const openEditOfferingModal = (off) => {
    setEditingItem(off);
    setOfferingForm({
      name: off.name,
      description: off.description,
      basePrice: off.basePrice,
      maxWeightKg: off.maxWeightKg,
      maxVolumeCbm: off.maxVolumeCbm,
      vehicleClass: off.vehicleClass,
    });
    setModalType("editOffering");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingItem(null);
    setModalType("");
  };

  // --- Form Handlers ---
  const handleSaveBranch = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (modalType === "createBranch") {
        await apiFetch("/api/master-data/branches", {
          method: "POST",
          body: JSON.stringify({ name: branchForm.name.trim(), city: branchForm.city.trim() }),
        });
        showNotification("Branch created successfully.");
      } else {
        await apiFetch(`/api/master-data/branches/${editingItem.id}`, {
          method: "PUT",
          body: JSON.stringify({ name: branchForm.name.trim(), city: branchForm.city.trim() }),
        });
        showNotification("Branch updated successfully.");
      }
      closeModal();
      await fetchAllData();
    } catch (err) {
      showNotification(err.message, true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveWarehouse = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (modalType === "createWarehouse") {
        await apiFetch("/api/master-data/warehouses", {
          method: "POST",
          body: JSON.stringify({
            name: warehouseForm.name.trim(),
            address: warehouseForm.address.trim(),
            branchId: warehouseForm.branchId,
            capacityKg: parseFloat(warehouseForm.capacityKg),
          }),
        });
        showNotification("Warehouse created successfully.");
      } else {
        await apiFetch(`/api/master-data/warehouses/${editingItem.id}`, {
          method: "PUT",
          body: JSON.stringify({
            name: warehouseForm.name.trim(),
            address: warehouseForm.address.trim(),
          }),
        });
        showNotification("Warehouse details updated successfully.");
      }
      closeModal();
      await fetchAllData();
    } catch (err) {
      showNotification(err.message, true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveEmployee = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (modalType === "createEmployee") {
        let endpoint = "/api/master-data/employees/drivers";
        let bodyData = {
          name: employeeForm.name.trim(),
          email: employeeForm.email.trim(),
          branchId: employeeForm.branchId,
        };

        if (employeeForm.employeeRole === "Driver") {
          endpoint = "/api/master-data/employees/drivers";
          bodyData.licenseNumber = employeeForm.licenseNumber.trim();
        } else if (employeeForm.employeeRole === "Staff") {
          endpoint = "/api/master-data/employees/staff";
          bodyData.department = employeeForm.department.trim();
        } else if (employeeForm.employeeRole === "Manager") {
          endpoint = "/api/master-data/employees/managers";
        }

        await apiFetch(endpoint, {
          method: "POST",
          body: JSON.stringify(bodyData),
        });
        showNotification(`${employeeForm.employeeRole} created successfully.`);
      } else {
        await apiFetch(`/api/master-data/employees/${editingItem.id}`, {
          method: "PUT",
          body: JSON.stringify({
            name: employeeForm.name.trim(),
            email: employeeForm.email.trim(),
          }),
        });
        showNotification("Employee contact info updated successfully.");
      }
      closeModal();
      await fetchAllData();
    } catch (err) {
      showNotification(err.message, true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveVehicle = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (modalType === "createVehicle") {
        await apiFetch("/api/master-data/vehicles", {
          method: "POST",
          body: JSON.stringify({
            registrationNumber: vehicleForm.registrationNumber.trim(),
            branchId: vehicleForm.branchId,
            vehicleClass: vehicleForm.vehicleClass,
          }),
        });
        showNotification("Vehicle registered successfully.");
      } else {
        await apiFetch(`/api/master-data/vehicles/${editingItem.id}/status`, {
          method: "PUT",
          body: JSON.stringify({
            status: vehicleForm.status,
          }),
        });
        showNotification("Vehicle status updated successfully.");
      }
      closeModal();
      await fetchAllData();
    } catch (err) {
      showNotification(err.message, true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveOffering = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (modalType === "createOffering") {
        await apiFetch("/api/master-data/offerings", {
          method: "POST",
          body: JSON.stringify({
            name: offeringForm.name.trim(),
            description: offeringForm.description.trim(),
            basePrice: parseFloat(offeringForm.basePrice),
            maxWeightKg: parseFloat(offeringForm.maxWeightKg),
            maxVolumeCbm: parseFloat(offeringForm.maxVolumeCbm),
            vehicleClass: offeringForm.vehicleClass,
          }),
        });
        showNotification("Service offering created successfully.");
      } else {
        await apiFetch(`/api/master-data/offerings/${editingItem.id}`, {
          method: "PUT",
          body: JSON.stringify({
            description: offeringForm.description.trim(),
            basePrice: parseFloat(offeringForm.basePrice),
            maxWeightKg: parseFloat(offeringForm.maxWeightKg),
            maxVolumeCbm: parseFloat(offeringForm.maxVolumeCbm),
          }),
        });
        showNotification("Service offering updated successfully.");
      }
      closeModal();
      await fetchAllData();
    } catch (err) {
      showNotification(err.message, true);
    } finally {
      setSubmitting(false);
    }
  };

  // --- Delete Handler ---
  const confirmDelete = (item, domainType) => {
    setDeleteConfirmItem(item);
    setDeleteConfirmType(domainType);
  };

  const handleDelete = async () => {
    if (!deleteConfirmItem || !deleteConfirmType) return;
    setSubmitting(true);
    try {
      const endpoint = `/api/master-data/${deleteConfirmType}/${deleteConfirmItem.id}`;
      await apiFetch(endpoint, { method: "DELETE" });
      showNotification("Deleted successfully from database.");
      setDeleteConfirmItem(null);
      setDeleteConfirmType("");
      await fetchAllData();
    } catch (err) {
      showNotification(err.message, true);
    } finally {
      setSubmitting(false);
    }
  };

  // Search filter helper
  const filterList = (list, searchKeys) => {
    if (!searchTerm.trim()) return list;
    const term = searchTerm.toLowerCase();
    return list.filter((item) =>
      searchKeys.some((key) => {
        const val = item[key];
        return val && String(val).toLowerCase().includes(term);
      })
    );
  };

  return (
    <>
      {/* Main Container */}
      <main className="max-w-7xl mx-auto my-8 px-4 flex-1 w-full">
        {role !== "admin" && (
          <div className="mb-6 border-l-4 border-accent bg-tertiary text-accent p-4 text-sm flex items-center justify-between shadow-sm">
            <span>Notice: You are currently viewing as &quot;{role || "Unset"}&quot;. Please switch to <strong>Admin</strong> role for full administrative permissions.</span>
            <Link href="/" className="font-bold underline text-secondary hover:text-black">
              Go to Role Picker
            </Link>
          </div>
        )}

        {/* Action Banners */}
        {actionSuccess && (
          <div className="mb-6 p-4 bg-emerald-100 border border-emerald-400 text-emerald-800 text-sm font-semibold flex items-center justify-between">
            <span>✓ {actionSuccess}</span>
            <button onClick={() => setActionSuccess(null)} className="text-emerald-900 font-bold">&times;</button>
          </div>
        )}
        {actionError && (
          <div className="mb-6 p-4 bg-rose-100 border border-rose-400 text-rose-800 text-sm font-semibold flex items-center justify-between">
            <span>⚠ Error: {actionError}</span>
            <button onClick={() => setActionError(null)} className="text-rose-900 font-bold">&times;</button>
          </div>
        )}

        {/* Dashboard KPI Summary Cards */}
        <MasterDataKpiCards
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          branchCount={branches.length}
          warehouseCount={warehouses.length}
          employeeCount={employees.length}
          vehicleCount={vehicles.length}
          offeringCount={offerings.length}
        />

        {/* Tab Navigation Toolbar */}
        <div className="bg-white border border-gray-300 p-4 mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex gap-2 border-b md:border-b-0 border-gray-200 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
            {[
              { id: "branches", label: "Branches" },
              { id: "warehouses", label: "Warehouses" },
              { id: "employees", label: "Employees" },
              { id: "vehicles", label: "Vehicles" },
              { id: "offerings", label: "Offerings" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSearchTerm("");
                }}
                className={`px-4 py-2 font-heading font-semibold text-sm transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-secondary text-white shadow-sm"
                    : "text-gray-600 hover:bg-tertiary hover:text-black"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border border-gray-300 p-2 text-sm w-full md:w-64 focus:outline-none focus:border-primary"
            />
            {activeTab === "branches" && <Button onClick={openCreateBranchModal}>+ Add Branch</Button>}
            {activeTab === "warehouses" && <Button onClick={openCreateWarehouseModal}>+ Add Warehouse</Button>}
            {activeTab === "employees" && <Button onClick={openCreateEmployeeModal}>+ Add Employee</Button>}
            {activeTab === "vehicles" && <Button onClick={openCreateVehicleModal}>+ Add Vehicle</Button>}
            {activeTab === "offerings" && <Button onClick={openCreateOfferingModal}>+ Add Offering</Button>}
          </div>
        </div>

        {/* Global Loading / Error */}
        {loading && (
          <div className="bg-white border border-gray-300 p-12 text-center text-gray-500">
            <div className="inline-block animate-spin text-secondary text-2xl mb-2">↻</div>
            <p className="font-heading">Loading master data from server...</p>
          </div>
        )}

        {error && !loading && (
          <div className="bg-white border border-rose-300 p-6 text-center text-rose-700">
            <p className="font-bold">Failed to load master data</p>
            <p className="text-sm text-gray-600 mb-4">{error}</p>
            <Button variant="outline" onClick={fetchAllData}>Retry Loading</Button>
          </div>
        )}

        {/* Tab Tables */}
        {!loading && !error && (
          <div className="bg-white border border-gray-300 shadow-sm overflow-hidden">
            {activeTab === "branches" && (
              <BranchTable
                branches={filterList(branches, ["name", "city"])}
                onEdit={openEditBranchModal}
                onDelete={confirmDelete}
              />
            )}
            {activeTab === "warehouses" && (
              <WarehouseTable
                warehouses={filterList(warehouses, ["name", "address"])}
                branchMap={branchMap}
                onEdit={openEditWarehouseModal}
                onDelete={confirmDelete}
              />
            )}
            {activeTab === "employees" && (
              <EmployeeTable
                employees={filterList(employees, ["name", "email", "type", "licenseNumber", "department"])}
                branchMap={branchMap}
                onEdit={openEditEmployeeModal}
                onDelete={confirmDelete}
              />
            )}
            {activeTab === "vehicles" && (
              <VehicleTable
                vehicles={filterList(vehicles, ["registrationNumber", "vehicleClass", "currentStatus"])}
                branchMap={branchMap}
                onEditStatus={openEditVehicleStatusModal}
                onDelete={confirmDelete}
              />
            )}
            {activeTab === "offerings" && (
              <OfferingTable
                offerings={filterList(offerings, ["name", "description", "vehicleClass"])}
                onEdit={openEditOfferingModal}
                onDelete={confirmDelete}
              />
            )}
          </div>
        )}
      </main>

      {/* Form Modal */}
      <MasterDataModal
        isOpen={modalOpen}
        modalType={modalType}
        editingItem={editingItem}
        branches={branches}
        branchForm={branchForm}
        setBranchForm={setBranchForm}
        warehouseForm={warehouseForm}
        setWarehouseForm={setWarehouseForm}
        employeeForm={employeeForm}
        setEmployeeForm={setEmployeeForm}
        vehicleForm={vehicleForm}
        setVehicleForm={setVehicleForm}
        offeringForm={offeringForm}
        setOfferingForm={setOfferingForm}
        onClose={closeModal}
        onSubmitBranch={handleSaveBranch}
        onSubmitWarehouse={handleSaveWarehouse}
        onSubmitEmployee={handleSaveEmployee}
        onSubmitVehicle={handleSaveVehicle}
        onSubmitOffering={handleSaveOffering}
        submitting={submitting}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        deleteConfirmItem={deleteConfirmItem}
        deleteConfirmType={deleteConfirmType}
        onCancel={() => setDeleteConfirmItem(null)}
        onDelete={handleDelete}
        submitting={submitting}
      />
    </>
  );
}
