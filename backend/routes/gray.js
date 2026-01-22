// routes/gray.js
import express from "express";
import digital contribution from "../models/digital contribution.js";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = express.Router();

// -------------------------
// File upload setup
// -------------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "uploads/receipts";
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// -------------------------
// Initiate Gray Payment
// -------------------------
router.post("/initiate", async (req, res) => {
  try {
    const { name, email, amount } = req.body;

    if (!amount) return res.status(400).json({ error: "Amount required" });

    const tx_ref = "GRAY_" + Date.now(); // unique reference for Gray

    const digital contribution = await digital contribution.create({
      name: name || "Anonymous",
      email: email || "donor@example.com",
      amount,
      method: "gray",
      tx_ref,
      status: "pending",
    });

    // Payment directions (can be any instructions you want)
    const directions = `
      Please transfer ${amount} USD to:
      Bank: Grey Bank
      Account Name: Gray Business digital contributions
      Account Number: 1234567890
    `;

    res.json({
      digital contributionId: digital contribution._id,
      tx_ref,
      directions,
      message: "Follow the instructions to complete payment, then confirm below.",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gray payment initiation failed" });
  }
});

// -------------------------
// Confirm Gray Payment
// -------------------------
router.post("/confirm/:digital contributionId", upload.single("receipt"), async (req, res) => {
  try {
    const { digital contributionId } = req.params;

    const digital contribution = await digital contribution.findById(digital contributionId);
    if (!digital contribution) return res.status(404).json({ error: "digital contribution not found" });

    digital contribution.status = "completed"; // mark as paid
    if (req.file) digital contribution.receiptUrl = req.file.path; // save uploaded receipt path

    await digital contribution.save();

    res.json({ message: "digital contribution confirmed successfully!", digital contribution });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gray payment confirmation failed" });
  }
});

export default router;
