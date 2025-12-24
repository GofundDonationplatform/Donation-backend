// routes/dodopayRoutes.js
import express from "express";
import DodoPayments from "dodopayments";
import crypto from "crypto";

const router = express.Router();

// Init DodoPay client
const client = new DodoPayments({
  bearerToken: process.env.DODOPAY_SECRET_KEY,
  environment: "live_mode", // change to test_mode if testing
});

/**
 * ============================
 * CREATE DODOPAY CHECKOUT
 * ============================
 */
router.post("/initiate", async (req, res) => {
  try {
    const { amount, email, name } = req.body;

    if (!amount || !email) {
      return res.status(400).json({ error: "Missing amount or email" });
    }

    const session = await client.checkoutSessions.create({
      product_cart: [
        {
          product_id: process.env.DODOPAY_PRODUCT_ID,
          quantity: 1,
          price_override: {
            amount: Number(amount) * 100, // convert to cents
            currency: "USD",
          },
        },
      ],
      customer: {
        email,
        name: name || "Anonymous Donor",
      },
      return_url: `${process.env.FRONTEND_URL}/donate-success?provider=dodopay`,
      metadata: {
        email,
        amount,
      },
    });

    return res.json({
      checkout_url: session.url,
    });
  } catch (error) {
    console.error("❌ DodoPay init error:", error);
    res.status(500).json({ error: "DodoPay initialization failed" });
  }
});

/**
 * ============================
 * DODOPAY WEBHOOK
 * ============================
 */
router.post("/webhook", express.raw({ type: "application/json" }), (req, res) => {
  try {
    const signature = req.headers["dodopay-signature"];
    const payload = req.body;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.DODOPAY_WEBHOOK_SECRET)
      .update(payload)
      .digest("hex");

    if (signature !== expectedSignature) {
      console.error("❌ Invalid DodoPay webhook signature");
      return res.status(400).send("Invalid signature");
    }

    const event = JSON.parse(payload.toString());

    if (event.type === "checkout.session.completed") {
      console.log("✅ DodoPay payment confirmed:", event.data);

      // TODO:
      // - Save donation to MongoDB
      // - Mark campaign as funded
      // - Send receipt email
    }

    res.json({ received: true });
  } catch (err) {
    console.error("❌ Webhook error:", err);
    res.status(400).send("Webhook error");
  }
});

export default router;
