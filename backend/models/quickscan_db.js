const mongoose = require("mongoose");

const quickScanSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  productName: { type: String, required: true },
  productVersion: { type: String, default: null },
  scanId: { type: String, default: function() { return `SCAN-${this._id}`; }, unique: true }, // Unique scan ID
  results: [
    {
      cve_id: { type: String, unique: true, sparse: true }, // Maps to "cve_id"
      vulnerabilityDescription: { type: String, default: "N/A" }, // Maps to "vulnerabilityDescription"
      published_date: { type: Date, default: null }, // Maps to "published date"
      last_modified: { type: Date, default: null }, // Maps to "last modified"
      vulnStatus: { type: String, default: "N/A" }, // Maps to "vulnStatus"
      baseScore: { type: Number, default: null }, // Maps to "baseScore"
      baseSeverity: {
        type: String,
        enum: ["Low", "Medium", "High", "Critical", null],
        default: "N/A",
        set: (value) => value ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase() : value, // Capitalize first letter
      },
      oemUrl: { type: String, default: "N/A" }, // Maps to "oemUrl"
    },
  ],
  scanDate: { type: Date, default: Date.now }, // Automatically set scan date
  message: { type: String, default: "Scan completed successfully" }, // Additional field for scan message
});

const QuickScan = mongoose.model("QuickScan", quickScanSchema);

module.exports = QuickScan;





