import { createPublicClient, http, parseUnits, formatUnits, createWalletClient } from 'viem';
import { arbitrumSepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { orderService } from './orderService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// --- Contract Addresses (Arbitrum Sepolia) ---
// Sourced from backend/contracts/deployments/arbitrum-sepolia.json
// Sourced from .env
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
    AIVault: import.meta.env.VITE_CONTRACT_AI_VAULT
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
    },
    { "inputs": [], "name": "Unauthorized", "type": "error" },
    { "inputs": [], "name": "SessionInactive", "type": "error" },
    { "inputs": [], "name": "SessionExpired", "type": "error" },
    { "inputs": [], "name": "ExecutionFailed", "type": "error" },
    { "inputs": [], "name": "InsufficientBalance", "type": "error" }
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
        "inputs": [
            { "name": "spender", "type": "address" },
            { "name": "value", "type": "uint256" }
        ],
        "name": "approve",
        "outputs": [{ "name": "", "type": "bool" }],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            { "name": "owner", "type": "address" },
            { "name": "spender", "type": "address" }
        ],
        "name": "allowance",
        "outputs": [{ "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            { "name": "to", "type": "address" },
            { "name": "value", "type": "uint256" }
        ],
        "name": "transfer",
        "outputs": [{ "name": "", "type": "bool" }],
        "stateMutability": "nonpayable",
        "type": "function"
    }
] as const;

// --- Client ---
const publicClient = createPublicClient({
    chain: arbitrumSepolia,
    transport: http()
});

