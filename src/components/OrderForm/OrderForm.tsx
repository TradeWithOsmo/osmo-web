import React, { useState } from 'react';
import styles from './OrderForm.module.css';


const OrderForm: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'Limit' | 'Market' | 'Stop Limit'>('Limit');
    const [side, setSide] = useState<'buy' | 'sell'>('buy');

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

    const [receiptOpen, setReceiptOpen] = useState(false);

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
                            className={`${styles.tab} ${activeTab === 'Limit' ? styles.active : ''}`}
                            onClick={() => setActiveTab('Limit')}
                        >
                            Limit
                        </button>
                        <button
                            className={`${styles.tab} ${activeTab === 'Market' ? styles.active : ''}`}
                            onClick={() => setActiveTab('Market')}
                        >
                            Market
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
                                <span>0.00</span>
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
                                    <span>0.00</span>
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
                                <div className={styles.pill}>Fill</div>
                                <div className={styles.pill}>Mid</div>
                                <div className={styles.pill}>Bid</div>
                                <div className={styles.pill}>1% ↓</div>
                                <div className={styles.pill}>5% ↓</div>
                            </div>
                        </>
                    )}

                    {/* Amount Input (Unified for all types) */}
                    <div className={styles.marketInputContainer}>
                        <div className={styles.marketInputColumn}>
                            <div className={styles.inputLabelRow} style={{ justifyContent: 'flex-start', gap: '8px', alignItems: 'center' }}>
                                <span style={{ textDecoration: 'underline', textDecorationStyle: 'dotted', cursor: 'help' }}>Amount</span>
                                <span className={styles.badges} style={{ fontSize: '11px', padding: '2px 6px' }}>
                                    {isAmountUSD ? 'USD' : 'ETH'}
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
                            onClick={() => setIsAmountUSD(!isAmountUSD)}
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
                            <div className={styles.sliderFill} style={{ width: `${(leverage / 50) * 100}%` }}></div>
                            {/* Thumb */}
                            <div className={styles.sliderThumb} style={{ left: `${(leverage / 50) * 100}%` }}></div>
                            {/* Input Range */}
                            <input
                                type="range"
                                min="1"
                                max="50"
                                step="1"
                                value={leverage}
                                onChange={(e) => setLeverage(Number(e.target.value))}
                                style={{
                                    position: 'absolute', width: '100%', height: '100%',
                                    opacity: 0, cursor: 'pointer', zIndex: 10
                                }}
                            />
                        </div>
                        <span style={{ fontSize: '12px', color: '#A77590' }}>50×</span>
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
                    <button className={styles.textBtnRed}>Clear</button>
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
                            <span className={styles.summaryValue}>$897.1</span>
                        </div>
                        <div className={styles.summaryRow}>
                            <span className={styles.summaryLabelDotted}>Liquidation Price</span>
                            <span className={styles.summaryValue}>—</span>
                        </div>
                        <div className={styles.summaryRow}>
                            <span className={styles.summaryLabelDotted}>Position Margin</span>
                            <span className={styles.summaryValue}>
                                <span style={{ color: '#A77590' }}>— ➝ </span> $0.00
                            </span>
                        </div>
                        <div className={styles.summaryRow}>
                            <span className={styles.summaryLabelDotted}>Fee</span>
                            <span className={styles.summaryValue}>$0.00</span>
                        </div>
                        <div className={styles.summaryRow}>
                            <span className={styles.summaryLabelDotted} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                Rewards <span style={{ fontSize: '10px', background: '#3A2530', padding: '0 4px', borderRadius: '4px' }}>x</span>
                                <span style={{ fontSize: '10px', color: '#5D5FEF', background: 'rgba(93, 95, 239, 0.1)', padding: '0 4px', borderRadius: '4px' }}>New</span>
                            </span>
                            <span className={styles.summaryValue}>0.0000</span>
                        </div>
                    </div>
                )}

                <button className={styles.mainActionBtn}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                        <line x1="12" y1="9" x2="12" y2="13"></line>
                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                    Enter amount
                </button>
            </div>

        </div>
    );
};

export default OrderForm;
