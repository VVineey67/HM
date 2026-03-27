// StatusBadge.jsx
// Pure UI component → Status ke hisaab se color badge return karta hai

import React from "react";
import { statusColor } from "./utils";   // color map utils.js se laa rahe hain

const StatusBadge = ({ status }) => {
  const cls = statusColor[status] || "bg-gray-200 text-gray-700";

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${cls}`}
    >
      {status || "Absent"}
    </span>
  );
};

export default StatusBadge;
