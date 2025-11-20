import express from "express";
import axios from "axios";
import Donation from "../models/Donation.js";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

// Generate unique references
const genRef = () =>
  "tx_" + Date.now() + "_" + Math.random().toString(36).slice(2, 9);

// POST /api/flutterwave/create-payment
router.post("/create-payment", async (req, res) => {
  try {
    const { name, email, amount, currency = "USD" } = req.body;

    if (!amount || isNaN(amount) || Number(amount) < 1) {
      return res.status(400).json({ error: "Invalid or missing donation amount" });
    }

    const tx_ref = genRef();

    // Save donation
    await Donation.create({
      name: name || "Anonymous",
      email: email || "donor@example.com",
      amount: Number(amount),
      currency,
      tx_ref,
      status: "pending",
    });

    // Payload for Flutterwave
    const payload = {
      tx_ref,
      amount: String(amount),
      currency,
      redirect_url: `${
        process.env.FRONTEND_URL?.replace(/\/$/, "") || "http://localhost:5173"
      }/donate-success`,
      payment_options: "card",
      customer: {
        email: email || "donor@example.com",
        name: name || "Anonymous Donor",
      },
      customizations: {
        title: "GoFundSS Donation",
        description: `Support a global cause (${tx_ref})`,
      },
    };

    // Flutterwave API request
    const resp = await axios.post(
      "https://api.flutterwave.com/v3/payments",
      payload,
      {
        headers: {
          Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (resp.data?.status === "success" && resp.data?.data?.link) {
      return res.json({ link: resp.data.data.link, tx_ref });
    }

    res.status(500).json({ error: "Failed to initialize payment" });
  } catch (err) {
    console.error("Donate error:", err?.response?.data || err.message);
    res.status(500).json({ error: "Server error initializing payment" });
  }
});

export default router;
