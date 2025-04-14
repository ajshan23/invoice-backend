import Delivery from "../models/deliveryNoteModel.js";
import User from "../models/userModel.js";
import { generateDeliveryPdfBuffer } from "../utils/deliveryPdfGenerator.js";

// @desc    Create delivery note
export const generateDeliveryPdf = async (req, res) => {
  try {
    const { companyName, date, items, deliveryNumber } = req.body;

    // Validate required fields
    if (!companyName || !date || !items || !deliveryNumber) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
      });
    }

    // Fetch the authenticated user's name and signature
    const user = await User.findById(req.user.id).select("name signature");
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // Use the user's signature and name
    const signatureImage = user.signature || null;
    const receivedBy = user.name;

    // Create new delivery note
    const newDelivery = new Delivery({
      companyName,
      date,
      items,
      deliveryNumber,
      receivedBy, // Set to user's name
      signatureImage, // Set to user's signature
      createdBy: req.user.id,
      preparedBy: req.user.id,
    });

    await newDelivery.save();

    // Generate PDF with the delivery details
    const { base64 } = await generateDeliveryPdfBuffer(
      {
        companyName,
        date,
        items,
        deliveryNumber,
        receivedBy,
        signatureImage,
      },
      true
    );

    res.json({ success: true, pdf: base64 });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "PDF generation failed",
      details: error.message,
    });
  }
};

// @desc    Get all deliveries (admin: all, staff: only theirs)
export const getAllDeliveries = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;
    const query = {
      $or: [
        { companyName: { $regex: search, $options: "i" } },
        { deliveryNumber: { $regex: search, $options: "i" } },
      ],
      ...(req.user.role !== "admin" && { createdBy: req.user.id }),
    };

    const deliveries = await Delivery.find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 })
      .populate("createdBy", "name email")
      .populate("preparedBy", "name email");

    const total = await Delivery.countDocuments(query);

    res.json({
      success: true,
      data: deliveries,
      pagination: {
        page: Number(page),
        pages: Math.ceil(total / limit),
        total,
        limit: Number(limit),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get single delivery
export const getDeliveryById = async (req, res) => {
  try {
    const delivery = await Delivery.findById(req.params.id)
      .populate("createdBy", "name email")
      .populate("preparedBy", "name email");

    if (!delivery) {
      return res
        .status(404)
        .json({ success: false, error: "Delivery not found" });
    }

    res.json({ success: true, data: delivery });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Delete delivery
export const deleteDelivery = async (req, res) => {
  try {
    const delivery = await Delivery.findById(req.params.id);

    if (!delivery) {
      return res
        .status(404)
        .json({ success: false, error: "Delivery not found" });
    }

    // Restrict deletion to admins or the creator
    if (
      req.user.role !== "admin" &&
      delivery.createdBy.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        error: "Not authorized to delete this delivery",
      });
    }

    await delivery.deleteOne();
    res.json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update delivery
export const updateDelivery = async (req, res) => {
  try {
    const { companyName, date, items, deliveryNumber } = req.body;

    const delivery = await Delivery.findById(req.params.id);

    if (!delivery) {
      return res
        .status(404)
        .json({ success: false, error: "Delivery not found" });
    }

    // Restrict updates to admins or the creator
    if (
      req.user.role !== "admin" &&
      delivery.createdBy.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        error: "Not authorized to update this delivery",
      });
    }

    // Fetch user for receivedBy and signatureImage if needed
    const user = await User.findById(req.user.id).select("name signature");
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // Update fields
    delivery.companyName = companyName || delivery.companyName;
    delivery.date = date || delivery.date;
    delivery.items = items || delivery.items;
    delivery.deliveryNumber = deliveryNumber || delivery.deliveryNumber;
    delivery.receivedBy = user.name; // Always set to current user's name
    delivery.signatureImage = user.signature || delivery.signatureImage;

    const updatedDelivery = await delivery.save();

    res.json({ success: true, data: updatedDelivery });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
export const downloadDeliveryPdf = async (req, res) => {
  try {
    const delivery = await Delivery.findById(req.params.id)
      .populate("createdBy", "name")
      .populate("preparedBy", "name");

    if (!delivery) {
      return res.status(404).json({
        success: false,
        error: "Delivery note not found",
      });
    }

    // Generate PDF with the delivery details
    const { base64 } = await generateDeliveryPdfBuffer(
      {
        companyName: delivery.companyName,
        date: delivery.date,
        items: delivery.items,
        deliveryNumber: delivery.deliveryNumber,
        receivedBy: delivery.receivedBy,
        signatureImage: delivery.signatureImage,
      },
      true // Return as base64
    );

    res.json({
      success: true,
      pdf: base64,
      filename: `Delivery_${delivery.companyName}_${delivery.deliveryNumber}.pdf`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "PDF generation failed",
      details: error.message,
    });
  }
};
