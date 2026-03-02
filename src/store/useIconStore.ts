import { create } from 'zustand';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface IconResult {
    // For regular symbols: the resolved URL
    url?: string | null;
    // For forex pairs
    type?: 'forex';
    base?: string;
    quote?: string;
}

interface IconStoreState {
    iconMap: Record<string, IconResult>;
    // Symbols currently being fetched (deduplicate in-flight)
    _pending: Set<string>;
    // Debounce timer
    _timer: ReturnType<typeof setTimeout> | null;

    /** Queue symbols for backend resolution (debounced batch request) */
    requestIcons: (symbols: string[]) => void;
    /** Get resolved icon data for a symbol (undefined = not yet fetched) */
    getIcon: (symbol: string) => IconResult | undefined;
    /** Prefetch a large list of symbols all at once (e.g. on market load) */
    prefetch: (symbols: string[]) => Promise<void>;
}

const BATCH_DELAY_MS = 60; // wait 60ms to accumulate symbols before sending

export const useIconStore = create<IconStoreState>((set, get) => ({
    iconMap: {},
    _pending: new Set(),
    _timer: null,

    getIcon: (symbol) => get().iconMap[symbol.toUpperCase()],

    requestIcons: (symbols) => {
        const state = get();
        const { iconMap, _pending } = state;
        const newSymbols = symbols
            .map(s => s.toUpperCase())
            .filter(s => !(s in iconMap) && !_pending.has(s));

        if (newSymbols.length === 0) return;

        newSymbols.forEach(s => _pending.add(s));

        // Clear existing debounce timer
        if (state._timer) clearTimeout(state._timer);

        const timer = setTimeout(async () => {
            const { _pending: pending } = get();
            if (pending.size === 0) return;

            const batch = [...pending];
            // Clear pending set before fetch
            set(s => {
                s._pending.clear();
                return { _pending: s._pending, _timer: null };
            });

            try {
                const resp = await fetch(
                    `${API_URL}/api/icons?symbols=${batch.join(',')}`
                );
                if (resp.ok) {
                    const data: Record<string, IconResult> = await resp.json();
                    set(s => ({ iconMap: { ...s.iconMap, ...data } }));
                }
            } catch {
                // Backend unavailable — mark symbols as null so components use probe fallback
                const nullEntries = Object.fromEntries(batch.map(s => [s, { url: null }]));
                set(s => ({ iconMap: { ...s.iconMap, ...nullEntries } }));
            }
        }, BATCH_DELAY_MS);

        set({ _timer: timer });
    },

    prefetch: async (symbols) => {
        const { iconMap } = get();
        const toFetch = [...new Set(symbols.map(s => s.toUpperCase()))].filter(s => !(s in iconMap));
        if (toFetch.length === 0) return;

        // Mark all as pending immediately to avoid duplicates
        set(s => {
            toFetch.forEach(sym => s._pending.add(sym));
            return { _pending: s._pending };
        });

        // Fetch in chunks of 100 to avoid URL length limits
        const chunkSize = 100;
        for (let i = 0; i < toFetch.length; i += chunkSize) {
            const chunk = toFetch.slice(i, i + chunkSize);
            try {
                const resp = await fetch(
                    `${API_URL}/api/icons?symbols=${chunk.join(',')}`
                );
                if (resp.ok) {
                    const data: Record<string, IconResult> = await resp.json();
                    set(s => {
                        chunk.forEach(sym => s._pending.delete(sym));
                        return { iconMap: { ...s.iconMap, ...data }, _pending: s._pending };
                    });
                }
            } catch {
                const nullEntries = Object.fromEntries(chunk.map(s => [s, { url: null }]));
                set(s => {
                    chunk.forEach(sym => s._pending.delete(sym));
                    return { iconMap: { ...s.iconMap, ...nullEntries }, _pending: s._pending };
                });
            }
        }
    },
}));
