require("dotenv").config();
const express = require("express");
const cors = require("cors");

const attendanceRoutes = require("./src/routes/attendance");
const viewRoutes = require("./src/routes/view");  // ✅ FIXED PATH

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/attendance", attendanceRoutes);
app.use("/api/view", viewRoutes); // ✅ Working now

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`✅ Backend server running on port ${PORT}`);
});
