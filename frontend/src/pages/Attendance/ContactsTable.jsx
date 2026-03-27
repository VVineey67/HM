// ContactsTable.jsx
// Master Contact Sheet UI (PDF Spec)

import React from "react";
import Pagination from "./Pagination";

const ContactsTable = ({
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
        <h2 className="text-lg font-bold text-gray-800">Contacts</h2>
      </div>

      {/* Table - Excel Style */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr>
              <th className="px-4 py-2 text-center text-xs font-bold text-gray-700 border border-gray-400 bg-gray-100">S.No</th>
              <th className="px-4 py-2 text-center text-xs font-bold text-gray-700 border border-gray-400 bg-gray-100">Site</th>
              <th className="px-4 py-2 text-center text-xs font-bold text-gray-700 border border-gray-400 bg-gray-100">Name</th>
              <th className="px-4 py-2 text-center text-xs font-bold text-gray-700 border border-gray-400 bg-gray-100">Designation</th>
              <th className="px-4 py-2 text-center text-xs font-bold text-gray-700 border border-gray-400 bg-gray-100">Manager</th>
              <th className="px-4 py-2 text-center text-xs font-bold text-gray-700 border border-gray-400 bg-gray-100">Contact</th>
              <th className="px-4 py-2 text-center text-xs font-bold text-gray-700 border border-gray-400 bg-gray-100">Email</th>
              <th className="px-4 py-2 text-center text-xs font-bold text-gray-700 border border-gray-400 bg-gray-100">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c, i) => (
              <tr key={i}>
                <td className="px-4 py-2 text-center text-gray-700 border border-gray-400">{c.sNo}</td>
                <td className="px-4 py-2 text-center text-gray-700 border border-gray-400">{c.site}</td>
                <td className="px-4 py-2 text-center font-medium text-gray-900 border border-gray-400">{c.name}</td>
                <td className="px-4 py-2 text-center text-gray-700 border border-gray-400">{c.designation}</td>
                <td className="px-4 py-2 text-center text-gray-700 border border-gray-400">{c.manager}</td>
                <td className="px-4 py-2 text-center font-mono text-gray-700 border border-gray-400">{c.contact}</td>
                <td className="px-4 py-2 text-center text-gray-700 border border-gray-400">{c.email}</td>
                <td className="px-4 py-2 text-center border border-gray-400">
                  <button
                    onClick={() => onEdit(c)}
                    className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 mr-1"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(c)}
                    className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan="8" className="px-4 py-4 text-center text-gray-500 border border-gray-400">
                  No contacts found
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

export default ContactsTable;