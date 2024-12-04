const express = require("express");
const { exec } = require("child_process");
const MonitorScan = require("../models/monitorscan_db");
const OemVendor = require("../models/oems_db");
const User = require("../models/users_db");
const path = require("path");

const router = express.Router();

// Add Monitored Product with Subscription Check
router.post("/add-product", async (req, res) => {
    const { userId, productName, productVersion } = req.body;
  
    try {
      const user = await User.findById(userId);
  
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      // Define scan limits based on subscription plan
      const planLimits = {
        Free: 5, // Free plan allows monitoring 5 products
        Pro: 10, // Pro plan allows monitoring 10 products
      };
  
      const currentProductCount = await MonitorScan.countDocuments({ userId });
  
      if (currentProductCount >= planLimits[user.subscriptionPlan]) {
        return res.status(403).json({
          message: `Limit reached: ${planLimits[user.subscriptionPlan]} products allowed for ${user.subscriptionPlan} plan.`,
        });
      }
  
      // Add the product if within limits
      const monitorScan = new MonitorScan({
        userId,
        productName,
        productVersion,
        results: [],
      });
  
      await monitorScan.save();
  
      res.status(201).json({ message: "Product added to monitor list successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error adding product", error });
    }
  });
  

// Trigger Monitor Scraper
router.post("/scan", async (req, res) => {
    const { userId, productId } = req.body;
  
    try {
      const monitorProduct = await MonitorScan.findById(productId);
      if (!monitorProduct) {
        return res.status(404).json({ message: "Product not found" });
      }
  
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      const inputData = {
        productName: monitorProduct.productName,
        productVersion: monitorProduct.productVersion,
      };
  
      exec(
        `python ${path.join(__dirname, "../sendmail/monitor_scraper.py")} '${JSON.stringify(
          inputData
        )}'`,
        (error, stdout, stderr) => {
          if (error) {
            return res.status(500).json({ message: "Error executing Python script", error });
          }
  
          try {
            const scanResults = JSON.parse(stdout);
  
            // Update database with scan results
            monitorProduct.results = scanResults;
            monitorProduct.lastScanDate = new Date();
            monitorProduct.save();
  
            // Prepare email data
            const emailInput = {
              email: user.email,
              scan_results: scanResults,
            };
  
            // Trigger the email-sending Python script
            exec(
              `python ${path.join(__dirname, "../sendemail/send_email.py")} '${JSON.stringify(
                emailInput
              )}'`,
              (emailError, emailStdout, emailStderr) => {
                if (emailError) {
                  console.error("Error sending email:", emailError);
                } else {
                  console.log("Email sent successfully");
                }
              }
            );
  
            res.status(200).json({ message: "Monitor scan completed and email sent", scanResults });
          } catch (jsonError) {
            res.status(500).json({ message: "Error parsing scan results", jsonError });
          }
        }
      );
    } catch (error) {
      res.status(500).json({ message: "Error triggering scan", error });
    }
  });

  router.get("/monitor_dashboard", async (req, res) => {
    const { userId } = req.query;
  
    try {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      const monitorData = await MonitorScan.find({ userId });
      if (!monitorData) {
        return res.status(404).json({ message: "No monitored products found" });
      }
  
      // Calculate the next scan time
      const currentTime = new Date();
      const lastScanDate = monitorData[0]?.lastScanDate || new Date(); // Default to now if no scan has been performed
      let scanInterval = user.subscriptionPlan === 'Pro' ? 6 * 60 * 60 * 1000 : 12 * 60 * 60 * 1000; // Pro: 6 hours, Free: 12 hours
      const nextScanTime = new Date(lastScanDate.getTime() + scanInterval);
      const timeRemaining = nextScanTime - currentTime;
  
      // Return response with scan data and time remaining
      res.status(200).json({
        message: "Monitor data retrieved successfully",
        data: monitorData,
        timeRemaining,
        userSubscription: user.subscriptionPlan
      });
    } catch (error) {
      res.status(500).json({ message: "Error fetching monitor data", error });
    }
  });

// Display specific product details when clicked
router.get("/product_details/:id", async (req, res) => {
    const { id } = req.params;
  
    try {
      const monitorProduct = await MonitorScan.findById(id);
      if (!monitorProduct) {
        return res.status(404).json({ message: "Product not found" });
      }
  
      res.status(200).json({ message: "Product details fetched", product: monitorProduct });
    } catch (error) {
      res.status(500).json({ message: "Error fetching product details", error });
    }
  });
// Get the number of vulnerabilities per day
router.get("/vulnerabilities_per_day", async (req, res) => {
    try {
      const data = await MonitorScan.aggregate([
        { $unwind: "$results" }, // Unwind the results array
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$lastScanDate" } }, // Group by date
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } }, // Sort by date
      ]);
      res.status(200).json({ message: "Vulnerabilities per day", data });
    } catch (error) {
      res.status(500).json({ message: "Error fetching data", error });
    }
  });
// Get severity distribution for the most recent scan
router.get("/vulnerability_severity_distribution/:id", async (req, res) => {
    const { id } = req.params;
  
    try {
      const monitorProduct = await MonitorScan.findById(id);
      if (!monitorProduct) {
        return res.status(404).json({ message: "Product not found" });
      }
  
      const severityCounts = {
        Critical: 0,
        High: 0,
        Medium: 0,
        Low: 0,
      };
  
      // Loop through scan results to count severity
      monitorProduct.results.forEach(result => {
        if (result.severity) {
          severityCounts[result.severity] = (severityCounts[result.severity] || 0) + 1;
        }
      });
  
      res.status(200).json({ message: "Severity distribution fetched", severityCounts });
    } catch (error) {
      res.status(500).json({ message: "Error fetching data", error });
    }
  });
    
  

module.exports = router;
