import React, { useState } from 'react'
import styles from './MarketDetails.module.css'
import activeStar from '../../assets/Icons/start/active.png'
import inactiveStar from '../../assets/Icons/start/inactive.png'
import expandIcon from '../../assets/Icons/Arrow/Arrow-down-Bullet.png'
import collapseIcon from '../../assets/Icons/Arrow/Arrow-up-Bullet.png'
import MarketSelector, { type MarketItem } from './MarketSelector'

export interface MarketData {
    symbol: string
    price: string
    volume24h: string
    change24h: string
    change24hPercent: string
    markPrice: string
    openInterest: string
    funding8h: string
}

export interface MarketDetailsProps {
    data?: MarketData
    isFavorite?: boolean
    onToggleFavorite?: () => void
}

const defaultData: MarketData = {
    symbol: 'ETH-USD',
    price: '$459.60',
    volume24h: '$12,340,512',
    change24h: '-0.497',
    change24hPercent: '-2.00%',
    markPrice: '$459.60',
    openInterest: '$16,594,008',
    funding8h: '+10.92%',
}

const MarketDetails: React.FC<MarketDetailsProps> = ({
    data = defaultData,
    isFavorite = false,
    onToggleFavorite,
}) => {
    const [currentData, setCurrentData] = useState<MarketData>(data)
    const [favorite, setFavorite] = useState(isFavorite)
    const [isExpanded, setIsExpanded] = useState(false)
    const [isMarketSelectorOpen, setIsMarketSelectorOpen] = useState(false)

    // Update local state when prop changes, if desired. 
    // For now, we rely on local state to handle selector updates.

    const handleFavoriteClick = () => {
        setFavorite(!favorite)
        onToggleFavorite?.()
    }

    const toggleExpand = () => {
        setIsExpanded(!isExpanded)
    }

    const isPositiveChange = !currentData.change24h.startsWith('-')
    const isPositiveFunding = !currentData.funding8h.startsWith('-')

    return (
        <div className={styles.wrapper}>
            <div className={styles.container}>
                {/* Left Section */}
                <div className={styles.leftSection}>
                    <button
                        className={styles.starButton}
                        onClick={handleFavoriteClick}
                        aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
                    >
                        <img
                            src={favorite ? activeStar : inactiveStar}
                            alt="Favorite"
                            className={styles.starIcon}
                        />
                    </button>

                    <div className={styles.tokenIconPlaceholder}>
                        <img
                            src={`https://assets.coincap.io/assets/icons/${currentData.symbol.split('-')[0].toLowerCase()}@2x.png`}
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${currentData.symbol}&background=627EEA&color=fff&rounded=true&bold=true&format=svg`;
                            }}
                            alt={currentData.symbol}
                            style={{ width: '100%', height: '100%', borderRadius: '50%' }}
                        />
                    </div>

                    <div className={styles.pairName} onClick={() => setIsMarketSelectorOpen(!isMarketSelectorOpen)} style={{ cursor: 'pointer' }}>
                        {currentData.symbol}
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
                            {currentData.price}
                        </span>
                        <span className={`${styles.statLabel} ${isPositiveChange ? styles.positive : styles.negative}`} style={{ marginLeft: '4px' }}>
                            {currentData.change24hPercent}
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
                        <span className={styles.statValue}>{currentData.price}</span>
                    </div>

                    <div className={styles.statItem}>
                        <span className={styles.statLabel}>24h Volume</span>
                        <span className={styles.statValue}>{currentData.volume24h}</span>
                    </div>

                    <div className={styles.statItem}>
                        <span className={styles.statLabel}>24h Change</span>
                        <span className={`${styles.statValue} ${isPositiveChange ? styles.positive : styles.negative}`}>
                            {currentData.change24h} / {currentData.change24hPercent}
                        </span>
                    </div>

                    <div className={styles.statItem}>
                        <span className={styles.statLabel}>Mark Price</span>
                        <span className={styles.statValue}>{currentData.markPrice}</span>
                    </div>

                    <div className={styles.statItem}>
                        <span className={styles.statLabel}>Open Interest</span>
                        <span className={styles.statValue}>{currentData.openInterest}</span>
                    </div>

                    <div className={styles.statItem}>
                        <span className={styles.statLabel}>8h Funding</span>
                        <span className={`${styles.statValue} ${isPositiveFunding ? styles.positive : styles.negative}`}>
                            {currentData.funding8h}
                        </span>
                    </div>
                </div>
            </div>

            {/* Mobile Stats Section - outside container for expand */}
            <div className={`${styles.mobileStatsContainer} ${isExpanded ? styles.expanded : ''}`}>
                <div className={styles.statItem}>
                    <span className={styles.statLabel}>Price</span>
                    <span className={styles.statValue}>{currentData.price}</span>
                </div>

                <div className={styles.statItem}>
                    <span className={styles.statLabel}>24h Volume</span>
                    <span className={styles.statValue}>{currentData.volume24h}</span>
                </div>

                <div className={styles.statItem}>
                    <span className={styles.statLabel}>24h Change</span>
                    <span className={`${styles.statValue} ${isPositiveChange ? styles.positive : styles.negative}`}>
                        {currentData.change24h} / {currentData.change24hPercent}
                    </span>
                </div>

                <div className={styles.statItem}>
                    <span className={styles.statLabel}>Mark Price</span>
                    <span className={styles.statValue}>{currentData.markPrice}</span>
                </div>

                <div className={styles.statItem}>
                    <span className={styles.statLabel}>Open Interest</span>
                    <span className={styles.statValue}>{currentData.openInterest}</span>
                </div>

                <div className={styles.statItem}>
                    <span className={styles.statLabel}>8h Funding</span>
                    <span className={`${styles.statValue} ${isPositiveFunding ? styles.positive : styles.negative}`}>
                        {currentData.funding8h}
                    </span>
                </div>
            </div>

            <MarketSelector
                isOpen={isMarketSelectorOpen}
                onClose={() => setIsMarketSelectorOpen(false)}
                onSelect={(market: any) => {
                    setCurrentData({
                        symbol: market.symbol,
                        price: market.price,
                        volume24h: market.volume,
                        change24h: '0.00', // Mocking as selector doesn't have absolute change
                        change24hPercent: market.change,
                        markPrice: market.price,
                        openInterest: '$10M', // Mock default
                        funding8h: '0.01%' // Mock default
                    });
                    setIsMarketSelectorOpen(false);
                }}
            />
        </div>
    )
}

export default MarketDetails
