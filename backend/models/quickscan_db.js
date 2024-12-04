const mongoose = require("mongoose");

const quickScanSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Reference to the user
  productName: { type: String, required: true },
  productVersion: { type: String, default: null },
  cveId: { type: String, default: null },
  results: [
    {
      cveId: { type: String, default: "CVE-xxxx-xxxx" },
      description: { type: String, default: "N/A" },
      publishedDate: { type: Date, default: null }, // Allow null instead of "N/A"
      lastModified: { type: Date, default: null }, // Allow null instead of "N/A"
      vulnStatus: { type: String, default: "N/A" },
      baseScore: { type: Number, default: "N/A" },
      baseSeverity: {
        type: String,
        enum: ["Low", "Medium", "High", "Critical", null],
        default: "N/A",
        set: (value) => value ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase() : value, // Capitalize first letter
      },
      oemUrl: { type: String, default: "N/A" },
    },
  ],
  scanDate: { type: Date, default: Date.now },
  scanId: { type: String, default: function() { return `SCAN-${this._id}`; }, unique: true }, // Automatically assigned scanId
});

const QuickScan = mongoose.model("QuickScan", quickScanSchema);

module.exports = QuickScan;
