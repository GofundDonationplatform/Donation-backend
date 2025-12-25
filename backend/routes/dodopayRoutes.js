// routes/dodopayRoutes.js
import express from "express";
import DodoPayments from "dodopayments";

const router = express.Router();

// Initialize Dodo client (LIVE MODE)
const dodo = new DodoPayments({
  bearerToken: process.env.DODO_PAYMENTS_API_KEY,
  environment: "live_mode", // change to "test_mode" if needed
});

// ===============================
// CREATE CHECKOUT SESSION
// ===============================
router.post("/initiate", async (req, res) => {
  try {
    const { amount, email, name } = req.body;

    if (!amount || !email) {
      return res.status(400).json({ error: "Amount and email required" });
    }

    console.log("🟣 DodoPay INIT:", { amount, email, name });

    /**
     * Create checkout session
     * IMPORTANT:
     * - No donation wording (compliance)
     * - Use generic product/service
     */
    const session = await dodo.checkoutSessions.create({
      product_cart: [
        {
          product_id: process.env.DODO_PAYMENTS_ENDPOINT_ID,
          quantity: 1,
        },
      ],
      customer: {
        email,
        name: name || "Customer",
      },
      metadata: {
        source: "gofundss",
        amount,
      },
      return_url: `${process.env.FRONTEND_URL}/donate-success?provider=dodopay`,
    });

    if (!session?.url) {
      throw new Error("No checkout URL returned");
    }

    console.log("✅ DodoPay Checkout URL:", session.url);

    return res.json({ checkout_url: session.url });
  } catch (err) {
    console.error("❌ DodoPay INIT ERROR:", err?.message || err);
    return res.status(500).json({ error: "DodoPay initialization failed" });
  }
});

// ===============================
// WEBHOOK (DO NOT REMOVE)
// ===============================
router.post("/webhook", express.raw({ type: "application/json" }), (req, res) => {
  try {
    const signature = req.headers["dodo-signature"];
    const payload = req.body;

    console.log("🟢 DodoPay Webhook received");

    // You can verify signature later if needed
    // For now, acknowledge receipt
    res.status(200).send("OK");
  } catch (err) {
    console.error("❌ Webhook error:", err);
    res.status(400).send("Webhook error");
  }
});

export default router;
