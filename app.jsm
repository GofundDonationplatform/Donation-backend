require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();

// === Mount webhook route with raw body parser FIRST ===
const stripeWebhook = require("./routes/stripeWebhook");
// note: we mount the raw parser directly here to the route
app.post(
  "/api/webhooks/stripe",
  express.raw({ type: "application/json" }),
  stripeWebhook
);

// === Then normal middleware ===
app.use(express.json());
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173", credentials: true }));

// DB connect
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB error:", err));

// normal routes
const authRoutes = require("./routes/auth");
const donationRoutes = require("./routes/donation");

app.use("/api/auth", authRoutes);
app.use("/api/donations", donationRoutes);

// start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
