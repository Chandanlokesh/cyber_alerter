const express = require('express');
const User = require('../models/users_db');
const router = express.Router();

// Middleware to check if user is authenticated
router.use((req, res, next) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: "Please login to view this page" });
    }
    next();
});

// Dashboard Route
router.get('/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: "User not found" });

        return res.status(200).json({
            username: user.username,
            email: user.email,
            planType: user.planType,
            quickScanCount: user.quickScanCount,
            monitorScanProductCount: user.monitorScanProductCount
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;
