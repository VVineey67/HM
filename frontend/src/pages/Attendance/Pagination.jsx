// Pagination.jsx
// Reusable pagination component for all tables

import React from "react";

const Pagination = ({ page, totalPages, onPrev, onNext }) => {
  return (
    <div className="flex justify-end items-center gap-4 p-4 select-none">

      {/* Previous Button */}
      <button
        onClick={onPrev}
        disabled={page === 1}
        className={`px-4 py-1 rounded-lg bg-gray-200 text-sm font-medium 
        ${page === 1 ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-300"}`}
      >
        Previous
      </button>

      {/* Page Indicator */}
      <span className="font-semibold text-sm">
        Page {page} / {totalPages}
      </span>

      {/* Next Button */}
      <button
        onClick={onNext}
        disabled={page === totalPages}
        className={`px-4 py-1 rounded-lg bg-gray-200 text-sm font-medium 
        ${page === totalPages ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-300"}`}
      >
        Next
      </button>
    </div>
  );
};

export default Pagination;
