import React, { useState, useEffect, useMemo } from 'react';
import styles from './Portfolio.module.css';
import panelStyles from '../Positions/PositionsPanel.module.css';
import { useLeaderboardStore } from '../../store/useLeaderboardStore';
import type { Timeframe } from '../../api/leaderboardService';

// Import Logos
import AnthropicLogo from '../../assets/Model logos/Anthropic.svg';
import DeepSeekLogo from '../../assets/Model logos/DeepSeek.png';
import GoogleGeminiLogo from '../../assets/Model logos/GoogleGemini.svg';
import OpenAILogo from '../../assets/Model logos/OpenAI.svg';
import QwenLogo from '../../assets/Model logos/Qwen.png';

// Model logo mapping
const MODEL_LOGOS: Record<string, string> = {
    'gpt-4o': OpenAILogo,
    'gpt-4-turbo': OpenAILogo,
    'gpt-3.5-turbo': OpenAILogo,
    'claude-3.5-sonnet': AnthropicLogo,
    'claude-3-opus': AnthropicLogo,
    'claude-3-haiku': AnthropicLogo,
    'gemini-1.5-pro': GoogleGeminiLogo,
    'gemini-1.0-pro': GoogleGeminiLogo,
    'gemini-ultra': GoogleGeminiLogo,
    'deepseek-v3': DeepSeekLogo,
    'deepseek-coder': DeepSeekLogo,
    'deepseek-lite': DeepSeekLogo,
    'qwen-2.5': QwenLogo,
    'qwen-1.5': QwenLogo,
    'qwen-large': QwenLogo,
};

// Model provider mapping
const MODEL_PROVIDERS: Record<string, string> = {
    'gpt-4o': 'OpenAI',
    'gpt-4-turbo': 'OpenAI',
    'gpt-3.5-turbo': 'OpenAI',
    'claude-3.5-sonnet': 'Anthropic',
    'claude-3-opus': 'Anthropic',
    'claude-3-haiku': 'Anthropic',
    'gemini-1.5-pro': 'Google DeepMind',
    'gemini-1.0-pro': 'Google DeepMind',
    'gemini-ultra': 'Google DeepMind',
    'deepseek-v3': 'DeepSeek',
    'deepseek-coder': 'DeepSeek',
    'deepseek-lite': 'DeepSeek',
    'qwen-2.5': 'Alibaba Cloud',
    'qwen-1.5': 'Alibaba Cloud',
    'qwen-large': 'Alibaba Cloud',
};

interface TraderLeaderboardRowProps {
    item: any;
    formatCurrency: (val: number) => string;
    timeFilter: string;
    showModelColumn?: boolean;  // NEW: For Agent tab
}

