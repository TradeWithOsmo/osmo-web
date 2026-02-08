const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export type QueueSetupTradeParams = {
    symbol: string;
    side: 'buy' | 'sell' | 'long' | 'short';
    entry: number;
    tp: number;
    sl: number;
    validation?: number;
    invalidation?: number;
    validation_note?: string;
    invalidation_note?: string;
};

const normalizeSide = (side: QueueSetupTradeParams['side']): 'long' | 'short' =>
    side === 'buy' || side === 'long' ? 'long' : 'short';

const isPositiveFinite = (v: number): boolean => Number.isFinite(v) && v > 0;

export const tradingViewCommandService = {
    async queueSetupTrade(params: QueueSetupTradeParams): Promise<void> {
        if (!params?.symbol) return;
        if (!isPositiveFinite(params.entry) || !isPositiveFinite(params.tp) || !isPositiveFinite(params.sl)) return;

        const payload = {
            symbol: params.symbol,
            action: 'setup_trade',
            params: {
                side: normalizeSide(params.side),
                entry: params.entry,
                tp: params.tp,
                sl: params.sl,
                validation: params.validation ?? params.tp,
                invalidation: params.invalidation ?? params.sl,
                validation_note: params.validation_note,
                invalidation_note: params.invalidation_note,
            },
        };

        await fetch(`${API_URL}/api/connectors/tradingview/commands`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
    },
};

