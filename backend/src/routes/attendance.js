const express = require("express");
const router = express.Router();
const multer = require("multer");
const graphHelper = require("../helpers/graphHelper");
const calcHelper = require("../helpers/calcHelper");

const upload = multer({ storage: multer.memoryStorage() });

/**
 * 1. READ: Staff + Guard + Contact
 * GET /api/attendance/read/:projectId
 */
router.get("/read/:projectId", async (req, res) => {
  try {
    const { projectId } = req.params;
    const filePath = `/Autox/${projectId}/Staff Attendance/Attendance.xlsx`;

    const safeRead = (sheet) =>
      graphHelper.readSheet(filePath, sheet).catch((e) => {
        console.warn(`Sheet '${sheet}' not found or error:`, e.message);
        return [];
      });

    const [staffData, guardData, staffContactData, guardContactData] = await Promise.all([
      safeRead(projectId),
      safeRead("Guard"),
      safeRead("SC"),
      safeRead("GC"),
    ]);

    /* ================= STAFF (AUTO CALC ON READ) ================= */
    // Excel columns: Date[0], SiteCod[1], Name[2], Designation[3], Department[4],
    //                Status[5], InTime[6], OutTime[7], Shift[8], Remarks[9]
    const staffWithCalc = (staffData || []).slice(1).map((r) => {
      const { workingHrs, otHrs } =
        calcHelper.calculateAttendance(r[6], r[7]);

      return [
        r[0],        // [0] Date
        r[1] || "",  // [1] SiteCod
        r[2],        // [2] Name
        r[3] || "",  // [3] Designation
        r[4] || "",  // [4] Department
        r[5] || "",  // [5] Status
        r[6],        // [6] InTime decimal
        r[7],        // [7] OutTime decimal
        r[8] || "Day", // [8] Shift
        workingHrs,  // [9] Working Hrs (calculated)
        otHrs,       // [10] OT Hrs (calculated)
        r[9] || "",  // [11] Remarks
      ];
    });

    res.json({
      staff: staffWithCalc,
      guards: guardData,
      staffContacts: staffContactData,
      guardContacts: guardContactData,
      contacts: staffContactData
    });
  } catch (err) {
    console.error("Read Error:", err.message);
    res.status(500).json({ error: "Failed to fetch data from sheets" });
  }
});

/**
 * 2. ADD
 */
router.post("/add/:projectId/:sheetName", async (req, res) => {
  try {
    const { projectId, sheetName } = req.params;
    const data = req.body;
    const filePath = `/Autox/${projectId}/Staff Attendance/Attendance.xlsx`;

    const targetSheet =
      sheetName === "Staff" ? projectId :
      sheetName === "Contact" ? "SC" :
      sheetName;

    // Duplicate EmpID check for Staff Contact (SC)
    if ((sheetName === "Contact" || sheetName === "SC") && data.empId) {
      const existing = await graphHelper.readSheet(filePath, "SC").catch(() => []);
      const isDuplicate = (existing || []).slice(1).some(row => row[2] && String(row[2]).toLowerCase() === String(data.empId).toLowerCase());
      if (isDuplicate) {
        return res.status(400).json({ error: "Duplicate Employee ID", detail: `EmpID "${data.empId}" is already registered` });
      }
    }

    const tableName = await graphHelper.getFirstTableName(filePath, targetSheet);

    let payload = [];

    if (sheetName === "Staff") {
      // Excel Staff columns: Date, SiteCod, Name, Designation, Department, Status, InTime, OutTime, Shift, Remarks
      payload = [
        calcHelper.jsToExcelDate(data.date),
        data.siteCode || data.site || projectId,
        data.name || "",
        data.designation || "",
        data.department || "",
        data.status || "Absent",
        calcHelper.timeStringToDecimal(data.inTime),
        calcHelper.timeStringToDecimal(data.outTime),
        data.shift || "Day",
        data.remarks || ""
      ];
    } else if (sheetName === "Guard") {
      // Excel Guard columns: Date, SiteCod, Name, Type, Location, Status, InTime, OutTime, Shift, Remarks
      payload = [
        calcHelper.jsToExcelDate(data.date),
        data.siteCode || data.site || projectId,
        data.name || "",
        data.designation || data.type || "Security Guard",
        data.department || data.location || "",
        data.status || "Absent",
        calcHelper.timeStringToDecimal(data.inTime),
        calcHelper.timeStringToDecimal(data.outTime),
        data.shift || "Day",
        data.remarks || ""
      ];
    } else if (sheetName === "Contact" || sheetName === "SC") {
      payload = [
        data.sNo,
        data.site || projectId,
        data.empId,
        calcHelper.jsToExcelDate(data.joiningDate),
        data.emailId,
        data.name,
        data.designation,
        data.department || "",
        data.manager,
        data.contactNo
      ];
    } else if (sheetName === "GC") {
      payload = [
        data.sNo,
        data.site || projectId,
        data.name || "",
        calcHelper.jsToExcelDate(data.joiningDate),
        data.designation || "Security Guard",
        data.status || "Deactive",
        data.shift || "",
        data.contactNo || "",
        data.remarks || ""
      ];
    }

    await graphHelper.addRows(filePath, targetSheet, tableName, [payload]);
    res.json({ success: true });
  } catch (err) {
    console.error("ADD ERROR:", err?.response?.data || err.message);
    res.status(500).json({ error: "Failed to add record", detail: err?.response?.data?.error?.message || err.message });
  }
});

