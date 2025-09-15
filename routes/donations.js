// backend/routes/donations.js
import express from "express";
import "../config/env.js"; // <-- ensures dotenv is loaded first
import Stripe from "stripe";
import Donation from "../models/Donation.js";

const router = express.Router();

// Initialize Stripe safely
let stripe;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  console.log(
    "Stripe Secret Loaded: ✅",
    process.env.STRIPE_SECRET_KEY.slice(0, 8) + "..."
  );
} else {
  console.error("Stripe Secret Loaded: ❌ No");
}

// POST /api/donations/create-checkout-session
router.post("/create-checkout-session", async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount < 1) {
      return res.status(400).json({ error: "Invalid donation amount" });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: "Donation" },
            unit_amount: amount * 100, // amount in cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/cancel`,
    });

    const donation = new Donation({
      amount,
      status: "Pending",
      sessionId: session.id,
    });
    await donation.save();

    res.json({ id: session.id, url: session.url });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

export default router;
