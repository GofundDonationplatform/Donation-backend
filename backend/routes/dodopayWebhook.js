import express from "express";
import crypto from "crypto";

const router = express.Router();

router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  (req, res) => {
    const signature = req.headers["dodo-signature"];
    const payload = req.body;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.DODOPAY_WEBHOOK_SECRET)
      .update(payload)
      .digest("hex");

    if (signature !== expectedSignature) {
      return res.status(401).send("Invalid signature");
    }

    const event = JSON.parse(payload.toString());

    if (event.type === "checkout.session.completed") {
      const session = event.data;
      console.log("✅ DodoPay payment confirmed:", session.id);

      // TODO:
      // - mark donation as paid in DB
      // - send receipt email
    }

    res.json({ received: true });
  }
);

export default router;
