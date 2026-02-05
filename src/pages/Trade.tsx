import React, { useState } from 'react';
import { MarketDetails, TradingChart, OrderForm, PositionsPanel, OrderBookPanel, Resizer, Autos } from '../components';
import BottomNav from '../components/BottomNav/BottomNav';
import styles from './Trade.module.css';
import { useMarketStore } from '../store/useMarketStore';
import '../components/Resizer/ResizerGlobal.css'; // Import global styles for resizing (iframe fix)

const Trade: React.FC = () => {
    const { selectedMarket } = useMarketStore();
    const [mobileTab, setMobileTab] = useState<'Chart' | 'Order Book' | 'Trades'>('Chart');
    const [bottomNavTab, setBottomNavTab] = useState<'market' | 'trade' | 'account'>('market');
    const [layoutMode, setLayoutMode] = useState<'standard' | 'assist'>('standard');

    // Layout resizing state
    const [rightColWidth, setRightColWidth] = useState(320);
    const [orderBookWidth, setOrderBookWidth] = useState(300);
    const [positionsHeight, setPositionsHeight] = useState(250);
    const [assistWidthPx, setAssistWidthPx] = useState(600);
    const [isPositionsExpanded, setIsPositionsExpanded] = useState(true); // New Lifting State
    const [activeChartState, setActiveChartState] = useState<{ symbol: string; timeframe: string; indicators: string[] } | null>(null);
    const [targetChartConfig, setTargetChartConfig] = useState<{ interval?: string; studies?: string[] }>({});

    // Handler when Autos wants to restore state
    const handleRestoreChartState = (state: { interval: string; indicators: string[] }) => {
        setTargetChartConfig({
            interval: state.interval,
            studies: state.indicators
        });
    };

    // Handler when Chart reports change (Manual User Interaction) - Sync our target to keep it up to date
    const handleChartStateChange = (state: { symbol: string; timeframe: string; indicators: string[] }) => {
        setActiveChartState(state);
        setTargetChartConfig({
            interval: state.timeframe,
            studies: state.indicators
        });
    };

    const chartSymbol = selectedMarket?.symbol?.replace('-', '/') || 'BTC/USDT';
    const chartSource = selectedMarket?.source || 'hyperliquid'; // Derive source from market

    return (
        <div className={styles.pageContainer}>
            {/* Show MarketDetails only when on Markets tab */}
            {bottomNavTab === 'market' && (
                <MarketDetails
                    layoutMode={layoutMode}
                    setLayoutMode={setLayoutMode}
                />
            )}

            {/* Main Content Area */}
            <div className={styles.mainContent}>

                {/* --- DESKTOP LAYOUT --- */}
                {/* Controlled by CSS media queries */}
                <div className={styles.contentWrapper}>
                    {layoutMode === 'standard' ? (
                        <>
                            {/* Left Column: Top Row (Chart + Book) and Bottom Row (Positions) */}
                            <div className={styles.leftColumn} style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                                <div className={styles.topRow} style={{ flex: 1, display: 'flex', minHeight: 0 }}>

                                    {/* Chart */}
                                    <div className={styles.chartContainer} style={{ flex: 1, minWidth: 0 }}>
                                        <TradingChart
                                            symbol={chartSymbol}
                                            source={chartSource}
                                            height="100%"
                                            interval={targetChartConfig.interval}
                                            studies={targetChartConfig.studies}
                                            onChartStateChange={handleChartStateChange}
                                        />
                                    </div>

                                    {/* Resizer for OrderBook */}
                                    {chartSource !== 'ostium' && (
                                        <Resizer
                                            direction="horizontal"
                                            onResize={(delta) => setOrderBookWidth(prev => Math.max(220, Math.min(600, prev - delta)))}
                                        />
                                    )}

                                    {/* OrderBook */}
                                    {chartSource !== 'ostium' && (
                                        <div className={styles.orderBookContainer} style={{ width: orderBookWidth, flexShrink: 0 }}>
                                            <OrderBookPanel />
                                        </div>
                                    )}
                                </div>

                                {/* Resizer for Positions Panel - Only show if expanded (or if you want resizing to expand it, keep it shown but logic needs update. User requested 'fixed' when collapsed) */}
                                {isPositionsExpanded && (
                                    <Resizer
                                        direction="vertical"
                                        onResize={(delta) => setPositionsHeight(prev => Math.max(150, Math.min(800, prev - delta)))}
                                    />
                                )}

                                {/* Positions Panel */}
                                <div className={styles.positionsSection} style={{ height: isPositionsExpanded ? positionsHeight : 50, flexShrink: 0, overflow: 'hidden', transition: 'height 0.2s' }}>
                                    <PositionsPanel
                                        isExpanded={isPositionsExpanded}
                                        onToggle={() => setIsPositionsExpanded(!isPositionsExpanded)}
                                    />
                                </div>
                            </div>

                            {/* Resizer for Order Form */}
                            <Resizer
                                direction="horizontal"
                                onResize={(delta) => setRightColWidth(prev => Math.max(250, Math.min(500, prev - delta)))}
                            />

                            {/* Right Column: Order Form (Full Height) */}
                            <div className={styles.orderFormContainer} style={{ width: rightColWidth, flexShrink: 0 }}>
                                <OrderForm />
                            </div>
                        </>
                    ) : (
                        /* Assist Layout */
                        <div style={{ display: 'flex', width: '100%', height: '100%' }}>
                            {/* Left Side: Chart and Positions */}
                            {/* Use flex: 1 to fill remaining space */}
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, borderRight: '1px solid #3A2530' }}>
                                <div style={{ flex: 1, minHeight: 0 }}>
                                    <TradingChart
                                        symbol={chartSymbol}
                                        source={chartSource}
                                        height="100%"
                                        interval={targetChartConfig.interval}
                                        studies={targetChartConfig.studies}
                                        onChartStateChange={handleChartStateChange}
                                    />
                                </div>

                                {/* Resizer for Positions inside Assist */}
                                {isPositionsExpanded && (
                                    <Resizer
                                        direction="vertical"
                                        onResize={(delta) => setPositionsHeight(prev => Math.max(150, Math.min(800, prev - delta)))}
                                    />
                                )}

                                <div style={{ height: isPositionsExpanded ? positionsHeight : 50, flexShrink: 0, borderTop: '1px solid #3A2530', transition: 'height 0.2s' }}>
                                    <PositionsPanel
                                        isExpanded={isPositionsExpanded}
                                        onToggle={() => setIsPositionsExpanded(!isPositionsExpanded)}
                                    />
                                </div>
                            </div>

                            {/* Resizer for Assist Panel */}
                            <Resizer
                                direction="horizontal"
                                onResize={(delta) => setAssistWidthPx(prev => Math.max(500, Math.min(1200, prev - delta)))}
                            />

                            {/* Right Side: Trading Assist Module */}
                            <div style={{ width: assistWidthPx, flexShrink: 0, borderLeft: '1px solid #3A2530', backgroundColor: '#12000A', height: '100%', overflow: 'hidden' }}>
                                {/* Right Side: Trading Assist Module */}
                                <div style={{ width: assistWidthPx, flexShrink: 0, borderLeft: '1px solid #3A2530', backgroundColor: '#12000A', height: '100%', overflow: 'hidden' }}>
                                    <Autos
                                        compact={true}
                                        currentSymbol={chartSymbol}
                                        chartState={activeChartState}
                                        onRestoreChartState={handleRestoreChartState}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* --- MOBILE LAYOUT --- */}
                {/* Controlled by CSS media queries */}
                <div className={styles.mobileMainContainer}>
                    {/* Trade Tab Content (Mobile) */}
                    {bottomNavTab === 'trade' && (
                        <>
                            <div style={{ flexShrink: 0 }}>
                                <MarketDetails
                                    layoutMode={layoutMode}
                                    setLayoutMode={setLayoutMode}
                                />
                            </div>

                            <div className={styles.tradeTabRow}>
                                {chartSource !== 'ostium' && (
                                    <div className={styles.orderBookContainer}>
                                        <OrderBookPanel />
                                    </div>
                                )}
                                <div className={styles.orderFormContainer} style={{ width: chartSource === 'ostium' ? '100%' : '50%' }}>
                                    <OrderForm />
                                </div>
                            </div>

                            <div className={styles.mobilePositionsContainer}>
                                <PositionsPanel />
                            </div>
                        </>
                    )}

                    {/* Account Tab Content (Mobile) - Autos Page */}
                    {bottomNavTab === 'account' && <Autos />}

                    {/* Markets Tab Content (Mobile) - Full trading content */}
                    {bottomNavTab === 'market' && (
                        <>
                            {/* Mobile Tabs */}
                            <div className={styles.mobileTabs}>
                                <button
                                    className={`${styles.mobileTab} ${mobileTab === 'Chart' ? styles.active : ''}`}
                                    onClick={() => setMobileTab('Chart')}
                                >
                                    Chart
                                </button>
                                {chartSource !== 'ostium' && (
                                    <>
                                        <button
                                            className={`${styles.mobileTab} ${mobileTab === 'Order Book' ? styles.active : ''}`}
                                            onClick={() => setMobileTab('Order Book')}
                                        >
                                            Order Book
                                        </button>
                                        <button
                                            className={`${styles.mobileTab} ${mobileTab === 'Trades' ? styles.active : ''}`}
                                            onClick={() => setMobileTab('Trades')}
                                        >
                                            Trades
                                        </button>
                                    </>
                                )}
                            </div>

                            {/* Mobile Content Switcher */}
                            <div className={styles.mobileContentArea}>
                                {mobileTab === 'Chart' && (
                                    <div className={styles.chartContainer}>
                                        <TradingChart symbol={chartSymbol} source={chartSource} height="100%" />
                                    </div>
                                )}
                                {chartSource !== 'ostium' && mobileTab === 'Order Book' && (
                                    <div className={styles.orderBookContainer}>
                                        <OrderBookPanel key="order-book" forcedTab="Order Book" />
                                    </div>
                                )}
                                {chartSource !== 'ostium' && mobileTab === 'Trades' && (
                                    <div className={styles.orderBookContainer}>
                                        <OrderBookPanel key="trades" forcedTab="Trades" />
                                    </div>
                                )}
                            </div>

                            {/* Positions Panel Layout for Mobile */}
                            <div className={styles.mobilePositionsContainer}>
                                <PositionsPanel />
                            </div>
                        </>
                    )}
                </div>


            </div>

            {/* Bottom Navigation */}
            <div className={styles.bottomNavWrapper}>
                <BottomNav activeTab={bottomNavTab} onTabChange={setBottomNavTab} />
            </div>
        </div>
    );
};

export default Trade;
