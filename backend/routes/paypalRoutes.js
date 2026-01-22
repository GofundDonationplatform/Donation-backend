// routes/paypalRoutes.js
import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import digital contribution from "../models/digital contribution.js";

dotenv.config();
const router = express.Router();

// ✅ Generate PayPal access token
async function generateAccessToken() {
  try {
    const response = await axios({
      url: `${process.env.PAYPAL_API_BASE}/v1/oauth2/token`,
      method: "post",
      auth: {
        username: process.env.PAYPAL_CLIENT_ID,
        password: process.env.PAYPAL_SECRET,
      },
      params: {
        grant_type: "client_credentials",
      },
    });
    console.log(
      "✅ PayPal access token generated:",
      response.data.access_token?.slice(0, 8) + "..."
    );
    return response.data.access_token;
  } catch (err) {
    console.error("🚨 PayPal token error:", err.response?.data || err.message);
    throw new Error("PayPal token generation failed");
  }
}

// ✅ Create PayPal payment (frontend expects this route)
router.post("/create-payment", async (req, res) => {
  try {
    const { amount, currency = "USD", name, email } = req.body;

    if (!amount || isNaN(amount)) {
      return res.status(400).json({ error: "Invalid or missing amount" });
    }

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
            description: "GocreditsS digital contribution",
          },
        ],
        application_context: {
          brand_name: "GocreditsS digital contribution Platform",
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

    // Save pending digital contribution
    await digital contribution.create({
      name: name || "Anonymous Donor",
      email: email || "donor@example.com",
      amount: Number(amount) / 100,
      currency,
      tx_ref: order.data.id,
      status: "pending",
    });

    const approvalUrl = order.data.links?.find((l) => l.rel === "approve")?.href;
    if (!approvalUrl) {
      return res.status(500).json({ error: "PayPal approval link missing" });
    }

    res.json({ approvalUrl });
  } catch (err) {
    console.error("🚨 PayPal create-payment error:", err.response?.data || err);
    res.status(500).json({ error: "Failed to create PayPal order" });
  }
});

// ✅ Capture PayPal payment
router.post("/capture-order", async (req, res) => {
  try {
    const { orderID } = req.body;
    if (!orderID) return res.status(400).json({ error: "Missing orderID" });

    const accessToken = await generateAccessToken();
    console.log("🟢 Capturing PayPal order:", orderID);

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

    console.log("✅ PayPal capture success:", capture.data?.status);

    await digital contribution.findOneAndUpdate(
      { tx_ref: orderID },
      { status: "successful", meta: capture.data }
    );

    res.json({ success: true, capture: capture.data });
  } catch (err) {
    console.error("🚨 PayPal capture error:", err.response?.data || err.message);
    res.status(500).json({
      error: err.response?.data || "Failed to capture PayPal order",
    });
  }
});

export default router;
