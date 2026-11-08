// routes/auth.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');

// User Registration Route
router.post('/signup', (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ success: false, message: 'Please fill in all fields.' });
    }

    // Check if user already exists
    User.findOne({ email: email }, (err, existingUser) => {
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Email is already registered.' });
        }

        // Create new regular user with initial balances
        const newUser = {
            username: username.trim(),
            email: email.trim(),
            password: password,
            role: 'user',
            wallet: {
                realBalance: 0.00,
                demoBalance: 10000.00
            },
            createdAt: new Date()
        };

        User.insert(newUser, (err, doc) => {
            if (err) {
                return res.status(500).json({ success: false, error: err.message });
            }

            res.status(201).json({
                success: true,
                message: 'Account created successfully!',
                userId: doc._id
            });
        });
    });
});

// User Login Route
router.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Please provide email and password.' });
    }

    User.findOne({ email: email }, (err, user) => {
        if (err || !user) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        if (user.password !== password) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        res.json({
            success: true,
            message: 'Login successful',
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                wallet: user.wallet
            }
        });
    });
});

// Get User Profile & Wallet Details by ID (Used by wallet-sync.js)
router.get('/profile/:id', (req, res) => {
    const userId = req.params.id;

    User.findOne({ _id: userId }, (err, user) => {
        if (err || !user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        res.json({
            success: true,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                wallet: user.wallet || { realBalance: 0, demoBalance: 10000 }
            }
        });
    });
});

module.exports = router;