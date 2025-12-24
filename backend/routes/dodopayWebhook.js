import express from "express";
import crypto from "crypto";

const router = express.Router();

router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  (req, res) => {
    const signature = req.headers["dodo-signature"];
    const payload = req.body;

    const expected = crypto
      .createHmac("sha256", process.env.DODOPAY_WEBHOOK_SECRET)
      .update(payload)
      .digest("hex");

    if (signature !== expected) {
      return res.status(400).send("Invalid signature");
    }

    const event = JSON.parse(payload.toString());

    if (event.type === "checkout.session.completed") {
      console.log("✅ DodoPay Payment Confirmed:", event.data);
      // TODO: update donation status in DB
    }

    res.sendStatus(200);
  }
);

export default router;
