// backend/routes/stripeWebhook.js
import express from "express";
import Stripe from "stripe";
import Donation from "../models/Donation.js";

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

// Webhook endpoint
router.post("/", (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body, // raw body
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("❌ Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle checkout session completed
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    Donation.findOneAndUpdate(
      { sessionId: session.id },
      {
        status: "Completed",
        transactionId: session.payment_intent,
      },
      { new: true }
    )
      .then(() => {
        console.log(`✅ Donation ${session.id} marked as completed`);
      })
      .catch((err) => {
        console.error("❌ Failed to update donation:", err);
      });
  }

  res.json({ received: true });
});

export default router;
