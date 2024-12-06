const express = require("express");
const { spawn } = require("child_process");
const mongoose = require('mongoose');
const path = require("path");
const router = express.Router();
const Scan = require("../models/quickscan_db"); // Scan database model
const User = require("../models/users_db");   // User database model

// Quick Scan Route
router.post("/scan", async (req, res) => {
  const { userId, productName, productVersion, cveId } = req.body;

  try {
    // Prepare data to send to Python script
    const scanData = JSON.stringify({ productName, productVersion, cveId });
    const pythonexecution = path.join(__dirname, "../quick_py/venv/Scripts/python.exe");
    const pythonScriptPath = path.join(__dirname, "../quick_py/quickscrap.py");

    // Spawn Python process
    const pythonProcess = spawn(pythonexecution, [pythonScriptPath]);

    // Send data to Python script via stdin
    pythonProcess.stdin.write(scanData);
    pythonProcess.stdin.end();
    console.log("Scan data sent to Python script:", scanData);

    let pythonOutput = "";
    let pythonError = "";

    // Capture Python output
    pythonProcess.stdout.on("data", (data) => {
      pythonOutput += data.toString();
    });

    // Capture Python errors
    pythonProcess.stderr.on("data", (data) => {
      pythonError += data.toString();
    });

    // Handle Python script exit
    pythonProcess.on("close", async (code) => {
      if (code !== 0 || pythonError) {
        console.error("Python script error:", pythonError);
        return res.status(500).json({
          message: "Python script execution failed",
          error: pythonError.trim() || `Exited with code ${code}`,
        });
      }

      try {
        // Parse Python output
        const scanResults = JSON.parse(pythonOutput);
        console.log("Scan results:", scanResults);

        if (!Array.isArray(scanResults) || scanResults.length === 0) {
          return res.status(400).json({ message: "No valid results returned from scan" });
        }

        // Save scan results to the database
        const scan = new Scan({ userId, productName, productVersion, cveId, results: scanResults });
        await scan.save();

        // Update user scan count
        const user = await User.findById(userId);
        if (user) {
          user.scansPerformedToday.quickScan += 1;
          await user.save();
        }

        // Respond with scan results
        res.status(200).json({ message: "Scan completed successfully", scanResults, scanId: scan._id });
      } catch (err) {
        console.error("Error processing scan results:", err);
        res.status(500).json({ message: "Error processing scan results", error: err.message });
      }
    });
  } catch (err) {
    console.error("Scan initiation error:", err);
    res.status(500).json({ message: "Error initiating scan", error: err.message });
  }
});

// Send email route
router.post("/send-email", async (req, res) => {
  const { userId, scanId } = req.body;

  try {
    // Fetch user details using userId
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Fetch scan details using the scanId
    const scan = await Scan.findOne({ _id: scanId });
    if (!scan) {
      return res.status(404).json({ message: "Scan not found" });
    }

    // Prepare the email data
    const docx_to_send = {
      userEmail: user.email,
      scanDetails: scan,
    };

    // Log the data to see what you are sending to the Python script
    console.log("Data to be sent to Python script (JSON):", JSON.stringify(docx_to_send, null, 2));

    const docx_to_send_string = JSON.stringify(docx_to_send);
    const pythonexecution = path.join(__dirname, "../quick_py/venv/Scripts/python.exe");
    const pythonScriptPath = path.join(__dirname, "../quick_py/send_email.py");

    // Spawn Python process
    const pythonProcess = spawn(pythonexecution, [pythonScriptPath]);

    pythonProcess.stdin.write(docx_to_send_string);
    pythonProcess.stdin.end();

    let pythonOutput = "";
    let pythonError = "";

    pythonProcess.stdout.on("data", (data) => {
      pythonOutput += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      pythonError += data.toString();
    });

    pythonProcess.on("close", async (code) => {
      if (code !== 0 || pythonError) {
        console.error("Python script error:", pythonError);
        return res.status(500).json({
          message: "Python script execution failed",
          error: pythonError.trim() || `Exited with code ${code}`,
        });
      }

      res.status(200).json({
        message: "Email sent successfully",
        result: pythonOutput.trim(),
      });
    });
  } catch (err) {
    console.error("Send email error:", err);
    res.status(500).json({ message: "Error sending email", error: err.message });
  }
});





router.get("/quickscan_dashboard", async (req, res) => {
  console.log("Request query parameters:", req.query);  // Log all query parameters

  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ message: "UserId is required in query parameters" });
  }

  console.log("UserId received:", userId);  // Log the received userId for debugging

  try {
    // Fetch all scans for the user
    const scans = await Scan.find({ userId });
    const scansToday = scans.filter((scan) => {
      const scanDate = new Date(scan.scanDate);
      return scanDate.toDateString() === new Date().toDateString();
    });
    
    // Fetch user data and ensure userId is converted to ObjectId
    const user = await User.findById(new mongoose.Types.ObjectId(userId));
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Calculate the remaining scans for the day
    const scansLeftToday = user.scanLimit.quickScan - user.scansPerformedToday.quickScan;
    
    // Count vulnerabilities based on severity
    const severityCount = { High: 0, Medium: 0, Low: 0, Critical: 0 };
    scans.forEach((scan) => {
      scan.results.forEach((result) => {
        if (severityCount[result.baseSeverity] !== undefined) {
          severityCount[result.baseSeverity] += 1;
        }
      });
    });

    // Return the response with the necessary data
    res.status(200).json({
      message:"success",
      data:{
        dashboard:{
      scansToday: scansToday.length,
      scansLeftToday,
      severityCount},
      scansHistory: scans,
      }
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).json({ message: "Error fetching dashboard data", error: err.message });
  }
});



module.exports = router;
