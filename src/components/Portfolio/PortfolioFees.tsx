import React, { useState } from 'react';
import styles from './Portfolio.module.css';
import panelStyles from '../Positions/PositionsPanel.module.css';

// Import logos
import anthropicLogo from '../../assets/Model logos/Anthropic.svg';
import deepseekLogo from '../../assets/Model logos/DeepSeek.png';
import googleLogo from '../../assets/Model logos/GoogleGemini.svg';
import openaiLogo from '../../assets/Model logos/OpenAI.svg';
import qwenLogo from '../../assets/Model logos/Qwen.png';

const FEE_TIERS = [
    { tier: 1, you: true, volume: '≥ $0', cond: '—', maker: '0.010%', taker: '0.050%' },
    { tier: 2, volume: '≥ $1M', cond: '—', maker: '0.010%', taker: '0.045%' },
    { tier: 3, volume: '≥ $5M', cond: '—', maker: '0.005%', taker: '0.040%' },
    { tier: 4, volume: '≥ $25M', cond: '—', maker: '0.000%', taker: '0.035%' },
    { tier: 5, volume: '≥ $50M', cond: '—', maker: '0.000%', taker: '0.030%' },
    { tier: 6, volume: '≥ $100M', cond: '—', maker: '-0.007%', taker: '0.025%' },
    { tier: 7, volume: '≥ $200M', cond: '—', maker: '-0.011%', taker: '0.025%' },
];

const MODEL_FEES = [
    { logo: googleLogo, name: 'Gemini 1.5 Pro', input: '$3.50', output: '$10.50' },
    { logo: openaiLogo, name: 'GPT-4o', input: '$5.00', output: '$15.00' },
    { logo: anthropicLogo, name: 'Claude 3.5 Sonnet', input: '$3.00', output: '$15.00' },
    { logo: deepseekLogo, name: 'DeepSeek V3', input: '$0.14', output: '$0.28' },
    { logo: qwenLogo, name: 'Qwen 2.5', input: '$0.10', output: '$0.20' }, // Estimated pricing
];

