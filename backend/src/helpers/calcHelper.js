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

module.exports = {
  jsToExcelDate,
  calculateAttendance
};