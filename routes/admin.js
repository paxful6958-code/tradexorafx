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

        const sanitizedUsers = users.map(u => {
            const { password, ...rest } = u;
            return rest;
        });

        res.json({ success: true, users: sanitizedUsers });
    });
});

// 2. Fund or update a user's wallet via Admin
router.post('/fund-wallet', verifyAdmin, (req, res) => {
    const { userId, amount, action, walletType } = req.body;
    const numAmount = parseFloat(amount);

    if (isNaN(numAmount) || numAmount <= 0) {
        return res.status(400).json({ success: false, message: 'Invalid amount' });
    }

    User.findOne({ _id: userId }, (err, user) => {
        if (err || !user) return res.status(404).json({ success: false, message: 'User not found' });

        const currentWallet = user.wallet || { realBalance: 0, demoBalance: 10000 };
        let realBalance = Number(currentWallet.realBalance || 0);
        let demoBalance = Number(currentWallet.demoBalance !== undefined ? currentWallet.demoBalance : 10000);

        if (walletType === 'demoBalance') {
            demoBalance = action === 'subtract' ? Math.max(0, demoBalance - numAmount) : demoBalance + numAmount;
        } else {
            realBalance = action === 'subtract' ? Math.max(0, realBalance - numAmount) : realBalance + numAmount;
        }

        const updatedWallet = { realBalance, demoBalance };

        User.update({ _id: userId }, { $set: { wallet: updatedWallet } }, {}, (err, numUpdated) => {
            if (err) return res.status(500).json({ success: false, error: err.message });

            res.json({
                success: true,
                message: 'Wallet updated successfully',
                wallet: updatedWallet
            });
        });
    });
});

// 3. Get all users with pending KYC status
router.get('/kyc-pending', verifyAdmin, (req, res) => {
    User.find({ kycStatus: 'PENDING' }, (err, users) => {
        if (err) {
            return res.status(500).json({ success: false, error: err.message });
        }
        const sanitizedUsers = users.map(u => {
            const { password, ...rest } = u;
            return rest;
        });
        res.json({ success: true, users: sanitizedUsers });
    });
});

// 4. Approve or Reject a trader's KYC verification
router.post('/kyc-action', verifyAdmin, (req, res) => {
    const { userId, action } = req.body;

    if (!['VERIFIED', 'REJECTED'].includes(action)) {
        return res.status(400).json({ success: false, message: 'Invalid action status.' });
    }

    User.update({ _id: userId }, { $set: { kycStatus: action } }, {}, (err, numUpdated) => {
        if (err || numUpdated === 0) {
            return res.status(500).json({ success: false, message: 'Failed to update user KYC status.' });
        }
        res.json({ success: true, message: `Trader KYC status successfully updated to ${action}` });
    });
});

// 5. Allow frontend trade profit/loss syncing directly at /api/admin/wallet/update
router.post('/wallet/update', (req, res) => {
    const { userId, accountType, profitAmount } = req.body;
    const amount = parseFloat(profitAmount);

    if (!userId || isNaN(amount)) {
        return res.status(400).json({ success: false, message: 'Invalid payload.' });
    }

    User.findOne({ _id: userId }, (err, user) => {
        if (err || !user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        const currentWallet = user.wallet || { realBalance: 0, demoBalance: 10000 };
        let realBalance = Number(currentWallet.realBalance || 0);
        let demoBalance = Number(currentWallet.demoBalance !== undefined ? currentWallet.demoBalance : 10000);

        if (accountType === 'Real') {
            realBalance = Math.max(0, realBalance + amount);
        } else {
            demoBalance = Math.max(0, demoBalance + amount);
        }

        const updatedWallet = { realBalance, demoBalance };

        User.update({ _id: userId }, { $set: { wallet: updatedWallet } }, {}, (err, numUpdated) => {
            if (err || numUpdated === 0) {
                return res.status(500).json({ success: false, message: 'Failed to update database balance.' });
            }
            res.json({ success: true, wallet: updatedWallet });
        });
    });
});

module.exports = router;