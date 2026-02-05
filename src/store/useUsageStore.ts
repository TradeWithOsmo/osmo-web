import { create } from 'zustand';
import { usageService, type UsageStats, type UsageLogItem, type ChartDataPoint } from '../api/usageService';
import { onchainService } from '../api/onchainService';

interface UsageState {
    stats: UsageStats;
    history: UsageLogItem[];
    chartData: ChartDataPoint[];
    isLoading: boolean;
    error: string | null;

    fetchStats: (address: string) => Promise<void>;
    fetchHistory: (address: string) => Promise<void>;
    fetchChartData: (address: string, timeframe: string) => Promise<void>;
}

export const useUsageStore = create<UsageState>((set) => ({
    stats: {
        total_cost: 0,
        total_tokens: 0,
        request_count: 0,
        credit_balance: 0
    },
    history: [],
    chartData: [],
    isLoading: false,
    error: null,

    fetchStats: async (address: string) => {
        set({ isLoading: true, error: null });
        try {
            const [backendData, onchainBalances] = await Promise.all([
                usageService.getStats(address),
                onchainService.getVaultBalances(address).catch(() => null)
            ]);

            set({
                stats: {
                    ...backendData,
                    credit_balance: onchainBalances ? onchainBalances.ai : backendData.credit_balance
                },
                isLoading: false
            });
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
        }
    },

    fetchHistory: async (address: string) => {
        set({ isLoading: true, error: null });
        try {
            const data = await usageService.getHistory(address);
            set({ history: data, isLoading: false });
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
        }
    },

    fetchChartData: async (address: string, timeframe: string) => {
        try {
            const data = await usageService.getChartData(address, timeframe);
            set({ chartData: data });
        } catch (error: any) {
            console.error("Failed to fetch chart data", error);
        }
    }
}));
