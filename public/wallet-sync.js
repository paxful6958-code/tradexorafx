// public/js/wallet-sync.js
(function() {
    async function syncUserWallet() {
        try {
            const currentUserStr = localStorage.getItem('currentUser');
            if (!currentUserStr) return;

            const currentUser = JSON.parse(currentUserStr);
            const userId = currentUser.id || currentUser._id;
            if (!userId) return;

            // Fetch latest user profile directly from your server backend database
            const response = await fetch(`/api/auth/profile/${userId}`);
            if (!response.ok) return;

            const data = await response.json();
            if (data.success && data.user) {
                // Update local storage copy with fresh backend data
                localStorage.setItem('currentUser', JSON.stringify(data.user));

                // Read or initialize tradexora_account state used by trading charts & headers
                let txAccount = JSON.parse(localStorage.getItem('tradexora_account')) || {
                    balances: { Demo: 10000.00, Real: 0.00 },
                    activeType: 'Demo',
                    activeId: 'DNP142887'
                };

                const realBal = (data && data.user && data.user.wallet && data.user.wallet.realBalance !== undefined) ?
                    data.user.wallet.realBalance :
                    ((data && data.user && data.user.realBalance) || 0);

                const demoBal = (data && data.user && data.user.wallet && data.user.wallet.demoBalance !== undefined) ?
                    data.user.wallet.demoBalance :
                    ((data && data.user && data.user.demoBalance) || 10000);
                // If balances changed on server, update local state and notify UI
                if (txAccount.balances.Real !== realBal || txAccount.balances.Demo !== demoBal) {
                    txAccount.balances.Real = Number(realBal);
                    txAccount.balances.Demo = Number(demoBal);

                    localStorage.setItem('tradexora_account', JSON.stringify(txAccount));

                    // Dispatches an event that triggers your UI re-render handlers automatically
                    window.dispatchEvent(new CustomEvent('tx:account-updated'));
                }
            }
        } catch (err) {
            console.error('Wallet sync background error:', err);
        }
    }

    // Run sync immediately on page load and poll every 3 seconds
    document.addEventListener('DOMContentLoaded', syncUserWallet);
    setInterval(syncUserWallet, 3000);
    syncUserWallet();
})();