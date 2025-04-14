import express from "express";
import {
  getAllInvoices,
  getInvoiceById,
  updateInvoice,
  deleteInvoice,
  generatePdf,
  generatePdfById,
} from "../controllers/quotationController.js";
import { protect, checkQuotationAccess } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.post("/", generatePdf);
router.get("/", getAllInvoices);
router.get("/:id", checkQuotationAccess, getInvoiceById);
router.get("/:id/pdf", checkQuotationAccess, generatePdfById);
router.put("/:id", checkQuotationAccess, updateInvoice);
router.delete("/:id", checkQuotationAccess, deleteInvoice);

export default router;