const FeeTierRow: React.FC<{ tier: any }> = ({ tier }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <React.Fragment>
            {/* Desktop Row */}
            <tr className={`${panelStyles.row} ${panelStyles.desktopRow}`}>
                <td className={panelStyles.td} style={{ textAlign: 'left' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{tier.tier}</span>
                        {tier.you && (
                            <span style={{
                                backgroundColor: '#3A2530',
                                color: '#A77590',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                textTransform: 'uppercase'
                            }}>You</span>
                        )}
                    </div>
                </td>
                <td className={panelStyles.td} style={{ textAlign: 'right' }}>{tier.volume}</td>
                <td className={panelStyles.td} style={{ textAlign: 'right' }}>
                    <span style={{ color: tier.maker.startsWith('-') ? '#00E396' : '#FFE1F2' }}>
                        {tier.maker}
                    </span>
                </td>
                <td className={panelStyles.td} style={{ textAlign: 'right' }}>{tier.taker}</td>
            </tr>

            {/* Mobile Row */}
            <tr className={`${panelStyles.row} ${panelStyles.mobileRow}`}>
                <td className={panelStyles.td} colSpan={100}>
                    <div className={panelStyles.mobileCard}>
                        <div className={panelStyles.mobileHeader} onClick={() => setIsExpanded(!isExpanded)}>
                            <div className={panelStyles.mobileHeaderContent}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    <span style={{ fontSize: '12px', color: '#A77590' }}>Tier</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '14px', fontWeight: 700, color: '#FFE1F2' }}>{tier.tier}</span>
                                        {tier.you && (
                                            <span style={{
                                                backgroundColor: '#3A2530',
                                                color: '#A77590',
                                                padding: '2px 6px',
                                                borderRadius: '4px',
                                                fontSize: '10px',
                                                textTransform: 'uppercase'
                                            }}>You</span>
                                        )}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    <span style={{ fontSize: '12px', color: '#A77590' }}>Maker</span>
                                    <span style={{ fontSize: '13px', color: tier.maker.startsWith('-') ? '#00E396' : '#FFE1F2' }}>{tier.maker}</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    <span style={{ fontSize: '12px', color: '#A77590' }}>Taker</span>
                                    <span style={{ fontSize: '13px', color: '#FFE1F2' }}>{tier.taker}</span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', color: '#A77590' }}>
                                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                        </div>

                        {isExpanded && (
                            <div className={panelStyles.mobileDetails}>
                                <div className={panelStyles.mobileDetailRow} style={{ borderBottom: 'none' }}>
                                    <span className={panelStyles.mobileLabel}>Volume (30d)</span>
                                    <span className={panelStyles.mobileValue}>{tier.volume}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </td>
            </tr>
        </React.Fragment>
    );
};

const ModelFeeRow: React.FC<{ model: any }> = ({ model }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <React.Fragment>
            {/* Desktop Row */}
            <tr className={`${panelStyles.row} ${panelStyles.desktopRow}`}>
                <td className={panelStyles.td} style={{ textAlign: 'left' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            overflow: 'hidden',
                            backgroundColor: '#3A2530',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <img src={model.logo} alt={model.name} style={{ width: '20px', height: '20px', objectFit: 'contain' }} />
                        </div>
                        <span>{model.name}</span>
                    </div>
                </td>
                <td className={panelStyles.td} style={{ textAlign: 'left' }}>{model.input}</td>
                <td className={panelStyles.td} style={{ textAlign: 'left' }}>{model.output}</td>
            </tr>

            {/* Mobile Row */}
            <tr className={`${panelStyles.row} ${panelStyles.mobileRow}`}>
                <td className={panelStyles.td} colSpan={100}>
                    <div className={panelStyles.mobileCard}>
                        <div className={panelStyles.mobileHeader} onClick={() => setIsExpanded(!isExpanded)}>
                            <div className={panelStyles.mobileHeaderContent} style={{ gridTemplateColumns: '1fr' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <img src={model.logo} alt={model.name} style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
                                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#FFE1F2' }}>{model.name}</span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', color: '#A77590' }}>
                                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                        </div>

                        {isExpanded && (
                            <div className={panelStyles.mobileDetails}>
                                <div className={panelStyles.mobileDetailRow}>
                                    <span className={panelStyles.mobileLabel}>Input ($/1M tokens)</span>
                                    <span className={panelStyles.mobileValue}>{model.input}</span>
                                </div>
                                <div className={panelStyles.mobileDetailRow} style={{ borderBottom: 'none' }}>
                                    <span className={panelStyles.mobileLabel}>Output ($/1M tokens)</span>
                                    <span className={panelStyles.mobileValue}>{model.output}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </td>
            </tr>
        </React.Fragment>
    );
};

const PortfolioFees: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'FeeTiers' | 'ModelAIFee'>('FeeTiers');
    const [sortBy, setSortBy] = useState<string>('default');
    const [filterBy, setFilterBy] = useState<string>('all');
    const [isSortOpen, setIsSortOpen] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    // Reset on tab change
    React.useEffect(() => {
        setSortBy('default');
        setFilterBy('all');
        setIsSortOpen(false);
        setIsFilterOpen(false);
    }, [activeTab]);

    const filteredData = React.useMemo(() => {
        if (activeTab === 'FeeTiers') {
            let result = [...FEE_TIERS];
            // Sort
            if (sortBy === 'maker') {
                result.sort((a, b) => parseFloat(a.maker) - parseFloat(b.maker));
            } else if (sortBy === 'taker') {
                result.sort((a, b) => parseFloat(a.taker) - parseFloat(b.taker));
            }
            // Filter - Tiers usually don't need significant filtering
            return result;
        } else {
            let result = [...MODEL_FEES];

            // Filter
            if (filterBy !== 'all') {
                if (filterBy === 'google') result = result.filter(m => m.name.toLowerCase().includes('gemini'));
                if (filterBy === 'openai') result = result.filter(m => m.name.toLowerCase().includes('gpt'));
                if (filterBy === 'anthropic') result = result.filter(m => m.name.toLowerCase().includes('claude'));
                if (filterBy === 'other') result = result.filter(m => !m.name.toLowerCase().includes('gpt') && !m.name.toLowerCase().includes('claude') && !m.name.toLowerCase().includes('gemini'));
            }

            // Sort
            if (sortBy === 'input') {
                result.sort((a, b) => parseFloat(a.input.replace('$', '')) - parseFloat(b.input.replace('$', '')));
            } else if (sortBy === 'output') {
                result.sort((a, b) => parseFloat(a.output.replace('$', '')) - parseFloat(b.output.replace('$', '')));
            } else if (sortBy === 'name') {
                result.sort((a, b) => a.name.localeCompare(b.name));
            }

            return result;
        }
    }, [activeTab, sortBy, filterBy]);

    const toggleSort = () => { setIsSortOpen(!isSortOpen); setIsFilterOpen(false); };
    const toggleFilter = () => { setIsFilterOpen(!isFilterOpen); setIsSortOpen(false); };

    return (
        <div style={{ paddingBottom: '32px' }}>
            {/* Tabs Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '16px' }}>
                <div
                    className={styles.sectionTitle}
                    style={{
                        marginBottom: 0,
                        color: activeTab === 'FeeTiers' ? '#FFE1F2' : '#A77590',
                        cursor: 'pointer',
                        fontWeight: activeTab === 'FeeTiers' ? 500 : 400
                    }}
                    onClick={() => setActiveTab('FeeTiers')}
                >
                    Fee Tiers
                </div>
                <div
                    className={styles.sectionTitle}
                    style={{
                        marginBottom: 0,
                        color: activeTab === 'ModelAIFee' ? '#FFE1F2' : '#A77590',
                        cursor: 'pointer',
                        fontWeight: activeTab === 'ModelAIFee' ? 500 : 400
                    }}
                    onClick={() => setActiveTab('ModelAIFee')}
                >
                    ModelAI Fee
                </div>
            </div>

            <div className={panelStyles.tableContainer} style={{ background: '#12000A', border: '1px solid #3A2530', borderRadius: '12px', overflow: 'hidden' }}>
                {/* Controls */}
                <div className={panelStyles.controlsContainer} style={{ padding: '16px', borderBottom: '1px solid #3A2530', marginBottom: 0 }}>
                    <div className={panelStyles.controlsLeft}>
                        {/* Sort Dropdown */}
                        <div className={panelStyles.dropdownContainer}>
                            <button
                                className={`${panelStyles.dropdownButton} ${isSortOpen ? panelStyles.active : ''}`}
                                onClick={toggleSort}
                            >
                                Sort by <span style={{ color: '#FFE1F2' }}>
                                    {activeTab === 'FeeTiers'
                                        ? (sortBy === 'default' ? 'Tier' : sortBy === 'maker' ? 'Maker Fee' : 'Taker Fee')
                                        : (sortBy === 'default' ? 'Default' : sortBy.charAt(0).toUpperCase() + sortBy.slice(1))
                                    }
                                </span>
                                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transition: 'transform 0.2s', marginLeft: '6px', transform: isSortOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                                    <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                            {isSortOpen && (
                                <div className={panelStyles.dropdownMenu}>
                                    {activeTab === 'FeeTiers' ? (
                                        <>
                                            <button className={`${panelStyles.dropdownItem}`} onClick={() => { setSortBy('default'); setIsSortOpen(false); }}>Tier</button>
                                            <button className={`${panelStyles.dropdownItem}`} onClick={() => { setSortBy('maker'); setIsSortOpen(false); }}>Maker Fee</button>
                                            <button className={`${panelStyles.dropdownItem}`} onClick={() => { setSortBy('taker'); setIsSortOpen(false); }}>Taker Fee</button>
                                        </>
                                    ) : (
                                        <>
                                            <button className={`${panelStyles.dropdownItem}`} onClick={() => { setSortBy('name'); setIsSortOpen(false); }}>Name</button>
                                            <button className={`${panelStyles.dropdownItem}`} onClick={() => { setSortBy('input'); setIsSortOpen(false); }}>Input Cost</button>
                                            <button className={`${panelStyles.dropdownItem}`} onClick={() => { setSortBy('output'); setIsSortOpen(false); }}>Output Cost</button>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Filter Dropdown - Only for ModelAI mainly */}
                        {activeTab === 'ModelAIFee' && (
                            <div className={panelStyles.dropdownContainer}>
                                <button
                                    className={`${panelStyles.dropdownButton} ${isFilterOpen ? panelStyles.active : ''}`}
                                    onClick={toggleFilter}
                                >
                                    Filter <span style={{ color: '#FFE1F2' }}>{filterBy === 'all' ? 'All' : filterBy.charAt(0).toUpperCase() + filterBy.slice(1)}</span>
                                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transition: 'transform 0.2s', marginLeft: '6px', transform: isFilterOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                                        <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </button>
                                {isFilterOpen && (
                                    <div className={panelStyles.dropdownMenu}>
                                        {['all', 'google', 'openai', 'anthropic', 'other'].map((filter) => (
                                            <button
                                                key={filter}
                                                className={`${panelStyles.dropdownItem} ${filterBy === filter ? panelStyles.selected : ''}`}
                                                onClick={() => { setFilterBy(filter); setIsFilterOpen(false); }}
                                            >
                                                {filter === 'google' ? 'Google' : filter === 'openai' ? 'OpenAI' : filter === 'anthropic' ? 'Anthropic' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Visual filler for right side alignment if needed */}
                    <div className={panelStyles.actionButtons}></div>

                </div>

                {activeTab === 'FeeTiers' ? (
                    <table className={panelStyles.table}>
                        <thead className={panelStyles.th}>
                            <tr>
                                <th className={panelStyles.th} style={{ textAlign: 'left' }}>Tier</th>
                                <th className={panelStyles.th} style={{ textAlign: 'right' }}>Volume (30d)</th>
                                <th className={panelStyles.th} style={{ textAlign: 'right' }}>Maker</th>
                                <th className={panelStyles.th} style={{ textAlign: 'right' }}>Taker</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.map((item: any) => (
                                item.tier ? <FeeTierRow key={item.tier} tier={item} /> : <ModelFeeRow key={item.name} model={item} />
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <table className={panelStyles.table}>
                        <thead className={panelStyles.th}>
                            <tr>
                                <th className={panelStyles.th} style={{ textAlign: 'left' }}>Model Name</th>
                                <th className={panelStyles.th} style={{ textAlign: 'left' }}>Input ($/1M tokens)</th>
                                <th className={panelStyles.th} style={{ textAlign: 'left' }}>Output ($/1M tokens)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.map((item: any) => (
                                item.tier ? <FeeTierRow key={item.tier} tier={item} /> : <ModelFeeRow key={item.name} model={item} />
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default PortfolioFees;
