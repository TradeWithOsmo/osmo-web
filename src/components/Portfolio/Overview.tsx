import React from 'react';
import styles from './Portfolio.module.css';
import PortfolioPositions from './PortfolioPositions';
import PortfolioChart from './PortfolioChart';


import { usePortfolioStore } from '../../store/usePortfolioStore';
import { useWallet } from '../../hooks/useWallet';
import { onchainService } from '../../api/onchainService';

const Overview: React.FC = () => {
    const { summary, onchainBalances, isLoading } = usePortfolioStore();
    const { authenticated, walletAddress } = useWallet();
    const tradingExchange = String(import.meta.env.VITE_TRADING_EXCHANGE || 'simulation').toLowerCase();
    const isSimulation = tradingExchange === 'simulation';
    const [freeCollateralMode, setFreeCollateralMode] = React.useState<'sim' | 'real'>(isSimulation ? 'sim' : 'real');
    const [positionMarginMode, setPositionMarginMode] = React.useState<'sim' | 'real'>(isSimulation ? 'sim' : 'real');
    const [directOnchainBalances, setDirectOnchainBalances] = React.useState<{
        trading: number;
        reserved: number;
        available: number;
        ai: number;
    } | null>(null);

    React.useEffect(() => {
        if (!walletAddress || !authenticated) {
            setDirectOnchainBalances(null);
            return;
        }

        let cancelled = false;
        const fetchOnchain = async () => {
            try {
                const balances = await onchainService.getVaultBalances(walletAddress);
                if (!cancelled) setDirectOnchainBalances(balances);
            } catch (error) {
                if (!cancelled) console.error('Overview on-chain balance fetch failed:', error);
            }
        };

        void fetchOnchain();
        const timer = window.setInterval(fetchOnchain, 10_000);
        return () => {
            cancelled = true;
            window.clearInterval(timer);
        };
    }, [walletAddress, authenticated]);

    // Derive explicit values from summary or use defaults
    const accountValue = summary?.account_value ?? 0;
    const simFreeCollateral = summary?.free_collateral ?? 0;
    const simPositionMargin = summary?.total_margin_used ?? 0;
    const effectiveOnchainBalances = directOnchainBalances ?? onchainBalances;
    const realFreeCollateral = effectiveOnchainBalances?.available ?? 0;
    const realPositionMargin = effectiveOnchainBalances?.reserved ?? 0;
    const freeCollateral = freeCollateralMode === 'real' ? realFreeCollateral : simFreeCollateral;
    const positionMargin = positionMarginMode === 'real' ? realPositionMargin : simPositionMargin;
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
                    {isLoading && accountValue === 0 ? <span style={{ fontSize: '24px', opacity: 0.5 }}>Loading...</span> : formatVal(accountValue)}
                </div>

                <div className={styles.legendContainer}>
                    <div className={styles.legendItem}>
                        <div className={styles.colorDot} style={{ backgroundColor: '#8B8B9B' }}></div>
                        <div className={styles.legendText}>
                            <div className={styles.legendValue}>{formatVal(freeCollateral)}</div>
                            <div className={styles.legendLabelRow}>
                                <div className={styles.legendLabel}>
                                    {`Free Collateral (${freeCollateralMode === 'real' ? 'Real' : 'Sim'})`}
                                </div>
                                {isSimulation && (
                                    <select
                                        className={styles.legendSelect}
                                        value={freeCollateralMode}
                                        onChange={(e) => setFreeCollateralMode(e.target.value as 'sim' | 'real')}
                                    >
                                        <option value="sim">Sim</option>
                                        <option value="real">Real</option>
                                    </select>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className={styles.legendItem}>
                        <div className={styles.colorDot} style={{ backgroundColor: '#F2C94C' }}></div>
                        <div className={styles.legendText}>
                            <div className={styles.legendValue}>{formatVal(positionMargin)}</div>
                            <div className={styles.legendLabelRow}>
                                <div className={styles.legendLabel}>
                                    {`Position Margin (${positionMarginMode === 'real' ? 'Real' : 'Sim'})`}
                                </div>
                                {isSimulation && (
                                    <select
                                        className={styles.legendSelect}
                                        value={positionMarginMode}
                                        onChange={(e) => setPositionMarginMode(e.target.value as 'sim' | 'real')}
                                    >
                                        <option value="sim">Sim</option>
                                        <option value="real">Real</option>
                                    </select>
                                )}
                            </div>
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
