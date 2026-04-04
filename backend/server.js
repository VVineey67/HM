// server.js
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env.local"), override: true });
require("dotenv").config({ path: path.join(__dirname, ".env") });

// ── Startup env check ──
console.log("🔍 ENV CHECK:");
console.log("  SUPABASE_URL     :", process.env.SUPABASE_URL     ? "✅ SET" : "❌ MISSING");
console.log("  SUPABASE_SERVICE_KEY:", process.env.SUPABASE_SERVICE_KEY ? "✅ SET" : "❌ MISSING");
console.log("  PORT             :", process.env.PORT || "3000 (default)");

const express = require("express");

let attendanceRoutes, viewRoutes, procurementRoutes, authRoutes, usersRoutes;
try {
  attendanceRoutes  = require("./src/routes/attendance");
  viewRoutes        = require("./src/routes/view");
  procurementRoutes = require("./src/routes/procurement");
  authRoutes        = require("./src/routes/auth");
  usersRoutes       = require("./src/routes/users");
  console.log("✅ All routes loaded");
} catch (e) {
  console.error("❌ Route loading failed:", e.message);
  process.exit(1);
}

const app = express();

// Middleware — manual CORS headers
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});
app.use(express.json({ limit: "5mb" }));

// Health check
app.get("/health", (_req, res) => res.json({ status: "ok", time: new Date().toISOString() }));

// Routes
app.use("/api/attendance",  attendanceRoutes);
app.use("/api/view",        viewRoutes);
app.use("/api/procurement", procurementRoutes);
app.use("/api/auth",        authRoutes);
app.use("/api/users",       usersRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Backend running on port ${PORT}`);
});

process.on("SIGTERM", () => {
  console.log("🛑 SIGTERM received, shutting down gracefully");
  process.exit(0);
});
