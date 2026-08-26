import axios from "axios";
import dotenv from "dotenv";
import Transaction from "../models/Transaction.js";
import Campaign from "../models/Campaign.js";

dotenv.config();

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
const BASE_URL = "https://api.paystack.co";

// Initialize Paystack Payment
export const initializePaystack = async (req, res) => {
  try {
    const {
      amount,
      email,
      name,
      currency,
      campaignId,
    } = req.body;

    if (!amount || !email) {
      return res.status(400).json({
        error: "Amount and email are required",
      });
    }

    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        error: "Invalid amount",
      });
    }

    if (!PAYSTACK_SECRET) {
      return res.status(500).json({
        error: "Paystack secret not configured",
      });
    }

    // If a campaign was supplied, make sure it exists.
    if (campaignId) {
      const campaign = await Campaign.findById(campaignId);

      if (!campaign) {
        return res.status(404).json({
          error: "Campaign not found",
        });
      }

      if (!["Approved", "Completed"].includes(campaign.status)) {
        return res.status(400).json({
          error: "Campaign is not currently accepting donations",
        });
      }
    }

    const normalizedCurrency = String(currency || "NGN").toUpperCase();

    // Paystack amount is expressed in the smallest currency unit.
    const amountInSubunit = Math.round(numericAmount * 100);

    const payload = {
      email: email.trim().toLowerCase(),
      amount: amountInSubunit,
      currency: normalizedCurrency,
      metadata: {
        donorName: name || "Donor",
        campaignId: campaignId || null,
      },
      callback_url:
        process.env.PAYSTACK_CALLBACK_URL ||
        `${(process.env.FRONTEND_URL || "http://localhost:5173").replace(
          /\/$/,
          ""
        )}/donate-success`,
    };

    const response = await axios.post(
      `${BASE_URL}/transaction/initialize`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
          "Content-Type": "application/json",
        },
      }
    );

    const payment = response.data?.data;

    if (!payment?.authorization_url || !payment?.reference) {
      return res.status(502).json({
        error: "Paystack did not return a valid payment session",
      });
    }

    // Store our own transaction using Paystack's reference.
    await Transaction.create({
      name: name || "Donor",
      email: email.trim().toLowerCase(),
      amount: numericAmount,
      currency: normalizedCurrency,
      tx_ref: payment.reference,
      status: "pending",
      method: "paystack",
      meta: {
        campaignId: campaignId || null,
        paystackReference: payment.reference,
      },
    });

    return res.json({
      status: true,
      authorization_url: payment.authorization_url,
      reference: payment.reference,
    });
  } catch (error) {
    console.error(
      "PAYSTACK INIT ERROR",
      error.response?.data || error.message
    );

    return res.status(500).json({
      error: "Paystack initialization failed",
    });
  }
};


// Verify Paystack Payment
export const verifyPaystack = async (req, res) => {
  try {
    const reference = String(req.query.reference || "").trim();

    if (!reference) {
      return res.status(400).json({
        error: "Payment reference is required",
      });
    }

    if (!PAYSTACK_SECRET) {
      return res.status(500).json({
        error: "Paystack secret not configured",
      });
    }

    const response = await axios.get(
      `${BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
        },
      }
    );

    const data = response.data?.data;

    if (!data) {
      return res.status(502).json({
        error: "Invalid response from Paystack",
      });
    }

    const transaction = await Transaction.findOne({
      tx_ref: reference,
    });

    if (!transaction) {
      return res.status(404).json({
        error: "Transaction record not found",
        reference,
      });
    }

    // Payment succeeded at Paystack.
    if (data.status === "success") {
      // Prevent duplicate campaign crediting.
      const alreadyCompleted = transaction.status === "completed";

      transaction.status = "completed";
      transaction.method = "paystack";
      transaction.meta = {
        ...(transaction.meta || {}),
        paystack: data,
      };

      await transaction.save();

      // Credit the campaign only once.
      if (!alreadyCompleted) {
        const campaignId = transaction.meta?.campaignId;

        if (campaignId) {
          const campaign = await Campaign.findById(campaignId);

          if (campaign) {
            const donorCurrency = String(
              transaction.currency || data.currency || "NGN"
            ).toUpperCase();

            const campaignCurrency = String(
              campaign.currency || "USD"
            ).toUpperCase();

            const donorAmount = Number(transaction.amount);

            if (!Number.isFinite(donorAmount) || donorAmount <= 0) {
              throw new Error("Invalid donor transaction amount.");
            }

            let campaignCreditAmount = donorAmount;
            let exchangeRate = 1;

            // A campaign is always credited in its own currency.
            // If donor and campaign currencies differ, obtain the
            // current FX rate at verification time and convert once.
            if (donorCurrency !== campaignCurrency) {
              const fxResponse = await axios.get(
                `https://open.er-api.com/v6/latest/${encodeURIComponent(
                  donorCurrency
                )}`,
                {
                  timeout: 10000,
                }
              );

              const fxRate =
                fxResponse.data?.rates?.[campaignCurrency];

              if (!Number.isFinite(Number(fxRate)) || Number(fxRate) <= 0) {
                throw new Error(
                  `Unable to obtain FX rate from ${donorCurrency} to ${campaignCurrency}.`
                );
              }

              exchangeRate = Number(fxRate);
              campaignCreditAmount =
                Math.round(donorAmount * exchangeRate * 100) / 100;
            }

            campaign.amountRaised =
              Number(campaign.amountRaised || 0) +
              campaignCreditAmount;

            campaign.donorCount =
              Number(campaign.donorCount || 0) + 1;

            transaction.meta = {
              ...(transaction.meta || {}),
              campaignCredit: {
                donorAmount,
                donorCurrency,
                campaignCurrency,
                creditedAmount: campaignCreditAmount,
                exchangeRate,
                converted: donorCurrency !== campaignCurrency,
                convertedAt: new Date().toISOString(),
              },
            };

            // Automatically mark campaign completed when goal is reached.
            if (
              Number(campaign.amountRaised) >=
              Number(campaign.goalAmount)
            ) {
              campaign.status = "Completed";
            }

            await transaction.save();
            await campaign.save();
          }
        }
      }
    }

    return res.json(response.data);
  } catch (error) {
  const paystackStatus = error.response?.status;
  const paystackData = error.response?.data;
  const paystackCode = paystackData?.code;
  const paystackMessage = paystackData?.message;

  console.error(
    "PAYSTACK VERIFY ERROR",
    JSON.stringify(
      {
        status: paystackStatus,
        code: paystackCode,
        message: paystackMessage,
        data: paystackData,
        error: error.message,
      },
      null,
      2
    )
  );

  if (
    paystackStatus === 400 ||
    paystackCode === "transaction_not_found" ||
    paystackMessage === "Transaction reference not found."
  ) {
    return res.status(400).json({
      error: paystackMessage || "Transaction reference not found.",
      code: paystackCode || "transaction_not_found",
    });
  }

  if (paystackStatus === 404) {
    return res.status(404).json({
      error: "Paystack transaction reference not found",
    });
  }

  return res.status(502).json({
    error: "Unable to verify payment with Paystack",
  });
}
};
