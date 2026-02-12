import { createPublicClient, http, parseUnits, formatUnits } from 'viem';
import { arbitrumSepolia } from 'viem/chains';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// --- Contract Addresses (Arbitrum Sepolia) ---
export const CONTRACTS = {
    TradingVault: import.meta.env.VITE_CONTRACT_TRADING_VAULT,
    OrderRouter: import.meta.env.VITE_CONTRACT_ORDER_ROUTER,
    PositionManager: import.meta.env.VITE_CONTRACT_POSITION_MANAGER,
    RiskManager: import.meta.env.VITE_CONTRACT_RISK_MANAGER,
    PriceFeed: import.meta.env.VITE_CONTRACT_PRICE_FEED,
    SymbolRegistry: import.meta.env.VITE_CONTRACT_SYMBOL_REGISTRY,
    SessionKeyManager: import.meta.env.VITE_CONTRACT_SESSION_KEY_MANAGER,
    OstiumAdapter: import.meta.env.VITE_CONTRACT_OSTIUM_ADAPTER,
    USDC: import.meta.env.VITE_CONTRACT_USDC,
    Faucet: import.meta.env.VITE_CONTRACT_FAUCET,
    AIVault: import.meta.env.VITE_CONTRACT_AI_VAULT,
    ArenaChooseSide: import.meta.env.VITE_CONTRACT_ARENA_CHOOSE_SIDE,
    ArenaPoints: import.meta.env.VITE_CONTRACT_ARENA_POINTS,
} as const;

// --- ABIs ---
const TRADING_VAULT_ABI = [
    {
        "inputs": [{ "name": "user", "type": "address" }],
        "name": "getBalance",
        "outputs": [
            { "name": "total", "type": "uint256" },
            { "name": "reservedAmount", "type": "uint256" },
            { "name": "available", "type": "uint256" }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{ "name": "amount", "type": "uint256" }],
        "name": "depositCollateral",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{ "name": "amount", "type": "uint256" }],
        "name": "withdrawCollateral",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
] as const;

