// server.js
require("dotenv").config();

const express = require("express");
const cors = require("cors");

const attendanceRoutes  = require("./src/routes/attendance");
const viewRoutes        = require("./src/routes/view");
const procurementRoutes = require("./src/routes/procurement");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/attendance",  attendanceRoutes);
app.use("/api/view",        viewRoutes);
app.use("/api/procurement", procurementRoutes);

// Port Configuration (Railway ke liye important)
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Backend server is running on port ${PORT}`);
  console.log(`🌍 Listening on http://0.0.0.0:${PORT}`);
});

// Graceful shutdown (optional but good practice)
process.on("SIGTERM", () => {
  console.log("🛑 SIGTERM received, shutting down gracefully");
  process.exit(0);
});