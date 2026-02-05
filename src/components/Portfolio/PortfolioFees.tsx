import React from 'react';
import styles from './Portfolio.module.css';
import panelStyles from '../Positions/PositionsPanel.module.css';

const TRADING_FEE_TIERS = [
    { tier: 1, you: true, volume: '≥ $0', maker: '0.100%', taker: '0.500%' },
    { tier: 2, volume: '≥ $1M', maker: '0.080%', taker: '0.450%' },
    { tier: 3, volume: '≥ $5M', maker: '0.060%', taker: '0.400%' },
    { tier: 4, volume: '≥ $10M', maker: '0.040%', taker: '0.350%' },
    { tier: 5, volume: '≥ $50M', maker: '0.020%', taker: '0.300%' },
];

const FeeTierRow: React.FC<{ tier: any }> = ({ tier }) => {
    return (
        <React.Fragment>
            <tr className={`${panelStyles.row} ${panelStyles.desktopRow}`}>
                <td className={panelStyles.td} style={{ textAlign: 'left' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{tier.tier}</span>
                        {tier.you && (
                            <span style={{
                                backgroundColor: '#3A2530',
                                color: '#A77590',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                textTransform: 'uppercase'
                            }}>You</span>
                        )}
                    </div>
                </td>
                <td className={panelStyles.td} style={{ textAlign: 'right' }}>{tier.volume}</td>
                <td className={panelStyles.td} style={{ textAlign: 'right' }}>{tier.maker}</td>
                <td className={panelStyles.td} style={{ textAlign: 'right' }}>{tier.taker}</td>
            </tr>
            <tr className={`${panelStyles.row} ${panelStyles.mobileRow}`}>
                <td className={panelStyles.td} colSpan={100}>
                    <div className={panelStyles.mobileCard}>
                        <div className={panelStyles.mobileHeader} style={{ cursor: 'default' }}>
                            <div className={panelStyles.mobileHeaderContent}>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontSize: '12px', color: '#A77590' }}>Tier {tier.tier}</span>
                                    <span style={{ fontSize: '13px', color: '#FFE1F2' }}>{tier.volume}</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'right' }}>
                                    <span style={{ fontSize: '12px', color: '#A77590' }}>Taker</span>
                                    <span style={{ fontSize: '13px', color: '#FFE1F2' }}>{tier.taker}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </td>
            </tr>
        </React.Fragment>
    );
};

const PortfolioFees: React.FC = () => {
    return (
        <div className={styles.feesLayout} style={{ paddingBottom: '32px' }}>
            {/* Trading Fees Section */}
            <div>
                <div className={styles.sectionTitle}>Trading Fees</div>
                <div className={panelStyles.tableContainer} style={{ background: '#12000A', border: '1px solid #3A2530', borderRadius: '12px', overflow: 'hidden' }}>
                    <div className={panelStyles.tableWrapper}>
                        <table className={panelStyles.table}>
                            <thead className={`${panelStyles.th} ${panelStyles.desktopRow}`}>
                                <tr>
                                    <th className={panelStyles.th} style={{ textAlign: 'left' }}>Tier</th>
                                    <th className={panelStyles.th} style={{ textAlign: 'right' }}>Volume (30d)</th>
                                    <th className={panelStyles.th} style={{ textAlign: 'right' }}>Maker</th>
                                    <th className={panelStyles.th} style={{ textAlign: 'right' }}>Taker</th>
                                </tr>
                            </thead>
                            <tbody style={{ borderTop: 'none' }}>
                                {TRADING_FEE_TIERS.map((item) => (
                                    <FeeTierRow key={item.tier} tier={item} />
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PortfolioFees;
