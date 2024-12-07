const express = require("express");
const router = express.Router();
const MonitorScan = require("../models/monitor_scan_db");
const usersDb = require("../models/users_db");
const { spawn } = require("child_process");

// Mock OEM data
const oemList = {
  IT: [
    { vendorId: "1", vendorName: "Dell", vendorWebsite: "https://www.dell.com", itOrOt: "IT" },
    { vendorId: "2", vendorName: "HP", vendorWebsite: "https://www.hp.com", itOrOt: "IT" },
  ],
  OT: [
    { vendorId: "3", vendorName: "Siemens", vendorWebsite: "https://www.siemens.com", itOrOt: "OT" },
    { vendorId: "4", vendorName: "GE", vendorWebsite: "https://www.ge.com", itOrOt: "OT" },
  ],
};

// =========================== Routes ===========================

// GET: Retrieve OEM list based on IT/OT
router.get("/oem-list", (req, res) => {
  try {
    res.json(oemList);
    } catch (error) {
    console.error("Error fetching OEM list:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// POST: Add product to user's monitor list
router.post("/add-product", async (req, res) => {
    try {
      const { userId, vendorId, productName, productVersion } = req.body;
  
      // Validate required fields
      if (!userId || !vendorId || !productName) {
        return res.status(400).json({ error: "userId, vendorId, and productName are required fields." });
      }
  
      // Fetch user subscription plan
      const user = await usersDb.findById(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found." });
      }
  
      const planLimit = user.subscriptionPlan === "Pro" ? 10 : 5;
  
      // Check if vendor exists
      const vendor = oemList.IT.concat(oemList.OT).find((oem) => oem.vendorId === vendorId);
      if (!vendor) {
        return res.status(400).json({ error: "Invalid vendorId." });
      }
  
      // Fetch existing monitor record
      const monitorRecord = await MonitorScan.findOne({ userId, vendorId });
      const totalProducts = monitorRecord ? monitorRecord.products.length : 0;
      console.log(totalProducts);
  
      if (totalProducts >= planLimit) {
        return res.status(400).json({ error: `Product limit exceeded. Max allowed: ${planLimit}.` });
      }
  
      // Add product to monitor record
      const newProduct = { productName, productVersion };
      if (monitorRecord) {
        monitorRecord.products.push(newProduct);
        await monitorRecord.save();
      } else {
        const newMonitorRecord = new MonitorScan({
          userId,
          vendorId,
          vendorName: vendor.vendorName,
          vendorWebsite: vendor.vendorWebsite,
          itOrOt: vendor.itOrOt,
          products: [newProduct],
        });
        await newMonitorRecord.save();
      }
  
      res.json({ message: "Product added successfully." ,data: planLimit-totalProducts});
    } catch (error) {
      console.error("Error in add-product route:", error.message, error.stack);
      res.status(500).json({ error: "Server error", details: error.message });
    }
  });
  

// POST: Start scan
router.post("/start-scan", async (req, res) => {
  try {
    const { userId } = req.body;

    // Validate userId
    if (!userId) {
      return res.status(400).json({ error: "userId is required." });
    }

    // Fetch monitor records for the user
    const monitorRecords = await MonitorScan.find({ userId });
    if (!monitorRecords || monitorRecords.length === 0) {
      return res.status(404).json({ error: "No monitor records found for this user." });
    }

    // Prepare scan data
    const scanData = monitorRecords.map((record) => ({
      vendorWebsite: record.vendorWebsite,
      products: record.products.map((product) => product.productName),
    }));
    console.log("Scan data:", scanData);

    // Trigger Python script
    const pythonProcess = spawn("python3", ["../monitor/monitor_scan.py", JSON.stringify({ userId, scanData })]);

    pythonProcess.stdout.on("data", (data) => {
      console.log(`Python Output: ${data}`);
    });

    pythonProcess.on("close", (code) => {
      console.log(`Python script exited with code ${code}`);
    });

    res.json({ message: "Scan triggered successfully." });
  } catch (error) {
    console.error("Error starting scan:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
