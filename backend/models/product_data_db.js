const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, required: true },
    productId: { type: String, unique: true, required: true },
    vendorName: { type: String, required: true },
    productName: { type: String, required: true },
    productVersion: { type: String },
    createdAt: { type: Date, default: Date.now },
  });

module.exports = mongoose.model("Product", ProductSchema);