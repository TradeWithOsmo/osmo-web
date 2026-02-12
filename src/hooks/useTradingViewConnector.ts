
import { useEffect, useRef } from 'react';
import { commandRegistry } from '../charting/commands/registry';
import { useMarketStore } from '../store/useMarketStore';

export type TradeDecisionTriggerEvent = {
    symbol: string;
    timeframe: string;
    side: string;
    triggerType: 'validation' | 'invalidation';
    triggerLevel: number;
    currentPrice: number;
    note?: string;
    timestamp: number;
};

type ActiveTradeTriggerState = {
    symbol: string;
    side: string;
    validation?: number | null;
    invalidation?: number | null;
    validationNote?: string;
    invalidationNote?: string;
    triggeredValidation: boolean;
    triggeredInvalidation: boolean;
    triggeredValidationCount: number;
    triggeredInvalidationCount: number;
    validationDirection: -1 | 0 | 1;
    invalidationDirection: -1 | 0 | 1;
    lastValidationTriggerAt?: number | null;
    lastInvalidationTriggerAt?: number | null;
    lastValidationTriggerPrice?: number | null;
    lastInvalidationTriggerPrice?: number | null;
    lastPrice?: number | null;
    updatedAt: number;
};

declare global {
    interface Window {
        __activeTradeTriggers?: Record<string, ActiveTradeTriggerState>;
    }
}

/**
 * Hook to extract data from TradingView widget and send to Backend.
 * 
 * @param widget - The TradingView widget instance
 * @param enabled - Whether data syncing is enabled
 */
