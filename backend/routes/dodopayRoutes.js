// routes/dodopayRoutes.js
import express from "express";
import axios from "axios";
import crypto from "crypto";

const router = express.Router();

// ENV
const DODOPAY_SECRET_KEY = process.env.DODOPAY_SECRET_KEY;   // test/live secret key
const DODOPAY_PUB_KEY = process.env.DODOPAY_PUBLIC_KEY;      // publishable key
const DODOPAY_WEBHOOK_SECRET = process.env.DODOPAY_WEBHOOK_SECRET; // whsec_...
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// ====================================================================
//  INITIATE PAYMENT
// ====================================================================
router.post("/initiate", async (req, res) => {
  try {
    const { amount, email, name, currency } = req.body;

    const payload = {
      amount: Number(amount),
      currency: currency || "USD",
      customer_email: email,
      customer_name: name,
      reference: `DODO_${Date.now()}`,
      callback_url: `${FRONTEND_URL}/donate-success`,
    };

    const response = await axios.post(
      "https://api.dodopayments.com/v1/payments",
      payload,
      {
        headers: {
          Authorization: `Bearer ${DODOPAY_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.data?.payment_url) {
      return res.status(400).json({ error: "Invalid response from DodoPay" });
    }

    return res.json({
      payment_url: response.data.payment_url,
      reference: payload.reference,
    });

  } catch (err) {
    console.error("DodoPay Error:", err.response?.data || err);
    res.status(500).json({ error: "DodoPay initialization failed" });
  }
});

// ====================================================================
//  WEBHOOK — VERIFY TRANSACTIONS
// ====================================================================
router.post("/webhook", express.raw({ type: "application/json" }), (req, res) => {
  const signature = req.headers["dodopay-signature"];

  // Validate signature
  const computed = crypto
    .createHmac("sha256", DODOPAY_WEBHOOK_SECRET)
    .update(req.body)
    .digest("hex");

  if (computed !== signature) {
    console.log("❌ Invalid DodoPay webhook signature");
    return res.status(400).send("Invalid signature");
  }

  const event = JSON.parse(req.body.toString());

  // Handle successful payments
  if (event?.event === "payment.success") {
    console.log("✅ PAYMENT SUCCESS:", event.data);

    // TODO: insert donation into database
  }

  res.status(200).send("OK");
});

export default router;
