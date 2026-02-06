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

    getModels: async (searchQuery?: string): Promise<any[]> => {
        const params: any = {};
        if (searchQuery) params.search = searchQuery;
        const response = await axios.get(`${API_URL}/api/usage/models`, { params });
        return response.data;
    },

    getProviders: async (): Promise<string[]> => {
        const response = await axios.get(`${API_URL}/api/usage/providers`);
        return response.data;
    },

    getModelsByProvider: async (provider: string): Promise<any[]> => {
        const response = await axios.get(`${API_URL}/api/usage/models`, {
            params: { provider }
        });
        return response.data;
    },

    getLastUsedModels: async (userAddress: string, timeframe = 'all'): Promise<any[]> => {
        const response = await axios.get(`${API_URL}/api/usage/last-used/${userAddress}`, {
            params: { timeframe }
        });
        return response.data;
    },

    getEnabledModels: async (userAddress: string): Promise<string[]> => {
        const response = await axios.get(`${API_URL}/api/usage/models/enabled/${userAddress}`);
        return response.data;
    },

    saveEnabledModels: async (userAddress: string, models: string[]): Promise<void> => {
        await axios.post(`${API_URL}/api/usage/models/enabled/${userAddress}`, { models });
    },

    getDefaultEnabledModels: async (): Promise<string[]> => {
        const response = await axios.get(`${API_URL}/api/usage/models/enabled/default`);
        return response.data;
    },

    getEnabledAgents: async (userAddress: string): Promise<string[]> => {
        const response = await axios.get(`${API_URL}/api/usage/agents/enabled/${userAddress}`);
        return response.data;
    },

    saveEnabledAgents: async (userAddress: string, agents: string[]): Promise<void> => {
        await axios.post(`${API_URL}/api/usage/agents/enabled/${userAddress}`, { agents });
    },

    getDefaultEnabledAgents: async (): Promise<string[]> => {
        const response = await axios.get(`${API_URL}/api/usage/agents/enabled/default`);
        return response.data;
    }
};
