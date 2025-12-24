import express from "express";
import DodoPayments from "dodopayments";

const router = express.Router();

/**
 * Initialize DodoPay client
 */
const dodo = new DodoPayments({
  bearerToken: process.env.DODOPAY_SECRET_KEY, // ✅ MATCHES YOUR ENV
  environment: "live_mode", // change to "test_mode" if needed
});

/**
 * INITIATE PAYMENT
 */
router.post("/initiate", async (req, res) => {
  try {
    const { amount, email, name } = req.body;

    if (!amount || !email) {
      return res.status(400).json({ error: "Amount and email are required" });
    }

    // Convert amount to cents (USD)
    const amountInCents = Math.round(Number(amount) * 100);

    const session = await dodo.checkoutSessions.create({
      customer: {
        email,
        name: name || "Anonymous Donor",
      },
      amount: amountInCents,
      currency: "USD",
      return_url: `${process.env.FRONTEND_URL}/donate-success?provider=dodopay`,
      metadata: {
        source: "donation-platform",
      },
    });

    return res.json({
      checkout_url: session.url, // ✅ REAL DODOPAY CHECKOUT
    });

  } catch (error) {
    console.error("❌ DodoPay Error:", error);
    return res.status(500).json({ error: "DodoPay initialization failed" });
  }
});

export default router;
