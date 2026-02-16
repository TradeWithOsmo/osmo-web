import React from 'react';
import styles from './Portfolio.module.css';
import panelStyles from '../Positions/PositionsPanel.module.css';
import OrdersTable from '../Positions/OrdersTable';
import type { OrderData as UIOrderData } from '../Positions/OrderRow';
import { usePortfolioStore } from '../../store/usePortfolioStore';

const mapOrderToUI = (apiOrder: any): UIOrderData => {
    return {
        id: apiOrder.id,
        time: apiOrder.created_at ? new Date(apiOrder.created_at).toLocaleString() : 'Just now',
        type: (apiOrder.order_type?.charAt(0).toUpperCase() + apiOrder.order_type?.slice(1).replace('_', ' ')) as any,
        symbol: apiOrder.symbol,
        direction: String(apiOrder.side || '').toLowerCase() === 'buy' ? 'Long' : 'Short',
        size: apiOrder.size,
        originalSize: apiOrder.size,
        orderValue: apiOrder.notional_usd,
        price: apiOrder.price || 0,
        reduceOnly: apiOrder.reduce_only || false,
        triggerConditions: apiOrder.stop_price ? `>= ${apiOrder.stop_price}` : 'N/A',
        tp: '--',
        sl: '--',
    };
};

const PortfolioOrders: React.FC = () => {
    const { openOrders } = usePortfolioStore();

    const [sortBy, setSortBy] = React.useState<'value' | 'coin'>('value');
    const [filterBy, setFilterBy] = React.useState<'all' | 'active' | 'long' | 'short'>('all');
    const [isSortOpen, setIsSortOpen] = React.useState(false);
    const [isFilterOpen, setIsFilterOpen] = React.useState(false);

    const filteredOrders = React.useMemo(() => {
        let result = openOrders.map(mapOrderToUI);

        // Filter (openOrders are already "active", keep option for UI consistency)
        if (filterBy === 'long') result = result.filter(o => o.direction === 'Long');
        if (filterBy === 'short') result = result.filter(o => o.direction === 'Short');

        // Sort
        result.sort((a, b) => {
            if (sortBy === 'value') return (b.orderValue || 0) - (a.orderValue || 0);
            if (sortBy === 'coin') return String(a.symbol || '').localeCompare(String(b.symbol || ''));
            return 0;
        });

        return result;
    }, [openOrders, filterBy, sortBy]);

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

            <div
                className={panelStyles.tableContainer}
                style={{
                    background: '#12000A',
                    border: '1px solid #3A2530',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    height: 'auto',
                    maxHeight: 'calc(100vh - 220px)',
                    minHeight: 0
                }}
            >
                <div className={panelStyles.controlsContainer} style={{ padding: '16px', borderBottom: '1px solid #3A2530', marginBottom: 0 }}>
                    <div className={panelStyles.controlsLeft}>
                        {/* Sort Dropdown */}
                        <div className={panelStyles.dropdownContainer}>
                            <button
                                className={`${panelStyles.dropdownButton} ${isSortOpen ? panelStyles.active : ''}`}
                                onClick={toggleSort}
                            >
                                Sort by <span style={{ color: '#FFE1F2' }}>{sortBy === 'value' ? 'Order Value' : 'Coin'}</span>
                                <svg
                                    width="10"
                                    height="6"
                                    viewBox="0 0 10 6"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                    style={{ transition: 'transform 0.2s', marginLeft: '6px', transform: isSortOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                                >
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
                                <svg
                                    width="10"
                                    height="6"
                                    viewBox="0 0 10 6"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                    style={{ transition: 'transform 0.2s', marginLeft: '6px', transform: isFilterOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                                >
                                    <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                            {isFilterOpen && (
                                <div className={panelStyles.dropdownMenu}>
                                    {(['all', 'active', 'long', 'short'] as const).map((filter) => (
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

