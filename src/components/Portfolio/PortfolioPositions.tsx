import React, { useState, useEffect } from 'react';
import styles from './Portfolio.module.css';
import panelStyles from '../Positions/PositionsPanel.module.css';
import PositionRow from '../Positions/PositionRow';
import type { PositionData } from '../Positions/PositionRow';
import OrdersTable from '../Positions/OrdersTable';
import type { OrderData } from '../Positions/OrderRow';
import { useUIStore } from '../../store/useUIStore';
import { usePortfolioStore } from '../../store/usePortfolioStore';
import { useWallet } from '../../hooks/useWallet';

// Map API data to UI format (Keep for future use)
/*
const mapAPIPositionToUI = (apiPos: APIPositionData): PositionData => {
    ...
};
*/



// ------------------------------------------------------------------------------------------------

const PortfolioPositions: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'Positions' | 'Orders'>('Positions');

    // Get data from store
    const { positions, openOrders, fetchPositions, fetchOrders, isLoading, error } = usePortfolioStore();
    const { openCloseAllModal } = useUIStore();

    // Get wallet from Privy
    const { authenticated, walletAddress } = useWallet();

    // Fetch data on mount and tab change
    useEffect(() => {
        if (!authenticated || !walletAddress) return;

        // Poll every 5 seconds or fetch once
        const fetchData = () => {
            if (activeTab === 'Positions') {
                fetchPositions(walletAddress);
            } else {
                fetchOrders(walletAddress, 'pending');
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 3000); // Poll every 3 seconds for faster updates
        return () => clearInterval(interval);
    }, [activeTab, authenticated, walletAddress]); // Removed fetchReferences to avoid re-triggering

    // Error Toast
    useEffect(() => {
        if (error) {
            // toast.error(error); // Optional: prevent spamming toasts on poll
            console.error(error);
        }
    }, [error]);

    // Sort/Filter State
    const [sortBy, setSortBy] = React.useState<string>('default');
    const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('desc');
    const [filterBy, setFilterBy] = React.useState<string>('all');
    const [isSortOpen, setIsSortOpen] = React.useState(false);
    const [isFilterOpen, setIsFilterOpen] = React.useState(false);

    // Pagination / View Mode State
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

    // Data Mappers
    const mapAPIPositionToUI = (apiPos: any): PositionData => {
        const isLong = apiPos.side.toLowerCase() === 'long';
        return {
            id: apiPos.id,
            symbol: apiPos.symbol,
            pair: apiPos.symbol, // backend usually returns pair like SOL-USD
            side: isLong ? 'Long' : 'Short',
            size: apiPos.size,
            sizeUsd: apiPos.size * apiPos.mark_price, // Calculate approximate USD value
            leverage: `${apiPos.leverage}x`,
            entryPrice: apiPos.entry_price,
            markPrice: apiPos.mark_price || apiPos.entry_price, // Fallback
            liquidationPrice: apiPos.liquidation_price,
            unrealizedPnl: apiPos.unrealized_pnl,
            unrealizedPnlPercent: (apiPos.unrealized_pnl / (apiPos.margin_used || 1)) * 100, // ROI calc
            margin: apiPos.margin_used || 0,
            funding: 0, // Not provided by API yet
            tp: apiPos.tp || '--',
            sl: apiPos.sl || '--'
        };
    };

    const mapAPIOrderToUI = (apiOrder: any): OrderData => {
        return {
            id: apiOrder.id,
            time: apiOrder.created_at ? new Date(apiOrder.created_at).toLocaleString() : 'Just now',
            type: (apiOrder.order_type.charAt(0).toUpperCase() + apiOrder.order_type.slice(1).replace('_', ' ')) as any,
            symbol: apiOrder.symbol,
            direction: apiOrder.side.toLowerCase() === 'buy' ? 'Long' : 'Short',
            size: apiOrder.size,
            originalSize: apiOrder.size, // Assuming partial fills logic handled elsewhere or same
            orderValue: apiOrder.notional_usd,
            price: apiOrder.price || 0,
            reduceOnly: false, // API doesn't return this yet
            triggerConditions: apiOrder.stop_price ? `>= ${apiOrder.stop_price}` : 'N/A', // Simple logic
            tp: '--', // Backend TODO: Return TP/SL for orders
            sl: '--'
        };
    };

    const filteredData = React.useMemo(() => {
        if (activeTab === 'Positions') {
            let result = positions.map(mapAPIPositionToUI);

            // Sort
            if (sortBy === 'value') {
                result.sort((a: PositionData, b: PositionData) => sortDirection === 'asc' ? a.sizeUsd - b.sizeUsd : b.sizeUsd - a.sizeUsd);
            } else if (sortBy === 'coin') {
                result.sort((a: PositionData, b: PositionData) => sortDirection === 'asc' ? a.symbol.localeCompare(b.symbol) : b.symbol.localeCompare(a.symbol) || 0);
            }
            // Filter
            if (filterBy === 'long') result = result.filter((p: PositionData) => p.side === 'Long');
            if (filterBy === 'short') result = result.filter((p: PositionData) => p.side === 'Short');
            return result;
        } else {
            let result = openOrders.map(mapAPIOrderToUI);

            if (sortBy === 'orderValue') {
                result.sort((a: OrderData, b: OrderData) => sortDirection === 'asc' ? a.orderValue - b.orderValue : b.orderValue - a.orderValue);
            }
            return result;
        }
    }, [activeTab, sortBy, sortDirection, filterBy, positions, openOrders]);


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
                        <button
                            className={panelStyles.actionButtonDanger}
                            style={{
                                background: 'none',
                                border: 'none',
                                padding: 0,
                                font: 'inherit',
                                color: '#FF4560',
                                cursor: 'pointer'
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                openCloseAllModal();
                            }}
                        >
                            Close All Positions
                        </button>
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
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={11} style={{ textAlign: 'center', padding: '48px', color: '#A77590' }}>
                                            Loading positions...
                                        </td>
                                    </tr>
                                ) : displayedData.length > 0 ? (
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
