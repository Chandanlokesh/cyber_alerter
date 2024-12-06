const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const userRoutes = require('./routes/users');
const quickScanRoutes = require('./routes/quickscanroute');
const monitorScanRoutes = require('./routes/monitorschanroute');


app.use('/users', userRoutes);
app.use('/quickscan', quickScanRoutes);
app.use('/monitorscan', monitorScanRoutes);




// Default route
app.get('/', (req, res) => {
  res.send('Cyber Alerter Backend is running!');
});

// Models
const User = require('./models/users_db');



// MongoDB connection
const mongoURI = 'mongodb://localhost:27017/cyber_alerter';  // Replace with your actual URI
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Database connected successfully');
  })
  .catch((error) => {
    console.error('Error connecting to the database:', error);
  });

// Set up the server
const PORT = 5000; 
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