/**
 * 3. UPDATE
 */
router.patch("/update/:projectId/:sheetName/:rowIndex", async (req, res) => {
  try {
    const { projectId, sheetName, rowIndex } = req.params;
    const data = req.body;
    const filePath = `/Autox/${projectId}/Staff Attendance/Attendance.xlsx`;

    const targetSheet =
      sheetName === "Staff" ? projectId :
      sheetName === "Contact" ? "SC" :
      sheetName;
    const tableName = await graphHelper.getFirstTableName(filePath, targetSheet);

    let payload = [];

    if (sheetName === "Staff") {
      // Excel Staff columns: Date, SiteCod, Name, Designation, Department, Status, InTime, OutTime, Shift, Remarks
      payload = [
        calcHelper.jsToExcelDate(data.date),
        data.siteCode || data.site || projectId,
        data.name || "",
        data.designation || "",
        data.department || "",
        data.status || "Absent",
        calcHelper.timeStringToDecimal(data.inTime),
        calcHelper.timeStringToDecimal(data.outTime),
        data.shift || "Day",
        data.remarks || ""
      ];
    } else if (sheetName === "Guard") {
      // Excel Guard columns: Date, SiteCod, Name, Type, Location, Status, InTime, OutTime, Shift, Remarks
      payload = [
        calcHelper.jsToExcelDate(data.date),
        data.siteCode || data.site || projectId,
        data.name || "",
        data.designation || data.type || "Security Guard",
        data.department || data.location || "",
        data.status || "Absent",
        calcHelper.timeStringToDecimal(data.inTime),
        calcHelper.timeStringToDecimal(data.outTime),
        data.shift || "Day",
        data.remarks || ""
      ];
    } else if (sheetName === "Contact" || sheetName === "SC") {
      payload = [
        data.sNo,
        data.site || projectId,
        data.empId,
        calcHelper.jsToExcelDate(data.joiningDate),
        data.emailId,
        data.name,
        data.designation,
        data.department || "",
        data.manager,
        data.contactNo
      ];
    } else if (sheetName === "GC") {
      payload = [
        data.sNo,
        data.site || projectId,
        data.name || "",
        calcHelper.jsToExcelDate(data.joiningDate),
        data.designation || "Security Guard",
        data.status || "Deactive",
        data.shift || "",
        data.contactNo || "",
        data.remarks || ""
      ];
    }

    await graphHelper.updateRow(
      filePath,
      targetSheet,
      tableName,
      parseInt(rowIndex),
      payload
    );

    res.json({ success: true });
  } catch (err) {
    console.error("UPDATE ERROR:", err?.response?.data || err.message);
    res.status(500).json({ error: "Update failed", detail: err?.response?.data?.error?.message || err.message });
  }
});

