import React, { useState } from 'react';
import styles from './Portfolio.module.css';
import panelStyles from '../Positions/PositionsPanel.module.css';
import PositionRow from '../Positions/PositionRow';
import type { PositionData } from '../Positions/PositionRow';
import OrdersTable from '../Positions/OrdersTable';
import type { OrderData } from '../Positions/OrderRow';



// Mock Data
const MOCK_POSITIONS: PositionData[] = [
    { id: '1', symbol: 'BTC', pair: 'BTC-USD', side: 'Long', size: 0.0055, sizeUsd: 484.24, leverage: '10x', entryPrice: 90648, markPrice: 87724, liquidationPrice: null, unrealizedPnl: -16.14, unrealizedPnlPercent: -32.3, margin: 48.42, funding: 16.64, tp: '--', sl: '--' },
    { id: '2', symbol: 'LINK', pair: 'LINK-USD', side: 'Short', size: 15.32, sizeUsd: 224.50, leverage: '5x', entryPrice: 14.25, markPrice: 13.90, liquidationPrice: 18.50, unrealizedPnl: 5.35, unrealizedPnlPercent: 2.38, margin: 44.90, funding: 0.12, tp: 12.50, sl: 15.00 },
    { id: '3', symbol: 'SOL', pair: 'SOL-USD', side: 'Long', size: 15.0, sizeUsd: 1860.00, leverage: '5x', entryPrice: 120.00, markPrice: 124.00, liquidationPrice: null, unrealizedPnl: 60.00, unrealizedPnlPercent: 3.33, margin: 372.00, funding: 2.50, tp: '150', sl: '100' },
    { id: '4', symbol: 'AVAX', pair: 'AVAX-USD', side: 'Short', size: 50.0, sizeUsd: 1750.00, leverage: '20x', entryPrice: 38.00, markPrice: 35.00, liquidationPrice: 42.00, unrealizedPnl: 150.00, unrealizedPnlPercent: 42.85, margin: 87.50, funding: -1.20, tp: '30', sl: '40' },
    { id: '5', symbol: 'DOGE', pair: 'DOGE-USD', side: 'Long', size: 10000.0, sizeUsd: 1200.00, leverage: '10x', entryPrice: 0.1150, markPrice: 0.1200, liquidationPrice: 0.1050, unrealizedPnl: 50.00, unrealizedPnlPercent: 4.35, margin: 120.00, funding: 0.80, tp: '0.15', sl: '0.10' },
    { id: '6', symbol: 'XRP', pair: 'XRP-USD', side: 'Short', size: 2500.0, sizeUsd: 1500.00, leverage: '5x', entryPrice: 0.6200, markPrice: 0.6000, liquidationPrice: 0.7400, unrealizedPnl: 50.00, unrealizedPnlPercent: 16.66, margin: 300.00, funding: -0.40, tp: '0.50', sl: '0.65' },
    { id: '7', symbol: 'ADA', pair: 'ADA-USD', side: 'Long', size: 2000.0, sizeUsd: 1100.00, leverage: '10x', entryPrice: 0.5400, markPrice: 0.5500, liquidationPrice: 0.4900, unrealizedPnl: 20.00, unrealizedPnlPercent: 3.70, margin: 110.00, funding: 0.30, tp: '--', sl: '--' },
    { id: '8', symbol: 'MATIC', pair: 'MATIC-USD', side: 'Long', size: 1500.0, sizeUsd: 1275.00, leverage: '5x', entryPrice: 0.8200, markPrice: 0.8500, liquidationPrice: 0.6800, unrealizedPnl: 45.00, unrealizedPnlPercent: 7.05, margin: 255.00, funding: 0.25, tp: '1.00', sl: '0.75' },
    { id: '9', symbol: 'DOT', pair: 'DOT-USD', side: 'Short', size: 150.0, sizeUsd: 1050.00, leverage: '10x', entryPrice: 7.200, markPrice: 7.000, liquidationPrice: 7.900, unrealizedPnl: 30.00, unrealizedPnlPercent: 28.57, margin: 105.00, funding: -0.15, tp: '6.00', sl: '7.50' },
    { id: '10', symbol: 'LTC', pair: 'LTC-USD', side: 'Long', size: 15.0, sizeUsd: 1050.00, leverage: '20x', entryPrice: 68.00, markPrice: 70.00, liquidationPrice: 65.00, unrealizedPnl: 30.00, unrealizedPnlPercent: 57.14, margin: 52.50, funding: 0.50, tp: '--', sl: '--' },
    { id: '11', symbol: 'UNI', pair: 'UNI-USD', side: 'Short', size: 200.0, sizeUsd: 1400.00, leverage: '5x', entryPrice: 7.50, markPrice: 7.00, liquidationPrice: 9.00, unrealizedPnl: 100.00, unrealizedPnlPercent: 35.71, margin: 280.00, funding: -0.20, tp: '6.00', sl: '8.00' },
    { id: '12', symbol: 'ATOM', pair: 'ATOM-USD', side: 'Long', size: 100.0, sizeUsd: 950.00, leverage: '10x', entryPrice: 9.20, markPrice: 9.50, liquidationPrice: 8.50, unrealizedPnl: 30.00, unrealizedPnlPercent: 31.57, margin: 95.00, funding: 0.10, tp: '12.00', sl: '8.00' }
];

