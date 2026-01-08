import React from 'react';
import styles from './Portfolio.module.css';
import panelStyles from '../Positions/PositionsPanel.module.css';
import OrdersTable from '../Positions/OrdersTable';
import type { OrderData } from '../Positions/OrderRow';

// Mock Data
const MOCK_ORDERS: OrderData[] = [
    {
        id: '1',
        time: '30/12/2025 - 16.04.22',
        type: 'Limit',
        symbol: 'SOL',
        direction: 'Long',
        size: 9.85,
        originalSize: 9.85,
        orderValue: 1222.78,
        price: 124.14,
        reduceOnly: false,
        triggerConditions: 'N/A',
        tp: '--',
        sl: '--'
    },
    {
        id: '2',
        time: '29/12/2025 - 10.15.00',
        type: 'Market',
        symbol: 'BTC',
        direction: 'Short',
        size: 0.5,
        originalSize: 0.5,
        orderValue: 22500.00,
        price: 45000.00,
        reduceOnly: true,
        triggerConditions: 'Mark < 44000',
        tp: '42000',
        sl: '46000'
    }
];

const PortfolioOrders: React.FC = () => {
    const [sortBy, setSortBy] = React.useState<'value' | 'coin'>('value');
    const [filterBy, setFilterBy] = React.useState<'all' | 'active' | 'long' | 'short'>('all');
    const [isSortOpen, setIsSortOpen] = React.useState(false);
    const [isFilterOpen, setIsFilterOpen] = React.useState(false);

    const filteredOrders = React.useMemo(() => {
        let result = [...MOCK_ORDERS];

        // Filter
        if (filterBy !== 'all') {
            if (filterBy === 'active') {
                // "Active" implies all open orders here.
            } else if (filterBy === 'long') {
                result = result.filter(o => o.direction === 'Long');
            } else if (filterBy === 'short') {
                result = result.filter(o => o.direction === 'Short');
            }
        }

        // Sort
        result.sort((a, b) => {
            if (sortBy === 'value') {
                return b.orderValue - a.orderValue; // Descending value
            } else if (sortBy === 'coin') {
                return a.symbol.localeCompare(b.symbol); // Alphabetical
            }
            return 0;
        });

        return result;
    }, [filterBy, sortBy]);

    const toggleSort = () => {
        setIsSortOpen(!isSortOpen);
        setIsFilterOpen(false);
    };

    const toggleFilter = () => {
        setIsFilterOpen(!isFilterOpen);
        setIsSortOpen(false);
    };

    return (
        <div style={{ paddingBottom: '32px' }}>
            <div className={styles.sectionTitle}>Open Orders</div>

            <div className={panelStyles.tableContainer} style={{ background: '#12000A', border: '1px solid #3A2530', borderRadius: '12px', overflow: 'hidden' }}>
                <div className={panelStyles.controlsContainer} style={{ padding: '16px', borderBottom: '1px solid #3A2530', marginBottom: 0 }}>
                    <div className={panelStyles.controlsLeft}>
                        {/* Sort Dropdown */}
                        <div className={panelStyles.dropdownContainer}>
                            <button
                                className={`${panelStyles.dropdownButton} ${isSortOpen ? panelStyles.active : ''}`}
                                onClick={toggleSort}
                            >
                                Sort by <span style={{ color: '#FFE1F2' }}>{sortBy === 'value' ? 'Order Value' : 'Coin'}</span>
                                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transition: 'transform 0.2s', marginLeft: '6px', transform: isSortOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                                    <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                            {isSortOpen && (
                                <div className={panelStyles.dropdownMenu}>
                                    <button
                                        className={`${panelStyles.dropdownItem} ${sortBy === 'value' ? panelStyles.selected : ''}`}
                                        onClick={() => { setSortBy('value'); setIsSortOpen(false); }}
                                    >
                                        Order Value
                                    </button>
                                    <button
                                        className={`${panelStyles.dropdownItem} ${sortBy === 'coin' ? panelStyles.selected : ''}`}
                                        onClick={() => { setSortBy('coin'); setIsSortOpen(false); }}
                                    >
                                        Coin
                                    </button>
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
                                    {['all', 'active', 'long', 'short'].map((filter) => (
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
                        <span className={panelStyles.actionButtonDanger}>Cancel All Open Orders</span>
                    </div>
                </div>

                <OrdersTable orders={filteredOrders} />
            </div>
        </div>
    );
};

export default PortfolioOrders;
