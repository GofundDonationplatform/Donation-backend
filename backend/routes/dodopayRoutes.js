// routes/dodopayRoutes.js
import express from "express";
import DodoPayments from "dodopayments";

const router = express.Router();

// Initialize DodoPay client (LIVE MODE)
const client = new DodoPayments({
  bearerToken: process.env.DODO_PAYMENTS_API_KEY,
  environment: "live_mode", // 🔥 LIVE
});

/**
 * INITIATE DODOPAY CHECKOUT
 */
router.post("/initiate", async (req, res) => {
  try {
    const { amount, email, name } = req.body;

    if (!amount || !email) {
      return res.status(400).json({ error: "Amount and email required" });
    }

    console.log("🟣 DodoPay LIVE INIT:", { amount, email, name });

    /**
     * Create checkout session
     */
    const session = await client.checkoutSessions.create({
      product_cart: [
        {
          product_id: "donation", // virtual product
          quantity: 1,
          price: Number(amount) * 100, // cents
          currency: "USD",
        },
      ],
      customer: {
        email,
        name: name || "Anonymous Donor",
      },
      return_url: `${process.env.FRONTEND_URL}/donate-success?provider=dodopay`,
      cancel_url: `${process.env.FRONTEND_URL}/donate-cancelled`,
      metadata: {
        purpose: "donation",
      },
    });

    console.log("✅ DodoPay session created:", session.url);

    return res.json({
      checkout_url: session.url, // 🔥 REAL CHECKOUT URL
    });

  } catch (error) {
    console.error("❌ DodoPay LIVE Error:", error);
    return res.status(500).json({
      error: "DodoPay initialization failed",
    });
  }
});

export default router;
