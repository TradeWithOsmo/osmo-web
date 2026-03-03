import React, { useState } from 'react';
import styles from './OrderForm.module.css';
import { usePortfolioStore } from '../../store/usePortfolioStore';
import { useMarketStore } from '../../store/useMarketStore';
import { useWallet } from '../../hooks';
import { useUIStore } from '../../store/useUIStore';
import { onchainService } from '../../api/onchainService';
import { orderService } from '../../api/orderService';
import { tradingViewCommandService } from '../../api/tradingViewCommandService';
import toast from 'react-hot-toast';
const parsePositiveNumber = (raw: string): number | null => {
    const parsed = parseFloat(raw);
    if (!Number.isFinite(parsed) || parsed <= 0) return null;
    return parsed;
};
const formatInputPrice = (value: number): string => {
    if (!Number.isFinite(value) || value <= 0) return '';
    return value < 10 && value > 0.0001 ? value.toFixed(4) : value.toFixed(2);
};
const toNumber = (raw: string): number | null => {
    const val = parseFloat(String(raw || '').trim());
    if (!Number.isFinite(val) || val <= 0) return null;
    return val;
};
const computeTpslPrice = (side: 'buy' | 'sell', basisPrice: number, mode: 'tp' | 'sl', unit: '%' | '$', inputRaw: string): number | null => {
    const input = toNumber(inputRaw);
    if (!input || !Number.isFinite(basisPrice) || basisPrice <= 0) return null;
    if (unit === '%') {
        const ratio = input / 100;
        if (mode === 'tp') {
            return side === 'buy' ? basisPrice * (1 + ratio) : basisPrice * (1 - ratio);
        } return side === 'buy' ? basisPrice * (1 - ratio) : basisPrice * (1 + ratio);
    } if (mode === 'tp') {
        return side === 'buy' ? basisPrice + input : basisPrice - input;
    } return side === 'buy' ? basisPrice - input : basisPrice + input;
};
const OrderForm: React.FC = () => {    // Stop orders disabled for now (requires keeper/executor on-chain; simulation stop-limit is incomplete).
    const [activeTab, setActiveTab] = useState<'Limit' | 'Market'>('Market');
    const [side, setSide] = useState<'buy' | 'sell'>('buy');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const selectedMarket = useMarketStore((state) => state.selectedMarket);
    const pendingLimitPrice = useMarketStore((state) => state.pendingLimitPrice);
    const clearPendingLimitPrice = useMarketStore((state) => state.clearPendingLimitPrice);
    const { refreshAll, summary, updateTPSL, positions } = usePortfolioStore();
    const { openDepositModal, hasSession, setHasSession, openSessionModal, isTradingSetupOpen, openTradingSetup, isSessionChecking } = useUIStore();
    // Get wallet from Privy
    const { authenticated, walletAddress, handleConnect, handleSwitchToTargetChain } = useWallet();
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
            } catch {                // Non-fatal: contract/chain may not be deployed or backend RPC might be down.                setTradingSetupOk(false);
                return false;
            }
        } return false;
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
            } useUIStore.getState().setSessionChecking(false);
        };
        checkSession();
        const interval = setInterval(checkSession, 1000);
        // Check every second
        return () => clearInterval(interval);
    }, [walletAddress, setHasSession]);
    // Inputs
    const [price, setPrice] = useState('');
    // Stop-order inputs removed (see note above).
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
            case 'Mid': case 'Bid': targetPrice = currentPrice;
                break;
            case '1%': targetPrice = side === 'buy' ? currentPrice * 0.99 : currentPrice * 1.01;
                break;
            case '5%': targetPrice = side === 'buy' ? currentPrice * 0.95 : currentPrice * 1.05;
                break;
        }        const formatted = formatInputPrice(targetPrice);
        if (activeTab === 'Market') {
            return;
        }
        setPrice(formatted);
    };
    // Fill price input from OrderBook row click (contextual by active tab)
    React.useEffect(() => {
        if (!pendingLimitPrice || !selectedMarket) return;
        if (pendingLimitPrice.symbol !== selectedMarket.symbol) return;
        const clickedPrice = pendingLimitPrice.price;
        if (!Number.isFinite(clickedPrice) || clickedPrice <= 0) {
            clearPendingLimitPrice();
            return;
        } const formatted = formatInputPrice(clickedPrice);
        if (activeTab !== 'Market') {
            setPrice(formatted);
        }
        clearPendingLimitPrice();
    }, [pendingLimitPrice, selectedMarket?.symbol, activeTab, clearPendingLimitPrice]);
    // Amount Toggle Logic
    const handleAmountSwitch = () => {
        if (isSimulationExchange) return;

        const nextIsUSD = !isAmountUSD;
        setIsAmountUSD(nextIsUSD);

        if (!amount || parseFloat(amount) === 0 || !selectedMarket?.price) return;

        const currentVal = parseFloat(amount);
        const px = selectedMarket.price;

        // Token <-> USD conversion using the current mark price.
        const converted = nextIsUSD ? (currentVal * px) : (currentVal / px);

        // If converting to USD, standard 2 decimals usually fine.
        // If converting to Token, keep more precision.
        const formatted = nextIsUSD
            ? converted.toFixed(2)
            : (converted < 1 ? converted.toFixed(6) : converted.toFixed(4));

        setAmount(formatted);
    };
    const currentMarketPrice = selectedMarket?.price || 0;
    const parsedLimitPrice = parsePositiveNumber(price);
    const effectiveMarketOrderPrice = currentMarketPrice;
    const effectiveDisplayPrice = activeTab === 'Market' ? effectiveMarketOrderPrice : (parsedLimitPrice ?? currentMarketPrice);
    const maxLeverage = selectedMarket?.maxLeverage || 50;
    const normalizedSymbol = (selectedMarket?.symbol || '').toUpperCase();
    const hasOpenPositionForSymbol = positions.some((p) => (p.symbol || '').toUpperCase() === normalizedSymbol);

    const tradingExchange = String(import.meta.env.VITE_TRADING_EXCHANGE || 'onchain').toLowerCase();
    const isSimulationExchange = tradingExchange === 'simulation';

    // Reset leverage if it exceeds maxLeverage of the new market
    React.useEffect(() => {
        if (selectedMarket?.maxLeverage && leverage > selectedMarket.maxLeverage) {
            setLeverage(selectedMarket.maxLeverage);
        }
    }, [selectedMarket?.symbol, selectedMarket?.maxLeverage, leverage]);

    React.useEffect(() => {
        if (isSimulationExchange && !isAmountUSD) {
            setIsAmountUSD(true);
        }
    }, [isSimulationExchange, isAmountUSD]);

    const resolveTimeInForce = (raw: string): 'GTC' | 'IOC' => {
        // UI labels are a bit different, normalize to backend contract/engine.
        return raw === 'Immediate Or Cancel' ? 'IOC' : 'GTC';
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

        if (!authenticated || !walletAddress) {
            console.warn('[OrderForm] Not authenticated');
            toast.error('Please connect your wallet first');
            return;
        }

        setIsSubmitting(true);
        try {
            // Only enforce Base Sepolia when actually trading onchain.
            if (!isSimulationExchange) {
                await handleSwitchToTargetChain();
            }

            if (!selectedMarket || !amount || parseFloat(amount) <= 0) {
                console.warn('[OrderForm] Invalid market or amount', { selectedMarket: !!selectedMarket, amount });
                toast.error('Please enter a valid amount');
                return;
            }

            if (activeTab === 'Limit' && !parsedLimitPrice) {
                toast.error('Please enter a valid limit price');
                return;
            }

            if (activeTab === 'Market' && (!Number.isFinite(effectiveMarketOrderPrice) || effectiveMarketOrderPrice <= 0)) {
                toast.error('Live market price unavailable. Please wait for price stream.');
                return;
            }

            if (!Number.isFinite(leverage) || leverage < 1 || leverage > maxLeverage) {
                toast.error(`Leverage must be between 1x and ${maxLeverage}x`);
                return;
            }

            // Determine order type: Market=0, Limit=1 (Stop disabled in UI)
            const orderType: 0 | 1 = activeTab === 'Limit' ? 1 : 0;
            const sideEnum = side === 'buy' ? 0 : 1;

            const sessionKey = localStorage.getItem('osmo_session_key');

            const parsedAmount = parseFloat(amount);
            const finalAmountUsd = isSimulationExchange
                ? parsedAmount
                : (
                    isAmountUSD
                        ? parsedAmount
                        : parsedAmount * (selectedMarket?.price || 0)
                );

            if (!Number.isFinite(finalAmountUsd) || finalAmountUsd <= 0) {
                toast.error('Amount conversion failed. Please re-enter amount.');
                return;
            }

            if (reduceOnly && !hasOpenPositionForSymbol) {
                toast.error(`No open ${selectedMarket.symbol} position to reduce.`);
                return;
            }

            // Frontend guardrail for margin: contract enforces final check, but UI should prevent obvious failures.
            const requiredMargin = finalAmountUsd / Math.max(1, leverage);
            const freeCollateral = Number(summary?.free_collateral || 0);
            if (!reduceOnly && Number.isFinite(freeCollateral) && freeCollateral > 0 && requiredMargin > freeCollateral) {
                toast.error('Insufficient free collateral for this position size/leverage.');
                return;
            }

            // Resolve TP/SL for backend execution + position persistence
            const basisPriceForTpsl = activeTab === 'Market'
                ? effectiveMarketOrderPrice
                : (parsedLimitPrice ?? selectedMarket?.price ?? 0);

            const computedTpFromUnit = computeTpslPrice(
                side,
                basisPriceForTpsl,
                'tp',
                tpUnit as '%' | '$',
                tpValue
            );

            const computedSlFromUnit = computeTpslPrice(
                side,
                basisPriceForTpsl,
                'sl',
                slUnit as '%' | '$',
                slValue
            );

            const resolvedTp = tpslEnabled
                ? (toNumber(tpPrice) ?? computedTpFromUnit ?? undefined)
                : undefined;

            const resolvedSl = tpslEnabled
                ? (toNumber(slPrice) ?? computedSlFromUnit ?? undefined)
                : undefined;

            if (tpslEnabled) {
                const basis = basisPriceForTpsl;
                if (!Number.isFinite(basis) || basis <= 0) {
                    toast.error('Cannot set TP/SL without a valid reference price.');
                    return;
                }
                if (resolvedTp !== undefined) {
                    const validTp = side === 'buy' ? resolvedTp > basis : resolvedTp < basis;
                    if (!validTp) {
                        toast.error(side === 'buy' ? 'TP must be above entry price for long.' : 'TP must be below entry price for short.');
                        return;
                    }
                }
                if (resolvedSl !== undefined) {
                    const validSl = side === 'buy' ? resolvedSl < basis : resolvedSl > basis;
                    if (!validSl) {
                        toast.error(side === 'buy' ? 'SL must be below entry price for long.' : 'SL must be above entry price for short.');
                        return;
                    }
                }
            }

            const finalTP =
                (tpslEnabled ? tpPrice : '') ||
                (resolvedTp ? formatInputPrice(resolvedTp) : (tpValue ? `${tpValue}${tpUnit}` : undefined));

            const finalSL =
                (tpslEnabled ? slPrice : '') ||
                (resolvedSl ? formatInputPrice(resolvedSl) : (slValue ? `${slValue}${slUnit}` : undefined));

            let result: { success: boolean; tx_hash?: string } | undefined;

            // Onchain: 1-click trading via backend using stored session key.
            if (!isSimulationExchange) {
                if (!sessionKey || !hasSession) {
                    console.warn('[OrderForm] Missing session key for onchain trading.');
                    toast.error('Session Key required for 1-Click Trading. Please establish connection.');
                    return;
                }

                console.log('[OrderForm] Calling placeOrder via Session Key...');

                const limitPrice = parsedLimitPrice ?? 0;
                const marketPrice = effectiveMarketOrderPrice;

                // For Market orders, we must pass current price; contract has no price pusher.
                const execPrice = activeTab === 'Market' ? marketPrice : limitPrice;

                result = await onchainService.placeOrderWithSession(sessionKey, {
                    user: walletAddress,
                    symbol: selectedMarket.symbol,
                    side: sideEnum,
                    orderType,
                    amountUsd: finalAmountUsd,
                    leverage,
                    price: execPrice,
                    stopPrice: 0,
                    reduceOnly,
                    postOnly: activeTab === 'Limit' ? postOnly : false,
                    timeInForce: resolveTimeInForce(timeInForce),
                    tp: resolvedTp,
                    sl: resolvedSl
                });
            } else {
                // Simulation-mode placement via backend API.
                console.log('[OrderForm] Calling placeOrder via API (Simulation Mode)...');

                const res = await orderService.placeOrder({
                    user_address: walletAddress,
                    symbol: selectedMarket.symbol,
                    side,
                    order_type: activeTab.toLowerCase() as any,
                    amount_usd: finalAmountUsd,
                    leverage,
                    price: activeTab === 'Market' ? effectiveMarketOrderPrice : (parsedLimitPrice ?? undefined),
                    tp: resolvedTp,
                    sl: resolvedSl,
                    exchange: 'simulation',
                    reduce_only: reduceOnly,
                    post_only: activeTab === 'Limit' ? postOnly : false,
                    time_in_force: resolveTimeInForce(timeInForce)
                });

                result = {
                    success: res.success,
                    tx_hash: res.order_id
                };
            }

            if (result?.success) {
                toast.success(`Order placed successfully! Tx: ${result.tx_hash?.slice(0, 10)}...`);

                // Immediate refresh
                refreshAll(walletAddress);

                // Only report "onchain" shadow order when we actually did an onchain placement.
                if (!isSimulationExchange && sessionKey && hasSession && result.tx_hash) {
                    orderService.reportOnchainOrder({
                        user_address: walletAddress,
                        symbol: selectedMarket.symbol,
                        side,
                        order_type: activeTab.toLowerCase() as any,
                        amount_usd: finalAmountUsd,
                        leverage,
                        tx_hash: result.tx_hash,
                        price: activeTab === 'Market'
                            ? effectiveMarketOrderPrice
                            : (parsedLimitPrice ?? (selectedMarket?.price || undefined)),
                        tp: resolvedTp,
                        sl: resolvedSl,
                        exchange: 'onchain'
                    }).catch((err) => {
                        console.error('[OrderForm] Failed to report order to backend:', err);
                    });
                }

                // Sequential refreshes to handle indexing/commit lag
                [500, 2000, 5000].forEach((ms) => {
                    setTimeout(() => refreshAll(walletAddress), ms);
                });

                // Handle TP/SL if enabled
                if (tpslEnabled && (finalTP || finalSL)) {
                    try {
                        await updateTPSL(walletAddress, selectedMarket.symbol, finalTP, finalSL);

                        if (resolvedTp && resolvedSl && basisPriceForTpsl > 0) {
                            await tradingViewCommandService.queueSetupTrade({
                                symbol: selectedMarket.symbol,
                                side,
                                entry: basisPriceForTpsl,
                                tp: resolvedTp,
                                sl: resolvedSl,
                                validation: resolvedTp,
                                invalidation: resolvedSl,
                                validation_note: 'TP hit zone',
                                invalidation_note: 'SL invalidation'
                            });
                        }

                        toast.success('TP/SL preferences updated');
                    } catch (e) {
                        console.error('Failed to set TP/SL', e);
                    }
                }

                // Clear form
                setAmount('');
            }
        } catch (error: any) {
            console.error('Order placement failed:', error);
            const msg = error?.message || '';

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
                useUIStore.getState().setHasSession(false);
                useUIStore.getState().setSessionChecking(false);
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

        // Default leverage: 20x or Max Leverage if lower
        const defaultLev = 20;
        const maxLev = selectedMarket?.maxLeverage || 50;
        setLeverage(Math.min(defaultLev, maxLev));

        // Reset TP/SL inputs
        setTpValue('');
        setTpPrice('');
        setSlValue('');
        setSlPrice('');
    };

    const canSubmit =
        authenticated &&
        !isSessionChecking &&
        (isSimulationExchange
            ? true                                              // simulation: no session or setup needed
            : hasSession && tradingSetupOk && (summary?.account_value || 0) > 0);

    const disableSubmit = canSubmit && (isSubmitting || !amount || parseFloat(amount) <= 0);

    return (<div className={styles.container}>            <div className={styles.scrollContent}>                <div className={styles.stickyHeaderContainer}>                    {/* 4. Buy / Sell Big Buttons - moved to top */}                    <div className={styles.buySellContainer}>                        <button className={`${styles.tradeBtn} ${side === 'buy' ? styles.active + ' ' + styles.buy : styles.inactive}`} onClick={() => setSide('buy')}                        >                            Buy | Long                        </button>                        <button className={`${styles.tradeBtn} ${side === 'sell' ? styles.active + ' ' + styles.sell : styles.inactive}`} onClick={() => setSide('sell')}                        >                            Sell | Short                        </button>                    </div>                    {/* 3. Tabs */}                    <div className={styles.tabs}>                        <button className={`${styles.tab} ${activeTab === 'Market' ? styles.active : ''}`} onClick={() => setActiveTab('Market')}                        >                            Market                        </button>                        <button className={`${styles.tab} ${activeTab === 'Limit' ? styles.active : ''}`} onClick={() => setActiveTab('Limit')}                        >                            Limit                        </button>                        {/* Stop orders disabled */}                    </div>                </div>                {/* 5. Form Content */}                <div className={styles.formArea}>                    {/* Order Price - Only for Market tab (defaults to live price if empty) */}                    {activeTab === 'Market' && (<div className={styles.inputWrapper}>                            <div className={styles.inputLabelRow}>                                <span>Order Price</span>                                <span>Auto: Live Price</span>                            </div>                            <div className={styles.inputRow}>                                <input className={styles.inputMain} value={formatInputPrice(currentMarketPrice) || '0.00'} readOnly inputMode="decimal" />                            </div>                        </div>)}                    {/* Limit Price */}                    {activeTab === 'Limit' && (<>                            <div className={styles.inputWrapper}>                                <div className={styles.inputLabelRow}>                                    <span>Limit Price</span>                                </div>                                <div className={styles.inputRow}>                                    <input className={styles.inputMain} placeholder="0.00" value={price} onChange={(e) => {
        setPrice(e.target.value);
    }} />                                </div>                            </div>                            {/* Helper Pills - Only show for Limit Price context? Or keep for both? usually for Limit Price setting */}                            <div className={styles.pillsRow} style={{ padding: 0, marginBottom: 0 }}>                                <div className={styles.pill} onClick={() => handleQuickPrice('Mid')}>Mid</div>                                <div className={styles.pill} onClick={() => handleQuickPrice('Bid')}>Bid</div>                                <div className={styles.pill} onClick={() => handleQuickPrice('1%')}>                                    {side === 'buy' ? '1% ↓' : '1% ↑'}                                </div>                                <div className={styles.pill} onClick={() => handleQuickPrice('5%')}>                                    {side === 'buy' ? '5% ↓' : '5% ↑'}                                </div>                            </div>                        </>)}                    {/* Amount Input (Unified for all types) */}                    <div className={styles.marketInputContainer}>                        <div className={styles.marketInputColumn}>                            <div className={styles.inputLabelRow} style={{ justifyContent: 'flex-start', gap: '8px', alignItems: 'center' }}>                                <span style={{ textDecoration: 'underline', textDecorationStyle: 'dotted', cursor: 'help' }}>{isSimulationExchange ? 'Margin' : 'Amount'}</span>                                <span className={styles.badges}>                                    {isSimulationExchange ? 'USD' : (isAmountUSD ? 'USD' : (selectedMarket?.symbol?.split('-')[0] || 'Token'))}                                </span>                            </div>                            <input className={styles.inputMain} placeholder={(isSimulationExchange || isAmountUSD) ? "$0.00" : "0.00"} value={amount} onChange={(e) => setAmount(e.target.value)} style={{ fontSize: '18px' }} />                        </div>                        <div className={styles.swapButton} onClick={handleAmountSwitch} style={{ opacity: isSimulationExchange ? 0.4 : 1, cursor: isSimulationExchange ? 'not-allowed' : 'pointer' }} title={isSimulationExchange ? 'Simulation uses USD margin input' : 'Switch amount unit'}                        >                            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">                                <path d="M7 7H19M19 7L15.5 3.5M19 7L15.5 10.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />                                <path d="M17 17H5M5 17L8.5 13.5M5 17L8.5 20.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />                            </svg>                        </div>                    </div>                </div>                {/* Leverage Slider Section */}                <div className={styles.leverageContainer}>                    <div className={styles.leverageHeader}>                        <span>Leverage</span>                        <div style={{ position: 'relative' }}>                            <span className={styles.leverageValue}>{leverage.toFixed(2)}x</span>                            <span className={styles.badgeNone} style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }} onClick={() => setMarginModeDropdownOpen(!marginModeDropdownOpen)}                            >                                {marginMode}                                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginLeft: '4px', opacity: 0.7, transform: marginModeDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}                                >                                    <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />                                </svg>                            </span>                            {marginModeDropdownOpen && (<div className={styles.dropdownMenu}>                                    <div className={`${styles.dropdownItem} ${marginMode === 'Cross' ? styles.active : ''}`} onClick={() => {
        setMarginMode('Cross');
        setMarginModeDropdownOpen(false);
    }}                                    >                                        Cross                                    </div>                                    <div className={`${styles.dropdownItem} ${marginMode === 'Isolated' ? styles.active : ''}`} onClick={() => {
        setMarginMode('Isolated');
        setMarginModeDropdownOpen(false);
    }}                                    >                                        Isolated                                    </div>                                </div>)}                        </div>                    </div>                    <div className={styles.leverageControls}>                        <div className={styles.leverageInput}>{leverage.toFixed(2)}x</div>                        <div className={styles.sliderTrack}>                            {/* Visual dots */}                            <div className={styles.sliderDots}>                                {[...Array(5)].map((_, i) => <div key={i} className={styles.dot}></div>)}                            </div>                            {/* Fill */}                            <div className={styles.sliderFill} style={{ width: `${(leverage / (selectedMarket?.maxLeverage || 50)) * 100}%` }}></div>                            {/* Thumb */}                            <div className={styles.sliderThumb} style={{ left: `${(leverage / (selectedMarket?.maxLeverage || 50)) * 100}%` }}></div>                            {/* Input Range */}                            <input type="range" min="1" max={selectedMarket?.maxLeverage || 50} step="1" value={leverage} onChange={(e) => setLeverage(Number(e.target.value))} style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0, cursor: 'pointer', zIndex: 10 }} />                        </div>                        <span style={{ fontSize: '12px', color: '#A77590' }}>{selectedMarket?.maxLeverage || 50}×</span>                    </div>                </div>                {/* 6. Advanced Section (Limit) OR TP/SL (Market) */}                {activeTab !== 'Market' ? (<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>                        <div className={styles.advancedToggleHeader} onClick={() => setAdvancedOpen(!advancedOpen)}>                            <span>Advanced</span>                            <div className={styles.dividerLine}></div>                            <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.6, transform: advancedOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}                            >                                <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />                            </svg>                        </div>                        {advancedOpen && (<div className={styles.advancedContent}>                                <div className={styles.advancedGrid} style={timeInForce === 'Immediate Or Cancel' ? { gridTemplateColumns: '1fr' } : {}}                                >                                    <>                                        {/* Time In Force Dropdown */}                                        <div className={styles.advancedInputBox} onClick={() => setTifDropdownOpen(!tifDropdownOpen)}                                        >                                            <span className={styles.advancedLabel}>Time In Force</span>                                            <div className={styles.advancedValue}>                                                {timeInForce}                                                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.5, transform: tifDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>                                            </div>                                            {tifDropdownOpen && (<div className={styles.dropdownMenu} style={{ top: '100%', left: 0, right: 0, width: '100%', zIndex: 30 }}>                                                    {['Good Til Date', 'Immediate Or Cancel'].map((option) => (<div key={option} className={`${styles.dropdownItem} ${timeInForce === option ? styles.active : ''}`} onClick={(e) => {
        e.stopPropagation();
        setTimeInForce(option);
        setTifDropdownOpen(false);
    }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}                                                        >                                                            {option}                                                            {timeInForce === option && <span style={{ fontSize: '10px' }}>✔</span>}                                                        </div>))}                                                </div>)}                                        </div>                                        {/* Time Unit Dropdown - Only show if NOT Immediate Or Cancel */}                                        {timeInForce !== 'Immediate Or Cancel' && (<div className={styles.advancedInputBox} style={{ cursor: 'default' }}>                                                <span className={styles.advancedLabel}>Time</span>                                                <div className={styles.advancedValue}>                                                    <input type="text" defaultValue="28" style={{ background: 'transparent', border: 'none', color: '#FFE1F2', fontSize: '14px', width: '40px', outline: 'none', fontWeight: 500 }} />                                                    <div className={styles.daysSelector} onClick={(e) => {
        e.stopPropagation();
        setTimeUnitDropdownOpen(!timeUnitDropdownOpen);
    }} style={{ cursor: 'pointer', position: 'relative' }}                                                    >                                                        {timeUnit} <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginLeft: '4px' }}><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>                                                        {timeUnitDropdownOpen && (<div className={styles.dropdownMenu} style={{ top: 'calc(100% + 4px)', right: 0, minWidth: '80px', zIndex: 30 }}>                                                                {['Mins', 'Hours', 'Days', 'Weeks'].map((unit) => (<div key={unit} className={`${styles.dropdownItem} ${timeUnit === unit ? styles.active : ''}`} onClick={(e) => {
        e.stopPropagation();
        setTimeUnit(unit);
        setTimeUnitDropdownOpen(false);
    }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}                                                                    >                                                                        {unit}                                                                        {timeUnit === unit && <span style={{ fontSize: '10px' }}>✔</span>}                                                                    </div>))}                                                            </div>)}                                                    </div>                                                </div>                                            </div>)}                                    </>                                </div>                                <div className={styles.checkboxRow} onClick={() => setReduceOnly(!reduceOnly)}>                                    <div className={`${styles.checkbox} ${reduceOnly ? styles.checked : ''}`}>                                        {reduceOnly && <div className={styles.checkMark}></div>}                                    </div>                                    <span className={styles.checkboxLabel}>Reduce-Only</span>                                </div>                                <div className={styles.checkboxRow} onClick={() => setPostOnly(!postOnly)}>                                    <div className={`${styles.checkbox} ${postOnly ? styles.checked : ''}`}>                                        {postOnly && <div className={styles.checkMark}></div>}                                    </div>                                    <span className={styles.checkboxLabel}>Post-Only</span>                                </div>                            </div>)}                    </div>) : (                    /* TP/SL Section for Market Order */                    <div className={styles.tpslContainer}>                        <div className={styles.checkboxRow} onClick={() => setTpslEnabled(!tpslEnabled)}>                            <div className={`${styles.checkbox} ${tpslEnabled ? styles.checked : ''}`}>                                {tpslEnabled && <div className={styles.checkMark}></div>}                            </div>                            <span style={{ fontSize: '14px', color: '#FFE1F2' }}>Take Profit / Stop Loss</span>                        </div>                        {tpslEnabled && (<div className={styles.tpslGrid} style={{ gap: '12px' }}>                                <div className={styles.tpslInput}>                                    <span className={styles.tpslLabel}>TP Price</span>                                    <input className={styles.tpslField} placeholder="$0.00" type="text" inputMode="decimal" value={tpPrice ? '$' + tpPrice : ''} onChange={(e) => {
        const val = e.target.value.replace(/[^0-9.]/g, '');
        setTpPrice(val);
    }} />                                </div>                                <div className={styles.tpslInput} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>                                        <span className={styles.tpslLabel}>Gain</span>                                        <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center' }}>                                            <input type="text" inputMode="decimal" className={styles.tpslField} placeholder={tpUnit === '$' ? "$0.00" : "0.00%"} value={tpValue ? (tpUnit === '$' ? '$' + tpValue : tpValue + '%') : ''} onChange={(e) => {
        const val = e.target.value.replace(/[^0-9.]/g, '');
        setTpValue(val);
    }} style={{ width: '100%' }} />                                        </div>                                    </div>                                    <div className={styles.percentBadge} style={{ position: 'relative', marginLeft: '8px' }} onClick={(e) => {
        e.stopPropagation();
        setTpDropdownOpen(!tpDropdownOpen);
    }}                                    >                                        {tpUnit} <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginLeft: '4px', opacity: 1 }}><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>                                        {tpDropdownOpen && (<div className={styles.dropdownMenu} style={{ top: 'calc(100% + 4px)', right: 0, minWidth: '60px', zIndex: 30 }}>                                                {['%', '$'].map((unit) => (<div key={unit} className={`${styles.dropdownItem} ${tpUnit === unit ? styles.active : ''}`} onClick={(e) => {
        e.stopPropagation();
        setTpUnit(unit);
        setTpDropdownOpen(false);
    }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}                                                    >                                                        {unit}                                                        {tpUnit === unit && <span style={{ fontSize: '10px' }}>✔</span>}                                                    </div>))}                                            </div>)}                                    </div>                                </div>                                <div className={styles.tpslInput}>                                    <span className={styles.tpslLabel}>SL Price</span>                                    <input className={styles.tpslField} placeholder="$0.00" type="text" inputMode="decimal" value={slPrice ? '$' + slPrice : ''} onChange={(e) => {
        const val = e.target.value.replace(/[^0-9.]/g, '');
        setSlPrice(val);
    }} />                                </div>                                <div className={styles.tpslInput} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>                                        <span className={styles.tpslLabel}>Loss</span>                                        <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center' }}>                                            <input type="text" inputMode="decimal" className={styles.tpslField} placeholder={slUnit === '$' ? "$0.00" : "0.00%"} value={slValue ? (slUnit === '$' ? '$' + slValue : slValue + '%') : ''} onChange={(e) => {
        const val = e.target.value.replace(/[^0-9.]/g, '');
        setSlValue(val);
    }} style={{ width: '100%' }} />                                        </div>                                    </div>                                    <div className={styles.percentBadge} style={{ position: 'relative', marginLeft: '8px' }} onClick={(e) => {
        e.stopPropagation();
        setSlDropdownOpen(!slDropdownOpen);
    }}                                    >                                        {slUnit} <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginLeft: '4px', opacity: 1 }}><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>                                        {slDropdownOpen && (<div className={styles.dropdownMenu} style={{ top: 'calc(100% + 4px)', right: 0, minWidth: '60px', zIndex: 30 }}>                                                {['%', '$'].map((unit) => (<div key={unit} className={`${styles.dropdownItem} ${slUnit === unit ? styles.active : ''}`} onClick={(e) => {
        e.stopPropagation();
        setSlUnit(unit);
        setSlDropdownOpen(false);
    }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}                                                    >                                                        {unit}                                                        {slUnit === unit && <span style={{ fontSize: '10px' }}>✔</span>}                                                    </div>))}                                            </div>)}                                    </div>                                </div>                            </div>)}                    </div>)}            </div>            {/* 8. Summary & Action */}            {/* 8. Summary & Action redone */}            <div className={styles.summaryContainer}>                <div className={styles.summaryControlsRow}>                    <button className={styles.textBtnRed} onClick={handleReset}>Clear</button>                    <div className={styles.vDivider}></div>                    <button className={`${styles.receiptToggleBtn} ${receiptOpen ? styles.active : ''}`} onClick={() => setReceiptOpen(!receiptOpen)}                    >                        Receipt                        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginLeft: '8px', opacity: 0.7, transform: receiptOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}                        >                            <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />                        </svg>                    </button>                </div>                {receiptOpen && (<div className={styles.receiptDetails}>                        <div className={styles.summaryRow}>                            <span className={styles.summaryLabelDotted}>Expected Price</span>                            <span className={styles.summaryValue}>                                {(!authenticated || (summary?.account_value || 0) <= 0) ? '—' : `$${effectiveDisplayPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`}                            </span>                        </div>                        <div className={styles.summaryRow}>                            <span className={styles.summaryLabelDotted}>Liquidation Price (Est)</span>                            <span className={styles.summaryValue}>                                {(() => {
        if (!authenticated || (summary?.account_value || 0) <= 0) return '—';
        const entryPrice = effectiveDisplayPrice;
        if (!entryPrice) return '—';
        // Simple estimation: Long = Entry * (1 - 1/Lev), Short = Entry * (1 + 1/Lev)                                    // Note: Real liq price depends on MMR. Using 1/Lev is a generic approximation for bankruptcy price.
        const liqPrice = side === 'buy' ? entryPrice * (1 - 1 / leverage) : entryPrice * (1 + 1 / leverage);
        return `$${liqPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;
    })()}                            </span>                        </div>                        <div className={styles.summaryRow}>                            <span className={styles.summaryLabelDotted}>Position Margin</span>                            <span className={styles.summaryValue}>                                {(authenticated && (summary?.account_value || 0) > 0) && (<span style={{ color: '#A77590' }}>                                        {marginMode} {leverage}x ➝                                    </span>)}                                {(() => {
        if (!authenticated || (summary?.account_value || 0) <= 0) return ' —';
        const val = parseFloat(amount || '0');
        const executePrice = effectiveDisplayPrice;
        // If isAmountUSD is true, amount IS the value.                                    // If false, amount is units, so Value = amount * price.
        const inputUsd = isAmountUSD ? val : val * executePrice; const notional = isSimulationExchange ? inputUsd * leverage : inputUsd;
        const margin = notional / leverage;
        return `$${margin.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    })()}                            </span>                        </div>                        <div className={styles.summaryRow}>                            <span className={styles.summaryLabelDotted}>Fee (Est)</span>                            <span className={styles.summaryValue}>                                {(() => {
        if (!authenticated || (summary?.account_value || 0) <= 0) return '—';
        const val = parseFloat(amount || '0');
        const executePrice = effectiveDisplayPrice;
        const inputUsd = isAmountUSD ? val : val * executePrice; const notional = isSimulationExchange ? inputUsd * leverage : inputUsd;
        // Est taker fee 0.025% = 0.00025
        const fee = notional * 0.00025;
        return `$${fee.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;
    })()}                            </span>                        </div>                        <div className={styles.summaryRow}>                            <span className={styles.summaryLabelDotted} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>                                Rewards <span style={{ fontSize: '10px', background: '#3A2530', padding: '0 4px', borderRadius: '4px' }}>x</span>                                <span style={{ fontSize: '10px', color: '#5D5FEF', background: 'rgba(93, 95, 239, 0.1)', padding: '0 4px', borderRadius: '4px' }}>New</span>                            </span>                            <span className={styles.summaryValue}>                                {(() => {
        if (!authenticated || (summary?.account_value || 0) <= 0) return '—';
        // Dummy points calc: 1 point per $100 volume?
        const val = parseFloat(amount || '0');
        const executePrice = effectiveDisplayPrice;
        const inputUsd = isAmountUSD ? val : val * executePrice; const notional = isSimulationExchange ? inputUsd * leverage : inputUsd;
        const points = notional / 100;
        return points.toFixed(4);
    })()}                            </span>                        </div>                    </div>)}                <button className={styles.mainActionBtn} onClick={() => {
        if (!authenticated) {
            handleConnect();
        } else if (!isSimulationExchange && !hasSession) {
            openSessionModal();
        } else if (!isSimulationExchange && !tradingSetupOk) {
            openTradingSetup();
        } else if (!isSimulationExchange && (summary?.account_value || 0) <= 0) {
            openDepositModal('deposit');
        } else {
            handleSubmit();
        }
    }} disabled={disableSubmit} style={{ opacity: disableSubmit ? 0.5 : 1, cursor: disableSubmit ? 'not-allowed' : 'pointer' }}                >                    {!authenticated ? (<>                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>                                <circle cx="12" cy="7" r="4"></circle>                            </svg>                            Connect Wallet                        </>) : (!isSimulationExchange && !hasSession) ? (<>                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>                                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>                            </svg>                            Establish Connection                        </>) : (!isSimulationExchange && !tradingSetupOk) ? (<>                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>                            </svg>                            Grant Access                        </>) : (!isSimulationExchange && (summary?.account_value || 0) <= 0) ? (<>                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>                                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>                            </svg>                            Deposit                        </>) : isSubmitting ? (<>                            <svg className={styles.spinner} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px', animation: 'spin 1s linear infinite' }}>                                <circle cx="12" cy="12" r="10"></circle>                            </svg>                            Placing Order...                        </>) : !amount || parseFloat(amount) <= 0 ? (<>                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>                                <line x1="12" y1="9" x2="12" y2="13"></line>                                <line x1="12" y1="17" x2="12.01" y2="17"></line>                            </svg>                            Enter amount                        </>) : (<>                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>                                <polyline points="22 4 12 14.01 9 11.01"></polyline>                            </svg>                            {side === 'buy' ? 'Buy Long' : 'Sell Short'}                        </>)}                </button>            </div>        </div>);
};
export default OrderForm;





