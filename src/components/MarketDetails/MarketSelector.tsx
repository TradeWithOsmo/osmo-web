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
}

const MarketSelector: React.FC<MarketSelectorProps> = ({ isOpen, onClose, onSelect }) => {
    const [filter, setFilter] = useState('All');
    const [search, setSearch] = useState('');
    const [showLaunchable, setShowLaunchable] = useState(false);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const filteredData = MOCK_DATA.filter(item =>
        item.symbol.toLowerCase().includes(search.toLowerCase()) &&
        (filter === 'All' || filter === 'Favorites' ? (filter === 'Favorites' ? item.isFavorite : true) : true)
        // Logic for other filters like 'Meme', 'DeFi' would normally check item tags/categories
    );

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.container} onClick={e => e.stopPropagation()}>
                {/* 1. Search Section */}
                <div className={styles.searchSection}>
                    <div className={styles.searchBar}>
                        <SearchSVG />
                        <input
                            type="text"
                            className={styles.searchInput}
                            placeholder="e.g. &quot;ETH&quot; or &quot;Ethereum&quot;"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            autoFocus
                        />
                    </div>
                </div>

                {/* 2. Filters */}
                <div className={styles.filters}>
                    <div
                        className={styles.filterToggle}
                        onClick={() => setShowLaunchable(!showLaunchable)}
                        style={{ cursor: 'pointer' }}
                    >
                        <span>Show launchable markets</span>
                        {/* Toggle Switch */}
                        <div style={{
                            width: 32,
                            height: 18,
                            background: showLaunchable ? '#E5488D' : '#3A2530',
                            borderRadius: 9,
                            position: 'relative',
                            transition: 'background 0.2s'
                        }}>
                            <div style={{
                                width: 14,
                                height: 14,
                                background: '#FFE1F2',
                                borderRadius: '50%',
                                position: 'absolute',
                                top: 2,
                                left: showLaunchable ? 16 : 2,
                                transition: 'left 0.2s'
                            }}></div>
                        </div>
                    </div>
                    <div className={styles.filterDivider}></div>
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

                {/* 3. Divider */}
                <div className={styles.divider}></div>

                {/* Table */}
                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Market</th>
                                <th>Price</th>
                                <th>24h</th>
                                <th>Volume <span style={{ fontSize: 10 }}>↑↓</span></th>
                                <th>24h Spot Volume</th>
                                <th>Market Cap</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.map(item => (
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
                                    <td>{item.price}</td>
                                    <td className={item.change.startsWith('-') ? styles.negative : styles.positive}>{item.change}</td>
                                    <td>{item.volume}</td>
                                    <td>{item.spotVol}</td>
                                    <td>{item.mktCap}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                <div className={styles.footer}>
                    <span>Showing 1 - {filteredData.length} out of {MOCK_DATA.length}</span>
                    <div className={styles.pagination}>
                        <button className={styles.pageBtn} disabled>&lt;</button>
                        <button className={`${styles.pageBtn} ${styles.active}`}>1</button>
                        <button className={styles.pageBtn}>2</button>
                        <button className={styles.pageBtn}>3</button>
                        <button className={styles.pageBtn}>4</button>
                        <button className={styles.pageBtn}>&gt;</button>
                        <div style={{ marginLeft: 10 }}>
                            Show <span style={{ color: '#FFE1F2' }}>50 ⌄</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MarketSelector;
