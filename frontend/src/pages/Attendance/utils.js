// utils.js
// Full PDF-based utilities: time, date, filters, excel, analytics, export

import { utils, writeFile } from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/* =======================================================
    DATE UTILITIES
======================================================= */
export const excelSerialToJSDate = (serial) => {
  if (!serial) return "";
  const utc_days = Math.floor(serial - 25569);
  const utc_value = utc_days * 86400 * 1000;
  return new Date(utc_value);
};

export const excelToJSDate = (value) => {
  if (!value) return "";
  if (typeof value === "string") {
    const d = new Date(value);
    if (!isNaN(d)) return d.toISOString().split("T")[0];
    return "";
  }
  if (typeof value === "number") {
    const date = excelSerialToJSDate(value);
    return date.toISOString().split("T")[0];
  }
  return "";
};

export const formatDate = (d) => {
  if (!d) return "";
  const date = new Date(d);
  return `${date.getDate().toString().padStart(2, "0")}-${date.toLocaleString(
    "en-GB",
    { month: "short" }
  )}-${date.getFullYear().toString().slice(-2)}`;
};

/* =======================================================
    TIME UTILITIES
======================================================= */
export const excelTimeToDisplay = (time) => {
  if (!time || time === "Na") return "Na";
  const num = Number(time);
  if (isNaN(num)) return "Na";

  const mins = Math.round(num * 1440); // convert excel fraction → minutes
  let h = Math.floor(mins / 60);
  const m = mins % 60;

  const ap = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;

  return `${h}:${m.toString().padStart(2, "0")} ${ap}`;
};

export const parseHrsMinString = (str) => {
  if (!str) return 0;
  const [hPart, mPart] = str.split("Hrs");
  const h = parseInt(hPart);
  const m = parseInt(mPart.replace("Min", ""));
  return h * 60 + m;
};

