import React, { useState } from 'react';
import styles from './Portfolio.module.css';
import panelStyles from '../Positions/PositionsPanel.module.css';
import TradeHistoryTable from '../Positions/TradeHistoryTable';
import OrderHistoryTable from '../Positions/OrderHistoryTable';
import type { TradeHistoryData } from '../Positions/TradeHistoryRow';
import type { OrderHistoryData } from '../Positions/OrderHistoryRow';

// Mock Data for Trade History
// Helper to generate mock data
const generateMockTrades = (count: number): TradeHistoryData[] => {
    return Array.from({ length: count }, (_, i) => ({
        id: `${i + 1}`,
        time: `30/12/2025 - 16.04.${(i % 60).toString().padStart(2, '0')}`,
        symbol: i % 2 === 0 ? 'SOL' : 'ETH',
        direction: i % 3 === 0 ? 'Open Long' : (i % 3 === 1 ? 'Close Short' : 'Open Short'),
        price: 100 + Math.random() * 2000,
        size: 1 + Math.random() * 10,
        sizeAsset: i % 2 === 0 ? 'SOL' : 'ETH',
        tradeValue: 1000 + Math.random() * 5000,
        tradeValueAsset: 'USDC',
        fee: 0.1 + Math.random() * 2,
        feeAsset: 'USDC',
        closedPnl: (Math.random() - 0.5) * 200,
        closedPnlAsset: 'USDC'
    }));
};

const generateMockOrders = (count: number): OrderHistoryData[] => {
    return Array.from({ length: count }, (_, i) => ({
        id: `${i + 1}`,
        time: `29/12/2025 - 14.20.${(i % 60).toString().padStart(2, '0')}`,
        type: i % 2 === 0 ? 'Market' : 'Limit',
        symbol: i % 2 === 0 ? 'BTC' : 'ETH',
        direction: i % 2 === 0 ? 'Short' : 'Long',
        size: 0.1 + Math.random(),
        originalSize: 0.1 + Math.random(),
        orderValue: 2000 + Math.random() * 5000,
        price: 2000 + Math.random() * 40000,
        reduceOnly: Math.random() > 0.5,
        triggerConditions: 'N/A',
        tp: '--',
        sl: '--',
        status: i % 3 === 0 ? 'Filled' : (i % 3 === 1 ? 'Cancelled' : 'Partially Filled')
    }));
};

const MOCK_TRADE_HISTORY = generateMockTrades(50);
const MOCK_ORDER_HISTORY = generateMockOrders(50);

