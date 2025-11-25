import express from "express";
import axios from "axios";

const router = express.Router();

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;

// 🟢 Initialize Payment
router.post("/initialize", async (req, res) => {
  try {
    const { amount, email, name, currency } = req.body;

    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        amount: amount * 100, // Paystack uses kobo
        email,
        currency: currency || "NGN",
        metadata: { name },
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
          "Content-Type": "application/json",
        },
      }
    );

    return res.json(response.data.data);
  } catch (error) {
    console.error("Paystack Init Error:", error.response?.data);
    res.status(500).json({
      status: "failed",
      message: "Could not initialize payment",
      error: error.response?.data,
    });
  }
});

// 🟢 Paystack Webhook (optional but recommended)
router.post("/webhook", express.raw({ type: "application/json" }), (req, res) => {
  try {
    const event = req.body;

    console.log("🔔 Paystack Webhook Event:", event);

    res.sendStatus(200);
  } catch (err) {
    console.error("Webhook Error:", err);
    res.sendStatus(400);
  }
});

export default router;
