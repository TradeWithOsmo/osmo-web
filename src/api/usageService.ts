import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface UsageStats {
    total_cost: number;
    total_tokens: number;
    request_count: number;
    credit_balance: number;
}

export interface UsageLogItem {
    id: number;
    timestamp: string;
    model: string;
    tokens: string;
    cost: string;
    speed: string;
    finish: string;
}

export interface ChartDataPoint {
    date: string;
    cost: number;
    tokens: number;
    requests: number;
}

export const usageService = {
    getStats: async (userAddress: string): Promise<UsageStats> => {
        const response = await axios.get(`${API_URL}/api/usage/stats/${userAddress}`);
        return response.data;
    },

    getHistory: async (userAddress: string, limit = 50, offset = 0): Promise<UsageLogItem[]> => {
        const response = await axios.get(`${API_URL}/api/usage/history/${userAddress}`, {
            params: { limit, offset }
        });
        return response.data;
    },

    getChartData: async (userAddress: string, timeframe = '30D'): Promise<ChartDataPoint[]> => {
        const response = await axios.get(`${API_URL}/api/usage/chart/${userAddress}`, {
            params: { timeframe }
        });
        return response.data;
    },

    getModels: async (): Promise<any[]> => {
        const response = await axios.get(`${API_URL}/api/usage/models`);
        return response.data;
    },

    getLastUsedModels: async (userAddress: string, timeframe = 'all'): Promise<any[]> => {
        const response = await axios.get(`${API_URL}/api/usage/last-used/${userAddress}`, {
            params: { timeframe }
        });
        return response.data;
    }
};
