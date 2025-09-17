// backend/app.js
import dotenv from "dotenv";

if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}

import express from "express";
import path from "path";
import cors from "cors";
import bodyParser from "body-parser";

import donationRoutes from "./routes/donations.js";
import stripeWebhook from "./routes/stripeWebhook.js";
import connectDB from "./config/db.js";

// Debug
console.log("DEBUG MONGO_URI:", process.env.MONGO_URI);
console.log("DEBUG STRIPE_SECRET_KEY:", process.env.STRIPE_SECRET_KEY);

// Connect DB
connectDB();

const app = express();
const __dirname = path.resolve();

// Serve static frontend (optional)
app.use(express.static(path.join(__dirname, "public")));

// Stripe webhooks (raw body)
app.use(
  "/api/stripe/webhook",
  bodyParser.raw({ type: "application/json" }),
  stripeWebhook
);

// Normal middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use("/api/donations", donationRoutes);

// Health check
app.get("/", (req, res) => {
  res.send("Donation Platform Backend is running!");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
