import React, { useEffect } from 'react';
import styles from './Portfolio.module.css';
import PortfolioPositions from './PortfolioPositions';
import PortfolioChart from './PortfolioChart';
import { usePortfolioStore } from '../../store/usePortfolioStore';
import { useWallet } from '../../hooks';

const Overview: React.FC = () => {
    const { summary, fetchPositions, positions } = usePortfolioStore();
    const { walletAddress, authenticated } = useWallet();

    useEffect(() => {
        if (authenticated && walletAddress) {
            fetchPositions(walletAddress);
        }
    }, [authenticated, walletAddress, fetchPositions]);

    // Check if user has ever traded (has positions or trading history)
    const hasTradingHistory = positions && positions.length > 0;

    const formatVal = (val: number | undefined, prefix = '$', suffix = '') => {
        // If not authenticated → show "-"
        if (!authenticated || !walletAddress) return '-';

        // If authenticated but value is undefined/null → show "$0.00"
        if (val === undefined || val === null) return `${prefix}0.00${suffix}`;

        // Show actual value
        return `${prefix}${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${suffix}`;
    };

    const formatLeverage = (val: number | undefined) => {
        // Show "-" if not authenticated OR no trading history
        if (!authenticated || !walletAddress || !hasTradingHistory) return '-';

        if (val === undefined || val === null) return '-';
        return `${val.toFixed(1)}x`;
    };

    const formatPercent = (val: number | undefined) => {
        // Show "-" if not authenticated OR no trading history
        if (!authenticated || !walletAddress || !hasTradingHistory) return '-';

        if (val === undefined || val === null) return '-';
        return `${val.toFixed(0)}%`;
    };

    // Check if user has balance
    const hasBalance = authenticated && walletAddress && summary && summary.account_value > 0;

    return (
        <div className={styles.overviewContainer}>
            {/* Portfolio Value Header */}
            <div style={{ marginBottom: '24px' }}>
                <div className={styles.sectionTitle}>Portfolio Value</div>
                <div className={styles.balanceValue} style={{ fontSize: '32px', marginTop: '8px' }}>
                    {formatVal(summary?.account_value)}
                </div>

                <div className={styles.legendContainer}>
                    <div className={styles.legendItem}>
                        <div className={styles.colorDot} style={{ backgroundColor: '#8B8B9B' }}></div>
                        <div className={styles.legendText}>
                            <div className={styles.legendValue}>{formatVal(summary?.free_collateral)}</div>
                            <div className={styles.legendLabel}>Free Collateral</div>
                        </div>
                    </div>
                    <div className={styles.legendItem}>
                        <div className={styles.colorDot} style={{ backgroundColor: '#F2C94C' }}></div>
                        <div className={styles.legendText}>
                            <div className={styles.legendValue}>{formatVal(summary?.total_margin_used)}</div>
                            <div className={styles.legendLabel}>Position Margin</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Account Grid */}
            <div className={styles.accountGrid}>
                {/* Left Side: Trading Account */}
                <div className={styles.tradingAccountParams}>
                    <div className={styles.tradingAccountTop}>
                        <div className={styles.cardTitle}>Trading Account</div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div className={styles.balanceValue}>{formatVal(summary?.account_value)}</div>
                            <div style={{ color: '#A77590', fontSize: '12px' }}>
                                Buying Power: {formatVal(summary ? summary.account_value * 10 : undefined)}
                            </div>
                        </div>
                    </div>

                    <div className={styles.tradingAccountBottom}>
                        <div className={styles.bottomStatBox}>
                            <span className={styles.cardTitle}>Margin Usage</span>
                            <span className={styles.statVal}>{formatPercent(summary?.margin_usage)}</span>
                        </div>
                        <div className={styles.bottomStatBox}>
                            <span className={styles.cardTitle}>Leverage</span>
                            <span className={styles.statVal}>{formatLeverage(summary?.leverage)}</span>
                        </div>
                    </div>
                </div>

                {/* Right Side: Graph */}
                <div className={styles.graphSection} style={{ overflow: 'hidden' }}>
                    {!authenticated || !walletAddress || !hasBalance ? (
                        <div style={{
                            textAlign: 'center',
                            padding: '80px 24px',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            color: '#A77590'
                        }}>
                            <div style={{ fontSize: '14px' }}>
                                {!authenticated || !walletAddress
                                    ? 'Connect your wallet to deposit funds & start trading.'
                                    : 'Deposit funds & start trading.'}
                            </div>
                        </div>
                    ) : (
                        <PortfolioChart userAddress={walletAddress} />
                    )}
                </div>
            </div>

            {/* Open Positions Section */}
            <div>
                <PortfolioPositions />
            </div>
        </div>
    );
};

export default Overview;