const PortfolioHistory: React.FC = () => {
    const [subTab, setSubTab] = useState<'Trades' | 'Orders'>('Trades');

    // Sort/Filter State
    const [sortBy, setSortBy] = useState<string>('time');
    const [filterBy, setFilterBy] = useState<string>('all');
    const [isSortOpen, setIsSortOpen] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    // Pagination / View Mode State
    const [viewMode, setViewMode] = useState<'preview' | 'full'>('preview');
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10); // Standard for full view
    const [isRowsDropdownOpen, setIsRowsDropdownOpen] = useState(false);

    const toggleRowsDropdown = () => setIsRowsDropdownOpen(!isRowsDropdownOpen);

    // Reset filters and view mode when tab changes
    React.useEffect(() => {
        setSortBy('time');
        setFilterBy('all');
        setIsSortOpen(false);
        setIsFilterOpen(false);
        setViewMode('preview'); // Reset to preview on tab switch
        setCurrentPage(1);
    }, [subTab]);

    const handleViewAll = () => {
        setViewMode('full');
    };

    const toggleSort = () => { setIsSortOpen(!isSortOpen); setIsFilterOpen(false); };
    const toggleFilter = () => { setIsFilterOpen(!isFilterOpen); setIsSortOpen(false); };

    // --- MOVE filteredData HERE ---
    const filteredData = React.useMemo(() => {
        if (subTab === 'Trades') {
            let result = [...MOCK_TRADE_HISTORY];
            // Filter
            if (filterBy === 'long') result = result.filter(t => t.direction.toLowerCase().includes('long'));
            if (filterBy === 'short') result = result.filter(t => t.direction.toLowerCase().includes('short'));
            if (filterBy === 'win') result = result.filter(t => t.closedPnl > 0);
            if (filterBy === 'loss') result = result.filter(t => t.closedPnl <= 0);

            // Sort
            result.sort((a, b) => {
                if (sortBy === 'time') return b.time.localeCompare(a.time);
                if (sortBy === 'pnl') return b.closedPnl - a.closedPnl;
                if (sortBy === 'size') return b.size - a.size;
                return 0;
            });
            return result;
        } else {
            let result = [...MOCK_ORDER_HISTORY];
            // Filter
            if (filterBy === 'filled') result = result.filter(o => o.status === 'Filled');
            if (filterBy === 'cancelled') result = result.filter(o => o.status === 'Cancelled');

            // Sort
            result.sort((a, b) => b.time.localeCompare(a.time));

            return result;
        }
    }, [subTab, filterBy, sortBy]);

    // Pagination Logic (Now filteredData is defined)
    const totalItems = filteredData.length;
    const itemsToShow = viewMode === 'preview' ? 5 : rowsPerPage;
    const totalPages = viewMode === 'preview' ? 1 : Math.ceil(totalItems / rowsPerPage);

    // In preview mode, show first 5. In full mode, show paginated slice.
    const startIndex = viewMode === 'preview' ? 0 : (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + itemsToShow;
    const paginatedData = filteredData.slice(startIndex, endIndex);

    const goToPage = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    // Footer Content Renderer
    const renderFooter = () => {
        if (viewMode === 'preview') {
            return (
                <div style={{ padding: '8px 16px', borderTop: '1px solid #3A2530' }}>
                    <span
                        style={{ color: '#00E396', fontSize: '12px', cursor: 'pointer', fontWeight: 500 }}
                        onClick={handleViewAll}
                    >
                        View All
                    </span>
                </div>
            );
        }

        // Full Pagination Controls (Reused Logic)
        return (
            <div className={panelStyles.tableFooter}>
                <div className={panelStyles.footerGrid}>
                    {/* Left: Showing Text */}
                    <div className={panelStyles.footerMessage}>
                        Showing {startIndex + 1} - {Math.min(endIndex, totalItems)} out of {totalItems}
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
                            if (p > totalPages) return null; // Safety

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
        );
    };

    return (
        <div style={{ paddingBottom: '32px' }}>
            <div className={styles.sectionTitle}>History</div>

            <div className={panelStyles.tableContainer} style={{ background: '#12000A', border: '1px solid #3A2530', borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: 'auto', maxHeight: 'calc(100vh - 220px)', minHeight: 0 }}>
                {/* Navbar Style Tabs */}
                <div className={styles.tabsContainer}>
                    <button
                        className={`${styles.tabButton} ${subTab === 'Trades' ? styles.activeTab : ''}`}
                        onClick={() => setSubTab('Trades')}
                    >
                        Trades
                    </button>
                    <button
                        className={`${styles.tabButton} ${subTab === 'Orders' ? styles.activeTab : ''}`}
                        onClick={() => setSubTab('Orders')}
                    >
                        Orders
                    </button>
                </div>
                <div className={panelStyles.controlsContainer} style={{ padding: '16px', borderBottom: '1px solid #3A2530', marginBottom: 0 }}>
                    <div className={panelStyles.controlsLeft}>
                        {/* Sort Dropdown - Only relevant for Trades mainly, Orders usually just Time */}
                        {subTab === 'Trades' && (
                            <div className={panelStyles.dropdownContainer}>
                                <button
                                    className={`${panelStyles.dropdownButton} ${isSortOpen ? panelStyles.active : ''}`}
                                    onClick={toggleSort}
                                >
                                    Sort by <span style={{ color: '#FFE1F2' }}>
                                        {sortBy === 'time' ? 'Time' : sortBy === 'pnl' ? 'PnL' : 'Size'}
                                    </span>
                                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transition: 'transform 0.2s', marginLeft: '6px', transform: isSortOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                                        <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </button>
                                {isSortOpen && (
                                    <div className={panelStyles.dropdownMenu}>
                                        {['time', 'pnl', 'size'].map(s => (
                                            <button
                                                key={s}
                                                className={`${panelStyles.dropdownItem} ${sortBy === s ? panelStyles.selected : ''}`}
                                                onClick={() => { setSortBy(s); setIsSortOpen(false); }}
                                            >
                                                {s === 'pnl' ? 'PnL' : s.charAt(0).toUpperCase() + s.slice(1)}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Filter Dropdown */}
                        <div className={panelStyles.dropdownContainer}>
                            <button
                                className={`${panelStyles.dropdownButton} ${isFilterOpen ? panelStyles.active : ''}`}
                                onClick={toggleFilter}
                            >
                                Filter <span style={{ color: '#FFE1F2' }}>{filterBy === 'all' ? 'All' : filterBy.charAt(0).toUpperCase() + filterBy.slice(1)}</span>
                                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transition: 'transform 0.2s', marginLeft: '6px', transform: isFilterOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                                    <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                            {isFilterOpen && (
                                <div className={panelStyles.dropdownMenu}>
                                    {(subTab === 'Trades'
                                        ? ['all', 'long', 'short', 'win', 'loss']
                                        : ['all', 'filled', 'cancelled']
                                    ).map((filter) => (
                                        <button
                                            key={filter}
                                            className={`${panelStyles.dropdownItem} ${filterBy === filter ? panelStyles.selected : ''}`}
                                            onClick={() => { setFilterBy(filter); setIsFilterOpen(false); }}
                                        >
                                            {filter.charAt(0).toUpperCase() + filter.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {subTab === 'Trades' ? (
                    <TradeHistoryTable trades={paginatedData as TradeHistoryData[]} footerContent={renderFooter()} />
                ) : (
                    <OrderHistoryTable orders={paginatedData as OrderHistoryData[]} footerContent={renderFooter()} />
                )}
            </div>
        </div>
    );
};


export default PortfolioHistory;
