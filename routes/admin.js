// routes/admin.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');

// 0. Admin Login Route
router.post('/login', (req, res) => {
    const { email, password } = req.body;

    User.findOne({ email: email }, (err, user) => {
        if (err || !user) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        if (user.password !== password) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        if (user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Access denied. Not an admin account.' });
        }

        res.json({
            success: true,
            message: 'Login successful',
            adminId: user._id
        });
    });
});

// Middleware to check admin role safely
const verifyAdmin = (req, res, next) => {
    const adminId = req.headers['x-admin-id'] || (req.body && req.body.adminId) || (req.query && req.query.adminId);

    if (!adminId) {
        return res.status(401).json({ success: false, message: 'No admin ID provided in headers or request.' });
    }

    User.findOne({ _id: adminId }, (err, admin) => {
        if (err || !admin) {
            return res.status(403).json({ success: false, message: 'Admin user not found.' });
        }
        if (admin.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Access denied. Admins only.' });
        }
        req.admin = admin;
        next();
    });
};

// 1. Get all users for the dashboard
router.get('/users', verifyAdmin, (req, res) => {
    User.find({}, (err, users) => {
        if (err) return res.status(500).json({ success: false, error: err.message });

        // Hide passwords before sending to frontend
        const sanitizedUsers = users.map(u => {
            const { password, ...rest } = u;
            return rest;
        });

        res.json({ success: true, users: sanitizedUsers });
    });
});

// 2. Fund or update a user's wallet (Real or Demo)
router.post('/fund-wallet', verifyAdmin, (req, res) => {
    const { userId, amount, action, walletType } = req.body; // walletType can be 'realBalance' or 'demoBalance'
    const numAmount = parseFloat(amount);
    const targetWallet = walletType === 'demoBalance' ? 'wallet.demoBalance' : 'wallet.realBalance';

    if (isNaN(numAmount) || numAmount <= 0) {
        return res.status(400).json({ success: false, message: 'Invalid amount' });
    }

    User.findOne({ _id: userId }, (err, user) => {
        if (err || !user) return res.status(404).json({ success: false, message: 'User not found' });

        let currentBalance = walletType === 'demoBalance' ? (user.wallet && user.wallet.demoBalance ? user.wallet.demoBalance : 0) : (user.wallet && user.wallet.realBalance ? user.wallet.realBalance : 0);

        if (action === 'subtract') {
            currentBalance = Math.max(0, currentBalance - numAmount);
        } else {
            currentBalance += numAmount;
        }

        const updateQuery = {};
        updateQuery[targetWallet] = currentBalance;

        User.update({ _id: userId }, { $set: updateQuery }, {},
            (err, numUpdated) => {
                if (err) return res.status(500).json({ success: false, error: err.message });

                res.json({
                    success: true,
                    message: 'Wallet updated successfully',
                    newBalance: currentBalance
                });
            }
        );
    });
});

module.exports = router;