import express from "express";
import DodoPayments from "dodopayments";

const router = express.Router();

const client = new DodoPayments({
  bearerToken: process.env.DODO_PAYMENTS_API_KEY,
  environment: "live_mode", // change to test_mode if testing
});

router.post("/initiate", async (req, res) => {
  try {
    const { amount, email, name } = req.body;

    if (!amount || !email) {
      return res.status(400).json({ error: "Missing amount or email" });
    }

    const session = await client.checkoutSessions.create({
      product_cart: [
        {
          product_id: process.env.DODO_DONATION_PRODUCT_ID,
          quantity: 1,
          amount: Math.round(Number(amount) * 100), // cents
        },
      ],
      customer: {
        email,
        name: name || "Anonymous Donor",
      },
      return_url: `${process.env.FRONTEND_URL}/donate-success`,
    });

    return res.json({
      checkout_url: session.url,
    });

  } catch (err) {
    console.error("❌ DodoPay INIT ERROR:", err);
    return res.status(500).json({ error: "DodoPay initialization failed" });
  }
});

export default router;
