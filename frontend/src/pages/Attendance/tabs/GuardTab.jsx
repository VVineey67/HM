import React, { useState, useMemo } from "react";
import { GuardStatCards } from "../components/StatCards";
import { WeeklyBar, ShiftSplit } from "../components/Charts";
import AttendanceTable from "../components/AttendanceTable";
import BulkUpload from "../components/BulkUpload";
import AddRecordModal from "../components/AddRecordModal";
import { formatTime, formatDate, calcStats, calcAvgWorkingHours, calcWeeklyAttendance, getShiftSplit, isToday, getDisplayStatus, getStatusBadgeClass, formatOTDuration, formatLateDuration, getWorkingHours, ALL_STATUSES } from "../utils";

const GuardTab = ({ data, onEdit, onDelete, onBulkUpload, onAddRecord }) => {
  const [statusFilter, setStatusFilter] = useState("all");
  const [showUpload, setShowUpload] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const stats = useMemo(() => { const s = calcStats(data); s.avgHours = calcAvgWorkingHours(data); return s; }, [data]);
  const weeklyData = useMemo(() => calcWeeklyAttendance(data), [data]);
  const todayGuards = useMemo(() => data.filter(r => isToday(r.date)), [data]);
  const shiftData = useMemo(() => getShiftSplit(todayGuards), [todayGuards]);

  const columns = [
    { key: "date", label: "Date", render: r => formatDate(r.date) },
    { key: "name", label: "Name", className: "cell-bold" },
    { key: "designation", label: "Designation" },
    { key: "status", label: "Status", render: r => { const ds = getDisplayStatus(r); return <span className={`badge ${getStatusBadgeClass(ds)}`}>{ds}</span>; } },
    { key: "shift", label: "Shift" },
    { key: "inTime", label: "In", render: r => formatTime(r.inTime) },
    { key: "outTime", label: "Out", render: r => formatTime(r.outTime) },
    { key: "working", label: "Working", render: r => getWorkingHours(r) },
    { key: "ot", label: "OT", render: r => formatOTDuration(r) },
    { key: "remarks", label: "Remarks", render: r => formatLateDuration(r) || r.remarks || "-" },
  ];

  const filters = [
    { key: "status", label: "All status", options: ALL_STATUSES },
    { key: "shift", label: "All shift", options: ["Day", "Night"] },
    { type: "date" },
  ];

  return (
    <div className="tab-content">
      <div className="tab-actions">
        <button className="btn-upload" onClick={() => setShowUpload(!showUpload)}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M8 10V2M5 5l3-3 3 3M3 12v1h10v-1" /></svg>
          Bulk upload
        </button>
        <button className="btn-add" onClick={() => setShowModal(true)}>+ Add record</button>
      </div>
      <BulkUpload visible={showUpload} onUpload={(file) => { onBulkUpload?.(file, "guard"); setShowUpload(false); }} columns="Date, Name, Designation, Department, Status, In Time, Out Time, Shift, Remarks" />
      <GuardStatCards stats={stats} onStatClick={setStatusFilter} activeFilter={statusFilter} />
      <div className="charts-grid charts-2">
        <WeeklyBar data={weeklyData} />
        <ShiftSplit data={shiftData} />
      </div>
      <AttendanceTable records={data} columns={columns} filters={filters} statusFilter={statusFilter} onEdit={onEdit} onDelete={onDelete} exportFilename="Guard_Attendance" />
      <AddRecordModal visible={showModal} onClose={() => setShowModal(false)} onSave={onAddRecord} type="guard" />
    </div>
  );
};

export default GuardTab;