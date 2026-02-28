import { create } from 'zustand';
import { type MarketData, marketService } from '../api/marketService';
const DEBUG_MARKETS = String(import.meta.env.VITE_DEBUG_API || '').toLowerCase() === 'true';
const MARKETS_REFRESH_COOLDOWN_MS = 20000;
let inFlightMarketsFetch: Promise<void> | null = null;
let lastMarketsFetchAt = 0;

export const normalizeSymbol = (value: string): string =>
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
    allMarkets: MarketData[];
    selectedMarket: MarketData | null;
    pendingLimitPrice: { symbol: string; price: number } | null;
    isLoading: boolean;
    error: string | null;
    wsStatus: 'connected' | 'connecting' | 'disconnected';
    setWsStatus: (status: 'connected' | 'connecting' | 'disconnected') => void;

    // Actions
    fetchMarkets: (force?: boolean) => Promise<void>;
    setMarket: (symbol: string, source?: string) => void;
    updateMarketData: (symbol: string, data: Partial<MarketData>) => void; // For real-time updates
    updateMarketDataBySource: (symbol: string, source: string, data: Partial<MarketData>) => void;
    updatePrices: (prices: Record<string, any>) => void; // Bulk price updates
    getPrice: (symbol: string) => number; // Helper to get latest price
    setPendingLimitPrice: (symbol: string, price: number) => void;
    clearPendingLimitPrice: () => void;
}

