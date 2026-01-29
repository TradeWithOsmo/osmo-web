import React, { useEffect, useRef, useState } from "react";
import "./TradingChart.css";
import { useTradingViewConnector } from "../../hooks/useTradingViewConnector";

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
}

const TVChartContainer: React.FC<TVChartContainerProps> = ({
  symbol = "BTC/USDT",
  interval = "1D",
  theme = "dark",
  height = "700px",
  hideSideToolbar = false,
  source = 'hyperliquid' // Default to hyperliquid
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<any>(null);
  const [isChartReady, setIsChartReady] = useState(false);
  const hasInitialized = useRef(false);

  // Sync data to backend when chart is ready (Hook v3.1)
  useTradingViewConnector(widgetRef.current, isChartReady);

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
        hasInitialized.current = true;
        initializeWidget();
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

  const initializeWidget = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 100));

      const TradingViewLib = (window as any).TradingView;
      if (!TradingViewLib) {
        throw new Error('TradingView library not loaded');
      }
      const { widget } = TradingViewLib;

      // Dynamically load datafeed based on source
      console.log(`[TradingChart] Loading datafeed for source: ${source}`);
      // @ts-ignore
      const Datafeed = source === 'ostium'
        ? await import('../../charting/datafeeds/Ostium/datafeed_ostium.js')
        : await import('../../charting/datafeeds/datafeed_custom.js');

      const disabledFeatures = [
        "symbol_search_hot_key",
        "header_symbol_search",
        "header_compare",
        "compare_symbol",
      ];

      if (hideSideToolbar) {
        disabledFeatures.push("left_toolbar");
      }

      const widgetOptions = {
        symbol,
        datafeed: (Datafeed as any).default,
        container: chartContainerRef.current,
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
      widgetRef.current = tvWidget;

      tvWidget.onChartReady(() => {
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
      console.error("[TradingChart] Failed to load widget:", error);
      hasInitialized.current = false; // Allow retry
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

  // Recreate widget when source changes (datafeed can't be hot-swapped)
  useEffect(() => {
    if (!isChartReady || !widgetRef.current) return;

    console.log('[TradingChart] Source changed, need to recreate widget');

    // Cleanup old widget
    if (widgetRef.current && widgetRef.current.remove) {
      widgetRef.current.remove();
      widgetRef.current = null;
    }

    // Reset state and reinitialize
    setIsChartReady(false);
    hasInitialized.current = false;

    // Reinitialize with new source
    setTimeout(() => {
      initializeWidget();
    }, 100);
  }, [source]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (widgetRef.current && widgetRef.current.remove) {
        console.log('[TradingChart] Cleanup widget');
        widgetRef.current.remove();
        widgetRef.current = null;
      }
    };
  }, []);

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