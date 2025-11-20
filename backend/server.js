// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

import flutterwavePay from "./routes/flutterwavePay.js";
import flutterwaveWebhook from "./routes/flutterwaveWebhook.js";
import paypalRoutes from "./routes/paypalRoutes.js";
//import stripePay from "./routes/stripePay.js";

dotenv.config();
const app = express();

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
app.use("/api/flutterwave", flutterwavePay);
app.use("/api/webhook/flutterwave", flutterwaveWebhook);
app.use("/api/paypal", paypalRoutes);
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
