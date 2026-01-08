import React from 'react';
import styles from './Portfolio.module.css';
import PortfolioPositions from './PortfolioPositions';
import PortfolioChart from './PortfolioChart';

const Overview: React.FC = () => {
    const [timeframe, setTimeframe] = React.useState<'1D' | '7D' | '30D' | 'All'>('1D');

    return (
        <div className={styles.overviewContainer}>
            {/* Portfolio Value Header (No Chart Here) */}
            <div style={{ marginBottom: '24px' }}>
                <div className={styles.sectionTitle}>Portfolio Value</div>
                <div className={styles.balanceValue} style={{ fontSize: '32px', marginTop: '8px' }}>
                    $14,350.25
                </div>

                <div className={styles.legendContainer}>
                    <div className={styles.legendItem}>
                        <div className={styles.colorDot} style={{ backgroundColor: '#8B8B9B' }}></div>
                        <div className={styles.legendText}>
                            <div className={styles.legendValue}>$8,500.25</div>
                            <div className={styles.legendLabel}>Free Collateral</div>
                        </div>
                    </div>
                    <div className={styles.legendItem}>
                        <div className={styles.colorDot} style={{ backgroundColor: '#F2C94C' }}></div>
                        <div className={styles.legendText}>
                            <div className={styles.legendValue}>$1,250.00</div>
                            <div className={styles.legendLabel}>Position Margin</div>
                        </div>
                    </div>


                </div>
            </div>

            {/* Account Grid */}
            {/* Account Grid - Merged Container */}
            <div className={styles.accountGrid}>
                {/* Left Side: Trading Account */}
                <div className={styles.tradingAccountParams}>
                    <div className={styles.tradingAccountTop}>
                        <div className={styles.cardTitle}>Trading Account</div>

                        {/* Dummy Balance Data */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div className={styles.balanceValue}>$14,350.25</div>
                            <div style={{ color: '#A77590', fontSize: '12px' }}>
                                Buying Power: $57,401.00
                            </div>
                        </div>
                    </div>

                    <div className={styles.tradingAccountBottom}>
                        <div className={styles.bottomStatBox}>
                            <span className={styles.cardTitle}>Margin Usage</span>
                            <span className={styles.statVal}>12%</span>
                        </div>
                        <div className={styles.bottomStatBox}>
                            <span className={styles.cardTitle}>Leverage</span>
                            <span className={styles.statVal}>4.5x</span>
                        </div>
                    </div>
                </div>

                {/* Right Side: Graph */}
                <div className={styles.graphSection} style={{ overflow: 'hidden' }}>
                    {/* Replaced Dummy SVG with TradingView-based PortfolioChart */}
                    <PortfolioChart height="100%" timeframe={timeframe} />

                    <div style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', gap: '4px', zIndex: 20 }}>
                        {(['1D', '7D', '30D', 'All'] as const).map((tf) => (
                            <div
                                key={tf}
                                className={`${styles.timeframeBtn} ${timeframe === tf ? styles.active : ''}`}
                                onClick={() => setTimeframe(tf)}
                                style={{ position: 'static' }}
                            >
                                {tf}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Open Positions Section */}
            <div>
                {/* Use the shared component to show dummy positions */}
                <PortfolioPositions />
            </div>
        </div>
    );
};

export default Overview;
