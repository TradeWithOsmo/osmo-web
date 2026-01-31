import React, { useState, useEffect } from 'react'
import styles from './MarketDetails.module.css'
import activeStar from '../../assets/Icons/start/active.png'
import inactiveStar from '../../assets/Icons/start/inactive.png'
import expandIcon from '../../assets/Icons/Arrow/Arrow-down-Bullet.png'
import collapseIcon from '../../assets/Icons/Arrow/Arrow-up-Bullet.png'
// Layout Icons - Standard
import layoutStandardActive from '../../assets/layout/Layout trading active.png'
import layoutStandardInactive from '../../assets/layout/Layout trading non active.png'
// Layout Icons - Assist
import layoutAssistActive from '../../assets/layout/Layout Trading + Asist active.png'
import layoutAssistInactive from '../../assets/layout/Layout Trading + Asist non active.png'

import MarketSelector from './MarketSelector'
import TokenIcon from './TokenIcon'
import OstiumIcon from './OstiumIcon'
import { useMarketStore } from '../../store/useMarketStore'
import { useWatchlistStore } from '../../store/useWatchlistStore'
// import { useRealTimePrice } from '../../hooks/useRealTimePrice' // Removed

export interface MarketDetailsProps {
    isFavorite?: boolean
    onToggleFavorite?: () => void
    layoutMode?: 'standard' | 'assist'
    setLayoutMode?: (mode: 'standard' | 'assist') => void
}