const MOCK_ORDERS: OrderData[] = [
    { id: '1', time: '30/12/2025 - 16.04.22', type: 'Limit', symbol: 'SOL', direction: 'Long', size: 9.85, originalSize: 9.85, orderValue: 1222.78, price: 124.14, reduceOnly: false, triggerConditions: 'N/A', tp: '--', sl: '--' },
    { id: '2', time: '30/12/2025 - 15.30.00', type: 'Market', symbol: 'ETH', direction: 'Short', size: 1.5, originalSize: 1.5, orderValue: 3500.00, price: 2300.00, reduceOnly: true, triggerConditions: 'N/A', tp: '2200', sl: '2400' },
    { id: '3', time: '29/12/2025 - 10.15.00', type: 'Limit', symbol: 'BTC', direction: 'Long', size: 0.5, originalSize: 0.5, orderValue: 22000.00, price: 44000.00, reduceOnly: false, triggerConditions: 'N/A', tp: '46000', sl: '43000' },
    { id: '4', time: '28/12/2025 - 12.00.00', type: 'Limit', symbol: 'ADA', direction: 'Long', size: 1000, originalSize: 1000, orderValue: 500.00, price: 0.50, reduceOnly: false, triggerConditions: 'N/A', tp: '--', sl: '--' },
    { id: '5', time: '28/12/2025 - 11.45.00', type: 'Market', symbol: 'DOT', direction: 'Short', size: 50, originalSize: 50, orderValue: 350.00, price: 7.00, reduceOnly: true, triggerConditions: 'N/A', tp: '6.50', sl: '7.50' },
    { id: '6', time: '28/12/2025 - 09.30.00', type: 'Limit', symbol: 'AVAX', direction: 'Long', size: 20, originalSize: 20, orderValue: 800.00, price: 40.00, reduceOnly: false, triggerConditions: 'N/A', tp: '45.00', sl: '35.00' },
    { id: '7', time: '27/12/2025 - 18.20.00', type: 'Limit', symbol: 'LINK', direction: 'Short', size: 100, originalSize: 100, orderValue: 1400.00, price: 14.00, reduceOnly: false, triggerConditions: 'N/A', tp: '12.00', sl: '15.00' },
    { id: '8', time: '27/12/2025 - 16.10.00', type: 'Market', symbol: 'UNI', direction: 'Long', size: 200, originalSize: 200, orderValue: 1200.00, price: 6.00, reduceOnly: true, triggerConditions: 'N/A', tp: '--', sl: '--' },
    { id: '9', time: '27/12/2025 - 14.00.00', type: 'Limit', symbol: 'LTC', direction: 'Short', size: 10, originalSize: 10, orderValue: 700.00, price: 70.00, reduceOnly: false, triggerConditions: 'N/A', tp: '65.00', sl: '75.00' },
    { id: '10', time: '26/12/2025 - 10.00.00', type: 'Limit', symbol: 'XRP', direction: 'Long', size: 5000, originalSize: 5000, orderValue: 3000.00, price: 0.60, reduceOnly: false, triggerConditions: 'N/A', tp: '0.70', sl: '0.55' },
    { id: '11', time: '26/12/2025 - 08.30.00', type: 'Market', symbol: 'DOGE', direction: 'Short', size: 10000, originalSize: 10000, orderValue: 1000.00, price: 0.10, reduceOnly: true, triggerConditions: 'N/A', tp: '0.08', sl: '0.12' },
    { id: '12', time: '25/12/2025 - 20.00.00', type: 'Limit', symbol: 'ATOM', direction: 'Long', size: 50, originalSize: 50, orderValue: 500.00, price: 10.00, reduceOnly: false, triggerConditions: 'N/A', tp: '12.00', sl: '9.00' },
    { id: '13', time: '25/12/2025 - 18.00.00', type: 'Limit', symbol: 'NEAR', direction: 'Short', size: 100, originalSize: 100, orderValue: 300.00, price: 3.00, reduceOnly: false, triggerConditions: 'N/A', tp: '2.50', sl: '3.50' },
    { id: '14', time: '25/12/2025 - 15.00.00', type: 'Market', symbol: 'APT', direction: 'Long', size: 20, originalSize: 20, orderValue: 160.00, price: 8.00, reduceOnly: true, triggerConditions: 'N/A', tp: '--', sl: '--' },
    { id: '15', time: '24/12/2025 - 12.00.00', type: 'Limit', symbol: 'ARB', direction: 'Short', size: 1000, originalSize: 1000, orderValue: 1000.00, price: 1.00, reduceOnly: false, triggerConditions: 'N/A', tp: '0.90', sl: '1.10' }
];

