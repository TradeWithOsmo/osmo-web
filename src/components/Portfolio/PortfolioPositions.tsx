import React from 'react';
import styles from './Portfolio.module.css';
import panelStyles from '../Positions/PositionsPanel.module.css'; // Reusing table styles
import PositionRow from '../Positions/PositionRow';
import type { PositionData } from '../Positions/PositionRow';

// Mock Data (Duplicated for now)
const MOCK_POSITIONS: PositionData[] = [
    {
        id: '1',
        symbol: 'BTC',
        pair: 'BTC-USD',
        side: 'Long',
        size: 0.0055,
        sizeUsd: 484.24,
        leverage: '10x',
        entryPrice: 90648,
        markPrice: 87724,
        liquidationPrice: null,
        unrealizedPnl: -16.14,
        unrealizedPnlPercent: -32.3,
        margin: 48.42,
        funding: 16.64,
        tp: '--',
        sl: '--'
    },
    {
        id: '2',
        symbol: 'LINK',
        pair: 'LINK-USD',
        side: 'Short',
        size: 15.32,
        sizeUsd: 224.50,
        leverage: '5x',
        entryPrice: 14.25,
        markPrice: 13.90,
        liquidationPrice: 18.50,
        unrealizedPnl: 5.35,
        unrealizedPnlPercent: 2.38,
        margin: 44.90,
        funding: 0.12,
        tp: 12.50,
        sl: 15.00
    }
];

const PortfolioPositions: React.FC = () => {
    const [sortBy, setSortBy] = React.useState<'value' | 'coin'>('value');
    const [filterBy, setFilterBy] = React.useState<'all' | 'active' | 'long' | 'short'>('all');
    const [isSortOpen, setIsSortOpen] = React.useState(false);
    const [isFilterOpen, setIsFilterOpen] = React.useState(false);

    // Close dropdowns when clicking outside functionality can be added here if needed, 
    // for now we'll use simple toggles.

    const filteredPositions = React.useMemo(() => {
        let result = [...MOCK_POSITIONS];

        // Filter
        if (filterBy !== 'all') {
            if (filterBy === 'active') {
                // Assuming 'active' means all open positions, which is currently all of them in this context.
                // Or maybe specific status if we had one. For now, let's assume 'Active' implies > 0 size or similar.
                // Since this is "Open Positions", effectively all are active.
                // But typically "Active" might filter out closed/history if they were mixed.
                // Given the instructions: "all - active - long - short"
                // 'all' and 'active' might be redundant here, but we'll implementation logic.
            } else if (filterBy === 'long') {
                result = result.filter(p => p.side === 'Long');
            } else if (filterBy === 'short') {
                result = result.filter(p => p.side === 'Short');
            }
        }

        // Sort
        result.sort((a, b) => {
            if (sortBy === 'value') {
                return b.sizeUsd - a.sizeUsd; // Descending value
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
            <div className={styles.sectionTitle}>Open Positions</div>

            <div className={panelStyles.tableContainer} style={{ background: '#12000A', border: '1px solid #3A2530', borderRadius: '12px' }}>
                <div className={panelStyles.controlsContainer} style={{ padding: '16px', borderBottom: '1px solid #3A2530', marginBottom: 0 }}>
                    <div className={panelStyles.controlsLeft}>
                        {/* Sort Dropdown */}
                        <div className={panelStyles.dropdownContainer}>
                            <button
                                className={`${panelStyles.dropdownButton} ${isSortOpen ? panelStyles.active : ''}`}
                                onClick={toggleSort}
                            >
                                Sort by <span style={{ color: '#FFE1F2' }}>{sortBy === 'value' ? 'Position Value' : 'Coin'}</span>
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
                                        Position Value
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
                        <span className={panelStyles.actionButtonDanger}>Close All Positions</span>
                    </div>
                </div>

                <table className={panelStyles.table}>
                    <thead>
                        <tr>
                            <th className={panelStyles.th}>Coin</th>
                            <th className={panelStyles.th}>Size</th>
                            <th className={panelStyles.th}>Position Value <span style={{ fontSize: '8px' }}>▼</span></th>
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
                        {filteredPositions.length > 0 ? (
                            filteredPositions.map(pos => (
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
            </div>
            {/* End of Table Container */}
        </div>
    );
};

export default PortfolioPositions;
