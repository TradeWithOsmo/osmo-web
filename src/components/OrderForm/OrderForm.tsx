import React, { useState } from 'react';
import styles from './OrderForm.module.css';

import { usePortfolioStore } from '../../store/usePortfolioStore';
import { useMarketStore } from '../../store/useMarketStore';
import { useWallet } from '../../hooks';
import { useUIStore } from '../../store/useUIStore';
import { onchainService } from '../../api/onchainService';
import { orderService } from '../../api/orderService';
import toast from 'react-hot-toast';
import { useWalletClient } from 'wagmi';


const OrderForm: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'Limit' | 'Market' | 'Stop Limit'>('Market');
    const [side, setSide] = useState<'buy' | 'sell'>('buy');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const selectedMarket = useMarketStore((state) => state.selectedMarket);
    const { refreshAll, summary, updateTPSL } = usePortfolioStore();
    const { openDepositModal, hasSession, setHasSession, openSessionModal, isTradingSetupOpen, openTradingSetup, isSessionChecking } = useUIStore();

    // Get wallet from Privy
    const { authenticated, walletAddress, handleConnect, wallets } = useWallet();
    const { data: walletClient } = useWalletClient();

    // Setup Check
    const [tradingSetupOk, setTradingSetupOk] = useState(false);

    const checkSetup = React.useCallback(async () => {
        if (authenticated && walletAddress) {
            console.log('[OrderForm] Checking trading setup...');
            try {
                const status = await onchainService.checkTradingSetup(walletAddress);
                const allowanceOk = status.allowance > 100_000_000n;
                const isOk = status.roleGranted && allowanceOk;
                setTradingSetupOk(isOk);
                return isOk;
            } catch (err) {
                console.error('[OrderForm] Failed to check setup:', err);
                setTradingSetupOk(false);
                return false;
            }
        }
        return false;
    }, [authenticated, walletAddress]);

    React.useEffect(() => {
        checkSetup();
    }, [checkSetup]);

    // Force check when modal closes
    React.useEffect(() => {
        if (!isTradingSetupOpen) {
            checkSetup();
        }
    }, [isTradingSetupOpen, checkSetup]);

    // Check Session Validity
    React.useEffect(() => {
        const checkSession = () => {
            const expires = localStorage.getItem('osmo_session_expires');
            const key = localStorage.getItem('osmo_session_key');

            if (key && expires) {
                if (new Date(expires) < new Date()) {
                    console.log('[OrderForm] Session expired locally');
                    localStorage.removeItem('osmo_session_key');
                    localStorage.removeItem('osmo_session_address');
                    localStorage.removeItem('osmo_session_expires');
                    setHasSession(false);
                } else {
                    setHasSession(true);
                }
            } else {
                setHasSession(false);
            }
            useUIStore.getState().setSessionChecking(false);
        };

        checkSession();
        const interval = setInterval(checkSession, 1000); // Check every second
        return () => clearInterval(interval);
    }, [walletAddress, setHasSession]);

    // Inputs
    const [price, setPrice] = useState('');
    const [stopPrice, setStopPrice] = useState('');
    const [stopOrderType, setStopOrderType] = useState<'Stop Limit' | 'Stop Market'>('Stop Limit');
    const [stopDropdownOpen, setStopDropdownOpen] = useState(false);
    const [amount, setAmount] = useState('');
    const [isAmountUSD, setIsAmountUSD] = useState(true);

    const [leverage, setLeverage] = useState(20);
    const [marginMode, setMarginMode] = useState<'Cross' | 'Isolated'>('Cross');
    const [marginModeDropdownOpen, setMarginModeDropdownOpen] = useState(false);

    const [advancedOpen, setAdvancedOpen] = useState(false);
    const [reduceOnly, setReduceOnly] = useState(false);
    const [postOnly, setPostOnly] = useState(true);

    // Advanced Dropdown States
    const [timeInForce, setTimeInForce] = useState('Good Til Date');
    const [tifDropdownOpen, setTifDropdownOpen] = useState(false);

    const [timeUnit, setTimeUnit] = useState('Days');
    const [timeUnitDropdownOpen, setTimeUnitDropdownOpen] = useState(false);

    const [tpslEnabled, setTpslEnabled] = useState(false);
    const [tpUnit, setTpUnit] = useState('%');
    const [tpDropdownOpen, setTpDropdownOpen] = useState(false);
    const [tpValue, setTpValue] = useState('');
    const [tpPrice, setTpPrice] = useState('');

    const [slUnit, setSlUnit] = useState('%');
    const [slDropdownOpen, setSlDropdownOpen] = useState(false);
    const [slValue, setSlValue] = useState('');
    const [slPrice, setSlPrice] = useState('');

    const [receiptOpen, setReceiptOpen] = useState(true);

    // Dynamic Price Helpers
    const handleQuickPrice = (type: string) => {
        if (!selectedMarket?.price) return;

        const currentPrice = selectedMarket.price;
        let targetPrice = currentPrice;

        switch (type) {
            case 'Fill':
            case 'Mid':
            case 'Bid':
                targetPrice = currentPrice;
                break;
            case '1%':
                targetPrice = side === 'buy' ? currentPrice * 0.99 : currentPrice * 1.01;
                break;
            case '5%':
                targetPrice = side === 'buy' ? currentPrice * 0.95 : currentPrice * 1.05;
                break;
        }

        // Format to correct precision (using simplest approach for now)
        const formatted = targetPrice < 10 && targetPrice > 0.0001
            ? targetPrice.toFixed(4)
            : targetPrice.toFixed(2);

        // If in Stop Limit mode, we might want to set Stop Price if it's focused, 
        // but broadly these helpers usually target the Limit Price.
        // For simplicity, we set the main Price field.
        setPrice(formatted);

        // If Stop Limit and Price is empty, maybe set Stop Price too? 
        // User asked "set price", assuming Limit Price.
    };

    // Amount Toggle Logic
    const handleAmountSwitch = () => {
        const nextIsUSD = !isAmountUSD;
        setIsAmountUSD(nextIsUSD);

        if (!amount || parseFloat(amount) === 0 || !selectedMarket?.price) return;

        const currentVal = parseFloat(amount);
        const price = selectedMarket.price;
        let converted = 0;

        if (nextIsUSD) {
            // Token -> USD (Value = TokenCount * Price)
            converted = currentVal * price;
        } else {
            // USD -> Token (TokenCount = Value / Price)
            converted = currentVal / price;
        }

        // Format
        // If converting to USD, standard 2 decimals usually fine.
        // If converting to Token, might need more precision.
        const formatted = nextIsUSD
            ? converted.toFixed(2)
            : (converted < 1 ? converted.toFixed(6) : converted.toFixed(4));

        setAmount(formatted);
    };

    // Handle order submission
    const handleSubmit = async () => {
        console.log('[OrderForm] Submitting order...', {
            side,
            amount,
            price,
            selectedMarket: selectedMarket?.symbol,
            authenticated,
            hasSession
        });

        // Guard: Check wallet connection
        if (!authenticated || !walletAddress) {
            console.warn('[OrderForm] Not authenticated');
            toast.error('Please connect your wallet first');
            return;
        }

        // Get Wallet for Chain Check
        const wallet = wallets[0];
        if (wallet) {
            const chainId = Number(wallet.chainId);
            // arbitrumSepolia.id is 421614
            const targetChainId = 421614;

            if (chainId !== targetChainId) {
                try {
                    await wallet.switchChain(targetChainId);
                } catch (switchError) {
                    console.error('Failed to switch chain:', switchError);
                    toast.error('Please switch to Arbitrum Sepolia');
                    setIsSubmitting(false);
                    return;
                }
            }
        }

        if (!selectedMarket || !amount || parseFloat(amount) <= 0) {
            console.warn('[OrderForm] Invalid market or amount', { selectedMarket: !!selectedMarket, amount });
            toast.error('Please enter a valid amount');
            return;
        }

        if (!walletClient) {
            console.warn('[OrderForm] No wallet client');
            toast.error('Wallet not ready');
            return;
        }

        // Determine order type
        let orderType: 0 | 1 | 2 = 0; // Market
        if (activeTab === 'Limit') orderType = 1;
        else if (activeTab === 'Stop Limit') orderType = 2;

        setIsSubmitting(true);

        try {
            // Map side to enum: Buy=0, Sell=1
            const sideEnum = side === 'buy' ? 0 : 1;

            let result;
            const sessionKey = localStorage.getItem('osmo_session_key');

            // Calculate final USD amount
            const finalAmountUsd = isAmountUSD
                ? parseFloat(amount)
                : parseFloat(amount) * (selectedMarket?.price || 0);

            // 1-Click Trading Logic: If session key exists and authorized
            // Explicitly check for key existence AND store state.
            if (sessionKey && hasSession) {
                console.log('[OrderForm] Calling placeOrder via Session Key...');
                result = await onchainService.placeOrderWithSession(sessionKey, {
                    user: walletAddress,
                    symbol: selectedMarket.symbol,
                    side: sideEnum,
                    orderType: orderType,
                    amountUsd: finalAmountUsd,
                    leverage: leverage,
                    // For Market orders, we must pass the current price because the contract 
                    // has no price pusher and otherwise reverts with "Invalid price".
                    price: activeTab === 'Market' ? (selectedMarket.price || 0) : (price ? parseFloat(price) : 0),
                    stopPrice: stopPrice ? parseFloat(stopPrice) : 0
                });
            } else {
                // If we thought we had a session but key is missing, or hasSession is false
                // But the button enabled submission (race condition), intercept here.
                if (!hasSession) {
                    console.warn('[OrderForm] Session missing. User must establish session key to trade in 1-Click mode.');
                    // Don't auto-open modal to avoid annoyance. Let user click the button if they want.
                    toast.error('Session Key required for 1-Click Trading. Please establish connection.');
                    setIsSubmitting(false);
                    return;
                }

                if (!walletClient) {
                    toast.error('Wallet not ready and no session active');
                    setIsSubmitting(false);
                    return;
                }
                console.log('[OrderForm] Calling placeOrder via API (Simulation Mode)...');

                // Using Backend API instead of On-Chain Contract directly


                const res = await orderService.placeOrder({
                    user_address: walletAddress,
                    symbol: selectedMarket.symbol,
                    side: side,
                    order_type: activeTab.toLowerCase() as any,
                    amount_usd: finalAmountUsd,
                    leverage: leverage,
                    price: price ? parseFloat(price) : undefined,
                    stop_price: stopPrice ? parseFloat(stopPrice) : undefined,
                    exchange: 'simulation'
                });

                result = {
                    success: res.success,
                    tx_hash: res.order_id // Use ID as hash for tracking
                };
            }

            if (result.success) {
                toast.success(`Order placed successfully! Tx: ${result.tx_hash?.slice(0, 10)}...`);

                // Immediate Refresh
                refreshAll(walletAddress);

                // Report to backend for immediate tracking (shadow position)
                if (result.tx_hash) {
                    // Non-blocking report
                    orderService.reportOnchainOrder({
                        user_address: walletAddress,
                        symbol: selectedMarket.symbol,
                        side: side,
                        order_type: activeTab.toLowerCase() as any,
                        amount_usd: finalAmountUsd,
                        leverage: leverage,
                        tx_hash: result.tx_hash,
                        price: price ? parseFloat(price) : (selectedMarket?.price || undefined),
                        stop_price: stopPrice ? parseFloat(stopPrice) : undefined
                    }).catch(err => {
                        console.error('[OrderForm] Failed to report order to backend:', err);
                    });
                }

                // Sequential refreshes to handle indexing/commit lag
                [500, 2000, 5000].forEach(ms => {
                    setTimeout(() => refreshAll(walletAddress), ms);
                });

                // Handle TP/SL if enabled
                if (tpslEnabled) {
                    const finalTP = tpPrice || (tpValue ? `${tpValue}${tpUnit}` : undefined);
                    const finalSL = slPrice || (slValue ? `${slValue}${slUnit}` : undefined);

                    if (finalTP || finalSL) {
                        try {
                            await updateTPSL(walletAddress, selectedMarket.symbol, finalTP, finalSL);
                            toast.success('TP/SL preferences updated');
                        } catch (e) {
                            console.error('Failed to set TP/SL', e);
                        }
                    }
                }

                // Clear form
                setAmount('');
            }
        } catch (error: any) {
            console.error('Order placement failed:', error);
            const msg = error.message || '';

            // Auto-handle session expiry/invalid
            if (
                msg.includes('Unauthorized') ||
                msg.includes('SessionInactive') ||
                msg.includes('ExecutionFailed')
            ) {
                toast.error('Session invalid. Please reconnect.');
                localStorage.removeItem('osmo_session_key');
                localStorage.removeItem('osmo_session_address');
                localStorage.removeItem('osmo_session_expires');

                // Force immediate state update via store
                useUIStore.getState().setHasSession(false);
                useUIStore.getState().setSessionChecking(false);

                // setTimeout(() => openSessionModal(), 100); // Disable auto-reopen
            } else {
                toast.error(msg || 'Failed to place order');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // Reset Form
    const handleReset = () => {
        setAmount('');
        setPrice('');
        setStopPrice('');
        // Default leverage: 20x or Max Leverage if lower
        const defaultLev = 1;
        const maxLev = selectedMarket?.maxLeverage || 50;
        setLeverage(Math.min(defaultLev, maxLev));
        // Reset TP/SL inputs if needed
        setTpValue('');
        setTpPrice('');
        setSlValue('');
        setSlPrice('');
        // Maybe reset advanced toggles? User said "clear inputs or back to default".
        // Keeping it simple for now.
    };

    return (
        <div className={styles.container}>


            <div className={styles.scrollContent}>
                <div className={styles.stickyHeaderContainer}>
                    {/* 4. Buy / Sell Big Buttons - moved to top */}
                    <div className={styles.buySellContainer}>
                        <button
                            className={`${styles.tradeBtn} ${side === 'buy' ? styles.active + ' ' + styles.buy : styles.inactive}`}
                            onClick={() => setSide('buy')}
                        >
                            Buy | Long
                        </button>
                        <button
                            className={`${styles.tradeBtn} ${side === 'sell' ? styles.active + ' ' + styles.sell : styles.inactive}`}
                            onClick={() => setSide('sell')}
                        >
                            Sell | Short
                        </button>
                    </div>

                    {/* 3. Tabs */}
                    <div className={styles.tabs}>
                        <button
                            className={`${styles.tab} ${activeTab === 'Market' ? styles.active : ''}`}
                            onClick={() => setActiveTab('Market')}
                        >
                            Market
                        </button>
                        <button
                            className={`${styles.tab} ${activeTab === 'Limit' ? styles.active : ''}`}
                            onClick={() => setActiveTab('Limit')}
                        >
                            Limit
                        </button>
                        <div style={{ position: 'relative', flex: 1, display: 'flex' }}>
                            <button
                                className={`${styles.tab} ${activeTab === 'Stop Limit' ? styles.active : ''}`}
                                onClick={() => {
                                    if (activeTab === 'Stop Limit') {
                                        setStopDropdownOpen(!stopDropdownOpen);
                                    } else {
                                        setActiveTab('Stop Limit');
                                    }
                                }}
                                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                            >
                                Stop <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transform: stopDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            </button>
                            {stopDropdownOpen && activeTab === 'Stop Limit' && (
                                <div className={styles.dropdownMenu} style={{ top: '100%', left: 0, width: '100%', zIndex: 50 }}>
                                    {['Stop Limit', 'Stop Market'].map((type) => (
                                        <div
                                            key={type}
                                            className={`${styles.dropdownItem} ${stopOrderType === type ? styles.active : ''}`}
                                            onClick={() => {
                                                setStopOrderType(type as 'Stop Limit' | 'Stop Market');
                                                setStopDropdownOpen(false);
                                            }}
                                        >
                                            {type}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 5. Form Content */}
                <div className={styles.formArea}>

                    {/* Stop Price - Only for Stop Limit Tab */}
                    {activeTab === 'Stop Limit' && (
                        <div className={styles.inputWrapper}>
                            <div className={styles.inputLabelRow}>
                                <span>Stop Price</span>
                            </div>
                            <div className={styles.inputRow}>
                                <input
                                    className={styles.inputMain}
                                    placeholder="0.00"
                                    value={stopPrice}
                                    onChange={(e) => setStopPrice(e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    {/* Limit Price - Visible in Limit tab OR (Stop Limit tab AND Stop Limit Type) */}
                    {(activeTab === 'Limit' || (activeTab === 'Stop Limit' && stopOrderType === 'Stop Limit')) && (
                        <>
                            <div className={styles.inputWrapper}>
                                <div className={styles.inputLabelRow}>
                                    <span>Limit Price</span>
                                </div>
                                <div className={styles.inputRow}>
                                    <input
                                        className={styles.inputMain}
                                        placeholder="0.00"
                                        value={price}
                                        onChange={(e) => setPrice(e.target.value)}
                                    />
                                </div>
                            </div>
                            {/* Helper Pills - Only show for Limit Price context? Or keep for both? usually for Limit Price setting */}
                            <div className={styles.pillsRow} style={{ padding: 0, marginBottom: 0 }}>
                                <div className={styles.pill} onClick={() => handleQuickPrice('Fill')}>Fill</div>
                                <div className={styles.pill} onClick={() => handleQuickPrice('Mid')}>Mid</div>
                                <div className={styles.pill} onClick={() => handleQuickPrice('Bid')}>Bid</div>
                                <div className={styles.pill} onClick={() => handleQuickPrice('1%')}>
                                    {side === 'buy' ? '1% ↓' : '1% ↑'}
                                </div>
                                <div className={styles.pill} onClick={() => handleQuickPrice('5%')}>
                                    {side === 'buy' ? '5% ↓' : '5% ↑'}
                                </div>
                            </div>
                        </>
                    )}

                    {/* Amount Input (Unified for all types) */}
                    <div className={styles.marketInputContainer}>
                        <div className={styles.marketInputColumn}>
                            <div className={styles.inputLabelRow} style={{ justifyContent: 'flex-start', gap: '8px', alignItems: 'center' }}>
                                <span style={{ textDecoration: 'underline', textDecorationStyle: 'dotted', cursor: 'help' }}>Amount</span>
                                <span className={styles.badges} style={{ fontSize: '11px', padding: '2px 6px' }}>
                                    {isAmountUSD ? 'USD' : (selectedMarket?.symbol?.split('-')[0] || 'Token')}
                                </span>
                            </div>
                            <input
                                className={styles.inputMain}
                                placeholder={isAmountUSD ? "$0.00" : "0.00"}
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                style={{ fontSize: '18px' }}
                            />
                        </div>
                        <div
                            className={styles.swapButton}
                            onClick={handleAmountSwitch}
                        >
                            <span style={{ fontSize: '18px' }}>⇄</span>
                        </div>
                    </div>
                </div>

                {/* Leverage Slider Section */}
                <div className={styles.leverageContainer}>
                    <div className={styles.leverageHeader}>
                        <span>Leverage</span>
                        <div style={{ position: 'relative' }}>
                            <span className={styles.leverageValue}>{leverage.toFixed(2)}x</span>
                            <span
                                className={styles.badgeNone}
                                style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                onClick={() => setMarginModeDropdownOpen(!marginModeDropdownOpen)}
                            >
                                {marginMode}
                                <svg
                                    width="10"
                                    height="6"
                                    viewBox="0 0 10 6"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                    style={{
                                        marginLeft: '4px',
                                        opacity: 0.7,
                                        transform: marginModeDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                                        transition: 'transform 0.2s'
                                    }}
                                >
                                    <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </span>

                            {marginModeDropdownOpen && (
                                <div className={styles.dropdownMenu}>
                                    <div
                                        className={`${styles.dropdownItem} ${marginMode === 'Cross' ? styles.active : ''}`}
                                        onClick={() => { setMarginMode('Cross'); setMarginModeDropdownOpen(false); }}
                                    >
                                        Cross
                                    </div>
                                    <div
                                        className={`${styles.dropdownItem} ${marginMode === 'Isolated' ? styles.active : ''}`}
                                        onClick={() => { setMarginMode('Isolated'); setMarginModeDropdownOpen(false); }}
                                    >
                                        Isolated
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className={styles.leverageControls}>
                        <div className={styles.leverageInput}>{leverage.toFixed(2)}x</div>
                        <div className={styles.sliderTrack}>
                            {/* Visual dots */}
                            <div className={styles.sliderDots}>
                                {[...Array(5)].map((_, i) => <div key={i} className={styles.dot}></div>)}
                            </div>
                            {/* Fill */}
                            <div className={styles.sliderFill} style={{ width: `${(leverage / (selectedMarket?.maxLeverage || 50)) * 100}%` }}></div>
                            {/* Thumb */}
                            <div className={styles.sliderThumb} style={{ left: `${(leverage / (selectedMarket?.maxLeverage || 50)) * 100}%` }}></div>
                            {/* Input Range */}
                            <input
                                type="range"
                                min="1"
                                max={selectedMarket?.maxLeverage || 50}
                                step="1"
                                value={leverage}
                                onChange={(e) => setLeverage(Number(e.target.value))}
                                style={{
                                    position: 'absolute', width: '100%', height: '100%',
                                    opacity: 0, cursor: 'pointer', zIndex: 10
                                }}
                            />
                        </div>
                        <span style={{ fontSize: '12px', color: '#A77590' }}>{selectedMarket?.maxLeverage || 50}×</span>
                    </div>
                </div>

                {/* 6. Advanced Section (For Limit/Stop Limit) OR TP/SL (For Market) */}
                {activeTab !== 'Market' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div className={styles.advancedToggleHeader} onClick={() => setAdvancedOpen(!advancedOpen)}>
                            <span>Advanced</span>
                            <div className={styles.dividerLine}></div>
                            <svg
                                width="10"
                                height="6"
                                viewBox="0 0 10 6"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                style={{
                                    opacity: 0.6,
                                    transform: advancedOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                                    transition: 'transform 0.2s'
                                }}
                            >
                                <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>

                        {advancedOpen && (
                            <div className={styles.advancedContent}>
                                <div
                                    className={styles.advancedGrid}
                                    style={activeTab === 'Stop Limit' || timeInForce === 'Immediate Or Cancel' ? { gridTemplateColumns: '1fr' } : {}}
                                >
                                    {/* Special Layout for Stop Limit Tab (Stop Limit & Stop Market): Time First, Then Execution (TIF), Stacked */}
                                    {activeTab === 'Stop Limit' ? (
                                        <>
                                            {/* Time Input (Always Visible for Stop Limit tab) */}
                                            <div className={styles.advancedInputBox} style={{ cursor: 'default' }}>
                                                <span className={styles.advancedLabel}>Time</span>
                                                <div className={styles.advancedValue}>
                                                    <input type="text" defaultValue="28" style={{ background: 'transparent', border: 'none', color: '#FFE1F2', fontSize: '14px', width: '40px', outline: 'none', fontWeight: 500 }} />
                                                    <div
                                                        className={styles.daysSelector}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setTimeUnitDropdownOpen(!timeUnitDropdownOpen);
                                                        }}
                                                        style={{ cursor: 'pointer', position: 'relative' }}
                                                    >
                                                        {timeUnit} <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginLeft: '4px' }}><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                                        {timeUnitDropdownOpen && (
                                                            <div className={styles.dropdownMenu} style={{ top: 'calc(100% + 4px)', right: 0, minWidth: '80px', zIndex: 30 }}>
                                                                {['Mins', 'Hours', 'Days', 'Weeks'].map((unit) => (
                                                                    <div
                                                                        key={unit}
                                                                        className={`${styles.dropdownItem} ${timeUnit === unit ? styles.active : ''}`}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setTimeUnit(unit);
                                                                            setTimeUnitDropdownOpen(false);
                                                                        }}
                                                                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                                                                    >
                                                                        {unit}
                                                                        {timeUnit === unit && <span style={{ fontSize: '10px' }}>✔</span>}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Execution (TIF) Dropdown for Stop Limit */}
                                            <div
                                                className={styles.advancedInputBox}
                                                onClick={() => setTifDropdownOpen(!tifDropdownOpen)}
                                            >
                                                <span className={styles.advancedLabel}>Execution</span>
                                                <div className={styles.advancedValue}>
                                                    {timeInForce}
                                                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.5, transform: tifDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                                </div>
                                                {tifDropdownOpen && (
                                                    <div className={styles.dropdownMenu} style={{ top: '100%', left: 0, right: 0, width: '100%', zIndex: 30 }}>
                                                        {['Good Til Date', 'Immediate Or Cancel', 'Post-Only'].map((option) => (
                                                            <div
                                                                key={option}
                                                                className={`${styles.dropdownItem} ${timeInForce === option ? styles.active : ''}`}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setTimeInForce(option);
                                                                    setTifDropdownOpen(false);
                                                                }}
                                                                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                                                            >
                                                                {option}
                                                                {timeInForce === option && <span style={{ fontSize: '10px' }}>✔</span>}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    ) : (
                                        /* Standard Layout for Limit Order */
                                        <>
                                            {/* Time In Force Dropdown */}
                                            <div
                                                className={styles.advancedInputBox}
                                                onClick={() => setTifDropdownOpen(!tifDropdownOpen)}
                                            >
                                                <span className={styles.advancedLabel}>Time In Force</span>
                                                <div className={styles.advancedValue}>
                                                    {timeInForce}
                                                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.5, transform: tifDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                                </div>
                                                {tifDropdownOpen && (
                                                    <div className={styles.dropdownMenu} style={{ top: '100%', left: 0, right: 0, width: '100%', zIndex: 30 }}>
                                                        {['Good Til Date', 'Immediate Or Cancel'].map((option) => (
                                                            <div
                                                                key={option}
                                                                className={`${styles.dropdownItem} ${timeInForce === option ? styles.active : ''}`}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setTimeInForce(option);
                                                                    setTifDropdownOpen(false);
                                                                }}
                                                                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                                                            >
                                                                {option}
                                                                {timeInForce === option && <span style={{ fontSize: '10px' }}>✔</span>}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Time Unit Dropdown - Only show if NOT Immediate Or Cancel */}
                                            {timeInForce !== 'Immediate Or Cancel' && (
                                                <div className={styles.advancedInputBox} style={{ cursor: 'default' }}>
                                                    <span className={styles.advancedLabel}>Time</span>
                                                    <div className={styles.advancedValue}>
                                                        <input type="text" defaultValue="28" style={{ background: 'transparent', border: 'none', color: '#FFE1F2', fontSize: '14px', width: '40px', outline: 'none', fontWeight: 500 }} />
                                                        <div
                                                            className={styles.daysSelector}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setTimeUnitDropdownOpen(!timeUnitDropdownOpen);
                                                            }}
                                                            style={{ cursor: 'pointer', position: 'relative' }}
                                                        >
                                                            {timeUnit} <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginLeft: '4px' }}><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                                            {timeUnitDropdownOpen && (
                                                                <div className={styles.dropdownMenu} style={{ top: 'calc(100% + 4px)', right: 0, minWidth: '80px', zIndex: 30 }}>
                                                                    {['Mins', 'Hours', 'Days', 'Weeks'].map((unit) => (
                                                                        <div
                                                                            key={unit}
                                                                            className={`${styles.dropdownItem} ${timeUnit === unit ? styles.active : ''}`}
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setTimeUnit(unit);
                                                                                setTimeUnitDropdownOpen(false);
                                                                            }}
                                                                            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                                                                        >
                                                                            {unit}
                                                                            {timeUnit === unit && <span style={{ fontSize: '10px' }}>✔</span>}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>

                                <div className={styles.checkboxRow} onClick={() => setReduceOnly(!reduceOnly)}>
                                    <div className={`${styles.checkbox} ${reduceOnly ? styles.checked : ''}`}>
                                        {reduceOnly && <div className={styles.checkMark}></div>}
                                    </div>
                                    <span className={styles.checkboxLabel}>Reduce-Only</span>
                                </div>

                                <div className={styles.checkboxRow} onClick={() => setPostOnly(!postOnly)}>
                                    <div className={`${styles.checkbox} ${postOnly ? styles.checked : ''}`}>
                                        {postOnly && <div className={styles.checkMark}></div>}
                                    </div>
                                    <span className={styles.checkboxLabel}>Post-Only</span>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    /* TP/SL Section for Market Order */
                    <div className={styles.tpslContainer}>
                        <div className={styles.checkboxRow} onClick={() => setTpslEnabled(!tpslEnabled)}>
                            <div className={`${styles.checkbox} ${tpslEnabled ? styles.checked : ''}`}>
                                {tpslEnabled && <div className={styles.checkMark}></div>}
                            </div>
                            <span style={{ fontSize: '14px', color: '#FFE1F2' }}>Take Profit / Stop Loss</span>
                        </div>

                        {tpslEnabled && (
                            <div className={styles.tpslGrid} style={{ gap: '12px' }}>
                                <div className={styles.tpslInput}>
                                    <span className={styles.tpslLabel}>TP Price</span>
                                    <input
                                        className={styles.tpslField}
                                        placeholder="$0.00"
                                        type="text"
                                        inputMode="decimal"
                                        value={tpPrice ? '$' + tpPrice : ''}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/[^0-9.]/g, '');
                                            setTpPrice(val);
                                        }}
                                    />
                                </div>
                                <div className={styles.tpslInput} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                        <span className={styles.tpslLabel}>Gain</span>
                                        <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center' }}>
                                            <input
                                                type="text"
                                                inputMode="decimal"
                                                className={styles.tpslField}
                                                placeholder={tpUnit === '$' ? "$0.00" : "0.00%"}
                                                value={tpValue ? (tpUnit === '$' ? '$' + tpValue : tpValue + '%') : ''}
                                                onChange={(e) => {
                                                    const val = e.target.value.replace(/[^0-9.]/g, '');
                                                    setTpValue(val);
                                                }}
                                                style={{
                                                    width: '100%'
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <div
                                        className={styles.percentBadge}
                                        style={{ position: 'relative', marginLeft: '8px' }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setTpDropdownOpen(!tpDropdownOpen);
                                        }}
                                    >
                                        {tpUnit} <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginLeft: '4px', opacity: 1 }}><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                        {tpDropdownOpen && (
                                            <div className={styles.dropdownMenu} style={{ top: 'calc(100% + 4px)', right: 0, minWidth: '60px', zIndex: 30 }}>
                                                {['%', '$'].map((unit) => (
                                                    <div
                                                        key={unit}
                                                        className={`${styles.dropdownItem} ${tpUnit === unit ? styles.active : ''}`}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setTpUnit(unit);
                                                            setTpDropdownOpen(false);
                                                        }}
                                                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                                                    >
                                                        {unit}
                                                        {tpUnit === unit && <span style={{ fontSize: '10px' }}>✔</span>}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className={styles.tpslInput}>
                                    <span className={styles.tpslLabel}>SL Price</span>
                                    <input
                                        className={styles.tpslField}
                                        placeholder="$0.00"
                                        type="text"
                                        inputMode="decimal"
                                        value={slPrice ? '$' + slPrice : ''}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/[^0-9.]/g, '');
                                            setSlPrice(val);
                                        }}
                                    />
                                </div>
                                <div className={styles.tpslInput} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                        <span className={styles.tpslLabel}>Loss</span>
                                        <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center' }}>
                                            <input
                                                type="text"
                                                inputMode="decimal"
                                                className={styles.tpslField}
                                                placeholder={slUnit === '$' ? "$0.00" : "0.00%"}
                                                value={slValue ? (slUnit === '$' ? '$' + slValue : slValue + '%') : ''}
                                                onChange={(e) => {
                                                    const val = e.target.value.replace(/[^0-9.]/g, '');
                                                    setSlValue(val);
                                                }}
                                                style={{
                                                    width: '100%'
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <div
                                        className={styles.percentBadge}
                                        style={{ position: 'relative', marginLeft: '8px' }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSlDropdownOpen(!slDropdownOpen);
                                        }}
                                    >
                                        {slUnit} <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginLeft: '4px', opacity: 1 }}><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                        {slDropdownOpen && (
                                            <div className={styles.dropdownMenu} style={{ top: 'calc(100% + 4px)', right: 0, minWidth: '60px', zIndex: 30 }}>
                                                {['%', '$'].map((unit) => (
                                                    <div
                                                        key={unit}
                                                        className={`${styles.dropdownItem} ${slUnit === unit ? styles.active : ''}`}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSlUnit(unit);
                                                            setSlDropdownOpen(false);
                                                        }}
                                                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                                                    >
                                                        {unit}
                                                        {slUnit === unit && <span style={{ fontSize: '10px' }}>✔</span>}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>



            {/* 8. Summary & Action */}
            {/* 8. Summary & Action redone */}
            <div className={styles.summaryContainer}>
                <div className={styles.summaryControlsRow}>
                    <button className={styles.textBtnRed} onClick={handleReset}>Clear</button>
                    <div className={styles.vDivider}></div>
                    <button
                        className={`${styles.receiptToggleBtn} ${receiptOpen ? styles.active : ''}`}
                        onClick={() => setReceiptOpen(!receiptOpen)}
                    >
                        Receipt
                        <svg
                            width="10"
                            height="6"
                            viewBox="0 0 10 6"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            style={{
                                marginLeft: '8px',
                                opacity: 0.7,
                                transform: receiptOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                                transition: 'transform 0.2s'
                            }}
                        >
                            <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                </div>

                {receiptOpen && (
                    <div className={styles.receiptDetails}>
                        <div className={styles.summaryRow}>
                            <span className={styles.summaryLabelDotted}>Expected Price</span>
                            <span className={styles.summaryValue}>
                                {(!authenticated || (summary?.account_value || 0) <= 0)
                                    ? '—'
                                    : `$${(price ? parseFloat(price) : (selectedMarket?.price || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`
                                }
                            </span>
                        </div>
                        <div className={styles.summaryRow}>
                            <span className={styles.summaryLabelDotted}>Liquidation Price (Est)</span>
                            <span className={styles.summaryValue}>
                                {(() => {
                                    if (!authenticated || (summary?.account_value || 0) <= 0) return '—';
                                    const entryPrice = price ? parseFloat(price) : (selectedMarket?.price || 0);
                                    if (!entryPrice) return '—';
                                    // Simple estimation: Long = Entry * (1 - 1/Lev), Short = Entry * (1 + 1/Lev)
                                    // Note: Real liq price depends on MMR. Using 1/Lev is a generic approximation for bankruptcy price.
                                    const liqPrice = side === 'buy'
                                        ? entryPrice * (1 - 1 / leverage)
                                        : entryPrice * (1 + 1 / leverage);
                                    return `$${liqPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;
                                })()}
                            </span>
                        </div>
                        <div className={styles.summaryRow}>
                            <span className={styles.summaryLabelDotted}>Position Margin</span>
                            <span className={styles.summaryValue}>
                                {(authenticated && (summary?.account_value || 0) > 0) && (
                                    <span style={{ color: '#A77590' }}>
                                        {marginMode} {leverage}x ➝
                                    </span>
                                )}
                                {(() => {
                                    if (!authenticated || (summary?.account_value || 0) <= 0) return ' —';
                                    const val = parseFloat(amount || '0');
                                    const executePrice = price ? parseFloat(price) : (selectedMarket?.price || 0);
                                    // If isAmountUSD is true, amount IS the value.
                                    // If false, amount is units, so Value = amount * price.
                                    const notional = isAmountUSD ? val : val * executePrice;
                                    const margin = notional / leverage;
                                    return `$${margin.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                                })()}
                            </span>
                        </div>
                        <div className={styles.summaryRow}>
                            <span className={styles.summaryLabelDotted}>Fee (Est)</span>
                            <span className={styles.summaryValue}>
                                {(() => {
                                    if (!authenticated || (summary?.account_value || 0) <= 0) return '—';
                                    const val = parseFloat(amount || '0');
                                    const executePrice = price ? parseFloat(price) : (selectedMarket?.price || 0);
                                    const notional = isAmountUSD ? val : val * executePrice;
                                    // Est taker fee 0.025% = 0.00025
                                    const fee = notional * 0.00025;
                                    return `$${fee.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;
                                })()}
                            </span>
                        </div>
                        <div className={styles.summaryRow}>
                            <span className={styles.summaryLabelDotted} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                Rewards <span style={{ fontSize: '10px', background: '#3A2530', padding: '0 4px', borderRadius: '4px' }}>x</span>
                                <span style={{ fontSize: '10px', color: '#5D5FEF', background: 'rgba(93, 95, 239, 0.1)', padding: '0 4px', borderRadius: '4px' }}>New</span>
                            </span>
                            <span className={styles.summaryValue}>
                                {(() => {
                                    if (!authenticated || (summary?.account_value || 0) <= 0) return '—';
                                    // Dummy points calc: 1 point per $100 volume?
                                    const val = parseFloat(amount || '0');
                                    const executePrice = price ? parseFloat(price) : (selectedMarket?.price || 0);
                                    const notional = isAmountUSD ? val : val * executePrice;
                                    const points = notional / 100;
                                    return points.toFixed(4);
                                })()}
                            </span>
                        </div>
                    </div>
                )}


                <button
                    className={styles.mainActionBtn}
                    onClick={() => {
                        if (!authenticated) {
                            handleConnect();
                        } else if (!hasSession) {
                            openSessionModal();
                        } else if (!tradingSetupOk) {
                            openTradingSetup();
                        } else if ((summary?.account_value || 0) <= 0) {
                            openDepositModal('deposit');
                        } else {
                            handleSubmit();
                        }
                    }}
                    disabled={authenticated && !isSessionChecking && hasSession && tradingSetupOk && (summary?.account_value || 0) > 0 && (isSubmitting || !amount || parseFloat(amount) <= 0)}
                    style={{
                        opacity: (authenticated && !isSessionChecking && hasSession && tradingSetupOk && (summary?.account_value || 0) > 0 && (isSubmitting || !amount || parseFloat(amount) <= 0)) ? 0.5 : 1,
                        cursor: (authenticated && !isSessionChecking && hasSession && tradingSetupOk && (summary?.account_value || 0) > 0 && (isSubmitting || !amount || parseFloat(amount) <= 0)) ? 'not-allowed' : 'pointer'
                    }}
                >
                    {!authenticated ? (
                        <>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                            Connect Wallet
                        </>
                    ) : !hasSession ? (
                        <>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                            </svg>
                            Establish Connection
                        </>
                    ) : !tradingSetupOk ? (
                        <>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                            </svg>
                            Grant Access
                        </>
                    ) : (summary?.account_value || 0) <= 0 ? (
                        <>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                            </svg>
                            Deposit
                        </>
                    ) : isSubmitting ? (
                        <>
                            <svg className={styles.spinner} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px', animation: 'spin 1s linear infinite' }}>
                                <circle cx="12" cy="12" r="10"></circle>
                            </svg>
                            Placing Order...
                        </>
                    ) : !amount || parseFloat(amount) <= 0 ? (
                        <>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                                <line x1="12" y1="9" x2="12" y2="13"></line>
                                <line x1="12" y1="17" x2="12.01" y2="17"></line>
                            </svg>
                            Enter amount
                        </>
                    ) : (
                        <>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                <polyline points="22 4 12 14.01 9 11.01"></polyline>
                            </svg>
                            {side === 'buy' ? 'Buy Long' : 'Sell Short'}
                        </>
                    )}
                </button>
            </div>

        </div>
    );
};

export default OrderForm;
