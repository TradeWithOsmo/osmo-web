import React, { useEffect } from 'react';
import styles from '../Portfolio/Portfolio.module.css'; // Reusing Portfolio styles
import UsageChart from './UsageChart';
import UsageHistoryTable from './UsageHistoryTable';

import { useUsageStore } from '../../store/useUsageStore';
import { useWallet } from '../../hooks/useWallet';

const Overview: React.FC = () => {
    const { walletAddress } = useWallet();
    const { stats, fetchStats } = useUsageStore();

    useEffect(() => {
        if (walletAddress) {
            fetchStats(walletAddress);
        }
    }, [walletAddress, fetchStats]);

    useEffect(() => {
        if (!walletAddress) return;
        const id = window.setInterval(() => {
            void fetchStats(walletAddress);
        }, 10000);
        return () => window.clearInterval(id);
    }, [walletAddress, fetchStats]);

    const formatMoney = (val: number, prefix = '$') => {
        const amount = Number.isFinite(val) ? val : 0;
        const abs = Math.abs(amount);
        const decimals = abs >= 1 ? 2 : abs >= 0.01 ? 4 : 6;
        return `${prefix}${amount.toLocaleString(undefined, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        })}`;
    };

    const formatTokens = (val: number) => {
        const amount = Number.isFinite(val) ? val : 0;
        return amount.toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });
    };

    return (
        <div className={styles.overviewContainer}>
            {/* Portfolio Value Section (Renamed to Credit) */}
            <div style={{ marginBottom: '0px' }}>
                <div className={styles.sectionTitle}>Credit</div>
                <div className={styles.balanceValue} style={{ fontSize: '32px', marginTop: '8px' }}>
                    {formatMoney(stats.credit_balance)}
                </div>
            </div>

            {/* Account Grid */}
            <div className={styles.accountGrid}>
                {/* Left Side: Trading Account (Renamed to Credit) */}
                <div className={styles.tradingAccountParams}>
                    <div className={styles.tradingAccountTop}>
                        <div className={styles.cardTitle}>Credit Balance</div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div className={styles.balanceValue}>{formatMoney(stats.credit_balance)}</div>
                            <div style={{ color: '#A77590', fontSize: '12px' }}>
                                Tokens: {formatTokens(stats.total_tokens)}
                            </div>
                        </div>
                    </div>

                    <div className={styles.tradingAccountBottom}>
                        <div className={styles.bottomStatBox}>
                            <span className={styles.cardTitle}>Total Request</span>
                            <span className={styles.statVal}>{stats.request_count}</span>
                        </div>
                        <div className={styles.bottomStatBox}>
                            <span className={styles.cardTitle}>Spend</span>
                            <span className={styles.statVal}>{formatMoney(stats.total_cost)}</span>
                        </div>
                    </div>
                </div>

                {/* Right Side: Graph */}
                <div className={styles.graphSection} style={{ overflow: 'hidden' }}>
                    <UsageChart />
                </div>
            </div>

            {/* Usage History Table */}
            <div style={{ marginTop: '32px' }}>
                <div className={styles.sectionTitle}>Usage</div>
                <UsageHistoryTable />
            </div>
        </div>
    );
};

export default Overview;
