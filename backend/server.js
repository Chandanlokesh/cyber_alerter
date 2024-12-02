const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());  // Built-in Express JSON parser (simpler alternative)
app.use(express.urlencoded({ extended: true }));

// Routes
const userRoutes = require('./routes/users');
const quickScanRoutes = require('./routes/quickscanroute');

app.use('/users', userRoutes);
app.use('/quickscan', quickScanRoutes);

// Direct MongoDB connection URI (replace this with your actual MongoDB URI)
const mongoURI = 'mongodb://localhost:27017/cyber_alerter';  // Local MongoDB URI

// Connect to MongoDB
mongoose.connect(mongoURI, { 
  useNewUrlParser: true, 
  useUnifiedTopology: true 
})
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

// Set up the server
const PORT = 5000;  // You can specify any port
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
