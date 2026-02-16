import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { onchainService } from '../api/onchainService';
import { leaderboardService, type Timeframe, type TraderLeaderboardEntry } from '../api/leaderboardService';

type ArenaSide = 'human' | 'ai';

export interface StoredPick {
  side: ArenaSide;
  pickedAtMs: number;
  lockUntilMs: number;
  wager: number;
}

const PICK_STORAGE_KEY = 'osmo_arena_pick_v1';

let onchainPollId: number | null = null;
let leaderboardPollId: number | null = null;
let arenaWallet: string | null = null;
let leaderboardReqSeq = 0;

interface ArenaLeaderboardPagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface ArenaState {
  picked: StoredPick | null;
  userPoints: number;
  userLockedPoints: number;

  leaderboardSide: ArenaSide;
  leaderboardPage: number;
  leaderboardLimit: number;
  leaderboardRows: TraderLeaderboardEntry[];
  leaderboardPagination: ArenaLeaderboardPagination | null;
  isLoadingLeaderboard: boolean;
  leaderboardError: string | null;
  lastLeaderboardFetchedAt: number | null;

  setLeaderboardParams: (params: Partial<Pick<ArenaState, 'leaderboardSide' | 'leaderboardPage' | 'leaderboardLimit'>>) => void;

  hydratePickFromStorage: () => void;
  fetchOnchain: (walletAddress: string) => Promise<void>;
  fetchLeaderboard: () => Promise<void>;

  startGlobalSync: (walletAddress?: string) => void;
  stopGlobalSync: () => void;
}

export const useArenaStore = create<ArenaState>()(
  persist(
    (set, get) => ({
      picked: null,
      userPoints: 0,
      userLockedPoints: 0,

      leaderboardSide: 'human',
      leaderboardPage: 1,
      leaderboardLimit: 20,
      leaderboardRows: [],
      leaderboardPagination: null,
      isLoadingLeaderboard: false,
      leaderboardError: null,
      lastLeaderboardFetchedAt: null,

      setLeaderboardParams: (params) => {
        set(params as any);
        // React immediately to UI changes (pagination/side/limit) without putting fetch logic in pages.
        void get().fetchLeaderboard();
      },

      hydratePickFromStorage: () => {
        try {
          const raw = localStorage.getItem(PICK_STORAGE_KEY);
          if (!raw) return;
          const parsed = JSON.parse(raw) as StoredPick;
          if (!parsed || !parsed.side) return;
          set({ picked: parsed });
        } catch {
          // ignore
        }
      },

      fetchOnchain: async (walletAddress: string) => {
        if (!walletAddress) return;
        try {
          const onchainPick = await onchainService.getArenaUserPick(walletAddress);
          if (onchainPick && onchainPick.side) {
            const data: StoredPick = {
              side: onchainPick.side as ArenaSide,
              pickedAtMs: onchainPick.pickedAt * 1000,
              lockUntilMs: onchainPick.lockUntil * 1000,
              wager: onchainPick.wager,
            };
            localStorage.setItem(PICK_STORAGE_KEY, JSON.stringify(data));
            set({ picked: data });
          }

          const rewards = await onchainService.getArenaPendingReward(walletAddress);
          const locked = await onchainService.getArenaLockedPoints(walletAddress);
          set({
            userPoints: Number.isFinite(rewards) ? rewards : 0,
            userLockedPoints: Number.isFinite(locked) ? locked : 0,
          });
        } catch (e) {
          console.error('[ArenaStore] Failed to fetch onchain arena data:', e);
        }
      },

      fetchLeaderboard: async () => {
        const { leaderboardSide, leaderboardPage, leaderboardLimit } = get();
        const seq = ++leaderboardReqSeq;

        set({ isLoadingLeaderboard: true, leaderboardError: null });
        try {
          const timeframe: Timeframe = '7d';
          const aiOnly = leaderboardSide === 'ai';
          const resp = await leaderboardService.getTraderLeaderboard(timeframe, leaderboardPage, leaderboardLimit, aiOnly);
          if (seq !== leaderboardReqSeq) return;
          set({
            leaderboardRows: resp.data || [],
            leaderboardPagination: resp.pagination || null,
            isLoadingLeaderboard: false,
            lastLeaderboardFetchedAt: Date.now(),
          });
        } catch (e: any) {
          if (seq !== leaderboardReqSeq) return;
          set({
            leaderboardRows: [],
            leaderboardPagination: null,
            isLoadingLeaderboard: false,
            leaderboardError: e?.message || 'Failed to load arena leaderboard',
          });
        }
      },

      startGlobalSync: (walletAddress?: string) => {
        const normalized = walletAddress ? walletAddress.toLowerCase() : null;

        // Leaderboard is public; keep it warm/realtime even without a connected wallet.
        if (!leaderboardPollId) {
          void get().fetchLeaderboard();
          leaderboardPollId = window.setInterval(() => {
            void get().fetchLeaderboard();
          }, 20_000);
        }

        // Hydrate any previous pick immediately (even if disconnected).
        get().hydratePickFromStorage();

        // On-chain sync is wallet-bound.
        if (!normalized) {
          if (onchainPollId) {
            window.clearInterval(onchainPollId);
            onchainPollId = null;
          }
          arenaWallet = null;
          return;
        }

        if (arenaWallet === normalized && onchainPollId) return;

        if (onchainPollId) {
          window.clearInterval(onchainPollId);
          onchainPollId = null;
        }

        arenaWallet = normalized;
        void get().fetchOnchain(normalized);

        onchainPollId = window.setInterval(() => {
          const w = arenaWallet;
          if (!w) return;
          void get().fetchOnchain(w);
        }, 10_000);
      },

      stopGlobalSync: () => {
        if (onchainPollId) {
          window.clearInterval(onchainPollId);
          onchainPollId = null;
        }
        if (leaderboardPollId) {
          window.clearInterval(leaderboardPollId);
          leaderboardPollId = null;
        }
        arenaWallet = null;
      },
    }),
    {
      name: 'osmo_arena_store',
      partialize: (s) => ({
        picked: s.picked,
        userPoints: s.userPoints,
        userLockedPoints: s.userLockedPoints,
        leaderboardSide: s.leaderboardSide,
        leaderboardPage: s.leaderboardPage,
        leaderboardLimit: s.leaderboardLimit,
        leaderboardRows: s.leaderboardRows,
        leaderboardPagination: s.leaderboardPagination,
        lastLeaderboardFetchedAt: s.lastLeaderboardFetchedAt,
      }),
      version: 1,
    }
  )
);
