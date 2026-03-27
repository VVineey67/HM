const express = require("express");
const router = express.Router();
const graphHelper = require("../helpers/graphHelper");
const calcHelper = require("../helpers/calcHelper");

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

    let payload = [];
    let tableName = "";

    if (sheetName === "Staff") {
      const { workingHrs, otHrs } =
        calcHelper.calculateAttendance(data.inTime, data.outTime);

      tableName = "StaffTable";
      payload = [
        calcHelper.jsToExcelDate(data.date),
        data.name,
        data.designation,
        data.status,
        data.inTime,
        data.outTime,
        workingHrs,
        otHrs,
        data.remarks || ""
      ];
    } else if (sheetName === "Guard") {
      tableName = "GuardTable";
      payload = [
        calcHelper.jsToExcelDate(data.date),
        data.name,
        data.designation,
        data.status,
        data.inTime,
        data.outTime,
        data.shift,
        data.remarks || ""
      ];
    } else if (sheetName === "Contact") {
      tableName = "ContactTable";
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

    const targetSheet = sheetName === "Staff" ? projectId : sheetName;

    await graphHelper.addRows(filePath, targetSheet, tableName, [payload]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to add record" });
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

    const tableName =
      sheetName === "Staff"
        ? "StaffTable"
        : sheetName === "Guard"
        ? "GuardTable"
        : "ContactTable";

    const targetSheet = sheetName === "Staff" ? projectId : sheetName;

    let payload = [];

    if (sheetName === "Staff") {
      const { workingHrs, otHrs } =
        calcHelper.calculateAttendance(data.inTime, data.outTime);

      payload = [
        calcHelper.jsToExcelDate(data.date),
        data.name,
        data.designation,
        data.status,
        data.inTime,
        data.outTime,
        workingHrs,
        otHrs,
        data.remarks || ""
      ];
    } else if (sheetName === "Guard") {
      payload = [
        calcHelper.jsToExcelDate(data.date),
        data.name,
        data.designation,
        data.status,
        data.inTime,
        data.outTime,
        data.shift,
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
      rowIndex,
      payload
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Update failed" });
  }
});

/**
 * 4. DELETE
 */
router.delete("/delete/:projectId/:sheetName/:rowIndex", async (req, res) => {
  try {
    const { projectId, sheetName, rowIndex } = req.params;
    const filePath = `/Autox/${projectId}/Staff Attendance/Attendance.xlsx`;

    const tableName =
      sheetName === "Staff"
        ? "StaffTable"
        : sheetName === "Guard"
        ? "GuardTable"
        : "ContactTable";

    const targetSheet = sheetName === "Staff" ? projectId : sheetName;

    await graphHelper.deleteRow(
      filePath,
      targetSheet,
      tableName,
      rowIndex
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Delete failed" });
  }
});

module.exports = router;