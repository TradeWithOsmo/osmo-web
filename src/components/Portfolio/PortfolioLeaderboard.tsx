import React, { useState } from 'react';
import styles from './Portfolio.module.css';
import panelStyles from '../Positions/PositionsPanel.module.css';

// Import Logos
import AnthropicLogo from '../../assets/Model logos/Anthropic.svg';
import DeepSeekLogo from '../../assets/Model logos/DeepSeek.png';
import GoogleGeminiLogo from '../../assets/Model logos/GoogleGemini.svg';
import OpenAILogo from '../../assets/Model logos/OpenAI.svg';
import QwenLogo from '../../assets/Model logos/Qwen.png';

interface LeaderboardData {
    rank: number;
    trader: string; // Address or name
    accountValue: number;
    pnl: number;
    roi: number;
    volume: number;
    // Agent Specific
    agentName?: string;
    agentLogo?: string;
    provider?: string;
}

// Generate more mock data for pagination
const generateMockData = (count: number): LeaderboardData[] => {
    const data: LeaderboardData[] = [];
    const traders = ['whale.sol', 'degen_king', 'satoshi', 'vitalik', 'sam', 'cz', 'trader_joe', 'alpha_seeker', 'gemini_pro', 'gpt4_user'];

    for (let i = 0; i < count; i++) {
        const isNamed = Math.random() > 0.7;
        const trader = isNamed
            ? traders[Math.floor(Math.random() * traders.length)]
            : `0x${Math.random().toString(16).substring(2, 6)}...${Math.random().toString(16).substring(2, 6)}`;

        data.push({
            rank: i + 1,
            trader: trader,
            accountValue: 10000 + Math.random() * 1000000,
            pnl: (Math.random() - 0.4) * 50000, // Some negative
            roi: (Math.random() - 0.4) * 200,
            volume: 100000 + Math.random() * 5000000
        });
    }
    // Sort slightly to look realistic based on PNL usually
    return data.sort((a, b) => b.pnl - a.pnl).map((item, idx) => ({ ...item, rank: idx + 1 }));
};

const MOCK_LEADERBOARD = generateMockData(156); // 156 items to show pagination

