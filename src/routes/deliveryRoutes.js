import express from "express";
import {
  generateDeliveryPdf,
  getAllDeliveries,
  getDeliveryById,
  deleteDelivery,
  updateDelivery,
  downloadDeliveryPdf,
} from "../controllers/deliveryController.js";
import { protect, checkDeliveryAccess } from "../middleware/authMiddleware.js";
import multer from "multer";

// const upload = multer();
const router = express.Router();

router.use(protect);

// router.post("/generate", upload.single("signature"), generateDeliveryPdf);
router.post("/generate", generateDeliveryPdf);
router.get("/download/:id", protect, downloadDeliveryPdf);
router.get("/", getAllDeliveries);
router.get("/:id", checkDeliveryAccess, getDeliveryById);
router.delete("/:id", checkDeliveryAccess, deleteDelivery);
router.put("/:id", checkDeliveryAccess, updateDelivery);
export default router;
