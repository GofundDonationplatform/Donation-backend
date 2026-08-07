import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import User from "../models/User.js";

import {
  getAdminDashboard,
  getUsers,
  getDonations,
  toggleAdmin,
} from "../controllers/adminController.js";

import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// ==============================
// ADMIN LOGIN
// ==============================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await User.findOne({
      email,
      isAdmin: true,
    });

    if (!admin) {
      return res.status(400).json({
        error: "Admin not found",
      });
    }

    const ok = await bcrypt.compare(
      password,
      admin.password
    );

    if (!ok) {
      return res.status(400).json({
        error: "Invalid password",
      });
    }

    const token = jwt.sign(
      {
        id: admin._id,
        isAdmin: true,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.json({
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: "admin",
      },
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Server error",
    });
  }
});

// ==============================
// ADMIN API
// ==============================

router.get(
  "/dashboard",
  protect,
  adminOnly,
  getAdminDashboard
);

router.get(
  "/users",
  protect,
  adminOnly,
  getUsers
);

router.get(
  "/donations",
  protect,
  adminOnly,
  getDonations
);

router.put(
  "/users/:id/toggle-admin",
  protect,
  adminOnly,
  toggleAdmin
);

export default router;
