import mongoose from "mongoose";

const subItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
});

const itemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  image: { type: String }, // Base64 image string
  subItems: [subItemSchema],
});

const quotationSchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  date: { type: Date, required: true },
  quotationNumber: { type: String, required: true, unique: true }, // Changed from invoiceNumber
  items: [itemSchema],
  terms: [{ type: String }],
  totalPrice: { type: Number, required: true },
  VATAmount: { type: Number, required: true },
  finalAmount: { type: Number, required: true },
  preparedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Update the `updatedAt` field before saving
quotationSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const Quotation = mongoose.model("Quotation", quotationSchema); // Changed from Invoice

export default Quotation;
