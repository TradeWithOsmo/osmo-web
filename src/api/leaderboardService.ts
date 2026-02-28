/**
 * Leaderboard API Service
 * Handles trader and agent leaderboard data fetching
 */

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export interface TraderLeaderboardEntry {
  rank: number;
  trader: string;
  accountValue: number;
  totalPoints?: number;
  pnl: number;
  roi: number;
  volume: number;
  tradeCount: number;
  winRate: number;
  agentModel?: string | null;
}

export interface AgentLeaderboardEntry {
  rank: number;
  agentName: string;
  totalUsers: number;
  accountValue: number;
  pnl: number;
  roi: number;
  volume: number;
  tradeCount: number;
  winRate: number;
}

export interface LeaderboardResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export type Timeframe = "24h" | "7d" | "30d" | "all";
export type ArenaLeaderboardScope = "human" | "ai" | "overall";

export interface UserRankResponse {
  rank: number;
  pnl: number;
  roi: number;
  volume: number;
}

class LeaderboardService {
  private readonly arenaBaseUrl = `${API_URL}/api/arena`;

  async getUserRank(
    address: string,
    side: "human" | "ai" = "human",
  ): Promise<UserRankResponse> {
    const params = new URLSearchParams({ side });
    const response = await fetch(
      `${this.arenaBaseUrl}/rank/${address}?${params.toString()}`,
    );

    if (!response.ok) {
      throw new Error("Failed to fetch user rank");
    }

    return response.json();
  }

  async getArenaLeaderboard(
    scope: ArenaLeaderboardScope = "human",
    page: number = 1,
    limit: number = 20,
  ): Promise<LeaderboardResponse<TraderLeaderboardEntry>> {
    console.log("[LeaderboardService] Fetching arena leaderboard:", {
      scope,
      page,
      limit,
    });

    if (scope === "overall") {
      const overallParams = new URLSearchParams({
        page: page.toString(),
        limit: Math.min(Math.max(limit, 1), 1000).toString(),
      });

      const overallResp = await fetch(
        `${this.arenaBaseUrl}/leaderboard/overall?${overallParams.toString()}`,
      );
      if (!overallResp.ok) {
        throw new Error("Failed to fetch overall arena leaderboard");
      }

      const overallData = await overallResp.json();
      const mappedOverall: TraderLeaderboardEntry[] = (
        overallData.data || []
      ).map((item: any) => ({
        rank: item.rank || 0,
        trader: item.user_address || "Unknown",
        accountValue: 1000 + (item.pnl || 0),
        totalPoints: item.total_points || 0,
        pnl: item.pnl || 0,
        roi: item.roi || 0,
        volume: item.volume || 0,
        tradeCount: Number(item.trade_count ?? 0),
        winRate: Number(item.win_rate ?? 0),
        agentModel: null,
      }));

      return {
        data: mappedOverall,
        pagination: overallData.pagination || {
          page,
          limit,
          total: mappedOverall.length,
          pages: 1,
        },
      };
    }

    const params = new URLSearchParams({
      side: scope,
      page: page.toString(),
      limit: limit.toString(),
    });

    const response = await fetch(
      `${this.arenaBaseUrl}/leaderboard?${params.toString()}`,
    );

    if (!response.ok) {
      throw new Error("Failed to fetch arena leaderboard");
    }

    const data = await response.json();
    console.log("[LeaderboardService] Response:", data);

    const mappedData: TraderLeaderboardEntry[] = (data.data || []).map(
      (item: any) => ({
        rank: item.rank || 0,
        trader: item.user_address || "Unknown",
        accountValue: 1000 + (item.pnl || 0),
        pnl: item.pnl || 0,
        roi: item.roi || 0,
        volume: item.volume || 0,
        tradeCount: Number(item.trade_count ?? 0),
        winRate: Number(item.win_rate ?? 0),
        agentModel: null,
      }),
    );

    return {
      data: mappedData,
      pagination: data.pagination || {
        page,
        limit,
        total: mappedData.length,
        pages: 1,
      },
    };
  }

  async getTraderLeaderboard(
    _timeframe: Timeframe = "7d",
    page: number = 1,
    limit: number = 20,
    aiOnly: boolean = false,
  ): Promise<LeaderboardResponse<TraderLeaderboardEntry>> {
    const scope: ArenaLeaderboardScope = aiOnly ? "ai" : "human";
    return this.getArenaLeaderboard(scope, page, limit);
  }

  /**
   * Get agent model leaderboard (global aggregation)
   */
  async getAgentLeaderboard(
    timeframe: Timeframe = "24h",
    page: number = 1,
    limit: number = 20,
  ): Promise<LeaderboardResponse<AgentLeaderboardEntry>> {
    const params = new URLSearchParams({
      timeframe,
      page: page.toString(),
      limit: limit.toString(),
    });

    // Primary path (arena namespace), with fallback to legacy leaderboard namespace.
    const primary = await fetch(
      `${this.arenaBaseUrl}/agents?${params.toString()}`,
    );
    if (primary.ok) {
      return primary.json();
    }

    const fallback = await fetch(
      `${API_URL}/api/leaderboard/agents?${params.toString()}`,
    );
    if (fallback.ok) {
      return fallback.json();
    }

    throw new Error("Failed to fetch agent leaderboard");
  }

  /**
   * Manually refresh leaderboard snapshots
   */
  async refreshLeaderboard(): Promise<{ status: string; message: string }> {
    const response = await fetch(`${this.arenaBaseUrl}/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      throw new Error("Failed to refresh leaderboard");
    }

    return response.json();
  }
}

export const leaderboardService = new LeaderboardService();
