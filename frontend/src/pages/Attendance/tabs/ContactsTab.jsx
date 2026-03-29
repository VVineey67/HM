import React, { useState } from "react";
import AttendanceTable from "../components/AttendanceTable";
import BulkUpload from "../components/BulkUpload";
import AddRecordModal from "../components/AddRecordModal";

const ContactsTab = ({ data, onEdit, onDelete, onBulkUpload, onAddRecord }) => {
  const [showUpload, setShowUpload] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const designations = [...new Set(data.map(r => r.designation).filter(Boolean))];

  const columns = [
    { key: "sNo", label: "S.No", width: "50px" },
    { key: "empId", label: "Emp ID", className: "cell-muted" },
    { key: "name", label: "Name", className: "cell-bold" },
    { key: "designation", label: "Designation" },
    { key: "email", label: "Email", className: "cell-link" },
    { key: "manager", label: "Reporting mgr" },
    { key: "contact", label: "Contact" },
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
      <BulkUpload visible={showUpload} onUpload={(file) => { onBulkUpload?.(file, "contact"); setShowUpload(false); }} columns="S.No, Site, Emp ID, Joining Date, Email, Name, Designation, Reporting Manager, Contact No" />
      <AttendanceTable records={data} columns={columns} filters={filters} statusFilter="all" onEdit={onEdit} onDelete={onDelete} exportFilename="Contacts" />
      <AddRecordModal visible={showModal} onClose={() => setShowModal(false)} onSave={onAddRecord} type="contact" />
    </div>
  );
};

export default ContactsTab;