export const onchainService = {
    // --- Reads ---

    async getVaultBalances(address: string) {
        try {
            // 1. Fetch Trading Vault Balance
            const tradingData = await publicClient.readContract({
                address: CONTRACTS.TradingVault,
                abi: TRADING_VAULT_ABI,
                functionName: 'getBalance',
                args: [address as `0x${string}`]
            });

            // 2. Fetch AI Vault Balance
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
            console.error('Failed to fetch vault balances:', e);
            return { trading: 0, ai: 0, reserved: 0, available: 0 };
        }
    },

    async getUSDCBalance(address: string) {
        console.log('[onchainService] Fetching USDC for:', address);
        try {
            const balance = await publicClient.readContract({
                address: CONTRACTS.USDC,
                abi: ERC20_ABI,
                functionName: 'balanceOf',
                args: [address as `0x${string}`]
            });
            const fmt = Number(formatUnits(balance, 6));
            console.log('[onchainService] USDC Balance:', fmt);
            return fmt;
        } catch (e) {
            console.error('Failed to fetch USDC balance:', e);
            return 0;
        }
    },

    // --- User Actions (Requires Wallet Client) ---

    // Deposit to TradingVault
    async depositToVault(walletClient: any, address: string, amount: number) {
        // 1. Approve USDC
        // 2. Deposit
        const amountUnits = parseUnits(amount.toString(), 6);
        const account = address as `0x${string}`;

        try {
            // Get current gas estimates to prevent "max fee per gas less than base fee" errors
            const fees = await publicClient.estimateFeesPerGas().catch(() => ({ maxFeePerGas: undefined, maxPriorityFeePerGas: undefined }));
            const bufferedMaxFee = fees.maxFeePerGas ? (fees.maxFeePerGas * 140n) / 100n : undefined;
            const bufferedPriorityFee = fees.maxPriorityFeePerGas ? (fees.maxPriorityFeePerGas * 140n) / 100n : undefined;

            // Check allowance? Or just approve.
            // Simplified: Approve then Deposit
            const tx1Hash = await walletClient.writeContract({
                address: CONTRACTS.USDC,
                abi: ERC20_ABI,
                functionName: 'approve',
                args: [CONTRACTS.TradingVault, amountUnits],
                account,
                maxFeePerGas: bufferedMaxFee,
                maxPriorityFeePerGas: bufferedPriorityFee
            });
            console.log('Approve Tx:', tx1Hash);
            // Wait for confirmation ideally, but UI might handle it.
            // For robustness, we should wait.
            await publicClient.waitForTransactionReceipt({ hash: tx1Hash });

            const tx2Hash = await walletClient.writeContract({
                address: CONTRACTS.TradingVault,
                abi: TRADING_VAULT_ABI,
                functionName: 'depositCollateral',
                args: [amountUnits],
                account,
                maxFeePerGas: bufferedMaxFee,
                maxPriorityFeePerGas: bufferedPriorityFee
            });
            return { success: true, tx_hash: tx2Hash };
        } catch (e) {
            console.error('Deposit failed:', e);
            throw e;
        }
    },

    // Withdraw from TradingVault
    async withdrawFromVault(walletClient: any, address: string, amount: number) {
        const amountUnits = parseUnits(amount.toString(), 6);
        const account = address as `0x${string}`;

        try {
            const fees = await publicClient.estimateFeesPerGas().catch(() => ({ maxFeePerGas: undefined, maxPriorityFeePerGas: undefined }));
            const bufferedMaxFee = fees.maxFeePerGas ? (fees.maxFeePerGas * 140n) / 100n : undefined;
            const bufferedPriorityFee = fees.maxPriorityFeePerGas ? (fees.maxPriorityFeePerGas * 140n) / 100n : undefined;

            const txHash = await walletClient.writeContract({
                address: CONTRACTS.TradingVault,
                abi: TRADING_VAULT_ABI,
                functionName: 'withdrawCollateral',
                args: [amountUnits],
                account,
                maxFeePerGas: bufferedMaxFee,
                maxPriorityFeePerGas: bufferedPriorityFee
            });
            return { success: true, tx_hash: txHash };
        } catch (e) {
            console.error('Withdraw failed:', e);
            throw e;
        }
    },

    // Deposit to AIVault
    async depositToAIVault(walletClient: any, address: string, amount: number) {
        const amountUnits = parseUnits(amount.toString(), 6);
        const account = address as `0x${string}`;

        try {
            const fees = await publicClient.estimateFeesPerGas().catch(() => ({ maxFeePerGas: undefined, maxPriorityFeePerGas: undefined }));
            const bufferedMaxFee = fees.maxFeePerGas ? (fees.maxFeePerGas * 140n) / 100n : undefined;
            const bufferedPriorityFee = fees.maxPriorityFeePerGas ? (fees.maxPriorityFeePerGas * 140n) / 100n : undefined;

            // 1. Approve USDC for AI Vault
            const tx1Hash = await walletClient.writeContract({
                address: CONTRACTS.USDC,
                abi: ERC20_ABI,
                functionName: 'approve',
                args: [CONTRACTS.AIVault, amountUnits],
                account: walletClient.account.address,
                maxFeePerGas: bufferedMaxFee,
                maxPriorityFeePerGas: bufferedPriorityFee
            });
            console.log('Approve AI Tx:', tx1Hash);
            await publicClient.waitForTransactionReceipt({ hash: tx1Hash });

            // 2. Deposit to AI Vault
            const tx2Hash = await walletClient.writeContract({
                address: CONTRACTS.AIVault,
                abi: AI_VAULT_ABI,
                functionName: 'deposit',
                args: [amountUnits],
                account: walletClient.account.address,
                maxFeePerGas: bufferedMaxFee,
                maxPriorityFeePerGas: bufferedPriorityFee
            });
            return { success: true, tx_hash: tx2Hash };
        } catch (e) {
            console.error('AI Deposit failed:', e);
            throw e;
        }
    },

    // Withdraw from AIVault
    async withdrawFromAIVault(walletClient: any, address: string, amount: number) {
        const amountUnits = parseUnits(amount.toString(), 6);
        const account = address as `0x${string}`;

        try {
            const fees = await publicClient.estimateFeesPerGas().catch(() => ({ maxFeePerGas: undefined, maxPriorityFeePerGas: undefined }));
            const bufferedMaxFee = fees.maxFeePerGas ? (fees.maxFeePerGas * 140n) / 100n : undefined;
            const bufferedPriorityFee = fees.maxPriorityFeePerGas ? (fees.maxPriorityFeePerGas * 140n) / 100n : undefined;

            const txHash = await walletClient.writeContract({
                address: CONTRACTS.AIVault,
                abi: AI_VAULT_ABI,
                functionName: 'withdraw',
                args: [amountUnits],
                account: walletClient.account.address,
                maxFeePerGas: bufferedMaxFee,
                maxPriorityFeePerGas: bufferedPriorityFee
            });
            return { success: true, tx_hash: txHash };
        } catch (e) {
            console.error('AI Withdraw failed:', e);
            throw e;
        }
    },

    // Transfer USDC (standard ERC20 transfer)
    async transferUSDC(walletClient: any, to: string, amount: number) {
        const amountUnits = parseUnits(amount.toString(), 6);
        const account = walletClient.account.address;

        try {
            const fees = await publicClient.estimateFeesPerGas().catch(() => ({ maxFeePerGas: undefined, maxPriorityFeePerGas: undefined }));
            const bufferedMaxFee = fees.maxFeePerGas ? (fees.maxFeePerGas * 140n) / 100n : undefined;
            const bufferedPriorityFee = fees.maxPriorityFeePerGas ? (fees.maxPriorityFeePerGas * 140n) / 100n : undefined;

            const txHash = await walletClient.writeContract({
                address: CONTRACTS.USDC,
                abi: ERC20_ABI,
                functionName: 'transfer',
                args: [to as `0x${string}`, amountUnits],
                account,
                maxFeePerGas: bufferedMaxFee,
                maxPriorityFeePerGas: bufferedPriorityFee
            });
            return { success: true, tx_hash: txHash };
        } catch (e) {
            console.error('Transfer USDC failed:', e);
            throw e;
        }
    },

    // Faucet (Direct Mint for Testnet USDC)
    async claimFaucetOnChain(walletClient: any, address: string, amount: number = 1000) {
        try {
            const amountUnits = parseUnits(amount.toString(), 6);
            const fees = await publicClient.estimateFeesPerGas().catch(() => ({ maxFeePerGas: undefined, maxPriorityFeePerGas: undefined }));
            const bufferedMaxFee = fees.maxFeePerGas ? (fees.maxFeePerGas * 140n) / 100n : undefined;
            const bufferedPriorityFee = fees.maxPriorityFeePerGas ? (fees.maxPriorityFeePerGas * 140n) / 100n : undefined;

            // Call mint on USDC directly (since it's public on testnet)
            const txHash = await walletClient.writeContract({
                address: CONTRACTS.USDC,
                abi: [
                    ...ERC20_ABI,
                    {
                        "inputs": [{ "name": "to", "type": "address" }, { "name": "amount", "type": "uint256" }],
                        "name": "mint",
                        "outputs": [],
                        "stateMutability": "nonpayable",
                        "type": "function"
                    }
                ],
                functionName: 'mint',
                args: [address as `0x${string}`, amountUnits],
                account: walletClient.account.address, // Corrected: Always use the sender's account
                maxFeePerGas: bufferedMaxFee,
                maxPriorityFeePerGas: bufferedPriorityFee
            });
            return { success: true, tx_hash: txHash };
        } catch (e) {
            console.error('Faucet claim failed:', e);
            throw e;
        }
    },

    // --- Trading Actions (Requires Session Key) ---

    // Place Order via OrderRouter using Session Key
    // Place Order via OrderRouter using Wallet Client (Direct Sign)
    async placeOrder(
        walletClient: any,
        orderParams: {
            user: string;
            symbol: string;
            side: number; // 0=Buy, 1=Sell
            orderType: number; // 0=Market, 1=Limit, 2=Stop
            amountUsd: number; // USD value
            leverage: number;
            price?: number;
            stopPrice?: number;
            reduceOnly?: boolean;
            postOnly?: boolean;
            triggerCondition?: number;
            timeInForce?: number;
        }
    ) {
        try {
            console.log('[onchainService] Placing order with Wallet:', orderParams);
            const account = walletClient.account.address;

            // AmountUSD -> 1e6 (USDC collateral precision)
            // Price -> 1e6 (Agreed precision for PositionManager)
            const amountUsdInt = parseUnits(orderParams.amountUsd.toString(), 6);
            const priceInt = orderParams.price ? parseUnits(orderParams.price.toString(), 6) : 0n;
            const stopPriceInt = orderParams.stopPrice ? parseUnits(orderParams.stopPrice.toString(), 6) : 0n;

            // --- 1. Check Allowance ---
            console.log('[onchainService] Checking USDC allowance...');
            try {
                // Determine trading vault address - ensure it matches
                const spender = CONTRACTS.TradingVault;

                const allowance = await publicClient.readContract({
                    address: CONTRACTS.USDC,
                    abi: ERC20_ABI,
                    functionName: 'allowance',
                    args: [account as `0x${string}`, spender]
                });

                console.log(`[onchainService] Current Allowance: ${formatUnits(allowance, 6)} USDC, Required: ${orderParams.amountUsd} USDC`);

                if (allowance < amountUsdInt) {
                    console.log('[onchainService] ⚠️ Allowance too low. Requesting usage approval...');
                    // Need to approve
                    // Note: This will trigger a wallet popup
                    const approveTx = await walletClient.writeContract({
                        address: CONTRACTS.USDC,
                        abi: ERC20_ABI,
                        functionName: 'approve',
                        args: [spender, parseUnits('100000', 6)], // Approve 100k USDC
                        account
                    });

                    console.log('[onchainService] Approval Tx Sent:', approveTx);

                    // Wait for approval to be mined
                    console.log('[onchainService] Waiting for approval confirmation...');
                    await publicClient.waitForTransactionReceipt({ hash: approveTx });
                    console.log('[onchainService] ✅ Approval Confirmed. Proceeding to Trade...');
                } else {
                    console.log('[onchainService] ✅ Allowance Sufficient.');
                }
            } catch (err) {
                console.error('[onchainService] Failed to check/approve allowance:', err);
                // Don't block, try trade anyway or throw? Better throw if we know it will fail.
                throw new Error("Failed to verify USDC allowance: " + (err as Error).message);
            }

            // --- 2. Place Order ---
            const tuple = {
                user: orderParams.user as `0x${string}`,
                symbol: orderParams.symbol,
                side: orderParams.side,
                orderType: orderParams.orderType,
                amountUsd: amountUsdInt,
                leverage: orderParams.leverage,
                price: priceInt,
                stopPrice: stopPriceInt,
                reduceOnly: !!orderParams.reduceOnly,
                postOnly: !!orderParams.postOnly,
                triggerCondition: orderParams.triggerCondition || 0,
                timeInForce: BigInt(orderParams.timeInForce || 0)
            };

            // Get current gas estimates to prevent "max fee per gas less than base fee" errors
            const fees = await publicClient.estimateFeesPerGas().catch(() => ({ maxFeePerGas: undefined, maxPriorityFeePerGas: undefined }));
            const bufferedMaxFee = fees.maxFeePerGas ? (fees.maxFeePerGas * 140n) / 100n : undefined;
            const bufferedPriorityFee = fees.maxPriorityFeePerGas ? (fees.maxPriorityFeePerGas * 140n) / 100n : undefined;

            const txHash = await walletClient.writeContract({
                address: CONTRACTS.OrderRouter,
                abi: ORDER_ROUTER_ABI,
                functionName: 'placeOrder',
                args: [tuple],
                account,
                chain: arbitrumSepolia,
                maxFeePerGas: bufferedMaxFee,
                maxPriorityFeePerGas: bufferedPriorityFee
            });

            console.log('[onchainService] Order Tx Sent:', txHash);

            // Wait for confirmation
            console.log('[onchainService] Waiting for order confirmation...');
            const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
            console.log('[onchainService] ✅ Order Confirmed in block', receipt.blockNumber);

            return { success: true, tx_hash: txHash, receipt };

        } catch (e) {
            console.error('Place Order (Wallet) failed:', e);
            throw e;
        }
    },

    /**
     * Places an order using a Session Key (Autonomous/1-Click Trading)
     * This does NOT trigger a wallet popup as it's signed by the session private key.
     */
    async placeOrderWithSession(
        sessionPrivateKey: string,
        orderParams: {
            user: string;
            symbol: string;
            side: number; // 0=Buy, 1=Sell
            orderType: number; // 0=Market, 1=Limit, 2=Stop
            amountUsd: number; // USD value
            leverage: number;
            price?: number;
            stopPrice?: number;
            reduceOnly?: boolean;
            postOnly?: boolean;
            triggerCondition?: number;
            timeInForce?: number;
        }
    ) {
        console.log('[onchainService] Placing Order with Session Key...');
        try {
            // Sanitize key
            let cleanKey = sessionPrivateKey.replace(/['"]/g, '').trim();
            if (!cleanKey.startsWith('0x')) {
                cleanKey = `0x${cleanKey}`;
            }

            const account = privateKeyToAccount(cleanKey as `0x${string}`);

            // Create Clients
            const sessionClient = createWalletClient({
                account,
                chain: arbitrumSepolia,
                transport: http()
            });

            const amountUsdInt = parseUnits(orderParams.amountUsd.toString(), 6);
            const priceInt = orderParams.price ? parseUnits(orderParams.price.toString(), 6) : 0n;
            const stopPriceInt = orderParams.stopPrice ? parseUnits(orderParams.stopPrice.toString(), 6) : 0n;

            const tuple = {
                user: orderParams.user as `0x${string}`,
                symbol: orderParams.symbol,
                side: orderParams.side,
                orderType: orderParams.orderType,
                amountUsd: amountUsdInt,
                leverage: orderParams.leverage,
                price: priceInt,
                stopPrice: stopPriceInt,
                reduceOnly: !!orderParams.reduceOnly,
                postOnly: !!orderParams.postOnly,
                triggerCondition: orderParams.triggerCondition || 0,
                timeInForce: BigInt(orderParams.timeInForce || 0)
            };

            // Gas estimates for reliability
            const fees = await publicClient.estimateFeesPerGas().catch(() => ({ maxFeePerGas: undefined, maxPriorityFeePerGas: undefined }));
            const bufferedMaxFee = fees.maxFeePerGas ? (fees.maxFeePerGas * 150n) / 100n : undefined;
            const bufferedPriorityFee = fees.maxPriorityFeePerGas ? (fees.maxPriorityFeePerGas * 150n) / 100n : undefined;

            const txHash = await sessionClient.writeContract({
                address: CONTRACTS.OrderRouter,
                abi: ORDER_ROUTER_ABI,
                functionName: 'placeOrder',
                args: [tuple],
                maxFeePerGas: bufferedMaxFee,
                maxPriorityFeePerGas: bufferedPriorityFee
            });

            console.log('[onchainService] Session Order Tx Sent:', txHash);

            // OPTIMISTIC: Return immediately so UI feels instant.
            // Do NOT wait for receipt here. Let the backend indexer or portfolio poller pick it up.
            return { success: true, tx_hash: txHash, receipt: null };

            // Wait for confirmation (Backend usually polls, but for immediate UI we wait)
            // const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
            // console.log('[onchainService] ✅ Session Order Confirmed');
            // return { success: true, tx_hash: txHash, receipt };

        } catch (e) {
            console.error('Place Order with Session Key failed:', e);
            throw e;
        }
    },

    // --- Backend Fallbacks / Helpers ---

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
        return response.json();
    },

    async confirmSessionKey(data: {
        user_address: string;
        session_address: string;
        session_private_key: string;
        expires_in: number;
    }) {
        const response = await fetch(`${API_URL}/api/v1/session/confirm`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to confirm session key');
        }
        return response.json();
    },

    async getActiveSession(address: string) {
        console.log('[onchainService] Checking session for:', address);
        const response = await fetch(`${API_URL}/api/v1/session/active/${address}`);
        // if (!response.ok) return { has_session: false };
        if (!response.ok) return { has_session: false };
        return response.json();
        // return { has_session: false }; // Disable backend check for now to rely on local
    },

    // --- Position Management Helpers ---

    async closePosition(
        walletAddress: string,
        position: any, // PositionData
        options: {
            percentage: number; // 0-100
            price?: number; // for limit
            orderType?: 'market' | 'limit'; // default market
        },
        walletClient?: any // Optional override
    ) {
        const { percentage, price, orderType = 'market' } = options;
        const sizeToClose = position.size * (percentage / 100);

        // Debug position object properties
        console.log('[onchainService] Closing Position Data:', {
            symbol: position.symbol,
            size: position.size,
            markPrice: position.markPrice,
            mark_price: position.mark_price,
            entryPrice: position.entryPrice,
            entry_price: position.entry_price
        });

        // Robust Price Resolution: Handle camelCase vs snake_case and missing values
        let effectivePrice = price; // If user provided limit price, use it
        if (!effectivePrice) {
            effectivePrice = position.markPrice || position.mark_price || position.entryPrice || position.entry_price;
        }

        // Final sanity check
        if (!effectivePrice || effectivePrice <= 0) {
            console.error('[onchainService] Price missing, defaulting to 1 (DANGEROUS for limit, OK for market if contract queries oracle)');
            // If market order, maybe we can send 0 if backend handles it? 
            // But contract expects amountUsd based on fetch.
            // Let's try to throw for now.
            throw new Error(`Cannot close position: Price is zero or unknown for ${position.symbol}`);
        }

        const amountUsd = sizeToClose * effectivePrice;
        if (amountUsd <= 0) {
            throw new Error(`Cannot close position: Calculated Amount USD is zero. Size: ${sizeToClose}, Price: ${effectivePrice}`);
        }

        // Determine side: Long -> Sell (1), Short -> Buy (0)
        // position.side is usually "Long" or "Short" string from UI, or maybe enum
        const isLong = typeof position.side === 'string' ? position.side.toLowerCase() === 'long' : position.side === 0;
        const closeSide = isLong ? 1 : 0; // Opposite

        const sideStr = isLong ? 'sell' : 'buy';
        const typeStr = orderType;

        // Check Session
        const sessionKey = localStorage.getItem('osmo_session_key');
        const hasSession = !!sessionKey; // Simple check

        let txHash;

        if (hasSession && sessionKey) {
            console.log('[onchainService] Closing via SessionKey', position.symbol);
            const res = await this.placeOrderWithSession(sessionKey, {
                user: walletAddress,
                symbol: position.symbol,
                side: closeSide,
                orderType: orderType === 'limit' ? 1 : 0,
                amountUsd: amountUsd,
                leverage: typeof position.leverage === 'string' ? parseFloat(position.leverage) : position.leverage,
                price: price || 0,
            });
            txHash = res.tx_hash;
        } else {
            console.log('[onchainService] Closing via Wallet', position.symbol);
            // Fallback to Wallet
            if (!walletClient) throw new Error("Wallet Client required for non-session close");

            const res = await this.placeOrder(walletClient, {
                user: walletAddress,
                symbol: position.symbol,
                side: closeSide,
                orderType: orderType === 'limit' ? 1 : 0,
                amountUsd: amountUsd,
                leverage: typeof position.leverage === 'string' ? parseFloat(position.leverage) : position.leverage,
                price: price || 0,
            });
            txHash = res.tx_hash;
        }

        // Report to Backend (Shadow Logic)
        if (txHash) {
            // We report the generic placeOrder structure
            await orderService.reportOnchainOrder({
                user_address: walletAddress,
                symbol: position.symbol,
                side: sideStr,
                order_type: typeStr as any,
                amount_usd: amountUsd,
                leverage: typeof position.leverage === 'string' ? parseFloat(position.leverage) : position.leverage,
                tx_hash: txHash,
                price: price || (position.mark_price || position.entry_price),
            });
        }

        return { success: true, tx_hash: txHash };
    },

    async closeAllPositions(
        walletAddress: string,
        positions: any[],
        mode: 'market' | 'limit' = 'market',
        walletClient?: any
    ) {
        const promises = positions.map(p => {
            const price = mode === 'limit' ? (p.mark_price || p.entry_price) : undefined;
            return this.closePosition(walletAddress, p, {
                percentage: 100,
                orderType: mode,
                price
            }, walletClient).catch(e => {
                console.error(`Failed to close ${p.symbol}:`, e);
                return { success: false, error: e };
            });
        });

        return Promise.all(promises);
    },

    async reversePosition(
        walletAddress: string,
        position: any,
        walletClient?: any
    ) {
        // Reverse = Close + Open Opposite (2x size)
        // Effectively: Place Opposite Order with 2x Size.

        // 1. Calculate USD size to flip (Current Size + New Target Size (Same)).
        // Total = 2 * Current Size

        const sizeToFlip = position.size * 2;

        // Robust Price Logic
        console.log('[onchainService] Reverse Position Data:', position);
        const effectivePrice = position.markPrice || position.mark_price || position.entryPrice || position.entry_price;

        if (!effectivePrice || effectivePrice <= 0) {
            throw new Error(`Cannot reverse position: Price is zero or unknown for ${position.symbol}`);
        }

        const estimatedUsd = sizeToFlip * effectivePrice;

        if (estimatedUsd <= 0) {
            throw new Error(`Cannot reverse position: Calculated USD Amount is zero. Size: ${sizeToFlip}, Price: ${effectivePrice}`);
        }

        const isLong = typeof position.side === 'string' ? position.side.toLowerCase() === 'long' : position.side === 0;
        const closeSide = isLong ? 1 : 0; // Opposite
        const sideStr = isLong ? 'sell' : 'buy';

        // Check Session
        const sessionKey = localStorage.getItem('osmo_session_key');
        const hasSession = !!sessionKey;

        let txHash;

        const orderParams = {
            user: walletAddress,
            symbol: position.symbol,
            side: closeSide,
            orderType: 0, // Market
            amountUsd: estimatedUsd,
            leverage: typeof position.leverage === 'string' ? parseFloat(position.leverage) : position.leverage,
            price: 0
        };

        if (hasSession && sessionKey) {
            const res = await this.placeOrderWithSession(sessionKey, orderParams);
            txHash = res.tx_hash;
        } else {
            if (!walletClient) throw new Error("Wallet Client required");
            const res = await this.placeOrder(walletClient, orderParams);
            txHash = res.tx_hash;
        }

        if (txHash) {
            await orderService.reportOnchainOrder({
                user_address: walletAddress,
                symbol: position.symbol,
                side: sideStr,
                order_type: 'market',
                amount_usd: estimatedUsd,
                leverage: orderParams.leverage,
                tx_hash: txHash,
                price: position.mark_price
            });
        }

        return { success: true, tx_hash: txHash };
    },

    async waitForTransaction(hash: string) {
        return publicClient.waitForTransactionReceipt({ hash: hash as `0x${string}` });
    },

    // --- Trading Setup Helpers ---

    async checkTradingSetup(userAddress: string) {
        // 1. Check Allowance
        const allowance = await publicClient.readContract({
            address: CONTRACTS.USDC,
            abi: ERC20_ABI,
            functionName: 'allowance',
            args: [userAddress as `0x${string}`, CONTRACTS.TradingVault]
        });

        // 2. Check OrderRouter Role (requires AccessControl ABI)
        // Only if user is admin (optional/advanced check, hard to know if user is admin easily without reading contract)
        // We will assume if allowance is OK, we are good. Role check is for Admin mainly.
        // Actually, we can check if OrderRouter has role.

        const ACCESS_CONTROL_ABI = [
            {
                "inputs": [
                    { "name": "role", "type": "bytes32" },
                    { "name": "account", "type": "address" }
                ],
                "name": "hasRole",
                "outputs": [{ "name": "", "type": "bool" }],
                "stateMutability": "view",
                "type": "function"
            }
        ] as const;

        const ORDER_ROUTER_ROLE = "0xb350f660a06ece1f116b96dec924c715d62a3346ae845dd2f736149f033c5fd8";

        let roleGranted = false;
        try {
            roleGranted = await publicClient.readContract({
                address: CONTRACTS.PositionManager,
                abi: ACCESS_CONTROL_ABI,
                functionName: 'hasRole',
                args: [ORDER_ROUTER_ROLE, CONTRACTS.OrderRouter]
            });
        } catch (e) {
            console.error('Failed to check role:', e);
        }

        return {
            allowance,
            roleGranted
        };
    },

    async grantOrderRouterRole(walletClient: any) {
        const account = walletClient.account.address;
        const ACCESS_CONTROL_ABI = [
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

        const ORDER_ROUTER_ROLE = "0xb350f660a06ece1f116b96dec924c715d62a3346ae845dd2f736149f033c5fd8";

        const fees = await publicClient.estimateFeesPerGas().catch(() => ({ maxFeePerGas: undefined, maxPriorityFeePerGas: undefined }));
        const bufferedMaxFee = fees.maxFeePerGas ? (fees.maxFeePerGas * 140n) / 100n : undefined;
        const bufferedPriorityFee = fees.maxPriorityFeePerGas ? (fees.maxPriorityFeePerGas * 140n) / 100n : undefined;

        return walletClient.writeContract({
            address: CONTRACTS.PositionManager,
            abi: ACCESS_CONTROL_ABI,
            functionName: 'grantRole',
            args: [ORDER_ROUTER_ROLE, CONTRACTS.OrderRouter],
            account,
            chain: arbitrumSepolia,
            maxFeePerGas: bufferedMaxFee,
            maxPriorityFeePerGas: bufferedPriorityFee
        });
    },

    async approveUSDC(walletClient: any, amount: string = '1000000') {
        const account = walletClient.account.address;
        const fees = await publicClient.estimateFeesPerGas().catch(() => ({ maxFeePerGas: undefined, maxPriorityFeePerGas: undefined }));
        const bufferedMaxFee = fees.maxFeePerGas ? (fees.maxFeePerGas * 140n) / 100n : undefined;
        const bufferedPriorityFee = fees.maxPriorityFeePerGas ? (fees.maxPriorityFeePerGas * 140n) / 100n : undefined;

        return walletClient.writeContract({
            address: CONTRACTS.USDC,
            abi: ERC20_ABI,
            functionName: 'approve',
            args: [CONTRACTS.TradingVault, parseUnits(amount, 6)],
            account,
            chain: arbitrumSepolia,
            maxFeePerGas: bufferedMaxFee,
            maxPriorityFeePerGas: bufferedPriorityFee
        });
    },

    // Keep legacy signatures if needed or alias them
    async claimFaucet(address: string) {
        // Fallback to backend or throw? 
        // We prefer on-chain now. But caller might not provide walletClient.
        // If walletClient is missing, use backend.
        console.warn('Deprecated claimFaucet called. Use claimFaucetOnChain with walletClient.');
        return fetch(`${API_URL}/api/v1/faucet/claim`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_address: address })
        }).then(res => res.json());
    }
};
