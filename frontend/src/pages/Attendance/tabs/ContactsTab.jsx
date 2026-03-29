import React, { useState } from "react";
import AttendanceTable from "../components/AttendanceTable";
import BulkUpload from "../components/BulkUpload";
import AddRecordModal from "../components/AddRecordModal";

const ContactsTab = ({ data, onDelete, onBulkUpload, onAddRecord, onEditRecord }) => {
  const [showUpload, setShowUpload] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const designations = [...new Set(data.map(r => r.designation).filter(Boolean))];

  const columns = [
    { key: "sNo",          label: "S.No",          align: "center", width: "60px" },
    { key: "empId",        label: "Emp ID",         align: "center" },
    { key: "name",         label: "Name",           className: "cell-bold" },
    { key: "designation",  label: "Designation" },
    { key: "joiningDate",  label: "Joining Date",   align: "center" },
    { key: "email",        label: "Email" },
    { key: "manager",      label: "Reporting Mgr" },
    { key: "contact",      label: "Contact",        align: "center" },
  ];

  const filters = [{ key: "designation", label: "All designation", options: designations }];

  return (
    <div className="tab-content">
      <div className="tab-actions">
        <button className="btn-upload" onClick={() => setShowUpload(!showUpload)}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M8 10V2M5 5l3-3 3 3M3 12v1h10v-1" /></svg>
          Bulk upload
        </button>
        <button className="btn-add" onClick={() => setShowModal(true)}>+ Add contact</button>
      </div>
      <BulkUpload visible={showUpload} onUpload={(file) => { onBulkUpload?.(file, "contact"); setShowUpload(false); }} columns="S.No,Site,EmpID,JoiningDate,Email,Name,Designation,Manager,Contact" />
      <AttendanceTable records={data} columns={columns} filters={filters} statusFilter="all" showRowNum={false} onEdit={(rec) => setEditRecord(rec)} onDelete={onDelete} exportFilename="Contacts" />
      <AddRecordModal visible={showModal} onClose={() => setShowModal(false)} onSave={onAddRecord} type="contact" />
      <AddRecordModal visible={!!editRecord} initialData={editRecord} onClose={() => setEditRecord(null)} onSave={(d) => { onEditRecord?.({ ...editRecord, ...d }); setEditRecord(null); }} type="contact" />
    </div>
  );
};

export default ContactsTab;