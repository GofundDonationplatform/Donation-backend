import express from "express";
import DodoPayments from "dodopayments";

const router = express.Router();

const client = new DodoPayments({
  bearerToken: process.env.DODO_PAYMENTS_API_KEY,
  environment: "live_mode", // IMPORTANT
});

/**
 * CREATE DODOPAY CHECKOUT SESSION (LIVE)
 */
router.post("/initiate", async (req, res) => {
  try {
    const { amount, email, name } = req.body;

    if (!amount || !email) {
      return res.status(400).json({ error: "Amount and email required" });
    }

    // Create checkout session
    const session = await client.checkoutSessions.create({
      customer: {
        email,
        name: name || "Anonymous Donor",
      },
      line_items: [
        {
          name: "Donation",
          quantity: 1,
          unit_amount: Math.round(Number(amount) * 100), // cents
          currency: "USD",
        },
      ],
      return_url: process.env.DODOPAY_RETURN_URL,
      metadata: {
        source: "donation-platform",
      },
    });

    return res.json({
      checkout_url: session.url, // REAL DODOPAY CHECKOUT
    });
  } catch (error) {
    console.error("❌ DodoPay INIT ERROR:", error);
    return res.status(500).json({
      error: "DodoPay initialization failed",
    });
  }
});

export default router;
