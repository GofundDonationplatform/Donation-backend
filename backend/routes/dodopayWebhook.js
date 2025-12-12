// routes/dodopayWebhook.js
import express from "express";
import crypto from "crypto";

const router = express.Router();

// Must use raw JSON
router.post("/dodopay/webhook", express.raw({ type: "*/*" }), (req, res) => {
  try {
    const signature = req.headers["dodopay-signature"];
    const secret = process.env.DODOPAY_WEBHOOK_SECRET;

    if (!signature || !secret) {
      return res.status(400).send("Missing signature or secret");
    }

    // Verify signature
    const hash = crypto
      .createHmac("sha256", secret)
      .update(req.body)
      .digest("hex");

    if (hash !== signature) {
      console.log("❌ Invalid Webhook Signature");
      return res.status(400).send("Invalid signature");
    }

    const event = JSON.parse(req.body.toString());
    console.log("✅ DODOPAY WEBHOOK EVENT:", event);

    // Handle successful payments
    if (event?.type === "payment.success") {
      console.log("🎉 DodoPay Payment Successful:", event.data);

      // Save donation to DB here if needed
    }

    res.status(200).send("Webhook received");
  } catch (err) {
    console.error("Webhook Error:", err);
    res.status(500).send("Server error");
  }
});

export default router;
