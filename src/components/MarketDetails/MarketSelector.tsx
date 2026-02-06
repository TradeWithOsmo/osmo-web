import React, { useState, useEffect, useMemo } from 'react';
import styles from './MarketSelector.module.css';
import inactiveStar from '../../assets/Icons/start/inactive.png';
import activeStar from '../../assets/Icons/start/active.png';
import { useMarketStore } from '../../store/useMarketStore';
import { useWatchlistStore } from '../../store/useWatchlistStore';
import { type MarketData } from '../../api/marketService';
import { useWallet } from '../../hooks/useWallet';
import TokenIcon from './TokenIcon';
import OstiumIcon from './OstiumIcon';

// Fallback search icon if file doesn't exist (SVG)
const SearchSVG = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z" stroke="#A77590" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M21 21L16.65 16.65" stroke="#A77590" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export interface MarketSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect?: (market: MarketData) => void;
    isEmbedded?: boolean;
}

const MarketSelector: React.FC<MarketSelectorProps> = ({ isOpen, onClose, onSelect, isEmbedded = false }) => {
    const { markets, fetchMarkets, setMarket } = useMarketStore();
    const { favorites, toggleFavorite, fetchWatchlist } = useWatchlistStore();
    const { authenticated, walletAddress } = useWallet();
    const [filter, setFilter] = useState('All');
    const [search, setSearch] = useState('');
    const [expandedGroup, setExpandedGroup] = useState<'hyperliquid' | 'ostium' | null>(null);

    // Sorting State
    const [sortConfig, setSortConfig] = useState<{ key: keyof MarketData, direction: 'asc' | 'desc' } | null>({ key: 'change24hPercent', direction: 'desc' });

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(50);
    const [isRowsDropdownOpen, setIsRowsDropdownOpen] = useState(false);

    // Drag to scroll for filters
    const scrollContainerRef = React.useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        if (scrollContainerRef.current) {
            setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
            setScrollLeft(scrollContainerRef.current.scrollLeft);
        }
    };

    const handleMouseLeave = () => {
        setIsDragging(false);
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !scrollContainerRef.current) return;
        e.preventDefault();
        const x = e.pageX - scrollContainerRef.current.offsetLeft;
        const walk = (x - startX) * 2; // Scroll-fast
        scrollContainerRef.current.scrollLeft = scrollLeft - walk;
    };

    useEffect(() => {
        // Fetch markets if empty
        if (markets.length === 0) {
            fetchMarkets();
        }
        if (authenticated && walletAddress) {
            fetchWatchlist(walletAddress);
        } else {
            fetchWatchlist(); // Will clear watchlist due to store update
        }
    }, [markets.length, fetchMarkets, fetchWatchlist, authenticated, walletAddress]);

    useEffect(() => {
        if (!isEmbedded) {
            if (isOpen) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = 'unset';
            }
            return () => {
                document.body.style.overflow = 'unset';
            };
        }
    }, [isOpen, isEmbedded]);

    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [filter, search]);

    const handleSort = (key: keyof MarketData) => {
        let direction: 'asc' | 'desc' = 'desc'; // Default to descending
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'desc') {
            direction = 'asc';
        }
        setSortConfig({ key, direction });
    };

    const filteredDataAll = markets.filter(item => {
        const matchesSearch = item.symbol.toLowerCase().includes(search.toLowerCase());
        if (!matchesSearch) return false;

        if (filter === 'All') return true;
        if (filter === 'Watchlist') {
            return favorites.has(`${item.source || 'hyperliquid'}:${item.symbol}`);
        }
        if (filter === 'Crypto') {
            return item.source === 'hyperliquid' || item.category === 'Crypto';
        }
        return item.category === filter;
    });

    // Sorting Logic
    const sortedData = useMemo(() => {
        let sortableItems = [...filteredDataAll];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                const { key, direction } = sortConfig;
                const dir = direction === 'asc' ? 1 : -1;

                const valA = a[key];
                const valB = b[key];

                // Fields that should be treated as numbers
                const numericFields: (keyof MarketData)[] = [
                    'price', 'change24h', 'change24hPercent',
                    'high24h', 'low24h', 'volume24h'
                ];

                if (numericFields.includes(key)) {
                    const parseVal = (v: any) => {
                        if (typeof v === 'number') return v;
                        if (typeof v === 'string') return parseFloat(v.replace(/,/g, '').replace(/%/g, ''));
                        return NaN;
                    };
                    const numA = parseVal(valA);
                    const numB = parseVal(valB);
                    if (!isNaN(numA) && !isNaN(numB)) {
                        return dir * (numA - numB);
                    }
                }

                if (typeof valA === 'string' && typeof valB === 'string') {
                    return dir * valA.localeCompare(valB);
                }
                if (typeof valA === 'number' && typeof valB === 'number') {
                    return dir * (valA - valB);
                }
                return 0;
            });
        }
        return sortableItems;
    }, [filteredDataAll, sortConfig]);

    // Pagination Logic
    const totalItems = sortedData.length;
    const totalPages = Math.ceil(totalItems / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const paginatedData = sortedData.slice(startIndex, startIndex + rowsPerPage);

    if (!isEmbedded && !isOpen) return null;

    const toggleRowsDropdown = () => setIsRowsDropdownOpen(!isRowsDropdownOpen);

    const goToPage = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const handleItemClick = (item: MarketData) => {
        setMarket(item.symbol);
        if (onSelect) onSelect(item);
        if (!isEmbedded) onClose();
    }

    // Categories Groups
    const HL_CATEGORIES = ['Crypto', 'Meme', 'Layer 1', 'Layer 2', 'DeFi', 'AI & Big Data', 'Infrastructure', 'DePIN', 'Gaming', 'RWA'];
    const OST_CATEGORIES = ['Forex', 'Stocks', 'Commodities', 'index'];

    const getGroupCount = (group: 'hyperliquid' | 'ostium') => {
        if (group === 'hyperliquid') {
            return markets.filter(m => m.source === 'hyperliquid' || m.category === 'Crypto').length;
        }
        return markets.filter(m => m.source === 'ostium').length;
    };

    const SortIcon = ({ columnKey }: { columnKey: keyof MarketData }) => {
        const active = sortConfig?.key === columnKey;
        const direction = sortConfig?.direction || 'desc';
        const activeColor = '#FFE1F2';
        const inactiveColor = 'rgba(93, 64, 80, 0.3)';

        return (
            <svg width="8" height="11" viewBox="0 0 10 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                    d="M5 0L9 4H1L5 0Z"
                    fill={active && direction === 'desc' ? activeColor : inactiveColor}
                    stroke={active && direction === 'desc' ? activeColor : inactiveColor}
                    strokeWidth="1.2"
                    strokeLinejoin="round"
                />
                <path
                    d="M5 14L1 10H9L5 14Z"
                    fill={active && direction === 'asc' ? activeColor : inactiveColor}
                    stroke={active && direction === 'asc' ? activeColor : inactiveColor}
                    strokeWidth="1.2"
                    strokeLinejoin="round"
                />

            </svg>
        );
    };

    // Helper for formatting
    const formatPrice = (val: number) => {
        if (!val && val !== 0) return '-';
        if (val === 0) return '0.0000';

        const locale = 'en-US';

        if (val >= 100) {
            return `${val.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
        return `${val.toLocaleString(locale, { minimumFractionDigits: 4, maximumFractionDigits: 4 })}`;
    }
    const formatVol = (val: number) => {
        if (!val && val !== 0) return '-';
        if (val === 0) return '0.00';

        if (val >= 1000000000) return `${(val / 1000000000).toFixed(2)}B`;
        if (val >= 1000000) return `${(val / 1000000).toFixed(2)}M`;
        if (val >= 1000) return `${(val / 1000).toFixed(2)}K`;
        return `${val.toFixed(2)}`;
    }

    const formatPercent = (val: number) => {
        if (!val && val !== 0) return '0.00%';
        const absVal = Math.abs(val);
        if (absVal === 0) return '0.00%';

        if (absVal < 0.1) {
            return `${val.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })}%`;
        }
        return `${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
    }

    const content = (
        <div className={`${styles.container} ${isEmbedded ? styles.embedded : ''}`} onClick={e => !isEmbedded && e.stopPropagation()}>
            {/* 1. Filters (Tabs) */}
            <div
                className={styles.filters}
                ref={scrollContainerRef}
                onMouseDown={handleMouseDown}
                onMouseLeave={handleMouseLeave}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
                style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
            >
                {/* 1. All */}
                <button
                    className={`${styles.filterChip} ${filter === 'All' ? styles.active : ''}`}
                    onClick={() => {
                        setFilter('All');
                        setExpandedGroup(null);
                    }}
                >
                    All
                    <span className={styles.countBadge}>{markets.length}</span>
                </button>

                {/* Watchlist */}
                <button
                    className={`${styles.filterChip} ${filter === 'Watchlist' ? styles.active : ''}`}
                    onClick={() => {
                        setFilter('Watchlist');
                        setExpandedGroup(null);
                    }}
                >
                    Watchlist
                    <span className={styles.countBadge}>{favorites.size}</span>
                </button>

                {/* 2. Hyperliquid Group */}
                <div className={`${styles.groupContainer} ${expandedGroup === 'hyperliquid' ? styles.expanded : ''}`}>
                    <button
                        className={`${styles.filterChip} ${expandedGroup === 'hyperliquid' ? styles.activeGroup : ''}`}
                        onClick={() => setExpandedGroup(expandedGroup === 'hyperliquid' ? null : 'hyperliquid')}
                    >
                        Hyperliquid
                        <span className={styles.countBadge}>{getGroupCount('hyperliquid')}</span>
                    </button>

                    <div className={styles.subCategories}>
                        {HL_CATEGORIES.map(f => {
                            const count = f === 'Crypto'
                                ? markets.filter(m => m.source === 'hyperliquid' || m.category === 'Crypto').length
                                : markets.filter(m => m.category === f).length;

                            if (count === 0) return null;
                            return (
                                <button
                                    key={f}
                                    className={`${styles.filterChip} ${styles.subChip} ${filter === f ? styles.active : ''}`}
                                    onClick={() => {
                                        setFilter(f);
                                        setExpandedGroup(null);
                                    }}
                                >
                                    {f}
                                    <span className={styles.countBadge}>{count}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 3. Ostium Group */}
                <div className={`${styles.groupContainer} ${expandedGroup === 'ostium' ? styles.expanded : ''}`}>
                    <button
                        className={`${styles.filterChip} ${expandedGroup === 'ostium' ? styles.activeGroup : ''}`}
                        onClick={() => setExpandedGroup(expandedGroup === 'ostium' ? null : 'ostium')}
                    >
                        Ostium
                        <span className={styles.countBadge}>{getGroupCount('ostium')}</span>
                    </button>

                    <div className={styles.subCategories}>
                        {OST_CATEGORIES.map(f => {
                            const count = markets.filter(m => m.category === f).length;
                            if (count === 0) return null;
                            return (
                                <button
                                    key={f}
                                    className={`${styles.filterChip} ${styles.subChip} ${filter === f ? styles.active : ''}`}
                                    onClick={() => {
                                        setFilter(f);
                                        setExpandedGroup(null);
                                    }}
                                >
                                    {f}
                                    <span className={styles.countBadge}>{count}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* 2. Search Section */}
            <div className={styles.searchSection}>
                <div className={styles.searchBar}>
                    <SearchSVG />
                    <input
                        type="text"
                        className={styles.searchInput}
                        placeholder="e.g. &quot;ETH&quot; or &quot;EUR&quot;"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        autoFocus={!isEmbedded}
                    />
                </div>
            </div>

            {/* Table */}
            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th className={styles.thFirst}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    Market
                                </div>
                            </th>
                            <th onClick={(e) => { e.stopPropagation(); handleSort('price'); }} style={{ cursor: 'pointer' }} className={`${styles.thRight} ${styles.hideOnSmallMobile}`}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                                    Price
                                    <SortIcon columnKey="price" />
                                </div>
                            </th>
                            <th onClick={(e) => { e.stopPropagation(); handleSort('change24hPercent'); }} style={{ cursor: 'pointer' }} className={styles.thRight}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                                    24h %
                                    <SortIcon columnKey="change24hPercent" />
                                </div>
                            </th>
                            <th
                                style={{ cursor: 'pointer' }}
                                onClick={(e) => { e.stopPropagation(); handleSort('volume24h'); }}
                                className={`${styles.thRight} ${styles.hideOnMobile}`}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                                    Vol / OI
                                    <SortIcon columnKey="volume24h" />
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedData.map(item => {
                            const isPositive = item.change24hPercent >= 0;

                            return (
                                <tr key={`${item.source || 'hyperliquid'}:${item.symbol}`} onClick={() => handleItemClick(item)}>
                                    <td className={`${styles.marketCell} ${styles.tdFirst}`}>
                                        <button
                                            className={styles.starBtn}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (authenticated && walletAddress) {
                                                    toggleFavorite(item.symbol, item.source, walletAddress);
                                                }
                                            }}
                                            style={{ opacity: authenticated ? 1 : 0.5, cursor: authenticated ? 'pointer' : 'not-allowed' }}
                                            title={authenticated ? "Toggle Favorite" : "Connect wallet to manage favorites"}
                                        >
                                            <img
                                                src={favorites.has(`${item.source || 'hyperliquid'}:${item.symbol}`) ? activeStar : inactiveStar}
                                                alt="fav"
                                                style={{ width: 14, height: 14 }}
                                            />
                                        </button>
                                        <div className={styles.coinIcon} style={{ background: 'transparent' }}>
                                            {item.source === 'ostium' ? (
                                                <OstiumIcon symbol={item.symbol} size={24} />
                                            ) : (
                                                <TokenIcon symbol={item.symbol} size={24} />
                                            )}
                                        </div>
                                        <span className={styles.symbol}>{item.symbol}</span>
                                        <div className={styles.badges}>
                                            <span className={styles.feeBadge}>{item.source}</span>
                                        </div>
                                    </td>
                                    <td className={`${styles.tdRight} ${styles.hideOnSmallMobile}`}>{formatPrice(item.price)}</td>
                                    <td className={`${styles.tdRight} ${!isPositive ? styles.negative : styles.positive}`}>
                                        {isPositive ? '+' : ''}{formatPercent(item.change24hPercent)}
                                    </td>
                                    <td className={`${styles.tdRight} ${styles.hideOnMobile}`}>{formatVol(item.volume24h)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Footer */}
            <div className={styles.tableFooter}>
                <div className={styles.footerGrid}>
                    <div className={styles.footerMessage}>
                        Showing {totalItems === 0 ? 0 : startIndex + 1} - {Math.min(startIndex + rowsPerPage, totalItems)} out of {totalItems}
                    </div>

                    <div className={styles.footerControls}>
                        <button
                            className={styles.paginationButton}
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
                            if (p > totalPages || p < 1) return null;

                            return (
                                <button
                                    key={p}
                                    className={`${styles.paginationButton} ${currentPage === p ? styles.active : ''}`}
                                    onClick={() => goToPage(p)}
                                >
                                    {p}
                                </button>
                            );
                        })}

                        <button
                            className={styles.paginationButton}
                            onClick={() => goToPage(currentPage + 1)}
                            disabled={currentPage === totalPages}
                        >
                            &gt;
                        </button>
                    </div>

                    <div className={styles.footerActions}>
                        <span>Show</span>
                        <div className={styles.dropdownContainer}>
                            <button
                                className={`${styles.dropdownButton} ${isRowsDropdownOpen ? styles.active : ''}`}
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
                                <div className={styles.dropdownMenu} style={{ minWidth: '60px', bottom: '100%', top: 'auto', marginBottom: '4px' }}>
                                    {[10, 20, 50, 100].map((rows) => (
                                        <button
                                            key={rows}
                                            className={`${styles.dropdownItem} ${rowsPerPage === rows ? styles.selected : ''}`}
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
    );

    if (isEmbedded) return content;

    return (
        <div className={styles.overlay} onClick={onClose}>
            {content}
        </div>
    );
};

export default MarketSelector;
