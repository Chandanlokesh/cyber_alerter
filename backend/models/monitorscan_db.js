const mongoose = require("mongoose");

const monitorScanSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  productName: { type: String, required: true },
  productVersion: { type: String, default: null },
  vendorId: { type: String, required: true }, // Linked to OEM vendor collection
  results: [
    {
      severity: { type: String, enum: ["Low", "Medium", "High", "Critical"] },
      description: { type: String },
      mitigation: { type: String },
      publishedDate: { type: Date },
      cve: { type: String },
    },
  ],
  monitorDate: { type: Date, default: Date.now },
});

const MonitorScan = mongoose.model("MonitorScan", monitorScanSchema);

module.exports = MonitorScan;
