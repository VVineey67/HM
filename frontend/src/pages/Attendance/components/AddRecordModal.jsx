import React, { useState } from "react";
import { ALL_STATUSES } from "../utils";

const AddRecordModal = ({ visible, onClose, onSave, type = "staff" }) => {
  const [formData, setFormData] = useState({});
  if (!visible) return null;

  const handleChange = (key, value) => setFormData((prev) => ({ ...prev, [key]: value }));
  const handleSave = () => { onSave?.({ ...formData, type }); setFormData({}); onClose(); };

  const staffGuardFields = [
    { key: "date", label: "Date", type: "date", half: true },
    { key: "name", label: "Name", type: "text", placeholder: "Full name", half: true },
    { key: "designation", label: "Designation", type: "text", placeholder: "e.g. Site Engineer", half: true },
    { key: "department", label: "Department", type: "text", placeholder: "e.g. Civil Engineer", half: true },
    { key: "status", label: "Status", type: "select", half: true, options: ALL_STATUSES },
    { key: "inTime", label: "In time", type: "time", half: true },
    { key: "outTime", label: "Out time", type: "time", half: true },
    { key: "shift", label: "Shift", type: "select", half: true, options: ["Day", "Night"] },
    { key: "remarks", label: "Remarks", type: "text", placeholder: "Optional", half: true },
  ];

  const contactFields = [
    { key: "name", label: "Name", type: "text", placeholder: "Full name", half: true },
    { key: "empId", label: "Emp ID", type: "text", placeholder: "BITL-XXX", half: true },
    { key: "email", label: "Email", type: "email", placeholder: "name@bootes.in", half: true },
    { key: "contact", label: "Contact no", type: "text", placeholder: "Phone number", half: true },
    { key: "designation", label: "Designation", type: "text", placeholder: "e.g. Site Engineer", half: true },
    { key: "manager", label: "Reporting manager", type: "text", placeholder: "Manager name", half: true },
  ];

  const fields = type === "contact" ? contactFields : staffGuardFields;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Add new {type === "contact" ? "contact" : `${type} record`}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="modal-fields">
            {fields.map((field) => (
              <div key={field.key} className={`field-group ${field.half ? "half" : "full"}`}>
                <label>{field.label}</label>
                {field.type === "select" ? (
                  <select value={formData[field.key] || ""} onChange={(e) => handleChange(field.key, e.target.value)}>
                    <option value="">Select...</option>
                    {field.options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                ) : (
                  <input type={field.type} placeholder={field.placeholder || ""} value={formData[field.key] || ""} onChange={(e) => handleChange(field.key, e.target.value)} />
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-save" onClick={handleSave}>Save record</button>
        </div>
      </div>
    </div>
  );
};

export default AddRecordModal;