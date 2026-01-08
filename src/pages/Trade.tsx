import React, { useState } from 'react';
import { MarketDetails, TradingChart, OrderForm, PositionsPanel, OrderBookPanel } from '../components';
import BottomNav from '../components/BottomNav/BottomNav';
import styles from './Trade.module.css';
import Autos from './Autos';

const Trade: React.FC = () => {
    const [mobileTab, setMobileTab] = useState<'Chart' | 'Order Book' | 'Trades'>('Chart');
    const [bottomNavTab, setBottomNavTab] = useState<'market' | 'trade' | 'account'>('market');

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
                <div className={styles.topSection}>
                    <div className={styles.chartContainer}>
                        <TradingChart height="100%" />
                    </div>

                    <div className={styles.orderBookContainer}>
                        <OrderBookPanel />
                    </div>

                    <div className={styles.orderFormContainer}>
                        <OrderForm />
                    </div>
                </div>

                <div className={styles.positionsSection}>
                    <PositionsPanel />
                </div>

                {/* --- MOBILE LAYOUT --- */}
                {/* Controlled by CSS media queries */}
                <div className={styles.mobileMainContainer}>
                    {/* Trade Tab Content (Mobile) - Layout: MarketDetails, Split OrderBook/Form, Positions */
                        bottomNavTab === 'trade' && (
                            <>
                                <div style={{ flexShrink: 0 }}>
                                    <MarketDetails />
                                </div>

                                <div className={styles.tradeTabRow}>
                                    <div className={styles.orderBookContainer}>
                                        <OrderBookPanel isMobile={false} />
                                    </div>
                                    <div className={styles.orderFormContainer}>
                                        <OrderForm />
                                    </div>
                                </div>

                                <div className={styles.mobilePositionsContainer}>
                                    <PositionsPanel />
                                </div>
                            </>
                        )}

                    {/* Account Tab Content (Mobile) - Placeholder */}
                    {/* Account Tab Content (Mobile) - Autos Page */
                        bottomNavTab === 'account' && <Autos />}

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
                            </div>

                            {/* Mobile Content Switcher */}
                            <div className={styles.mobileContentArea}>
                                {mobileTab === 'Chart' && (
                                    <div className={styles.chartContainer}>
                                        <TradingChart height="100%" />
                                    </div>
                                )}
                                {mobileTab === 'Order Book' && (
                                    <div className={styles.orderBookContainer}>
                                        <OrderBookPanel forcedTab="Order Book" isMobile={true} />
                                    </div>
                                )}
                                {mobileTab === 'Trades' && (
                                    <div className={styles.orderBookContainer}>
                                        <OrderBookPanel forcedTab="Trades" isMobile={true} />
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
