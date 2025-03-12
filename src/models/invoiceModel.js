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

const invoiceSchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  date: { type: Date, required: true },
  invoiceNumber: { type: String, required: true, unique: true },
  items: [itemSchema],
  terms: [{ type: String }],
  totalPrice: { type: Number, required: true },
  VATAmount: { type: Number, required: true },
  finalAmount: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Update the `updatedAt` field before saving
invoiceSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const Invoice = mongoose.model("Invoice", invoiceSchema);

export default Invoice;
