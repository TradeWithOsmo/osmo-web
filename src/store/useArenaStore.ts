import { create } from "zustand";
import { persist } from "zustand/middleware";

import { onchainService } from "../api/onchainService";
import {
  leaderboardService,
  type ArenaLeaderboardScope,
  type TraderLeaderboardEntry,
  type UserRankResponse,
} from "../api/leaderboardService";

type ArenaSide = "human" | "ai";
type ArenaLeaderboardView = ArenaSide | "overall";

export interface StoredPick {
  side: ArenaSide;
  pickedAtMs: number;
  lockUntilMs: number;
  wager: number;
  walletAddress: string;
}

const PICK_STORAGE_KEY = "osmo_arena_pick_v1";

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
  userRank: number | null;
  userRankMetrics: UserRankResponse | null;

  leaderboardSide: ArenaLeaderboardView;
  leaderboardPage: number;
  leaderboardLimit: number;
  leaderboardRows: TraderLeaderboardEntry[];
  leaderboardPagination: ArenaLeaderboardPagination | null;
  isLoadingLeaderboard: boolean;
  leaderboardError: string | null;
  lastLeaderboardFetchedAt: number | null;

  setLeaderboardParams: (
    params: Partial<
      Pick<
        ArenaState,
        "leaderboardSide" | "leaderboardPage" | "leaderboardLimit"
      >
    >,
  ) => void;

  hydratePickFromStorage: (walletAddress?: string | null) => void;
  fetchOnchain: (walletAddress: string) => Promise<void>;
  fetchLeaderboard: () => Promise<void>;
  fetchUserRank: (walletAddress: string, side: ArenaSide) => Promise<void>;

  startGlobalSync: (walletAddress?: string) => void;
  stopGlobalSync: () => void;
}

