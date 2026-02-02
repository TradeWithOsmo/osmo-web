const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const onchainService = {
    // Vault balances
    async getVaultBalances(address: string) {
        const urls = [
            `${API_URL}/api/v1/vault/trading/${address}/balance`,
            `${API_URL}/api/v1/vault/ai/${address}/balance`
        ];

        const [tradingRes, aiRes] = await Promise.all(
            urls.map(url => fetch(url).then(res => res.json()))
        );

        return {
            trading: tradingRes.collateral || 0,
            ai: aiRes.balance || 0
        };
    },

    // Deposit to TradingVault
    async depositToVault(address: string, amount: number) {
        const response = await fetch(`${API_URL}/api/v1/vault/deposit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_address: address,
                amount_usdc: amount
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to deposit');
        }
        return response.json(); // { success, tx_hash, explorer_url }
    },

    // Withdraw from TradingVault
    async withdrawFromVault(address: string, amount: number) {
        const response = await fetch(`${API_URL}/api/v1/vault/withdraw`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_address: address,
                amount_usdc: amount
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to withdraw');
        }
        return response.json();
    },

    // Refill AI Vault (Transfer TradingVault → AIVault)
    async refillAIVault(address: string, amount: number) {
        const response = await fetch(`${API_URL}/api/v1/vault/refill-ai`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_address: address,
                amount_usdc: amount
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to refill AI vault');
        }
        return response.json();
    },

    // Session keys
    async createSessionKey(address: string, permissions: object) {
        const response = await fetch(`${API_URL}/api/v1/session/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_address: address,
                permissions
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to create session key');
        }
        return response.json(); // { session_key, expires_at }
    },

    // Faucet
    async claimFaucet(address: string) {
        const response = await fetch(`${API_URL}/api/v1/faucet/claim`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_address: address
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to claim faucet');
        }
        return response.json(); // { success, tx_hash, explorer_url }
    },

    async canClaimFaucet(address: string) {
        const response = await fetch(`${API_URL}/api/v1/faucet/status/${address}`);
        if (!response.ok) {
            // Default to not claimable if error, but try to parse
            try {
                return await response.json();
            } catch {
                return { can_claim: false, time_until_next_claim: 24 * 3600 };
            }
        }
        return response.json(); // { can_claim, time_until_next_claim }
    },

    async getFaucetBalance() {
        const response = await fetch(`${API_URL}/api/v1/faucet/balance`);
        if (!response.ok) {
            return 0;
        }
        const data = await response.json();
        return data.balance;
    }
};