/**
 * 4. DELETE
 */
router.delete("/delete/:projectId/:sheetName/:rowIndex", async (req, res) => {
  try {
    const { projectId, sheetName, rowIndex } = req.params;
    const filePath = `/Autox/${projectId}/Staff Attendance/Attendance.xlsx`;

    const targetSheet = sheetName === "Staff" ? projectId : sheetName;
    const tableName = await graphHelper.getFirstTableName(filePath, targetSheet);

    await graphHelper.deleteRow(
      filePath,
      targetSheet,
      tableName,
      parseInt(rowIndex)
    );

    res.json({ success: true });
  } catch (err) {
    console.error("DELETE ERROR:", err?.response?.data || err.message);
    res.status(500).json({ error: "Delete failed", detail: err?.response?.data?.error?.message || err.message });
  }
});

/**
 * 5. BULK UPLOAD
 * POST /api/attendance/bulk-upload/:projectId/:type
 * Accepts CSV file, validates format, appends to Excel table
 */

// Expected headers per type (must match Excel table exactly)
const EXPECTED_HEADERS = {
  staff:   ["Date", "SiteCode", "Name", "Designation", "Department", "Status", "InTime", "OutTime", "Shift", "Remarks"],
  guard:   ["Date", "SiteCode", "Name", "Type", "Location", "Status", "InTime", "OutTime", "Shift", "Remarks"],
  contact: ["S.No", "Site", "EmpID", "JoiningDate", "Email", "Name", "Designation", "Department", "Manager", "Contact"],
  sc:      ["S.No", "Site", "EmpID", "JoiningDate", "Email", "Name", "Designation", "Department", "Manager", "Contact"],
  gc:      ["S.No", "Site", "Name", "JoiningDate", "Designation", "Status", "ShiftDuty", "ContactNo", "Remarks"]
};

// Parse a single CSV line into array of fields
function parseCSVLine(line) {
  const result = [];
  let cur = "", inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQuote = !inQuote; continue; }
    if (ch === "," && !inQuote) { result.push(cur.trim()); cur = ""; continue; }
    cur += ch;
  }
  result.push(cur.trim());
  return result;
}

const normalizeHeader = (h) =>
  String(h || "").toLowerCase().replace(/[^a-z0-9]/g, "");

