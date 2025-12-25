import express from "express";
import DodoPayments from "dodopayments";

const router = express.Router();

// Initialize Dodo client (LIVE MODE by default)
const dodo = new DodoPayments({
  bearerToken: process.env.DODO_PAYMENTS_API_KEY,
  environment: "live_mode", // remove or keep explicit
});

router.post("/initiate", async (req, res) => {
  try {
    const { amount, email, name } = req.body;

    if (!amount || !email) {
      return res.status(400).json({ error: "Amount and email required" });
    }

    // Create checkout session
    const session = await dodo.checkoutSessions.create({
      customer: {
        email,
        name: name || "Anonymous Donor",
      },
      amount: Math.round(Number(amount) * 100), // cents
      currency: "USD",
      return_url: `${process.env.FRONTEND_URL}/donate-success?provider=dodopay`,
    });

    return res.json({
      checkout_url: session.url,
    });
  } catch (error) {
    console.error("❌ DodoPay INIT ERROR:", error);
    return res.status(500).json({
      error: "DodoPay initialization failed",
    });
  }
});

export default router;
