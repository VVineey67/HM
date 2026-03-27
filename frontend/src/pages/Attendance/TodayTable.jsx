// TodayTable.jsx
// Staff + Guard combined "Today" attendance UI table (PDF Spec)

import React from "react";
import StatusBadge from "./StatusBadge";
import Pagination from "./Pagination";
import { excelTimeToDisplay, formatDate } from "./utils";

const TodayTable = ({
  rows = [],
  page,
  totalPages,
  onPrev,
  onNext,
}) => {
  return (
    <div className="bg-white rounded-xl shadow overflow-hidden mt-4">

      {/* Header */}
      <div className="p-5 bg-gray-800 text-white flex justify-between items-center">
        <h2 className="text-xl font-bold">Today's Attendance</h2>
      </div>

      {/* Table */}
      <table className="w-full text-sm">
        <thead className="bg-gray-900 text-white">
          <tr>
            <th className="p-3 text-left">Date</th>
            <th className="p-3 text-left">Name</th>
            <th className="p-3 text-left">Designation</th>
            <th className="p-3 text-center">Status</th>
            <th className="p-3 text-center">In Time</th>
            <th className="p-3 text-center">Out Time</th>
            <th className="p-3 text-center">Working/Shift</th>
            <th className="p-3 text-center">OT Hrs</th>
            <th className="p-3 text-center">Type</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b hover:bg-gray-50 transition">

              {/* Date */}
              <td className="p-3">{formatDate(r.date)}</td>

              {/* Name */}
              <td className="p-3 font-medium">{r.name}</td>

              {/* Designation */}
              <td className="p-3">{r.designation}</td>

              {/* Status */}
              <td className="p-3 text-center">
                <StatusBadge status={r.status} />
              </td>

              {/* In / Out */}
              <td className="p-3 text-center">
                {excelTimeToDisplay(r.inTime)}
              </td>

              <td className="p-3 text-center">
                {excelTimeToDisplay(r.outTime)}
              </td>

              {/* Staff → WorkingHrs, Guard → Shift */}
              <td className="p-3 text-center">
                {r.type === "staff" ? r.workingHrs : r.shift || "-"}
              </td>

              {/* Staff → OTHrs, Guard → '-' */}
              <td className="p-3 text-center">
                {r.type === "staff" ? r.otHrs : "-"}
              </td>

              {/* Type */}
              <td className="p-3 text-center capitalize">{r.type}</td>
            </tr>
          ))}

          {rows.length === 0 && (
            <tr>
              <td
                colSpan="9"
                className="p-6 text-center text-gray-500 font-medium"
              >
                No data for today
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Pagination */}
      <Pagination
        page={page}
        totalPages={totalPages}
        onPrev={onPrev}
        onNext={onNext}
      />
    </div>
  );
};

export default TodayTable;
