import React, { useState } from 'react';
import { MarketDetails, TradingChart, OrderForm, PositionsPanel, OrderBookPanel } from '../components';
import BottomNav from '../components/BottomNav/BottomNav';
import styles from './Trade.module.css';
import Autos from './Autos';
import { useMarketStore } from '../store/useMarketStore';

const Trade: React.FC = () => {
    const { selectedMarket } = useMarketStore();
    const [mobileTab, setMobileTab] = useState<'Chart' | 'Order Book' | 'Trades'>('Chart');
    const [bottomNavTab, setBottomNavTab] = useState<'market' | 'trade' | 'account'>('market');

    const chartSymbol = selectedMarket?.symbol?.replace('-', '/') || 'BTC/USDT';
    const chartSource = selectedMarket?.source || 'hyperliquid'; // Derive source from market

    // Placeholder component for Trade tab


    // Placeholder component for Account tab


    return (
        <div className={styles.pageContainer}>
            {/* Show MarketDetails only when on Markets tab */}
            {bottomNavTab === 'market' && <MarketDetails />}

            {/* Main Content Area */}
            <div className={styles.mainContent}>

                {/* --- DESKTOP LAYOUT --- */}
                {/* Controlled by CSS media queries */}
                <div className={styles.contentWrapper}>
                    {/* Left Column: Top Row (Chart + Book) and Bottom Row (Positions) */}
                    <div className={styles.leftColumn}>
                        <div className={styles.topRow}>
                            <div className={styles.chartContainer}>
                                <TradingChart symbol={chartSymbol} source={chartSource} height="100%" />
                            </div>

                            {chartSource !== 'ostium' && (
                                <div className={styles.orderBookContainer}>
                                    <OrderBookPanel />
                                </div>
                            )}
                        </div>

                        <div className={styles.positionsSection}>
                            <PositionsPanel />
                        </div>
                    </div>

                    {/* Right Column: Order Form (Full Height) */}
                    <div className={styles.orderFormContainer}>
                        <OrderForm />
                    </div>
                </div>

                {/* --- MOBILE LAYOUT --- */}
                {/* Controlled by CSS media queries */}
                <div className={styles.mobileMainContainer}>
                    {/* Trade Tab Content (Mobile) */}
                    {bottomNavTab === 'trade' && (
                        <>
                            <div style={{ flexShrink: 0 }}>
                                <MarketDetails />
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
