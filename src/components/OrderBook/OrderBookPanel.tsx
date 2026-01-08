import React, { useState, useEffect } from 'react';
import styles from './OrderBookPanel.module.css';

// Mock Data Types
interface OrderRowData {
    id: string; // Add ID for stable keys
    price: number;
    amount: number;
    total: number;
    type: 'ask' | 'bid';
    depthPercent: number; // 0-100 for background bar
    flash: 'up' | 'down' | null; // For animation state
}

interface TradeRowData {
    id: string;
    price: number;
    size: number;
    time: string;
    side: 'buy' | 'sell';
    flash: boolean; // Simple flash on new trade
}

// Initial Data Generators
const generateAsks = (count: number): OrderRowData[] => Array.from({ length: count }).map((_, i) => ({
    id: `ask-${i}`,
    price: 322.50 - (i * 0.05),
    amount: 50.0000,
    total: 322.50 * 50,
    type: 'ask' as const,
    depthPercent: Math.random() * 60 + 10,
    flash: null
})).reverse();

const generateBids = (count: number): OrderRowData[] => Array.from({ length: count }).map((_, i) => ({
    id: `bid-${i}`,
    price: 322.00 - (i * 0.05),
    amount: 50.0000,
    total: 322.00 * 50,
    type: 'bid' as const,
    depthPercent: Math.random() * 60 + 10,
    flash: null
}));

