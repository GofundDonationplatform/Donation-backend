import User from "../models/User.js";
import Donation from "../models/Donation.js"; // create later
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

// -----------------------------------------
// ADMIN LOGIN
// -----------------------------------------
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find admin
    const admin = await User.findOne({ email, role: "admin" });
    if (!admin) {
      return res.status(401).json({ message: "Unauthorized: Not an Admin" });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid Credentials" });
    }

    // Create token
    const token = jwt.sign(
      { id: admin._id, role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });

  } catch (error) {
    console.error("Admin Login Error", error);
    res.status(500).json({ message: "Server error" });
  }
};


// -----------------------------------------
// ADMIN DASHBOARD DATA
// -----------------------------------------
export const getAdminDashboard = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: "user" });
    const totalAdmins = await User.countDocuments({ role: "admin" });

    const totalDonations = await Donation.countDocuments();
    const donationSum = await Donation.aggregate([
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    res.json({
      totalUsers,
      totalAdmins,
      totalDonations,
      donationAmount: donationSum[0]?.total || 0
    });

  } catch (error) {
    console.error("Dashboard Error", error);
    res.status(500).json({ message: "Server error" });
  }
};
