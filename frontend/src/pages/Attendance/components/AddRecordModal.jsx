import React, { useState, useEffect } from "react";
import { ALL_STATUSES } from "../utils";

const AddRecordModal = ({ visible, onClose, onSave, type = "staff", initialData = null }) => {
  const isEdit = !!initialData;
  const [formData, setFormData] = useState({});

  // Excel decimal (0.3958) → "HH:MM" for <input type="time">
  const decimalToTimeStr = (val) => {
    if (!val && val !== 0) return "";
    if (typeof val === "string" && /^\d{2}:\d{2}/.test(val)) return val.slice(0,5);
    const mins = Math.round(Number(val) * 1440);
    const h = Math.floor(mins / 60), m = mins % 60;
    return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`;
  };

  // "14-Oct-24" / "09-Oct-24" → "2024-10-09" for <input type="date">
  const MON = {Jan:"01",Feb:"02",Mar:"03",Apr:"04",May:"05",Jun:"06",Jul:"07",Aug:"08",Sep:"09",Oct:"10",Nov:"11",Dec:"12"};
  const toHTMLDate = (val) => {
    if (!val) return "";
    // Already yyyy-MM-dd
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
    // DD-Mon-YY  e.g. "14-Oct-24"
    const m = val.match(/^(\d{2})-([A-Za-z]{3})-(\d{2})$/);
    if (m) return `20${m[3]}-${MON[m[2]] || "01"}-${m[1]}`;
    return "";
  };

  useEffect(() => {
    if (visible && initialData) {
      const normalized = { ...initialData };
      // Convert Excel decimal times → HH:MM
      if (normalized.inTime !== undefined)  normalized.inTime  = decimalToTimeStr(normalized.inTime);
      if (normalized.outTime !== undefined) normalized.outTime = decimalToTimeStr(normalized.outTime);
      // Convert date strings → yyyy-MM-dd
      if (normalized.date)        normalized.date        = toHTMLDate(normalized.date);
      if (normalized.joiningDate) normalized.joiningDate = toHTMLDate(normalized.joiningDate);
      // Normalize contact field names
      if (normalized.email   !== undefined && normalized.emailId   === undefined) normalized.emailId   = normalized.email;
      if (normalized.contact !== undefined && normalized.contactNo === undefined) normalized.contactNo = normalized.contact;
      setFormData(normalized);
    } else if (visible) {
      setFormData({});
    }
  }, [visible, initialData]);

  if (!visible) return null;

  const handleChange = (key, value) => setFormData((prev) => ({ ...prev, [key]: value }));
  const handleSave = () => { onSave?.({ ...formData, type }); onClose(); };

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
    { key: "name",         label: "Name",               type: "text",  placeholder: "Full name",          half: true },
    { key: "empId",        label: "Emp ID",              type: "text",  placeholder: "BITL-XXX",           half: true },
    { key: "joiningDate",  label: "Joining Date",        type: "date",                                     half: true },
    { key: "emailId",      label: "Email",               type: "email", placeholder: "name@bootes.in",     half: true },
    { key: "contactNo",    label: "Contact no",          type: "text",  placeholder: "Phone number",       half: true },
    { key: "designation",  label: "Designation",         type: "text",  placeholder: "e.g. Site Engineer", half: true },
    { key: "manager",      label: "Reporting manager",   type: "text",  placeholder: "Manager name",       half: true },
  ];

  const fields = type === "contact" ? contactFields : staffGuardFields;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isEdit ? `Edit ${type === "contact" ? "contact" : `${type} record`}` : `Add new ${type === "contact" ? "contact" : `${type} record`}`}</h3>
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
          <button className="btn-save" onClick={handleSave}>{isEdit ? "Update" : "Save record"}</button>
        </div>
      </div>
    </div>
  );
};

export default AddRecordModal;