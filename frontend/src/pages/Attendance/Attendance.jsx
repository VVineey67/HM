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
  const [contactData, setContactData] = useState([]);
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
    setLoading(true);
    try {
      const res = await API.get(`/api/attendance/read/${selectedProject}`);

      // ═══ STAFF PARSING ═══
      // Backend already slices header — do NOT slice again here.
      // Backend returns: [Date, Name, Desig, Dept, Status, InTime, WorkHrs, OTHrs, OutTime]
      const staffParsed = (res.data.staff || []).map((r, i) => ({
        id: i,
        date: excelToJSDate(r[0]),
        name: r[1] || "",
        designation: r[2] || "",
        department: r[3] || "",
        status: r[4] || "",
        inTime: r[5],           // decimal like 0.3958
        outTime: r[8],          // decimal like 0.75 (index 8!)
        workingHrs: r[6] || "", // "0Hrs 0Min"
        otHrs: r[7] || "",      // "0Hrs 0Min"
        shift: "Day",           // Staff doesn't have shift column, default Day
        remarks: "",
        type: "staff",
      }));

      // ═══ GUARD PARSING ═══
      // RAW: [0]=Date(serial), [1]=Name, [2]=Designation, [3]=Department,
      //       [4]=Status, [5]=InTime(decimal), [6]=OutTime(decimal), [7]=Shift, [8]=Remarks
      const guardParsed = (res.data.guards || []).slice(1).map((r, i) => ({
        id: i,
        date: excelToJSDate(r[0]),
        name: r[1] || "",
        designation: r[2] || "",
        department: r[3] || "",
        status: r[4] || "",
        inTime: r[5],           // decimal
        outTime: r[6],          // decimal
        shift: r[7] || "Day",
        remarks: r[8] || "",
        workingHrs: "",
        otHrs: "",
        type: "guard",
      }));

      // ═══ CONTACT PARSING ═══
      // RAW: [0]=S.No, [1]=Site, [2]=EmpID, [3]=JoiningDate, [4]=Email,
      //       [5]=Name, [6]=Designation, [7]=Manager, [8]=Contact
      const contactParsed = (res.data.contacts || []).slice(1).map((r, i) => ({
        id: i,
        sNo: r[0] || i + 1,
        site: r[1] || "",
        empId: r[2] || "",
        joiningDate: excelToJSDate(r[3]),
        email: r[4] || "",
        name: r[5] || "",
        designation: r[6] || "",
        manager: r[7] || "",
        contact: r[8] || "",
        type: "contact",
      }));

      setStaffData(staffParsed);
      setGuardData(guardParsed);
      setContactData(contactParsed);
    } catch (err) {
      console.error("Error fetching attendance:", err);
    } finally {
      setLoading(false);
    }
  };

  // ─── CRUD ────────────────────────────────────────────
  const handleEdit = () => {}; // handled locally in each tab

  const handleEditRecord = async (data) => {
    try {
      const sheetMap = { staff: "Staff", guard: "Guard", contact: "Contact" };
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
      const sheetMap = { staff: "Staff", guard: "Guard", contact: "Contact" };
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

    // Helper to convert "yyyy-MM-dd" from <input type="date"> back to "DD-Mon-YY"
    const fromHTMLDate = (dateStr) => {
      if (!dateStr) return "";
      try {
        const d = new Date(dateStr);
        const month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        return `${String(d.getUTCDate()).padStart(2, '0')}-${month[d.getUTCMonth()]}-${String(d.getFullYear()).slice(-2)}`;
      } catch (e) {
        return "";
      }
    };

    if (data.type === 'staff') {
      const row = [
        fromHTMLDate(data.date), // Col 0: Date
        data.name,               // Col 1: Name
        data.designation,        // Col 2: Designation
        data.department,         // Col 3: Department
        data.status,             // Col 4: Status
        timeStrToDecimal(data.inTime), // Col 5: InTime
        data.workingHrs || "",   // Col 6: WorkingHrs
        data.otHrs || "",        // Col 7: OTHrs
        timeStrToDecimal(data.outTime) // Col 8: OutTime
      ];
      return { values: [row] }; // Send as a 2D array for sheet compatibility
    }

    if (data.type === 'guard') {
      return {
        date: fromHTMLDate(data.date),
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

    if (data.type === "contact") {
      return {
        sNo:         data.sNo,
        site:        data.site || selectedProject,
        empId:       data.empId,
        joiningDate: fromHTMLDate(data.joiningDate),
        emailId:     data.email || data.emailId,
        name:        data.name,
        designation: data.designation,
        manager:     data.manager,
        contactNo:   data.contact || data.contactNo,
      };
    }
    return data; // Fallback
  };

  const handleAddRecord = async (data) => {
    try {
      const sheetMap = { staff: "Staff", guard: "Guard", contact: "Contact" };
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
        {activeTab === 1 && <StaffTab data={staffData} onDelete={handleDelete} onBulkUpload={handleBulkUpload} onAddRecord={handleAddRecord} onEditRecord={handleEditRecord} />}
        {activeTab === 2 && <GuardTab data={guardData} onDelete={handleDelete} onBulkUpload={handleBulkUpload} onAddRecord={handleAddRecord} onEditRecord={handleEditRecord} />}
        {activeTab === 3 && <ContactsTab data={contactData} onDelete={handleDelete} onBulkUpload={handleBulkUpload} onAddRecord={handleAddRecord} onEditRecord={handleEditRecord} />}
      </div>
    </div>
  );
};

export default Attendance;
