const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();

// ---- Middleware ----
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ---- Serve static files ----
// Serves static files in /public (including /uploads for KYC documents)
app.use(express.static(path.join(__dirname, "public")));

// ---- API Routes ----
const payheroRoutes = require("./routes/payhero");
app.use("/api/payhero", payheroRoutes);

const adminRoutes = require("./routes/admin");
app.use("/api/admin", adminRoutes);

const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);

// ---- Page Routes ----
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/mpesa", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "mpesa.html"));
});

app.get("/admin", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "admin.html"));
});

app.get("/admin-login", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "admin-login.html"));
});

// Explicit route for More section if needed
app.get("/More", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "More", "index.html"));
});

// ---- Fallback 404 Handler ----
app.use((req, res) => {
    res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});

// ---- Start Server ----
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT} (Using Local NeDB Database)`);
});