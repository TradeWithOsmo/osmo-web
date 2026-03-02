import { create } from 'zustand';

interface TokenInfo {
    symbol: string;
    logoURI: string;
}

interface TokenListState {
    tokenMap: Record<string, string>; // symbol -> logoURI
    isLoading: boolean;
    fetchTokenList: () => Promise<void>;
}

const STORE_CACHE_KEY = 'osmo_token_cache_v1';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function loadStoredMap(): Record<string, string> | null {
    try {
        const raw = localStorage.getItem(STORE_CACHE_KEY);
        if (!raw) return null;
        const { map, ts } = JSON.parse(raw);
        if (Date.now() - ts > CACHE_TTL_MS) return null;
        return map;
    } catch {
        return null;
    }
}

function saveStoredMap(map: Record<string, string>) {
    try {
        localStorage.setItem(STORE_CACHE_KEY, JSON.stringify({ map, ts: Date.now() }));
    } catch { /* quota exceeded, ignore */ }
}

export const useTokenListStore = create<TokenListState>((set, get) => ({
    tokenMap: {},
    isLoading: false,
    fetchTokenList: async () => {
        if (Object.keys(get().tokenMap).length > 0) return;

        // Try localStorage cache first
        const cached = loadStoredMap();
        if (cached) {
            set({ tokenMap: cached });
            return;
        }

        set({ isLoading: true });
        try {
            const lists = [
                'https://tokens.uniswap.org/',
                'https://tokens.coingecko.com/uniswap/all.json',
            ];

            const coinpaprikaFetch = fetch('https://api.coinpaprika.com/v1/coins?show_active=true')
                .then(r => r.json())
                .catch(() => null);

            const [tokenResults, paprikaCoins] = await Promise.all([
                Promise.allSettled(lists.map(url => fetch(url).then(r => r.json()))),
                coinpaprikaFetch,
            ]);

            const newMap: Record<string, string> = {};

            // Uniswap + CoinGecko token lists
            tokenResults.forEach(result => {
                if (result.status === 'fulfilled' && result.value?.tokens) {
                    result.value.tokens.forEach((token: TokenInfo) => {
                        const sym = token.symbol.toUpperCase();
                        if (!newMap[sym]) newMap[sym] = token.logoURI;
                    });
                }
            });

            // Coinpaprika: build symbol → logo URL (take highest-ranked per symbol)
            if (Array.isArray(paprikaCoins)) {
                // Already sorted by rank ascending from API
                for (const coin of paprikaCoins) {
                    const sym: string = (coin.symbol || '').toUpperCase();
                    if (sym && !newMap[sym]) {
                        newMap[sym] = `https://static.coinpaprika.com/coin/${coin.id}/logo.png`;
                    }
                }
            }

            // Known overrides
            newMap['HYPE'] = 'https://raw.githubusercontent.com/hyperliquid-dex/hyperliquid-assets/main/icons/HYPE.png';
            newMap['PURR'] = 'https://raw.githubusercontent.com/hyperliquid-dex/hyperliquid-assets/main/icons/PURR.png';

            saveStoredMap(newMap);
            set({ tokenMap: newMap, isLoading: false });
        } catch (error) {
            console.error('Failed to fetch token lists:', error);
            set({ isLoading: false });
        }
    }
}));
