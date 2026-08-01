import React from "react";
import Button from "@/components/ui/Button";

export default function MasterDataModal({
  isOpen,
  modalType,
  editingItem,
  branches,
  branchForm,
  setBranchForm,
  warehouseForm,
  setWarehouseForm,
  employeeForm,
  setEmployeeForm,
  vehicleForm,
  setVehicleForm,
  offeringForm,
  setOfferingForm,
  onClose,
  onSubmitBranch,
  onSubmitWarehouse,
  onSubmitEmployee,
  onSubmitVehicle,
  onSubmitOffering,
  submitting,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white w-full max-w-lg p-6 shadow-xl border border-gray-300 relative">
        <h3 className="font-heading font-bold text-xl text-secondary mb-4">
          {modalType === "createBranch" && "Create New Branch"}
          {modalType === "editBranch" && `Edit Branch: ${editingItem?.name}`}
          {modalType === "createWarehouse" && "Create New Warehouse"}
          {modalType === "editWarehouse" && `Edit Warehouse: ${editingItem?.name}`}
          {modalType === "createEmployee" && "Add New Employee"}
          {modalType === "editEmployee" && `Edit Contact: ${editingItem?.name}`}
          {modalType === "createVehicle" && "Register New Vehicle"}
          {modalType === "editVehicleStatus" && `Update Vehicle Status: ${editingItem?.registrationNumber}`}
          {modalType === "createOffering" && "Create New Service Offering"}
          {modalType === "editOffering" && `Edit Offering: ${editingItem?.name}`}
        </h3>

        {/* BRANCH FORM */}
        {(modalType === "createBranch" || modalType === "editBranch") && (
          <form onSubmit={onSubmitBranch} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Branch Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Danang Branch"
                value={branchForm.name}
                onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
                className="w-full border border-gray-300 p-2 text-sm focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">City</label>
              <input
                type="text"
                required
                placeholder="e.g. Danang"
                value={branchForm.city}
                onChange={(e) => setBranchForm({ ...branchForm, city: e.target.value })}
                className="w-full border border-gray-300 p-2 text-sm focus:border-primary focus:outline-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>
              <Button type="submit" disabled={submitting}>{submitting ? "Saving..." : "Save Branch"}</Button>
            </div>
          </form>
        )}

        {/* WAREHOUSE FORM */}
        {(modalType === "createWarehouse" || modalType === "editWarehouse") && (
          <form onSubmit={onSubmitWarehouse} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Warehouse Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Central Depot"
                value={warehouseForm.name}
                onChange={(e) => setWarehouseForm({ ...warehouseForm, name: e.target.value })}
                className="w-full border border-gray-300 p-2 text-sm focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Address</label>
              <input
                type="text"
                required
                placeholder="e.g. 100 Le Duan Street"
                value={warehouseForm.address}
                onChange={(e) => setWarehouseForm({ ...warehouseForm, address: e.target.value })}
                className="w-full border border-gray-300 p-2 text-sm focus:border-primary focus:outline-none"
              />
            </div>
            {modalType === "createWarehouse" && (
              <>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Branch</label>
                  <select
                    value={warehouseForm.branchId}
                    onChange={(e) => setWarehouseForm({ ...warehouseForm, branchId: e.target.value })}
                    className="w-full border border-gray-300 p-2 text-sm focus:border-primary focus:outline-none"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.city})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Capacity (kg)</label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    required
                    value={warehouseForm.capacityKg}
                    onChange={(e) => setWarehouseForm({ ...warehouseForm, capacityKg: e.target.value })}
                    className="w-full border border-gray-300 p-2 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
              </>
            )}
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>
              <Button type="submit" disabled={submitting}>{submitting ? "Saving..." : "Save Warehouse"}</Button>
            </div>
          </form>
        )}

        {/* EMPLOYEE FORM */}
        {(modalType === "createEmployee" || modalType === "editEmployee") && (
          <form onSubmit={onSubmitEmployee} className="space-y-4">
            {modalType === "createEmployee" && (
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Role Type</label>
                <select
                  value={employeeForm.employeeRole}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, employeeRole: e.target.value })}
                  className="w-full border border-gray-300 p-2 text-sm focus:border-primary focus:outline-none"
                >
                  <option value="Driver">Driver</option>
                  <option value="Staff">Staff</option>
                  <option value="Manager">Manager</option>
                </select>
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Full Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Nguyen Van A"
                value={employeeForm.name}
                onChange={(e) => setEmployeeForm({ ...employeeForm, name: e.target.value })}
                className="w-full border border-gray-300 p-2 text-sm focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Email Address</label>
              <input
                type="email"
                required
                placeholder="e.g. employee@smartfm.vn"
                value={employeeForm.email}
                onChange={(e) => setEmployeeForm({ ...employeeForm, email: e.target.value })}
                className="w-full border border-gray-300 p-2 text-sm focus:border-primary focus:outline-none"
              />
            </div>
            {modalType === "createEmployee" && (
              <>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Branch</label>
                  <select
                    value={employeeForm.branchId}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, branchId: e.target.value })}
                    className="w-full border border-gray-300 p-2 text-sm focus:border-primary focus:outline-none"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.city})
                      </option>
                    ))}
                  </select>
                </div>
                {employeeForm.employeeRole === "Driver" && (
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Driver License Number</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. D-9901"
                      value={employeeForm.licenseNumber}
                      onChange={(e) => setEmployeeForm({ ...employeeForm, licenseNumber: e.target.value })}
                      className="w-full border border-gray-300 p-2 text-sm focus:border-primary focus:outline-none"
                    />
                  </div>
                )}
                {employeeForm.employeeRole === "Staff" && (
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Department</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Operations"
                      value={employeeForm.department}
                      onChange={(e) => setEmployeeForm({ ...employeeForm, department: e.target.value })}
                      className="w-full border border-gray-300 p-2 text-sm focus:border-primary focus:outline-none"
                    />
                  </div>
                )}
              </>
            )}
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>
              <Button type="submit" disabled={submitting}>{submitting ? "Saving..." : "Save Employee"}</Button>
            </div>
          </form>
        )}

        {/* VEHICLE FORM */}
        {(modalType === "createVehicle" || modalType === "editVehicleStatus") && (
          <form onSubmit={onSubmitVehicle} className="space-y-4">
            {modalType === "createVehicle" ? (
              <>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Registration Number / License Plate</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 51A-99999"
                    value={vehicleForm.registrationNumber}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, registrationNumber: e.target.value })}
                    className="w-full border border-gray-300 p-2 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Branch</label>
                  <select
                    value={vehicleForm.branchId}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, branchId: e.target.value })}
                    className="w-full border border-gray-300 p-2 text-sm focus:border-primary focus:outline-none"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.city})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Vehicle Class</label>
                  <select
                    value={vehicleForm.vehicleClass}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, vehicleClass: e.target.value })}
                    className="w-full border border-gray-300 p-2 text-sm focus:border-primary focus:outline-none"
                  >
                    <option value="Light">Light Vehicle (1,000 kg)</option>
                    <option value="Medium">Medium Vehicle (5,000 kg)</option>
                    <option value="Heavy">Heavy Vehicle (20,000 kg)</option>
                  </select>
                </div>
              </>
            ) : (
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Status</label>
                <select
                  value={vehicleForm.status}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, status: e.target.value })}
                  className="w-full border border-gray-300 p-2 text-sm focus:border-primary focus:outline-none"
                >
                  <option value="Available">Available</option>
                  <option value="Assigned">Assigned</option>
                  <option value="UnderMaintenance">UnderMaintenance</option>
                </select>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>
              <Button type="submit" disabled={submitting}>{submitting ? "Saving..." : "Save Vehicle"}</Button>
            </div>
          </form>
        )}

        {/* OFFERING FORM */}
        {(modalType === "createOffering" || modalType === "editOffering") && (
          <form onSubmit={onSubmitOffering} className="space-y-4">
            {modalType === "createOffering" && (
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Offering Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Express Freight"
                  value={offeringForm.name}
                  onChange={(e) => setOfferingForm({ ...offeringForm, name: e.target.value })}
                  className="w-full border border-gray-300 p-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Description</label>
              <textarea
                rows={2}
                placeholder="Short description of freight service"
                value={offeringForm.description}
                onChange={(e) => setOfferingForm({ ...offeringForm, description: e.target.value })}
                className="w-full border border-gray-300 p-2 text-sm focus:border-primary focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Base Price (VND)</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={offeringForm.basePrice}
                  onChange={(e) => setOfferingForm({ ...offeringForm, basePrice: e.target.value })}
                  className="w-full border border-gray-300 p-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Max Weight (kg)</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={offeringForm.maxWeightKg}
                  onChange={(e) => setOfferingForm({ ...offeringForm, maxWeightKg: e.target.value })}
                  className="w-full border border-gray-300 p-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Max Vol (CBM)</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="any"
                  value={offeringForm.maxVolumeCbm}
                  onChange={(e) => setOfferingForm({ ...offeringForm, maxVolumeCbm: e.target.value })}
                  className="w-full border border-gray-300 p-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>
            </div>
            {modalType === "createOffering" && (
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Required Vehicle Class</label>
                <select
                  value={offeringForm.vehicleClass}
                  onChange={(e) => setOfferingForm({ ...offeringForm, vehicleClass: e.target.value })}
                  className="w-full border border-gray-300 p-2 text-sm focus:border-primary focus:outline-none"
                >
                  <option value="Light">Light</option>
                  <option value="Medium">Medium</option>
                  <option value="Heavy">Heavy</option>
                </select>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>
              <Button type="submit" disabled={submitting}>{submitting ? "Saving..." : "Save Offering"}</Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
