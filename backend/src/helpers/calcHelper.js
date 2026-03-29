/**
 * calcHelper.js
 * Attendance working hours & OT calculation (Excel time based)
 */

/**
 * JS Date → Excel Serial Date
 */
const jsToExcelDate = (date) => {
  if (!date) return "";
  const d = new Date(date);
  return Math.floor((d - new Date("1899-12-30")) / 86400000);
};

/**
 * Excel Time (fraction of day) → minutes
 * Example: 0.3958 ≈ 9:30 AM
 */
const timeToMinutes = (time) => {
  if (!time) return 0;

  const num = Number(time);
  if (isNaN(num)) return 0;

  return Math.round(num * 1440); // 24 * 60
};

/**
 * Minutes → Hrs Min format
 * Example: 510 → 8Hrs 30Min
 */
const minutesToHrsMin = (mins) => {
  if (!mins || mins <= 0) return "0Hrs 0Min";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}Hrs ${m}Min`;
};

/**
 * Main Attendance Calculation
 */
const calculateAttendance = (inTime, outTime) => {
  const inMin = timeToMinutes(inTime);
  const outMin = timeToMinutes(outTime);

  // Invalid / missing time
  if (!inMin || !outMin || outMin <= inMin) {
    return {
      workingHrs: "0Hrs 0Min",
      otHrs: "0Hrs 0Min"
    };
  }

  const totalMinutes = outMin - inMin;

  const STANDARD_SHIFT = 8 * 60; // 8 hours
  const otMinutes =
    totalMinutes > STANDARD_SHIFT
      ? totalMinutes - STANDARD_SHIFT
      : 0;

  return {
    workingHrs: minutesToHrsMin(totalMinutes),
    otHrs: minutesToHrsMin(otMinutes)
  };
};

/**
 * Convert time to Excel decimal fraction
 * Handles: "09:30", "9:30 AM", 0.3958 (already decimal), null/empty
 */
const timeStringToDecimal = (val) => {
  if (val === null || val === undefined || val === "") return null;
  // Already a decimal (Excel format)
  if (typeof val === "number") return val;
  const s = String(val).trim();
  // HH:MM (24hr from HTML time input)
  const hm = s.match(/^(\d{1,2}):(\d{2})$/);
  if (hm) {
    const h = parseInt(hm[1]), m = parseInt(hm[2]);
    return (h * 60 + m) / 1440;
  }
  // HH:MM AM/PM
  const ampm = s.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (ampm) {
    let h = parseInt(ampm[1]); const m = parseInt(ampm[2]);
    if (ampm[3].toUpperCase() === "PM" && h !== 12) h += 12;
    if (ampm[3].toUpperCase() === "AM" && h === 12) h = 0;
    return (h * 60 + m) / 1440;
  }
  return null;
};

module.exports = {
  jsToExcelDate,
  calculateAttendance,
  timeStringToDecimal
};