const MarketDetails: React.FC<MarketDetailsProps> = ({
    onToggleFavorite,
    layoutMode,
    setLayoutMode
}) => {
    const { selectedMarket, isLoading, error, fetchMarkets } = useMarketStore()
    const { favorites, toggleFavorite, fetchWatchlist } = useWatchlistStore()
    // Global stream handled in App.tsx

    const [isExpanded, setIsExpanded] = useState(false)
    const [isMarketSelectorOpen, setIsMarketSelectorOpen] = useState(false)

    useEffect(() => {
        fetchMarkets();
        fetchWatchlist();
    }, [fetchMarkets, fetchWatchlist]);

    const isFavoriteNow = selectedMarket ? favorites.has(selectedMarket.symbol) : false;

    const handleFavoriteClick = () => {
        if (selectedMarket) {
            toggleFavorite(selectedMarket.symbol, selectedMarket.source);
            onToggleFavorite?.();
        }
    }

    const toggleExpand = () => {
        setIsExpanded(!isExpanded)
    }

    if (error) {
        return <div className={styles.wrapper}><div className={styles.container} style={{ color: 'red' }}>Error: {error}</div></div>
    }

    if (!selectedMarket || isLoading) {
        return (
            <div className={styles.wrapper}>
                <div className={styles.container}>
                    <div className={styles.skeletonFullWidth}>
                        <div className={`${styles.skeleton} ${styles.skeletonStar}`} />
                        <div className={`${styles.skeleton} ${styles.skeletonCircle}`} />
                        <div className={`${styles.skeleton} ${styles.skeletonSymbol}`} />
                        <div style={{ display: 'flex', gap: '30px', marginLeft: '50px' }}>
                            <div className={`${styles.skeleton} ${styles.skeletonStat}`} />
                            <div className={`${styles.skeleton} ${styles.skeletonStat}`} />
                            <div className={`${styles.skeleton} ${styles.skeletonStat}`} />
                            <div className={`${styles.skeleton} ${styles.skeletonStat}`} />
                            <div className={`${styles.skeleton} ${styles.skeletonStat}`} />
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // Format helpers
    const formatPrice = (val: number) => {
        if (!val && val !== 0) return '-';
        if (val === 0) return '0.0000';

        // Use 'en-US' to FORCE dot separator and comma for thousands
        const locale = 'en-US';

        // High value: 2 decimals (e.g. $42,000.50)
        if (val >= 100) {
            return `${val.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }

        // Mid/Low value: 4 decimals as requested (e.g. $1.6432)
        // This covers Forex and mid-price cryptos
        return `${val.toLocaleString(locale, { minimumFractionDigits: 4, maximumFractionDigits: 4 })}`;
    }

    const formatChange = (val: number, price: number) => {
        const absVal = Math.abs(val);
        if (absVal === 0) return '0.00';
        // If the absolute change is very small relative to price, show more decimals
        if (price < 1 || absVal < 0.01) {
            return val.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 });
        }
        return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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

        // If percent change is very small, show more decimals
        if (absVal < 0.1) {
            return `${val.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })}%`;
        }
        return `${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
    }

    const isPositiveChange = selectedMarket.change24h >= 0
    const changeSign = isPositiveChange ? '+' : ''

    return (
        <div className={styles.wrapper}>
            <div className={styles.container}>
                {/* Left Section */}
                <div className={styles.leftSection}>
                    <button
                        className={styles.starButton}
                        onClick={handleFavoriteClick}
                        aria-label={isFavoriteNow ? "Remove from favorites" : "Add to favorites"}
                    >
                        <img
                            src={isFavoriteNow ? activeStar : inactiveStar}
                            alt="Favorite"
                            className={styles.starIcon}
                        />
                    </button>

                    <div className={styles.tokenIconPlaceholder} style={{ background: 'transparent', overflow: 'visible' }}>
                        {selectedMarket.source === 'ostium' ? (
                            <OstiumIcon symbol={selectedMarket.symbol} size={32} className={styles.tokenIcon} />
                        ) : (
                            <TokenIcon symbol={selectedMarket.symbol} size={32} className={styles.tokenIcon} />
                        )}
                    </div>

                    <div className={styles.pairName} onClick={() => setIsMarketSelectorOpen(!isMarketSelectorOpen)} style={{ cursor: 'pointer' }}>
                        {selectedMarket.symbol}
                        <svg
                            width="10"
                            height="6"
                            viewBox="0 0 10 6"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className={`${styles.mobileDropdownArrow} ${isMarketSelectorOpen ? styles.rotate : ''}`}
                        >
                            <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>

                    <div className={styles.marketDropdown} onClick={() => setIsMarketSelectorOpen(!isMarketSelectorOpen)}>
                        <span className={styles.marketDropdownText}>All markets</span>
                        <svg
                            width="10"
                            height="6"
                            viewBox="0 0 10 6"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className={`${styles.marketDropdownArrow} ${isMarketSelectorOpen ? styles.rotate : ''}`}
                        >
                            <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                </div>

                {/* Mobile Header Summary */}
                <div className={styles.mobileSummary}>
                    <div className={styles.mobilePriceRef}>
                        <span className={`${styles.statValue} ${isPositiveChange ? styles.positive : styles.negative}`}>
                            {formatPrice(selectedMarket.price)}
                        </span>
                        <span className={`${styles.statLabel} ${isPositiveChange ? styles.positive : styles.negative}`} style={{ marginLeft: '4px' }}>
                            {changeSign}{formatPercent(selectedMarket.change24hPercent)}
                        </span>
                    </div>
                    <button className={styles.expandButton} onClick={toggleExpand}>
                        <img src={isExpanded ? collapseIcon : expandIcon} alt="Toggle Details" />
                    </button>
                </div>

                {/* Desktop Stats Section - inside container */}
                <div className={`${styles.statsContainer} ${styles.desktopStats}`}>
                    <div className={styles.statItem}>
                        <span className={styles.statLabel}>Price</span>
                        <span className={styles.statValue}>{formatPrice(selectedMarket.price)}</span>
                    </div>

                    <div className={styles.statItem}>
                        <span className={styles.statLabel}>24h Volume</span>
                        <span className={styles.statValue}>{formatVol(selectedMarket.volume24h)}</span>
                    </div>

                    <div className={styles.statItem}>
                        <span className={styles.statLabel}>24h Change</span>
                        <span className={`${styles.statValue} ${isPositiveChange ? styles.positive : styles.negative}`}>
                            {changeSign}{formatChange(selectedMarket.change24h, selectedMarket.price)} / {changeSign}{formatPercent(selectedMarket.change24hPercent)}
                        </span>
                    </div>

                    <div className={styles.statItem}>
                        <span className={styles.statLabel}>24h High</span>
                        <span className={styles.statValue}>{selectedMarket.high24h ? formatPrice(selectedMarket.high24h) : '-'}</span>
                    </div>

                    <div className={styles.statItem}>
                        <span className={styles.statLabel}>24h Low</span>
                        <span className={styles.statValue}>{selectedMarket.low24h ? formatPrice(selectedMarket.low24h) : '-'}</span>
                    </div>
                </div>

                {/* Layout Switcher (Desktop Only usually, but let's keep it generally available if space permits, or hide on mobile if needed) */}
                {layoutMode && setLayoutMode && (
                    <div className={styles.rightSection}>
                        <div className={styles.layoutTabs}>
                            <button
                                className={`${styles.layoutTab} ${layoutMode === 'standard' ? styles.activeLayoutTab : ''}`}
                                onClick={() => setLayoutMode('standard')}
                                title="Standard Layout"
                            >
                                <img
                                    src={layoutMode === 'standard' ? layoutStandardActive : layoutStandardInactive}
                                    alt="Standard"
                                    className={styles.layoutIcon}
                                />
                                <span className={styles.layoutTabText}>Standard</span>
                            </button>
                            <button
                                className={`${styles.layoutTab} ${layoutMode === 'assist' ? styles.activeLayoutTab : ''}`}
                                onClick={() => setLayoutMode('assist')}
                                title="Trading Assist Layout"
                            >
                                <img
                                    src={layoutMode === 'assist' ? layoutAssistActive : layoutAssistInactive}
                                    alt="Assist"
                                    className={styles.layoutIcon}
                                />
                                <span className={styles.layoutTabText}>Assist</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Mobile Stats Section - outside container for expand */}
            <div className={`${styles.mobileStatsContainer} ${isExpanded ? styles.expanded : ''}`}>
                <div className={styles.statItem}>
                    <span className={styles.statLabel}>Price</span>
                    <span className={styles.statValue}>{formatPrice(selectedMarket.price)}</span>
                </div>

                <div className={styles.statItem}>
                    <span className={styles.statLabel}>24h Volume</span>
                    <span className={styles.statValue}>{formatVol(selectedMarket.volume24h)}</span>
                </div>

                <div className={styles.statItem}>
                    <span className={styles.statLabel}>24h Change</span>
                    <span className={`${styles.statValue} ${isPositiveChange ? styles.positive : styles.negative}`}>
                        {changeSign}{formatChange(selectedMarket.change24h, selectedMarket.price)} / {changeSign}{formatPercent(selectedMarket.change24hPercent)}
                    </span>
                </div>
            </div>

            <MarketSelector
                isOpen={isMarketSelectorOpen}
                onClose={() => setIsMarketSelectorOpen(false)}
            />
        </div>
    )
}

export default MarketDetails
