const mongoose = require("mongoose");

const VendorSchema = new mongoose.Schema({
    category: { type: String, enum: ["IT", "OT"], required: true },
    vendorName: { type: String, required: true },
    vendorWebsite: { type: String, required: true },
  });

module.exports = mongoose.model("Vendor", VendorSchema);