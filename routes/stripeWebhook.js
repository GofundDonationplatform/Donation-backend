// backend/routes/stripeWebhook.js
import express from "express";
import Stripe from "stripe";
import Donation from "../models/Donation.js";

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Webhook endpoint
router.post("/", async (req, res) => {
  const sig = req.headers["stripe-signature"];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET // Make sure this matches your .env
    );
  } catch (err) {
    console.error("❌ Webhook signature verification failed.", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      console.log("✅ Checkout session completed:", session.id);

      // Find the donation and update it
      await Donation.findOneAndUpdate(
        { sessionId: session.id },
        {
          status: "Paid",
          transactionId: session.payment_intent,
        }
      );
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  // Return 200 response to Stripe
  res.json({ received: true });
});

export default router;
