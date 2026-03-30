import React, { useState } from "react";
import AttendanceTable from "../components/AttendanceTable";
import BulkUpload from "../components/BulkUpload";
import AddRecordModal from "../components/AddRecordModal";

const ContactsTab = ({ staffData = [], guardData = [], onDelete, onBulkUpload, onAddRecord, onEditRecord }) => {
  const [showStaffUpload, setShowStaffUpload] = useState(false);
  const [showGuardUpload, setShowGuardUpload] = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [showGuardModal, setShowGuardModal] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const staffDesignations = [...new Set(staffData.map(r => r.designation).filter(Boolean))];
  const guardDesignations = [...new Set(guardData.map(r => r.designation).filter(Boolean))];

  const staffColumns = [
    { key: "sNo",          label: "S.No",          align: "center", width: "60px" },
    { key: "site",         label: "Site Code",     align: "center" },
    { key: "empId",        label: "Emp ID",         align: "center" },
    { key: "name",         label: "Name",           className: "cell-bold" },
    { key: "designation",  label: "Designation" },
    { key: "department",   label: "Department" },
    { key: "joiningDate",  label: "Joining Date",   align: "center" },
    { key: "email",        label: "Email" },
    { key: "manager",      label: "Reporting Mgr" },
    { key: "contact",      label: "Contact",        align: "center" },
  ];

  const guardColumns = [
    { key: "sNo",          label: "S.No",          align: "center", width: "60px" },
    { key: "site",         label: "Site Code",     align: "center" },
    { key: "name",         label: "Name",          className: "cell-bold" },
    { key: "designation",  label: "Designation" },
    { key: "joiningDate",  label: "Joining Date",  align: "center" },
    { key: "status",       label: "Status",        align: "center" },
    { key: "shift",        label: "Shift Duty",    align: "center" },
    { key: "contact",      label: "Contact No",    align: "center" },
    { key: "remarks",      label: "Remarks" },
  ];

  const staffFilters = [{ key: "designation", label: "All designation", options: staffDesignations }];
  const guardFilters = [{ key: "designation", label: "All designation", options: guardDesignations }];

  return (
    <div className="tab-content">
      <div className="tab-actions" style={{ marginBottom: 8 }}>
        <strong>Staff Contacts (SC)</strong>
      </div>
      <div className="tab-actions">
        <button className="btn-upload" onClick={() => setShowStaffUpload(!showStaffUpload)}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M8 10V2M5 5l3-3 3 3M3 12v1h10v-1" /></svg>
          Bulk upload
        </button>
        <button className="btn-add" onClick={() => setShowStaffModal(true)}>+ Add staff contact</button>
      </div>
      <BulkUpload visible={showStaffUpload} onUpload={(file) => { onBulkUpload?.(file, "sc"); setShowStaffUpload(false); }} columns="S.No,Site,EmpID,JoiningDate,Email,Name,Designation,Department,Manager,Contact" />
      <AttendanceTable records={staffData} columns={staffColumns} filters={staffFilters} statusFilter="all" showRowNum={false} onEdit={(rec) => setEditRecord(rec)} onDelete={onDelete} exportFilename="SC_Contacts" />
      <AddRecordModal visible={showStaffModal} onClose={() => setShowStaffModal(false)} onSave={onAddRecord} type="staffContact" contacts={staffData} />

      <div className="tab-actions" style={{ marginTop: 18, marginBottom: 8 }}>
        <strong>Guard Contacts (GC)</strong>
      </div>
      <div className="tab-actions">
        <button className="btn-upload" onClick={() => setShowGuardUpload(!showGuardUpload)}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M8 10V2M5 5l3-3 3 3M3 12v1h10v-1" /></svg>
          Bulk upload
        </button>
        <button className="btn-add" onClick={() => setShowGuardModal(true)}>+ Add guard contact</button>
      </div>
      <BulkUpload visible={showGuardUpload} onUpload={(file) => { onBulkUpload?.(file, "gc"); setShowGuardUpload(false); }} columns="S.No,Site,Name,JoiningDate,Designation,Status,ShiftDuty,ContactNo,Remarks" />
      <AttendanceTable records={guardData} columns={guardColumns} filters={guardFilters} statusFilter="all" showRowNum={false} onEdit={(rec) => setEditRecord(rec)} onDelete={onDelete} exportFilename="GC_Contacts" />
      <AddRecordModal visible={showGuardModal} onClose={() => setShowGuardModal(false)} onSave={onAddRecord} type="guardContact" contacts={guardData} />

      <AddRecordModal visible={!!editRecord} initialData={editRecord} onClose={() => setEditRecord(null)} onSave={(d) => { onEditRecord?.({ ...editRecord, ...d }); setEditRecord(null); }} type={editRecord?.type || "staffContact"} contacts={editRecord?.type === "guardContact" ? guardData : staffData} />
    </div>
  );
};

export default ContactsTab;