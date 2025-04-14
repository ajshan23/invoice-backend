import express from "express";
import {
  register,
  login,
  getMe,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  uploadSignature,
  getSignature,
} from "../controllers/userController.js";
import { protect, admin } from "../middleware/authMiddleware.js";
import upload from "../config/uploader.js";

const router = express.Router();
// Auth routes
router.post("/login", login);
router.post(
  "/register",
  protect,
  admin,
  upload.single("signature"), // Add multer middleware here
  register
);
router.get("/me", protect, getMe);

// User management routes (Admin only)
router.get("/", protect, admin, getUsers);
router.get("/:id", protect, admin, getUserById);
router.put(
  "/:id",
  protect,
  admin,
  upload.single("signature"), // Add multer middleware here
  updateUser
);
router.delete("/:id", protect, admin, deleteUser);

// Signature management routes (Admin only)
router.post(
  "/signature",
  protect,
  admin,
  upload.single("signature"),
  uploadSignature
);
router.get("/signature/:userId", protect, admin, getSignature);
export default router;
