import { create } from 'zustand';
import { type MarketData, marketService } from '../api/marketService';

const normalizeSymbol = (value: string): string =>
    String(value || '')
        .trim()
        .toUpperCase()
        .replace(/[\/_]/g, '-')
        .replace(/\s+/g, '')
        .replace(/-+/g, '-');

const buildSymbolCandidates = (raw: string): string[] => {
    const normalized = normalizeSymbol(raw);
    if (!normalized) return [];

    const candidates = new Set<string>();
    const add = (value?: string | null) => {
        const next = normalizeSymbol(String(value || ''));
        if (next) candidates.add(next);
    };

    add(normalized);
    add(normalized.replace(/-/g, ''));

    const parts = normalized.split('-').filter(Boolean);
    if (parts.length === 2) {
        const [base, quote] = parts;
        add(`${base}/${quote}`);
        add(`${base}${quote}`);

        if (quote === 'USDT') {
            add(`${base}-USD`);
            add(`${base}/USD`);
            add(`${base}USD`);
        }

        if (quote === 'USD') {
            add(`${base}-USDT`);
            add(`${base}/USDT`);
            add(`${base}USDT`);
        }
    } else if (parts.length === 1) {
        const compact = parts[0];
        if (compact.endsWith('USDT') && compact.length > 4) {
            const base = compact.slice(0, -4);
            add(`${base}-USDT`);
            add(`${base}-USD`);
            add(`${base}/USDT`);
            add(`${base}/USD`);
        }
        if (compact.endsWith('USD') && compact.length > 3) {
            const base = compact.slice(0, -3);
            add(`${base}-USD`);
            add(`${base}-USDT`);
            add(`${base}/USD`);
            add(`${base}/USDT`);
        }
    }

    return Array.from(candidates);
};

const findMarketBySymbol = (markets: MarketData[], rawSymbol: string): MarketData | undefined => {
    const candidateSet = new Set(buildSymbolCandidates(rawSymbol));
    if (candidateSet.size === 0) return undefined;

    return markets.find((market) => {
        const marketSymbol = normalizeSymbol(market.symbol);
        if (candidateSet.has(marketSymbol)) return true;
        return candidateSet.has(marketSymbol.replace(/-/g, ''));
    });
};

interface MarketState {
    markets: MarketData[];
    selectedMarket: MarketData | null;
    pendingLimitPrice: { symbol: string; price: number } | null;
    isLoading: boolean;
    error: string | null;

    // Actions
    fetchMarkets: () => Promise<void>;
    setMarket: (symbol: string, source?: 'hyperliquid' | 'ostium') => void;
    updateMarketData: (symbol: string, data: Partial<MarketData>) => void; // For real-time updates
    updatePrices: (prices: Record<string, any>) => void; // Bulk price updates
    getPrice: (symbol: string) => number; // Helper to get latest price
    setPendingLimitPrice: (symbol: string, price: number) => void;
    clearPendingLimitPrice: () => void;
}

export const useMarketStore = create<MarketState>((set, get) => ({
    markets: [],
    selectedMarket: null,
    pendingLimitPrice: null,
    isLoading: false,
    error: null,

    fetchMarkets: async () => {
        set({ isLoading: true, error: null });
        try {
            const marketsRaw = await marketService.getMarkets();

            // Deduplicate: Last one wins or just keep first.
            // Using Map to ensure unique source:symbol
            const uniqueMap = new Map<string, MarketData>();
            marketsRaw.forEach(m => {
                const key = `${m.source || 'hyperliquid'}:${m.symbol}`;
                if (!uniqueMap.has(key)) {
                    uniqueMap.set(key, m);
                }
            });

            const markets = Array.from(uniqueMap.values());
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

    setMarket: (symbol: string, source?: 'hyperliquid' | 'ostium') => {
        const market = get().markets.find((candidate) => {
            if (source && candidate.source !== source) return false;
            const found = findMarketBySymbol([candidate], symbol);
            return Boolean(found);
        }) || findMarketBySymbol(get().markets, symbol);
        if (market) {
            set({ selectedMarket: market, pendingLimitPrice: null });
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
                        maxLeverage: priceData.maxLeverage !== undefined ? priceData.maxLeverage : market.maxLeverage,
                        category: priceData.category || market.category,
                    };
                }
                return market;
            });

            const existingSymbols = new Set(updatedMarkets.map(m => m.symbol));
            Object.entries(prices || {}).forEach(([symbol, payload]: [string, any]) => {
                if (!symbol || existingSymbols.has(symbol)) return;
                const parsedPrice = payload?.price !== undefined ? parseFloat(payload.price) : NaN;
                if (Number.isNaN(parsedPrice)) return;
                updatedMarkets.push({
                    symbol,
                    price: parsedPrice,
                    change24h: payload?.change_24h ?? 0,
                    change24hPercent: payload?.change_percent_24h ?? 0,
                    high24h: payload?.high_24h ?? parsedPrice,
                    low24h: payload?.low_24h ?? parsedPrice,
                    volume24h: payload?.volume_24h ?? 0,
                    source: payload?.source === 'ostium' ? 'ostium' : 'hyperliquid',
                    category: payload?.category || 'Crypto',
                    maxLeverage: payload?.maxLeverage,
                });
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
                    maxLeverage: p.maxLeverage !== undefined ? p.maxLeverage : updatedSelected.maxLeverage,
                    category: p.category || updatedSelected.category,
                };
            }

            return {
                markets: updatedMarkets,
                selectedMarket: updatedSelected
            };
        });
    },

    getPrice: (symbol: string) => {
        const market = findMarketBySymbol(get().markets, symbol);
        return market?.price || 0;
    },

    setPendingLimitPrice: (symbol: string, price: number) => {
        set({ pendingLimitPrice: { symbol, price } });
    },

    clearPendingLimitPrice: () => {
        set({ pendingLimitPrice: null });
    },
}));
