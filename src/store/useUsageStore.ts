import { create } from 'zustand';
import { usageService, type UsageStats, type UsageLogItem, type ChartDataPoint } from '../api/usageService';
import { onchainService } from '../api/onchainService';

interface UsageState {
    stats: UsageStats;
    history: UsageLogItem[];
    chartData: ChartDataPoint[];
    enabledModels: Record<string, boolean>;
    enabledAgents: Record<string, boolean>;
    isLoading: boolean;
    error: string | null;

    fetchStats: (address: string) => Promise<void>;
    fetchHistory: (address: string) => Promise<void>;
    fetchChartData: (address: string, timeframe: string) => Promise<void>;
    fetchEnabledModels: (address?: string) => Promise<void>;
    toggleModel: (id: string, address?: string) => Promise<void>;
    fetchEnabledAgents: (address?: string) => Promise<void>;
    toggleAgent: (id: string, address?: string) => Promise<void>;
    agentGroups: Record<string, string[]>;
    addAgentGroup: (name: string) => void;
    moveAgentToGroup: (agentId: string, fromGroup: string, toGroup: string) => void;
}

export const useUsageStore = create<UsageState>((set, get) => ({
    stats: {
        total_cost: 0,
        total_tokens: 0,
        request_count: 0,
        credit_balance: 0
    },
    history: [],
    chartData: [],
    enabledModels: {},
    enabledAgents: {},
    agentGroups: (() => {
        const saved = localStorage.getItem('autos_agent_groups');
        if (!saved) return {};
        const parsed = JSON.parse(saved);
        // Explicitly remove "Agent" if it was just a default or created by older logic
        if (parsed["Agent"]) {
            delete parsed["Agent"];
            localStorage.setItem('autos_agent_groups', JSON.stringify(parsed));
        }
        return parsed;
    })(),
    isLoading: false,
    error: null,

    addAgentGroup: (name: string) => {
        const { agentGroups } = get();
        if (name.toLowerCase() === 'agent') return; // Reserved/disallowed to avoid confusion now
        if (agentGroups[name]) return;
        const nextState = { ...agentGroups, [name]: [] };
        set({ agentGroups: nextState });
        localStorage.setItem('autos_agent_groups', JSON.stringify(nextState));
    },

    moveAgentToGroup: (agentId: string, fromGroup: string, toGroup: string) => {
        const { agentGroups } = get();
        const nextState = { ...agentGroups };

        // 1. Always remove from the old group if it exists
        if (fromGroup !== 'ungrouped' && nextState[fromGroup]) {
            nextState[fromGroup] = nextState[fromGroup].filter(id => id !== agentId);
        }

        // 2. Add to new group if it's NOT 'ungrouped'
        if (toGroup !== 'ungrouped') {
            if (!nextState[toGroup]) {
                nextState[toGroup] = [];
            }
            if (!nextState[toGroup].includes(agentId)) {
                nextState[toGroup] = [...nextState[toGroup], agentId];
            }
        }

        set({ agentGroups: nextState });
        localStorage.setItem('autos_agent_groups', JSON.stringify(nextState));
    },

    fetchEnabledModels: async (address?: string) => {
        // 1. Try LocalStorage
        const saved = localStorage.getItem('autos_enabled_models');
        if (saved) {
            set({ enabledModels: JSON.parse(saved) });
        }

        // 2. Try Backend
        try {
            let enabledList: string[] = [];
            if (address) {
                enabledList = await usageService.getEnabledModels(address);
            }

            if (enabledList.length === 0) {
                enabledList = await usageService.getDefaultEnabledModels();
            }

            if (enabledList.length > 0) {
                const newMap: Record<string, boolean> = {};
                enabledList.forEach(id => newMap[id] = true);
                set({ enabledModels: newMap });
                localStorage.setItem('autos_enabled_models', JSON.stringify(newMap));
            }
        } catch (e) {
            console.error("Failed to fetch enabled models", e);
        }
    },

    toggleModel: async (id: string, address?: string) => {
        const { enabledModels } = get();
        const nextState = { ...enabledModels, [id]: !enabledModels[id] };

        set({ enabledModels: nextState });
        localStorage.setItem('autos_enabled_models', JSON.stringify(nextState));

        if (address) {
            const list = Object.keys(nextState).filter(k => nextState[k]);
            usageService.saveEnabledModels(address, list).catch(console.error);
        }
    },

    fetchEnabledAgents: async (address?: string) => {
        const saved = localStorage.getItem('autos_enabled_agents');
        if (saved) {
            set({ enabledAgents: JSON.parse(saved) });
        }

        try {
            let enabledList: string[] = [];
            if (address) {
                enabledList = await usageService.getEnabledAgents(address);
            }

            if (enabledList.length === 0) {
                enabledList = await usageService.getDefaultEnabledAgents();
            }

            const newMap: Record<string, boolean> = {};
            enabledList.forEach(id => newMap[id] = true);
            set({ enabledAgents: newMap });
            localStorage.setItem('autos_enabled_agents', JSON.stringify(newMap));
        } catch (e) {
            console.error("Failed to fetch enabled agents", e);
        }
    },

    toggleAgent: async (id: string, address?: string) => {
        const { enabledAgents } = get();
        const nextState = { ...enabledAgents, [id]: !enabledAgents[id] };

        set({ enabledAgents: nextState });
        localStorage.setItem('autos_enabled_agents', JSON.stringify(nextState));

        if (address) {
            const list = Object.keys(nextState).filter(k => nextState[k]);
            usageService.saveEnabledAgents(address, list).catch(console.error);
        }
    },

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
