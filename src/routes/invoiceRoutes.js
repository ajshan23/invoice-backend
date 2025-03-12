import express from "express";
import {
  getAllInvoices,
  getInvoiceById,
  updateInvoice,
  deleteInvoice,
  generatePdf,
  generatePdfById,
} from "../controllers/pdfController.js";

const router = express.Router();

// Create a new invoice

router.post("/", generatePdf);
// Get all invoices
router.get("/", getAllInvoices);

// Get a single invoice by ID
router.get("/:id", getInvoiceById);

//gentrate pdf from an id
router.get("/:id/pdf", generatePdfById);

// Update an invoice by ID
router.put("/:id", updateInvoice);

// Delete an invoice by ID
router.delete("/:id", deleteInvoice);

export default router;
