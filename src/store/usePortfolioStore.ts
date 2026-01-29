import { create } from 'zustand';
import { orderService, type PositionData, type OrderData, type AccountSummary } from '../api/orderService';

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
    summary: AccountSummary | null;
    isLoading: boolean;
    error: string | null;

    // Actions
    fetchPositions: (userAddress: string) => Promise<void>;
    fetchOrders: (userAddress: string, status?: string) => Promise<void>;
    refreshAll: (userAddress: string) => Promise<void>;
}

export const usePortfolioStore = create<PortfolioState>((set, get) => ({
    positions: [],
    openOrders: [],
    orderHistory: [],
    tradeHistory: [],
    summary: null,
    isLoading: false,
    error: null,

    fetchPositions: async (userAddress: string) => {
        set({ isLoading: true, error: null });
        try {
            const result = await orderService.getPositions(userAddress);
            if (result.success) {
                set({
                    positions: result.positions,
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
            get().fetchOrders(userAddress)
        ]);
    }
}));
