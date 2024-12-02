const express = require("express");
const { exec } = require("child_process");
const Scan = require("../models/quickscan_db");  // Assuming a model for scan results
const User = require("../models/users_db");  // Assuming a model for users
const path = require("path");
const router = express.Router();

router.post("/scan", async (req, res) => {
  const { userId, productName, productVersion, cveId } = req.body;

  try {
    // Prepare the input data to send to Python script
    const scanData = { productName, productVersion, cveId };
    const scanDataJson = JSON.stringify(scanData);

    // Trigger the Python script using exec
    exec(
      `python ${path.join(__dirname, "../quick_py/quickscrap.py")} '${scanDataJson}'`,
      (error, stdout, stderr) => {
        if (error) {
          return res.status(500).json({ message: "Error executing Python script", error });
        }

        // Parse the output from the Python script (assuming it's in JSON format and is an array of results)
        try {
          const scanResults = JSON.parse(stdout);

          if (!Array.isArray(scanResults) || scanResults.length === 0) {
            return res.status(400).json({ message: "No valid scan results returned" });
          }

          // Store the scan results in the database
          const scan = new Scan({
            userId,
            productName,
            productVersion,
            cveId,
            results: scanResults, // Save all results as an array
          });

          scan.save()
            .then(async () => {
              // Update user's scan count in the database
              const user = await User.findById(userId);
              if (user) {
                user.scansPerformedToday.quickScan += 1;
                await user.save();
              } else {
                console.warn("User not found while updating scan count");
              }

              res.status(200).json({
                message: "Scan completed and results saved",
                scanResults,
              });
            })
            .catch((err) => {
              res.status(500).json({ message: "Error saving scan results", err });
            });
        } catch (jsonError) {
          console.error("Error parsing Python script output", jsonError);
          return res.status(500).json({
            message: "Error parsing Python script output",
            jsonError,
          });
        }
      }
    );
  } catch (error) {
    console.error("Error starting scan", error);
    res.status(500).json({ message: "Error starting scan", error });
  }
});

// Trigger Send Email for Scan Results
router.post("/send-email", async (req, res) => {
  const { userId, scanId } = req.body;

  try {
    // Find the scan details by ID
    const scan = await Scan.findById(scanId);
    if (!scan) {
      return res.status(404).json({ message: "Scan not found" });
    }

    // Trigger the Python email script
    const emailData = {
      userId,
      scanDetails: scan,
    };

    exec(
      `python ${path.join(__dirname, "../sendemail/send_email.py")} '${JSON.stringify(emailData)}'`,
      (error, stdout, stderr) => {
        if (error) {
          return res.status(500).json({ message: "Error executing send email script", error });
        }

        res.status(200).json({ message: "Email sent successfully", result: stdout });
      }
    );
  } catch (error) {
    res.status(500).json({ message: "Error sending email", error });
  }
});

// Get Scan History and Stats for Dashboard
router.get("/quickscan_dashboard", async (req, res) => {
  const { userId } = req.query;

  try {
    // Fetch user's scan history
    const scans = await Scan.find({ userId });

    const scansToday = scans.filter((scan) => {
      const scanDate = new Date(scan.createdAt);
      const today = new Date();
      return scanDate.toDateString() === today.toDateString();
    });

    // Fetch user details for remaining scans today
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const scansLeftToday = user.scanLimit.quickScan - user.scansPerformedToday.quickScan;

    // Prepare data for the graph
    const severityCount = { High: 0, Medium: 0, Low: 0, Critical: 0 };
    scans.forEach((scan) => {
      scan.scanResults.forEach((result) => {
        const severity = result.severity;
        if (severityCount[severity] !== undefined) {
          severityCount[severity] += 1;
        }
      });
    });

    res.status(200).json({
      scansToday: scansToday.length,
      scansLeftToday,
      severityCount,  // Used for the chart
      scansHistory: scans,
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching scan history", error });
  }
});

module.exports = router;