router.post("/bulk-upload/:projectId/:type", upload.single("file"), async (req, res) => {
  try {
    const { projectId, type } = req.params;
    const filePath = `/Autox/${projectId}/Staff Attendance/Attendance.xlsx`;

    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const expected = EXPECTED_HEADERS[type];
    if (!expected) return res.status(400).json({ error: `Unknown type: ${type}` });

    // Parse CSV
    const csv = req.file.buffer.toString("utf-8").replace(/^\uFEFF/, ""); // strip BOM
    const lines = csv.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) return res.status(400).json({ error: "CSV file is empty or has no data rows" });

    // Validate header row
    const headerRow = parseCSVLine(lines[0]).map(h => h.replace(/^"|"$/g, "").trim());
    const missingCols = expected.filter((h, i) => normalizeHeader(headerRow[i]) !== normalizeHeader(h));
    if (missingCols.length > 0 || headerRow.length < expected.length) {
      return res.status(400).json({
        error: "Wrong column format",
        detail: `Expected columns: ${expected.join(", ")}\nGot: ${headerRow.join(", ")}\nMissing/wrong: ${missingCols.join(", ") || "column count mismatch"}`
      });
    }

    const dataLines = lines.slice(1);
    const errors = [];
    const rows = [];

    dataLines.forEach((line, idx) => {
      const rowNum = idx + 2; // +2 because of 1-based + header row
      const clean = parseCSVLine(line).map(c => c.replace(/^"|"$/g, "").trim());

      if (clean.every(c => !c)) return; // skip blank rows

      if (type === "staff") {
        // Validate required fields
        // CSV columns: Date[0], SiteCode[1], Name[2], Designation[3], Department[4], Status[5], InTime[6], OutTime[7], Shift[8], Remarks[9]
        if (!clean[0]) { errors.push(`Row ${rowNum}: Date is required (format: YYYY-MM-DD)`); return; }
        if (!clean[2]) { errors.push(`Row ${rowNum}: Name is required`); return; }
        const validStatuses = ["Present", "Absent", "Annual Leave", "Comp Off", "Holiday", "On Duty", "Week Off"];
        if (clean[5] && !validStatuses.includes(clean[5])) {
          errors.push(`Row ${rowNum}: Status "${clean[5]}" is invalid. Use: ${validStatuses.join(", ")}`);
        }
        const inD = calcHelper.timeStringToDecimal(clean[6]);
        const outD = calcHelper.timeStringToDecimal(clean[7]);
        rows.push([
          calcHelper.jsToExcelDate(clean[0]),
          clean[1] || projectId,
          clean[2],
          clean[3] || "",
          clean[4] || "",
          clean[5] || "Absent",
          inD,
          outD,
          clean[8] || "Day",
          clean[9] || ""
        ]);
      } else if (type === "guard") {
        if (!clean[0]) { errors.push(`Row ${rowNum}: Date is required (format: YYYY-MM-DD)`); return; }
        if (!clean[2]) { errors.push(`Row ${rowNum}: Name is required`); return; }
        const validShifts = ["Day", "Night"];
        if (clean[8] && !validShifts.includes(clean[8])) {
          errors.push(`Row ${rowNum}: Shift "${clean[8]}" is invalid. Use: Day or Night`);
        }
        rows.push([
          calcHelper.jsToExcelDate(clean[0]),
          clean[1] || projectId,
          clean[2],
          clean[3] || "Security Guard",
          clean[4] || "",
          clean[5] || "Absent",
          calcHelper.timeStringToDecimal(clean[6]),
          calcHelper.timeStringToDecimal(clean[7]),
          clean[8] || "Day",
          clean[9] || ""
        ]);
      } else if (type === "contact" || type === "sc") {
        if (!clean[5]) { errors.push(`Row ${rowNum}: Name is required`); return; }
        rows.push([
          clean[0] || (idx + 1),
          clean[1] || projectId,
          clean[2] || "",
          calcHelper.jsToExcelDate(clean[3]),
          clean[4] || "",
          clean[5],
          clean[6] || "",
          clean[7] || "",
          clean[8] || "",
          clean[9] || ""
        ]);
      } else if (type === "gc") {
        if (!clean[2]) { errors.push(`Row ${rowNum}: Name is required`); return; }
        rows.push([
          clean[0] || (idx + 1),
          clean[1] || projectId,
          clean[2] || "",
          calcHelper.jsToExcelDate(clean[3]),
          clean[4] || "Security Guard",
          clean[5] || "Deactive",
          clean[6] || "",
          clean[7] || "",
          clean[8] || ""
        ]);
      }
    });

    // If there are validation errors, return them all at once
    if (errors.length > 0) {
      return res.status(400).json({ error: "Validation errors in CSV", detail: errors.join("\n") });
    }

    if (!rows.length) return res.status(400).json({ error: "No valid rows found in CSV" });

    const sheetMap = { staff: projectId, guard: "Guard", contact: "SC", sc: "SC", gc: "GC" };
    const targetSheet = sheetMap[type] || type;
    const tableName = await graphHelper.getFirstTableName(filePath, targetSheet);

    await graphHelper.addRows(filePath, targetSheet, tableName, rows);
    res.json({ success: true, rowsAdded: rows.length });
  } catch (err) {
    console.error("BULK UPLOAD ERROR:", err?.response?.data || err.message);
    res.status(500).json({ error: "Bulk upload failed", detail: err?.response?.data?.error?.message || err.message });
  }
});

module.exports = router;
