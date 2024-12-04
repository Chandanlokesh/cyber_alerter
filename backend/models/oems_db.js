const mongoose = require("mongoose");

const oemVendorSchema = new mongoose.Schema({
  vendorId: { type: String, required: true, unique: true }, // Unique ID for each OEM
  name: { type: String, required: true }, // Vendor Name
  website: { type: String, required: true }, // Official Website URL
  category: { type: String, enum: ["IT", "OT"], required: true }, // IT or OT
});

const OemVendor = mongoose.model("OemVendor", oemVendorSchema);

module.exports = OemVendor;
