// routes/dodopayRoutes.js
import express from "express";

const router = express.Router();

/**
 * DODOPAY INITIATE (SAFE MODE)
 * Frontend flow only – no external API calls
 */
router.post("/initiate", (req, res) => {
  try {
    const { amount, email, name, currency } = req.body;

    if (!amount || !email) {
      return res.status(400).json({ error: "Missing amount or email" });
    }

    console.log("🟣 DodoPay INIT:", {
      amount,
      email,
      name,
      currency,
    });

    // SAFE redirect
    return res.json({
      checkout_url: `${process.env.FRONTEND_URL}/donate-success?provider=dodopay`,
    });
  } catch (err) {
    console.error("❌ DodoPay error:", err);
    return res.status(500).json({ error: "DodoPay initialization failed" });
  }
});

export default router;
