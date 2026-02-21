import { createPublicClient, http, parseUnits, formatUnits } from 'viem';
import { arbitrumSepolia } from 'viem/chains';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// --- Contract Addresses (Arbitrum Sepolia) ---
export const CONTRACTS = {
    TradingVault: import.meta.env.VITE_CONTRACT_TRADING_VAULT,
    OrderRouter: import.meta.env.VITE_CONTRACT_ORDER_ROUTER,
    PositionManager: import.meta.env.VITE_CONTRACT_POSITION_MANAGER,
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
        "inputs": [{ "name": "role", "type": "bytes32" }],
        "name": "getRoleAdmin",
        "outputs": [{ "name": "", "type": "bytes32" }],
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

const FAUCET_ABI = [
    {
        "inputs": [],
        "name": "drip",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{ "name": "user", "type": "address" }],
        "name": "canDrip",
        "outputs": [{ "name": "", "type": "bool" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{ "name": "user", "type": "address" }],
        "name": "timeUntilNextDrip",
        "outputs": [{ "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "dripAmount",
        "outputs": [{ "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getFaucetBalance",
        "outputs": [{ "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    }
] as const;

const ORDER_ROUTER_ROLE_FALLBACK = "0xb350f660a06ece1f116b96dec924c715d62a3346ae845dd2f736149f033c5fd8";
const ORDER_ROUTER_ROLE_ABI = [
    {
        "inputs": [],
        "name": "ORDER_ROUTER_ROLE",
        "outputs": [{ "name": "", "type": "bytes32" }],
        "stateMutability": "view",
        "type": "function"
    }
] as const;
let lastTradingSetupWarnAt = 0;


const publicClient = createPublicClient({
    chain: arbitrumSepolia,
    transport: http()
});

const getOrderRouterRole = async (roleContract: `0x${string}`) => {
    try {
        return await publicClient.readContract({
            address: roleContract,
            abi: ORDER_ROUTER_ROLE_ABI,
            functionName: 'ORDER_ROUTER_ROLE',
        }) as `0x${string}`;
    } catch {
        return ORDER_ROUTER_ROLE_FALLBACK as `0x${string}`;
    }
};

export const onchainService = {
    async getFaucetStatusOnChain(userAddress: string) {
        const faucet = CONTRACTS.Faucet as `0x${string}`;
        if (!faucet) throw new Error("Faucet address missing (env)");
        const user = userAddress as `0x${string}`;

        const [canDrip, timeUntilNext, dripAmount, faucetBal] = await Promise.all([
            publicClient.readContract({
                address: faucet,
                abi: FAUCET_ABI,
                functionName: 'canDrip',
                args: [user]
            }) as Promise<boolean>,
            publicClient.readContract({
                address: faucet,
                abi: FAUCET_ABI,
                functionName: 'timeUntilNextDrip',
                args: [user]
            }) as Promise<bigint>,
            publicClient.readContract({
                address: faucet,
                abi: FAUCET_ABI,
                functionName: 'dripAmount',
            }) as Promise<bigint>,
            publicClient.readContract({
                address: faucet,
                abi: FAUCET_ABI,
                functionName: 'getFaucetBalance',
            }) as Promise<bigint>,
        ]);

        return {
            can_drip: Boolean(canDrip),
            time_until_next_drip: timeUntilNext,
            drip_amount: dripAmount,
            faucet_balance: faucetBal,
        };
    },
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

    async waitForTransaction(hash: string | string[]) {
        if (Array.isArray(hash)) {
            // Some flows submit multiple transactions (e.g. granting roles on multiple contracts).
            for (const h of hash) {
                await publicClient.waitForTransactionReceipt({ hash: h as `0x${string}` });
            }
            return;
        }
        return publicClient.waitForTransactionReceipt({ hash: hash as `0x${string}` });
    },

    async claimFaucetOnChain(walletClient: any, address: string, _amount: number) {
        // Deployed Faucet contract only supports `drip()`:
        // it drips a fixed amount to msg.sender with a cooldown.
        const faucet = CONTRACTS.Faucet as `0x${string}`;
        if (!faucet) throw new Error("Faucet address missing (env)");

        const account = walletClient.account.address as `0x${string}`;

        // This flow cannot drip to arbitrary recipients.
        if (address && address.toLowerCase() !== account.toLowerCase()) {
            throw new Error("Faucet can only drip to your wallet address");
        }

        try {
            const { can_drip: canDrip, time_until_next_drip: timeUntilNext, drip_amount: dripAmount, faucet_balance: faucetBal } =
                await this.getFaucetStatusOnChain(account);

            if (!canDrip) {
                const secs = Number(timeUntilNext);
                const mins = Math.ceil(secs / 60);
                throw new Error(`Cooldown active. Try again in ~${mins} min`);
            }
            if (faucetBal < dripAmount) {
                throw new Error("Faucet is empty. Please contact the team.");
            }

            const tx = await walletClient.writeContract({
                address: faucet,
                abi: FAUCET_ABI,
                functionName: 'drip',
                args: [],
                account
            });
            return { success: true, tx_hash: tx, drip_amount: dripAmount };
        } catch (e) {
            console.error('Faucet on-chain failed:', e);
            throw e;
        }
    },

    async checkTradingSetup(address: string) {
        const positionManager = CONTRACTS.PositionManager as `0x${string}`;
        const orderRouter = CONTRACTS.OrderRouter as `0x${string}`;
        const ostiumAdapter = CONTRACTS.OstiumAdapter as `0x${string}`;
        const usdc = CONTRACTS.USDC as `0x${string}`;
        const vault = CONTRACTS.TradingVault as `0x${string}`;

        // If env vars are missing, avoid noisy viem errors.
        if (!usdc || !vault) return { roleGranted: false, allowance: 0n };
        if (!orderRouter) return { roleGranted: false, allowance: 0n };

        let roleGranted = false;
        let roleError: unknown = null;

        const roleContracts = [
            { name: 'TradingVault', address: vault },
            { name: 'PositionManager', address: positionManager },
            { name: 'OstiumAdapter', address: ostiumAdapter },
        ].filter(c => Boolean(c.address)) as Array<{ name: string; address: `0x${string}` }>;

        // Resolve the role bytes32 from any deployed contract to avoid mismatches.
        const role = roleContracts.length
            ? await getOrderRouterRole(roleContracts[0].address)
            : (ORDER_ROUTER_ROLE_FALLBACK as `0x${string}`);

        if (roleContracts.length) {
            const res = await Promise.allSettled(
                roleContracts.map(c =>
                    publicClient.readContract({
                        address: c.address,
                        abi: ROLE_ABI,
                        functionName: 'hasRole',
                        // Protocol permission: allow OrderRouter contract to call managers.
                        args: [role, orderRouter]
                    })
                )
            );
            roleGranted = res.every(r => r.status === 'fulfilled' && Boolean((r as any).value));
            const rejected = res.find(r => r.status === 'rejected') as PromiseRejectedResult | undefined;
            if (rejected) roleError = rejected.reason;
        }

        const allowanceRes = await Promise.allSettled([
            publicClient.readContract({
                address: usdc,
                abi: ERC20_ABI,
                functionName: 'allowance',
                args: [address as `0x${string}`, vault]
            })
        ]);
        const allowance = allowanceRes[0].status === 'fulfilled' ? (allowanceRes[0].value as bigint) : 0n;

        if (!roleGranted || allowanceRes[0].status === 'rejected') {
            const now = Date.now();
            if (now - lastTradingSetupWarnAt > 15_000) {
                lastTradingSetupWarnAt = now;
                console.warn('checkTradingSetup incomplete (non-fatal). Verify contracts + network.', {
                    positionManager,
                    ostiumAdapter,
                    usdc,
                    vault,
                    roleError: roleError ? String((roleError as any)?.message || roleError) : undefined,
                    allowanceError: allowanceRes[0].status === 'rejected' ? String((allowanceRes[0] as any).reason?.message || (allowanceRes[0] as any).reason) : undefined,
                });
            }
        }

        return { roleGranted, allowance };
    },

    async canGrantOrderRouterRole(callerAddress: string) {
        const positionManager = CONTRACTS.PositionManager as `0x${string}`;
        const ostiumAdapter = CONTRACTS.OstiumAdapter as `0x${string}`;
        const orderRouter = CONTRACTS.OrderRouter as `0x${string}`;
        const vault = CONTRACTS.TradingVault as `0x${string}`;
        if (!orderRouter) return { canGrant: false, reason: 'OrderRouter address missing (env)' };

        const roleContracts = [
            { name: 'TradingVault', address: vault },
            { name: 'PositionManager', address: positionManager },
            { name: 'OstiumAdapter', address: ostiumAdapter },
        ].filter(c => Boolean(c.address)) as Array<{ name: string; address: `0x${string}` }>;

        if (!roleContracts.length) return { canGrant: false, reason: 'No role contracts configured (TradingVault/PositionManager/OstiumAdapter missing)' };

        try {
            const role = await getOrderRouterRole(roleContracts[0].address);
            const results = await Promise.allSettled(roleContracts.map(async (c) => {
                const adminRole = await publicClient.readContract({
                    address: c.address,
                    abi: ROLE_ABI,
                    functionName: 'getRoleAdmin',
                    args: [role],
                }) as `0x${string}`;

                const isAdmin = await publicClient.readContract({
                    address: c.address,
                    abi: ROLE_ABI,
                    functionName: 'hasRole',
                    args: [adminRole, callerAddress as `0x${string}`],
                }) as boolean;

                return { name: c.name, isAdmin };
            }));

            const rejected = results.find(r => r.status === 'rejected') as PromiseRejectedResult | undefined;
            if (rejected) return { canGrant: false, reason: String((rejected.reason as any)?.shortMessage || (rejected.reason as any)?.message || rejected.reason || 'Unknown') };

            const values = results
                .filter(r => r.status === 'fulfilled')
                .map(r => (r as PromiseFulfilledResult<{ name: string; isAdmin: boolean }>).value);

            const notAdmin = values.filter(v => !v.isAdmin).map(v => v.name);
            if (notAdmin.length) return { canGrant: false, reason: `Admin role required (${notAdmin.join(', ')})` };

            return { canGrant: true, reason: 'ok' };
        } catch (e: any) {
            return { canGrant: false, reason: String(e?.shortMessage || e?.message || e || 'Unknown') };
        }
    },

    async grantOrderRouterRole(walletClient: any) {
        const account = walletClient.account.address;
        const orderRouter = CONTRACTS.OrderRouter as `0x${string}`;
        if (!orderRouter) throw new Error('OrderRouter address missing (env)');

        const vault = CONTRACTS.TradingVault as `0x${string}`;
        const positionManager = CONTRACTS.PositionManager as `0x${string}`;
        const ostiumAdapter = CONTRACTS.OstiumAdapter as `0x${string}`;

        const targets = [vault, positionManager, ostiumAdapter].filter(Boolean) as `0x${string}`[];
        if (!targets.length) throw new Error('No role contracts configured (TradingVault/PositionManager/OstiumAdapter missing)');

        const role = await getOrderRouterRole(targets[0]);
        const txs: string[] = [];
        for (const target of targets) {
            const tx = await walletClient.writeContract({
                address: target,
                abi: ROLE_ABI,
                functionName: 'grantRole',
                // Grant protocol permission to OrderRouter contract (not the user wallet).
                args: [role, orderRouter],
                account
            });
            txs.push(tx);
        }
        return txs;
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

    async placeOrderWithSession(_sessionKey: string, orderParams: any) {
        // Backend route is /api/orders/place (there is no /api/orders/session).
        // We also avoid sending the session private key over the network; backend reads it from its session store.

        const user_address = (orderParams.user || orderParams.user_address) as string;
        const symbol = orderParams.symbol as string;

        const sideRaw = orderParams.side;
        const side =
            sideRaw === 0 || sideRaw === '0' ? 'buy' :
                sideRaw === 1 || sideRaw === '1' ? 'sell' :
                    String(sideRaw || '').toLowerCase();

        const ot = orderParams.orderType;
        const stopPrice = Number(orderParams.stopPrice ?? orderParams.stop_price ?? 0);
        const price = Number(orderParams.price ?? 0);
        const order_type =
            ot === 0 || ot === '0' ? 'market' :
                ot === 1 || ot === '1' ? 'limit' :
                    // STOP: Treat as stop_market when limit price is 0, otherwise stop_limit.
                    (stopPrice > 0 && (!price || price <= 0)) ? 'stop_market' : 'stop_limit';

        const body = {
            user_address,
            symbol,
            side,
            order_type,
            amount_usd: Number(orderParams.amountUsd ?? orderParams.amount_usd ?? 0),
            leverage: Number(orderParams.leverage ?? 1),
            price: price > 0 ? price : undefined,
            stop_price: stopPrice > 0 ? stopPrice : undefined,
            tp: typeof orderParams.tp !== 'undefined' ? Number(orderParams.tp) : undefined,
            sl: typeof orderParams.sl !== 'undefined' ? Number(orderParams.sl) : undefined,
            reduce_only: !!(orderParams.reduceOnly ?? orderParams.reduce_only),
            post_only: !!(orderParams.postOnly ?? orderParams.post_only),
            time_in_force: (orderParams.timeInForce ?? orderParams.time_in_force) || undefined,
            // Force onchain for 1-click; autodetect would route crypto to Hyperliquid.
            exchange: 'onchain'
        };

        const res = await fetch(`${API_URL}/api/orders/place`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        // FastAPI returns {"detail":"Not Found"} for 404; other errors may be non-JSON.
        if (!res.ok) {
            let detail = `HTTP ${res.status}`;
            try {
                const err = await res.json() as any;
                detail = err?.detail || err?.message || detail;
            } catch {
                try {
                    const text = await res.text();
                    if (text) detail = text;
                } catch { }
            }
            throw new Error(detail || 'Session order failed');
        }

        const data = await res.json() as any;
        if (data?.success === false) {
            throw new Error(data?.detail || data?.message || 'Session order failed');
        }

        // Normalize to the existing frontend shape.
        return {
            success: true,
            tx_hash: data?.exchange_order_id || data?.tx_hash || data?.order_id
        };
    },

    async getActiveSession(address: string) {
        // Backend web3 routes are mounted under /api/v1 (see backend/websocket/main.py).
        const res = await fetch(`${API_URL}/api/v1/session/active/${address}`);
        if (!res.ok) return { has_session: false };
        return res.json();
    },

    async createSessionKey(address: string, params: any) {
        // Backend web3 routes are mounted under /api/v1 (see backend/websocket/main.py).
        const res = await fetch(`${API_URL}/api/v1/session/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            // API expects { user_address, permissions: {...} }
            body: JSON.stringify({ user_address: address, permissions: params })
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail || 'Failed to create session');
        }
        return res.json();
    },

    async confirmSessionKey(params: any) {
        // Backend web3 routes are mounted under /api/v1 (see backend/websocket/main.py).
        const res = await fetch(`${API_URL}/api/v1/session/confirm`, {
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
