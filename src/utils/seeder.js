import mongoose from "mongoose";
import User from "../models/userModel.js";
import dotenv from "dotenv";

dotenv.config();

const createAdminUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect("mongodb://localhost:27017/pdf-app");

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: "admin@example.com" });

    if (existingAdmin) {
      console.log("Admin user already exists");
      await mongoose.disconnect();
      return;
    }

    // Create admin user
    const admin = await User.create({
      name: "Admin",
      email: "admin@example.com",
      password: "admin123", // In production, use a more secure password
      role: "admin",
    });

    console.log("Admin user created successfully:", {
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
    });

    await mongoose.disconnect();
  } catch (error) {
    console.error("Error creating admin user:", error.message);
    process.exit(1);
  }
};

createAdminUser();
