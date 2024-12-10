const express = require("express");
const { spawn } = require("child_process");
const router = express.Router();
const User = require("../models/users_db");
const Product = require("../models/product_data_db");
const VulnList = require("../models/vuln_list");
const { v4: uuidv4 } = require("uuid");
const path = require("path");


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
    const remainingSlots = maxLimit - existingProducts.length;

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
      return res.status(404).json({ message: "No products found for this user." });
    }

    res.status(200).json({ products });
  } catch (error) {
    console.error("Error fetching products:", error.message);
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

router.post("/monitor", async (req, res) => {
  try {
    const { userId, productIds } = req.body;

    if (!userId || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ error: "User ID and an array of Product IDs are required." });
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
        productId,
        vendorName: product.vendorName,
        productName: product.productName,
      };
      console.log("Payload:", payload);
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

      results.push({ productId, data: pythonOutput });
    }

    res.status(200).json({ message: "Data fetched successfully.", results });
  } catch (error) {
    console.error("Error triggering Python script:", error.message);
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

// Route to fetch scan details

router.get("/scan_details/:productId", async (req, res) => {
  try {
    console.log(`[DEBUG] Incoming GET request - Method: ${req.method}, URL: ${req.url}`);

    const { productId } = req.params;
    console.log("[DEBUG] Request Parameters:", req.params);

    if (!productId) {
      console.error("[ERROR] No Product ID provided in request.");
      return res.status(400).json({ error: "Product ID is required." });
    }

    console.log(`[DEBUG] Attempting to query the database for scan details with productId: ${productId}`);

    // Query the database for scan details in the 'vuln_list' collection
    const scanDetails = await ScanResult.findOne({ productId });

    if (!scanDetails) {
      console.warn(`[WARN] No scan details found for product ID: ${productId}`);
      return res.status(404).json({ error: "No scan details found for this product." });
    }

    console.log(`[DEBUG] Found scan details:`, scanDetails);
    res.status(200).json({ message: "Scan details fetched successfully.", scanDetails });
  } catch (error) {
    console.error("[ERROR] Database query or server error occurred:", error.message);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
});


module.exports = router;
