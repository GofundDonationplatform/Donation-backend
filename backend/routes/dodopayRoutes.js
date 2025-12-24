// routes/dodopayRoutes.js
import express from "express";
import DodoPayments from "dodopayments";

const router = express.Router();

const dodo = new DodoPayments({
  bearerToken: process.env.DODO_PAYMENTS_API_KEY,
  environment: "live_mode", // change to test_mode if needed
});

/**
 * CREATE DODOPAY CHECKOUT SESSION
 */
router.post("/initiate", async (req, res) => {
  try {
    const { amount, email, name } = req.body;

    if (!amount || !email) {
      return res.status(400).json({ error: "Amount and email required" });
    }

    // Convert to smallest unit if required (confirm with DodoPay)
    const amountInCents = Math.round(Number(amount) * 100);

    const session = await dodo.checkoutSessions.create({
      customer: {
        email,
        name: name || "Anonymous Donor",
      },
      line_items: [
        {
          name: "Donation",
          amount: amountInCents,
          currency: "USD",
          quantity: 1,
        },
      ],
      return_url: `${process.env.FRONTEND_URL}/donate-success?provider=dodopay`,
    });

    console.log("✅ DodoPay session created:", session.url);

    return res.json({
      checkout_url: session.url, // ✅ REAL DODOPAY CHECKOUT
    });
  } catch (error) {
    console.error("❌ DodoPay error:", error);
    return res.status(500).json({
      error: "DodoPay initialization failed",
    });
  }
});

export default router;
