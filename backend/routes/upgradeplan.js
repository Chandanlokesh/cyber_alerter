const express = require('express');
const User = require('../models/users_db');
const router = express.Router();

// Middleware to check if user is authenticated
router.use((req, res, next) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: "Please login to upgrade plan" });
    }
    next();
});

// Upgrade Plan Route
router.post('/upgrade', async (req, res) => {
    try {
        const userId = req.session.userId;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: "User not found" });

        // Upgrade logic (upgrading to Pro plan)
        user.planType = 'Pro';
        await user.save();
        return res.status(200).json({ message: "Plan upgraded to Pro" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;
