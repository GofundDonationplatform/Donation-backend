// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

import flutterwavePay from "./routes/flutterwavePay.js";
import flutterwaveWebhook from "./routes/flutterwaveWebhook.js";

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
app.use("/api/donate", flutterwavePay);
app.use("/api/webhook/flutterwave", flutterwaveWebhook);

// ✅ Base route
app.get("/", (req, res) => {
  res.send("GoFundSS Backend is running ✅");
});

// ✅ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