const AI_VAULT_ABI = [
    {
        "inputs": [{ "name": "user", "type": "address" }],
        "name": "getBalance",
        "outputs": [{ "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{ "name": "amount", "type": "uint256" }],
        "name": "deposit",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{ "name": "amount", "type": "uint256" }],
        "name": "withdraw",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
] as const;

const ORDER_ROUTER_ABI = [
    {
        "inputs": [
            {
                "components": [
                    { "name": "user", "type": "address" },
                    { "name": "symbol", "type": "string" },
                    { "name": "side", "type": "uint8" },
                    { "name": "orderType", "type": "uint8" },
                    { "name": "amountUsd", "type": "uint256" },
                    { "name": "leverage", "type": "uint8" },
                    { "name": "reduceOnly", "type": "bool" },
                    { "name": "postOnly", "type": "bool" },
                    { "name": "triggerCondition", "type": "uint8" },
                    { "name": "price", "type": "uint256" },
                    { "name": "stopPrice", "type": "uint256" },
                    { "name": "timeInForce", "type": "uint256" }
                ],
                "name": "params",
                "type": "tuple"
            }
        ],
        "name": "placeOrder",
        "outputs": [{ "name": "orderId", "type": "bytes32" }],
        "stateMutability": "nonpayable",
        "type": "function"
    }
] as const;

const ERC20_ABI = [
    {
        "inputs": [{ "name": "account", "type": "address" }],
        "name": "balanceOf",
        "outputs": [{ "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{ "name": "spender", "type": "address" }, { "name": "value", "type": "uint256" }],
        "name": "approve",
        "outputs": [{ "name": "", "type": "bool" }],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{ "name": "owner", "type": "address" }, { "name": "spender", "type": "address" }],
        "name": "allowance",
        "outputs": [{ "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{ "name": "to", "type": "address" }, { "name": "value", "type": "uint256" }],
        "name": "transfer",
        "outputs": [{ "name": "", "type": "bool" }],
        "stateMutability": "nonpayable",
        "type": "function"
    }
] as const;

const ARENA_CHOOSE_SIDE_ABI = [
    {
        "inputs": [
            { "name": "side", "type": "uint8" },
            { "name": "wager", "type": "uint256" }
        ],
        "name": "chooseSide",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{ "name": "user", "type": "address" }],
        "name": "getUserPick",
        "outputs": [
            { "name": "side", "type": "uint8" },
            { "name": "wager", "type": "uint256" },
            { "name": "pickedAt", "type": "uint256" },
            { "name": "lockUntil", "type": "uint256" }
        ],
        "stateMutability": "view",
        "type": "function"
    }
] as const;

const ARENA_POINTS_ABI = [
    {
        "inputs": [],
        "name": "claim",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{ "name": "user", "type": "address" }],
        "name": "pendingRewards",
        "outputs": [{ "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{ "name": "user", "type": "address" }],
        "name": "lockedPoints",
        "outputs": [{ "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    }
] as const;

const ROLE_ABI = [
    {
        "inputs": [
            { "name": "role", "type": "bytes32" },
            { "name": "account", "type": "address" }
        ],
        "name": "hasRole",
        "outputs": [{ "name": "", "type": "bool" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            { "name": "role", "type": "bytes32" },
            { "name": "account", "type": "address" }
        ],
        "name": "grantRole",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
] as const;

const ORDER_ROUTER_ROLE = "0xae0840f3192f9bf218659556847353f4e2f8959f6323cf14a1a67dd461d331b6"; // ORDER_ROUTER_ROLE


const publicClient = createPublicClient({
    chain: arbitrumSepolia,
    transport: http()
});

export const onchainService = {
    async getVaultBalances(address: string) {
        try {
            const tradingData = await publicClient.readContract({
                address: CONTRACTS.TradingVault as `0x${string}`,
                abi: TRADING_VAULT_ABI,
                functionName: 'getBalance',
                args: [address as `0x${string}`]
            });
            const aiBalanceRaw = await publicClient.readContract({
                address: CONTRACTS.AIVault as `0x${string}`,
                abi: AI_VAULT_ABI,
                functionName: 'getBalance',
                args: [address as `0x${string}`]
            }).catch(() => 0n);

            return {
                trading: Number(formatUnits(tradingData[0], 6)),
                reserved: Number(formatUnits(tradingData[1], 6)),
                available: Number(formatUnits(tradingData[2], 6)),
                ai: Number(formatUnits(aiBalanceRaw, 6))
            };
        } catch (e) {
            console.error('getVaultBalances failed:', e);
            return { trading: 0, ai: 0, reserved: 0, available: 0 };
        }
    },

    async getUSDCBalance(address: string) {
        try {
            const balance = await publicClient.readContract({
                address: CONTRACTS.USDC as `0x${string}`,
                abi: ERC20_ABI,
                functionName: 'balanceOf',
                args: [address as `0x${string}`]
            });
            return Number(formatUnits(balance, 6));
        } catch (e) {
            return 0;
        }
    },

    async depositToVault(walletClient: any, address: string, amount: number) {
        const amountUnits = parseUnits(amount.toString(), 6);
        const account = address as `0x${string}`;
        try {
            const tx1 = await walletClient.writeContract({
                address: CONTRACTS.USDC as `0x${string}`,
                abi: ERC20_ABI,
                functionName: 'approve',
                args: [CONTRACTS.TradingVault, amountUnits],
                account
            });
            await publicClient.waitForTransactionReceipt({ hash: tx1 });
            const tx2 = await walletClient.writeContract({
                address: CONTRACTS.TradingVault as `0x${string}`,
                abi: TRADING_VAULT_ABI,
                functionName: 'depositCollateral',
                args: [amountUnits],
                account
            });
            return { success: true, tx_hash: tx2 };
        } catch (e) { throw e; }
    },

    async withdrawFromVault(walletClient: any, address: string, amount: number) {
        const amountUnits = parseUnits(amount.toString(), 6);
        const account = address as `0x${string}`;
        try {
            const tx = await walletClient.writeContract({
                address: CONTRACTS.TradingVault as `0x${string}`,
                abi: TRADING_VAULT_ABI,
                functionName: 'withdrawCollateral',
                args: [amountUnits],
                account
            });
            return { success: true, tx_hash: tx };
        } catch (e) { throw e; }
    },

    async depositToAIVault(walletClient: any, address: string, amount: number) {
        const amountUnits = parseUnits(amount.toString(), 6);
        const account = address as `0x${string}`;
        try {
            const tx1 = await walletClient.writeContract({
                address: CONTRACTS.USDC as `0x${string}`,
                abi: ERC20_ABI,
                functionName: 'approve',
                args: [CONTRACTS.AIVault, amountUnits],
                account
            });
            await publicClient.waitForTransactionReceipt({ hash: tx1 });
            const tx2 = await walletClient.writeContract({
                address: CONTRACTS.AIVault as `0x${string}`,
                abi: AI_VAULT_ABI,
                functionName: 'deposit',
                args: [amountUnits],
                account
            });
            return { success: true, tx_hash: tx2 };
        } catch (e) { throw e; }
    },

    async withdrawFromAIVault(walletClient: any, address: string, amount: number) {
        const amountUnits = parseUnits(amount.toString(), 6);
        const account = address as `0x${string}`;
        try {
            const tx = await walletClient.writeContract({
                address: CONTRACTS.AIVault as `0x${string}`,
                abi: AI_VAULT_ABI,
                functionName: 'withdraw',
                args: [amountUnits],
                account
            });
            return { success: true, tx_hash: tx };
        } catch (e) { throw e; }
    },

    async placeOrder(walletClient: any, orderParams: any) {
        // Simplified version for restoration
        const account = walletClient.account.address;
        const amountUsdInt = parseUnits(orderParams.amountUsd.toString(), 6);
        const tuple = {
            user: orderParams.user as `0x${string}`,
            symbol: orderParams.symbol,
            side: orderParams.side,
            orderType: orderParams.orderType,
            amountUsd: amountUsdInt,
            leverage: orderParams.leverage,
            price: orderParams.price ? parseUnits(orderParams.price.toString(), 6) : 0n,
            stopPrice: orderParams.stopPrice ? parseUnits(orderParams.stopPrice.toString(), 6) : 0n,
            reduceOnly: !!orderParams.reduceOnly,
            postOnly: !!orderParams.postOnly,
            triggerCondition: orderParams.triggerCondition || 0,
            timeInForce: BigInt(orderParams.timeInForce || 0)
        };

        const txHash = await walletClient.writeContract({
            address: CONTRACTS.OrderRouter as `0x${string}`,
            abi: ORDER_ROUTER_ABI,
            functionName: 'placeOrder',
            args: [tuple],
            account
        });
        return { success: true, tx_hash: txHash };
    },

    // --- Arena Actions ---
    async arenaChooseSide(walletClient: any, side: 'human' | 'ai', wager: number) {
        const sideValue = side === 'human' ? 1 : 2;
        const wagerUnits = parseUnits(wager.toString(), 6);
        const account = walletClient.account.address;
        try {
            const txHash = await walletClient.writeContract({
                address: CONTRACTS.ArenaChooseSide as `0x${string}`,
                abi: ARENA_CHOOSE_SIDE_ABI,
                functionName: 'chooseSide',
                args: [sideValue, wagerUnits],
                account
            });
            return { success: true, tx_hash: txHash };
        } catch (e) { throw e; }
    },

    async claimArenaReward(walletClient: any) {
        const account = walletClient.account.address;
        try {
            const txHash = await walletClient.writeContract({
                address: CONTRACTS.ArenaPoints as `0x${string}`,
                abi: ARENA_POINTS_ABI,
                functionName: 'claim',
                account
            });
            return { success: true, tx_hash: txHash };
        } catch (e) { throw e; }
    },

    async getArenaUserPick(address: string) {
        try {
            const data = await publicClient.readContract({
                address: CONTRACTS.ArenaChooseSide as `0x${string}`,
                abi: ARENA_CHOOSE_SIDE_ABI,
                functionName: 'getUserPick',
                args: [address as `0x${string}`]
            });
            return {
                side: data[0] === 1 ? 'human' : data[0] === 2 ? 'ai' : null,
                wager: Number(formatUnits(data[1], 6)),
                pickedAt: Number(data[2]),
                lockUntil: Number(data[3])
            };
        } catch (e) { return null; }
    },

    async getArenaPendingReward(address: string) {
        try {
            const reward = await publicClient.readContract({
                address: CONTRACTS.ArenaPoints as `0x${string}`,
                abi: ARENA_POINTS_ABI,
                functionName: 'pendingRewards',
                args: [address as `0x${string}`]
            });
            return Number(formatUnits(reward, 6));
        } catch (e) { return 0; }
    },

    async getArenaLockedPoints(address: string) {
        try {
            const locked = await publicClient.readContract({
                address: CONTRACTS.ArenaPoints as `0x${string}`,
                abi: ARENA_POINTS_ABI,
                functionName: 'lockedPoints',
                args: [address as `0x${string}`]
            });
            return Number(formatUnits(locked, 6));
        } catch (e) { return 0; }
    },

    async waitForTransaction(hash: string) {
        return publicClient.waitForTransactionReceipt({ hash: hash as `0x${string}` });
    },

    async claimFaucetOnChain(walletClient: any, address: string, amount: number) {
        const account = walletClient.account.address;
        const amountUnits = parseUnits(amount.toString(), 6);
        try {
            const tx = await walletClient.writeContract({
                address: CONTRACTS.Faucet as `0x${string}`,
                abi: [{
                    "inputs": [{ "name": "to", "type": "address" }, { "name": "amount", "type": "uint256" }],
                    "name": "claim",
                    "outputs": [],
                    "stateMutability": "nonpayable",
                    "type": "function"
                }],
                functionName: 'claim',
                args: [address as `0x${string}`, amountUnits],
                account
            });
            return { success: true, tx_hash: tx };
        } catch (e) {
            console.error('Faucet on-chain failed, falling back to API:', e);
            const res = await fetch(`${API_URL}/api/faucet/${address}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: amount })
            });
            return res.json();
        }
    },

    async checkTradingSetup(address: string) {
        try {
            const roleGranted = await publicClient.readContract({
                address: CONTRACTS.RiskManager as `0x${string}`, // Role is managed here or PositionManager
                abi: ROLE_ABI,
                functionName: 'hasRole',
                args: [ORDER_ROUTER_ROLE as `0x${string}`, address as `0x${string}`]
            });

            const allowance = await publicClient.readContract({
                address: CONTRACTS.USDC as `0x${string}`,
                abi: ERC20_ABI,
                functionName: 'allowance',
                args: [address as `0x${string}`, CONTRACTS.TradingVault as `0x${string}`]
            });

            return { roleGranted, allowance };
        } catch (e) {
            console.error('checkTradingSetup failed:', e);
            return { roleGranted: false, allowance: 0n };
        }
    },

    async grantOrderRouterRole(walletClient: any) {
        const account = walletClient.account.address;
        return walletClient.writeContract({
            address: CONTRACTS.RiskManager as `0x${string}`,
            abi: ROLE_ABI,
            functionName: 'grantRole',
            args: [ORDER_ROUTER_ROLE as `0x${string}`, account],
            account
        });
    },

    async approveUSDC(walletClient: any) {
        const account = walletClient.account.address;
        const amount = parseUnits("1000000", 6); // Approve 1M USDC
        return walletClient.writeContract({
            address: CONTRACTS.USDC as `0x${string}`,
            abi: ERC20_ABI,
            functionName: 'approve',
            args: [CONTRACTS.TradingVault as `0x${string}`, amount],
            account
        });
    },

    async placeOrderWithSession(sessionKey: string, orderParams: any) {
        const res = await fetch(`${API_URL}/api/orders/session`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Session-Key': sessionKey },
            body: JSON.stringify(orderParams)
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail || 'Session order failed');
        }
        return res.json();
    },

    async getActiveSession(address: string) {
        const res = await fetch(`${API_URL}/api/session/active/${address}`);
        if (!res.ok) return { has_session: false };
        return res.json();
    },

    async createSessionKey(address: string, params: any) {
        const res = await fetch(`${API_URL}/api/session/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_address: address, ...params })
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail || 'Failed to create session');
        }
        return res.json();
    },

    async confirmSessionKey(params: any) {
        const res = await fetch(`${API_URL}/api/session/confirm`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params)
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail || 'Failed to confirm session');
        }
        return res.json();
    },

    async transferUSDC(walletClient: any, to: string, amount: number) {
        const amountUnits = parseUnits(amount.toString(), 6);
        const account = walletClient.account.address;
        const tx = await walletClient.writeContract({
            address: CONTRACTS.USDC as `0x${string}`,
            abi: ERC20_ABI,
            functionName: 'transfer',
            args: [to as `0x${string}`, amountUnits],
            account
        });
        return { success: true, tx_hash: tx };
    }
};
