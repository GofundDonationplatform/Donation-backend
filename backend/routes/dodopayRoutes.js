import express from "express";
import DodoPayments from "dodopayments";

const router = express.Router();

const client = new DodoPayments({
  bearerToken: process.env.DODO_PAYMENTS_API_KEY,
  environment: "live_mode", // change to test_mode if needed
});

router.post("/initiate", async (req, res) => {
  try {
    const { amount, email, name } = req.body;

    if (!amount || !email) {
      return res.status(400).json({ error: "Missing amount or email" });
    }

    /**
     * IMPORTANT:
     * DodoPay DOES NOT accept raw amount
     * You MUST use product_cart
     */
    const session = await client.checkoutSessions.create({
      product_cart: [
        {
          product_id: process.env.DODO_PAYMENTS_ENDPOINT_ID,
          quantity: 1,
        },
      ],
      customer: {
        email,
        name: name || "Anonymous Donor",
      },
      metadata: {
        purpose: "platform_contribution",
      },
      return_url: `${process.env.FRONTEND_URL}/donate-success?provider=dodopay`,
    });

    if (!session?.url) {
      throw new Error("No checkout URL returned");
    }

    return res.json({
      checkout_url: session.url,
    });
  } catch (error) {
    console.error("❌ DodoPay Error:", error.message);
    return res.status(500).json({
      error: "DodoPay initialization failed",
    });
  }
});

export default router;