export const useMarketStore = create<MarketState>((set, get) => ({
    markets: [],
    allMarkets: [],
    selectedMarket: null,
    pendingLimitPrice: null,
    isLoading: false,
    error: null,
    wsStatus: 'connecting',

    setWsStatus: (status) => set({ wsStatus: status }),

    fetchMarkets: async (force = false) => {
        const hasData = get().markets.length > 0;
        const now = Date.now();
        if (!force && hasData && now - lastMarketsFetchAt < MARKETS_REFRESH_COOLDOWN_MS) {
            return;
        }
        if (inFlightMarketsFetch) return inFlightMarketsFetch;

        const run = (async () => {
            if (hasData) {
                set({ error: null });
            } else {
                set({ isLoading: true, error: null });
            }
            try {
                const marketsRaw = await marketService.getMarkets();

            // Group items by normalized symbol. Prefer canonical ones.
            const uniqueMap = new Map<string, MarketData>();

            marketsRaw.forEach(m => {
                const key = normalizeSymbol(m.symbol);
                const existing = uniqueMap.get(key);

                // Set if new, or if this one is canonical and existing wasn't
                if (!existing || (m.canonical && !existing.canonical)) {
                    uniqueMap.set(key, m);
                }
            });

            const markets = Array.from(uniqueMap.values());
            if (DEBUG_MARKETS) {
                console.log("!!! STORE DEBUG !!! Total Raw:", marketsRaw.length, "Unique Symbols:", markets.length);

                // Log some non-canonical ones to verify they are present
                const nonCanonical = markets.filter(m => !m.canonical);
                console.log("!!! STORE DEBUG !!! Non-Canonical Count:", nonCanonical.length);
                if (nonCanonical.length > 0) {
                    console.log("!!! STORE DEBUG !!! Sample Non-Canonical:", nonCanonical.slice(0, 5).map(m => `${m.symbol} (${m.source})`));
                }
            }
                set((state) => ({
                    markets,
                    allMarkets: marketsRaw,
                    isLoading: false,
                    error: null,
                    // Keep selected market stable if still present by source+symbol, fallback by symbol variants.
                    selectedMarket: state.selectedMarket
                        ? (
                            marketsRaw.find(m =>
                                m.symbol === state.selectedMarket!.symbol &&
                                (m.source || '').toLowerCase() === (state.selectedMarket!.source || '').toLowerCase()
                            ) || findMarketBySymbol(marketsRaw, state.selectedMarket.symbol) || state.selectedMarket
                        )
                        : state.selectedMarket
                }));

            // Set default market if none selected
                if (!get().selectedMarket && markets.length > 0) {
                // Prefer BTC-USD if available, else first one
                    const defaultMarket = markets.find(m => m.symbol === 'BTC-USD') || markets[0];
                    set({ selectedMarket: defaultMarket });
                }
                lastMarketsFetchAt = Date.now();
            } catch (err) {
                set({ isLoading: false, error: 'Failed to load markets' });
            } finally {
                inFlightMarketsFetch = null;
            }
        })();

        inFlightMarketsFetch = run;
        return run;
    },

    setMarket: (symbol: string, source?: string) => {
        const market = get().allMarkets.find((candidate) => {
            if (source && candidate.source?.toLowerCase() !== source.toLowerCase()) return false;
            const found = findMarketBySymbol([candidate], symbol);
            return Boolean(found);
        }) || findMarketBySymbol(get().allMarkets, symbol);
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

    updateMarketDataBySource: (symbol, source, data) => {
        const normalizedSource = String(source || '').toLowerCase();
        set((state) => {
            const updateRow = (row: MarketData): MarketData => {
                const rowSource = String(row.source || '').toLowerCase();
                if (row.symbol !== symbol || rowSource !== normalizedSource) return row;
                return { ...row, ...data };
            };

            const updatedMarkets = state.markets.map(updateRow);
            const updatedAllMarkets = state.allMarkets.map(updateRow);

            let updatedSelected = state.selectedMarket;
            if (
                updatedSelected &&
                updatedSelected.symbol === symbol &&
                String(updatedSelected.source || '').toLowerCase() === normalizedSource
            ) {
                updatedSelected = { ...updatedSelected, ...data };
            }

            return {
                markets: updatedMarkets,
                allMarkets: updatedAllMarkets,
                selectedMarket: updatedSelected,
            };
        });
    },

    updatePrices: (prices) => {
        set((state) => {
            const toSource = (value: any) => String(value || '').toLowerCase();
            const updatedMarkets = state.markets.map(market => {
                const priceData = prices[market.symbol];
                if (priceData) {
                    // Prevent cross-exchange overwrite for same symbol (e.g. ZRO-USD on vest vs hyperliquid).
                    const payloadSource = toSource(priceData.source);
                    const marketSource = toSource(market.source || 'hyperliquid');
                    if (payloadSource && payloadSource !== marketSource) {
                        return market;
                    }

                    return {
                        ...market,
                        price: priceData.price ? parseFloat(priceData.price) : market.price,
                        // Map socket (snake_case) to store (camelCase)
                        change24h: priceData.change_24h !== undefined ? priceData.change_24h : market.change24h,
                        change24hPercent: priceData.change_percent_24h !== undefined ? priceData.change_percent_24h : market.change24hPercent,
                        volume24h: priceData.volume_24h !== undefined ? priceData.volume_24h : market.volume24h,
                        fundingRate: priceData.funding_rate !== undefined ? parseFloat(priceData.funding_rate) : (priceData.fundingRate !== undefined ? parseFloat(priceData.fundingRate) : market.fundingRate),
                        high24h: priceData.high_24h !== undefined ? priceData.high_24h : market.high24h,
                        low24h: priceData.low_24h !== undefined ? priceData.low_24h : market.low24h,
                        maxLeverage: priceData.maxLeverage !== undefined ? priceData.maxLeverage : market.maxLeverage,
                        category: priceData.category || market.category,
                        subCategory: priceData.subCategory || priceData.sub_category || market.subCategory,
                        canonical: priceData.canonical !== undefined ? priceData.canonical : market.canonical,
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
                    fundingRate: payload?.funding_rate !== undefined ? parseFloat(payload.funding_rate) : (payload?.fundingRate !== undefined ? parseFloat(payload.fundingRate) : undefined),
                    source: payload?.source || 'hyperliquid',
                    category: payload?.category || 'Crypto',
                    subCategory: payload?.subCategory || payload?.sub_category,
                    maxLeverage: payload?.maxLeverage,
                    canonical: payload?.canonical || false,
                });
            });

            // Update selectedMarket if its data changed
            let updatedSelected = state.selectedMarket;
            if (updatedSelected && prices[updatedSelected.symbol]) {
                const p = prices[updatedSelected.symbol];
                const payloadSource = toSource(p?.source);
                const selectedSource = toSource(updatedSelected.source || 'hyperliquid');
                if (payloadSource && payloadSource !== selectedSource) {
                    return {
                        markets: updatedMarkets,
                        selectedMarket: updatedSelected
                    };
                }
                updatedSelected = {
                    ...updatedSelected,
                    price: p.price ? parseFloat(p.price) : updatedSelected.price,
                    change24h: p.change_24h !== undefined ? p.change_24h : updatedSelected.change24h,
                    change24hPercent: p.change_percent_24h !== undefined ? p.change_percent_24h : updatedSelected.change24hPercent,
                    volume24h: p.volume_24h !== undefined ? p.volume_24h : updatedSelected.volume24h,
                    fundingRate: p.funding_rate !== undefined ? parseFloat(p.funding_rate) : (p.fundingRate !== undefined ? parseFloat(p.fundingRate) : updatedSelected.fundingRate),
                    high24h: p.high_24h !== undefined ? p.high_24h : updatedSelected.high24h,
                    low24h: p.low_24h !== undefined ? p.low_24h : updatedSelected.low24h,
                    maxLeverage: p.maxLeverage !== undefined ? p.maxLeverage : updatedSelected.maxLeverage,
                    category: p.category || updatedSelected.category,
                    subCategory: p.subCategory || p.sub_category || updatedSelected.subCategory,
                    canonical: p.canonical !== undefined ? p.canonical : updatedSelected.canonical,
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
