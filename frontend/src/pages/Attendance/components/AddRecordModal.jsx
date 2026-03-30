import React, { useState, useEffect, useMemo } from "react";
import { ALL_STATUSES } from "../utils";

const AddRecordModal = ({
  visible,
  onClose,
  onSave,
  type = "staff",
  initialData = null,
  contacts = [],
  departmentOptions = [],
  locationOptions = [],
}) => {
  const isEdit = !!initialData;
  const [formData, setFormData] = useState({});

  // Excel decimal → "HH:MM" for <input type="time">
  const decimalToTimeStr = (val) => {
    if (!val && val !== 0) return "";
    if (typeof val === "string" && /^\d{2}:\d{2}/.test(val)) return val.slice(0, 5);
    const mins = Math.round(Number(val) * 1440);
    const h = Math.floor(mins / 60), m = mins % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };

  const MON = { Jan:"01",Feb:"02",Mar:"03",Apr:"04",May:"05",Jun:"06",Jul:"07",Aug:"08",Sep:"09",Oct:"10",Nov:"11",Dec:"12" };
  const toHTMLDate = (val) => {
    if (!val) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
    const m = val.match(/^(\d{2})-([A-Za-z]{3})-(\d{2})$/);
    if (m) return `20${m[3]}-${MON[m[2]] || "01"}-${m[1]}`;
    return "";
  };

  useEffect(() => {
    if (visible && initialData) {
      const normalized = { ...initialData };
      if (normalized.inTime !== undefined)  normalized.inTime  = decimalToTimeStr(normalized.inTime);
      if (normalized.outTime !== undefined) normalized.outTime = decimalToTimeStr(normalized.outTime);
      if (normalized.date)        normalized.date        = toHTMLDate(normalized.date);
      if (normalized.joiningDate) normalized.joiningDate = toHTMLDate(normalized.joiningDate);
      if (normalized.email   !== undefined && normalized.emailId   === undefined) normalized.emailId   = normalized.email;
      if (normalized.contact !== undefined && normalized.contactNo === undefined) normalized.contactNo = normalized.contact;
      setFormData(normalized);
    } else if (visible) {
      setFormData({});
    }
  }, [visible, initialData]);

  // ─── Derive dropdown options from existing contacts ──────
  const contactNames   = useMemo(() => [...new Set(contacts.map(c => c.name).filter(Boolean))], [contacts]);
  const designations   = useMemo(() => [...new Set(contacts.map(c => c.designation).filter(Boolean))], [contacts]);
  const managers       = useMemo(() => contactNames, [contactNames]);
  const existingEmails = useMemo(() => [...new Set(contacts.map(c => c.email).filter(Boolean))], [contacts]);
  const existingPhones = useMemo(() => [...new Set(contacts.map(c => c.contact).filter(Boolean))], [contacts]);
  const departments = useMemo(() => {
    if (departmentOptions.length) return [...new Set(departmentOptions.filter(Boolean))];
    return [...new Set(contacts.map(c => c.department).filter(Boolean))];
  }, [departmentOptions, contacts]);
  const locations = useMemo(() => {
    if (locationOptions.length) return [...new Set(locationOptions.filter(Boolean))];
    return [...new Set(contacts.map(c => c.location).filter(Boolean))];
  }, [locationOptions, contacts]);

  // Auto-fill designation when a known name is selected
  const handleChange = (key, value) => {
    setFormData((prev) => {
      const updated = { ...prev, [key]: value };
      if (key === "name" && (type === "staff" || type === "guard")) {
        const match = contacts.find(c => c.name === value);
        if (match) {
          if (type === "guard") {
            updated.designation = match.designation || prev.designation || "";
            updated.department = match.location || prev.department || "";
          } else {
            updated.designation = match.designation || prev.designation || "";
            updated.department  = match.department || match.site || prev.department || "";
          }
          updated.siteCode = match.site || prev.siteCode || "";
        }
      }
      return updated;
    });
  };

  const handleSave = () => { onSave?.({ ...formData, type }); onClose(); };

  if (!visible) return null;

  // ─── Field definitions ───────────────────────────────────
  const staffFields = [
    { key: "date",        label: "Date",       type: "date",   half: true },
    { key: "siteCode",    label: "Site Code",  type: "text",   half: true, placeholder: "e.g. B-47" },
    { key: "name",        label: "Name",       type: "select", half: true, options: contactNames },
    { key: "designation", label: "Designation",type: "select", half: true, options: designations },
    { key: "department",  label: "Department", type: "select", half: true, options: departments },
    { key: "status",      label: "Status",     type: "select", half: true, options: ALL_STATUSES },
    { key: "inTime",      label: "In time",    type: "time",   half: true },
    { key: "outTime",     label: "Out time",   type: "time",   half: true },
    { key: "shift",       label: "Shift",      type: "select", half: true, options: ["Day", "Night"] },
    { key: "remarks",     label: "Remarks",    type: "text",   half: true, placeholder: "Optional" },
  ];

  const guardFields = [
    { key: "date",        label: "Date",       type: "date",   half: true },
    { key: "siteCode",    label: "Site Code",  type: "text",   half: true, placeholder: "e.g. B-47" },
    { key: "name",        label: "Name",       type: "select", half: true, options: contactNames },
    { key: "designation", label: "Type",       type: "select", half: true, options: designations },
    { key: "department",  label: "Location",   type: "select", half: true, options: locations },
    { key: "status",      label: "Status",     type: "select", half: true, options: ALL_STATUSES },
    { key: "inTime",      label: "In time",    type: "time",   half: true },
    { key: "outTime",     label: "Out time",   type: "time",   half: true },
    { key: "shift",       label: "Shift",      type: "select", half: true, options: ["Day", "Night"] },
    { key: "remarks",     label: "Remarks",    type: "text",   half: true, placeholder: "Optional" },
  ];

  const staffContactFields = [
    { key: "site",        label: "Site Code",        type: "text",  half: true, placeholder: "e.g. B-47" },
    { key: "name",        label: "Name",             type: "text",  half: true, placeholder: "Full name" },
    { key: "empId",       label: "Emp ID",           type: "text",  half: true, placeholder: "BITL-XXX" },
    { key: "joiningDate", label: "Joining Date",     type: "date",  half: true                                     },
    { key: "emailId",     label: "Email",            type: "text",  half: true, placeholder: "name@bootes.in" },
    { key: "contactNo",   label: "Contact no",       type: "text",  half: true, placeholder: "Phone number" },
    { key: "designation", label: "Designation",      type: "text",  half: true, placeholder: "e.g. Site Engineer" },
    { key: "department",  label: "Department",       type: "text",  half: true, placeholder: "e.g. Civil Engineer" },
    { key: "manager",     label: "Reporting manager",type: "text",  half: true, placeholder: "Manager name" },
  ];

  const guardContactFields = [
    { key: "site",        label: "Site Code",    type: "text",   half: true, placeholder: "e.g. B-47" },
    { key: "name",        label: "Name",         type: "text",   half: true, placeholder: "Guard name" },
    { key: "joiningDate", label: "Joining Date", type: "date",   half: true },
    { key: "designation", label: "Designation",  type: "text",   half: true, placeholder: "Security Guard" },
    { key: "status",      label: "Status",       type: "select", half: true, options: ["Active", "Deactive"] },
    { key: "shift",       label: "Shift Duty",   type: "select", half: true, options: ["", "Day", "Night"] },
    { key: "contactNo",   label: "Contact no",   type: "text",   half: true, placeholder: "Phone number" },
    { key: "remarks",     label: "Remarks",      type: "text",   half: true, placeholder: "Optional remarks" },
  ];

  const fields =
    type === "staffContact" ? staffContactFields :
    type === "guardContact" ? guardContactFields :
    type === "guard" ? guardFields :
    staffFields;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            {isEdit
              ? `Edit ${type === "staffContact" ? "staff contact" : type === "guardContact" ? "guard contact" : `${type} record`}`
              : `Add new ${type === "staffContact" ? "staff contact" : type === "guardContact" ? "guard contact" : `${type} record`}`}
          </h3>
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
                ) : field.type === "combo" ? (
                  <>
                    <input
                      type="text"
                      list={`dl-${field.key}`}
                      placeholder={field.placeholder || ""}
                      value={formData[field.key] || ""}
                      onChange={(e) => handleChange(field.key, e.target.value)}
                    />
                    <datalist id={`dl-${field.key}`}>
                      {(field.options || []).map((opt) => <option key={opt} value={opt} />)}
                    </datalist>
                  </>
                ) : (
                  <input
                    type={field.type}
                    placeholder={field.placeholder || ""}
                    value={formData[field.key] || ""}
                    autoComplete={type === "staffContact" || type === "guardContact" ? "new-password" : "off"}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                  />
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
