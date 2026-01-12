import React, { useState, useEffect } from 'react';
import styles from './MarketSelector.module.css';
import activeStar from '../../assets/Icons/start/active.png';
import inactiveStar from '../../assets/Icons/start/inactive.png';

// Fallback search icon if file doesn't exist (SVG)
const SearchSVG = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z" stroke="#A77590" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M21 21L16.65 16.65" stroke="#A77590" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export interface MarketItem {
    id: string;
    symbol: string;
    base: string;
    quote: string;
    leverage: string;
    tags: string[];
    price: string;
    change: string;
    volume: string;
    spotVol: string;
    mktCap: string;
    isFavorite: boolean;
}

const MOCK_DATA: MarketItem[] = [
    { id: '1', symbol: 'BTC-USD', base: 'BTC', quote: 'USD', leverage: '50x', tags: ['No Fees'], price: '$89,543', change: '2.16%', volume: '$127M', spotVol: '$29.3B', mktCap: '$1.79T', isFavorite: false },
    { id: '2', symbol: 'SOL-USD', base: 'SOL', quote: 'USD', leverage: '20x', tags: ['No Fees'], price: '$127.68', change: '3.01%', volume: '$36.7M', spotVol: '$3.72B', mktCap: '$71.8B', isFavorite: false },
    { id: '3', symbol: 'ETH-USD', base: 'ETH', quote: 'USD', leverage: '50x', tags: [], price: '$3,015.8', change: '2.75%', volume: '$26.6M', spotVol: '$17.7B', mktCap: '$364B', isFavorite: true },
    { id: '4', symbol: 'HYPE-USD', base: 'HYPE', quote: 'USD', leverage: '5x', tags: [], price: '$26.11', change: '1.45%', volume: '$513K', spotVol: '$168M', mktCap: '$8.84B', isFavorite: false },
    { id: '5', symbol: 'DOGE-USD', base: 'DOGE', quote: 'USD', leverage: '10x', tags: [], price: '$0.12692', change: '2.26%', volume: '$508K', spotVol: '$759M', mktCap: '$21.3B', isFavorite: false },
    { id: '6', symbol: 'ZEC-USD', base: 'ZEC', quote: 'USD', leverage: '5x', tags: [], price: '$528.72', change: '2.21%', volume: '$389K', spotVol: '$698M', mktCap: '$8.75B', isFavorite: false },
    { id: '7', symbol: 'LINK-USD', base: 'LINK', quote: 'USD', leverage: '10x', tags: [], price: '$12.790', change: '3.01%', volume: '$304K', spotVol: '$359M', mktCap: '$9.04B', isFavorite: false },
    { id: '8', symbol: 'LTC-USD', base: 'LTC', quote: 'USD', leverage: '10x', tags: [], price: '$79.04', change: '-0.93%', volume: '$287K', spotVol: '$313M', mktCap: '$6.05B', isFavorite: false },
    { id: '9', symbol: 'ADA-USD', base: 'ADA', quote: 'USD', leverage: '10x', tags: [], price: '$0.3756', change: '0.51%', volume: '$236K', spotVol: '$615M', mktCap: '$13.5B', isFavorite: false },
    { id: '10', symbol: 'SHIB-USD', base: 'SHIB', quote: 'USD', leverage: '10x', tags: [], price: '$0.007460', change: '1.28%', volume: '$210K', spotVol: '$79.9M', mktCap: '$4.39B', isFavorite: false },
    { id: '11', symbol: 'AVAX-USD', base: 'AVAX', quote: 'USD', leverage: '10x', tags: [], price: '$12.99', change: '1.77%', volume: '$175K', spotVol: '$267M', mktCap: '$5.56B', isFavorite: false },
    { id: '12', symbol: 'SUI-USD', base: 'SUI', quote: 'USD', leverage: '10x', tags: [], price: '$1.4877', change: '7.07%', volume: '$141K', spotVol: '$499M', mktCap: '$5.50B', isFavorite: false },
];

export interface MarketSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (market: MarketItem) => void;
    isEmbedded?: boolean;
}