export const useTradingViewConnector = (
    widget: any,
    enabled: boolean = true,
    onStateChange?: (state: { symbol: string; timeframe: string; indicators: string[] }) => void,
    onTradeDecisionTrigger?: (event: TradeDecisionTriggerEvent) => void
) => {
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const onStateChangeRef = useRef<typeof onStateChange>(onStateChange);
    const onTradeDecisionTriggerRef = useRef<typeof onTradeDecisionTrigger>(onTradeDecisionTrigger);

    useEffect(() => {
        onStateChangeRef.current = onStateChange;
    }, [onStateChange]);

    useEffect(() => {
        onTradeDecisionTriggerRef.current = onTradeDecisionTrigger;
    }, [onTradeDecisionTrigger]);

    useEffect(() => {
        console.log("[TradingViewConnector] Hook Mounted - Registry Check:", commandRegistry);
        // Force Reload Trigger
        if (!widget || !enabled) {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            return;
        }

        const normalizeSymbolKey = (rawSymbol: string): string =>
            String(rawSymbol || '').trim().toUpperCase().replace('/', '-').replace('_', '-');

        const ensureTradeTriggersStore = (): Record<string, ActiveTradeTriggerState> => {
            if (!window.__activeTradeTriggers) {
                window.__activeTradeTriggers = {};
            }
            return window.__activeTradeTriggers;
        };

        const upsertActiveTradeTrigger = (
            symbolRaw: string,
            params: Record<string, any>,
            state: { symbol: string; timeframe: string }
        ) => {
            const key = normalizeSymbolKey(symbolRaw || state.symbol);
            if (!key) return;
            const validation = params?.validation ?? params?.gp ?? null;
            const invalidation = params?.invalidation ?? params?.gl ?? null;
            const store = ensureTradeTriggersStore();
            store[key] = {
                symbol: state.symbol || key,
                side: String(params?.side || '').toLowerCase(),
                validation: validation !== null && validation !== undefined ? Number(validation) : null,
                invalidation: invalidation !== null && invalidation !== undefined ? Number(invalidation) : null,
                validationNote: params?.validation_note || '',
                invalidationNote: params?.invalidation_note || '',
                triggeredValidation: false,
                triggeredInvalidation: false,
                triggeredValidationCount: 0,
                triggeredInvalidationCount: 0,
                validationDirection: 0,
                invalidationDirection: 0,
                lastValidationTriggerAt: null,
                lastInvalidationTriggerAt: null,
                lastValidationTriggerPrice: null,
                lastInvalidationTriggerPrice: null,
                lastPrice: null,
                updatedAt: Date.now(),
            };
        };

        const extractLatestClosePrice = (exportedData: any): number | null => {
            if (!exportedData || !Array.isArray(exportedData.schema) || !Array.isArray(exportedData.data) || exportedData.data.length === 0) {
                return null;
            }
            const schema = exportedData.schema;
            const latestRow = exportedData.data[exportedData.data.length - 1];
            if (!Array.isArray(latestRow)) return null;

            let closeIndex = -1;
            for (let i = 0; i < schema.length; i += 1) {
                const col = schema[i] || {};
                const candidates = [
                    String(col.name || ''),
                    String(col.title || ''),
                    String(col.plotTitle || ''),
                    String(col.sourceTitle || '')
                ]
                    .map(v => v.trim().toLowerCase())
                    .filter(Boolean);
                if (candidates.some(v => v === 'close' || v.endsWith('_close') || v.includes(' close'))) {
                    closeIndex = i;
                    break;
                }
            }

            if (closeIndex < 0) {
                // Fallback to standard OHLC layout where close is usually column index 4 (time, open, high, low, close, ...)
                closeIndex = Math.min(4, latestRow.length - 1);
            }
            const value = latestRow[closeIndex];
            const asNumber = Number(value);
            return Number.isFinite(asNumber) ? asNumber : null;
        };

        const maybeEmitTradeDecisionTrigger = (
            symbolRaw: string,
            timeframe: string,
            latestPrice: number | null
        ) => {
            if (!onTradeDecisionTriggerRef.current || latestPrice === null) return;

            const key = normalizeSymbolKey(symbolRaw);
            const store = ensureTradeTriggersStore();
            const triggerState = store[key];
            if (!triggerState) return;

            const previousPrice = triggerState.lastPrice;
            triggerState.lastPrice = latestPrice;
            if (previousPrice === null || previousPrice === undefined || !Number.isFinite(previousPrice)) {
                return;
            }

            const RE_TRIGGER_COOLDOWN_MS = 30_000;
            const RE_TRIGGER_STEP_PCT = 0.0025; // 0.25%

            const crossingDirection = (a: number, b: number, level: number): -1 | 0 | 1 => {
                if (a < level && b >= level) return 1;
                if (a > level && b <= level) return -1;
                return 0;
            };
            const canTriggerByCooldown = (lastAt?: number | null): boolean =>
                !lastAt || (Date.now() - lastAt) >= RE_TRIGGER_COOLDOWN_MS;
            const hasProgressMove = (
                direction: -1 | 0 | 1,
                level: number,
                lastTriggeredPrice: number | null | undefined
            ): boolean => {
                if (!direction || lastTriggeredPrice === null || lastTriggeredPrice === undefined || !Number.isFinite(lastTriggeredPrice)) {
                    return false;
                }
                const minMove = Math.max(Math.abs(level) * RE_TRIGGER_STEP_PCT, 1e-6);
                if (direction > 0) {
                    return latestPrice >= lastTriggeredPrice + minMove && latestPrice >= level;
                }
                return latestPrice <= lastTriggeredPrice - minMove && latestPrice <= level;
            };
            const isStillBeyondLevel = (direction: -1 | 0 | 1, level: number): boolean => {
                if (!direction) return false;
                return direction > 0 ? latestPrice >= level : latestPrice <= level;
            };

            if (
                triggerState.validation !== null &&
                triggerState.validation !== undefined
            ) {
                const validationLevel = Number(triggerState.validation);
                const crossDir = crossingDirection(previousPrice, latestPrice, validationLevel);
                const canCooldown = canTriggerByCooldown(triggerState.lastValidationTriggerAt);

                if (crossDir !== 0 && (crossDir !== triggerState.validationDirection || canCooldown)) {
                    triggerState.triggeredValidation = true;
                    triggerState.triggeredValidationCount += 1;
                    triggerState.validationDirection = crossDir;
                    triggerState.lastValidationTriggerAt = Date.now();
                    triggerState.lastValidationTriggerPrice = latestPrice;
                    onTradeDecisionTriggerRef.current({
                        symbol: triggerState.symbol || key,
                        timeframe,
                        side: triggerState.side || '',
                        triggerType: 'validation',
                        triggerLevel: validationLevel,
                        currentPrice: latestPrice,
                        note: triggerState.validationNote || undefined,
                        timestamp: Date.now(),
                    });
                } else if (
                    canCooldown &&
                    hasProgressMove(
                        triggerState.validationDirection,
                        validationLevel,
                        triggerState.lastValidationTriggerPrice
                    )
                ) {
                    triggerState.triggeredValidation = true;
                    triggerState.triggeredValidationCount += 1;
                    triggerState.lastValidationTriggerAt = Date.now();
                    triggerState.lastValidationTriggerPrice = latestPrice;
                    onTradeDecisionTriggerRef.current({
                        symbol: triggerState.symbol || key,
                        timeframe,
                        side: triggerState.side || '',
                        triggerType: 'validation',
                        triggerLevel: validationLevel,
                        currentPrice: latestPrice,
                        note: triggerState.validationNote || undefined,
                        timestamp: Date.now(),
                    });
                } else if (
                    triggerState.validationDirection !== 0 &&
                    !isStillBeyondLevel(triggerState.validationDirection, validationLevel)
                ) {
                    triggerState.triggeredValidation = false;
                    triggerState.validationDirection = 0;
                }
            }

            if (
                triggerState.invalidation !== null &&
                triggerState.invalidation !== undefined
            ) {
                const invalidationLevel = Number(triggerState.invalidation);
                const crossDir = crossingDirection(previousPrice, latestPrice, invalidationLevel);
                const canCooldown = canTriggerByCooldown(triggerState.lastInvalidationTriggerAt);

                if (crossDir !== 0 && (crossDir !== triggerState.invalidationDirection || canCooldown)) {
                    triggerState.triggeredInvalidation = true;
                    triggerState.triggeredInvalidationCount += 1;
                    triggerState.invalidationDirection = crossDir;
                    triggerState.lastInvalidationTriggerAt = Date.now();
                    triggerState.lastInvalidationTriggerPrice = latestPrice;
                    onTradeDecisionTriggerRef.current({
                        symbol: triggerState.symbol || key,
                        timeframe,
                        side: triggerState.side || '',
                        triggerType: 'invalidation',
                        triggerLevel: invalidationLevel,
                        currentPrice: latestPrice,
                        note: triggerState.invalidationNote || undefined,
                        timestamp: Date.now(),
                    });
                } else if (
                    canCooldown &&
                    hasProgressMove(
                        triggerState.invalidationDirection,
                        invalidationLevel,
                        triggerState.lastInvalidationTriggerPrice
                    )
                ) {
                    triggerState.triggeredInvalidation = true;
                    triggerState.triggeredInvalidationCount += 1;
                    triggerState.lastInvalidationTriggerAt = Date.now();
                    triggerState.lastInvalidationTriggerPrice = latestPrice;
                    onTradeDecisionTriggerRef.current({
                        symbol: triggerState.symbol || key,
                        timeframe,
                        side: triggerState.side || '',
                        triggerType: 'invalidation',
                        triggerLevel: invalidationLevel,
                        currentPrice: latestPrice,
                        note: triggerState.invalidationNote || undefined,
                        timestamp: Date.now(),
                    });
                } else if (
                    triggerState.invalidationDirection !== 0 &&
                    !isStillBeyondLevel(triggerState.invalidationDirection, invalidationLevel)
                ) {
                    triggerState.triggeredInvalidation = false;
                    triggerState.invalidationDirection = 0;
                }
            }
        };

        const syncIndicators = async () => {
            // console.log("TradingView Connector Hook v3.0 - Naming Logic Updated");
            try {
                const chart = widget.chart();
                if (!chart) return;

                const symbol = chart.symbol();
                const resolution = chart.resolution();

                // Initialize indicators object
                const indicators: Record<string, any> = {};

                // Advanced Extraction using exportData() to get real values
                const exportedData = await chart.exportData({
                    includeTime: true,
                    includeSeries: true,
                    includeStudies: true,
                });
                const latestClosePrice = extractLatestClosePrice(exportedData);

                // exportedData is an object: { schema: [...], data: [...] }
                // schema: [{ name: "Time", type: "time" }, { name: "Open", ... }, { name: "RSI", ... }]
                // data: [[timestamp, open, ..., rsi_value], ...]

                if (exportedData && exportedData.data && exportedData.data.length > 0) {
                    const schema = exportedData.schema;
                    const latestRow = exportedData.data[exportedData.data.length - 1]; // Get last candle

                    // Map schema to values
                    schema.forEach((col: any, index: number) => {
                        // Better naming priority: Titles > Name > Type
                        const title = col.plotTitle || col.sourceTitle || col.title;
                        const name = col.name;

                        let baseName = title;
                        // If no title, use name. If name is generic "value", try others or keep generic.
                        if (!baseName) baseName = name || col.type || 'indicator';

                        // Combine source and plot title if both exist for richness
                        if (col.sourceTitle && col.plotTitle) {
                            baseName = `${col.sourceTitle}_${col.plotTitle}`;
                        }

                        if (baseName) {
                            baseName = baseName.toString()
                                .replace(/\s+/g, '_')   // Replace spaces with underscores
                                .replace(/[()]/g, '')   // Remove parentheses
                                .replace(/,/g, '');     // Remove commas
                        }

                        const finalName = `${baseName}_${index}`;

                        // Skip Time and standard OHLCV if desired (or keep them)
                        if (finalName.toLowerCase().includes('time')) return;

                        const value = latestRow[index];
                        indicators[finalName] = value;
                    });
                } else {
                    // Fallback to basic extraction if exportData fails
                    const studies = chart.getAllStudies();
                    studies.forEach((study: any) => {
                        indicators[study.name] = { id: study.id, inputs: study.getInputs() };
                    });
                }

                // Basic payload
                const payload = {
                    symbol,
                    timeframe: resolution,
                    indicators,
                    timestamp: Date.now()
                };

                // Notify Local Component
                if (onStateChangeRef.current) {
                    // Extract simple indicator names list
                    const studies = chart.getAllStudies();
                    const activeIndicators = studies.map((s: any) => s.name);

                    onStateChangeRef.current({
                        symbol,
                        timeframe: resolution,
                        indicators: activeIndicators
                    });
                }
                maybeEmitTradeDecisionTrigger(symbol, resolution, latestClosePrice);

                // POST to Backend
                await fetch('http://localhost:8000/api/connectors/tradingview/indicators', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload),
                });

                // console.log('[TradingViewConnector] Synced indicators:', Object.keys(indicators));

                // --- NEW: Poll for Commands from Agent ---
                const encodedSymbol = encodeURIComponent(symbol);
                console.log(`[TradingViewConnector] Polling commands for: ${symbol} (Encoded: ${encodedSymbol})`);
                const cmdResponse = await fetch(`http://localhost:8000/api/connectors/tradingview/commands/${encodedSymbol}`);
                if (cmdResponse.ok) {
                    const commands = await cmdResponse.json();
                    if (Array.isArray(commands) && commands.length > 0) {
                        console.log('[TradingViewConnector] Received commands:', commands);

                        const reportCommandResult = async (
                            commandId: string | undefined,
                            status: 'success' | 'error',
                            result?: Record<string, any>,
                            error?: string
                        ) => {
                            if (!commandId) return;
                            try {
                                await fetch('http://localhost:8000/api/connectors/tradingview/commands/result', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        command_id: commandId,
                                        status,
                                        result: result || {},
                                        error
                                    }),
                                });
                            } catch (ackErr) {
                                console.warn('[TradingViewConnector] Failed to send command ack:', ackErr);
                            }
                        };

                        const normalizeResolution = (value: any): string => {
                            const raw = String(value || '').trim().toUpperCase();
                            if (!raw) return '';
                            const mapping: Record<string, string> = {
                                '1M': '1',
                                '3M': '3',
                                '5M': '5',
                                '15M': '15',
                                '30M': '30',
                                '45M': '45',
                                '1H': '60',
                                '2H': '120',
                                '3H': '180',
                                '4H': '240',
                                '6H': '360',
                                '8H': '480',
                                '12H': '720',
                                '1D': 'D',
                                '1W': 'W',
                            };
                            return mapping[raw] || raw;
                        };

                        const getStateEvidence = () => {
                            let activeSymbol = '';
                            let activeTimeframe = '';
                            try {
                                activeSymbol = chart.symbol();
                            } catch (e) {
                                console.warn('[TradingViewConnector] Failed to read current symbol for ack state:', e);
                            }
                            try {
                                activeTimeframe = chart.resolution();
                            } catch (e) {
                                console.warn('[TradingViewConnector] Failed to read current timeframe for ack state:', e);
                            }
                            return {
                                symbol: activeSymbol,
                                timeframe: activeTimeframe,
                            };
                        };

                        const buildCommandResult = (
                            action: string,
                            params: Record<string, any> | undefined,
                            message: string
                        ): Record<string, any> => {
                            const state = getStateEvidence();
                            if (action === 'setup_trade') {
                                upsertActiveTradeTrigger(state.symbol || symbol, params || {}, state);
                            }
                            const payload: Record<string, any> = {
                                message,
                                state,
                                symbol: state.symbol,
                                timeframe: state.timeframe,
                            };

                            if (action === 'set_symbol') {
                                payload.applied_symbol = state.symbol || params?.symbol;
                            } else if (action === 'set_timeframe') {
                                payload.applied_timeframe = state.timeframe || params?.timeframe;
                            } else if (action === 'add_indicator') {
                                payload.applied_indicator = params?.name || '';
                            } else if (action === 'setup_trade') {
                                payload.side = params?.side || '';
                                payload.validation = params?.validation ?? params?.gp ?? null;
                                payload.invalidation = params?.invalidation ?? params?.gl ?? null;
                            } else if ((action === 'draw_shape' || action === 'update_drawing') && params?.id) {
                                payload.drawing_id = params.id;
                            }

                            if (action === 'clear_drawings') {
                                payload.drawings_cleared = true;
                            }
                            return payload;
                        };

                        for (const cmd of commands) {
                            let cmdStatus: 'success' | 'error' = 'success';
                            let cmdResult: Record<string, any> = {};
                            let cmdError: string | undefined;
                            try {
                                if (cmd.action === 'set_symbol' && cmd?.params?.symbol && cmd?.params?.target_source) {
                                    const targetSourceRaw = String(cmd.params.target_source || '').trim().toLowerCase();
                                    const targetSource = targetSourceRaw === 'ostium' ? 'ostium' : (
                                        targetSourceRaw === 'hyperliquid' ? 'hyperliquid' : undefined
                                    );
                                    const beforeMarket = useMarketStore.getState().selectedMarket;
                                    useMarketStore.getState().setMarket(String(cmd.params.symbol), targetSource);
                                    const afterMarket = useMarketStore.getState().selectedMarket;
                                    if (!afterMarket) {
                                        throw new Error(`Unable to switch market to ${String(cmd.params.symbol)} (${targetSourceRaw})`);
                                    }
                                    if (targetSource && afterMarket.source !== targetSource) {
                                        throw new Error(
                                            `Market source switch failed: expected ${targetSource}, got ${String(afterMarket.source)}`
                                        );
                                    }
                                    if (!String(afterMarket.symbol || '').toUpperCase().includes(String(cmd.params.symbol || '').split('/')[0].toUpperCase())) {
                                        console.warn('[TradingViewConnector] set_symbol source-switch used closest market match', {
                                            before: beforeMarket?.symbol,
                                            after: afterMarket.symbol,
                                            requested: cmd.params.symbol,
                                        });
                                    }
                                    cmdResult = buildCommandResult(
                                        cmd.action,
                                        cmd.params,
                                        `Requested source switch to ${targetSourceRaw} and symbol ${String(cmd.params.symbol)}.`
                                    );
                                    cmdResult.applied_symbol = String(cmd.params.symbol);
                                    cmdResult.source_switch = targetSourceRaw || null;
                                    continue;
                                }

                                const handler = commandRegistry.get(cmd.action);
                                if (handler) {
                                    console.log(`[TradingViewConnector] Dispatching ${cmd.action} to handler`);
                                    // Force HMR Refresh Check
                                    // Inject action_type so handlers like NavHandler know what to do
                                    await handler.execute(widget.activeChart(), { ...cmd.params, action_type: cmd.action });
                                    if (cmd.action === 'set_symbol' && cmd?.params?.symbol) {
                                        // Keep global market store in sync so Trade props don't revert chart symbol.
                                        const targetSourceRaw = String(
                                            cmd?.params?.target_source ||
                                            cmd?.params?.source ||
                                            cmd?.params?.exchange ||
                                            ''
                                        ).trim().toLowerCase();
                                        const targetSource = targetSourceRaw === 'ostium' ? 'ostium' : (
                                            targetSourceRaw === 'hyperliquid' ? 'hyperliquid' : undefined
                                        );
                                        useMarketStore.getState().setMarket(String(cmd.params.symbol), targetSource);
                                    }
                                    cmdResult = buildCommandResult(cmd.action, cmd.params, `Handler '${cmd.action}' executed.`);
                                } else if (cmd.action === 'set_timeframe') {
                                    const tf = cmd.params.timeframe;
                                    const resolvedTf = normalizeResolution(tf);
                                    console.log(`[TradingViewConnector] Executing Legacy: Set Timeframe to ${tf}`);
                                    await new Promise<void>((resolve, reject) => {
                                        let finished = false;
                                        const timer = setTimeout(() => {
                                            if (!finished) {
                                                finished = true;
                                                reject(new Error(`setResolution timeout for ${tf}`));
                                            }
                                        }, 7000);
                                        try {
                                            chart.setResolution(resolvedTf, () => {
                                                if (finished) return;
                                                finished = true;
                                                clearTimeout(timer);
                                                console.log('Timeframe changed');
                                                resolve();
                                            });
                                        } catch (err) {
                                            if (finished) return;
                                            finished = true;
                                            clearTimeout(timer);
                                            reject(err as Error);
                                        }
                                    });
                                    cmdResult = buildCommandResult(cmd.action, cmd.params, `Timeframe set to ${tf}.`);
                                } else if (cmd.action === 'add_indicator') {
                                    const { name, inputs, forceOverlay } = cmd.params;
                                    console.log(`[TradingViewConnector] Executing Legacy: Add Indicator ${name}`);
                                    chart.createStudy(name, forceOverlay, false, inputs);
                                    cmdResult = buildCommandResult(cmd.action, cmd.params, `Indicator '${name}' added.`);
                                } else if (cmd.action === 'clear_indicators') {
                                    const keepVolume = Boolean(cmd?.params?.keep_volume || cmd?.params?.keepVolume);
                                    const studies = chart.getAllStudies?.() || [];
                                    for (const study of studies) {
                                        const studyName = String(study?.name || '').trim().toLowerCase();
                                        if (keepVolume && studyName === 'volume') {
                                            continue;
                                        }
                                        chart.removeEntity(study.id);
                                    }
                                    cmdResult = buildCommandResult(cmd.action, cmd.params, 'All indicators cleared.');
                                } else if (cmd.action === 'remove_indicator') {
                                    const targetName = String(cmd?.params?.name || '').trim().toLowerCase();
                                    const studies = chart.getAllStudies?.() || [];
                                    const matches = studies.filter((study: any) => {
                                        const current = String(study?.name || '').trim().toLowerCase();
                                        if (!targetName) return false;
                                        return current === targetName || current.includes(targetName) || targetName.includes(current);
                                    });
                                    if (matches.length === 0) {
                                        throw new Error(`Indicator '${cmd?.params?.name || ''}' not found`);
                                    }
                                    for (const study of matches) {
                                        chart.removeEntity(study.id);
                                    }
                                    cmdResult = buildCommandResult(cmd.action, cmd.params, `Indicator '${cmd?.params?.name || ''}' removed.`);
                                }
                                // === NEW: Trade Setup (Visual Only) ===
                                else if (cmd.action === 'setup_trade') {
                                    const { side, entry, sl, tp } = cmd.params;
                                    console.log(`[TradingViewConnector] Visualizing Trade Setup: ${side ? side.toUpperCase() : 'UNKNOWN'} @ ${entry}`);

                                    const tool = side === 'long' ? 'long_position' : 'short_position';
                                    console.log(`[TradingViewConnector] Using tool: ${tool}`);
                                    console.log(`[TradingViewConnector] Params: Entry=${entry}, SL=${sl}, TP=${tp}`);

                                    // === VISUALIZATION STRATEGY (NATIVE UI) ===
                                    // Use chart.createOrderLine() to render authentic TradingView Order/Position lines.
                                    // These look exactly like the Broker UI (Draggable, Quantity, 'X' button).

                                    console.log(`[TradingViewConnector] Drawing Native Order Lines...`);

                                    // Cleanup function to remove old lines (Stored in window/global scope for now as a hack)
                                    // In a real app, use a Ref.
                                    if ((window as any).__activeTradeLines) {
                                        (window as any).__activeTradeLines.forEach((line: any) => line.remove());
                                        (window as any).__activeTradeLines = [];
                                    }
                                    const activeLines: any[] = [];

                                    try {
                                        // 1. ENTRY LINE
                                        const entryLine = chart.createOrderLine()
                                            .setText(`${side === 'long' ? 'Buy' : 'Sell'} Limit`)
                                            .setPrice(entry)
                                            .setQuantity("1") // Default qty
                                            .setLineColor("#2962FF")
                                            .setBodyTextColor("#2962FF")
                                            .setBodyBackgroundColor("#240114") // Dark Background
                                            .setQuantityBackgroundColor("#2962FF")
                                            .setCancelButtonBackgroundColor("#2962FF")
                                            .setBodyBorderColor("#2962FF")
                                            .setQuantityBorderColor("#2962FF")
                                            .setCancelButtonBorderColor("#2962FF");

                                        // Add callbacks if needed (e.g., logging new price on drag)
                                        entryLine.onMove(function () {
                                            console.log(`[TradingViewConnector] Entry Moved: ${entryLine.getPrice()}`);
                                        });

                                        activeLines.push(entryLine);

                                        // 2. TAKE PROFIT LINE
                                        const tpLine = chart.createOrderLine()
                                            .setText("Take Profit")
                                            .setPrice(tp)
                                            .setQuantity("1")
                                            .setLineColor("#089981")
                                            .setBodyTextColor("#089981")
                                            .setBodyBackgroundColor("#240114") // Dark Background
                                            .setQuantityBackgroundColor("#089981")
                                            .setCancelButtonBackgroundColor("#089981")
                                            .setBodyBorderColor("#089981")
                                            .setQuantityBorderColor("#089981")
                                            .setCancelButtonBorderColor("#089981");

                                        activeLines.push(tpLine);

                                        // 3. STOP LOSS LINE
                                        const slLine = chart.createOrderLine()
                                            .setText("Stop Loss")
                                            .setPrice(sl)
                                            .setQuantity("1")
                                            .setLineColor("#F23645")
                                            .setBodyTextColor("#F23645")
                                            .setBodyBackgroundColor("#240114") // Dark Background
                                            .setQuantityBackgroundColor("#F23645")
                                            .setCancelButtonBackgroundColor("#F23645")
                                            .setBodyBorderColor("#F23645")
                                            .setQuantityBorderColor("#F23645")
                                            .setCancelButtonBorderColor("#F23645");

                                        activeLines.push(slLine);

                                        // === OPTIONAL LINES ===
                                        const {
                                            tp2,
                                            tp3,
                                            trailing_sl,
                                            be,
                                            liq,
                                            gp,
                                            gl,
                                            validation,
                                            invalidation,
                                            validation_note,
                                            invalidation_note
                                        } = cmd.params;
                                        const gpLevel = gp ?? validation;
                                        const glLevel = gl ?? invalidation;

                                        // 4. TP 2
                                        if (tp2) {
                                            const tp2Line = chart.createOrderLine()
                                                .setText("Take Profit 2")
                                                .setPrice(tp2)
                                                .setQuantity("0.5")
                                                .setLineColor("#089981") // Green
                                                .setBodyTextColor("#089981")
                                                .setBodyBackgroundColor("#240114") // Dark Background
                                                .setQuantityBackgroundColor("#089981")
                                                .setCancelButtonBackgroundColor("#089981")
                                                .setBodyBorderColor("#089981")
                                                .setQuantityBorderColor("#089981")
                                                .setCancelButtonBorderColor("#089981")
                                                .setLineStyle(2); // Dashed
                                            activeLines.push(tp2Line);
                                        }

                                        // 5. TP 3
                                        if (tp3) {
                                            const tp3Line = chart.createOrderLine()
                                                .setText("Take Profit 3")
                                                .setPrice(tp3)
                                                .setQuantity("0.25")
                                                .setLineColor("#089981") // Green
                                                .setBodyTextColor("#089981")
                                                .setBodyBackgroundColor("#240114") // Dark Background
                                                .setQuantityBackgroundColor("#089981")
                                                .setCancelButtonBackgroundColor("#089981")
                                                .setBodyBorderColor("#089981")
                                                .setQuantityBorderColor("#089981")
                                                .setCancelButtonBorderColor("#089981")
                                                .setLineStyle(2); // Dashed
                                            activeLines.push(tp3Line);
                                        }

                                        // 6. Trailing Stop
                                        if (trailing_sl) {
                                            const tslLine = chart.createOrderLine()
                                                .setText("Trailing Stop")
                                                .setPrice(trailing_sl)
                                                .setQuantity("TSL")
                                                .setLineColor("#FFA726") // Orange
                                                .setBodyTextColor("#FFA726")
                                                .setBodyBackgroundColor("#240114") // Dark Background
                                                .setQuantityBackgroundColor("#FFA726")
                                                .setCancelButtonBackgroundColor("#FFA726")
                                                .setBodyBorderColor("#FFA726")
                                                .setQuantityBorderColor("#FFA726")
                                                .setCancelButtonBorderColor("#FFA726")
                                                .setLineStyle(2);
                                            activeLines.push(tslLine);
                                        }

                                        // 7. Break Even
                                        if (be) {
                                            const beLine = chart.createOrderLine()
                                                .setText("Break Even")
                                                .setPrice(be)
                                                .setQuantity("BE")
                                                .setLineColor("#78909C") // Blue Gray
                                                .setBodyTextColor("#78909C")
                                                .setBodyBackgroundColor("#240114") // Dark Background
                                                .setQuantityBackgroundColor("#78909C")
                                                .setCancelButtonBackgroundColor("#78909C")
                                                .setBodyBorderColor("#78909C")
                                                .setQuantityBorderColor("#78909C")
                                                .setCancelButtonBorderColor("#78909C")
                                                .setLineStyle(1); // Dotted
                                            activeLines.push(beLine);
                                        }

                                        // 8. Liquidation Price
                                        if (liq) {
                                            const liqLine = chart.createOrderLine()
                                                .setText("Liquidation")
                                                .setPrice(liq)
                                                .setQuantity("X")
                                                .setLineColor("#F23645") // Red (Same as SL)
                                                .setBodyTextColor("#F23645")
                                                .setBodyBackgroundColor("#240114")
                                                .setQuantityBackgroundColor("#F23645")
                                                .setCancelButtonBackgroundColor("#F23645")
                                                .setBodyBorderColor("#F23645")
                                                .setQuantityBorderColor("#F23645")
                                                .setCancelButtonBorderColor("#F23645")
                                                .setLineStyle(0); // Solid warning
                                            activeLines.push(liqLine);
                                        }

                                        // 9. GP (Generate Profit Decision - AI Tripwire)
                                        if (gpLevel !== undefined && gpLevel !== null) {
                                            const gpLine = chart.createOrderLine()
                                                .setText(validation_note || "Validation")
                                                .setPrice(gpLevel)
                                                .setQuantity("AI")
                                                .setLineColor("#089981") // Green (Same as TP)
                                                .setBodyTextColor("#089981")
                                                .setBodyBackgroundColor("#240114")
                                                .setQuantityBackgroundColor("#089981")
                                                .setCancelButtonBackgroundColor("#089981")
                                                .setBodyBorderColor("#089981")
                                                .setQuantityBorderColor("#089981")
                                                .setCancelButtonBorderColor("#089981")
                                                .setLineStyle(2); // Dashed
                                            activeLines.push(gpLine);
                                        }

                                        // 10. GL (Generate Loss Decision - AI Tripwire)
                                        if (glLevel !== undefined && glLevel !== null) {
                                            const glLine = chart.createOrderLine()
                                                .setText(invalidation_note || "Invalidation")
                                                .setPrice(glLevel)
                                                .setQuantity("AI")
                                                .setLineColor("#F23645") // Red (Same as SL)
                                                .setBodyTextColor("#F23645")
                                                .setBodyBackgroundColor("#240114")
                                                .setQuantityBackgroundColor("#F23645")
                                                .setCancelButtonBackgroundColor("#F23645")
                                                .setBodyBorderColor("#F23645")
                                                .setQuantityBorderColor("#F23645")
                                                .setCancelButtonBorderColor("#F23645")
                                                .setLineStyle(2); // Dashed
                                            activeLines.push(glLine);
                                        }

                                        // Save to global scope for cleanup next time
                                        (window as any).__activeTradeLines = activeLines;

                                        console.log(`[TradingViewConnector] Native Order Lines Created!`);
                                        cmdResult = buildCommandResult(cmd.action, cmd.params, 'Trade setup lines created.');

                                    } catch (err) {
                                        console.error("[TradingViewConnector] Failed to draw native lines:", err);
                                        // Fallback warning
                                        console.warn("Is 'createOrderLine' enabled in your TV Chart config?");
                                        throw err;
                                    }

                                } else {
                                    console.warn(`[TradingViewConnector] Unknown Action: ${cmd.action}`);
                                    cmdStatus = 'error';
                                    cmdError = `Unknown action: ${cmd.action}`;
                                }
                            } catch (e) {
                                console.error(`[TradingViewConnector] Command Failed:`, e);
                                cmdStatus = 'error';
                                cmdError = e instanceof Error ? e.message : String(e);
                            } finally {
                                await reportCommandResult(cmd.command_id, cmdStatus, cmdResult, cmdError);
                            }
                        }
                    }
                }

            } catch (error) {
                // Squelch sync errors to avoid console spam if backend is down temporarily
                // console.error('[TradingViewConnector] Sync failed:', error);
            }
        };

        // Sync every 3 seconds (Faster for commands)
        intervalRef.current = setInterval(syncIndicators, 3000);

        // Initial sync
        setTimeout(syncIndicators, 2000);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [widget, enabled]);
};