const MOCK_AGENTS: LeaderboardData[] = [
    { rank: 1, trader: 'AlphaZero', agentName: 'GPT-4o', agentLogo: OpenAILogo, provider: 'OpenAI', accountValue: 1250000.00, pnl: 350000.00, roi: 38.5, volume: 55000000 },
    { rank: 2, trader: 'DeepMind_X', agentName: 'Claude 3.5 Sonnet', agentLogo: AnthropicLogo, provider: 'Anthropic', accountValue: 980000.00, pnl: 210000.00, roi: 27.2, volume: 42000000 },
    { rank: 3, trader: 'GeminiPro_Trader', agentName: 'Gemini 1.5 Pro', agentLogo: GoogleGeminiLogo, provider: 'Google DeepMind', accountValue: 850000.00, pnl: 180000.00, roi: 26.8, volume: 38000000 },
    { rank: 4, trader: 'Qwen_Master', agentName: 'Qwen 2.5', agentLogo: QwenLogo, provider: 'Alibaba Cloud', accountValue: 720000.00, pnl: 150000.00, roi: 26.3, volume: 30000000 },
    { rank: 5, trader: 'DeepSeek_R1', agentName: 'DeepSeek V3', agentLogo: DeepSeekLogo, provider: 'DeepSeek', accountValue: 650000.00, pnl: 120000.00, roi: 22.5, volume: 25000000 },
    { rank: 6, trader: 'Claude_Opus_Fund', agentName: 'Claude 3 Opus', agentLogo: AnthropicLogo, provider: 'Anthropic', accountValue: 480000.00, pnl: 80000.00, roi: 20.0, volume: 15000000 },
    { rank: 7, trader: 'Gemini_Ultra_Bot', agentName: 'Gemini Ultra', agentLogo: GoogleGeminiLogo, provider: 'Google DeepMind', accountValue: 450000.00, pnl: 75000.00, roi: 19.5, volume: 14000000 },
    { rank: 8, trader: 'GPT4_Turbo_User', agentName: 'GPT-4 Turbo', agentLogo: OpenAILogo, provider: 'OpenAI', accountValue: 420000.00, pnl: 65000.00, roi: 18.3, volume: 12000000 },
    { rank: 9, trader: 'Gemini_1_Pro', agentName: 'Gemini 1.0 Pro', agentLogo: GoogleGeminiLogo, provider: 'Google DeepMind', accountValue: 300000.00, pnl: 45000.00, roi: 15.0, volume: 8000000 },
    { rank: 10, trader: 'Turbo_35', agentName: 'GPT-3.5 Turbo', agentLogo: OpenAILogo, provider: 'OpenAI', accountValue: 250000.00, pnl: 30000.00, roi: 12.0, volume: 5000000 },
    { rank: 11, trader: 'Haiku_Speed', agentName: 'Claude 3 Haiku', agentLogo: AnthropicLogo, provider: 'Anthropic', accountValue: 200000.00, pnl: 25000.00, roi: 12.5, volume: 4000000 },
    { rank: 12, trader: 'DeepSeek_Coder_Dev', agentName: 'DeepSeek Coder', agentLogo: DeepSeekLogo, provider: 'DeepSeek', accountValue: 180000.00, pnl: 20000.00, roi: 11.1, volume: 3000000 },
    { rank: 13, trader: 'Qwen_15', agentName: 'Qwen 1.5', agentLogo: QwenLogo, provider: 'Alibaba Cloud', accountValue: 150000.00, pnl: 15000.00, roi: 10.0, volume: 2500000 },
    { rank: 14, trader: 'DeepSeek_Lite_Bot', agentName: 'DeepSeek Lite', agentLogo: DeepSeekLogo, provider: 'DeepSeek', accountValue: 100000.00, pnl: 10000.00, roi: 10.0, volume: 1500000 },
    { rank: 15, trader: 'Qwen_Large_Fund', agentName: 'Qwen Large', agentLogo: QwenLogo, provider: 'Alibaba Cloud', accountValue: 80000.00, pnl: 8000.00, roi: 10.0, volume: 1000000 },
];




interface LeaderboardRowProps {
    item: LeaderboardData;
    formatCurrency: (val: number) => string;
    timeFilter: string;
    sortBy: keyof LeaderboardData | 'default';
    isAgentTab?: boolean;
}