const TraderLeaderboardRow: React.FC<TraderLeaderboardRowProps> = ({ item, formatCurrency, timeFilter, showModelColumn = false }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const toggleExpand = () => setIsExpanded(!isExpanded);

    return (
        <>
            {/* Desktop Row */}
            <tr className={`${panelStyles.row} ${panelStyles.desktopRow}`}>
                <td className={panelStyles.td}>{item.rank}</td>
                <td className={panelStyles.td} style={{ color: '#FFE1F2' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {item.trader}
                        {!showModelColumn && item.agentModel && (
                            <span style={{
                                backgroundColor: '#3A2530',
                                color: '#A77590',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '10px'
                            }}>
                                AI
                            </span>
                        )}
                    </div>
                </td>
                {showModelColumn && (
                    <td className={panelStyles.td} style={{ color: '#A77590' }}>
                        {item.agentModel || 'N/A'}
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
                <td className={panelStyles.td} colSpan={showModelColumn ? 7 : 6}>
                    <div className={panelStyles.mobileCard}>
                        <div className={panelStyles.mobileHeader} onClick={toggleExpand}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <span style={{ fontSize: '12px', color: '#A77590' }}>Rank {item.rank}</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontWeight: 700, color: '#FFFFFF', fontSize: '14px' }}>{item.trader}</span>
                                    {item.agentModel && <span style={{ fontSize: '10px', color: '#A77590' }}>🤖</span>}
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'flex-end' }}>
                                    <span style={{ fontSize: '12px', color: '#A77590' }}>PNL</span>
                                    <span style={{ color: item.pnl >= 0 ? '#00E396' : '#FF4560', fontSize: '13px' }}>
                                        {item.pnl >= 0 ? '+' : ''}{formatCurrency(item.pnl)}
                                    </span>
                                </div>
                                <div style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', color: '#A77590' }}>
                                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {isExpanded && (
                            <div className={panelStyles.mobileDetails}>
                                {item.agentModel && (
                                    <div className={panelStyles.mobileDetailRow}>
                                        <span className={panelStyles.mobileLabel}>AI Model</span>
                                        <span className={panelStyles.mobileValue}>{item.agentModel}</span>
                                    </div>
                                )}
                                <div className={panelStyles.mobileDetailRow}>
                                    <span className={panelStyles.mobileLabel}>Account Value</span>
                                    <span className={panelStyles.mobileValue}>{formatCurrency(item.accountValue)}</span>
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

interface AgentLeaderboardRowProps {
    item: any;
    formatCurrency: (val: number) => string;
    timeFilter: string;
}

const AgentLeaderboardRow: React.FC<AgentLeaderboardRowProps> = ({ item, formatCurrency, timeFilter }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const toggleExpand = () => setIsExpanded(!isExpanded);

    const agentLogo = MODEL_LOGOS[item.agentName.toLowerCase()];
    const provider = MODEL_PROVIDERS[item.agentName.toLowerCase()];

    return (
        <>
            {/* Desktop Row */}
            <tr className={`${panelStyles.row} ${panelStyles.desktopRow}`}>
                <td className={panelStyles.td}>{item.rank}</td>
                <td className={panelStyles.td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {agentLogo && <img src={agentLogo} alt={item.agentName} style={{ width: '20px', height: '20px', borderRadius: '4px' }} />}
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ color: '#FFE1F2', fontSize: '13px' }}>{item.agentName}</span>
                            {provider && <span style={{ color: '#A77590', fontSize: '11px' }}>{provider}</span>}
                        </div>
                    </div>
                </td>
                <td className={panelStyles.td} style={{ textAlign: 'right' }}>{item.totalUsers}</td>
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
                <td className={panelStyles.td} colSpan={7}>
                    <div className={panelStyles.mobileCard}>
                        <div className={panelStyles.mobileHeader} onClick={toggleExpand}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                {agentLogo && <img src={agentLogo} alt={item.agentName} style={{ width: '24px', height: '24px', borderRadius: '4px' }} />}
                                <div>
                                    <div style={{ fontSize: '12px', color: '#A77590' }}>Rank {item.rank}</div>
                                    <div style={{ fontWeight: 700, color: '#FFFFFF', fontSize: '14px' }}>{item.agentName}</div>
                                    {provider && <div style={{ fontSize: '12px', color: '#A77590' }}>{provider}</div>}
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'flex-end' }}>
                                    <span style={{ fontSize: '12px', color: '#A77590' }}>PNL</span>
                                    <span style={{ color: item.pnl >= 0 ? '#00E396' : '#FF4560', fontSize: '13px' }}>
                                        {item.pnl >= 0 ? '+' : ''}{formatCurrency(item.pnl)}
                                    </span>
                                </div>
                                <div style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', color: '#A77590' }}>
                                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {isExpanded && (
                            <div className={panelStyles.mobileDetails}>
                                <div className={panelStyles.mobileDetailRow}>
                                    <span className={panelStyles.mobileLabel}>Total Users</span>
                                    <span className={panelStyles.mobileValue}>{item.totalUsers}</span>
                                </div>
                                <div className={panelStyles.mobileDetailRow}>
                                    <span className={panelStyles.mobileLabel}>Account Value</span>
                                    <span className={panelStyles.mobileValue}>{formatCurrency(item.accountValue)}</span>
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
    const [timeFilter, setTimeFilter] = useState<Timeframe>('24h');
    const [searchQuery, setSearchQuery] = useState('');
    const [isTimeDropdownOpen, setIsTimeDropdownOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'trader' | 'agent' | 'model'>('trader');
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(20);
    const [isRowsDropdownOpen, setIsRowsDropdownOpen] = useState(false);

    // Zustand store
    const {
        traderData,
        traderPagination,
        agentData,
        agentPagination,
        isLoadingTraders,
        isLoadingAgents,
        fetchTraderLeaderboard,
        fetchAgentLeaderboard
    } = useLeaderboardStore();

    const toggleTimeDropdown = () => setIsTimeDropdownOpen(!isTimeDropdownOpen);
    const toggleRowsDropdown = () => setIsRowsDropdownOpen(!isRowsDropdownOpen);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2, minimumFractionDigits: 0 }).format(val);
    };

    // Fetch data when tab, timeframe, or page changes
    useEffect(() => {
        if (activeTab === 'trader') {
            fetchTraderLeaderboard(timeFilter, currentPage, rowsPerPage, false); // All traders
        } else if (activeTab === 'agent') {
            fetchTraderLeaderboard(timeFilter, currentPage, rowsPerPage, true); // AI traders only
        } else {
            fetchAgentLeaderboard(timeFilter, currentPage, rowsPerPage); // Model global
        }
    }, [activeTab, timeFilter, currentPage, rowsPerPage]);

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, timeFilter, activeTab]);

    // Filter data by search query (client-side)
    const filteredData = useMemo(() => {
        if (!searchQuery) {
            return activeTab === 'model' ? agentData : traderData;
        }

        if (activeTab === 'model') {
            return agentData.filter(item =>
                item.agentName.toLowerCase().includes(searchQuery.toLowerCase())
            );
        } else {
            // Both 'trader' and 'agent' tabs show trader data (but agent is filtered by backend)
            return traderData.filter(item =>
                item.trader.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (item.agentModel && item.agentModel.toLowerCase().includes(searchQuery.toLowerCase()))
            );
        }
    }, [traderData, agentData, searchQuery, activeTab]);

    const pagination = activeTab === 'model' ? agentPagination : traderPagination;
    const isLoading = activeTab === 'model' ? isLoadingAgents : isLoadingTraders;
    const totalPages = pagination?.pages || 1;

    const goToPage = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    return (
        <div style={{ paddingBottom: '32px' }}>
            <div className={styles.sectionTitle}>Leaderboard</div>

            <div className={panelStyles.tableContainer} style={{ height: 'auto', maxHeight: 'calc(100vh - 140px)', minHeight: '500px', display: 'flex', flexDirection: 'column', border: '1px solid #3A2530', borderRadius: '12px', overflow: 'hidden' }}>
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
                    <button
                        className={`${styles.tabButton} ${activeTab === 'model' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('model')}
                    >
                        Model
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
                        {/* Time Filter Dropdown */}
                        <div className={panelStyles.dropdownContainer}>
                            <button
                                className={`${panelStyles.dropdownButton} ${isTimeDropdownOpen ? panelStyles.active : ''}`}
                                onClick={toggleTimeDropdown}
                                style={{ border: '1px solid #3A2530', padding: '6px 12px', borderRadius: '8px' }}
                            >
                                {timeFilter.toUpperCase()}
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
                                    {(['24h', '7d', '30d', 'all'] as Timeframe[]).map((tf) => (
                                        <button
                                            key={tf}
                                            className={`${panelStyles.dropdownItem} ${timeFilter === tf ? panelStyles.selected : ''}`}
                                            onClick={() => { setTimeFilter(tf); setIsTimeDropdownOpen(false); }}
                                        >
                                            {tf.toUpperCase()}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className={panelStyles.tableWrapper}>
                    {isLoading ? (
                        <div style={{ textAlign: 'center', padding: '48px', color: '#A77590' }}>
                            Loading leaderboard...
                        </div>
                    ) : (
                        <table className={panelStyles.table}>
                            <thead>
                                <tr>
                                    <th className={panelStyles.th}>Rank</th>
                                    {activeTab === 'model' ? (
                                        <>
                                            <th className={panelStyles.th}>Model</th>
                                            <th className={panelStyles.th} style={{ textAlign: 'right' }}>Users</th>
                                        </>
                                    ) : activeTab === 'agent' ? (
                                        <>
                                            <th className={panelStyles.th}>Trader</th>
                                            <th className={panelStyles.th}>Model</th>
                                        </>
                                    ) : (
                                        <th className={panelStyles.th}>Trader</th>
                                    )}
                                    <th className={panelStyles.th} style={{ textAlign: 'right' }}>Account Value</th>
                                    <th className={panelStyles.th} style={{ textAlign: 'right' }}>PNL ({timeFilter.toUpperCase()})</th>
                                    <th className={panelStyles.th} style={{ textAlign: 'right' }}>ROI ({timeFilter.toUpperCase()})</th>
                                    <th className={panelStyles.th} style={{ textAlign: 'right' }}>Volume ({timeFilter.toUpperCase()})</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredData.length > 0 ? (
                                    filteredData.map((item, index) => (
                                        activeTab === 'model' ? (
                                            <AgentLeaderboardRow
                                                key={index}
                                                item={item}
                                                formatCurrency={formatCurrency}
                                                timeFilter={timeFilter.toUpperCase()}
                                            />
                                        ) : (
                                            <TraderLeaderboardRow
                                                key={index}
                                                item={item}
                                                formatCurrency={formatCurrency}
                                                timeFilter={timeFilter.toUpperCase()}
                                                showModelColumn={activeTab === 'agent'}
                                            />
                                        )
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={activeTab === 'model' || activeTab === 'agent' ? 7 : 6} style={{ textAlign: 'center', padding: '48px', color: '#A77590' }}>
                                            No results found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}

                    {!isLoading && pagination && (
                        <div className={panelStyles.tableFooter}>
                            <div className={panelStyles.footerGrid}>
                                <div className={panelStyles.footerMessage}>
                                    Showing {pagination.total === 0 ? 0 : ((currentPage - 1) * rowsPerPage) + 1} - {Math.min(currentPage * rowsPerPage, pagination.total)} out of {pagination.total}
                                </div>

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
                    )}
                </div>
            </div>
        </div >
    );
};

export default PortfolioLeaderboard;