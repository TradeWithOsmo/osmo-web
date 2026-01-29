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

const API_BASE = 'http://localhost:8000/api/watchlist';

export const useWatchlistStore = create<WatchlistState>((set, get) => ({
    favorites: new Set(),
    isLoading: false,
    fetchWatchlist: async (walletAddress) => {
        set({ isLoading: true });
        try {
            const url = walletAddress ? `${API_BASE}/?wallet_address=${walletAddress}` : `${API_BASE}/`;
            const response = await fetch(url);
            const data: WatchlistItem[] = await response.json();
            set({ favorites: new Set(data.map(item => item.symbol)), isLoading: false });
        } catch (error) {
            console.error('Failed to fetch watchlist:', error);
            set({ isLoading: false });
        }
    },
    toggleFavorite: async (symbol, source, walletAddress) => {
        try {
            const response = await fetch(`${API_BASE}/toggle`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ symbol, source, wallet_address: walletAddress })
            });
            const result = await response.json();

            const newFavorites = new Set(get().favorites);
            if (result.status === 'added') {
                newFavorites.add(symbol);
            } else {
                newFavorites.delete(symbol);
            }
            set({ favorites: newFavorites });
        } catch (error) {
            console.error('Failed to toggle favorite:', error);
        }
    }
}));
