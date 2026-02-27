import axios from 'axios';

// Base URL for the backend API
// Keep `VITE_API_URL` as the origin (e.g. http://localhost:8000) and append `/api` here.
const API_ORIGIN = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const API_URL = `${API_ORIGIN}/api`;

export interface MarketData {
    symbol: string;
    price: number;
    change24h: number; // Absolute change
    change24hPercent: number; // Percentage change
    high24h: number;
    low24h: number;
    volume24h: number; // USD volume
    fundingRate?: number;
    source: string;
    category: string;
    subCategory?: string;
    maxLeverage?: number;
    canonical?: boolean;
}

export interface Trade {
    id: string;
    price: number;
    size: number;
    side: 'buy' | 'sell';
    time: number;
}

export interface OrderBookLevel {
    price: number;
    size: number;
    total?: number; // Cumulative size
}

export interface OrderBookData {
    bids: OrderBookLevel[];
    asks: OrderBookLevel[];
}

export const marketService = {
    // Fetch all available markets/tickers
    getMarkets: async (): Promise<MarketData[]> => {
        try {
            console.log("🔍 Fetching unified markets from:", `${API_URL}/markets`);

            const response = await axios.get(`${API_URL}/markets`, { timeout: 30000, params: { canonical_only: false } });

            if (response.status !== 200 || !response.data || !response.data.markets) {
                console.warn("⚠️ No markets loaded or invalid response!", response);
                return [];
            }

            const rawMarkets = response.data.markets;
            console.log(`✅ Unified markets response. Loaded ${rawMarkets.length} markets total.`);

            const markets: MarketData[] = rawMarkets.map((item: any) => ({
                symbol: item.symbol,
                price: parseFloat(item.price) || 0,
                change24h: parseFloat(item.change_24h || 0),
                change24hPercent: parseFloat(item.change_percent_24h || item.change24hPercent || 0),
                high24h: parseFloat(item.high_24h || item.high24h || 0),
                low24h: parseFloat(item.low_24h || item.low24h || 0),
                volume24h: parseFloat(item.volume_24h || item.volume24h || 0),
                fundingRate: item.funding_rate !== undefined ? parseFloat(item.funding_rate) : (item.fundingRate !== undefined ? parseFloat(item.fundingRate) : undefined),
                source: item.source || 'hyperliquid',
                category: item.category || 'Crypto',
                subCategory: item.subCategory || item.sub_category,
                maxLeverage: item.maxLeverage ? parseFloat(item.maxLeverage) : undefined,
                canonical: item.canonical || false
            }));

            return markets;

        } catch (error) {
            console.error("❌ Failed to fetch aggregated markets:", error);
            return [];
        }
    },

    // Get historical candles for TradingView
    getHistory: async (symbol: string, resolution: string, from: number, to: number, source: string) => {
        const response = await axios.get(`${API_URL}/history`, {
            params: { symbol, resolution, from, to, source }
        });
        return response.data;
    }
};
