import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/User.js";

dotenv.config();

const start = async () => {
  try {
    console.log("Connecting to MongoDB...");

    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 30000,
    });

    console.log("Connected!");

    const name = process.env.ADMIN_NAME || "Admin";
    const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD;

    if (!email || !password) {
      console.log("❌ ADMIN_EMAIL or ADMIN_PASSWORD missing in .env");
      process.exit(1);
    }

    let admin = await User.findOne({ email });

    if (admin) {
      admin.name = name;
      admin.password = password;
      admin.isAdmin = true;

      await admin.save();

      console.log("✅ ADMIN UPDATED SUCCESSFULLY");
    } else {
      admin = await User.create({
        name,
        email,
        password,
        isAdmin: true,
      });

      console.log("✅ ADMIN CREATED SUCCESSFULLY");
    }

    console.log({
      id: admin._id.toString(),
      name: admin.name,
      email: admin.email,
      isAdmin: admin.isAdmin,
      passwordStoredAsHash: admin.password.startsWith("$2"),
    });

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("❌ ERROR:", err);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
};

start();
