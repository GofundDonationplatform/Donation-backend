const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");

dotenv.config();
const app = express();

// Stripe webhook needs raw body, so exclude it before json middleware
app.use(
  (req, res, next) => {
    if (req.originalUrl === "/api/stripe/webhook") {
      next(); // raw body handled in route
    } else {
      bodyParser.json()(req, res, next);
    }
  }
);

// Routes
app.use("/api/donations", require("./routes/donation"));
app.use("/api/stripe/webhook", require("./routes/stripeWebhook"));

// MongoDB connect
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB error:", err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
