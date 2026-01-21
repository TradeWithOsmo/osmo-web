
import { useEffect, useRef } from 'react';
import { commandRegistry } from '../charting/commands/registry';

/**
 * Hook to extract data from TradingView widget and send to Backend.
 * 
 * @param widget - The TradingView widget instance
 * @param enabled - Whether data syncing is enabled
 */
export const useTradingViewConnector = (widget: any, enabled: boolean = true) => {
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Map common Agent/User friendly names to TradingView internal study names
    const STUDY_MAP: Record<string, string> = {
        "RSI": "Relative Strength Index",
        "MACD": "MACD",
        "SMA": "Moving Average",
        "EMA": "Moving Average Exponential",
        "BB": "Bollinger Bands",
        "Bollinger Bands": "Bollinger Bands",
        "Stochastic": "Stochastic",
        "ATR": "Average True Range",
        "VWAP": "VWAP"
    };

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

                        for (const cmd of commands) {
                            try {
                                const handler = commandRegistry.get(cmd.action);
                                if (handler) {
                                    console.log(`[TradingViewConnector] Dispatching ${cmd.action} to handler`);
                                    // Force HMR Refresh Check
                                    // Inject action_type so handlers like NavHandler know what to do
                                    handler.execute(widget.activeChart(), { ...cmd.params, action_type: cmd.action });
                                } else if (cmd.action === 'set_timeframe') {
                                    const tf = cmd.params.timeframe;
                                    console.log(`[TradingViewConnector] Executing Legacy: Set Timeframe to ${tf}`);
                                    chart.setResolution(tf, () => console.log('Timeframe changed'));
                                } else if (cmd.action === 'add_indicator') {
                                    const { name, inputs, forceOverlay } = cmd.params;
                                    console.log(`[TradingViewConnector] Executing Legacy: Add Indicator ${name}`);
                                    chart.createStudy(name, forceOverlay, false, inputs);
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
                                        const { tp2, tp3, trailing_sl, be, liq, gp, gl } = cmd.params;

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
                                        if (gp) {
                                            const gpLine = chart.createOrderLine()
                                                .setText("AI-GP")
                                                .setPrice(gp)
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
                                        if (gl) {
                                            const glLine = chart.createOrderLine()
                                                .setText("AI-GL")
                                                .setPrice(gl)
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

                                    } catch (err) {
                                        console.error("[TradingViewConnector] Failed to draw native lines:", err);
                                        // Fallback warning
                                        console.warn("Is 'createOrderLine' enabled in your TV Chart config?");
                                    }

                                } else {
                                    console.warn(`[TradingViewConnector] Unknown Action: ${cmd.action}`);
                                    console.warn(`[TradingViewConnector] Unknown Action: ${cmd.action}`);
                                }
                            } catch (e) {
                                console.error(`[TradingViewConnector] Command Failed:`, e);
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
