import React, { useState } from 'react';
import styles from './Portfolio.module.css';
import panelStyles from '../Positions/PositionsPanel.module.css';
import TradeHistoryTable from '../Positions/TradeHistoryTable';
import OrderHistoryTable from '../Positions/OrderHistoryTable';
import type { TradeHistoryData } from '../Positions/TradeHistoryRow';
import type { OrderHistoryData } from '../Positions/OrderHistoryRow';

// Mock Data for Trade History
const MOCK_TRADE_HISTORY: TradeHistoryData[] = [
    {
        id: '1',
        time: '30/12/2025 - 16.04.04',
        symbol: 'SOL',
        direction: 'Open Long',
        price: 124.60,
        size: 5.19,
        sizeAsset: 'SOL',
        tradeValue: 646.66,
        tradeValueAsset: 'USDC',
        fee: 0.29,
        feeAsset: 'USDC',
        closedPnl: -0.29,
        closedPnlAsset: 'USDC'
    },
    {
        id: '2',
        time: '28/12/2025 - 09.30.00',
        symbol: 'ETH',
        direction: 'Close Short',
        price: 2450.00,
        size: 1.0,
        sizeAsset: 'ETH',
        tradeValue: 2450.00,
        tradeValueAsset: 'USDC',
        fee: 1.20,
        feeAsset: 'USDC',
        closedPnl: 150.00,
        closedPnlAsset: 'USDC'
    }
];

// Mock Data for Order History
const MOCK_ORDER_HISTORY: OrderHistoryData[] = [
    {
        id: '1',
        time: '29/12/2025 - 14.20.10',
        type: 'Market',
        symbol: 'ETH',
        direction: 'Short',
        size: 2.5,
        originalSize: 2.5,
        orderValue: 6200.50,
        price: 2480.20,
        reduceOnly: true,
        triggerConditions: 'N/A',
        tp: '--',
        sl: '--',
        status: 'Filled'
    },
    {
        id: '2',
        time: '29/12/2025 - 10.15.00',
        type: 'Limit',
        symbol: 'BTC',
        direction: 'Long',
        size: 0.1,
        originalSize: 0.1,
        orderValue: 4500.00,
        price: 45000.00,
        reduceOnly: false,
        triggerConditions: 'N/A',
        tp: '--',
        sl: '--',
        status: 'Cancelled'
    }
];

const PortfolioHistory: React.FC = () => {
    const [subTab, setSubTab] = useState<'Trades' | 'Orders'>('Trades');

    // Sort/Filter State
    const [sortBy, setSortBy] = useState<string>('time');
    const [filterBy, setFilterBy] = useState<string>('all');
    const [isSortOpen, setIsSortOpen] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    // Reset filters when tab changes
    React.useEffect(() => {
        setSortBy('time');
        setFilterBy('all');
        setIsSortOpen(false);
        setIsFilterOpen(false);
    }, [subTab]);

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
                if (sortBy === 'time') {
                    // Parse date string dd/mm/yyyy - hh.mm.ss
                    // Since standard sort might struggle with this format, let's just do generic string compare for mock data
                    // or proper parsing if strict. Mock data format "30/12/2025 - 16.04.04" is sortable descending string-wise if yyyy is first, but it's not.
                    // For mock purposes, we'll keep it simple or flip based on ID if strict date parsing is too much.
                    // Actually, string compare works "okay-ish" for same year/month, but let's just use string compare Descending for now.
                    return b.time.localeCompare(a.time);
                }
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
            // Orders mainly sort by time in this mock
            result.sort((a, b) => b.time.localeCompare(a.time));

            return result;
        }
    }, [subTab, filterBy, sortBy]);

    const toggleSort = () => { setIsSortOpen(!isSortOpen); setIsFilterOpen(false); };
    const toggleFilter = () => { setIsFilterOpen(!isFilterOpen); setIsSortOpen(false); };

    return (
        <div style={{ paddingBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '16px' }}>
                <div
                    className={styles.sectionTitle}
                    style={{
                        marginBottom: 0,
                        color: subTab === 'Trades' ? '#FFE1F2' : '#A77590',
                        cursor: 'pointer',
                        fontWeight: subTab === 'Trades' ? 500 : 400
                    }}
                    onClick={() => setSubTab('Trades')}
                >
                    Trade History
                </div>
                <div
                    className={styles.sectionTitle}
                    style={{
                        marginBottom: 0,
                        color: subTab === 'Orders' ? '#FFE1F2' : '#A77590',
                        cursor: 'pointer',
                        fontWeight: subTab === 'Orders' ? 500 : 400
                    }}
                    onClick={() => setSubTab('Orders')}
                >
                    Order History
                </div>
            </div>

            <div className={panelStyles.tableContainer} style={{ background: '#12000A', border: '1px solid #3A2530', borderRadius: '12px', overflow: 'hidden' }}>
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
                    <TradeHistoryTable trades={filteredData as TradeHistoryData[]} />
                ) : (
                    <OrderHistoryTable orders={filteredData as OrderHistoryData[]} />
                )}
            </div>
        </div>
    );
};

export default PortfolioHistory;
