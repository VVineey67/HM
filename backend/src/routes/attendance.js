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

    const [staffData, guardData, contactData] = await Promise.all([
      graphHelper.readSheet(filePath, projectId),
      graphHelper.readSheet(filePath, "Guard"),
      graphHelper.readSheet(filePath, "Contact")
    ]);

    /* ================= STAFF (AUTO CALC ON READ) ================= */
    const staffWithCalc = (staffData || []).slice(1).map((r) => {
      const { workingHrs, otHrs } =
        calcHelper.calculateAttendance(r[4], r[5]);

      return [
        r[0],             // Date
        r[1],             // Name
        r[2],             // Designation
        r[3] || "Absent", // Status
        r[4],             // In Time
        r[5],             // Out Time
        workingHrs,       // ✅ Working Hrs (calculated)
        otHrs,            // ✅ OT Hrs (calculated)
        r[6] || ""        // Remarks
      ];
    });

    res.json({
      staff: staffWithCalc,
      guards: guardData,
      contacts: contactData
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

    const targetSheet = sheetName === "Staff" ? projectId : sheetName;
    const tableName = await graphHelper.getFirstTableName(filePath, targetSheet);

    let payload = [];

    if (sheetName === "Staff") {
      // Excel Staff columns: Date, Name, Designation, Department, Status, InTime, OutTime, Remarks
      payload = [
        calcHelper.jsToExcelDate(data.date),
        data.name,
        data.designation,
        data.department || "",
        data.status,
        calcHelper.timeStringToDecimal(data.inTime),
        calcHelper.timeStringToDecimal(data.outTime),
        data.remarks || ""
      ];
    } else if (sheetName === "Guard") {
      // Excel Guard columns: Date, Name, Designation, Department, Status, InTime, OutTime, Shift, Remarks
      payload = [
        calcHelper.jsToExcelDate(data.date),
        data.name,
        data.designation,
        data.department || "",
        data.status,
        calcHelper.timeStringToDecimal(data.inTime),
        calcHelper.timeStringToDecimal(data.outTime),
        data.shift || "Day",
        data.remarks || ""
      ];
    } else if (sheetName === "Contact") {
      payload = [
        data.sNo,
        data.site,
        data.empId,
        data.joiningDate,
        data.emailId,
        data.name,
        data.designation,
        data.manager,
        data.contactNo
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

    const targetSheet = sheetName === "Staff" ? projectId : sheetName;
    const tableName = await graphHelper.getFirstTableName(filePath, targetSheet);

    let payload = [];

    if (sheetName === "Staff") {
      // Excel Staff columns: Date, Name, Designation, Department, Status, InTime, OutTime, Remarks
      payload = [
        calcHelper.jsToExcelDate(data.date),
        data.name,
        data.designation,
        data.department || "",
        data.status,
        calcHelper.timeStringToDecimal(data.inTime),
        calcHelper.timeStringToDecimal(data.outTime),
        data.remarks || ""
      ];
    } else if (sheetName === "Guard") {
      // Excel Guard columns: Date, Name, Designation, Department, Status, InTime, OutTime, Shift, Remarks
      payload = [
        calcHelper.jsToExcelDate(data.date),
        data.name,
        data.designation,
        data.department || "",
        data.status,
        calcHelper.timeStringToDecimal(data.inTime),
        calcHelper.timeStringToDecimal(data.outTime),
        data.shift || "Day",
        data.remarks || ""
      ];
    } else if (sheetName === "Contact") {
      payload = [
        data.sNo,
        data.site,
        data.empId,
        data.joiningDate,
        data.emailId,
        data.name,
        data.designation,
        data.manager,
        data.contactNo
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
  staff:   ["Date", "Name", "Designation", "Department", "Status", "InTime", "OutTime", "Remarks"],
  guard:   ["Date", "Name", "Designation", "Department", "Status", "InTime", "OutTime", "Shift", "Remarks"],
  contact: ["S.No", "Site", "EmpID", "JoiningDate", "Email", "Name", "Designation", "Manager", "Contact"]
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
    const missingCols = expected.filter((h, i) => headerRow[i]?.toLowerCase() !== h.toLowerCase());
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
        if (!clean[0]) { errors.push(`Row ${rowNum}: Date is required (format: YYYY-MM-DD)`); return; }
        if (!clean[1]) { errors.push(`Row ${rowNum}: Name is required`); return; }
        const validStatuses = ["Present", "Absent", "Half Day", "Late", "On Leave", "Holiday", "Week Off"];
        if (clean[4] && !validStatuses.includes(clean[4])) {
          errors.push(`Row ${rowNum}: Status "${clean[4]}" is invalid. Use: ${validStatuses.join(", ")}`);
        }
        rows.push([
          calcHelper.jsToExcelDate(clean[0]),
          clean[1],
          clean[2] || "",
          clean[3] || "",
          clean[4] || "Absent",
          calcHelper.timeStringToDecimal(clean[5]),
          calcHelper.timeStringToDecimal(clean[6]),
          clean[7] || ""
        ]);
      } else if (type === "guard") {
        if (!clean[0]) { errors.push(`Row ${rowNum}: Date is required (format: YYYY-MM-DD)`); return; }
        if (!clean[1]) { errors.push(`Row ${rowNum}: Name is required`); return; }
        const validShifts = ["Day", "Night"];
        if (clean[7] && !validShifts.includes(clean[7])) {
          errors.push(`Row ${rowNum}: Shift "${clean[7]}" is invalid. Use: Day or Night`);
        }
        rows.push([
          calcHelper.jsToExcelDate(clean[0]),
          clean[1],
          clean[2] || "",
          clean[3] || "",
          clean[4] || "Absent",
          calcHelper.timeStringToDecimal(clean[5]),
          calcHelper.timeStringToDecimal(clean[6]),
          clean[7] || "Day",
          clean[8] || ""
        ]);
      } else if (type === "contact") {
        if (!clean[5]) { errors.push(`Row ${rowNum}: Name is required`); return; }
        rows.push([
          clean[0] || (idx + 1),
          clean[1] || "",
          clean[2] || "",
          clean[3] || "",
          clean[4] || "",
          clean[5],
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

    const sheetMap = { staff: projectId, guard: "Guard", contact: "Contact" };
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
