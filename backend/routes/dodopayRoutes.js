import express from "express";
import DodoPayments from "dodopayments";

const router = express.Router();

const client = new DodoPayments({
  bearerToken: process.env.DODOPAY_API_KEY,
  environment: process.env.DODOPAY_ENV || "live_mode",
});

/**
 * INITIATE DODOPAY PAYMENT (LIVE)
 */
router.post("/initiate", async (req, res) => {
  try {
    const { amount, email, name } = req.body;

    if (!amount || !email) {
      return res.status(400).json({ error: "Amount and email are required" });
    }

    const session = await client.checkoutSessions.create({
      customer: {
        email,
        name: name || "Anonymous Donor",
      },

      product_cart: [
        {
          name: "Donation",
          price: Math.round(Number(amount) * 100), // cents
          quantity: 1,
          currency: "USD",
        },
      ],

      return_url: `${process.env.FRONTEND_URL}/donate-success?provider=dodopay`,
      cancel_url: `${process.env.FRONTEND_URL}/donate-cancel`,
      metadata: {
        source: "donation-platform",
      },
    });

    return res.json({
      checkout_url: session.url, // 🔥 REAL DODOPAY URL
      session_id: session.session_id,
    });

  } catch (error) {
    console.error("❌ DodoPay Error:", error);
    return res.status(500).json({
      error: "DodoPay initialization failed",
    });
  }
});

export default router;
