// models/Donation.js
import mongoose from "mongoose";

const DonationSchema = new mongoose.Schema({
  name: { type: String, default: "Anonymous" },
  email: { type: String, default: "donor@example.com" },
  amount: { type: Number, required: true },
  currency: { type: String, default: "USD" },
  tx_ref: { type: String, required: true, unique: true },
  status: { type: String, default: "pending" },
  flw_id: { type: String },
  meta: { type: Object },
}, { timestamps: true });

export default mongoose.model("Donation", DonationSchema);
