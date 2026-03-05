import { create } from 'zustand';

interface WatchlistItem {
    symbol: string;
    source?: string;
    wallet_address?: string;
}

interface WatchlistState {
    favorites: Set<string>; // Set of symbols
    isLoading: boolean;
    fetchWatchlist: (walletAddress?: string) => Promise<void>;
    toggleFavorite: (symbol: string, source?: string, walletAddress?: string) => Promise<void>;
}

const API_ORIGIN = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const API_BASE = `${API_ORIGIN}/api/watchlist`;

export const useWatchlistStore = create<WatchlistState>((set, get) => ({
    favorites: new Set(),
    isLoading: false,
    fetchWatchlist: async (walletAddress) => {
        if (!walletAddress) {
            set({ favorites: new Set(), isLoading: false });
            return;
        }

        set({ isLoading: true });
        try {
            const url = `${API_BASE}/?wallet_address=${walletAddress}`;
            const response = await fetch(url);
            const data: WatchlistItem[] = await response.json();
            // Use composite key: source:symbol
            set({
                favorites: new Set(data.map(item => `${item.source || 'hyperliquid'}:${item.symbol}`)),
                isLoading: false
            });
        } catch (error) {
            console.error('Failed to fetch watchlist:', error);
            set({ isLoading: false });
        }
    },
    toggleFavorite: async (symbol, source = 'hyperliquid', walletAddress) => {
        try {
            const response = await fetch(`${API_BASE}/toggle`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ symbol, source, wallet_address: walletAddress })
            });
            const result = await response.json();

            const newFavorites = new Set(get().favorites);
            const key = `${source}:${symbol}`;

            if (result.status === 'added') {
                newFavorites.add(key);
            } else {
                newFavorites.delete(key);
            }
            set({ favorites: newFavorites });
        } catch (error) {
            console.error('Failed to toggle favorite:', error);
        }
    }
}));
