import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import Delivery from "../models/deliveryNoteModel.js";
import Quotation from "../models/quotationModel.js";

// Protect routes
export const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Not authorized, no token",
      });
    }

    const decoded = jwt.verify(token, "checked");
    req.user = await User.findById(decoded.id).select("-password");
    next();
  } catch (error) {
    console.error("Authentication Error:", error);
    res.status(401).json({
      success: false,
      error: "Not authorized",
    });
  }
};

// Admin middleware
export const admin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({
      success: false,
      error: "Not authorized as admin",
    });
  }
};

// Delivery access control
export const checkDeliveryAccess = async (req, res, next) => {
  try {
    const delivery = await Delivery.findById(req.params.id);

    if (!delivery) {
      return res.status(404).json({
        success: false,
        error: "Delivery not found",
      });
    }

    if (
      req.user.role !== "admin" &&
      delivery.createdBy.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        error: "Not authorized to access this delivery",
      });
    }

    next();
  } catch (error) {
    console.error("Access Check Error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to verify access",
    });
  }
};

// authMiddleware.js
export const checkQuotationAccess = async (req, res, next) => {
  try {
    const quotation = await Quotation.findById(req.params.id);

    if (!quotation) {
      return res.status(404).json({
        success: false,
        error: "Quotation not found",
      });
    }

    // Allow admin or creator
    if (
      req.user.role === "admin" ||
      quotation.preparedBy.toString() === req.user.id
    ) {
      return next();
    }

    res.status(403).json({
      success: false,
      error: "Not authorized to access this quotation",
    });
  } catch (error) {
    console.log(error);
    
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};
