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

export const useTokenListStore = create<TokenListState>((set, get) => ({
    tokenMap: {},
    isLoading: false,
    fetchTokenList: async () => {
        if (Object.keys(get().tokenMap).length > 0) return;

        set({ isLoading: true });
        try {
            // Fetch multiple lists for better coverage
            // 1. Uniswap Default List
            // 2. Coingecko List (Very comprehensive)
            const lists = [
                'https://tokens.uniswap.org/',
                'https://tokens.coingecko.com/uniswap/all.json'
            ];

            const results = await Promise.allSettled(
                lists.map(url => fetch(url).then(res => res.json()))
            );

            const newMap: Record<string, string> = {};

            results.forEach(result => {
                if (result.status === 'fulfilled' && result.value.tokens) {
                    result.value.tokens.forEach((token: TokenInfo) => {
                        const sym = token.symbol.toUpperCase();
                        // Only set if not already present to avoid overriding higher quality ones 
                        // (Uniswap list often has cleaner icons than dynamic CG ones)
                        if (!new Map(Object.entries(newMap)).has(sym)) {
                            newMap[sym] = token.logoURI;
                        }
                    });
                }
            });

            // Add known local/special overrides
            newMap['HYPE'] = 'https://raw.githubusercontent.com/hyperliquid-dex/hyperliquid-assets/main/icons/HYPE.png';
            newMap['PURR'] = 'https://raw.githubusercontent.com/hyperliquid-dex/hyperliquid-assets/main/icons/PURR.png';

            set({ tokenMap: newMap, isLoading: false });
        } catch (error) {
            console.error('Failed to fetch token lists:', error);
            set({ isLoading: false });
        }
    }
}));
