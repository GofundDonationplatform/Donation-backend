import express from "express";
import DodoPayments from "dodopayments";

const router = express.Router();

const client = new DodoPayments({
  bearerToken: process.env.DODO_PAYMENTS_API_KEY,
  environment: "live_mode", // or "test_mode"
});

router.post("/initiate", async (req, res) => {
  try {
    const { amount, email, name } = req.body;

    if (!amount || !email) {
      return res.status(400).json({ error: "Missing amount or email" });
    }

    // Map donation amounts to product IDs
    const PRODUCT_MAP = {
      200: process.env.DODO_PRODUCT_200,
      500: process.env.DODO_PRODUCT_500,
      1000: process.env.DODO_PRODUCT_1000,
      2500: process.env.DODO_PRODUCT_2500,
      5000: process.env.DODO_PRODUCT_5000,
      10000: process.env.DODO_PRODUCT_10000,
    };

    const productId = PRODUCT_MAP[amount];

    if (!productId) {
      return res.status(400).json({ error: "Invalid donation amount" });
    }

    const session = await client.checkoutSessions.create({
      product_cart: [
        {
          product_id: productId,
          quantity: 1, // ✅ ALWAYS 1
        },
      ],
      customer: {
        email,
        name: name || "Anonymous Donor",
      },
      return_url: `${process.env.FRONTEND_URL}/donate-success?provider=dodopay`,
    });

    return res.json({
      checkout_url: session.checkout_url,
    });
  } catch (err) {
    console.error("❌ DodoPay Error:", err);
    return res.status(500).json({ error: "DodoPay initialization failed" });
  }
});

export default router;