export const useArenaStore = create<ArenaState>()(
  persist(
    (set, get) => ({
      picked: null,
      userPoints: 0,
      userLockedPoints: 0,
      userRank: null,
      userRankMetrics: null,

      leaderboardSide: "human",
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

      hydratePickFromStorage: (walletAddress?: string | null) => {
        const normalizedWallet = walletAddress
          ? walletAddress.toLowerCase()
          : null;
        try {
          const raw = localStorage.getItem(PICK_STORAGE_KEY);
          if (!raw) {
            set({ picked: null });
            return;
          }

          const parsed = JSON.parse(raw) as Partial<StoredPick>;
          if (
            !parsed ||
            (parsed.side !== "human" && parsed.side !== "ai") ||
            typeof parsed.pickedAtMs !== "number"
          ) {
            localStorage.removeItem(PICK_STORAGE_KEY);
            set({ picked: null });
            return;
          }

          const EVENT_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
          const isExpired = Date.now() - parsed.pickedAtMs > EVENT_DURATION_MS;

          if (isExpired) {
            console.log("[ArenaStore] Clearing expired pick from localStorage");
            localStorage.removeItem(PICK_STORAGE_KEY);
            set({ picked: null });
            return;
          }

          // Pick must belong to the currently connected wallet.
          if (!normalizedWallet) {
            set({ picked: null });
            return;
          }

          const parsedWallet =
            typeof parsed.walletAddress === "string"
              ? parsed.walletAddress.toLowerCase()
              : null;
          if (!parsedWallet || parsedWallet !== normalizedWallet) {
            set({ picked: null });
            return;
          }

          set({
            picked: {
              side: parsed.side,
              pickedAtMs: parsed.pickedAtMs,
              lockUntilMs:
                typeof parsed.lockUntilMs === "number"
                  ? parsed.lockUntilMs
                  : parsed.pickedAtMs + EVENT_DURATION_MS,
              wager: typeof parsed.wager === "number" ? parsed.wager : 0,
              walletAddress: parsedWallet,
            },
          });
        } catch {
          set({ picked: null });
        }
      },

      fetchOnchain: async (walletAddress: string) => {
        if (!walletAddress) return;
        const normalizedWallet = walletAddress.toLowerCase();
        try {
          const onchainPick =
            await onchainService.getArenaUserPick(walletAddress);
          if (onchainPick && onchainPick.side) {
            const data: StoredPick = {
              side: onchainPick.side as ArenaSide,
              pickedAtMs: onchainPick.pickedAt * 1000,
              lockUntilMs: onchainPick.lockUntil * 1000,
              wager: onchainPick.wager,
              walletAddress: normalizedWallet,
            };
            localStorage.setItem(PICK_STORAGE_KEY, JSON.stringify(data));
            set({ picked: data });
          } else {
            localStorage.removeItem(PICK_STORAGE_KEY);
            set({ picked: null, userRank: null, userRankMetrics: null });
          }

          const rewards =
            await onchainService.getArenaPendingReward(walletAddress);
          const locked =
            await onchainService.getArenaLockedPoints(walletAddress);
          set({
            userPoints: Number.isFinite(rewards) ? rewards : 0,
            userLockedPoints: Number.isFinite(locked) ? locked : 0,
          });
        } catch (e) {
          console.error("[ArenaStore] Failed to fetch onchain arena data:", e);
        }
      },

      fetchLeaderboard: async () => {
        const { leaderboardSide, leaderboardPage, leaderboardLimit } = get();
        const seq = ++leaderboardReqSeq;

        console.log("[ArenaStore] Fetching leaderboard:", {
          side: leaderboardSide,
          page: leaderboardPage,
          limit: leaderboardLimit,
          seq,
        });

        set({ isLoadingLeaderboard: true, leaderboardError: null });
        try {
          const resp = await leaderboardService.getArenaLeaderboard(
            leaderboardSide as ArenaLeaderboardScope,
            leaderboardPage,
            leaderboardLimit,
          );

          console.log("[ArenaStore] Received response:", {
            seq,
            rowsReturned: resp.data?.length,
            pagination: resp.pagination,
          });

          if (seq !== leaderboardReqSeq) {
            console.log("[ArenaStore] Stale response, ignoring");
            return;
          }
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
            leaderboardError: e?.message || "Failed to load arena leaderboard",
          });
        }
      },

      fetchUserRank: async (walletAddress: string, side: ArenaSide) => {
        try {
          const rankData = await leaderboardService.getUserRank(
            walletAddress,
            side,
          );
          set({
            userRank: Number.isFinite(rankData.rank) ? rankData.rank : null,
            userRankMetrics: {
              rank: Number.isFinite(rankData.rank) ? rankData.rank : 0,
              pnl: Number.isFinite(rankData.pnl) ? rankData.pnl : 0,
              roi: Number.isFinite(rankData.roi) ? rankData.roi : 0,
              volume: Number.isFinite(rankData.volume) ? rankData.volume : 0,
            },
          });
        } catch (e) {
          console.error("[ArenaStore] Failed to fetch user rank:", e);
          set({ userRank: null, userRankMetrics: null });
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

        // Hydrate pick for active wallet only.
        get().hydratePickFromStorage(normalized);

        // On-chain sync is wallet-bound.
        if (!normalized) {
          if (onchainPollId) {
            window.clearInterval(onchainPollId);
            onchainPollId = null;
          }
          arenaWallet = null;
          set({
            picked: null,
            userRank: null,
            userRankMetrics: null,
            userPoints: 0,
            userLockedPoints: 0,
          });
          return;
        }

        if (arenaWallet === normalized && onchainPollId) return;

        if (onchainPollId) {
          window.clearInterval(onchainPollId);
          onchainPollId = null;
        }

        arenaWallet = normalized;
        set({
          userRank: null,
          userRankMetrics: null,
          userPoints: 0,
          userLockedPoints: 0,
        });
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
      name: "osmo_arena_store",
      partialize: (s) => ({
        picked: s.picked,
        userPoints: s.userPoints,
        userLockedPoints: s.userLockedPoints,
        userRank: s.userRank,
        userRankMetrics: s.userRankMetrics,
        leaderboardSide: s.leaderboardSide,
        leaderboardPage: s.leaderboardPage,
        leaderboardLimit: s.leaderboardLimit,
        leaderboardRows: s.leaderboardRows,
        leaderboardPagination: s.leaderboardPagination,
        lastLeaderboardFetchedAt: s.lastLeaderboardFetchedAt,
      }),
      version: 5,
      migrate: (persistedState: any, version) => {
        if (!persistedState) return persistedState;
        if (version < 5) {
          return {
            ...persistedState,
            picked: null,
            userPoints: 0,
            userLockedPoints: 0,
            userRank: null,
            userRankMetrics: null,
          };
        }
        return persistedState;
      },
    },
  ),
);
