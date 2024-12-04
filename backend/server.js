const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const { exec } = require('child_process');
const cron = require('node-cron'); // For scheduling tasks

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const userRoutes = require('./routes/users');
const quickScanRoutes = require('./routes/quickscanroute');
const monitorScanRoutes = require('./routes/monitorscanroute');

app.use('/users', userRoutes);
app.use('/quickscan', quickScanRoutes);
app.use('/monitorscan', monitorScanRoutes);

// MongoDB connection
const mongoURI = 'mongodb://localhost:27017/cyber_alerter';  // Replace with your actual URI
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Database connected successfully');
  })
  .catch((error) => {
    console.error('Error connecting to the database:', error);
  });

// Default route
app.get('/', (req, res) => {
  res.send('Cyber Alerter Backend is running!');
});

// Models
const User = require('./models/users_db');
const MonitorScan = require('./models/monitorscan_db');

// Auto Scan Feature
const scanSchedules = {
  Free: '0 */12 * * *', // Every 12 hours
  Pro: '0 */6 * * *',   // Every 6 hours
};

// Function to trigger the Python script for a monitor scan
const triggerPythonScript = (monitorScan) => {
  const inputData = {
    productName: monitorScan.productName,
    productVersion: monitorScan.productVersion,
  };

  exec(
    `python ${path.join(__dirname, './monitor_py/monitor_scraper.py')} '${JSON.stringify(
      inputData
    )}'`,
    async (error, stdout, stderr) => {
      if (error) {
        console.error('Error executing Python script:', error);
        return;
      }

      try {
        const scanResults = JSON.parse(stdout);

        // Update scan results and last scan date in the database
        monitorScan.results = scanResults;
        monitorScan.lastScanDate = new Date();
        await monitorScan.save();

        console.log(`Auto scan completed for product: ${monitorScan.productName}`);
      } catch (jsonError) {
        console.error('Error parsing scan results:', jsonError);
      }
    }
  );
};

// Schedule scans for each subscription plan
Object.entries(scanSchedules).forEach(([plan, schedule]) => {
  cron.schedule(schedule, async () => {
    console.log(`Running auto scans for ${plan} plan...`);

    try {
      // Get all users with the current subscription plan
      const users = await User.find({ subscriptionPlan: plan });

      for (const user of users) {
        // Get all monitored products for the user
        const monitoredProducts = await MonitorScan.find({ userId: user._id });

        // Trigger Python script for each monitored product
        monitoredProducts.forEach((monitorScan) => {
          triggerPythonScript(monitorScan);
        });
      }
    } catch (error) {
      console.error('Error running auto scans:', error);
    }
  });
});

// Set up the server
const PORT = 5000; // You can specify any port
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