const generateTrades = (count: number): TradeRowData[] => Array.from({ length: count }).map((_, i) => ({
    id: `trade-${i}`,
    price: 135.23 - (Math.random() * 0.5),
    size: Math.random() * 5,
    time: `02.${String(48 - (i % 48)).padStart(2, '0')}.${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
    side: Math.random() > 0.5 ? 'buy' : 'sell',
    flash: false
}));

interface OrderBookPanelProps {
    forcedTab?: 'Order Book' | 'Trades';
    isMobile?: boolean;
}

const OrderBookPanel: React.FC<OrderBookPanelProps> = ({ forcedTab, isMobile = false }) => {
    const [internalTab, setInternalTab] = useState<'Order Book' | 'Trades'>('Order Book');
    const [grouping, setGrouping] = useState(0.01);
    const [displayCurrency, setDisplayCurrency] = useState<'USD' | 'SOL'>('USD');
    const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState(false);

    // Use forcedTab if provided, otherwise internal state
    const activeTab = forcedTab || internalTab;

    // ... (rest of the state)

    // Trading pair info (could come from props or context in real app)
    const tradingCoin = 'SOL';

    // Dynamic Row Calculation
    const containerRef = React.useRef<HTMLDivElement>(null);
    const tradesContainerRef = React.useRef<HTMLDivElement>(null);
    const tradeRowRef = React.useRef<HTMLDivElement>(null);
    const [rowCount, setRowCount] = useState<number>(15);
    const [tradeRowCount, setTradeRowCount] = useState<number>(20);

    // State for animated data
    const [asks, setAsks] = useState<OrderRowData[]>([]);
    const [bids, setBids] = useState<OrderRowData[]>([]);
    const [trades, setTrades] = useState<TradeRowData[]>(generateTrades(100)); // Start with enough trades
    const [lastPrice, setLastPrice] = useState(322.00);
    const [lastPriceTrend, setLastPriceTrend] = useState<'up' | 'down'>('up');

    // Calculate rows on container resize using ResizeObserver
    useEffect(() => {
        const calculateRows = () => {
            // Order Book calculation
            if (activeTab === 'Order Book' && containerRef.current) {
                const height = containerRef.current.clientHeight;
                // Row height approx 21px (fixed in CSS)
                if (isMobile) {
                    // Side-by-side: both lists use full height
                    const countPerSide = Math.floor(height / 21);
                    setRowCount(Math.max(10, countPerSide));
                } else {
                    // Vertical: subtract spread header approx 40px, divide by 2
                    const availableHeight = height - 40;
                    const countPerSide = Math.floor((availableHeight / 2) / 21);
                    setRowCount(Math.max(5, countPerSide));
                }
            }

            // Trades calculation - use fixed row height
            if (activeTab === 'Trades' && tradesContainerRef.current) {
                const containerHeight = tradesContainerRef.current.clientHeight;
                // Fixed row height is 24px
                const calculatedCount = Math.floor(containerHeight / 24);
                setTradeRowCount(Math.max(10, calculatedCount));
            }
        };

        // Initial calculation
        calculateRows();

        // Use ResizeObserver to detect container size changes (e.g., when PositionsPanel is minimized)
        const resizeObserver = new ResizeObserver(() => {
            calculateRows();
        });

        // Observe the main container for size changes
        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }
        if (tradesContainerRef.current) {
            resizeObserver.observe(tradesContainerRef.current);
        }

        // Also listen to window resize as fallback
        window.addEventListener('resize', calculateRows);

        return () => {
            resizeObserver.disconnect();
            window.removeEventListener('resize', calculateRows);
        };
    }, [activeTab, isMobile]);

    // Update data when rowCount changes
    useEffect(() => {
        setAsks(generateAsks(rowCount));
        setBids(generateBids(rowCount));
    }, [rowCount]);

    // Update trades when tradeRowCount changes
    useEffect(() => {
        // Ensure we always have enough trades to fill the container
        setTrades(prev => {
            if (prev.length < tradeRowCount) {
                return generateTrades(tradeRowCount + 10);
            }
            return prev;
        });
    }, [tradeRowCount]);

    const formatPrice = (price: number) => price.toFixed(2);
    const formatAmount = (amount: number) => amount.toFixed(4);

    // Simulation Effect
    useEffect(() => {
        const interval = setInterval(() => {
            // 1. Update random Ask
            setAsks(prev => {
                const newAsks = [...prev];
                // Update specific rows randomly (e.g. bottom-most ask which is closest to spread)
                const targetIdx = newAsks.length - 1 - Math.floor(Math.random() * 3); // Last 3 rows
                if (targetIdx >= 0) {
                    const item = { ...newAsks[targetIdx] };
                    // Simulate change: flash red if amount decr, green if incr? 
                    // More commonly: Flash red/green based on price movement or just generic update flash
                    // Let's just random flash
                    const isUp = Math.random() > 0.5;
                    item.amount = Math.max(1, item.amount + (Math.random() * 10 - 5));
                    item.depthPercent = Math.min(100, Math.max(5, item.depthPercent + (Math.random() * 10 - 5)));
                    item.flash = isUp ? 'up' : 'down';
                    newAsks[targetIdx] = item;
                }

                // Reset flash after some time? Not needed if we only re-render on change, but standard react anim might need reset or key change. 
                // Actually to restart anim, we usually need to remove class then add it back.
                // Simpler: Just set flash, and let it play. If active, it plays.
                return newAsks;
            });

            // 2. Update random Bid
            setBids(prev => {
                const newBids = [...prev];
                const targetIdx = Math.floor(Math.random() * 3); // Top 3 rows
                if (targetIdx < newBids.length) {
                    const item = { ...newBids[targetIdx] };
                    const isUp = Math.random() > 0.5;
                    item.amount = Math.max(1, item.amount + (Math.random() * 10 - 5));
                    item.depthPercent = Math.min(100, Math.max(5, item.depthPercent + (Math.random() * 10 - 5)));
                    item.flash = isUp ? 'up' : 'down';
                    newBids[targetIdx] = item;
                }
                return newBids;
            });

            // 3. New Trade & Last Price
            if (Math.random() > 0.3) { // 70% chance of new trade
                const isBuy = Math.random() > 0.5;
                const price = 322.00 + (Math.random() * 0.5 - 0.25);
                const trade: TradeRowData = {
                    id: Math.random().toString(),
                    price: price,
                    size: Math.random() * 2,
                    time: new Date().toISOString().substr(14, 8), // quick HH:mm:ss part
                    side: isBuy ? 'buy' : 'sell',
                    flash: true
                };

                setTrades(prev => [trade, ...prev.slice(0, 99)]); // Keep 100 trades
                setLastPrice(price);
                setLastPriceTrend(price >= lastPrice ? 'up' : 'down');
            }

        }, 1000); // 1 update per second

        return () => clearInterval(interval);
    }, [lastPrice]);

    // Cleanup flash effect? 
    // In a real app we'd use timeouts to remove the flash class.
    // Here we can use a key effect or just rapid updates. 
    // Let's add a secondary effect to clear flash states after 500ms
    useEffect(() => {
        const timeout = setTimeout(() => {
            // Clear flash states silently without triggering re-render chains if possible 
            // Or just let them be replaced by next interval updates.
            // Ideally: setAsks(prev => prev.map(a => a.flash ? {...a, flash: null} : a))
            // But that causes double renders.
            // For simple visual, CSS handles 'animation', which runs once.
            // If we want to re-trigger, we need to toggle.
        }, 500);
        return () => clearTimeout(timeout);
    }, [asks, bids]);


    return (
        <div className={styles.container}>
            {/* Tabs - Only show if forcedTab is NOT provided */}
            {!forcedTab && (
                <div className={styles.tabs}>
                    <button
                        className={`${styles.tab} ${activeTab === 'Order Book' ? styles.active : ''}`}
                        onClick={() => setInternalTab('Order Book')}
                    >
                        Order Book
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'Trades' ? styles.active : ''}`}
                        onClick={() => setInternalTab('Trades')}
                    >
                        Trades
                    </button>
                </div>
            )}

            {/* Content */}
            {activeTab === 'Order Book' ? (
                <>
                    {/* Header - different for mobile side-by-side mode */}
                    {isMobile ? (
                        <div className={`${styles.columnHeader} ${styles.sideBySideHeader}`}>
                            {/* Bids Header (left) */}
                            <div className={styles.headerSide}>
                                <div className={`${styles.col} ${styles.left}`}>Price</div>
                                <div className={`${styles.col} ${styles.center}`}>Amount</div>
                                <div className={styles.col}>Total</div>
                            </div>
                            {/* Asks Header (right) */}
                            <div className={styles.headerSide}>
                                <div className={`${styles.col} ${styles.left}`}>Price</div>
                                <div className={`${styles.col} ${styles.center}`}>Amount</div>
                                <div className={styles.col}>Total</div>
                            </div>
                        </div>
                    ) : (
                        <div className={styles.columnHeader}>
                            <div className={`${styles.col} ${styles.left}`}>Price</div>
                            <div className={`${styles.col} ${styles.center}`}>Amount</div>
                            <div className={styles.col}>Total</div>
                        </div>
                    )}
                    <div className={`${styles.contentContainer} ${isMobile ? styles.sideBySide : ''}`} ref={containerRef}>
                        {/* Bids (Buy) - shown first in mobile side-by-side */}
                        <div className={styles.bidsContainer}>
                            {bids.map((bid) => (
                                <div
                                    key={bid.id}
                                    className={`${styles.row} ${bid.flash === 'up' ? styles.flashUp : bid.flash === 'down' ? styles.flashDown : ''}`}
                                >
                                    <div className={`${styles.bgBar} ${styles.bid}`} style={{ width: `${bid.depthPercent}%` }}></div>
                                    <div className={`${styles.cell} ${styles.left} ${styles.bidText}`}>{formatPrice(bid.price)}</div>
                                    <div className={`${styles.cell} ${styles.center}`}>{formatAmount(bid.amount)}</div>
                                    <div className={`${styles.cell} ${styles.defaultText}`}>{formatPrice(bid.total)}</div>
                                </div>
                            ))}
                        </div>

                        {/* Spread / Last Price - hidden in mobile */}
                        {!isMobile && (
                            <div className={styles.spreadContainer}>
                                <div className={styles.lastPrice} style={{ color: lastPriceTrend === 'up' ? '#00E396' : '#FF4560' }}>
                                    {formatPrice(lastPrice)} <span style={{ fontSize: '12px' }}>{lastPriceTrend === 'up' ? '↑' : '↓'}</span>
                                </div>
                                <div className={styles.spread}>Spread 0.14%</div>
                            </div>
                        )}

                        {/* Asks (Sell) */}
                        <div className={styles.asksContainer}>
                            {asks.map((ask) => (
                                <div
                                    key={ask.id}
                                    className={`${styles.row} ${ask.flash === 'up' ? styles.flashUp : ask.flash === 'down' ? styles.flashDown : ''}`}
                                >
                                    <div className={`${styles.bgBar} ${styles.ask}`} style={{ width: `${ask.depthPercent}%` }}></div>
                                    <div className={`${styles.cell} ${styles.left} ${styles.askText}`}>{formatPrice(ask.price)}</div>
                                    <div className={`${styles.cell} ${styles.center}`}>{formatAmount(ask.amount)}</div>
                                    <div className={`${styles.cell} ${styles.defaultText}`}>{formatPrice(ask.total)}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Footer Grouping */}
                    <div className={styles.footer}>
                        <button className={styles.groupBtn} onClick={() => setGrouping(prev => Math.max(0.001, prev / 10))}>−</button>
                        <button className={styles.groupBtn} onClick={() => setGrouping(prev => Math.min(100, prev * 10))}>+</button>

                        <div className={styles.groupVal}>
                            {displayCurrency === 'USD' ? `$${grouping}` : `${grouping} ${tradingCoin}`}
                        </div>

                        {/* Currency Dropdown */}
                        <div className={styles.currencyCell} onClick={() => setCurrencyDropdownOpen(!currencyDropdownOpen)}>
                            <span className={styles.currencyText}>{displayCurrency}</span>
                            <span className={`${styles.currencyIcon} ${currencyDropdownOpen ? styles.rotated : ''}`}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="6 9 12 15 18 9"></polyline>
                                </svg>
                            </span>
                            {currencyDropdownOpen && (
                                <div className={styles.currencyDropdown}>
                                    <button
                                        className={`${styles.currencyOption} ${displayCurrency === 'USD' ? styles.selected : ''}`}
                                        onClick={(e) => { e.stopPropagation(); setDisplayCurrency('USD'); setCurrencyDropdownOpen(false); }}
                                    >
                                        USD
                                    </button>
                                    <button
                                        className={`${styles.currencyOption} ${displayCurrency === tradingCoin ? styles.selected : ''}`}
                                        onClick={(e) => { e.stopPropagation(); setDisplayCurrency('SOL'); setCurrencyDropdownOpen(false); }}
                                    >
                                        {tradingCoin}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            ) : (
                <>
                    <div className={styles.columnHeader}>
                        <div className={`${styles.col} ${styles.left}`}>Price</div>
                        <div className={`${styles.col} ${styles.center}`}>Size (SOL)</div>
                        <div className={styles.col}>Time</div>
                    </div>
                    <div className={styles.contentContainer} ref={tradesContainerRef}>
                        {trades.slice(0, tradeRowCount).map((trade, index) => (
                            <div
                                key={trade.id}
                                ref={index === 0 ? tradeRowRef : null}
                                className={`${styles.tradeRow} ${trade.flash ? styles.flashUp : ''}`}
                                style={{ animation: trade.flash ? 'flashGreen 0.5s ease-out' : 'none' }}
                            >
                                <div className={`${styles.cell} ${styles.left}`} style={{ color: trade.side === 'buy' ? '#00E396' : '#FF4560' }}>
                                    {formatPrice(trade.price)}
                                </div>
                                <div className={`${styles.cell} ${styles.center} ${styles.defaultText}`}>
                                    {trade.size.toFixed(2)}
                                </div>
                                <div className={`${styles.cell} ${styles.timeText}`}>
                                    {trade.time}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Footer for Trades - same as Order Book */}
                    <div className={styles.footer}>
                        <button className={styles.groupBtn} onClick={() => setGrouping(prev => Math.max(0.001, prev / 10))}>−</button>
                        <button className={styles.groupBtn} onClick={() => setGrouping(prev => Math.min(100, prev * 10))}>+</button>

                        <div className={styles.groupVal}>
                            {displayCurrency === 'USD' ? `$${grouping}` : `${grouping} ${tradingCoin}`}
                        </div>

                        {/* Currency Dropdown */}
                        <div className={styles.currencyCell} onClick={() => setCurrencyDropdownOpen(!currencyDropdownOpen)}>
                            <span className={styles.currencyText}>{displayCurrency}</span>
                            <span className={`${styles.currencyIcon} ${currencyDropdownOpen ? styles.rotated : ''}`}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="6 9 12 15 18 9"></polyline>
                                </svg>
                            </span>
                            {currencyDropdownOpen && (
                                <div className={styles.currencyDropdown}>
                                    <button
                                        className={`${styles.currencyOption} ${displayCurrency === 'USD' ? styles.selected : ''}`}
                                        onClick={(e) => { e.stopPropagation(); setDisplayCurrency('USD'); setCurrencyDropdownOpen(false); }}
                                    >
                                        USD
                                    </button>
                                    <button
                                        className={`${styles.currencyOption} ${displayCurrency === tradingCoin ? styles.selected : ''}`}
                                        onClick={(e) => { e.stopPropagation(); setDisplayCurrency('SOL'); setCurrencyDropdownOpen(false); }}
                                    >
                                        {tradingCoin}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default OrderBookPanel;
