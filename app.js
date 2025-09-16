import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";

import donationRoutes from "./routes/donations.js";
import stripeWebhook from "./routes/stripeWebhook.js";
import connectDB from "./config/db.js";
import Donation from "./models/Donation.js";

// Load env variables
dotenv.config();

// Connect DB
connectDB();

const app = express();
const __dirname = path.resolve();

// Serve static frontend (after you copy dist → backend/public)
app.use(express.static(path.join(__dirname, "public")));

// Stripe requires raw body ONLY for webhooks
app.use(
  "/api/stripe/webhook",
  bodyParser.raw({ type: "application/json" }),
  stripeWebhook
);

// Normal middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Donation routes
app.use("/api/donations", donationRoutes);

// Health check (server only)
app.get("/", (req, res) => {
  res.send("Donation Platform Backend is running!");
});

// Health check with DB
app.get("/api/health", async (req, res) => {
  try {
    const count = await Donation.countDocuments(); // quick DB query
    res.json({
      status: "ok",
      donationsCount: count,
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: "DB not reachable",
      error: err.message,
    });
  }
});

// Auto-port fallback logic
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    const newPort = PORT + 1;
    console.log(`⚠️ Port ${PORT} in use, trying ${newPort}...`);

    app.listen(newPort, () => {
      console.log(`🚀 Server running on http://localhost:${newPort}`);
    });
  } else {
    throw err;
  }
});
