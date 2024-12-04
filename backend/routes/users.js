const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/users_db");
const blacklist = new Set(); // Replace with Redis for production

const router = express.Router();

// Use an environment variable for the secret key
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";

// Middleware to Verify Token and Blacklist
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Unauthorized: Token is missing" });
  }

  if (blacklist.has(token)) {
    return res.status(401).json({ message: "Token invalidated. Please log in again." });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(403).json({ message: "Invalid or expired token", error });
  }
};

// User Signup Route
router.post("/signup", async (req, res) => {
  const { username, email, password, subscriptionPlan } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const scanLimit = subscriptionPlan === "Pro" ? 20 : 10;

    const user = new User({
      username,
      email,
      password: hashedPassword,
      subscriptionPlan,
      scanLimit,
      scansPerformedToday: 0,
    });

    await user.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error registering user", error });
  }
});

// User Login Route
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: "1h" });

    res.status(200).json({ message: "Login successful", data:{token, userId:user._id} });
  } catch (error) {
    res.status(500).json({ message: "Error logging in", error });
  }
});

// Get User Details for Dashboard (Protected route)
router.get("/user_profile", verifyToken, async (req, res) => {
  const userId = req.userId;  // Get userId from the token

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      status:"Dashboard data retrieved successfully",
      data:{
      username: user.username,
      email: user.email,
      subscriptionPlan: user.subscriptionPlan,
      //dashboard data
      scanLimit: user.scanLimit,
      scansPerformedToday: user.scansPerformedToday,
      }
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching user details",
      error: error.message,
    });
  }
});

// Upgrade Plan Route (Protected route)
router.post("/upgrade", verifyToken, async (req, res) => {
  const userId = req.userId;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.subscriptionPlan === "Pro") {
      return res.status(400).json({ message: "User is already on Pro plan" });
    }

    user.subscriptionPlan = "Pro";

    // Adjust based on scanLimit schema
    user.scanLimit = {
      quickScan: 20,  // Example for object type
      monitorScan: 10,
    };

    await user.save();

    res.status(200).json({ message: "Plan upgraded successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error upgrading plan", error });
  }
});

// Logout Route
router.post("/logout", (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ message: "Token is required for logout" });
  }

  blacklist.add(token);
  res.status(200).json({ message: "Logout successful" });
});

// Log incoming requests for debugging
router.use((req, res, next) => {
  console.log("Request Method:", req.method);
  console.log("Request URL:", req.originalUrl);
  console.log("Request Body:", req.body);  // Log the body of the request
  console.log("Request Query:", req.query); // Log the query parameters
  next();
});

module.exports = router;
