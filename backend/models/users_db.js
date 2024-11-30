const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    planType: { type: String, default: "Free" },
    quickScanCount: { type: Number, default: 0 },
    monitorScanProductCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
module.exports = User;
