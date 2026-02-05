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

export interface FundingHistoryData {
    id: string;
    type: 'Deposit' | 'Withdraw';
    asset: string;
    amount: number;
    txHash: string;
    status: 'Completed' | 'Pending' | 'Failed';
    timestamp: string;
}

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
    },

    // Funding History
    async getFundingHistory(userAddress: string, type?: 'Deposit' | 'Withdraw'): Promise<{ data: FundingHistoryData[] }> {
        const params = new URLSearchParams();
        if (type) params.append('type', type);

        try {
            const response = await fetch(
                `${API_URL}/api/portfolio/${userAddress}/funding?${params.toString()}`
            );

            if (!response.ok) {
                console.warn("Failed to fetch funding history");
                return { data: [] };
            }

            return response.json();
        } catch (error) {
            console.error("Error fetching funding history:", error);
            // Return empty array on error to prevent UI crash
            return { data: [] };
        }
    },

    // Trade History
    async getTradeHistory(userAddress: string): Promise<{ data: any[] }> {
        try {
            const response = await fetch(
                `${API_URL}/api/portfolio/${userAddress}/trades`
            );

            if (!response.ok) {
                console.warn("Failed to fetch trade history");
                return { data: [] };
            }

            return response.json();
        } catch (error) {
            console.error("Error fetching trade history:", error);
            return { data: [] };
        }
    }
};
