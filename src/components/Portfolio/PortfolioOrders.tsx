import React, { useEffect } from 'react';
import styles from './Portfolio.module.css';
import panelStyles from '../Positions/PositionsPanel.module.css';
import OrdersTable from '../Positions/OrdersTable';
import type { OrderData as UIOrderData } from '../Positions/OrderRow';
import { usePortfolioStore } from '../../store/usePortfolioStore';
import { useWallet } from '../../hooks';
import type { OrderData as APIOrderData } from '../../api/orderService';

// Mapper function to convert backend data to UI format
const mapAPIOrderToUI = (apiOrder: APIOrderData): UIOrderData => {
    return {
        id: apiOrder.id,
        time: apiOrder.created_at ? new Date(apiOrder.created_at).toLocaleString() : 'N/A',
        type: (apiOrder.order_type.charAt(0).toUpperCase() + apiOrder.order_type.slice(1)) as any,
        symbol: apiOrder.symbol.split('-')[0],
        direction: (apiOrder.side === 'buy' ? 'Long' : 'Short') as any,
        size: apiOrder.size,
        originalSize: apiOrder.size,
        orderValue: apiOrder.notional_usd,
        price: apiOrder.price || 0,
        reduceOnly: false,
        triggerConditions: apiOrder.stop_price ? `Stop @ ${apiOrder.stop_price}` : 'N/A',
        tp: '--',
        sl: '--'
    };
};

const PortfolioOrders: React.FC = () => {
    const { openOrders, fetchOrders } = usePortfolioStore();
    const { walletAddress, authenticated } = useWallet();

    const [sortBy, setSortBy] = React.useState<'value' | 'coin'>('value');
    const [filterBy, setFilterBy] = React.useState<'all' | 'active' | 'long' | 'short'>('all');
    const [isSortOpen, setIsSortOpen] = React.useState(false);
    const [isFilterOpen, setIsFilterOpen] = React.useState(false);

    useEffect(() => {
        if (authenticated && walletAddress) {
            fetchOrders(walletAddress, 'pending');
        }
    }, [authenticated, walletAddress, fetchOrders]);

    const filteredOrders = React.useMemo(() => {
        if (!authenticated || !walletAddress) return [];

        // Map API data to UI format
        let result = openOrders.map(mapAPIOrderToUI);

        // Filter
        if (filterBy !== 'all') {
            if (filterBy === 'long') {
                result = result.filter(o => o.direction === 'Long');
            } else if (filterBy === 'short') {
                result = result.filter(o => o.direction === 'Short');
            }
        }

        // Sort
        result.sort((a, b) => {
            if (sortBy === 'value') {
                return b.orderValue - a.orderValue;
            } else if (sortBy === 'coin') {
                return a.symbol.localeCompare(b.symbol);
            }
            return 0;
        });

        return result;
    }, [filterBy, sortBy, openOrders, authenticated, walletAddress]);

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

            <div className={panelStyles.tableContainer} style={{ background: '#12000A', border: '1px solid #3A2530', borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: 'auto', maxHeight: 'calc(100vh - 220px)', minHeight: 0 }}>
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
