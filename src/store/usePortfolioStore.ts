import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useMarketStore } from './useMarketStore';
import { onchainService } from '../api/onchainService';
import { orderService, type PositionData, type OrderData, type AccountSummary } from '../api/orderService';
import { portfolioService, type PortfolioHistoryPoint, type FundingHistoryData } from '../api/portfolioService';
import { tradingViewCommandService } from '../api/tradingViewCommandService';

const realtimeAttemptsByWallet = new Map<string, number>();
const MAX_REALTIME_ATTEMPTS = 5;

let globalSyncWallet: string | null = null;
let globalSyncIntervalId: number | null = null;
let globalSyncTick = 0;

// Request deduplication - prevent duplicate concurrent requests
const pendingRequests = new Map<string, Promise<any>>();

const toPositiveNumber = (value: unknown): number | null => {
    const parsed = Number(String(value ?? '').replace(/[^0-9.\-]/g, '').trim());
    if (!Number.isFinite(parsed) || parsed <= 0) return null;
    return parsed;
};

// Helper to deduplicate concurrent requests
async function fetchWithDedup<T>(
    key: string,
    fetchFn: () => Promise<T>
): Promise<T> {
    // If same request is already pending, return that promise
    if (pendingRequests.has(key)) {
        return pendingRequests.get(key) as Promise<T>;
    }

    try {
        const promise = fetchFn();
        pendingRequests.set(key, promise);
        return await promise;
    } finally {
        pendingRequests.delete(key);
    }
}

const normalizeSide = (side: unknown): 'long' | 'short' | null => {
    const s = String(side ?? '').toLowerCase();
    if (s === 'long' || s === 'buy') return 'long';
    if (s === 'short' || s === 'sell') return 'short';
    return null;
};

const resolveTriggerPrice = (
    rawValue: unknown,
    mode: 'tp' | 'sl',
    side: 'long' | 'short',
    entry: number
): number | null => {
    if (!rawValue || !Number.isFinite(entry) || entry <= 0) return null;
    const text = String(rawValue).trim().toUpperCase();
    if (!text) return null;

    const numeric = toPositiveNumber(text);
    if (!numeric) return null;

    if (text.endsWith('%')) {
        const ratio = numeric / 100;
        if (mode === 'tp') {
            return side === 'long' ? entry * (1 + ratio) : entry * (1 - ratio);
        }
        return side === 'long' ? entry * (1 - ratio) : entry * (1 + ratio);
    }

    if (text.endsWith('$') || text.endsWith('USD')) {
        if (mode === 'tp') {
            return side === 'long' ? entry + numeric : entry - numeric;
        }
        return side === 'long' ? entry - numeric : entry + numeric;
    }

    return numeric;
};

export interface TradeHistoryData {
    id: string;
    time: string;
    symbol: string;
    direction: string;
    price: number;
    size: number;
    sizeAsset: string;
    tradeValue: number;
    tradeValueAsset: string;
    fee: number;
    feeAsset: string;
    closedPnl: number;
    closedPnlAsset: string;
}

interface PortfolioState {
    positions: PositionData[];
    openOrders: OrderData[];
    orderHistory: OrderData[];
    tradeHistory: TradeHistoryData[];
    history: PortfolioHistoryPoint[];
    historyTimeframe: '1d' | '7d' | '30d' | 'all';
    fundingHistory: FundingHistoryData[]; // New
    summary: AccountSummary | null;
    isLoading: boolean;
    error: string | null;

    // Actions
    // Actions
    fetchPositions: (userAddress: string) => Promise<void>;
    fetchOrders: (userAddress: string, status?: string) => Promise<void>;
    refreshAll: (userAddress: string) => Promise<void>;
    fetchHistory: (userAddress: string, timeframe?: string) => Promise<void>;
    setHistoryTimeframe: (timeframe: '1d' | '7d' | '30d' | 'all') => void;
    fetchFundingHistory: (userAddress: string, type?: 'Deposit' | 'Withdraw') => Promise<void>; // New
    fetchTradeHistory: (userAddress: string) => Promise<void>; // New
    updateTPSL: (
        userAddress: string,
        positionId: string,
        tp?: string,
        sl?: string,
        risk?: { size_tokens?: number | null; tp_limit_price?: number | null; sl_limit_price?: number | null }
    ) => Promise<void>;
    updateMarkPrices: (prices: Record<string, any>) => void;
    cancelOrder: (userAddress: string, orderId: string) => Promise<void>;
    cancelAllOrders: (userAddress: string) => Promise<{ cancelled: number; failed: number; skipped: number }>;
    clearStore: () => void;

