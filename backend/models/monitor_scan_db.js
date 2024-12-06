const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema({
  productName: { type: String, required: true },
  productVersion: { type: String },
});

const MonitorScanSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  vendorId: { type: String, required: true },
  vendorName: { type: String, required: true },
  vendorWebsite: { type: String, required: true },
  itOrOt: { type: String, required: true },
  products: { type: [ProductSchema], default: [] },
});

const MonitorScan = mongoose.model("MonitorScan", MonitorScanSchema);
module.exports = MonitorScan;
