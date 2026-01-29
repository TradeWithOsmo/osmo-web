/**
 * Leaderboard Store - Zustand state management
 */

import { create } from 'zustand';
import { leaderboardService } from '../api/leaderboardService';
import type {
    TraderLeaderboardEntry,
    AgentLeaderboardEntry,
    Timeframe
} from '../api/leaderboardService';

interface LeaderboardState {
    // Trader Leaderboard
    traderData: TraderLeaderboardEntry[];
    traderPagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    } | null;

    // Agent Leaderboard
    agentData: AgentLeaderboardEntry[];
    agentPagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    } | null;

    // Loading states
    isLoadingTraders: boolean;
    isLoadingAgents: boolean;

    // Error states
    traderError: string | null;
    agentError: string | null;

    // Actions
    fetchTraderLeaderboard: (timeframe: Timeframe, page?: number, limit?: number, aiOnly?: boolean) => Promise<void>;
    fetchAgentLeaderboard: (timeframe: Timeframe, page?: number, limit?: number) => Promise<void>;
    refreshLeaderboard: () => Promise<void>;
}

export const useLeaderboardStore = create<LeaderboardState>((set) => ({
    // Initial state
    traderData: [],
    traderPagination: null,
    agentData: [],
    agentPagination: null,
    isLoadingTraders: false,
    isLoadingAgents: false,
    traderError: null,
    agentError: null,

    // Fetch trader leaderboard
    fetchTraderLeaderboard: async (timeframe: Timeframe, page = 1, limit = 20, aiOnly = false) => {
        set({ isLoadingTraders: true, traderError: null });

        try {
            const response = await leaderboardService.getTraderLeaderboard(timeframe, page, limit, aiOnly);

            set({
                traderData: response.data,
                traderPagination: response.pagination,
                isLoadingTraders: false
            });
        } catch (error: any) {
            console.error('Failed to fetch trader leaderboard:', error);
            set({
                traderError: error.message || 'Failed to load trader leaderboard',
                isLoadingTraders: false,
                traderData: [],
                traderPagination: null
            });
        }
    },

    // Fetch agent leaderboard
    fetchAgentLeaderboard: async (timeframe: Timeframe, page = 1, limit = 20) => {
        set({ isLoadingAgents: true, agentError: null });

        try {
            const response = await leaderboardService.getAgentLeaderboard(timeframe, page, limit);

            set({
                agentData: response.data,
                agentPagination: response.pagination,
                isLoadingAgents: false
            });
        } catch (error: any) {
            console.error('Failed to fetch agent leaderboard:', error);
            set({
                agentError: error.message || 'Failed to load agent leaderboard',
                isLoadingAgents: false,
                agentData: [],
                agentPagination: null
            });
        }
    },

    // Refresh leaderboard snapshots
    refreshLeaderboard: async () => {
        try {
            await leaderboardService.refreshLeaderboard();
            console.log('Leaderboard snapshots refreshed successfully');
        } catch (error: any) {
            console.error('Failed to refresh leaderboard:', error);
            throw error;
        }
    }
}));
