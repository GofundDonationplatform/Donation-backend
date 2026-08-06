import User from "../models/User.js";
import Campaign from "../models/Campaign.js";
import Transaction from "../models/Transaction.js";

// ==============================
// ADMIN DASHBOARD
// ==============================
export const getAdminDashboard = async (req, res) => {
  try {
    const [
      totalUsers,
      totalAdmins,
      campaigns,
      completedTransactions
    ] = await Promise.all([
      User.countDocuments({ isAdmin: false }),
      User.countDocuments({ isAdmin: true }),
      Campaign.find(),
      Transaction.find({ status: "completed" })
    ]);

    const totalCampaigns = campaigns.length;

    const totalRaised = campaigns.reduce(
      (sum, c) => sum + (c.amountRaised || 0),
      0
    );

    const totalGoal = campaigns.reduce(
      (sum, c) => sum + (c.goalAmount || 0),
      0
    );

    res.json({
      success: true,
      totalUsers,
      totalAdmins,
      totalCampaigns,
      totalGoal,
      totalRaised,
      totalDonations: completedTransactions.length,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Dashboard error",
    });
  }
};

// ==============================
// USERS
// ==============================
export const getUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      users,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Unable to fetch users",
    });
  }
};

// ==============================
// DONATIONS (TRANSACTIONS)
// ==============================
export const getDonations = async (req, res) => {
  try {
    const donations = await Transaction.find().sort({
      createdAt: -1,
    });

    res.json({
      success: true,
      donations,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Unable to fetch donations",
    });
  }
};

// ==============================
// CAMPAIGNS
// ==============================
export const getCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find().sort({
      createdAt: -1,
    });

    res.json({
      success: true,
      campaigns,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Unable to fetch campaigns",
    });
  }
};
