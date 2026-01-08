import React, { useState } from 'react';
import styles from './Portfolio.module.css';
import panelStyles from '../Positions/PositionsPanel.module.css';

interface LeaderboardData {
    rank: number;
    trader: string; // Address or name
    accountValue: number;
    pnl: number;
    roi: number;
    volume: number;
}

const MOCK_LEADERBOARD: LeaderboardData[] = [
    { rank: 1, trader: '0x1234...5678', accountValue: 154200.50, pnl: 45200.00, roi: 125.5, volume: 5000000 },
    { rank: 2, trader: 'whale.sol', accountValue: 890000.00, pnl: 32000.00, roi: 45.2, volume: 12000000 },
    { rank: 3, trader: 'degen_king', accountValue: 50200.00, pnl: 15000.00, roi: 305.1, volume: 2500000 },
    { rank: 4, trader: '0x8765...4321', accountValue: 210000.00, pnl: -5000.00, roi: -2.3, volume: 800000 },
    { rank: 5, trader: 'satoshi_nakamoto', accountValue: 10000000.00, pnl: 0.00, roi: 0.0, volume: 0 },
];


const SortIcon = ({ active, direction }: { active: boolean; direction: 'asc' | 'desc' }) => {
    const activeColor = '#FFE1F2';
    const inactiveColor = '#5D4050';

    return (
        <svg width="8" height="11" viewBox="0 0 10 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
                d="M5 0L9 4H1L5 0Z"
                fill={active && direction === 'asc' ? activeColor : inactiveColor}
                stroke={active && direction === 'asc' ? activeColor : inactiveColor}
                strokeWidth="1.2"
                strokeLinejoin="round"
            />
            <path
                d="M5 14L1 10H9L5 14Z"
                fill={active && direction === 'desc' ? activeColor : inactiveColor}
                stroke={active && direction === 'desc' ? activeColor : inactiveColor}
                strokeWidth="1.2"
                strokeLinejoin="round"
            />
        </svg>
    );
};


interface LeaderboardRowProps {
    item: LeaderboardData;
    index: number;
    formatCurrency: (val: number) => string;
    timeFilter: string;
    sortBy: keyof LeaderboardData | 'default';
}

