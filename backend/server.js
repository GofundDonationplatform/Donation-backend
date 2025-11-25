// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import paystackRoutes from "./routes/paystack.js";

import flutterwavePay from "./routes/flutterwavePay.js";
import flutterwaveWebhook from "./routes/flutterwaveWebhook.js";
import paypalRoutes from "./routes/paypalRoutes.js";
//import stripePay from "./routes/stripePay.js";

dotenv.config();
const app = express();

// DEBUG ENV CHECKER
console.log("DEBUG: Loaded Environment Variables:");
[
  "MONGO_URI",
  "FLW_SECRET_KEY",
  "FLW_PUBLIC_KEY",
  "FLW_ENCRYPTION_KEY",
  "FLW_WEBHOOK_SECRET",
  "PAYSTACK_SECRET_KEY",
  "SEERBIT_SECRET",
  "CHIPPER_SECRET_KEY",
  "PAYPAL_CLIENT_ID",
  "PAYPAL_CLIENT_SECRET"
].forEach(key => {
  console.log(`- ${key}: ${process.env[key] ? "✅ Loaded" : "❌ MISSING"}`);
});

// ✅ Middleware
app.use(cors());
app.use(express.json());

// ✅ MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ Mongo connection error:", err));

// ✅ Routes
app.use("/api/donate", flutterwavePay);
app.use("/api/webhook/flutterwave", flutterwaveWebhook);
app.use("/api/paypal", paypalRoutes);
app.use("/api/paystack", paystackRoutes);
//app.use("/api/stripe", stripePay);

// ✅ Health check route
app.get("/", (req, res) => {
  res.send("GoFundSS Backend is running ✅");
});

// ✅ Catch all other routes (important fix for “Cannot GET /api/...”)
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ✅ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT}`)
);
