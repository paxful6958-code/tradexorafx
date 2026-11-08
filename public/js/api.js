// public/js/api.js
const API = {
    // Get user details and wallet balances
    async getUserProfile(userId) {
        try {
            const res = await fetch(`/api/user/profile/${userId}`);
            return await res.json();
        } catch (err) {
            console.error('Failed to fetch user profile', err);
            return { success: false };
        }
    },

    // Fund or update user wallet (Used by Admin Panel or payment webhooks)
    async updateWallet(adminId, userId, amount, action) {
        try {
            const res = await fetch('/api/admin/fund-wallet', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-id': adminId
                },
                body: JSON.stringify({ userId, amount, action })
            });
            return await res.json();
        } catch (err) {
            console.error('Failed to update wallet', err);
            return { success: false };
        }
    }
};