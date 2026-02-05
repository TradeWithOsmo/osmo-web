import { create } from 'zustand';
import { useMarketStore } from './useMarketStore';
import { onchainService } from '../api/onchainService';
import { orderService, type PositionData, type OrderData, type AccountSummary } from '../api/orderService';
import { portfolioService, type PortfolioHistoryPoint, type FundingHistoryData } from '../api/portfolioService';

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
    fetchFundingHistory: (userAddress: string, type?: 'Deposit' | 'Withdraw') => Promise<void>; // New
    fetchTradeHistory: (userAddress: string) => Promise<void>; // New
    updateTPSL: (userAddress: string, positionId: string, tp?: string, sl?: string) => Promise<void>;
    updateMarkPrices: (prices: Record<string, any>) => void;
    cancelOrder: (userAddress: string, orderId: string) => Promise<void>;
    cancelAllOrders: (userAddress: string) => Promise<void>;
    clearStore: () => void;

    // Real-time
    connectRealtime: (userAddress: string) => void;
    disconnectRealtime: () => void;

    // Internal
    localTPSL: Record<string, { tp?: string; sl?: string }>;
    lastFetchId: number;
    ws: WebSocket | null;
}

export const usePortfolioStore = create<PortfolioState>((set, get) => ({
    summary: null,
    isLoading: false,
    error: null,
    openOrders: [],
    orderHistory: [],
    tradeHistory: [],
    history: [],
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
        const wsUrl = API_URL.replace('http', 'ws') + `/ws/notifications/${userAddress}`;

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
                        tp: currentLocalTPSL[p.id]?.tp ?? p.tp,
                        sl: currentLocalTPSL[p.id]?.sl ?? p.sl
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
                console.log("🔄 Reconnecting portfolio real-time in 3s...");
                setTimeout(() => {
                    // Check if we are still on the same wallet before reconnecting
                    const latestWallet = userAddress;
                    if (latestWallet === currentWallet) {
                        get().connectRealtime(latestWallet);
                    }
                }, 3000);
            }
        };

        socket.onerror = (err) => {
            console.error("Portfolio real-time error:", err);
            // socket.close() will be called automatically, triggering onclose
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
            // Hybrid Fetch:
            // 1. Positions from Backend (Simulation Engine)
            // 2. Balances from Contract (Vault Source of Truth)
            const [positionsResult, vaultBalances] = await Promise.all([
                orderService.getPositions(userAddress),
                onchainService.getVaultBalances(userAddress).catch(() => null)
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

            // Priority 1: Real Vault Balances (The Source of Truth for on-chain collateral)
            // Priority 2: Backend Summary (Fallback or for Simulation/CEX views)
            if (vaultBalances) {
                summary = {
                    account_value: vaultBalances.trading,
                    free_collateral: vaultBalances.available,
                    total_margin_used: vaultBalances.reserved,
                    margin_usage: vaultBalances.trading > 0 ? (vaultBalances.reserved / vaultBalances.trading) * 100 : 0,
                    leverage: 0 // Will be calc below if positions exist
                };
                console.log("DEBUG: Using Vault Balances as Source of Truth", summary);
            } else if (positionsResult.success && positionsResult.summary) {
                console.log("DEBUG: Fallback to Backend Summary", positionsResult.summary);
                summary = positionsResult.summary;
            }

            // Process Positions
            if (positionsResult.success) {
                const currentLocalTPSL = get().localTPSL;
                const mergedPositions = positionsResult.positions.map(p => ({
                    ...p,
                    tp: currentLocalTPSL[p.id]?.tp ?? p.tp,
                    sl: currentLocalTPSL[p.id]?.sl ?? p.sl
                })).filter(p => Math.abs(p.size) > 1e-8);

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
                    const openOrders = result.orders.filter(o =>
                        o.status === 'pending' ||
                        o.status === 'open' ||
                        o.status === 'confirmed'
                    );
                    const orderHistory = result.orders.filter(o =>
                        o.status !== 'pending' &&
                        o.status !== 'open' &&
                        o.status !== 'confirmed'
                    );

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
        get().fetchHistory(userAddress).catch(() => { });
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
                set({ tradeHistory: result.data, isLoading: false });
            }
        } catch (error) {
            console.warn("Failed to fetch trade history:", error);
            set({ tradeHistory: [], isLoading: false });
        }
    },

    updateTPSL: async (userAddress: string, positionId: string, tp?: string, sl?: string) => {
        // Optimistic update
        set(state => {
            const currentEntry = state.localTPSL[positionId] || {};
            const newEntry = {
                tp: tp ?? currentEntry.tp,
                sl: sl ?? currentEntry.sl
            };

            return {
                localTPSL: {
                    ...state.localTPSL,
                    [positionId]: newEntry
                },
                positions: state.positions.map(p =>
                    p.id === positionId ? { ...p, tp: newEntry.tp ?? p.tp, sl: newEntry.sl ?? p.sl } : p
                )
            };
        });

        // Sync to backend
        try {
            const position = get().positions.find(p => p.id === positionId);
            // If position found, use its symbol. If not (maybe new order from OrderForm), assume positionId IS the symbol.
            const symbol = position ? position.symbol : positionId;

            await orderService.updateTPSL(userAddress, symbol, tp, sl);
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
            if (openOrders.length === 0) return;

            // Sequential cancellation to avoid nonce collisions and gas fee spikes
            for (const order of openOrders) {
                await orderService.cancelOrder(order.id, userAddress);
                // Optional: small delay between txs?
                // await new Promise(r => setTimeout(r, 200));
            }

            get().refreshAll(userAddress);
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
    }
}));
