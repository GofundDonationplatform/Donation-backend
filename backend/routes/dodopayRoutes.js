import express from "express";
import DodoPayments from "dodopayments";

const router = express.Router();

router.post("/initiate", async (req, res) => {
  try {
    console.log("🟡 Incoming body:", req.body);

    console.log("🟡 ENV CHECK:", {
      hasApiKey: !!process.env.DODO_PAYMENTS_API_KEY,
      productId: process.env.DODO_DONATION_PRODUCT_ID,
      frontend: process.env.FRONTEND_URL,
    });

    const client = new DodoPayments({
      bearerToken: process.env.DODO_PAYMENTS_API_KEY,
      environment: "live_mode",
    });

    const { amount, email, name } = req.body;

    if (!amount || !email) {
      return res.status(400).json({ error: "Missing amount or email" });
    }

    const productId = process.env.DODO_DONATION_PRODUCT_ID;

    const quantity = Math.floor(Number(amount));

    console.log("🟡 Creating checkout with:", {
      productId,
      quantity,
      email,
    });

    const session = await client.checkoutSessions.create({
      product_cart: [
        {
          product_id: productId,
          quantity,
        },
      ],
      customer: {
        email,
        name: name || "Anonymous",
      },
      return_url: `${process.env.FRONTEND_URL}/donate-success?provider=dodopay`,
    });

    console.log("🟢 DodoPay session:", session);

    return res.json({
      checkout_url: session.url,
    });
  } catch (err) {
    console.error("🔴 DODOPAY FULL ERROR:", err);
    console.error("🔴 ERROR MESSAGE:", err?.message);
    console.error("🔴 ERROR RESPONSE:", err?.response);

    return res.status(500).json({
      error: "DodoPay initialization failed",
      details: err?.message,
    });
  }
});

export default router;
