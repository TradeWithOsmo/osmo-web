import React from 'react';
import styles from '../Portfolio/Portfolio.module.css'; // Reusing Portfolio styles
import UsageChart from './UsageChart';
import UsageHistoryTable from './UsageHistoryTable';

const Overview: React.FC = () => {
    // Mock values as per request
    const creditValue = 0.00;
    const tokensValue = 0.00;
    const spendValue = 0.00;
    const totalRequest = 0;

    const formatVal = (val: number, prefix = '$', suffix = '') => {
        return `${prefix}${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${suffix}`;
    };

    return (
        <div className={styles.overviewContainer}>
            {/* Portfolio Value Section (Renamed to Credit) */}
            <div style={{ marginBottom: '0px' }}>
                <div className={styles.sectionTitle}>Credit</div>
                <div className={styles.balanceValue} style={{ fontSize: '32px', marginTop: '8px' }}>
                    {formatVal(creditValue)}
                </div>


            </div>

            {/* Account Grid */}
            <div className={styles.accountGrid}>
                {/* Left Side: Trading Account (Renamed to Credit) */}
                <div className={styles.tradingAccountParams}>
                    <div className={styles.tradingAccountTop}>
                        <div className={styles.cardTitle}>Credit</div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div className={styles.balanceValue}>{formatVal(creditValue)}</div>
                            <div style={{ color: '#A77590', fontSize: '12px' }}>
                                Tokens: {formatVal(tokensValue, '', '')}
                            </div>
                        </div>
                    </div>

                    <div className={styles.tradingAccountBottom}>
                        <div className={styles.bottomStatBox}>
                            <span className={styles.cardTitle}>Total Request</span>
                            <span className={styles.statVal}>{totalRequest}</span>
                        </div>
                        <div className={styles.bottomStatBox}>
                            <span className={styles.cardTitle}>Spend</span>
                            <span className={styles.statVal}>{formatVal(spendValue)}</span>
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