const PortfolioPositions: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'Positions' | 'Orders'>('Positions');

    // Sort/Filter
    const [sortBy, setSortBy] = React.useState<string>('default');
    const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('desc');
    const [filterBy, setFilterBy] = React.useState<string>('all');
    const [isSortOpen, setIsSortOpen] = React.useState(false);
    const [isFilterOpen, setIsFilterOpen] = React.useState(false);

    // Pagination / View Mode
    const [viewMode, setViewMode] = useState<'preview' | 'full'>('preview');
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [isRowsDropdownOpen, setIsRowsDropdownOpen] = useState(false);

    const toggleRowsDropdown = () => setIsRowsDropdownOpen(!isRowsDropdownOpen);

    // Reset on tab change
    React.useEffect(() => {
        setSortBy('default');
        setFilterBy('all');
        setIsSortOpen(false);
        setIsFilterOpen(false);
        setViewMode('preview');
        setCurrentPage(1);
    }, [activeTab]);

    const handleViewAll = () => {
        setViewMode('full');
    };

    const toggleSort = () => { setIsSortOpen(!isSortOpen); setIsFilterOpen(false); };
    const toggleFilter = () => { setIsFilterOpen(!isFilterOpen); setIsSortOpen(false); };

    const handleSort = (key: string) => {
        if (sortBy === key) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(key);
            setSortDirection('desc');
        }
    };

    const filteredData = React.useMemo(() => {
        if (activeTab === 'Positions') {
            let result = [...MOCK_POSITIONS];
            // Sort
            if (sortBy === 'value') {
                result.sort((a, b) => sortDirection === 'asc' ? a.sizeUsd - b.sizeUsd : b.sizeUsd - a.sizeUsd);
            } else if (sortBy === 'coin') {
                result.sort((a, b) => sortDirection === 'asc' ? a.symbol.localeCompare(b.symbol) : b.symbol.localeCompare(a.symbol));
            }
            // Filter
            if (filterBy === 'long') result = result.filter(p => p.side === 'Long');
            if (filterBy === 'short') result = result.filter(p => p.side === 'Short');
            return result;
        } else {
            let result = [...MOCK_ORDERS];
            // Sort for orders by orderValue
            if (sortBy === 'orderValue') {
                result.sort((a, b) => sortDirection === 'asc' ? a.orderValue - b.orderValue : b.orderValue - a.orderValue);
            }
            return result;
        }
    }, [activeTab, sortBy, sortDirection, filterBy]);


    // Logic: If items <= 5, just show them. If > 5, show preview with View All button
    const totalItems = filteredData.length;
    const isPaginationNeeded = totalItems > 5;

    let displayedData = filteredData;
    let startIndex = 0;
    let endIndex = totalItems;
    let totalPages = 1;

    if (isPaginationNeeded) {
        if (viewMode === 'preview') {
            displayedData = filteredData.slice(0, 5); // Show 5 in preview
        } else {
            // Full Pagination
            totalPages = Math.ceil(totalItems / rowsPerPage);
            startIndex = (currentPage - 1) * rowsPerPage;
            endIndex = startIndex + rowsPerPage;
            displayedData = filteredData.slice(startIndex, endIndex);
        }
    }

    const goToPage = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const renderFooter = () => {
        if (!isPaginationNeeded) return null;

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

        // Full Pagination Footer
        return (
            <div className={panelStyles.tableFooter}>
                <div className={panelStyles.footerGrid}>
                    <div className={panelStyles.footerMessage}>
                        Showing {startIndex + 1} - {Math.min(endIndex, totalItems)} out of {totalItems}
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
                            if (p > totalPages) return null;

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
        );
    };

    return (
        <div style={{ paddingBottom: '32px' }}>
            <div className={styles.sectionTitle}>Position</div>

            <div className={panelStyles.tableContainer} style={{
                background: '#12000A',
                border: '1px solid #3A2530',
                borderRadius: '12px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                height: 'auto',
                maxHeight: 'calc(100vh - 220px)',
                minHeight: 0
            }}>
                {/* Navbar Style Tabs */}
                <div className={styles.tabsContainer}>
                    <button
                        className={`${styles.tabButton} ${activeTab === 'Positions' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('Positions')}
                    >
                        Positions
                    </button>
                    <button
                        className={`${styles.tabButton} ${activeTab === 'Orders' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('Orders')}
                    >
                        Orders
                    </button>
                </div>

                <div className={panelStyles.controlsContainer} style={{ padding: '16px', borderBottom: '1px solid #3A2530', marginBottom: 0 }}>
                    <div className={panelStyles.controlsLeft}>
                        {/* Sort Dropdown */}
                        <div className={panelStyles.dropdownContainer}>
                            <button
                                className={`${panelStyles.dropdownButton} ${isSortOpen ? panelStyles.active : ''}`}
                                onClick={toggleSort}
                            >
                                Sort by <span style={{ color: '#FFE1F2' }}>
                                    {activeTab === 'Positions'
                                        ? (sortBy === 'value' ? 'Value' : sortBy === 'coin' ? 'Coin' : 'Default')
                                        : 'Default' // Placeholder for Orders sort
                                    }
                                </span>
                                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transition: 'transform 0.2s', marginLeft: '6px', transform: isSortOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                                    <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                            {isSortOpen && (
                                <div className={panelStyles.dropdownMenu}>
                                    {activeTab === 'Positions' ? (
                                        <>
                                            <button className={`${panelStyles.dropdownItem}`} onClick={() => { setSortBy('value'); setIsSortOpen(false); }}>Value</button>
                                            <button className={`${panelStyles.dropdownItem}`} onClick={() => { setSortBy('coin'); setIsSortOpen(false); }}>Coin</button>
                                        </>
                                    ) : (
                                        <button className={`${panelStyles.dropdownItem}`} onClick={() => setIsSortOpen(false)}>Default</button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Filter Dropdown */}
                        <div className={panelStyles.dropdownContainer}>
                            <button
                                className={`${panelStyles.dropdownButton} ${isFilterOpen ? panelStyles.active : ''}`}
                                onClick={toggleFilter}
                            >
                                Filter <span style={{ color: '#FFE1F2' }}>{filterBy.charAt(0).toUpperCase() + filterBy.slice(1)}</span>
                                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transition: 'transform 0.2s', marginLeft: '6px', transform: isFilterOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                                    <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                            {isFilterOpen && (
                                <div className={panelStyles.dropdownMenu}>
                                    {['all', 'long', 'short'].map((filter) => (
                                        <button
                                            key={filter}
                                            className={`${panelStyles.dropdownItem} ${filterBy === filter ? panelStyles.selected : ''}`}
                                            onClick={() => { setFilterBy(filter as any); setIsFilterOpen(false); }}
                                        >
                                            {filter.charAt(0).toUpperCase() + filter.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className={panelStyles.actionButtons}>
                        <span className={panelStyles.actionButtonDanger}>Close All Positions</span>
                    </div>
                </div>

                <div className={panelStyles.tableWrapper}>
                    {activeTab === 'Positions' ? (
                        <table className={panelStyles.table}>
                            <thead>
                                <tr>
                                    <th className={panelStyles.th}>Coin</th>
                                    <th className={panelStyles.th}>Size</th>
                                    <th className={panelStyles.th} style={{ cursor: 'pointer' }} onClick={() => handleSort('value')}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            Position Value
                                            <svg
                                                width="10"
                                                height="6"
                                                viewBox="0 0 10 6"
                                                fill="none"
                                                xmlns="http://www.w3.org/2000/svg"
                                                style={{
                                                    transition: 'transform 0.2s',
                                                    transform: sortBy === 'value' && sortDirection === 'asc' ? 'rotate(180deg)' : 'rotate(0deg)'
                                                }}
                                            >
                                                <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </div>
                                    </th>
                                    <th className={panelStyles.th}>Entry Price</th>
                                    <th className={panelStyles.th}>Mark Price</th>
                                    <th className={panelStyles.th}>PNL (ROE %)</th>
                                    <th className={panelStyles.th}>Liq. Price</th>
                                    <th className={panelStyles.th}>Margin</th>
                                    <th className={panelStyles.th}>Funding</th>
                                    <th className={panelStyles.th}>Close All</th>
                                    <th className={panelStyles.th} style={{ textAlign: 'right' }}>TP/SL</th>
                                </tr>
                            </thead>
                            <tbody>
                                {displayedData.length > 0 ? (
                                    (displayedData as PositionData[]).map(pos => (
                                        <PositionRow key={pos.id} position={pos} />
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={11} style={{ textAlign: 'center', padding: '48px', color: '#A77590' }}>
                                            No open positions
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    ) : (
                        <OrdersTable orders={displayedData as OrderData[]} />
                    )}
                </div>

                {renderFooter()}
            </div>
            {/* End of Table Container */}
        </div>
    );
};

export default PortfolioPositions;
