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

// Module-level cache — survives tab switches (component unmount/remount)
const _cache = {};

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
    if (selectedProject) fetchData();
  }, [selectedProject]);

  const fetchData = async () => {
    // Serve from cache immediately, then refresh in background
    if (_cache[selectedProject]) {
      const c = _cache[selectedProject];
      setStaffData(c.staff);
      setGuardData(c.guard);
      setStaffContacts(c.staffContacts);
      setGuardContacts(c.guardContacts);
    } else {
      setLoading(true);
    }
    try {
      const res = await API.get(`/api/attendance/read/${selectedProject}`);
      // ═══ STAFF PARSING ═══
      const staffParsed = (res.data.staff || []).map((r) => ({
        id:          r.id,
        date:        r.date        || "",
        siteCode:    r.siteCode    || selectedProject || "",
        name:        r.name        || "",
        designation: r.designation || "",
        department:  r.department  || "",
        status:      r.status      || "",
        inTime:      r.inTime      || "",
        outTime:     r.outTime     || "",
        shift:       r.shift       || "Day",
        workingHrs:  r.workingHrs  || "",
        otHrs:       r.otHrs       || "",
        remarks:     r.remarks     || "",
        type: "staff",
      }));

      // ═══ GUARD PARSING ═══
      const guardParsed = (res.data.guards || []).map((r) => ({
        id:          r.id,
        date:        r.date        || "",
        siteCode:    r.siteCode    || selectedProject || "",
        name:        r.name        || "",
        designation: r.designation || "",
        department:  r.department  || "",
        status:      r.status      || "",
        inTime:      r.inTime      || "",
        outTime:     r.outTime     || "",
        shift:       r.shift       || "Day",
        remarks:     r.remarks     || "",
        workingHrs:  "",
        otHrs: "",
        type: "guard",
      }));

      // ═══ STAFF CONTACTS PARSING ═══
      const staffContactsParsed = (res.data.staffContacts || res.data.contacts || []).map((r, i) => ({
        id:          r.id,
        sNo:         i + 1,
        site:        r.site        || "",
        empId:       r.empId       || "",
        joiningDate: r.joiningDate || "",
        email:       r.email       || "",
        name:        r.name        || "",
        designation: r.designation || "",
        department:  r.department  || "",
        manager:     r.manager     || "",
        contact:     r.contact     || "",
        sheetType: "staffContact",
        type: "staffContact",
      }));

      // ═══ GUARD CONTACTS PARSING ═══
      const guardContactsParsed = (res.data.guardContacts || []).map((r, i) => ({
        id:          r.id,
        sNo:         i + 1,
        site:        r.site        || "",
        name:        r.name        || "",
        joiningDate: r.joiningDate || "",
        designation: r.designation || "",
        status:      r.status      || "",
        shift:       r.shift       || "",
        contact:     r.contact     || "",
        remarks:     r.remarks     || "",
        sheetType: "guardContact",
        type: "guardContact",
      }));

      setStaffData(staffParsed);
      setGuardData(guardParsed);
      setStaffContacts(staffContactsParsed);
      setGuardContacts(guardContactsParsed);
      _cache[selectedProject] = { staff: staffParsed, guard: guardParsed, staffContacts: staffContactsParsed, guardContacts: guardContactsParsed };
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
      await API.patch(`/api/attendance/update/${selectedProject}/${sheet}/${data.id}`, payload);
      delete _cache[selectedProject];
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
      delete _cache[selectedProject];
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
    if (data.type === "staff") {
      return {
        date:        data.date,
        siteCode:    data.siteCode || selectedProject,
        name:        data.name,
        designation: data.designation,
        department:  data.department || "",
        status:      data.status,
        inTime:      data.inTime  || "",
        outTime:     data.outTime || "",
        shift:       data.shift   || "Day",
        remarks:     data.remarks || "",
      };
    }
    if (data.type === "guard") {
      return {
        date:        data.date,
        siteCode:    data.siteCode || selectedProject,
        name:        data.name,
        designation: data.designation,
        department:  data.department || "",
        status:      data.status,
        inTime:      data.inTime  || "",
        outTime:     data.outTime || "",
        shift:       data.shift   || "Day",
        remarks:     data.remarks || "",
      };
    }
    if (data.type === "staffContact") {
      return {
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
        name:        data.name,
        joiningDate: data.joiningDate,
        designation: data.designation || "Security Guard",
        status:      data.status      || "Deactive",
        shift:       data.shift       || "",
        contactNo:   data.contact     || data.contactNo,
        remarks:     data.remarks     || "",
      };
    }
    return data;
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
      delete _cache[selectedProject];
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
