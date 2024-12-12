// Required modules
const express = require("express");
const { spawn } = require("child_process");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
const path = require("path");

// Models
const User = require("../models/users_db");
const Product = require("../models/product_data_db");
const Vendor = require("../models/vendors_db");
// const VulnList = require("../models/vuln_list");
const ScanResult = require("../models/vuln_list");
const CVE = require("../models/vuln_list");

// Route to get vendors by category
router.get("/vendors/:category", async (req, res) => {
  try {
    const { category } = req.params;

    // Fetch vendors for the given category
    const vendors = await Vendor.find({ category });

    if (vendors.length === 0) {
      return res
        .status(404)
        .json({ message: "No vendors found for this category." });
    }

    res.status(200).json({ vendors });
  } catch (error) {
    console.error("Error fetching vendors:", error.message);
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

// Route to add a product
router.post("/products", async (req, res) => {
  try {
    const { userId, vendorName, productName, productVersion } = req.body;

    // Validate required fields
    if (!userId || !vendorName || !productName) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    // Fetch user to check subscription plan
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    const maxLimit = user.subscriptionPlan === "Pro" ? 10 : 5; // Set limit based on plan

    // Check product count for the user
    const existingProducts = await Product.find({ userId });
    const remainingSlots = maxLimit - existingProducts.length - 1;

    if (remainingSlots <= 0) {
      return res
        .status(403)
        .json({ error: "Product limit reached for this user." });
    }

    // Create a new product
    const newProduct = new Product({
      userId,
      productId: uuidv4(),
      vendorName,
      productName,
      productVersion,
    });

    // Save the new product to the database
    await newProduct.save();

    res.status(201).json({
      message: "Product added successfully.",
      product: newProduct,
      remainingSlots,
    });
  } catch (error) {
    console.error("Error adding product:", error);
    res.status(500).json({ error: "Internal server error." });
  }
  
});

// Route to get products by userId
router.get("/products/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    // Fetch products for the given user
    const products = await Product.find({ userId });

    if (products.length === 0) {
      return res
        .status(404)
        .json({ message: "No products found for this user." });
    }

    res.status(200).json({ products });
  } catch (error) {
    console.error("Error fetching products:", error.message);
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

// Route to monitor products
router.post("/monitor", async (req, res) => {
  try {
    const { userId, productIds } = req.body;

    if (!userId || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ error: "User ID and an array of Product IDs are required." });
    }

    // Fetch user details to include email in the payload
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    const results = [];
    for (const productId of productIds) {
      // Fetch product details
      const product = await Product.findOne({ productId, userId });
      if (!product) {
        results.push({ productId, error: "Product not found." });
        continue;
      }

      // Prepare payload for Python script
      const payload = {
        userId,
        email: user.email, // Add user's email to payload
        productId,
        vendorName: product.vendorName,
        productName: product.productName,
      };

      // Spawn the Python process
      const pythonProcess = spawn("python", ["./monitor_py/dummy_script.py", JSON.stringify(payload)]);

      const pythonOutput = await new Promise((resolve, reject) => {
        let output = "";
        pythonProcess.stdout.on("data", (data) => {
          output += data.toString();
        });

        pythonProcess.stderr.on("data", (error) => {
          reject(error.toString());
        });

        pythonProcess.on("close", () => {
          try {
            const parsedOutput = JSON.parse(output);
            resolve(parsedOutput);
          } catch (err) {
            reject("Failed to parse Python script output.");
          }
        });
      });

      // Extract data from Python output
      const { cveIds, publishedDates, description, mitigations, severity, notification } = pythonOutput;

      // Save the Python output into the vuln_list collection
      const scanData = new ScanResult({
        productId,
        cveIds,
        publishedDates,
        description,
        mitigations,
        severity, // Save severity in the database
        totalVulnerabilities: cveIds.length,
        notification
      });

      await scanData.save();

      results.push({ productId, data: pythonOutput });
    }

    res.status(200).json({ message: "Data processed and saved successfully.", results });
  } catch (error) {
    console.error("Error processing monitor data:", error.message);
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

router.get("/notification", async (req, res) => {
  try {
    const notificationCount = await CVE.countDocuments({ Notification: { $gt: 0 } });
    res.status(200).json({ notificationCount });
  } catch (error) {
    console.error("Error fetching notification count:", error.message);
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

// Route to fetch scan details
router.get("/scan_details/:productId", async (req, res) => {
  try {
    const { productId } = req.params;

    if (!productId) {
      return res.status(400).json({ error: "Product ID is required." });
    }

    // Query the database for scan details
    const scanDetails = await ScanResult.findOne({ productId });

    if (!scanDetails) {
      return res
        .status(404)
        .json({ error: "No scan details found for this product." });
    }

    res
      .status(200)
      .json({ message: "Scan details fetched successfully.", scanDetails });
  } catch (error) {
    console.error("Error fetching scan details:", error.message);
    res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
});

module.exports = router;