const MarketSelector: React.FC<MarketSelectorProps> = ({ isOpen, onClose, onSelect, isEmbedded = false }) => {
    const [filter, setFilter] = useState('All');
    const [search, setSearch] = useState('');


    // Sorting State
    const [sortConfig, setSortConfig] = useState<{ key: keyof MarketItem, direction: 'asc' | 'desc' } | null>(null);

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

    // Helper to parse numeric strings (e.g. $127M -> 127000000, 2.16% -> 2.16)
    const parseNumber = (str: string) => {
        const clean = str.replace(/[$,%]/g, '').trim();
        const upper = clean.toUpperCase();
        const multiplier = upper.endsWith('T') ? 1e12 :
            upper.endsWith('B') ? 1e9 :
                upper.endsWith('M') ? 1e6 :
                    upper.endsWith('K') ? 1e3 : 1;
        return parseFloat(clean) * multiplier;
    };

    const handleSort = (key: keyof MarketItem) => {
        let direction: 'asc' | 'desc' = 'desc'; // Default to descending
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'desc') {
            direction = 'asc';
        }
        setSortConfig({ key, direction });
    };

    const filteredDataAll = MOCK_DATA.filter(item =>
        item.symbol.toLowerCase().includes(search.toLowerCase()) &&
        (filter === 'All' || filter === 'Favorites' ? (filter === 'Favorites' ? item.isFavorite : true) : true)
    );

    // Sorting Logic - Rebuilt one by one
    const sortedData = React.useMemo(() => {
        let sortableItems = [...filteredDataAll];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                const { key, direction } = sortConfig;

                // Helper for direction multiplier
                const dir = direction === 'asc' ? 1 : -1;

                switch (key) {
                    case 'symbol':
                        return dir * a.symbol.localeCompare(b.symbol);

                    case 'price':
                        // Parse price: Remove '$' and ',' then float
                        const priceA = parseFloat(a.price.replace(/[$,]/g, ''));
                        const priceB = parseFloat(b.price.replace(/[$,]/g, ''));
                        return dir * (priceA - priceB);

                    case 'change':
                        // Parse percentage: Remove '%' then float
                        const changeA = parseFloat(a.change.replace('%', ''));
                        const changeB = parseFloat(b.change.replace('%', ''));
                        return dir * (changeA - changeB);

                    case 'volume':
                        // Parse Volume (e.g. $127M, $513K)
                        const volA = parseNumber(a.volume);
                        const volB = parseNumber(b.volume);
                        return dir * (volA - volB);

                    case 'spotVol':
                        // Parse Spot Volume same as Volume
                        const spotVolA = parseNumber(a.spotVol);
                        const spotVolB = parseNumber(b.spotVol);
                        return dir * (spotVolA - spotVolB);

                    case 'mktCap':
                        // Parse Market Cap same as Volume
                        const mktCapA = parseNumber(a.mktCap);
                        const mktCapB = parseNumber(b.mktCap);
                        return dir * (mktCapA - mktCapB);

                    default:
                        return 0;
                }
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

    const SortIcon = ({ columnKey }: { columnKey: keyof MarketItem }) => (
        <svg
            width="10"
            height="6"
            viewBox="0 0 10 6"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{
                // marginLeft: '6px', // Removed because we use gap now
                transform: sortConfig?.key === columnKey && sortConfig.direction === 'asc' ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s',
                opacity: sortConfig?.key === columnKey ? 1 : 0.5
            }}
        >
            <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );

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
                {['All', 'Recently Listed', 'Launchable', 'Meme', 'AI & Big Data', 'DeFi', 'DePIN', 'Layer 1', 'Layer 2'].map(f => (
                    <button
                        key={f}
                        className={`${styles.filterChip} ${filter === f ? styles.active : ''}`}
                        onClick={() => setFilter(f)}
                    >
                        {f} {f === 'Launchable' && <span className={styles.newBadge}>NEW</span>}
                    </button>
                ))}
            </div>

            {/* 2. Search Section */}
            <div className={styles.searchSection}>
                <div className={styles.searchBar}>
                    <SearchSVG />
                    <input
                        type="text"
                        className={styles.searchInput}
                        placeholder="e.g. &quot;ETH&quot; or &quot;Ethereum&quot;"
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
                            <th onClick={() => handleSort('symbol')} style={{ cursor: 'pointer' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    Market
                                    <SortIcon columnKey="symbol" />
                                </div>
                            </th>
                            <th onClick={() => handleSort('price')} style={{ cursor: 'pointer' }} className={styles.hideOnSmallMobile}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                                    Price
                                    <SortIcon columnKey="price" />
                                </div>
                            </th>
                            <th onClick={() => handleSort('change')} style={{ cursor: 'pointer' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                                    24h
                                    <SortIcon columnKey="change" />
                                </div>
                            </th>
                            <th
                                style={{ cursor: 'pointer' }}
                                onClick={() => handleSort('volume')}
                                className={styles.hideOnMobile}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                                    Volume
                                    <SortIcon columnKey="volume" />
                                </div>
                            </th>
                            <th onClick={() => handleSort('spotVol')} style={{ cursor: 'pointer' }} className={styles.hideOnMobile}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                                    24h Spot Volume
                                    <SortIcon columnKey="spotVol" />
                                </div>
                            </th>
                            <th onClick={() => handleSort('mktCap')} style={{ cursor: 'pointer' }} className={styles.hideOnMobile}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                                    Market Cap
                                    <SortIcon columnKey="mktCap" />
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedData.map(item => {
                            const isNegative = item.change.startsWith('-');
                            const changeText = isNegative ? item.change : `+${item.change.replace('+', '')}`;

                            return (
                                <tr key={item.id} onClick={() => onSelect(item)}>
                                    <td className={styles.marketCell}>
                                        <button className={styles.starBtn}>
                                            <img src={item.isFavorite ? activeStar : inactiveStar} alt="fav" style={{ width: 14, height: 14 }} />
                                        </button>
                                        <div className={styles.coinIcon} style={{ background: '#2C2C2C', overflow: 'hidden' }}>
                                            <img src={`https://assets.coincap.io/assets/icons/${item.base.toLowerCase()}@2x.png`} alt={item.base}
                                                onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${item.base}&background=random` }}
                                                style={{ width: '100%', height: '100%' }}
                                            />
                                        </div>
                                        <span className={styles.symbol}>{item.symbol}</span>
                                        <span className={styles.leverageBadge}>{item.leverage}</span>
                                        {item.tags.map(t => (
                                            <span key={t} className={styles.feeBadge}>{t}</span>
                                        ))}
                                    </td>
                                    <td className={styles.hideOnSmallMobile}>{item.price}</td>
                                    <td className={isNegative ? styles.negative : styles.positive}>
                                        {changeText}
                                    </td>
                                    <td className={styles.hideOnMobile}>{item.volume}</td>
                                    <td className={styles.hideOnMobile}>{item.spotVol}</td>
                                    <td className={styles.hideOnMobile}>{item.mktCap}</td>
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
