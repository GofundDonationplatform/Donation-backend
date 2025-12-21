// routes/dodopayRoutes.js
import express from "express";
import fetch from "node-fetch";

const router = express.Router();

router.post("/initiate", async (req, res) => {
  try {
    const { amount, email, name, currency } = req.body;

    if (!amount || !email) {
      return res.status(400).json({ error: "Missing amount or email" });
    }

    const response = await fetch("https://api.dodopay.com/v1/checkout", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.DODOPAY_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: Number(amount),
        currency: currency || "USD",
        customer: {
          email,
          name: name || "Anonymous Donor",
        },
        redirect_url: `${process.env.FRONTEND_URL}/donate-success?provider=dodopay`,
        webhook_url: `${process.env.BACKEND_URL}/api/dodopay/webhook`,
      }),
    });

    const data = await response.json();

    if (!data?.checkout_url) {
      console.error("❌ DodoPay API error:", data);
      return res.status(400).json({ error: "DodoPay initialization failed" });
    }

    return res.json({ checkout_url: data.checkout_url });

  } catch (err) {
    console.error("❌ DodoPay Server Error:", err);
    res.status(500).json({ error: "DodoPay server error" });
  }
});

export default router;
