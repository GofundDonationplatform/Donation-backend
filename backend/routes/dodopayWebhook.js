// routes/dodopayWebhook.js
import express from "express";
import crypto from "crypto";

const router = express.Router();

router.post("/webhook", express.raw({ type: "*/*" }), (req, res) => {
  const signature = req.headers["x-dodopay-signature"];

  const hash = crypto
    .createHmac("sha256", process.env.DODOPAY_WEBHOOK_SECRET)
    .update(req.body)
    .digest("hex");

  if (hash !== signature) {
    return res.status(401).send("Invalid signature");
  }

  const event = JSON.parse(req.body.toString());

  if (event.status === "success") {
    console.log("✅ DodoPay payment successful:", event);
    // TODO: mark donation as paid in DB
  }

  res.sendStatus(200);
});

export default router;
