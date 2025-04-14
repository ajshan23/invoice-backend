import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import sharp from "sharp";
import fs from "fs/promises";
import path from "path";

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, "checked", { expiresIn: "30d" });
};

// @desc    Register new user (Admin only)
export const register = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Not authorized to create users",
      });
    }

    const user = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      role: req.body.role || "staff",
    });

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      },
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Authenticate user
export const login = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email }).select(
      "+password"
    );

    if (!user || !(await user.matchPassword(req.body.password))) {
      return res.status(401).json({
        success: false,
        error: "Invalid credentials",
      });
    }

    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get current user
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get all users (Admin only)
export const getUsers = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Not authorized to view users",
      });
    }

    const users = await User.find().select("-password");
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get single user by ID (Admin only)
export const getUserById = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Not authorized to view user",
      });
    }

    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update user (Admin only)
export const updateUser = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Not authorized to update users",
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // Update basic fields
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.role = req.body.role || user.role;

    if (req.body.password) {
      user.password = req.body.password;
    }

    // Handle signature if uploaded
    if (req.file) {
      const filePath = req.file.path;
      console.log("Processing file:", filePath);

      // Process the uploaded file with Sharp
      let buffer;
      if (req.file.mimetype === "image/svg+xml") {
        buffer = await fs.readFile(filePath);
      } else {
        buffer = await sharp(filePath).png().toBuffer();
      }

      // Convert buffer to base64
      user.signature = `data:image/png;base64,${buffer.toString("base64")}`;

      // Clean up temporary file
      await fs.unlink(filePath).catch((err) => {
        console.error("Error deleting temp file:", err);
      });
    }

    const updatedUser = await user.save();
    res.json({
      success: true,
      data: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        signature: updatedUser.signature,
      },
    });
  } catch (error) {
    // Clean up file in case of error
    if (req.file) {
      await fs.unlink(req.file.path).catch((err) => {
        console.error("Error deleting temp file in error handler:", err);
      });
    }
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Delete user (Admin only)
export const deleteUser = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Not authorized to delete users",
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    await user.deleteOne();
    res.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Upload/Update user signature (Admin only)
export const uploadSignature = async (req, res) => {
  try {
    // Check if the user is an admin
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Not authorized to manage signatures",
      });
    }

    // Get the target user ID from the request body or params
    const userId = req.body.userId || req.params.userId;
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "User ID is required",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No file uploaded",
      });
    }

    const filePath = req.file.path;
    console.log("Processing file:", filePath);

    // Process the uploaded file with Sharp
    let buffer;
    if (req.file.mimetype === "image/svg+xml") {
      buffer = await fs.readFile(filePath);
    } else {
      buffer = await sharp(filePath).png().toBuffer();
    }

    // Convert buffer to base64
    const base64Signature = `data:image/png;base64,${buffer.toString(
      "base64"
    )}`;

    // Save base64 signature to user
    user.signature = base64Signature;
    await user.save();

    // Attempt to clean up temporary file with retry
    let attempts = 3;
    while (attempts > 0) {
      try {
        await fs.unlink(filePath);
        console.log("File deleted:", filePath);
        break;
      } catch (unlinkError) {
        console.error(
          `Unlink attempt ${4 - attempts} failed:`,
          unlinkError.message
        );
        attempts--;
        if (attempts === 0) {
          console.error("Failed to delete file after retries:", filePath);
          // Continue without throwing to avoid failing the request
        } else {
          // Wait briefly before retrying
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }
    }

    res.json({
      success: true,
      data: {
        _id: user._id,
        signature: user.signature,
      },
    });
  } catch (error) {
    // Clean up file in case of error, with error handling
    if (req.file) {
      let attempts = 3;
      while (attempts > 0) {
        try {
          await fs.unlink(req.file.path);
          console.log("Error handler: File deleted:", req.file.path);
          break;
        } catch (unlinkError) {
          console.error(
            `Error handler: Unlink attempt ${4 - attempts} failed:`,
            unlinkError.message
          );
          attempts--;
          if (attempts === 0) {
            console.error(
              "Error handler: Failed to delete file:",
              req.file.path
            );
          } else {
            await new Promise((resolve) => setTimeout(resolve, 100));
          }
        }
      }
    }
    res.status(500).json({ success: false, error: error.message });
  }
};
// @desc    Get user signature (Admin only)
export const getSignature = async (req, res) => {
  try {
    // Check if the user is an admin
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Not authorized to view signatures",
      });
    }

    // Get the target user ID from params
    const userId = req.params.userId;
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "User ID is required",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    if (!user.signature) {
      return res.status(404).json({
        success: false,
        error: "No signature found for this user",
      });
    }

    res.json({
      success: true,
      data: {
        signature: user.signature,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
