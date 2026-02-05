/**
 * Leaderboard API Service
 * Handles trader and agent leaderboard data fetching
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface TraderLeaderboardEntry {
    rank: number;
    trader: string;
    accountValue: number;
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

export type Timeframe = '24h' | '7d' | '30d' | 'all';

class LeaderboardService {
    private readonly baseUrl = `${API_URL}/api/leaderboard`;

    /**
     * Get trader leaderboard
     */
    async getTraderLeaderboard(
        timeframe: Timeframe = '24h',
        page: number = 1,
        limit: number = 20,
        aiOnly: boolean = false
    ): Promise<LeaderboardResponse<TraderLeaderboardEntry>> {
        const params = new URLSearchParams({
            timeframe,
            page: page.toString(),
            limit: limit.toString(),
            ai_only: aiOnly.toString()
        });

        const response = await fetch(`${this.baseUrl}/traders?${params.toString()}`);

        if (!response.ok) {
            throw new Error('Failed to fetch trader leaderboard');
        }

        return response.json();
    }

    /**
     * Get agent model leaderboard (global aggregation)
     */
    async getAgentLeaderboard(
        timeframe: Timeframe = '24h',
        page: number = 1,
        limit: number = 20
    ): Promise<LeaderboardResponse<AgentLeaderboardEntry>> {
        const params = new URLSearchParams({
            timeframe,
            page: page.toString(),
            limit: limit.toString()
        });

        const response = await fetch(`${this.baseUrl}/agents?${params.toString()}`);

        if (!response.ok) {
            throw new Error('Failed to fetch agent leaderboard');
        }

        return response.json();
    }

    /**
     * Manually refresh leaderboard snapshots
     */
    async refreshLeaderboard(): Promise<{ status: string; message: string }> {
        const response = await fetch(`${this.baseUrl}/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            throw new Error('Failed to refresh leaderboard');
        }

        return response.json();
    }
}

export const leaderboardService = new LeaderboardService();
