import express from "express";
import crypto from "crypto";

const router = express.Router();

router.post("/webhook", express.raw({ type: "application/json" }), (req, res) => {
  const signature = req.headers["dodo-signature"];
  const payload = req.body;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.DODOPAY_WEBHOOK_SECRET)
    .update(payload)
    .digest("hex");

  if (signature !== expectedSignature) {
    return res.status(401).send("Invalid signature");
  }

  const event = JSON.parse(payload);

  if (event.type === "checkout.session.completed") {
    console.log("✅ DodoPay payment confirmed:", event.data);
    // TODO: mark donation as paid in DB
  }

  res.json({ received: true });
});

export default router;