const LeaderboardRow: React.FC<LeaderboardRowProps> = ({ item, formatCurrency, timeFilter, sortBy, isAgentTab }) => {
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
            value = `${val >= 0 ? '+' : ''}${val.toFixed(2)}%`;
        } else if (key === 'accountValue') {
            value = formatCurrency(item.accountValue);
        } else if (key === 'volume') {
            value = formatCurrency(item.volume);
        } else {
            // Fallback
            value = item[key]; // Error here if key is 'agentName' etc which are string | undefined. 
            // But 'sortBy' is strictly typed, so we need to be careful.
            // However, let's keep it simple for now as per plan.
        }

        // Label
        let label = 'PNL';
        if (key === 'accountValue') label = 'Account Value';
        if (key === 'roi') label = 'ROI';
        if (key === 'volume') label = 'Volume';
        if (key === 'trader') label = 'Trader';
        if (key === 'rank') label = 'Rank';

        return { label, value, color };
    };

    const { label: mobileLabel, value: mobileValue, color: mobileColor } = getMobileHeaderMetric();

    return (
        <>
            {/* Desktop Row */}
            <tr className={`${panelStyles.row} ${panelStyles.desktopRow}`}>
                <td className={panelStyles.td}>{item.rank}</td>
                <td className={panelStyles.td} style={{ color: '#FFE1F2' }}>{item.trader}</td>

                {isAgentTab && (
                    <td className={panelStyles.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {item.agentLogo ? (
                                <img src={item.agentLogo} alt={item.agentName} style={{ width: '20px', height: '20px', borderRadius: '4px' }} />
                            ) : (
                                <div style={{ width: '20px', height: '20px', borderRadius: '4px', background: '#3A2530' }} />
                            )}
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ color: '#FFE1F2', fontSize: '13px' }}>{item.agentName}</span>
                                <span style={{ color: '#A77590', fontSize: '11px' }}>{item.provider}</span>
                            </div>
                        </div>
                    </td>
                )}

                <td className={panelStyles.td} style={{ textAlign: 'right' }}>{formatCurrency(item.accountValue)}</td>
                <td className={panelStyles.td} style={{ color: item.pnl >= 0 ? '#00E396' : '#FF4560', textAlign: 'right' }}>
                    {item.pnl >= 0 ? '+' : ''}{formatCurrency(item.pnl)}
                </td>
                <td className={panelStyles.td} style={{ color: item.roi >= 0 ? '#00E396' : '#FF4560', textAlign: 'right' }}>
                    {item.roi >= 0 ? '+' : ''}{item.roi.toFixed(2)}%
                </td>
                <td className={panelStyles.td} style={{ textAlign: 'right' }}>{formatCurrency(item.volume)}</td>
            </tr>

            {/* Mobile Row */}
            <tr className={`${panelStyles.row} ${panelStyles.mobileRow}`}>
                <td className={panelStyles.td} colSpan={6}>
                    <div className={panelStyles.mobileCard}>
                        {/* Header (Always Visible) */}
                        <div className={panelStyles.mobileHeader} onClick={toggleExpand} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            {/* 1. Rank & Trader/Agent (Left) */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <span style={{ fontSize: '12px', color: '#A77590' }}>Rank {item.rank}</span>
                                {isAgentTab ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        {item.agentLogo ? (
                                            <img src={item.agentLogo} alt={item.agentName} style={{ width: '24px', height: '24px', borderRadius: '4px' }} />
                                        ) : (
                                            <div style={{ width: '24px', height: '24px', borderRadius: '4px', background: '#3A2530' }} />
                                        )}
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontWeight: 700, color: '#FFFFFF', fontSize: '14px' }}>{item.agentName}</span>
                                            <span style={{ fontSize: '12px', color: '#A77590' }}>{item.provider}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <span style={{ fontWeight: 700, color: '#FFFFFF', fontSize: '14px' }}>{item.trader}</span>
                                )}
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
                                {isAgentTab && (
                                    <div className={panelStyles.mobileDetailRow}>
                                        <span className={panelStyles.mobileLabel}>Trader</span>
                                        <span className={panelStyles.mobileValue} style={{ color: '#FFE1F2' }}>{item.trader}</span>
                                    </div>
                                )}
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
                                        {item.roi >= 0 ? '+' : ''}{item.roi.toFixed(2)}%
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

    // Tab State
    const [activeTab, setActiveTab] = useState<'trader' | 'agent'>('trader');

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(20);
    const [isRowsDropdownOpen, setIsRowsDropdownOpen] = useState(false);

    const toggleTimeDropdown = () => setIsTimeDropdownOpen(!isTimeDropdownOpen);
    const toggleSortDropdown = () => setIsSortDropdownOpen(!isSortDropdownOpen);
    const toggleRowsDropdown = () => setIsRowsDropdownOpen(!isRowsDropdownOpen);

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
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2, minimumFractionDigits: 0 }).format(val);
    };

    // Filter and Sort Data
    const filteredData = React.useMemo(() => {
        // Toggle Source Data based on Tab
        const sourceData = activeTab === 'trader' ? MOCK_LEADERBOARD : MOCK_AGENTS;

        let result = [...sourceData];
        if (searchQuery) {
            result = result.filter(item =>
                item.trader.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (item.agentName && item.agentName.toLowerCase().includes(searchQuery.toLowerCase()))
            );
        }

        if (sortBy !== 'default') {
            result.sort((a, b) => {
                const valA = a[sortBy] as number | string | undefined;
                const valB = b[sortBy] as number | string | undefined;

                // Handle undefined for safe sorting
                if (valA === undefined) return 1;
                if (valB === undefined) return -1;

                if (typeof valA === 'number' && typeof valB === 'number') {
                    return sortDirection === 'asc' ? valA - valB : valB - valA;
                }
                return 0;
            });
        }
        return result;
    }, [searchQuery, sortBy, sortDirection, timeFilter, activeTab]);

    // Pagination Logic
    const totalItems = filteredData.length;
    const totalPages = Math.ceil(totalItems / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const paginatedData = filteredData.slice(startIndex, startIndex + rowsPerPage);

    // Reset page when filters change
    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, timeFilter, sortBy, activeTab]);

    // Change Page
    const goToPage = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    return (
        <div style={{ paddingBottom: '32px' }}>
            <div className={styles.sectionTitle}>Leaderboard</div>

            <div className={panelStyles.tableContainer} style={{ height: 'auto', maxHeight: 'calc(100vh - 140px)', minHeight: 0, display: 'flex', flexDirection: 'column', border: '1px solid #3A2530', borderRadius: '12px' }}> {/* EDIT HEIGHT HERE: 140px is header+nav */}
                {/* Navbar Style Tabs */}
                <div className={styles.tabsContainer}>
                    <button
                        className={`${styles.tabButton} ${activeTab === 'trader' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('trader')}
                    >
                        Trader
                    </button>
                    <button
                        className={`${styles.tabButton} ${activeTab === 'agent' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('agent')}
                    >
                        Agent
                    </button>
                </div>

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

                <div className={panelStyles.tableWrapper}>
                    <table className={panelStyles.table}>
                        <thead>
                            <tr>
                                <th className={panelStyles.th}>Rank</th>
                                <th className={panelStyles.th}>Trader</th>

                                {/* NEW AGENT COLUMN */}
                                {activeTab === 'agent' && (
                                    <th className={panelStyles.th}>Agent</th>
                                )}

                                <th className={panelStyles.th} style={{ cursor: 'pointer', textAlign: 'right' }} onClick={() => handleSort('accountValue')}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                                        Account Value
                                        <svg
                                            width="10"
                                            height="6"
                                            viewBox="0 0 10 6"
                                            fill="none"
                                            xmlns="http://www.w3.org/2000/svg"
                                            style={{
                                                transition: 'transform 0.2s',
                                                transform: sortBy === 'accountValue' && sortDirection === 'asc' ? 'rotate(180deg)' : 'rotate(0deg)'
                                            }}
                                        >
                                            <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                </th>
                                <th className={panelStyles.th} style={{ cursor: 'pointer', textAlign: 'right' }} onClick={() => handleSort('pnl')}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                                        PNL ({timeFilter})
                                        <svg
                                            width="10"
                                            height="6"
                                            viewBox="0 0 10 6"
                                            fill="none"
                                            xmlns="http://www.w3.org/2000/svg"
                                            style={{
                                                transition: 'transform 0.2s',
                                                transform: sortBy === 'pnl' && sortDirection === 'asc' ? 'rotate(180deg)' : 'rotate(0deg)'
                                            }}
                                        >
                                            <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                </th>
                                <th className={panelStyles.th} style={{ cursor: 'pointer', textAlign: 'right' }} onClick={() => handleSort('roi')}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                                        ROI ({timeFilter})
                                        <svg
                                            width="10"
                                            height="6"
                                            viewBox="0 0 10 6"
                                            fill="none"
                                            xmlns="http://www.w3.org/2000/svg"
                                            style={{
                                                transition: 'transform 0.2s',
                                                transform: sortBy === 'roi' && sortDirection === 'asc' ? 'rotate(180deg)' : 'rotate(0deg)'
                                            }}
                                        >
                                            <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                </th>
                                <th className={panelStyles.th} style={{ cursor: 'pointer', textAlign: 'right' }} onClick={() => handleSort('volume')}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                                        Volume ({timeFilter})
                                        <svg
                                            width="10"
                                            height="6"
                                            viewBox="0 0 10 6"
                                            fill="none"
                                            xmlns="http://www.w3.org/2000/svg"
                                            style={{
                                                transition: 'transform 0.2s',
                                                transform: sortBy === 'volume' && sortDirection === 'asc' ? 'rotate(180deg)' : 'rotate(0deg)'
                                            }}
                                        >
                                            <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedData.length > 0 ? (
                                paginatedData.map((item, index) => (
                                    <LeaderboardRow
                                        key={index} // Use index as key if multiple same users in mock
                                        item={{ ...item, rank: startIndex + index + 1 }}
                                        formatCurrency={formatCurrency}
                                        timeFilter={timeFilter}
                                        sortBy={sortBy}
                                        isAgentTab={activeTab === 'agent'}
                                    />
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={activeTab === 'agent' ? 7 : 6} style={{ textAlign: 'center', padding: '48px', color: '#A77590' }}>
                                        No results found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                    <div className={panelStyles.tableFooter}>
                        <div className={panelStyles.footerGrid}>

                            {/* Left: Showing Text */}
                            <div className={panelStyles.footerMessage}>
                                Showing {startIndex + 1} - {Math.min(startIndex + rowsPerPage, totalItems)} out of {totalItems}
                            </div>

                            {/* Center: Pagination Buttons */}
                            <div className={panelStyles.footerControls}>
                                <button
                                    className={panelStyles.paginationButton}
                                    onClick={() => goToPage(currentPage - 1)}
                                    disabled={currentPage === 1}
                                >
                                    &lt;
                                </button>

                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    let startPage = Math.max(1, currentPage - 2);
                                    if (startPage + 4 > totalPages) {
                                        startPage = Math.max(1, totalPages - 4);
                                    }
                                    const p = startPage + i;

                                    return (
                                        <button
                                            key={p}
                                            className={`${panelStyles.paginationButton} ${currentPage === p ? panelStyles.active : ''}`}
                                            onClick={() => goToPage(p)}
                                        >
                                            {p}
                                        </button>
                                    );
                                })}

                                <button
                                    className={panelStyles.paginationButton}
                                    onClick={() => goToPage(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                >
                                    &gt;
                                </button>
                            </div>

                            {/* Right: Rows per page */}
                            <div className={panelStyles.footerActions}>
                                <span>Show</span>
                                <div className={panelStyles.dropdownContainer}>
                                    <button
                                        className={`${panelStyles.dropdownButton} ${isRowsDropdownOpen ? panelStyles.active : ''}`}
                                        onClick={toggleRowsDropdown}
                                        style={{ border: '1px solid #3A2530', padding: '4px 8px', borderRadius: '6px', height: '32px' }}
                                    >
                                        {rowsPerPage}
                                        <svg
                                            width="10"
                                            height="6"
                                            viewBox="0 0 10 6"
                                            fill="none"
                                            xmlns="http://www.w3.org/2000/svg"
                                            style={{
                                                transition: 'transform 0.2s',
                                                marginLeft: '6px',
                                                transform: isRowsDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)'
                                            }}
                                        >
                                            <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </button>
                                    {isRowsDropdownOpen && (
                                        <div className={panelStyles.dropdownMenu} style={{ minWidth: '60px', bottom: '100%', top: 'auto', marginBottom: '4px' }}>
                                            {[10, 20, 50, 100].map((rows) => (
                                                <button
                                                    key={rows}
                                                    className={`${panelStyles.dropdownItem} ${rowsPerPage === rows ? panelStyles.selected : ''}`}
                                                    onClick={() => { setRowsPerPage(rows); setCurrentPage(1); setIsRowsDropdownOpen(false); }}
                                                >
                                                    {rows}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
};

export default PortfolioLeaderboard;