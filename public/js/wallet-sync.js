// public/js/wallet-sync.js
(function() {
    async function syncUserWallet() {
        try {
            const currentUserStr = localStorage.getItem('currentUser');
            if (!currentUserStr) return;

            const currentUser = JSON.parse(currentUserStr);
            const userId = currentUser.id || currentUser._id;
            if (!userId) return;

            const response = await fetch(`/api/auth/profile/${userId}`);
            if (!response.ok) return;

            const data = await response.json();
            if (data.success && data.user && data.user.wallet) {
                localStorage.setItem('currentUser', JSON.stringify(data.user));

                let txAccount = JSON.parse(localStorage.getItem('tradexora_account')) || {
                    balances: { Demo: 10000.00, Real: 0.00 },
                    activeType: 'Demo',
                    activeId: 'DNP142887'
                };

                const realBal = data.user.wallet.realBalance || 0;
                const demoBal = data.user.wallet.demoBalance || 10000;

                if (txAccount.balances.Real !== realBal || txAccount.balances.Demo !== demoBal) {
                    txAccount.balances.Real = Number(realBal);
                    txAccount.balances.Demo = Number(demoBal);
                    localStorage.setItem('tradexora_account', JSON.stringify(txAccount));

                    window.dispatchEvent(new CustomEvent('tx:account-updated'));
                }
            }
        } catch (err) {
            console.error('Wallet sync background error:', err);
        }
    }

    document.addEventListener('DOMContentLoaded', syncUserWallet);
    setInterval(syncUserWallet, 3000);
    syncUserWallet();
})();