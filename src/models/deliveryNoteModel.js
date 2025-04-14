import mongoose from "mongoose";

const deliveryNoteSchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  date: { type: Date, required: true },
  items: [
    {
      description: String,
      quantity: Number,
    },
  ],
  deliveryNumber: { type: String, required: true },
  receivedBy: { type: String }, // No longer required, set to user.name
  signatureImage: { type: String, default: null }, // Base64 signature
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  preparedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
});

const Delivery = mongoose.model("Delivery", deliveryNoteSchema);
export default Delivery;
