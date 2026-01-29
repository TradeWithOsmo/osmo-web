import { create } from 'zustand';
import { type MarketData, marketService } from '../api/marketService';

interface MarketState {
    markets: MarketData[];
    selectedMarket: MarketData | null;
    isLoading: boolean;
    error: string | null;

    // Actions
    fetchMarkets: () => Promise<void>;
    setMarket: (symbol: string) => void;
    updateMarketData: (symbol: string, data: Partial<MarketData>) => void; // For real-time updates
    updatePrices: (prices: Record<string, any>) => void; // Bulk price updates
}

export const useMarketStore = create<MarketState>((set, get) => ({
    markets: [],
    selectedMarket: null,
    isLoading: false,
    error: null,

    fetchMarkets: async () => {
        set({ isLoading: true, error: null });
        try {
            const markets = await marketService.getMarkets();
            set({ markets, isLoading: false });

            // Set default market if none selected
            if (!get().selectedMarket && markets.length > 0) {
                // Prefer BTC-USD if available, else first one
                const defaultMarket = markets.find(m => m.symbol === 'BTC-USD') || markets[0];
                set({ selectedMarket: defaultMarket });
            }
        } catch (err) {
            set({ isLoading: false, error: 'Failed to load markets' });
        }
    },

    setMarket: (symbol: string) => {
        const market = get().markets.find(m => m.symbol === symbol);
        if (market) {
            set({ selectedMarket: market });
        }
    },

    updateMarketData: (symbol, data) => {
        set((state) => {
            const marketIndex = state.markets.findIndex(m => m.symbol === symbol);
            if (marketIndex === -1) return state;

            const updatedMarkets = [...state.markets];
            updatedMarkets[marketIndex] = { ...updatedMarkets[marketIndex], ...data };

            // Also update selectedMarket if it matches
            const updatedSelected = state.selectedMarket?.symbol === symbol
                ? { ...state.selectedMarket, ...data }
                : state.selectedMarket;

            return {
                markets: updatedMarkets,
                selectedMarket: updatedSelected
            };
        });
    },

    updatePrices: (prices) => {
        set((state) => {
            const updatedMarkets = state.markets.map(market => {
                const priceData = prices[market.symbol];
                if (priceData) {
                    return {
                        ...market,
                        price: priceData.price ? parseFloat(priceData.price) : market.price,
                        // Map socket (snake_case) to store (camelCase)
                        change24h: priceData.change_24h !== undefined ? priceData.change_24h : market.change24h,
                        change24hPercent: priceData.change_percent_24h !== undefined ? priceData.change_percent_24h : market.change24hPercent,
                        volume24h: priceData.volume_24h !== undefined ? priceData.volume_24h : market.volume24h,
                        high24h: priceData.high_24h !== undefined ? priceData.high_24h : market.high24h,
                        low24h: priceData.low_24h !== undefined ? priceData.low_24h : market.low24h,
                    };
                }
                return market;
            });

            // Update selectedMarket if its data changed
            let updatedSelected = state.selectedMarket;
            if (updatedSelected && prices[updatedSelected.symbol]) {
                const p = prices[updatedSelected.symbol];
                updatedSelected = {
                    ...updatedSelected,
                    price: p.price ? parseFloat(p.price) : updatedSelected.price,
                    change24h: p.change_24h !== undefined ? p.change_24h : updatedSelected.change24h,
                    change24hPercent: p.change_percent_24h !== undefined ? p.change_percent_24h : updatedSelected.change24hPercent,
                    volume24h: p.volume_24h !== undefined ? p.volume_24h : updatedSelected.volume24h,
                    high24h: p.high_24h !== undefined ? p.high_24h : updatedSelected.high24h,
                    low24h: p.low_24h !== undefined ? p.low_24h : updatedSelected.low24h,
                };
            }

            return {
                markets: updatedMarkets,
                selectedMarket: updatedSelected
            };
        });
    }
}));
