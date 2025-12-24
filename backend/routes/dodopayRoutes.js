// routes/dodopayRoutes.js
import express from "express";
import DodoPayments from "dodopayments";

const router = express.Router();

const client = new DodoPayments({
  bearerToken: process.env.DODO_PAYMENTS_API_KEY,
  environment: "live_mode", // change to "test_mode" if testing
});

// ===============================
// INITIATE DODOPAY PAYMENT
// ===============================
router.post("/initiate", async (req, res) => {
  try {
    const { amount, email, name } = req.body;

    if (!amount || !email) {
      return res.status(400).json({ error: "Amount and email required" });
    }

    const session = await client.checkoutSessions.create({
      product_cart: [
        {
          product_id: "donation", // can be static
          quantity: 1,
          price: Number(amount) * 100, // convert to cents
          currency: "USD",
        },
      ],
      customer: {
        email,
        name: name || "Anonymous Donor",
      },
      return_url: `${process.env.FRONTEND_URL}/donate-success?provider=dodopay`,
    });

    return res.json({
      checkout_url: session.url, // 🔥 REAL DODOPAY CHECKOUT URL
    });

  } catch (error) {
    console.error("❌ DodoPay INIT Error:", error);
    res.status(500).json({ error: "DodoPay initialization failed" });
  }
});

export default router;
