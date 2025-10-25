// routes/paypalRoutes.js
import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import Donation from "../models/Donation.js";

dotenv.config();

const router = express.Router();

// ✅ Generate PayPal access token
async function generateAccessToken() {
  const response = await axios({
    url: `${process.env.PAYPAL_API_BASE}/v1/oauth2/token`,
    method: "post",
    auth: {
      username: process.env.PAYPAL_CLIENT_ID,
      password: process.env.PAYPAL_SECRET,
    },
    params: { grant_type: "client_credentials" },
  });
  return response.data.access_token;
}

// ✅ Create PayPal order
router.post("/create-order", async (req, res) => {
  try {
    const { amount, currency = "USD", name, email } = req.body;

    const accessToken = await generateAccessToken();

    const order = await axios.post(
      `${process.env.PAYPAL_API_BASE}/v2/checkout/orders`,
      {
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: currency,
              value: (Number(amount) / 100).toFixed(2), // Convert cents → USD
            },
            description: "GoFundSS Donation",
          },
        ],
        application_context: {
          brand_name: "GoFundSS Donation Platform",
          landing_page: "LOGIN",
          user_action: "PAY_NOW",
          return_url: `${
            process.env.FRONTEND_URL || "http://localhost:5173"
          }/donate-success`,
          cancel_url: `${
            process.env.FRONTEND_URL || "http://localhost:5173"
          }/donate-cancel`,
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    // Save pending donation
    await Donation.create({
      name: name || "Anonymous Donor",
      email: email || "donor@example.com",
      amount: Number(amount) / 100,
      currency,
      tx_ref: order.data.id,
      status: "pending",
    });

    res.json({ id: order.data.id, links: order.data.links });
  } catch (err) {
    console.error("🚨 PayPal create-order error:", err.response?.data || err);
    res.status(500).json({ error: "Failed to create PayPal order" });
  }
});

// ✅ Capture PayPal payment
router.post("/capture-order", async (req, res) => {
  try {
    const { orderID } = req.body;
    const accessToken = await generateAccessToken();

    const capture = await axios.post(
      `${process.env.PAYPAL_API_BASE}/v2/checkout/orders/${orderID}/capture`,
      {},
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    // Update donation
    await Donation.findOneAndUpdate(
      { tx_ref: orderID },
      { status: "successful", meta: capture.data }
    );

    res.json({ success: true, capture: capture.data });
  } catch (err) {
    console.error("🚨 PayPal capture error:", err.response?.data || err);
    res.status(500).json({ error: "Failed to capture PayPal order" });
  }
});

export default router;
