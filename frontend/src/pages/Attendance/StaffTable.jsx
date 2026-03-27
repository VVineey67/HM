// StaffTable.jsx
// UI-only component for Staff Attendance Table (PDF: 9 columns)

import React from "react";
import StatusBadge from "./StatusBadge";
import Pagination from "./Pagination";
import { excelTimeToDisplay, formatDate } from "./utils";

const StaffTable = ({
  rows = [],
  page,
  totalPages,
  onPrev,
  onNext,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="bg-white">
      {/* Simple Header */}
      <div className="px-4 py-3 bg-gray-100 border border-gray-400 border-b-0">
        <h2 className="text-lg font-bold text-gray-800">Staff Attendance Records</h2>
      </div>

      {/* Table - Excel Style */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr>
              <th className="px-4 py-2 text-center text-xs font-bold text-gray-700 border border-gray-400 bg-gray-100">Date</th>
              <th className="px-4 py-2 text-center text-xs font-bold text-gray-700 border border-gray-400 bg-gray-100">Name</th>
              <th className="px-4 py-2 text-center text-xs font-bold text-gray-700 border border-gray-400 bg-gray-100">Designation</th>
              <th className="px-4 py-2 text-center text-xs font-bold text-gray-700 border border-gray-400 bg-gray-100">Status</th>
              <th className="px-4 py-2 text-center text-xs font-bold text-gray-700 border border-gray-400 bg-gray-100">In Time</th>
              <th className="px-4 py-2 text-center text-xs font-bold text-gray-700 border border-gray-400 bg-gray-100">Out Time</th>
              <th className="px-4 py-2 text-center text-xs font-bold text-gray-700 border border-gray-400 bg-gray-100">Working Hrs</th>
              <th className="px-4 py-2 text-center text-xs font-bold text-gray-700 border border-gray-400 bg-gray-100">OT Hrs</th>
              <th className="px-4 py-2 text-center text-xs font-bold text-gray-700 border border-gray-400 bg-gray-100">Remarks</th>
              <th className="px-4 py-2 text-center text-xs font-bold text-gray-700 border border-gray-400 bg-gray-100">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td className="px-4 py-2 text-center text-gray-700 border border-gray-400">{formatDate(r.date)}</td>
                <td className="px-4 py-2 text-center font-medium text-gray-900 border border-gray-400">{r.name}</td>
                <td className="px-4 py-2 text-center text-gray-700 border border-gray-400">{r.designation}</td>
                <td className="px-4 py-2 text-center border border-gray-400">
                  <div className="flex justify-center">
                    <StatusBadge status={r.status} />
                  </div>
                </td>
                <td className="px-4 py-2 text-center font-mono text-gray-700 border border-gray-400">{excelTimeToDisplay(r.inTime)}</td>
                <td className="px-4 py-2 text-center font-mono text-gray-700 border border-gray-400">{excelTimeToDisplay(r.outTime)}</td>
                <td className="px-4 py-2 text-center font-mono text-gray-700 border border-gray-400">{r.workingHrs}</td>
                <td className="px-4 py-2 text-center font-mono text-gray-700 border border-gray-400">{r.otHrs}</td>
                <td className="px-4 py-2 text-center text-gray-700 border border-gray-400">{r.remarks || '-'}</td>
                <td className="px-4 py-2 text-center border border-gray-400">
                  <button
                    onClick={() => onEdit(r)}
                    className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 mr-1"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(r)}
                    className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan="10" className="px-4 py-4 text-center text-gray-500 border border-gray-400">
                  No attendance records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-4 py-2 border border-gray-400 border-t-0 bg-gray-50">
        <Pagination
          page={page}
          totalPages={totalPages}
          onPrev={onPrev}
          onNext={onNext}
        />
      </div>
    </div>
  );
};

export default StaffTable;