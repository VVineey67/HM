/**
 * calcHelper.js
 * Attendance working hours & OT calculation (Excel time based)
 */

/**
 * JS Date → Excel Serial Date
 * Accepts:
 *   ISO "2026-03-29"       (YYYY-MM-DD)
 *   "29-03-2026"           (DD-MM-YYYY)
 *   "29-3-26" / "29-03-26" (DD-MM-YY)
 *   "29-Mar-26"            (DD-Mon-YY — internal format)
 */
const MONTH_NAMES = { jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11 };

const jsToExcelDate = (date) => {
  if (!date) return "";
  let day, month, year;

  const s = String(date).trim();

  // ISO: YYYY-MM-DD
  const iso = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (iso) {
    year = parseInt(iso[1]); month = parseInt(iso[2]) - 1; day = parseInt(iso[3]);
  } else {
    // DD-MM-YYYY  or  DD-MM-YY  or  DD-Mon-YY
    const parts = s.split("-");
    if (parts.length === 3) {
      day = parseInt(parts[0]);
      const mid = parts[1];
      const yr  = parseInt(parts[2]);
      year = yr < 100 ? 2000 + yr : yr;
      // Month can be numeric ("3", "03") or name ("Mar")
      const num = parseInt(mid);
      if (!isNaN(num)) {
        month = num - 1;
      } else {
        month = MONTH_NAMES[mid.toLowerCase().slice(0, 3)] ?? 0;
      }
    }
  }

  if (isNaN(day) || isNaN(month) || isNaN(year)) return "";

  // Always use UTC to avoid timezone shift
  const d    = Date.UTC(year, month, day);
  const base = Date.UTC(1899, 11, 30);       // 1899-12-30 UTC
  return Math.floor((d - base) / 86400000);
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