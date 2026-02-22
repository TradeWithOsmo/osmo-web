import React, { useEffect, useRef, useState } from "react";
import "./TradingChart.css";
import { useTradingViewConnector, type TradeDecisionTriggerEvent } from "../../hooks/useTradingViewConnector";

interface TVChartContainerProps {
  symbol?: string;
  interval?: string;
  theme?: "light" | "dark";
  height?: string;
  hideTopToolbar?: boolean;
  hideSideToolbar?: boolean;
  source?: 'hyperliquid' | 'ostium'; // Add source prop
  customColors?: {
    background?: string;
    grid?: string;
    text?: string;
    candleUp?: string;
    candleDown?: string;
    volumeUp?: string;
    volumeDown?: string;
  };
  onChartStateChange?: (state: { symbol: string; timeframe: string; indicators: string[] }) => void;
  onTradeDecisionTrigger?: (event: TradeDecisionTriggerEvent) => void;
  studies?: string[];
}

const TVChartContainer: React.FC<TVChartContainerProps> = ({
  symbol = "BTC/USDT",
  interval = "1D",
  theme = "dark",
  height = "700px",
  hideSideToolbar = false,
  source = 'hyperliquid', // Default to hyperliquid
  onChartStateChange,
  onTradeDecisionTrigger,
  studies = []
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<any>(null);
  const [isChartReady, setIsChartReady] = useState(false);
  const hasInitialized = useRef(false);
  const initRequestIdRef = useRef(0);
  const initTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);

  // Sync data to backend when chart is ready (Hook v3.1)
  useTradingViewConnector(widgetRef.current, isChartReady, onChartStateChange, onTradeDecisionTrigger);

  const clearInitTimer = () => {
    if (initTimerRef.current) {
      clearTimeout(initTimerRef.current);
      initTimerRef.current = null;
    }
  };

  const cleanupWidget = (reason: string, resetReady: boolean = true) => {
    clearInitTimer();
    if (resetReady && isMountedRef.current) {
      setIsChartReady(false);
    }
    if (widgetRef.current?.remove) {
      try {
        console.log(`[TradingChart] Cleanup widget (${reason})`);
        widgetRef.current.remove();
      } catch (e) {
        console.warn(`[TradingChart] Failed to cleanup widget (${reason})`, e);
      }
      widgetRef.current = null;
    }
    if (chartContainerRef.current) {
      chartContainerRef.current.innerHTML = "";
    }
  };

  const beginInitialization = (delayMs: number = 0) => {
    clearInitTimer();
    const requestId = ++initRequestIdRef.current;
    hasInitialized.current = true;
    initTimerRef.current = setTimeout(() => {
      initTimerRef.current = null;
      void initializeWidget(requestId);
    }, delayMs);
  };

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      hasInitialized.current = false;
      initRequestIdRef.current += 1;
      cleanupWidget("unmount", false);
    };
  }, []);

  // Sync Studies (Indicators)
  useEffect(() => {
    if (!isChartReady || !widgetRef.current) return;

    try {
      const chart = widgetRef.current.chart();
      const currentStudies = chart.getAllStudies();
      const currentNames = currentStudies.map((s: any) => s.name);

      // Find studies to add
      const toAdd = studies.filter(s => !currentNames.includes(s));

      // Exact sync: remove any study that is not in requested `studies` list.
      // This includes default "Volume", so it no longer stays pinned unexpectedly.
      const toRemove = currentStudies.filter((s: any) => !studies.includes(s.name));

      toRemove.forEach((s: any) => {
        console.log(`[TradingChart] removing study: ${s.name}`);
        chart.removeEntity(s.id);
      });

      toAdd.forEach((studyName: string) => {
        console.log(`[TradingChart] adding study: ${studyName}`);
        chart.createStudy(studyName, false, false);
      });

    } catch (e) {
      console.error('[TradingChart] Failed to sync studies:', e);
    }
  }, [studies, isChartReady]);

  // Sync Symbol
  useEffect(() => {
    if (!isChartReady || !widgetRef.current) return;
    try {
      const chart = widgetRef.current.chart();
      if (chart.symbol() !== symbol) {
        console.log(`[TradingChart] Switching symbol to ${symbol}`);
        chart.setSymbol(symbol, () => {
          console.log(`[TradingChart] Symbol switched to ${symbol}`);
        });
      }
    } catch (e) {
      console.error('[TradingChart] Failed to set symbol:', e);
    }
  }, [symbol, isChartReady]);

  // Sync Interval
  useEffect(() => {
    if (!isChartReady || !widgetRef.current) return;
    try {
      const chart = widgetRef.current.chart();
      if (chart.resolution() !== interval) {
        console.log(`[TradingChart] Switching interval to ${interval}`);
        chart.setResolution(interval, () => {
          console.log(`[TradingChart] Interval switched to ${interval}`);
        });
      }
    } catch (e) {
      console.error('[TradingChart] Failed to set resolution:', e);
    }
  }, [interval, isChartReady]);

  // Wait for container to have proper dimensions before initializing
  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container || hasInitialized.current) return;

    // Check if container is visible and has dimensions
    const checkAndInit = () => {
      const width = container.offsetWidth;
      const height = container.offsetHeight;

      if (width > 0 && height > 0 && !hasInitialized.current) {
        console.log('[TradingChart] Container ready, initializing widget', { width, height, source });
        beginInitialization();
      }
    };

    // Observer to detect when container becomes visible
    const resizeObserver = new ResizeObserver(() => {
      checkAndInit();
    });

    resizeObserver.observe(container);
    checkAndInit(); // Initial check

    return () => {
      resizeObserver.disconnect();
    };
  }, [symbol, interval, theme, hideSideToolbar, source]);

  const initializeWidget = async (requestId: number) => {
    try {
      if (!isMountedRef.current || requestId !== initRequestIdRef.current) return;

      const container = chartContainerRef.current;
      if (!container) {
        hasInitialized.current = false;
        return;
      }

      const TradingViewLib = (window as any).TradingView;
      if (!TradingViewLib) {
        throw new Error('TradingView library not loaded');
      }
      const { widget } = TradingViewLib;

      // Dynamically load datafeed based on source
      console.log(`[TradingChart] Loading datafeed for source: ${source}`);
      let Datafeed: any;
      if (source === 'ostium') {
        // @ts-ignore - JS datafeed module has no TS declarations
        Datafeed = await import('../../charting/datafeeds/Ostium/datafeed_ostium.js');
      } else {
        // @ts-ignore - JS datafeed module has no TS declarations
        Datafeed = await import('../../charting/datafeeds/datafeed_custom.js');
      }

      if (!isMountedRef.current || requestId !== initRequestIdRef.current) return;

      const disabledFeatures = [
        "symbol_search_hot_key",
        "header_symbol_search",
        "header_compare",
        "compare_symbol",
        // Keep Volume in its own pane instead of forcing overlay on price pane.
        "volume_force_overlay",
      ];

      if (hideSideToolbar) {
        disabledFeatures.push("left_toolbar");
      }

      const widgetOptions = {
        symbol,
        datafeed: (Datafeed as any).default,
        container,
        library_path: "/charting_library/",
        interval,
        locale: "en",
        disabled_features: disabledFeatures,
        enabled_features: [
          "use_localstorage_for_settings",
          "study_templates",
          "show_chart_property_page",
          "side_toolbar_in_fullscreen_mode",
          "hide_last_legend_study_row",
        ],
        charts_storage_url: "https://saveload.tradingview.com",
        charts_storage_api_version: "1.1",
        client_id: "tradingview.com",
        user_id: "public_user_id",
        fullscreen: false,
        autosize: true,
        load_last_chart: false,
        auto_save_delay: 0,
        studies_overrides: {},
        theme,
        loading_screen: {
          backgroundColor: "#12000A",
          foregroundColor: "#FFE1F2",
        },
        overrides: {
          "paneProperties.background": "#12000A",
          "paneProperties.backgroundType": "solid",
          "paneProperties.vertGridProperties.color": "rgba(86, 55, 72, 0.2)",
          "paneProperties.horzGridProperties.color": "rgba(86, 55, 72, 0.2)",
          "scalesProperties.textColor": "#A77590",
          "scalesProperties.lineColor": "#3A2530",
          "scalesProperties.backgroundColor": "#12000A",
          "mainSeriesProperties.candleStyle.upColor": "#00E396",
          "mainSeriesProperties.candleStyle.downColor": "#FF4560",
          "mainSeriesProperties.candleStyle.borderUpColor": "#00E396",
          "mainSeriesProperties.candleStyle.borderDownColor": "#FF4560",
          "mainSeriesProperties.candleStyle.wickUpColor": "#00E396",
          "mainSeriesProperties.candleStyle.wickDownColor": "#FF4560",
          "volumePaneSize": "medium",
        },
        custom_css_url: "branding_custom.css",
      };

      const tvWidget = new widget(widgetOptions);
      if (!isMountedRef.current || requestId !== initRequestIdRef.current) {
        tvWidget.remove?.();
        return;
      }
      widgetRef.current = tvWidget;

      tvWidget.onChartReady(() => {
        if (
          !isMountedRef.current ||
          requestId !== initRequestIdRef.current ||
          widgetRef.current !== tvWidget
        ) {
          tvWidget.remove?.();
          return;
        }
        console.log('[TradingChart] Chart is ready');
        setIsChartReady(true);

        if (tvWidget.chart().symbol() !== symbol) {
          tvWidget.chart().setSymbol(symbol, () => {
            console.log('[TradingChart] Symbol corrected to', symbol);
          });
        }

        tvWidget.applyOverrides({
          "paneProperties.background": "#12000A",
          "paneProperties.backgroundType": "solid",
          "paneProperties.vertGridProperties.color": "rgba(86, 55, 72, 0.2)",
          "paneProperties.horzGridProperties.color": "rgba(86, 55, 72, 0.2)",
          "scalesProperties.textColor": "#A77590",
          "scalesProperties.lineColor": "#3A2530",
          "scalesProperties.backgroundColor": "#12000A",
        });
      });
    } catch (error) {
      if (requestId !== initRequestIdRef.current) return;
      console.error("[TradingChart] Failed to load widget:", error);
      hasInitialized.current = false; // Allow retry
      if (isMountedRef.current) {
        setIsChartReady(false);
      }
    }
  };

  // Update symbol when prop changes
  useEffect(() => {
    if (!isChartReady || !widgetRef.current) return;

    try {
      const chart = widgetRef.current.chart();
      if (chart && chart.symbol() !== symbol) {
        console.log('[TradingChart] Symbol changed from props, updating widget to', symbol);
        chart.setSymbol(symbol, () => {
          console.log('[TradingChart] Widget symbol updated successfully');
        });
      }
    } catch (e) {
      console.error('[TradingChart] Failed to update symbol:', e);
    }
  }, [symbol, isChartReady]);

  // Update interval when prop changes
  useEffect(() => {
    if (!isChartReady || !widgetRef.current) return;

    try {
      const chart = widgetRef.current.chart();
      if (chart && chart.resolution() !== interval) {
        console.log('[TradingChart] Interval changed from props, updating widget to', interval);
        chart.setResolution(interval, () => {
          console.log('[TradingChart] Widget interval updated successfully');
        });
      }
    } catch (e) {
      console.error('[TradingChart] Failed to update interval:', e);
    }
  }, [interval, isChartReady]);

  // Recreate widget when source changes (datafeed can't be hot-swapped)
  useEffect(() => {
    if (!widgetRef.current) return;

    console.log('[TradingChart] Source changed, need to recreate widget');
    cleanupWidget('source change');
    beginInitialization(100);
  }, [source]);

  // Handle resize events
  useEffect(() => {
    if (!isChartReady) return;

    const handleResize = () => {
      // TradingView widget has autosize: true, so dispatching resize event helps
      window.dispatchEvent(new Event('resize'));
    };

    // Debounced resize handler
    let resizeTimeout: ReturnType<typeof setTimeout>;
    const debouncedResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(handleResize, 150);
    };

    const container = chartContainerRef.current;
    if (container) {
      const resizeObserver = new ResizeObserver(debouncedResize);
      resizeObserver.observe(container);

      return () => {
        clearTimeout(resizeTimeout);
        resizeObserver.disconnect();
      };
    }
  }, [isChartReady]);

  return (
    <div
      id="tv_chart_wrapper"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: height,
        width: '100%',
        backgroundColor: '#12000A'
      }}>
      <div
        style={{
          flex: 1,
          width: '100%',
          position: 'relative'
        }}
      >
        <div
          id="tv_chart_container"
          ref={chartContainerRef}
          style={{
            width: '100%',
            height: '100%',
            position: 'absolute',
            top: 0,
            left: 0
          }}
        />

        {!isChartReady && (
          <div
            className="skeleton skeletonChart"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <div
              style={{
                width: '50px',
                height: '50px',
                border: '3px solid #3A2530',
                borderTop: '3px solid #FFE1F2',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default TVChartContainer;
