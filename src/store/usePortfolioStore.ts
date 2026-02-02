import { create } from 'zustand';
import { orderService, type PositionData, type OrderData, type AccountSummary } from '../api/orderService';
import { portfolioService, type PortfolioHistoryPoint } from '../api/portfolioService';

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
    summary: AccountSummary | null;
    isLoading: boolean;
    error: string | null;

    // Actions
    // Actions
    fetchPositions: (userAddress: string) => Promise<void>;
    fetchOrders: (userAddress: string, status?: string) => Promise<void>;
    refreshAll: (userAddress: string) => Promise<void>;
    fetchHistory: (userAddress: string, timeframe?: string) => Promise<void>;
    updateTPSL: (userAddress: string, positionId: string, tp?: string, sl?: string) => Promise<void>;

    // Internal
    localTPSL: Record<string, { tp?: string; sl?: string }>;
}

export const usePortfolioStore = create<PortfolioState>((set, get) => ({
    summary: null,
    isLoading: false,
    error: null,
    openOrders: [],
    orderHistory: [],
    tradeHistory: [],
    history: [],

    // Initial State
    positions: [],

    // State for local TP/SL persistence
    localTPSL: {},

    fetchPositions: async (userAddress: string) => {
        set({ isLoading: true, error: null });
        try {
            const result = await orderService.getPositions(userAddress);
            if (result.success) {
                // Merge with local TP/SL data
                const currentLocalTPSL = get().localTPSL;
                const mergedPositions = result.positions.map(p => ({
                    ...p,
                    tp: currentLocalTPSL[p.id]?.tp ?? p.tp,
                    sl: currentLocalTPSL[p.id]?.sl ?? p.sl
                }));

                set({
                    positions: mergedPositions,
                    summary: result.summary,
                    isLoading: false
                });
            }
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
        }
    },

    fetchOrders: async (userAddress: string, status?: string) => {
        set({ isLoading: true, error: null });
        try {
            const result = await orderService.getOrders(userAddress, status);
            if (result.success) {
                // Separate open orders from history
                const openOrders = result.orders.filter(o => o.status === 'pending');
                const orderHistory = result.orders.filter(o => o.status !== 'pending');

                set({ openOrders, orderHistory, isLoading: false });
            }
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
        }
    },

    refreshAll: async (userAddress: string) => {
        await Promise.all([
            get().fetchPositions(userAddress),
            get().fetchPositions(userAddress),
            get().fetchOrders(userAddress),
            get().fetchHistory(userAddress) // Add history fetch to refresh
        ]);
    },

    fetchHistory: async (userAddress: string, timeframe: string = '1d') => {
        // Don't set global isLoading to avoid flickering entire UI for just chart update
        try {
            const result = await portfolioService.getPortfolioHistory(userAddress, timeframe as any);
            if (result && result.data) {
                set({ history: result.data });
            }
        } catch (error) {
            console.error("Failed to fetch history:", error);
            // Non-critical, don't set global error
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
    }
}));
