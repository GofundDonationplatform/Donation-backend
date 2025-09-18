// backend/app.js
import express from "express";
import path from "path";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import donationRoutes from "./routes/donations.js";
import stripeWebhook from "./routes/stripeWebhook.js";
import connectDB from "./config/db.js";

// Load env
dotenv.config();

// Debug environment variables (masking sensitive parts)
console.log("DEBUG Render Environment:");
console.log(" - MONGO_URI:", process.env.MONGO_URI ? "✅ Loaded" : "❌ Missing");
console.log(" - STRIPE_SECRET_KEY:", process.env.STRIPE_SECRET_KEY ? "✅ Loaded" : "❌ Missing");
console.log(" - STRIPE_WEBHOOK_SECRET:", process.env.STRIPE_WEBHOOK_SECRET ? "✅ Loaded" : "❌ Missing");
console.log(" - EMAIL_USER:", process.env.EMAIL_USER || "❌ Missing");
console.log(" - EMAIL_PASS:", process.env.EMAIL_PASS ? "✅ Loaded" : "❌ Missing");
console.log(" - JWT_SECRET:", process.env.JWT_SECRET ? "✅ Loaded" : "❌ Missing");
console.log(" - FRONTEND_URL:", process.env.FRONTEND_URL || "❌ Missing");
// ✅ Check required environment variables
const requiredVars = ["MONGO_URI", "STRIPE_SECRET_KEY", "JWT_SECRET", "FRONTEND_URL"];
requiredVars.forEach((key) => {
  if (!process.env[key]) {
    console.error(`❌ Missing environment variable: ${key}`);
    process.exit(1); // stop the app immediately
  }
});

console.log("DEBUG MONGO_URI:", process.env.MONGO_URI ? "✅ Loaded" : "❌ Missing");
console.log("DEBUG STRIPE_SECRET_KEY:", process.env.STRIPE_SECRET_KEY ? "✅ Loaded" : "❌ Missing");

// Connect DB
connectDB();

const app = express();
const __dirname = path.resolve();

// Serve static frontend (optional if deploying frontend separately)
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

// Routes
app.use("/api/donations", donationRoutes);

app.get("/", (req, res) => {
  res.send("Donation Platform Backend is running!");
});

// Auto-port from Render
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