    // Real-time
    connectRealtime: (userAddress: string) => void;
    disconnectRealtime: () => void;

    // Global sync (started from root App to avoid refetch loops on tab/page switches)
    startGlobalSync: (userAddress: string) => void;
    stopGlobalSync: () => void;

    // Internal
    localTPSL: Record<string, { tp?: string; sl?: string }>;
    lastFetchId: number;
    ws: WebSocket | null;
}

export const usePortfolioStore = create<PortfolioState>()(
    persist(
        (set, get) => ({
    summary: null,
    isLoading: false,
    error: null,
    openOrders: [],
    orderHistory: [],
    tradeHistory: [],
    history: [],
    historyTimeframe: '1d',
    fundingHistory: [], // New

    // Initial State
    positions: [],
    ws: null,

    // State for local TP/SL persistence
    localTPSL: {},
    lastFetchId: 0,

    connectRealtime: (userAddress: string) => {
        // Disconnect existing if any
        get().disconnectRealtime();

        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        let wsUrl = '';
        try {
            const api = new URL(API_URL);
            api.protocol = api.protocol === 'https:' ? 'wss:' : 'ws:';
            api.pathname = '/';
            api.search = '';
            api.hash = '';
            wsUrl = new URL(`/ws/notifications/${userAddress}`, api).toString();
        } catch {
            wsUrl = API_URL.replace('http', 'ws') + `/ws/notifications/${userAddress}`;
        }

        const key = String(userAddress || '').toLowerCase();
        const prevAttempts = realtimeAttemptsByWallet.get(key) ?? 0;
        if (prevAttempts >= MAX_REALTIME_ATTEMPTS) return;

        console.log(`🔌 Connecting to portfolio real-time: ${wsUrl}`);
        const socket = new WebSocket(wsUrl);

        socket.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                // Reduce noise by only logging non-heartbeat messages if needed for debug
                // if (message.type !== 'ping') console.log(`🔔 Portfolio [${message.type}]`);

                if (message.data && message.data.positions && message.data.summary) {
                    const currentLocalTPSL = get().localTPSL;
                    const mergedPositions = message.data.positions.map((p: any) => ({
                        ...p,
                        tp: currentLocalTPSL[p.id]?.tp ?? currentLocalTPSL[p.symbol]?.tp ?? p.tp,
                        sl: currentLocalTPSL[p.id]?.sl ?? currentLocalTPSL[p.symbol]?.sl ?? p.sl
                    })).filter((p: any) => Math.abs(p.size) > 1e-8);

                    set({
                        positions: mergedPositions,
                        summary: message.data.summary,
                        isLoading: false
                    });
                }

                if (['trade_filled', 'trade_closed', 'initial_state'].includes(message.type)) {
                    get().fetchOrders(userAddress, 'pending').catch(() => { });
                    get().fetchOrders(userAddress, 'history').catch(() => { });
                }

            } catch (err) {
                console.error("Failed to parse portfolio notification:", err);
            }
        };

        socket.onclose = () => {
            console.log("📴 Portfolio real-time disconnected");
            set({ ws: null });

            // Reconnect logic
            const currentWallet = userAddress; // Capture current address
            if (currentWallet) {
                const attempt = (realtimeAttemptsByWallet.get(key) ?? 0) + 1;
                realtimeAttemptsByWallet.set(key, attempt);
                if (attempt > MAX_REALTIME_ATTEMPTS) {
                    console.warn('Portfolio realtime: giving up after repeated failures', { wallet: currentWallet, attempts: attempt });
                    return;
                }

                const delayMs = Math.min(30_000, 1000 * (2 ** (attempt - 1)));
                console.log(`🔄 Reconnecting portfolio real-time in ${Math.round(delayMs / 1000)}s...`);
                setTimeout(() => {
                    // Check if we are still on the same wallet before reconnecting
                    const latestWallet = userAddress;
                    if (latestWallet === currentWallet) {
                        get().connectRealtime(latestWallet);
                    }
                }, delayMs);
            }
        };

        socket.onerror = () => {
            // Don't spam console with opaque Event objects. Close socket to drive retry via onclose.
            console.warn("Portfolio real-time error");
            try { socket.close(); } catch { }
        };

        set({ ws: socket });
    },

    disconnectRealtime: () => {
        const { ws } = get();
        if (ws) {
            ws.close();
            set({ ws: null });
        }
    },

    clearStore: () => {
        set({
            positions: [],
            summary: null,
            localTPSL: {},
            openOrders: [],
            orderHistory: [],
            tradeHistory: [],
            history: [],
            fundingHistory: [],
            isLoading: false,
            error: null
        });
    },

    fetchPositions: async (userAddress: string) => {
        const fetchId = get().lastFetchId + 1;
        set({ lastFetchId: fetchId });

        // Only set isLoading if we don't have positions and summary yet (initial load)
        if (get().positions.length === 0 && !get().summary) {
            set({ isLoading: true, error: null });
        }
        try {
            // Use deduplication to prevent concurrent duplicate requests
            const TRADING_EXCHANGE = import.meta.env.VITE_TRADING_EXCHANGE || 'simulation';
            const isSimulation = TRADING_EXCHANGE.toLowerCase() === 'simulation';

            const [positionsResult, vaultBalances] = await Promise.all([
                fetchWithDedup(`positions:${userAddress}`, () => orderService.getPositions(userAddress)),
                !isSimulation
                    ? fetchWithDedup(`vault:${userAddress}`, () => onchainService.getVaultBalances(userAddress).catch(() => null))
                    : Promise.resolve(null)
            ]);

            // If a newer fetch has started, discard this one
            if (get().lastFetchId !== fetchId) return;

            // Default Summary if Vault fails
            let summary: AccountSummary = {
                account_value: 0,
                total_margin_used: 0,
                free_collateral: 0,
                margin_usage: 0,
                leverage: 0
            };

            // SIMULATION MODE: Use backend summary (ledger-based)
            // HYBRID/ONCHAIN MODE: Use vault balances as source of truth
            if (isSimulation && positionsResult.success && positionsResult.summary) {
                console.log("DEBUG: Using Simulation Ledger Summary", positionsResult.summary);
                summary = positionsResult.summary;
            } else if (vaultBalances) {
                console.log("DEBUG: Using Vault Balances as Source of Truth", summary);
                summary = {
                    account_value: vaultBalances.trading,
                    free_collateral: vaultBalances.available,
                    total_margin_used: vaultBalances.reserved,
                    margin_usage: vaultBalances.trading > 0 ? (vaultBalances.reserved / vaultBalances.trading) * 100 : 0,
                    leverage: 0 // Will be calc below if positions exist
                };
            } else if (positionsResult.success && positionsResult.summary) {
                console.log("DEBUG: Fallback to Backend Summary", positionsResult.summary);
                summary = positionsResult.summary;
            }

            // Process Positions
            if (positionsResult.success) {
                const currentLocalTPSL = get().localTPSL;
                const mergedPositions = positionsResult.positions.map(p => ({
                    ...p,
                    tp: currentLocalTPSL[p.id]?.tp ?? currentLocalTPSL[p.symbol]?.tp ?? p.tp,
                    sl: currentLocalTPSL[p.id]?.sl ?? currentLocalTPSL[p.symbol]?.sl ?? p.sl
                })).filter(p => Math.abs(p.size) > 1e-8);

                // Calculate leverage from positions if not provided in summary
                if (mergedPositions.length > 0 && summary.leverage === 0) {
                    const totalMargin = mergedPositions.reduce((sum, p) => sum + (p.margin_used || 0), 0);
                    const totalValue = mergedPositions.reduce((sum, p) => sum + ((p.size || 0) * (p.entry_price || 0)), 0);
                    summary.leverage = totalMargin > 0 ? totalValue / totalMargin : 0;
                    summary.margin_usage = summary.account_value > 0 ? (totalMargin / summary.account_value) * 100 : 0;
                }

                set({
                    positions: mergedPositions,
                    summary: summary,
                    isLoading: false,
                    error: null
                });
            } else {
                console.warn("Backend Positions fetch failed, retaining old data.");
                set({
                    summary: summary,
                    isLoading: false
                });
            }

        } catch (error: any) {
            console.error("Critical error in fetchPositions (Silent Fail):", error);
            // set({ error: error.message, isLoading: false });
            set({ isLoading: false }); // Just stop loading, keep old data
        }
    },

    fetchOrders: async (userAddress: string, status?: string) => {
        // Only set isLoading if we don't have orders yet
        if (get().openOrders.length === 0 && get().orderHistory.length === 0) {
            set({ isLoading: true, error: null });
        }
        try {
            const result = await orderService.getOrders(userAddress, status);
            if (result.success) {
                // If a specific status was requested, we only update that specific list
                // logic: 'pending' -> openOrders, 'history' -> orderHistory
                if (status === 'pending') {
                    set({ openOrders: result.orders, isLoading: false });
                } else if (status === 'history') {
                    set({ orderHistory: result.orders, isLoading: false });
                } else {
                    // Full update: Separate open orders from history
                    const norm = (v: unknown) => String(v ?? '').trim().toLowerCase();
                    const openOrders = result.orders.filter(o => {
                        const st = norm((o as any)?.status);
                        return st === 'pending' || st === 'open' || st === 'confirmed';
                    });
                    const orderHistory = result.orders.filter(o => {
                        const st = norm((o as any)?.status);
                        return st !== 'pending' && st !== 'open' && st !== 'confirmed';
                    });

                    set({ openOrders, orderHistory, isLoading: false });
                }
            }
        } catch (error: any) {
            console.log("Failed to fetch orders (Backend likely down)");
            set({ isLoading: false });
            // Do NOT set global error, to avoid hiding Portfolio Value
        }
    },

    refreshAll: async (userAddress: string) => {
        // High Priority: Immediate UI Feedback for Positions/Orders
        await Promise.all([
            get().fetchPositions(userAddress),
            get().fetchOrders(userAddress, 'pending')
        ]);

        // Lower Priority: Sync history in background without blocking
        get().fetchOrders(userAddress, 'history').catch(() => { });
        get().fetchFundingHistory(userAddress).catch(() => { });
        get().fetchHistory(userAddress, get().historyTimeframe).catch(() => { });
        get().fetchTradeHistory(userAddress).catch(() => { });
    },

    fetchHistory: async (userAddress: string, timeframe: string = '1d') => {
        // Don't set global isLoading to avoid flickering entire UI for just chart update
        try {
            const result = await portfolioService.getPortfolioHistory(userAddress, timeframe as any);
            if (result && result.data) {
                set({ history: result.data });
            }
        } catch (error) {
            console.log("History fetch skipped (Backend likely down)");
            // Non-critical, don't set global error
        }
    },

    setHistoryTimeframe: (timeframe) => {
        set({ historyTimeframe: timeframe });
        const wallet = globalSyncWallet;
        if (wallet) {
            void get().fetchHistory(wallet, timeframe);
        }
    },

    fetchFundingHistory: async (userAddress: string, type?: 'Deposit' | 'Withdraw') => {
        // Only show loading if empty
        if (get().fundingHistory.length === 0) {
            set({ isLoading: true });
        }
        try {
            const result = await portfolioService.getFundingHistory(userAddress, type);
            if (result && result.data) {
                set({ fundingHistory: result.data, isLoading: false });
            }
        } catch (error) {
            console.warn("Failed to fetch funding history:", error);
            set({ fundingHistory: [], isLoading: false });
        }
    },

    fetchTradeHistory: async (userAddress: string) => {
        // Only show loading if empty
        if (get().tradeHistory.length === 0) {
            set({ isLoading: true });
        }
        try {
            const result = await portfolioService.getTradeHistory(userAddress);
            if (result && result.data) {
                // Enhance trade data with better direction labels
                const enhancedTrades = result.data.map((trade: any) => {
                    // Check if this is a close order (id starts with 'sim_close_' or 'close_')
                    const isCloseOrder = trade.id.startsWith('sim_close_') || trade.id.startsWith('close_');

                    // For close orders, prefix with "Close"
                    let displayDirection = trade.direction;
                    if (isCloseOrder) {
                        displayDirection = `Close ${trade.direction}`;
                    }

                    return {
                        ...trade,
                        displayDirection
                    };
                });

                set({ tradeHistory: enhancedTrades, isLoading: false });
            }
        } catch (error) {
            console.warn("Failed to fetch trade history:", error);
            set({ tradeHistory: [], isLoading: false });
        }
    },

    updateTPSL: async (
        userAddress: string,
        positionId: string,
        tp?: string,
        sl?: string,
        risk?: { size_tokens?: number | null; tp_limit_price?: number | null; sl_limit_price?: number | null }
    ) => {
        // Optimistic update
        set(state => {
            const currentEntry = state.localTPSL[positionId] || {};
            const newEntry = {
                tp: tp ?? currentEntry.tp,
                sl: sl ?? currentEntry.sl
            };
            const matchedPosition = state.positions.find(p => p.id === positionId || p.symbol === positionId);
            const symbolKey = matchedPosition?.symbol ?? positionId;

            return {
                localTPSL: {
                    ...state.localTPSL,
                    [positionId]: newEntry,
                    [symbolKey]: newEntry
                },
                positions: state.positions.map(p =>
                    (p.id === positionId || p.symbol === symbolKey)
                        ? { ...p, tp: newEntry.tp ?? p.tp, sl: newEntry.sl ?? p.sl }
                        : p
                )
            };
        });

        // Sync to backend
        try {
            const position = get().positions.find(p => p.id === positionId);
            // If position found, use its symbol. If not (maybe new order from OrderForm), assume positionId IS the symbol.
            const symbol = position ? position.symbol : positionId;

              await orderService.updateTPSL(userAddress, symbol, tp, sl, risk);

            // Sync TradingView visualization if we can resolve full setup levels.
            const matchedPosition = get().positions.find(p => p.id === positionId || p.symbol === symbol);
            const side = normalizeSide((matchedPosition as any)?.side);
            const entry =
                toPositiveNumber((matchedPosition as any)?.entry_price) ??
                toPositiveNumber((matchedPosition as any)?.entryPrice) ??
                toPositiveNumber((matchedPosition as any)?.mark_price) ??
                toPositiveNumber((matchedPosition as any)?.markPrice) ??
                toPositiveNumber(useMarketStore.getState().getPrice(symbol));
            const tpRaw = tp ?? (matchedPosition as any)?.tp;
            const slRaw = sl ?? (matchedPosition as any)?.sl;

            if (side && entry) {
                const tpPrice = resolveTriggerPrice(tpRaw, 'tp', side, entry);
                const slPrice = resolveTriggerPrice(slRaw, 'sl', side, entry);

                if (tpPrice && slPrice) {
                    await tradingViewCommandService.queueSetupTrade({
                        symbol,
                        side,
                        entry,
                        tp: tpPrice,
                        sl: slPrice,
                        validation: tpPrice,
                        invalidation: slPrice,
                        validation_note: 'TP hit zone',
                        invalidation_note: 'SL invalidation',
                    });
                }
            }
        } catch (error) {
            console.error("Failed to sync TP/SL to backend:", error);
        }
    },

    cancelOrder: async (userAddress: string, orderId: string) => {
        try {
            await orderService.cancelOrder(orderId, userAddress);
            get().refreshAll(userAddress);
        } catch (error) {
            console.error("Failed to cancel order:", error);
            throw error;
        }
    },

    cancelAllOrders: async (userAddress: string) => {
        try {
            const { openOrders } = get();
            if (openOrders.length === 0) return { cancelled: 0, failed: 0, skipped: 0 };

            const normStatus = (v: unknown) => String(v ?? '').trim().toLowerCase();
            const isCancellable = (st: string) => st === 'pending' || st === 'open' || st === 'confirmed';

            const cancellableOrders = openOrders.filter(o => isCancellable(normStatus((o as any)?.status)));
            const skipped = openOrders.length - cancellableOrders.length;

            let cancelled = 0;
            let failed = 0;

            // Sequential cancellation to avoid nonce collisions and gas fee spikes
            for (const order of cancellableOrders) {
                try {
                    await orderService.cancelOrder(order.id, userAddress);
                    cancelled += 1;
                } catch (e) {
                    failed += 1;
                }
                // Optional: small delay between txs?
                // await new Promise(r => setTimeout(r, 200));
            }

            get().refreshAll(userAddress);
            return { cancelled, failed, skipped };
        } catch (error) {
            console.error("Failed to cancel all orders:", error);
            throw error;
        }
    },

    updateMarkPrices: (prices: Record<string, any>) => {
        const { getPrice } = useMarketStore.getState();
        set(state => ({
            positions: state.positions.map(p => {
                const mark_price = getPrice(p.symbol) || parseFloat(prices[p.symbol]?.mark_price || prices[p.symbol]?.markPrice || prices[p.symbol]?.price || p.mark_price || p.entry_price || 0);

                if (mark_price > 0 && p.entry_price > 0) {
                    const isLong = p.side.toLowerCase() === 'long';
                    const diff = isLong ? mark_price - p.entry_price : p.entry_price - mark_price;

                    const sizeTokens = p.size;
                    const pnl = diff * sizeTokens;
                    const margin = p.margin_used || (p.entry_price * sizeTokens / (p.leverage || 1));
                    const pnlPercent = margin > 0 ? (pnl / margin) * 100 : (diff / p.entry_price) * 100;

                    return {
                        ...p,
                        mark_price,
                        unrealized_pnl: pnl,
                        unrealized_pnl_percent: pnlPercent
                    };
                } else if (mark_price > 0) {
                    return { ...p, mark_price };
                }
                return p;
            })
        }
        ));
    },

    startGlobalSync: (userAddress: string) => {
        if (!userAddress) return;

        const normalized = userAddress.toLowerCase();
        if (globalSyncWallet === normalized && globalSyncIntervalId) {
            // Ensure WS is connected even if it was dropped.
            if (!get().ws) get().connectRealtime(userAddress);
            return;
        }

        get().stopGlobalSync();
        globalSyncWallet = normalized;
        globalSyncTick = 0;

        // Warm everything once (do not depend on which tab/page is visible).
        get().fetchPositions(userAddress);
        get().fetchOrders(userAddress, 'pending').catch(() => { });
        get().fetchOrders(userAddress, 'history').catch(() => { });
        get().fetchTradeHistory(userAddress).catch(() => { });
        get().fetchFundingHistory(userAddress).catch(() => { });
        get().fetchHistory(userAddress, get().historyTimeframe).catch(() => { });
        get().connectRealtime(userAddress);

        // Fallback polling (WS is primary for positions/summary).
        // Increased interval to avoid rate limiting (30 req/min limit)
        globalSyncIntervalId = window.setInterval(() => {
            const wallet = globalSyncWallet;
            if (!wallet) return;
            globalSyncTick += 1;

            // Fast lanes: open positions + pending orders (every 30s)
            get().fetchPositions(wallet);
            get().fetchOrders(wallet, 'pending').catch(() => { });

            // Slow lanes: histories (every 120s = 4 ticks * 30s)
            if (globalSyncTick % 4 === 0) {
                get().fetchOrders(wallet, 'history').catch(() => { });
                get().fetchTradeHistory(wallet).catch(() => { });
            }
            // Very slow lanes: funding + portfolio history (every 240s = 8 ticks * 30s)
            if (globalSyncTick % 8 === 0) {
                get().fetchFundingHistory(wallet).catch(() => { });
                get().fetchHistory(wallet, get().historyTimeframe).catch(() => { });
            }
        }, 30_000); // Changed from 15s to 30s to reduce API calls
    },

    stopGlobalSync: () => {
        if (globalSyncIntervalId) {
            window.clearInterval(globalSyncIntervalId);
            globalSyncIntervalId = null;
        }
        globalSyncWallet = null;
        globalSyncTick = 0;
        get().disconnectRealtime();
    },
        }),
        {
            name: 'osmo_portfolio_store',
            version: 1,
            partialize: (s) => ({
                positions: s.positions,
                openOrders: s.openOrders,
                orderHistory: s.orderHistory,
                tradeHistory: s.tradeHistory,
                history: s.history,
                historyTimeframe: s.historyTimeframe,
                fundingHistory: s.fundingHistory,
                summary: s.summary,
                localTPSL: s.localTPSL,
            }),
        }
    )
);
