const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/users_db');
const router = express.Router();

// Sign-up Route
router.post('/signup', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ error: "User already exists" });

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            username,
            email,
            password: hashedPassword,
            planType: 'Free'
        });

        await newUser.save();
        return res.status(201).json({ message: "User created successfully" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

// Login Route
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(401).json({ error: "User not found" });

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) return res.status(401).json({ error: "Invalid password" });

        // Store user ID in session
        req.session.userId = user._id;
        return res.status(200).json({ message: "Login successful", userId: user._id });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

// Logout Route
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: "Failed to logout" });
        }
        res.status(200).json({ message: "Logged out successfully" });
    });
});

module.exports = router;
