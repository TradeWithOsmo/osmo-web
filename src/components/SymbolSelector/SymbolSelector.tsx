import React, { useState, useEffect, useRef } from 'react'
import { Search, ChevronDown } from 'lucide-react'
import styles from './SymbolSelector.module.css'

export interface Symbol {
  symbol: string
  name: string
  description: string
  exchange?: string
  price?: number
  change?: number
}

export interface SymbolSelectorProps {
  selectedSymbol?: string
  onSymbolChange?: (symbol: string) => void
  theme?: 'light' | 'dark'
}

const symbols: Symbol[] = [
  { symbol: 'BTC/USDT', name: 'BTC', description: 'Bitcoin', exchange: 'Binance', price: 43250, change: 2.5 },
  { symbol: 'ETH/USDT', name: 'ETH', description: 'Ethereum', exchange: 'Binance', price: 2280, change: -1.2 },
  { symbol: 'USDT/WETH', name: 'USDT', description: 'Tether', exchange: 'Uniswap', price: 1.00, change: 0.1 },
  { symbol: 'BNB/USDT', name: 'BNB', description: 'Binance Coin', exchange: 'Binance', price: 315, change: 3.8 },
  { symbol: 'SOL/USDT', name: 'SOL', description: 'Solana', exchange: 'Binance', price: 98, change: -2.1 },
  { symbol: 'ADA/USDT', name: 'ADA', description: 'Cardano', exchange: 'Binance', price: 0.58, change: 1.5 },
]

export const SymbolSelector: React.FC<SymbolSelectorProps> = ({
  selectedSymbol = 'BTC/USDT',
  onSymbolChange,
  theme = 'dark',
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredSymbols, setFilteredSymbols] = useState<Symbol[]>(symbols)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const currentSymbol = symbols.find(s => s.symbol === selectedSymbol) || symbols[0]

  useEffect(() => {
    const filtered = symbols.filter(symbol =>
      symbol.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      symbol.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      symbol.symbol.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredSymbols(filtered)
  }, [searchTerm])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSymbolSelect = (symbol: string) => {
    onSymbolChange?.(symbol)
    setIsOpen(false)
    setSearchTerm('')
  }

  return (
    <div className={`${styles.symbolSelector} ${styles[theme]}`} ref={dropdownRef}>
      {/* Selected Symbol Display */}
      <button
        className={styles.selectedButton}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className={styles.symbolInfo}>
          <span className={styles.symbol}>{currentSymbol.name}</span>
          <span className={styles.pair}>{currentSymbol.symbol.split('/')[1]}</span>
        </div>
        
        {currentSymbol.price && (
          <div className={styles.priceInfo}>
            <span className={styles.price}>${currentSymbol.price.toLocaleString()}</span>
            <span className={`${styles.change} ${currentSymbol.change && currentSymbol.change >= 0 ? styles.positive : styles.negative}`}>
              {currentSymbol.change && currentSymbol.change >= 0 ? '+' : ''}{currentSymbol.change}%
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
              placeholder="Search symbols..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
              autoFocus
            />
          </div>

          {/* Symbol List */}
          <div className={styles.symbolList}>
            {filteredSymbols.length > 0 ? (
              filteredSymbols.map((symbol) => (
                <button
                  key={symbol.symbol}
                  className={`${styles.symbolItem} ${symbol.symbol === selectedSymbol ? styles.selected : ''}`}
                  onClick={() => handleSymbolSelect(symbol.symbol)}
                >
                  <div className={styles.itemMain}>
                    <div className={styles.itemSymbol}>
                      <span className={styles.itemName}>{symbol.name}</span>
                      <span className={styles.itemPair}>/{symbol.symbol.split('/')[1]}</span>
                    </div>
                    {symbol.exchange && (
                      <span className={styles.exchange}>{symbol.exchange}</span>
                    )}
                  </div>
                  
                  {symbol.price && (
                    <div className={styles.itemPrice}>
                      <span className={styles.priceValue}>${symbol.price.toLocaleString()}</span>
                      <span className={`${styles.changeValue} ${symbol.change && symbol.change >= 0 ? styles.positive : styles.negative}`}>
                        {symbol.change && symbol.change >= 0 ? '+' : ''}{symbol.change}%
                      </span>
                    </div>
                  )}
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