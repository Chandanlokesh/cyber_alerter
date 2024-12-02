const mongoose = require("mongoose");

const quickScanSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  productName: { type: String, required: true },
  productVersion: { type: String, default: null },
  cveId: { type: String, default: null },
  results: [
    {
      oemName: { type: String },
      severity: { type: String, enum: ["Low", "Medium", "High", "Critical"] },
      description: { type: String },
      mitigation: { type: String },
      publishedDate: { type: Date },
      cve: { type: String },
      oemUrl: { type: String },
    },
  ],
  scanDate: { type: Date, default: Date.now },
});

const QuickScan = mongoose.model("QuickScan", quickScanSchema);

module.exports = QuickScan;
