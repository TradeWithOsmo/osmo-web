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
    source: 'hyperliquid' | 'ostium';
    category: string;
    maxLeverage?: number;
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
            console.log("🔍 Fetching markets from:", `${API_URL}/connectors/hyperliquid/prices`, `${API_URL}/connectors/ostium/prices`);

            const [hlResponse, ostResponse] = await Promise.allSettled([
                axios.get(`${API_URL}/connectors/hyperliquid/prices`, { timeout: 30000 }),
                axios.get(`${API_URL}/connectors/ostium/prices`, { timeout: 30000 })
            ]);

            let markets: MarketData[] = [];

            if (hlResponse.status === 'fulfilled') {
                console.log("✅ Hyperliquid response:", hlResponse.value.status, "Markets:", hlResponse.value.data.length);
                // Transform Hyperliquid data
                markets = markets.concat(hlResponse.value.data.map((item: any) => ({
                    symbol: item.symbol, // Backend already returns "BTC-USD"
                    price: parseFloat(item.price) || 0,
                    change24h: parseFloat(item.change_24h || 0),
                    change24hPercent: parseFloat(item.change_percent_24h || 0),
                    high24h: parseFloat(item.high_24h || 0),
                    low24h: parseFloat(item.low_24h || 0),
                    volume24h: parseFloat(item.volume_24h || 0),
                    source: 'hyperliquid' as const,
                    category: item.category || 'Crypto' // Use backend category
                })));
                console.log(`📊 Loaded ${markets.length} Hyperliquid markets`);
            } else {
                console.error("❌ Hyperliquid fetch failed:", hlResponse.reason?.message || hlResponse.reason);
            }

            if (ostResponse.status === 'fulfilled') {
                console.log("✅ Ostium response:", ostResponse.value.status, "Markets:", ostResponse.value.data.length);
                // Create set of existing symbols (from Hyperliquid) to avoid duplicates
                const existingSymbols = new Set(markets.map(m => m.symbol));

                const ostiumMarkets = ostResponse.value.data.map((item: any) => {
                    return {
                        symbol: item.symbol,
                        price: parseFloat(item.price) || 0,
                        change24h: parseFloat(item.change_24h || 0),
                        change24hPercent: parseFloat(item.change_percent_24h || 0),
                        high24h: parseFloat(item.high_24h || 0),
                        low24h: parseFloat(item.low_24h || 0),
                        volume24h: parseFloat(item.volume_24h || 0),
                        source: 'ostium' as const,
                        category: item.category || 'Forex' // Use backend category
                    };
                }).filter((m: any) => m.category !== 'Crypto' && !existingSymbols.has(m.symbol));
                markets = markets.concat(ostiumMarkets);
                console.log(`📊 Loaded ${ostiumMarkets.length} Ostium markets (Total: ${markets.length})`);
            } else {
                console.error("❌ Ostium fetch failed:", ostResponse.reason?.message || ostResponse.reason);
            }

            if (markets.length === 0) {
                console.warn("⚠️ No markets loaded! Both endpoints failed or returned empty data.");
            }

            return markets;

        } catch (error) {
            console.error("❌ Failed to fetch markets:", error);
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
