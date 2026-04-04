// server.js
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env.local"), override: true });
require("dotenv").config({ path: path.join(__dirname, ".env") });

const express = require("express");
const cors = require("cors");

const attendanceRoutes  = require("./src/routes/attendance");
const viewRoutes        = require("./src/routes/view");
const procurementRoutes = require("./src/routes/procurement");
const authRoutes        = require("./src/routes/auth");
const usersRoutes       = require("./src/routes/users");

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: "5mb" }));

// Routes
app.use("/api/attendance",  attendanceRoutes);
app.use("/api/view",        viewRoutes);
app.use("/api/procurement", procurementRoutes);
app.use("/api/auth",        authRoutes);
app.use("/api/users",       usersRoutes);

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