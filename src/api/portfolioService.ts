const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface PortfolioHistoryPoint {
    timestamp: string;
    value: number;
    unrealized_pnl?: number;
    realized_pnl?: number;
}

export interface PortfolioMetrics {
    portfolio_value: number;
    cash_balance: number;
    position_value: number;
    unrealized_pnl: number;
    realized_pnl: number;
}

export type PortfolioTimeframe = '1d' | '7d' | '30d' | 'all';

export const portfolioService = {
    async getPortfolioHistory(
        userAddress: string,
        timeframe: PortfolioTimeframe = '1d',
        limit: number = 500
    ): Promise<{ data: PortfolioHistoryPoint[] }> {
        const params = new URLSearchParams({
            timeframe,
            limit: limit.toString()
        });

        const response = await fetch(
            `${API_URL}/api/portfolio/${userAddress}/history?${params.toString()}`
        );

        if (!response.ok) {
            throw new Error('Failed to fetch portfolio history');
        }

        return response.json();
    },

    async getCurrentPortfolioValue(userAddress: string): Promise<PortfolioMetrics> {
        const response = await fetch(
            `${API_URL}/api/portfolio/${userAddress}/current`
        );

        if (!response.ok) {
            throw new Error('Failed to fetch current portfolio value');
        }

        return response.json();
    },

    async createSnapshot(userAddress: string): Promise<{ status: string; message: string }> {
        const response = await fetch(
            `${API_URL}/api/portfolio/${userAddress}/snapshot`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            }
        );

        if (!response.ok) {
            throw new Error('Failed to create portfolio snapshot');
        }

        return response.json();
    }
};
