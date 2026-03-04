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
const toFiniteNumber = (value: unknown): number | null => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
};

const normalizeTripwireLevels = (
    side: 'long' | 'short',
    entry: number,
    sl: number,
    tp: number,
    validation?: number,
    invalidation?: number
): { validationLevel: number; invalidationLevel: number } => {
    let validationLevel = toFiniteNumber(validation);
    let invalidationLevel = toFiniteNumber(invalidation);

    if (validationLevel === null) validationLevel = tp;
    if (invalidationLevel === null) invalidationLevel = sl;

    const validationOk =
        side === 'long' ? validationLevel > entry : validationLevel < entry;
    const invalidationOk =
        side === 'long' ? invalidationLevel < entry : invalidationLevel > entry;

    if (!validationOk) validationLevel = tp;
    if (!invalidationOk) invalidationLevel = sl;

    return { validationLevel, invalidationLevel };
};

export const tradingViewCommandService = {
    async queueSetupTrade(params: QueueSetupTradeParams): Promise<void> {
        if (!params?.symbol) return;
        if (!isPositiveFinite(params.entry) || !isPositiveFinite(params.tp) || !isPositiveFinite(params.sl)) return;
        const side = normalizeSide(params.side);
        const { validationLevel, invalidationLevel } = normalizeTripwireLevels(
            side,
            params.entry,
            params.sl,
            params.tp,
            params.validation,
            params.invalidation
        );

        const payload = {
            symbol: params.symbol,
            action: 'setup_trade',
            params: {
                side,
                entry: params.entry,
                tp: params.tp,
                sl: params.sl,
                validation: validationLevel,
                invalidation: invalidationLevel,
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
