const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  subscriptionPlan: {
    type: String,
    enum: ["Free", "Pro"],
    default: "Free",
  },
  scanLimit: {
    quickScan: { type: Number, default: 10 }, // 10 for Free, updated to 20 for Pro
  },
  scansPerformedToday: {
    quickScan: { type: Number, default: 0 },
  },
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model("User", userSchema);

module.exports = User;
