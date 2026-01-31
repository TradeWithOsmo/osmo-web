import React, { useState, useMemo } from 'react';
import styles from './Portfolio.module.css';
import panelStyles from '../Positions/PositionsPanel.module.css';

const FEE_TIERS = [
    { tier: 1, you: true, volume: '≥ $0', cond: '—', maker: '0.010%', taker: '0.050%' },
    { tier: 2, volume: '≥ $1M', cond: '—', maker: '0.010%', taker: '0.045%' },
    { tier: 3, volume: '≥ $5M', cond: '—', maker: '0.005%', taker: '0.040%' },
    { tier: 4, volume: '≥ $25M', cond: '—', maker: '0.000%', taker: '0.035%' },
    { tier: 5, volume: '≥ $50M', cond: '—', maker: '0.000%', taker: '0.030%' },
    { tier: 6, volume: '≥ $100M', cond: '—', maker: '-0.007%', taker: '0.025%' },
    { tier: 7, volume: '≥ $200M', cond: '—', maker: '-0.011%', taker: '0.025%' },
    { tier: 8, volume: '≥ $500M', cond: '—', maker: '-0.015%', taker: '0.022%' },
    { tier: 9, volume: '≥ $1B', cond: '—', maker: '-0.018%', taker: '0.020%' },
    { tier: 10, volume: '≥ $2B', cond: '—', maker: '-0.020%', taker: '0.018%' },
    { tier: 11, volume: '≥ $5B', cond: '—', maker: '-0.022%', taker: '0.016%' },
    { tier: 12, volume: '≥ $10B', cond: '—', maker: '-0.025%', taker: '0.015%' },
    { tier: 13, volume: '≥ $20B', cond: '—', maker: '-0.027%', taker: '0.014%' },
    { tier: 14, volume: '≥ $50B', cond: '—', maker: '-0.030%', taker: '0.013%' },
    { tier: 15, volume: '≥ $100B', cond: '—', maker: '-0.032%', taker: '0.012%' },
    { tier: 16, volume: '≥ $200B', cond: '—', maker: '-0.035%', taker: '0.011%' },
    { tier: 17, volume: '≥ $500B', cond: '—', maker: '-0.038%', taker: '0.010%' },
];

const FeeTierRow: React.FC<{ tier: any }> = ({ tier }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <React.Fragment>
            {/* Desktop Row */}
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
                <td className={panelStyles.td} style={{ textAlign: 'right' }}>
                    <span style={{ color: tier.maker.startsWith('-') ? '#00E396' : '#FFE1F2' }}>
                        {tier.maker}
                    </span>
                </td>
                <td className={panelStyles.td} style={{ textAlign: 'right' }}>{tier.taker}</td>
            </tr>

            {/* Mobile Row */}
            <tr className={`${panelStyles.row} ${panelStyles.mobileRow}`}>
                <td className={panelStyles.td} colSpan={100}>
                    <div className={panelStyles.mobileCard}>
                        <div className={panelStyles.mobileHeader} onClick={() => setIsExpanded(!isExpanded)}>
                            <div className={panelStyles.mobileHeaderContent}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    <span style={{ fontSize: '12px', color: '#A77590' }}>Tier</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '14px', fontWeight: 700, color: '#FFE1F2' }}>{tier.tier}</span>
                                        {tier.you && (
                                            <span style={{
                                                backgroundColor: '#3A2530',
                                                color: '#A77590',
                                                padding: '2px 6px',
                                                borderRadius: '4px',
                                                fontSize: '10px',
                                                textTransform: 'uppercase'
                                            }}>You</span>
                                        )}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    <span style={{ fontSize: '12px', color: '#A77590' }}>Maker</span>
                                    <span style={{ fontSize: '13px', color: tier.maker.startsWith('-') ? '#00E396' : '#FFE1F2' }}>{tier.maker}</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    <span style={{ fontSize: '12px', color: '#A77590' }}>Taker</span>
                                    <span style={{ fontSize: '13px', color: '#FFE1F2' }}>{tier.taker}</span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', color: '#A77590' }}>
                                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                        </div>

                        {isExpanded && (
                            <div className={panelStyles.mobileDetails}>
                                <div className={panelStyles.mobileDetailRow} style={{ borderBottom: 'none' }}>
                                    <span className={panelStyles.mobileLabel}>Volume (30d)</span>
                                    <span className={panelStyles.mobileValue}>{tier.volume}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </td>
            </tr>
        </React.Fragment>
    );
};

