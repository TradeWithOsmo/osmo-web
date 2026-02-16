/**
 * Leaderboard Store - Zustand state management
 *
 * Goals:
 * - Data fetching started from root (App) via startGlobalSync()
 * - Tab/page switches shouldn't trigger duplicate fetch loops
 * - Keep leaderboard + win rate feeling realtime via background polling
 */

import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';

import { leaderboardService } from '../api/leaderboardService';
import type { TraderLeaderboardEntry, AgentLeaderboardEntry, Timeframe } from '../api/leaderboardService';

type LeaderboardTab = 'trader' | 'agent' | 'model';

let globalPollId: number | null = null;
let isSubscribed = false;

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface LeaderboardViewState {
  activeTab: LeaderboardTab;
  timeframe: Timeframe;
  page: number;
  limit: number;
}

interface LeaderboardState {
  view: LeaderboardViewState;

  traderData: TraderLeaderboardEntry[];
  traderPagination: Pagination | null;
  agentData: AgentLeaderboardEntry[];
  agentPagination: Pagination | null;

  isLoadingTraders: boolean;
  isLoadingAgents: boolean;
  traderError: string | null;
  agentError: string | null;

  lastTraderFetchedKey: string | null;
  lastTraderFetchedAt: number | null;
  lastAgentFetchedKey: string | null;
  lastAgentFetchedAt: number | null;

  setView: (next: Partial<LeaderboardViewState>) => void;

  fetchTraderLeaderboard: (timeframe: Timeframe, page?: number, limit?: number, aiOnly?: boolean, opts?: { background?: boolean }) => Promise<void>;
  fetchAgentLeaderboard: (timeframe: Timeframe, page?: number, limit?: number, opts?: { background?: boolean }) => Promise<void>;
  refreshLeaderboard: () => Promise<void>;

  ensureViewData: (opts?: { force?: boolean; background?: boolean }) => Promise<void>;
  startGlobalSync: () => void;
  stopGlobalSync: () => void;
}

const keyForTrader = (v: LeaderboardViewState) => {
  const aiOnly = v.activeTab === 'agent';
  return `traders:${v.timeframe}:${v.page}:${v.limit}:ai=${aiOnly}`;
};

const keyForAgentModels = (v: LeaderboardViewState) => {
  return `models:${v.timeframe}:${v.page}:${v.limit}`;
};

export const useLeaderboardStore = create<LeaderboardState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        view: {
          activeTab: 'trader',
          timeframe: 'all',
          page: 1,
          limit: 20,
        },

        traderData: [],
        traderPagination: null,
        agentData: [],
        agentPagination: null,

        isLoadingTraders: false,
        isLoadingAgents: false,
        traderError: null,
        agentError: null,

        lastTraderFetchedKey: null,
        lastTraderFetchedAt: null,
        lastAgentFetchedKey: null,
        lastAgentFetchedAt: null,

        setView: (next) => {
          set((s) => {
            const merged: LeaderboardViewState = { ...s.view, ...next };
            return { view: merged };
          });
        },

        fetchTraderLeaderboard: async (timeframe, page = 1, limit = 20, aiOnly = false, opts) => {
          const background = Boolean(opts?.background);
          if (!background) set({ isLoadingTraders: true, traderError: null });

          try {
            const response = await leaderboardService.getTraderLeaderboard(timeframe, page, limit, aiOnly);
            set({
              traderData: response.data,
              traderPagination: response.pagination,
              isLoadingTraders: false,
              lastTraderFetchedKey: `traders:${timeframe}:${page}:${limit}:ai=${aiOnly}`,
              lastTraderFetchedAt: Date.now(),
            });
          } catch (error: any) {
            console.error('Failed to fetch trader leaderboard:', error);
            set({
              traderError: error.message || 'Failed to load trader leaderboard',
              isLoadingTraders: false,
              traderData: [],
              traderPagination: null,
            });
          }
        },

        fetchAgentLeaderboard: async (timeframe, page = 1, limit = 20, opts) => {
          const background = Boolean(opts?.background);
          if (!background) set({ isLoadingAgents: true, agentError: null });

          try {
            const response = await leaderboardService.getAgentLeaderboard(timeframe, page, limit);
            set({
              agentData: response.data,
              agentPagination: response.pagination,
              isLoadingAgents: false,
              lastAgentFetchedKey: `models:${timeframe}:${page}:${limit}`,
              lastAgentFetchedAt: Date.now(),
            });
          } catch (error: any) {
            console.error('Failed to fetch agent leaderboard:', error);
            set({
              agentError: error.message || 'Failed to load agent leaderboard',
              isLoadingAgents: false,
              agentData: [],
              agentPagination: null,
            });
          }
        },

        refreshLeaderboard: async () => {
          await leaderboardService.refreshLeaderboard();
        },

        ensureViewData: async (opts) => {
          const force = Boolean(opts?.force);
          const background = Boolean(opts?.background);
          const view = get().view;

          if (view.activeTab === 'model') {
            const key = keyForAgentModels(view);
            if (!force && get().lastAgentFetchedKey === key) return;
            await get().fetchAgentLeaderboard(view.timeframe, view.page, view.limit, { background });
            return;
          }

          const key = keyForTrader(view);
          const aiOnly = view.activeTab === 'agent';
          if (!force && get().lastTraderFetchedKey === key) return;
          await get().fetchTraderLeaderboard(view.timeframe, view.page, view.limit, aiOnly, { background });
        },

        startGlobalSync: () => {
          if (!isSubscribed) {
            isSubscribed = true;
            // React to view changes (tab/timeframe/pagination) without putting fetch logic in pages.
            useLeaderboardStore.subscribe(
              (s) => s.view,
              () => {
                void useLeaderboardStore.getState().ensureViewData({ background: false });
              }
            );
          }

          if (globalPollId) return;

          // Warm immediately.
          void get().ensureViewData({ background: false });

          // Poll currently selected view for realtime-ish updates.
          globalPollId = window.setInterval(() => {
            void get().ensureViewData({ force: true, background: true });
          }, 20_000);
        },

        stopGlobalSync: () => {
          if (globalPollId) {
            window.clearInterval(globalPollId);
            globalPollId = null;
          }
        },
      }),
      {
        name: 'osmo_leaderboard_store',
        version: 1,
        partialize: (s) => ({
          view: s.view,
          traderData: s.traderData,
          traderPagination: s.traderPagination,
          agentData: s.agentData,
          agentPagination: s.agentPagination,
          lastTraderFetchedKey: s.lastTraderFetchedKey,
          lastTraderFetchedAt: s.lastTraderFetchedAt,
          lastAgentFetchedKey: s.lastAgentFetchedKey,
          lastAgentFetchedAt: s.lastAgentFetchedAt,
        }),
      }
    )
  )
);

