import React, { useState, useEffect, useRef, useMemo } from 'react'
import { Search, ChevronDown, Star } from 'lucide-react'
import styles from './SymbolSelector.module.css'
import { useMarketStore } from '../../store/useMarketStore'
import { useWatchlistStore } from '../../store/useWatchlistStore'
import { type MarketData } from '../../api/marketService'
import MarketIcon from '../MarketDetails/MarketIcon'
import { useIconStore } from '../../store/useIconStore'

const parseSubCategoryTokens = (value?: string): string[] =>
  String(value || '')
    .split(',')
    .map(v => v.trim())
    .filter(Boolean);

export interface SymbolSelectorProps {
  selectedSymbol?: string
  onSymbolChange?: (symbol: string) => void
  theme?: 'light' | 'dark'
}

export const SymbolSelector: React.FC<SymbolSelectorProps> = ({
  selectedSymbol,
  onSymbolChange,
  theme = 'dark',
}) => {
  const { markets, selectedMarket, setMarket, fetchMarkets } = useMarketStore()
  const { favorites } = useWatchlistStore()

  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const dropdownRef = useRef<HTMLDivElement>(null)

  const filterTabs = useMemo(() => {
    const counts = new Map<string, number>();
    markets.forEach((m) => {
      parseSubCategoryTokens(m.subCategory).forEach((token) => {
        counts.set(token, (counts.get(token) || 0) + 1);
      });
    });
    const subCategories = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([name]) => name)
      .slice(0, 30);
    return ['All', ...(favorites.size > 0 ? ['Watchlist'] : []), ...subCategories];
  }, [markets, favorites.size]);

  useEffect(() => {
    if (markets.length === 0) fetchMarkets()
  }, [markets.length, fetchMarkets])

  const currentMarket = selectedMarket || markets.find(m => m.symbol === selectedSymbol) || markets[0]

  const filteredSymbols = useMemo(() => {
    return markets.filter(market => {
      // Basic search
      const matchesSearch =
        market.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (market.category || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (market.subCategory || '').toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      // Category filter
      if (activeCategory === 'All') return true;

      if (activeCategory === 'Watchlist') {
        return favorites.has(`${market.source}:${market.symbol}`);
      }
      const subTokens = parseSubCategoryTokens(market.subCategory).map(v => v.toUpperCase());
      return subTokens.includes(activeCategory.toUpperCase());
    });
  }, [markets, searchTerm, activeCategory, favorites]);

  // Prefetch icons when dropdown opens or filtered list changes
  useEffect(() => {
    if (!isOpen || filteredSymbols.length === 0) return;
    useIconStore.getState().prefetch(filteredSymbols.map(m => m.symbol));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, searchTerm, activeCategory, markets.length]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSymbolSelect = (market: MarketData) => {
    setMarket(market.symbol, market.source)
    onSymbolChange?.(market.symbol)
    setIsOpen(false)
    setSearchTerm('')
  }

  const formatPrice = (p?: number) => {
    if (p === undefined) return '-';
    if (p < 0.1) return p.toLocaleString(undefined, { minimumFractionDigits: 6 });
    if (p < 2) return p.toLocaleString(undefined, { minimumFractionDigits: 4 });
    return p.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  return (
    <div className={`${styles.symbolSelector} ${styles[theme]}`} ref={dropdownRef}>
      {/* Selected Symbol Display */}
      <button
        type="button"
        className={styles.selectedButton}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className={styles.symbolInfo}>
          {currentMarket?.symbol && (
            <MarketIcon symbol={currentMarket.symbol} size={18} className={styles.symbolIcon} category={currentMarket.category} />
          )}
          <span className={styles.symbol}>{currentMarket?.symbol || 'Select Market'}</span>
        </div>

        {currentMarket?.price && (
          <div className={styles.priceInfo}>
            <span className={styles.price}>${formatPrice(currentMarket.price)}</span>
            <span className={`${styles.change} ${currentMarket.change24hPercent >= 0 ? styles.positive : styles.negative}`}>
              {currentMarket.change24hPercent >= 0 ? '+' : ''}{currentMarket.change24hPercent?.toFixed(2)}%
            </span>
          </div>
        )}

        <ChevronDown
          size={16}
          className={`${styles.arrow} ${isOpen ? styles.open : ''}`}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className={styles.dropdown}>
          {/* Search Input */}
          <div className={styles.searchBox}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search markets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
              autoFocus
            />
          </div>

          {/* Categories */}
          <div className={styles.filters}>
            {filterTabs.map(cat => (
              <button
                type="button"
                key={cat}
                className={`${styles.filterChip} ${activeCategory === cat ? styles.active : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Symbol List */}
          <div className={styles.symbolList}>
            {filteredSymbols.length > 0 ? (
              filteredSymbols.map((market) => (
                <button
                  type="button"
                  key={`${market.source}:${market.symbol}`}
                  className={`${styles.symbolItem} ${market.symbol === currentMarket?.symbol ? styles.selected : ''}`}
                  onClick={() => handleSymbolSelect(market)}
                >
                  <MarketIcon symbol={market.symbol} size={20} className={styles.itemIcon} category={market.category} />
                  <div className={styles.itemMain}>
                    <div className={styles.itemSymbol}>
                      <span className={styles.itemName}>{market.symbol}</span>
                      {favorites.has(`${market.source}:${market.symbol}`) && (
                        <Star size={10} fill="#ff6b6b" color="#ff6b6b" style={{ marginLeft: 4 }} />
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      <span className={styles.exchange}>{market.source}</span>
                      {market.subCategory && (
                        <span style={{ fontSize: '9px', color: '#6d4c5e', background: 'rgba(255,225,242,0.1)', padding: '1px 4px', borderRadius: 3 }}>
                          {market.subCategory.split(',')[0]}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className={styles.itemPrice}>
                    <span className={styles.priceValue}>${formatPrice(market.price)}</span>
                    <span className={`${styles.changeValue} ${market.change24hPercent >= 0 ? styles.positive : styles.negative}`}>
                      {market.change24hPercent >= 0 ? '+' : ''}{market.change24hPercent?.toFixed(2)}%
                    </span>
                  </div>
                </button>
              ))
            ) : (
              <div className={styles.noResults}>
                <Search size={24} />
                <span>No symbols found</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default SymbolSelector