const PortfolioFees: React.FC = () => {
    const [sortBy, setSortBy] = useState<string>('default');
    const [isSortOpen, setIsSortOpen] = useState(false);

    const toggleSort = () => setIsSortOpen(!isSortOpen);

    const displayedData = useMemo(() => {
        let result = [...FEE_TIERS];
        // Sort
        if (sortBy === 'maker') {
            result.sort((a, b) => parseFloat(a.maker) - parseFloat(b.maker));
        } else if (sortBy === 'taker') {
            result.sort((a, b) => parseFloat(a.taker) - parseFloat(b.taker));
        }
        return result;
    }, [sortBy]);

    return (
        <div style={{ paddingBottom: '32px' }}>
            {/* Title */}
            <div className={styles.sectionTitle}>Fees</div>

            <div className={panelStyles.tableContainer} style={{ background: '#12000A', border: '1px solid #3A2530', borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: 'auto', maxHeight: 'calc(100vh - 220px)', minHeight: 0 }}>

                {/* Controls - Same style as History/Leaderboard */}
                <div className={panelStyles.controlsContainer} style={{ padding: '16px', borderBottom: '1px solid #3A2530', marginBottom: 0 }}>
                    <div className={panelStyles.controlsLeft}>
                        {/* Sort Dropdown */}
                        <div className={panelStyles.dropdownContainer}>
                            <button
                                className={`${panelStyles.dropdownButton} ${isSortOpen ? panelStyles.active : ''}`}
                                onClick={toggleSort}
                            >
                                Sort by <span style={{ color: '#FFE1F2' }}>
                                    {sortBy === 'default' ? 'Tier' : sortBy === 'maker' ? 'Maker Fee' : 'Taker Fee'}
                                </span>
                                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transition: 'transform 0.2s', marginLeft: '6px', transform: isSortOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                                    <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                            {isSortOpen && (
                                <div className={panelStyles.dropdownMenu}>
                                    <button className={`${panelStyles.dropdownItem}`} onClick={() => { setSortBy('default'); setIsSortOpen(false); }}>Tier</button>
                                    <button className={`${panelStyles.dropdownItem}`} onClick={() => { setSortBy('maker'); setIsSortOpen(false); }}>Maker Fee</button>
                                    <button className={`${panelStyles.dropdownItem}`} onClick={() => { setSortBy('taker'); setIsSortOpen(false); }}>Taker Fee</button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Visual filler for right side alignment if needed */}
                    <div className={panelStyles.actionButtons}></div>

                </div>

                <div className={panelStyles.tableWrapper}>
                    <table className={panelStyles.table}>
                        <thead className={panelStyles.th}>
                            <tr>
                                <th className={panelStyles.th} style={{ textAlign: 'left' }}>Tier</th>
                                <th className={panelStyles.th} style={{ textAlign: 'right' }}>Volume (30d)</th>
                                <th className={panelStyles.th} style={{ textAlign: 'right' }}>Maker</th>
                                <th className={panelStyles.th} style={{ textAlign: 'right' }}>Taker</th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayedData.length > 0 ? (
                                displayedData.map((item: any) => (
                                    <FeeTierRow key={item.tier} tier={item} />
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} style={{ textAlign: 'center', padding: '48px', color: '#A77590' }}>
                                        No fee tiers found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default PortfolioFees;
