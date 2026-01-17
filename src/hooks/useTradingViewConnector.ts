
import { useEffect, useRef } from 'react';

/**
 * Hook to extract data from TradingView widget and send to Backend.
 * 
 * @param widget - The TradingView widget instance
 * @param enabled - Whether data syncing is enabled
 */
export const useTradingViewConnector = (widget: any, enabled: boolean = true) => {
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!widget || !enabled) {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            return;
        }

        const syncIndicators = async () => {
            console.log("TradingView Connector Hook v3.0 - Naming Logic Updated");
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

                console.log('[TradingViewConnector] Synced indicators:', Object.keys(indicators));

            } catch (error) {
                console.error('[TradingViewConnector] Sync failed:', error);
            }
        };

        // Sync every 10 seconds
        intervalRef.current = setInterval(syncIndicators, 10000);

        // Initial sync
        setTimeout(syncIndicators, 2000);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [widget, enabled]);
};