export const minsToHrsMin = (mins) => {
  if (!mins || mins <= 0) return "0Hrs 0Min";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}Hrs ${m}Min`;
};

/* =======================================================
    ANALYTICS UTILITIES (PDF LOGIC)
======================================================= */
export const totalWorkingHrs = (rows) => {
  let total = 0;
  rows.forEach((r) => {
    total += parseHrsMinString(r.workingHrs || "0Hrs 0Min");
  });
  return minsToHrsMin(total);
};

export const totalOTHrs = (rows) => {
  let total = 0;
  rows.forEach((r) => {
    total += parseHrsMinString(r.otHrs || "0Hrs 0Min");
  });
  return minsToHrsMin(total);
};

/* =======================================================
    FILTER ENGINE
======================================================= */
export const filterByName = (rows, name) => {
  if (!name || name === "All") return rows;
  return rows.filter((r) => r.name?.toLowerCase() === name.toLowerCase());
};

export const filterByDate = (rows, selectedDate) => {
  if (!selectedDate) return rows;
  return rows.filter((r) => r.date === selectedDate);
};

export const filterByDateRange = (rows, start, end) => {
  if (!start || !end) return rows;
  return rows.filter(
    (r) => r.date >= start && r.date <= end
  );
};

export const globalSearch = (rows, query) => {
  if (!query) return rows;
  const q = query.toLowerCase();
  return rows.filter((r) =>
    Object.values(r).some((v) => String(v).toLowerCase().includes(q))
  );
};

/* =======================================================
    EXPORT UTILITIES
======================================================= */
export const exportExcel = (rows, filename = "Export") => {
  const ws = utils.json_to_sheet(rows);
  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, "Data");
  writeFile(wb, `${filename}.xlsx`);
};

export const exportPDF = (rows, filename = "Export") => {
  if (!rows || rows.length === 0) {
    alert("No data to export!");
    return;
  }

  // Create new PDF document
  const doc = new jsPDF({
    orientation: rows.length > 10 ? "landscape" : "portrait",
    unit: "mm",
  });

  // Add title - Centered
  doc.setFontSize(18);
  doc.setTextColor(33, 33, 33);
  doc.setFont("helvetica", "bold");
  const title = `${filename.replace(/_/g, " ")} Report`;
  const titleWidth = doc.getTextWidth(title);
  const pageWidth = doc.internal.pageSize.width;
  doc.text(title, (pageWidth - titleWidth) / 2, 15);

  // Add date - Centered
  doc.setFontSize(10);
  doc.setTextColor(128, 128, 128);
  doc.setFont("helvetica", "normal");
  const dateText = `Generated on: ${new Date().toLocaleString()}`;
  const dateWidth = doc.getTextWidth(dateText);
  doc.text(dateText, (pageWidth - dateWidth) / 2, 22);

  // Define columns based on first row keys
  const columns = Object.keys(rows[0]).map(key => ({
    header: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
    dataKey: key
  }));

  // Prepare data with proper time formatting
  const tableData = rows.map(row => 
    columns.map(col => {
      let value = row[col.dataKey];
      if (value === null || value === undefined) return "";
      
      // Format date fields
      if (col.dataKey === "date" && value) {
        return formatDate(value);
      }
      
      // Format time fields (inTime, outTime)
      if ((col.dataKey === "inTime" || col.dataKey === "outTime") && value) {
        // Check if it's a decimal number (Excel time format)
        if (typeof value === "number" && !isNaN(value)) {
          return excelTimeToDisplay(value);
        }
        // If it's already a formatted time string, return as is
        return String(value);
      }
      
      // Format working hours and OT hours (keep as is)
      if ((col.dataKey === "workingHrs" || col.dataKey === "otHrs") && value) {
        return String(value);
      }
      
      return String(value);
    })
  );

  // Generate table with centered content
  autoTable(doc, {
    head: [columns.map(col => col.header)],
    body: tableData,
    startY: 30,
    styles: {
      fontSize: 8,
      cellPadding: 2,
      lineColor: [200, 200, 200],
      lineWidth: 0.1,
      halign: "center", // Center all cell content
      valign: "middle", // Vertical center
    },
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      halign: "center",
      valign: "middle",
    },
    bodyStyles: {
      halign: "center",
      valign: "middle",
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
      halign: "center",
      valign: "middle",
    },
    margin: { top: 30, left: 14, right: 14 },
    didDrawPage: (data) => {
      // Add footer on each page - Centered
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      const pageText = `Page ${data.pageNumber}`;
      const pageTextWidth = doc.getTextWidth(pageText);
      doc.text(
        pageText,
        (doc.internal.pageSize.width - pageTextWidth) / 2,
        doc.internal.pageSize.height - 10
      );
    },
  });

  // Add summary at the end - All Centered
  const finalY = doc.lastAutoTable.finalY + 10;
  
  doc.setFontSize(12);
  doc.setTextColor(33, 33, 33);
  doc.setFont("helvetica", "bold");
  const summaryTitle = "Summary";
  const summaryTitleWidth = doc.getTextWidth(summaryTitle);
  doc.text(summaryTitle, (pageWidth - summaryTitleWidth) / 2, finalY);
  
  doc.setFontSize(10);
  doc.setTextColor(75, 85, 99);
  doc.setFont("helvetica", "normal");
  
  let yPos = finalY + 7;
  
  // Total Records - Centered
  const totalRecordsText = `Total Records: ${rows.length}`;
  const totalRecordsWidth = doc.getTextWidth(totalRecordsText);
  doc.text(totalRecordsText, (pageWidth - totalRecordsWidth) / 2, yPos);
  yPos += 6;
  
  // Count by status if status field exists - All Centered
  if (rows[0]?.status) {
    const statusCount = rows.reduce((acc, row) => {
      acc[row.status] = (acc[row.status] || 0) + 1;
      return acc;
    }, {});
    
    Object.entries(statusCount).forEach(([status, count]) => {
      const statusText = `${status}: ${count}`;
      const statusWidth = doc.getTextWidth(statusText);
      doc.text(statusText, (pageWidth - statusWidth) / 2, yPos);
      yPos += 6;
    });
  }

  // Calculate and add total working hours - Centered
  if (rows[0]?.workingHrs) {
    const totalMins = rows.reduce((acc, row) => {
      return acc + parseHrsMinString(row.workingHrs || "0Hrs 0Min");
    }, 0);
    
    const workingHoursText = `Total Working Hours: ${minsToHrsMin(totalMins)}`;
    const workingHoursWidth = doc.getTextWidth(workingHoursText);
    doc.text(workingHoursText, (pageWidth - workingHoursWidth) / 2, yPos);
  }

  // Save the PDF
  doc.save(`${filename}.pdf`);
};

export const exportPDFWithTemplate = (rows, filename = "Export", template = "standard") => {
  // Different templates for different tabs
  if (template === "staff") {
    // Staff-specific PDF formatting
    exportPDF(rows, `Staff_${filename}`);
  } else if (template === "guard") {
    // Guard-specific PDF formatting
    exportPDF(rows, `Guard_${filename}`);
  } else {
    exportPDF(rows, filename);
  }
};

/* =======================================================
    STATUS COLOR MAP
======================================================= */
export const statusColor = {
  Present: "bg-green-100 text-green-800",
  Absent: "bg-red-100 text-red-800",
  Leave: "bg-yellow-100 text-yellow-800",
  "Half Day": "bg-amber-100 text-amber-800",
  Holiday: "bg-blue-100 text-blue-800",
  "Week Off": "bg-blue-200 text-blue-800",
};