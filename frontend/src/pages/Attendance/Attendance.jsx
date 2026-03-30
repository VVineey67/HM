import React, { useState, useEffect, useCallback } from "react";
import API from "../../api";
import Toast from "../../components/Toast";
import { excelToJSDate, formatTime } from "./utils";
import TodayTab from "./tabs/TodayTab";
import StaffTab from "./tabs/StaffTab";
import GuardTab from "./tabs/GuardTab";
import ContactsTab from "./tabs/ContactsTab";
import "./Attendance.css";

const TABS = ["Today", "Staff", "Guard", "Contacts"];

const Attendance = ({ selectedProject }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [staffData, setStaffData] = useState([]);
  const [guardData, setGuardData] = useState([]);
  const [staffContacts, setStaffContacts] = useState([]);
  const [guardContacts, setGuardContacts] = useState([]);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type, key: Date.now() });
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatClock = () => {
    const h = currentTime.getHours();
    const m = String(currentTime.getMinutes()).padStart(2, "0");
    const s = String(currentTime.getSeconds()).padStart(2, "0");
    const ampm = h >= 12 ? "PM" : "AM";
    return `${h % 12 || 12}:${m}:${s} ${ampm}`;
  };

  useEffect(() => {
    if (selectedProject) {
      // Reset data before fetching new project
      setStaffData([]);
      setGuardData([]);
      setStaffContacts([]);
      setGuardContacts([]);
      fetchData();
    }
  }, [selectedProject]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/api/attendance/read/${selectedProject}`);
      const normalize = (v) => String(v || "").toLowerCase().replace(/[^a-z0-9]/g, "");
      const getIndex = (headers, keys, fallback = -1) => {
        const normalizedHeaders = headers.map(normalize);
        for (const k of keys) {
          const idx = normalizedHeaders.indexOf(normalize(k));
          if (idx !== -1) return idx;
        }
        return fallback;
      };
      const pick = (row, idx, def = "") => (idx >= 0 ? (row[idx] ?? def) : def);

      // ═══ STAFF PARSING ═══
      // Backend returns: [Date, SiteCode, Name, Desig, Dept, Status, InTime, OutTime, Shift, WorkHrs, OTHrs, Remarks]
      const staffParsed = (res.data.staff || []).map((r, i) => ({
        id: i,
        date: excelToJSDate(r[0]),
        siteCode: r[1] || selectedProject || "",
        name: r[2] || "",
        designation: r[3] || "",
        department: r[4] || "",
        status: r[5] || "",
        inTime: r[6],
        outTime: r[7],
        shift: r[8] || "Day",
        workingHrs: r[9] || "",
        otHrs: r[10] || "",
        remarks: r[11] || "",
        type: "staff",
      }));

      // ═══ GUARD PARSING ═══
      // RAW: [0]=Date, [1]=SiteCode, [2]=Name, [3]=Type, [4]=Location,
      //       [5]=Status, [6]=InTime, [7]=OutTime, [8]=Shift, [9]=Remarks
      const guardParsed = (res.data.guards || []).slice(1).map((r, i) => ({
        id: i,
        date: excelToJSDate(r[0]),
        siteCode: r[1] || selectedProject || "",
        name: r[2] || "",
        designation: r[3] || "",
        department: r[4] || "",
        status: r[5] || "",
        inTime: r[6],
        outTime: r[7],
        shift: r[8] || "Day",
        remarks: r[9] || "",
        workingHrs: "",
        otHrs: "",
        type: "guard",
      }));

      const scRaw = res.data.staffContacts || res.data.contacts || [];
      const scHeaders = Array.isArray(scRaw[0]) ? scRaw[0] : [];
      const scDataRows = Array.isArray(scRaw[0]) ? scRaw.slice(1) : scRaw;
      const scIdx = {
        sNo: getIndex(scHeaders, ["S.No", "SNo"], 0),
        site: getIndex(scHeaders, ["Site", "SiteCode", "Site Cod"], 1),
        empId: getIndex(scHeaders, ["EmpID", "Emp Id", "EmployeeId"], 2),
        joiningDate: getIndex(scHeaders, ["JoiningDate", "Joining Date"], 3),
        email: getIndex(scHeaders, ["Email", "EmailID", "Email Id"], 4),
        name: getIndex(scHeaders, ["Name"], 5),
        designation: getIndex(scHeaders, ["Designation"], 6),
        department: getIndex(scHeaders, ["Department"], 7),
        manager: getIndex(scHeaders, ["Manager", "ReportingManager", "Reporting Manager"], 8),
        contact: getIndex(scHeaders, ["Contact", "ContactNo", "Contact No"], 9),
      };
      const staffContactsParsed = scDataRows.map((r, i) => ({
        id: i,
        sNo: pick(r, scIdx.sNo, i + 1),
        site: pick(r, scIdx.site, ""),
        empId: pick(r, scIdx.empId, ""),
        joiningDate: excelToJSDate(pick(r, scIdx.joiningDate, "")),
        email: pick(r, scIdx.email, ""),
        name: pick(r, scIdx.name, ""),
        designation: pick(r, scIdx.designation, ""),
        department: pick(r, scIdx.department, ""),
        manager: pick(r, scIdx.manager, ""),
        contact: pick(r, scIdx.contact, ""),
        sheetType: "staffContact",
        type: "staffContact",
      }));

      const gcRaw = res.data.guardContacts || [];
      const gcHeaders = Array.isArray(gcRaw[0]) ? gcRaw[0] : [];
      const gcDataRows = Array.isArray(gcRaw[0]) ? gcRaw.slice(1) : gcRaw;
      const gcIdx = {
        sNo: getIndex(gcHeaders, ["S.No", "SNo"], 0),
        site: getIndex(gcHeaders, ["Site", "SiteCode", "Site Cod"], 1),
        name: getIndex(gcHeaders, ["Name"], 2),
        joiningDate: getIndex(gcHeaders, ["JoiningDate", "Joining Date"], 3),
        designation: getIndex(gcHeaders, ["Designation"], 4),
        status: getIndex(gcHeaders, ["Status"], 5),
        shift: getIndex(gcHeaders, ["ShiftDuty", "Shift Duty", "Shift"], 6),
        contact: getIndex(gcHeaders, ["ContactNo", "Contact No", "Contact"], 7),
        remarks: getIndex(gcHeaders, ["Remarks"], 8),
      };
      const guardContactsParsed = gcDataRows.map((r, i) => ({
        id: i,
        sNo: pick(r, gcIdx.sNo, i + 1),
        site: pick(r, gcIdx.site, ""),
        name: pick(r, gcIdx.name, ""),
        joiningDate: excelToJSDate(pick(r, gcIdx.joiningDate, "")),
        designation: pick(r, gcIdx.designation, ""),
        status: pick(r, gcIdx.status, ""),
        shift: pick(r, gcIdx.shift, ""),
        contact: pick(r, gcIdx.contact, ""),
        remarks: pick(r, gcIdx.remarks, ""),
        sheetType: "guardContact",
        type: "guardContact",
      }));

      setStaffData(staffParsed);
      setGuardData(guardParsed);
      setStaffContacts(staffContactsParsed);
      setGuardContacts(guardContactsParsed);
    } catch (err) {
      console.error("Error fetching attendance:", err);
      setStaffData([]);
      setGuardData([]);
      setStaffContacts([]);
      setGuardContacts([]);
      showToast("Failed to load attendance data for this project", "error");
    } finally {
      setLoading(false);
    }
  };

  // ─── CRUD ────────────────────────────────────────────
  const handleEdit = () => {}; // handled locally in each tab

  const handleEditRecord = async (data) => {
    try {
      const sheetMap = { staff: "Staff", guard: "Guard", staffContact: "SC", guardContact: "GC" };
      const sheet = sheetMap[data.type];
      const payload = buildPayload(data);
      console.log("Sending update payload:", payload); // DEBUG
      await API.patch(`/api/attendance/update/${selectedProject}/${sheet}/${data.id}`, payload);
      showToast("Record updated successfully");
      fetchData();
    } catch (err) {
      const detail = err?.response?.data?.detail || err.message;
      console.error("Update failed:", detail);
      showToast("Update failed: " + detail, "error");
    }
  };

  const handleDelete = async (record) => {
    if (!window.confirm(`Delete record for ${record.name}?`)) return;
    try {
      const sheetMap = { staff: "Staff", guard: "Guard", staffContact: "SC", guardContact: "GC" };
      await API.delete(`/api/attendance/delete/${selectedProject}/${sheetMap[record.type]}/${record.id}`);
      showToast("Record deleted successfully");
      fetchData();
    } catch (err) {
      const detail = err?.response?.data?.detail || err.message;
      console.error("Delete failed:", detail);
      showToast("Delete failed: " + detail, "error");
    }
  };

  // Map frontend field names → backend field names before sending
  const buildPayload = (data) => {
    // Helper to convert "HH:MM" from <input type="time"> back to Excel decimal
    const timeStrToDecimal = (timeStr) => {
      if (!timeStr || typeof timeStr !== 'string') return null;
      const [h, m] = timeStr.split(':').map(Number);
      if (isNaN(h) || isNaN(m)) return null;
      return (h * 60 + m) / 1440;
    };


    if (data.type === 'staff') {
      return {
        date:        data.date,   // ISO "yyyy-MM-dd" — backend jsToExcelDate handles it correctly
        siteCode:    data.siteCode || selectedProject,
        name:        data.name,
        designation: data.designation,
        department:  data.department || "",
        status:      data.status,
        inTime:      timeStrToDecimal(data.inTime),
        outTime:     timeStrToDecimal(data.outTime),
        shift:       data.shift || "Day",
        remarks:     data.remarks || "",
      };
    }

    if (data.type === 'guard') {
      return {
        date: data.date,   // ISO "yyyy-MM-dd"
        siteCode: data.siteCode || selectedProject,
        name: data.name,
        designation: data.designation,
        department: data.department,
        status: data.status,
        inTime: timeStrToDecimal(data.inTime),
        outTime: timeStrToDecimal(data.outTime),
        shift: data.shift,
        remarks: data.remarks,
      };
    }

    if (data.type === "staffContact") {
      return {
        sNo:         data.sNo,
        site:        data.site || selectedProject,
        empId:       data.empId,
        joiningDate: data.joiningDate,
        emailId:     data.email || data.emailId,
        name:        data.name,
        designation: data.designation,
        department:  data.department || "",
        manager:     data.manager,
        contactNo:   data.contact || data.contactNo,
      };
    }
    if (data.type === "guardContact") {
      return {
        sNo:         data.sNo,
        site:        data.site || selectedProject,
        name:        data.name,
        joiningDate: data.joiningDate,
        designation: data.designation || "Security Guard",
        status:      data.status || "Deactive",
        shift:       data.shift || "",
        contactNo:   data.contact || data.contactNo,
        remarks:     data.remarks || "",
      };
    }
    return data; // Fallback
  };

  const handleAddRecord = async (data) => {
    // Validate: name must exist in contacts for staff/guard
    if (data.type === "staff" && staffContacts.length > 0) {
      const known = staffContacts.some(c => c.name?.toLowerCase() === data.name?.trim().toLowerCase());
      if (!known) {
        showToast(`"${data.name}" is not registered in Contacts. Please add the employee to Contacts first.`, "error");
        return;
      }
    }
    if (data.type === "guard" && guardContacts.length > 0) {
      const known = guardContacts.some(c => c.name?.toLowerCase() === data.name?.trim().toLowerCase());
      if (!known) {
        showToast(`"${data.name}" is not registered in Guard Contacts. Please add the employee to GC first.`, "error");
        return;
      }
    }
    try {
      const sheetMap = { staff: "Staff", guard: "Guard", staffContact: "SC", guardContact: "GC" };
      const sheet = sheetMap[data.type];
      const payload = buildPayload(data);
      await API.post(`/api/attendance/add/${selectedProject}/${sheet}`, payload);
      showToast("Record added successfully");
      fetchData();
    } catch (err) {
      const detail = err?.response?.data?.detail || err.message;
      console.error("Add failed:", detail);
      showToast("Failed to add record: " + detail, "error");
    }
  };

  const handleBulkUpload = async (file, type) => {
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await API.post(`/api/attendance/bulk-upload/${selectedProject}/${type}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      showToast(`Bulk upload successful — ${res.data.rowsAdded} rows added`);
      fetchData();
    } catch (err) {
      const data = err?.response?.data;
      const msg = data?.error || "Bulk upload failed";
      const detail = data?.detail || err.message;
      console.error(err);
      // Show full detail so user knows exactly what to fix
      if (detail && detail !== msg) {
        alert(`${msg}\n\n${detail}`);
      } else {
        showToast(msg, "error");
      }
    }
  };

  if (loading) return (
    <div className="attendance-page" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "400px" }}>
      <div className="loading-bar" style={{ width: "200px" }}><div className="loading-progress" /></div>
    </div>
  );

  return (
    <div className="attendance-page">
      {toast && (
        <Toast
          key={toast.key}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="attendance-header">
        <div className="header-glow-1" />
        <div className="header-glow-2" />
        <div className="header-glow-3" />
        <div className="header-left">
          <div className="header-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>
            </svg>
          </div>
          <div>
            <h1 className="page-title">Attendance Management</h1>
            <p className="page-subtitle">Real-time tracking system</p>
          </div>
        </div>
        <div className="header-right">
          <div className="live-clock">
            <div className="clock-time">{formatClock()}</div>
            <div className="clock-label"><span className="pulse-dot" /> Live</div>
          </div>
          <div className="project-badge">{selectedProject || "Project"}</div>
        </div>
      </div>

      <div className="tabs-bar">
        <div className="tab-group">
          {TABS.map((tab, i) => (
            <button key={tab} className={`tab-btn ${activeTab === i ? "active" : ""}`} onClick={() => setActiveTab(i)}>{tab}</button>
          ))}
        </div>
      </div>

      <div className="tab-container">
        {activeTab === 0 && <TodayTab staffData={staffData} guardData={guardData} onEdit={handleEdit} onDelete={handleDelete} />}
        {activeTab === 1 && <StaffTab data={staffData} contacts={staffContacts} onDelete={handleDelete} onBulkUpload={handleBulkUpload} onAddRecord={handleAddRecord} onEditRecord={handleEditRecord} />}
        {activeTab === 2 && <GuardTab data={guardData} contacts={guardContacts} onDelete={handleDelete} onBulkUpload={handleBulkUpload} onAddRecord={handleAddRecord} onEditRecord={handleEditRecord} />}
        {activeTab === 3 && <ContactsTab staffData={staffContacts} guardData={guardContacts} onDelete={handleDelete} onBulkUpload={handleBulkUpload} onAddRecord={handleAddRecord} onEditRecord={handleEditRecord} />}
      </div>
    </div>
  );
};

export default Attendance;
