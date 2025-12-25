import express from "express";
import DodoPayments from "dodopayments";

const router = express.Router();

const dodo = new DodoPayments({
  bearerToken: process.env.DODO_PAYMENTS_API_KEY,
  environment: "live_mode",
});

/**
 * MAP AMOUNT → PRODUCT ID
 * These products MUST exist in DodoPay dashboard
 */
const DONATION_PRODUCTS = {
  10: "prod_10USD_ID",
  25: "prod_25USD_ID",
  50: "prod_50USD_ID",
  100: "prod_100USD_ID",
};

router.post("/initiate", async (req, res) => {
  try {
    const { amount, email, name } = req.body;

    if (!amount || !email) {
      return res.status(400).json({ error: "Missing amount or email" });
    }

    const productId = DONATION_PRODUCTS[amount];

    if (!productId) {
      return res.status(400).json({
        error: "Invalid donation amount",
      });
    }

    const session = await dodo.checkoutSessions.create({
      product_cart: [
        {
          product_id: productId,
          quantity: 1,
        },
      ],
      customer_email: email,
      return_url: `${process.env.FRONTEND_URL}/donate-success?provider=dodopay`,
    });

    return res.json({
      checkout_url: session.url,
    });

  } catch (err) {
    console.error("❌ DodoPay INIT ERROR:", err);
    return res.status(500).json({
      error: "DodoPay initialization failed",
    });
  }
});

export default router;
