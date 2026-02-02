import React from 'react';
import styles from './Portfolio.module.css';
import PortfolioPositions from './PortfolioPositions';
import PortfolioChart from './PortfolioChart';


import { usePortfolioStore } from '../../store/usePortfolioStore';
import { useWallet } from '../../hooks/useWallet';

const Overview: React.FC = () => {
    const { summary, isLoading } = usePortfolioStore();
    const { authenticated, walletAddress } = useWallet();

    // Derive explicit values from summary or use defaults
    const accountValue = summary?.account_value ?? 0;
    const freeCollateral = summary?.free_collateral ?? 0;
    const positionMargin = summary?.total_margin_used ?? 0;
    const marginUsage = summary?.margin_usage ?? 0;
    const leverage = summary?.leverage ?? 0;

    const hasTradingHistory = !!summary; // Basic check

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

    return (
        <div className={styles.overviewContainer}>
            {/* Portfolio Value Header */}
            <div style={{ marginBottom: '24px' }}>
                <div className={styles.sectionTitle}>Portfolio Value</div>
                <div className={styles.balanceValue} style={{ fontSize: '32px', marginTop: '8px' }}>
                    {isLoading ? <span style={{ fontSize: '24px', opacity: 0.5 }}>Loading...</span> : formatVal(accountValue)}
                </div>

                <div className={styles.legendContainer}>
                    <div className={styles.legendItem}>
                        <div className={styles.colorDot} style={{ backgroundColor: '#8B8B9B' }}></div>
                        <div className={styles.legendText}>
                            <div className={styles.legendValue}>{formatVal(freeCollateral)}</div>
                            <div className={styles.legendLabel}>Free Collateral</div>
                        </div>
                    </div>
                    <div className={styles.legendItem}>
                        <div className={styles.colorDot} style={{ backgroundColor: '#F2C94C' }}></div>
                        <div className={styles.legendText}>
                            <div className={styles.legendValue}>{formatVal(positionMargin)}</div>
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
                            <div className={styles.balanceValue}>{formatVal(accountValue)}</div>
                            <div style={{ color: '#A77590', fontSize: '12px' }}>
                                Buying Power: {formatVal(accountValue * 10)}
                            </div>
                        </div>
                    </div>

                    <div className={styles.tradingAccountBottom}>
                        <div className={styles.bottomStatBox}>
                            <span className={styles.cardTitle}>Margin Usage</span>
                            <span className={styles.statVal}>{formatPercent(marginUsage)}</span>
                        </div>
                        <div className={styles.bottomStatBox}>
                            <span className={styles.cardTitle}>Leverage</span>
                            <span className={styles.statVal}>{formatLeverage(leverage)}</span>
                        </div>
                    </div>
                </div>

                {/* Right Side: Graph */}
                <div className={styles.graphSection} style={{ overflow: 'hidden' }}>
                    <PortfolioChart />
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
