// backend/routes/stripeWebhook.js
import express from "express";
import Stripe from "stripe";
import Donation from "../models/Donation.js";

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

// Stripe Webhook
  router.post("/", express.raw({ type: "application/json" }), async (req, res) => {
  console.log("⚡ Stripe webhook called");
  const sig = req.headers["stripe-signature"];
  console.log("Stripe signature:", sig);

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    console.log("✅ Webhook event constructed:", event.type);
  } catch (err) {
    console.error("❌ Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    console.log("✅ Checkout completed for session:", session.id);

    try {
      const updatedDonation = await Donation.findOneAndUpdate(
        { sessionId: session.id },
        {
          status: "Completed",
          transactionId: session.payment_intent,
        },
        { new: true }
      );

      if (updatedDonation) {
        console.log("🎉 Donation updated in DB:", updatedDonation);
      } else {
        console.warn("⚠️ No donation found with sessionId:", session.id);
      }
    } catch (err) {
      console.error("❌ Failed to update donation:", err);
    }
  }

  res.json({ received: true });
});

export default router;