const LeaderboardRow: React.FC<LeaderboardRowProps> = ({ item, index, formatCurrency, timeFilter, sortBy }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const toggleExpand = () => setIsExpanded(!isExpanded);

    // Dynamic Mobile Header Metric
    const getMobileHeaderMetric = () => {
        const key = sortBy === 'default' ? 'pnl' : sortBy;

        // Value Formatting
        let value: React.ReactNode = '';
        let color = '#FFE1F2'; // Default whiteish

        if (key === 'pnl') {
            const val = item.pnl;
            color = val >= 0 ? '#00E396' : '#FF4560';
            value = `${val >= 0 ? '+' : ''}${formatCurrency(val)}`;
        } else if (key === 'roi') {
            const val = item.roi;
            color = val >= 0 ? '#00E396' : '#FF4560';
            value = `${val >= 0 ? '+' : ''}${val}%`;
        } else if (key === 'accountValue') {
            value = formatCurrency(item.accountValue);
        } else if (key === 'volume') {
            value = formatCurrency(item.volume);
        } else {
            // Fallback
            value = item[key];
        }

        // Label
        let label = 'PNL';
        if (key === 'accountValue') label = 'Account Value';
        if (key === 'roi') label = 'ROI';
        if (key === 'volume') label = 'Volume';
        if (key === 'trader') label = 'Trader'; // Should presumably not happen as sort, but good for safety
        if (key === 'rank') label = 'Rank';

        return { label, value, color };
    };

    const { label: mobileLabel, value: mobileValue, color: mobileColor } = getMobileHeaderMetric();

    return (
        <>
            {/* Desktop Row */}
            <tr className={`${panelStyles.row} ${panelStyles.desktopRow}`}>
                <td className={panelStyles.td}>{index + 1}</td>
                <td className={panelStyles.td} style={{ color: '#FFE1F2' }}>{item.trader}</td>
                <td className={panelStyles.td}>{formatCurrency(item.accountValue)}</td>
                <td className={panelStyles.td} style={{ color: item.pnl >= 0 ? '#00E396' : '#FF4560' }}>
                    {item.pnl >= 0 ? '+' : ''}{formatCurrency(item.pnl)}
                </td>
                <td className={panelStyles.td} style={{ color: item.roi >= 0 ? '#00E396' : '#FF4560' }}>
                    {item.roi >= 0 ? '+' : ''}{item.roi}%
                </td>
                <td className={panelStyles.td}>{formatCurrency(item.volume)}</td>
            </tr>

            {/* Mobile Row */}
            <tr className={`${panelStyles.row} ${panelStyles.mobileRow}`}>
                <td className={panelStyles.td} colSpan={6}>
                    <div className={panelStyles.mobileCard}>
                        {/* Header (Always Visible) */}
                        <div className={panelStyles.mobileHeader} onClick={toggleExpand} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            {/* 1. Rank & Trader (Left) */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <span style={{ fontSize: '12px', color: '#A77590' }}>Rank {index + 1}</span>
                                <span style={{ fontWeight: 700, color: '#FFFFFF', fontSize: '14px' }}>{item.trader}</span>
                            </div>

                            {/* 2. Dynamic Metric & Arrow (Right Group) */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'flex-end' }}>
                                    <span style={{ fontSize: '12px', color: '#A77590' }}>{mobileLabel}</span>
                                    <span style={{ color: mobileColor, fontSize: '13px' }}>
                                        {mobileValue}
                                    </span>
                                </div>
                                <div style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', color: '#A77590', fontSize: '10px' }}>
                                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Expanded Details */}
                        {isExpanded && (
                            <div className={panelStyles.mobileDetails}>
                                <div className={panelStyles.mobileDetailRow}>
                                    <span className={panelStyles.mobileLabel}>Account Value</span>
                                    <span className={panelStyles.mobileValue} style={{ color: '#FFE1F2' }}>{formatCurrency(item.accountValue)}</span>
                                </div>
                                <div className={panelStyles.mobileDetailRow}>
                                    <span className={panelStyles.mobileLabel}>PNL ({timeFilter})</span>
                                    <span className={panelStyles.mobileValue} style={{ color: item.pnl >= 0 ? '#00E396' : '#FF4560' }}>
                                        {item.pnl >= 0 ? '+' : ''}{formatCurrency(item.pnl)}
                                    </span>
                                </div>
                                <div className={panelStyles.mobileDetailRow}>
                                    <span className={panelStyles.mobileLabel}>ROI ({timeFilter})</span>
                                    <span className={panelStyles.mobileValue} style={{ color: item.roi >= 0 ? '#00E396' : '#FF4560' }}>
                                        {item.roi >= 0 ? '+' : ''}{item.roi}%
                                    </span>
                                </div>
                                <div className={panelStyles.mobileDetailRow}>
                                    <span className={panelStyles.mobileLabel}>Volume ({timeFilter})</span>
                                    <span className={panelStyles.mobileValue}>{formatCurrency(item.volume)}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </td>
            </tr>
        </>
    );
};

const PortfolioLeaderboard: React.FC = () => {
    const [timeFilter, setTimeFilter] = useState<'24H' | '7D' | '30D' | 'ALL'>('24H');
    const [searchQuery, setSearchQuery] = useState('');
    const [isTimeDropdownOpen, setIsTimeDropdownOpen] = useState(false);
    const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
    const [sortBy, setSortBy] = useState<keyof LeaderboardData | 'default'>('default');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

    const toggleTimeDropdown = () => setIsTimeDropdownOpen(!isTimeDropdownOpen);
    const toggleSortDropdown = () => setIsSortDropdownOpen(!isSortDropdownOpen); // New toggle

    const handleSort = (key: keyof LeaderboardData) => {
        if (sortBy === key) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(key);
            setSortDirection('desc');
        }
    };

    const getSortLabel = (key: string) => {
        switch (key) {
            case 'accountValue': return 'Account Value';
            case 'pnl': return 'PNL';
            case 'roi': return 'ROI';
            case 'volume': return 'Volume';
            default: return 'PNL';
        }
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
    };

    const filteredData = React.useMemo(() => {
        let result = [...MOCK_LEADERBOARD];
        if (searchQuery) {
            result = result.filter(item => item.trader.toLowerCase().includes(searchQuery.toLowerCase()));
        }

        if (sortBy !== 'default') {
            result.sort((a, b) => {
                const valA = a[sortBy] as number | string;
                const valB = b[sortBy] as number | string;
                if (typeof valA === 'number' && typeof valB === 'number') {
                    return sortDirection === 'asc' ? valA - valB : valB - valA;
                }
                return 0;
            });
        }
        return result;
    }, [searchQuery, sortBy, sortDirection, timeFilter]);

    return (
        <div style={{ paddingBottom: '32px' }}>
            <div className={styles.sectionTitle}>Leaderboard</div>

            <div className={panelStyles.tableContainer} style={{ background: '#12000A', border: '1px solid #3A2530', borderRadius: '12px', overflow: 'hidden' }}>
                <div className={styles.leaderboardControls}>
                    {/* Search Bar */}
                    <div className={styles.leaderboardSearch}>
                        <div style={{ position: 'absolute', top: '50%', left: '12px', transform: 'translateY(-50%)', color: '#A77590' }}>
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="5.5" cy="5.5" r="4.5" stroke="currentColor" strokeWidth="1.5" />
                                <path d="M13 13L9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            placeholder="Search by wallet address..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                background: '#11050D',
                                border: '1px solid #3A2530',
                                borderRadius: '8px',
                                padding: '8px 12px 8px 36px',
                                color: '#FFE1F2',
                                fontSize: '14px',
                                width: '100%',
                                outline: 'none'
                            }}
                        />
                    </div>

                    <div className={styles.leaderboardFilters}>
                        {/* Sort Dropdown */}
                        <div className={`${panelStyles.dropdownContainer} ${styles.sortDropdownWrapper}`}>
                            <button
                                className={`${panelStyles.dropdownButton} ${isSortDropdownOpen ? panelStyles.active : ''}`}
                                onClick={toggleSortDropdown}
                                style={{
                                    border: '1px solid #3A2530',
                                    padding: '6px 12px',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    backgroundColor: '#11050D'
                                }}
                            >
                                {getSortLabel(sortBy)}
                                <svg
                                    width="10"
                                    height="6"
                                    viewBox="0 0 10 6"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                    style={{
                                        transition: 'transform 0.2s',
                                        marginLeft: '4px',
                                        transform: isSortDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)'
                                    }}
                                >
                                    <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                            {isSortDropdownOpen && (
                                <div className={panelStyles.dropdownMenu} style={{ minWidth: '140px', right: 'auto', left: 0, zIndex: 100 }}>
                                    {[
                                        { key: 'accountValue', label: 'Account Value' },
                                        { key: 'pnl', label: 'PNL' },
                                        { key: 'roi', label: 'ROI' },
                                        { key: 'volume', label: 'Volume' }
                                    ].map((opt) => (
                                        <button
                                            key={opt.key}
                                            className={`${panelStyles.dropdownItem} ${sortBy === opt.key ? panelStyles.selected : ''}`}
                                            onClick={() => { handleSort(opt.key as keyof LeaderboardData); setIsSortDropdownOpen(false); }}
                                            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                                        >
                                            {opt.label}
                                            {sortBy === opt.key && (
                                                <span style={{ fontSize: '10px' }}>{sortDirection === 'asc' ? 'Asc' : 'Desc'}</span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Time Filter Dropdown */}
                        <div className={panelStyles.dropdownContainer}>
                            <button
                                className={`${panelStyles.dropdownButton} ${isTimeDropdownOpen ? panelStyles.active : ''}`}
                                onClick={toggleTimeDropdown}
                                style={{ border: '1px solid #3A2530', padding: '6px 12px', borderRadius: '8px' }}
                            >
                                {timeFilter}
                                <svg
                                    width="10"
                                    height="6"
                                    viewBox="0 0 10 6"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                    style={{
                                        transition: 'transform 0.2s',
                                        marginLeft: '6px',
                                        transform: isTimeDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)'
                                    }}
                                >
                                    <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                            {isTimeDropdownOpen && (
                                <div className={panelStyles.dropdownMenu} style={{ minWidth: '80px', right: 0, left: 'auto' }}>
                                    {['24H', '7D', '30D', 'ALL'].map((tf) => (
                                        <button
                                            key={tf}
                                            className={`${panelStyles.dropdownItem} ${timeFilter === tf ? panelStyles.selected : ''}`}
                                            onClick={() => { setTimeFilter(tf as any); setIsTimeDropdownOpen(false); }}
                                        >
                                            {tf}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <table className={panelStyles.table}>
                    <thead>
                        <tr>
                            <th className={panelStyles.th}>Rank</th>
                            <th className={panelStyles.th}>Trader</th>
                            <th className={panelStyles.th} style={{ cursor: 'pointer' }} onClick={() => handleSort('accountValue')}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    Account Value
                                    <SortIcon active={sortBy === 'accountValue'} direction={sortDirection} />
                                </div>
                            </th>
                            <th className={panelStyles.th} style={{ cursor: 'pointer' }} onClick={() => handleSort('pnl')}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    PNL ({timeFilter})
                                    <SortIcon active={sortBy === 'pnl'} direction={sortDirection} />
                                </div>
                            </th>
                            <th className={panelStyles.th} style={{ cursor: 'pointer' }} onClick={() => handleSort('roi')}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    ROI ({timeFilter})
                                    <SortIcon active={sortBy === 'roi'} direction={sortDirection} />
                                </div>
                            </th>
                            <th className={panelStyles.th} style={{ cursor: 'pointer' }} onClick={() => handleSort('volume')}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    Volume ({timeFilter})
                                    <SortIcon active={sortBy === 'volume'} direction={sortDirection} />
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredData.length > 0 ? (
                            filteredData.map((item, index) => (
                                <LeaderboardRow
                                    key={item.trader}
                                    item={item}
                                    index={index}
                                    formatCurrency={formatCurrency}
                                    timeFilter={timeFilter}
                                    sortBy={sortBy}
                                />
                            ))
                        ) : (
                            <tr>
                                <td colSpan={6} style={{ textAlign: 'center', padding: '48px', color: '#A77590' }}>
                                    No results found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
                <div className={panelStyles.tableFooter}>
                    <div className={panelStyles.footerText}>
                        Excludes accounts with less than 100k USDC account value and less than 10M USDC trading volume. ROI = PNL / max(100, starting account value + maximum net deposits) for the time window.
                    </div>
                    <div className={panelStyles.pagination}>
                        <span>Rows per page: 10</span>
                        <span>1-{filteredData.length} of {filteredData.length}</span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <span style={{ cursor: 'pointer' }}>&lt;</span>
                            <span style={{ cursor: 'pointer' }}>&gt;</span>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
};

export default PortfolioLeaderboard;
