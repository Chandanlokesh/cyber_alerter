const mongoose = require("mongoose");
const CVESchema = new mongoose.Schema({
    productId: { type: String, required: true },
    cveIds: [String], // List of CVE IDs
    publishedDates: [Date], // List of published dates
    description: { type: String }, // Combined description
    mitigations: [String], // Multiple mitigation strategies
    totalVulnerabilities: { type: Number }, // Count of CVEs
    createdAt: { type: Date, default: Date.now },
});
module.exports = mongoose.model("CVE", CVESchema); 