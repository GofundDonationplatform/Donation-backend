import express from "express";
import DodoPayments from "dodopayments";

const router = express.Router();

const dodo = new DodoPayments({
  bearerToken: process.env.DODO_PAYMENTS_API_KEY,
  environment: "live_mode",
});

const PRODUCT_MAP = {
  100: process.env.DODO_digital contribution_PRODUCT_100,
  150: process.env.DODO_digital contribution_PRODUCT_150,
  200: process.env.DODO_digital contribution_PRODUCT_200,
  500: process.env.DODO_digital contribution_PRODUCT_500,
  750: process.env.DODO_digital contribution_PRODUCT_750,
  1000: process.env.DODO_digital contribution_PRODUCT_1000,
};

router.post("/initiate", async (req, res) => {
  try {
    const { amount, email, name } = req.body;

    console.log("🟡 Incoming body:", req.body);

    const productId = PRODUCT_MAP[amount];

    if (!productId) {
      return res.status(400).json({ error: "Invalid digital contribution amount" });
    }

    const session = await dodo.checkoutSessions.create({
      product_cart: [
        {
          product_id: productId,
          quantity: 1,
        },
      ],
      customer: {
        email,
        name,
      },
      return_url: `${process.env.FRONTEND_URL}/donate-success?provider=dodopay`,
    });

    console.log("🟢 DodoPay session:", session);

    return res.json({
      checkout_url: session.checkout_url || session.url,
    });
  } catch (err) {
    console.error("🔴 DodoPay error:", err);
    return res.status(500).json({ error: "DodoPay initialization failed" });
  }
});

export default router;
