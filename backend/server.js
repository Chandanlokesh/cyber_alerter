const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const userRoutes = require('./routes/users');
const dashboardRoutes = require('./routes/dashboard');
const upgradePlanRoutes = require('./routes/upgradeplan');
const app = express();
const port = 3000;

// Middlewares
app.use(express.json());
app.use(session({
    secret: 'your-secret-key',  // Change to a secure key in production
    resave: false,
    saveUninitialized: true
}));

// Routes
app.use('/users', userRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/upgrade', upgradePlanRoutes);

// Database connection
mongoose.connect('mongodb://localhost:27017/cyber_alerter', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch((error) => console.error('Error connecting to MongoDB:', error));

// Server start
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
