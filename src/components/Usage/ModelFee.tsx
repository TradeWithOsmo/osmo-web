import React, { useState, useMemo, useEffect } from 'react';
import styles from './Usage.module.css';
import panelStyles from '../Positions/PositionsPanel.module.css';
import { usageService } from '../../api/usageService';

// Import logos
import anthropicLogo from '../../assets/Model logos/Anthropic.svg';
import deepseekLogo from '../../assets/Model logos/DeepSeek.png';
import googleLogo from '../../assets/Model logos/GoogleGemini.svg';
import openaiLogo from '../../assets/Model logos/OpenAI.svg';
import qwenLogo from '../../assets/Model logos/Qwen.png';

const PROVIDER_LOGOS: Record<string, string> = {
    'openai': openaiLogo,
    'anthropic': anthropicLogo,
    'google': googleLogo,
    'deepseek': deepseekLogo,
    'qwen': qwenLogo,
};

const getLogoForModel = (modelName: string) => {
    const name = modelName.toLowerCase();
    if (name.includes('gpt')) return openaiLogo;
    if (name.includes('claude')) return anthropicLogo;
    if (name.includes('gemini')) return googleLogo;
    if (name.includes('deepseek')) return deepseekLogo;
    if (name.includes('qwen')) return qwenLogo;

    // Check by common provider names
    for (const [provider, logo] of Object.entries(PROVIDER_LOGOS)) {
        if (name.includes(provider)) return logo;
    }

    return openaiLogo; // Default
};

const getProviderForModel = (modelName: string) => {
    const name = modelName.toLowerCase();
    if (name.includes('gpt') || name.includes('openai')) return 'OpenAI';
    if (name.includes('claude') || name.includes('anthropic')) return 'Anthropic';
    if (name.includes('gemini') || name.includes('google')) return 'Google DeepMind';
    if (name.includes('deepseek')) return 'DeepSeek';
    if (name.includes('llama') || name.includes('meta')) return 'Meta (Llama)';
    if (name.includes('qwen')) return 'Alibaba Cloud';
    return 'Other';
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
                            <img src={getLogoForModel(model.name)} alt={model.name} style={{ width: '20px', height: '20px', objectFit: 'contain' }} />
                        </div>
                        <span style={{ color: '#FFE1F2' }}>{model.name}</span>
                    </div>
                </td>
                <td className={panelStyles.td} style={{ textAlign: 'left', color: '#FFE1F2' }}>
                    ${model.input_cost.toFixed(2)}
                </td>
                <td className={panelStyles.td} style={{ textAlign: 'left', color: '#FFE1F2' }}>
                    ${model.output_cost.toFixed(2)}
                </td>
            </tr>

            {/* Mobile Row */}
            <tr className={`${panelStyles.row} ${panelStyles.mobileRow}`}>
                <td className={panelStyles.td} colSpan={100}>
                    <div className={panelStyles.mobileCard}>
                        <div className={panelStyles.mobileHeader} onClick={() => setIsExpanded(!isExpanded)}>
                            <div className={panelStyles.mobileHeaderContent} style={{ gridTemplateColumns: '1fr' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <img src={getLogoForModel(model.name)} alt={model.name} style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
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
                                    <span className={panelStyles.mobileValue}>${model.input_cost.toFixed(2)}</span>
                                </div>
                                <div className={panelStyles.mobileDetailRow} style={{ borderBottom: 'none' }}>
                                    <span className={panelStyles.mobileLabel}>Output ($/1M tokens)</span>
                                    <span className={panelStyles.mobileValue}>${model.output_cost.toFixed(2)}</span>
                                </div>
                                {model.description && (
                                    <div style={{ padding: '8px 0', fontSize: '11px', color: '#A77590', fontStyle: 'italic' }}>
                                        {model.description.length > 100 ? model.description.substring(0, 100) + '...' : model.description}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </td>
            </tr>
        </React.Fragment>
    );
};

const LastUsedRow: React.FC<{ item: any }> = ({ item }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const logo = getLogoForModel(item.model);
    const provider = getProviderForModel(item.model);

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
                            justifyContent: 'center',
                            flexShrink: 0
                        }}>
                            <img src={logo} alt={item.model} style={{ width: '20px', height: '20px', objectFit: 'contain' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ color: '#FFE1F2', fontSize: '13px' }}>{item.model}</span>
                            <span style={{ color: '#A77590', fontSize: '11px' }}>{provider}</span>
                        </div>
                    </div>
                </td>
                <td className={panelStyles.td} style={{ textAlign: 'right', color: '#FFE1F2' }}>
                    {item.request_count}
                </td>
                <td className={panelStyles.td} style={{ textAlign: 'right', color: '#FFE1F2' }}>
                    {item.total_tokens.toLocaleString()}
                </td>
                <td className={panelStyles.td} style={{ textAlign: 'right', color: '#FFE1F2' }}>
                    ${item.total_cost.toFixed(4)}
                </td>
                <td className={panelStyles.td} style={{ textAlign: 'right', color: '#A77590' }}>
                    {item.last_used}
                </td>
            </tr>

            {/* Mobile Row */}
            <tr className={`${panelStyles.row} ${panelStyles.mobileRow}`}>
                <td className={panelStyles.td} colSpan={100}>
                    <div className={panelStyles.mobileCard}>
                        <div className={panelStyles.mobileHeader} onClick={() => setIsExpanded(!isExpanded)}>
                            <div className={panelStyles.mobileHeaderContent} style={{ gridTemplateColumns: '1fr' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <img src={logo} alt={item.model} style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontSize: '14px', fontWeight: 700, color: '#FFE1F2' }}>{item.model}</span>
                                        <span style={{ fontSize: '11px', color: '#A77590' }}>{provider}</span>
                                    </div>
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
                                    <span className={panelStyles.mobileLabel}>Requests</span>
                                    <span className={panelStyles.mobileValue}>{item.request_count}</span>
                                </div>
                                <div className={panelStyles.mobileDetailRow}>
                                    <span className={panelStyles.mobileLabel}>Tokens</span>
                                    <span className={panelStyles.mobileValue}>{item.total_tokens.toLocaleString()}</span>
                                </div>
                                <div className={panelStyles.mobileDetailRow}>
                                    <span className={panelStyles.mobileLabel}>Total Cost</span>
                                    <span className={panelStyles.mobileValue}>${item.total_cost.toFixed(4)}</span>
                                </div>
                                <div className={panelStyles.mobileDetailRow} style={{ borderBottom: 'none' }}>
                                    <span className={panelStyles.mobileLabel}>Last Used</span>
                                    <span className={panelStyles.mobileValue}>{item.last_used}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </td>
            </tr>
        </React.Fragment>
    );
};

import { useWallet } from '../../hooks/useWallet';

const ModelFee: React.FC = () => {
    const { walletAddress } = useWallet();
    const [activeTab, setActiveTab] = useState<'fee' | 'used'>('used');
    const [timeFilter, setTimeFilter] = useState<string>('all');
    const [isTimeOpen, setIsTimeOpen] = useState(false);
    const [models, setModels] = useState<any[]>([]);
    const [lastUsed, setLastUsed] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [sortBy, setSortBy] = useState<string>('default');
    const [filterBy, setFilterBy] = useState<string>('all');
    const [isSortOpen, setIsSortOpen] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [rowsPerPage, setRowsPerPage] = useState(20);
    const [isRowsDropdownOpen, setIsRowsDropdownOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchModels = async () => {
            try {
                setIsLoading(true);
                const data = await usageService.getModels();
                setModels(data);
            } catch (err) {
                console.error("Failed to fetch models", err);
            } finally {
                setIsLoading(false);
            }
        };
        if (activeTab === 'fee') fetchModels();
    }, [activeTab]);

    useEffect(() => {
        const fetchLastUsed = async () => {
            if (!walletAddress) return;
            try {
                setIsLoading(true);
                const data = await usageService.getLastUsedModels(walletAddress, timeFilter);
                setLastUsed(data);
            } catch (err) {
                console.error("Failed to fetch last used models", err);
            } finally {
                setIsLoading(false);
            }
        };
        if (activeTab === 'used') fetchLastUsed();
    }, [activeTab, timeFilter, walletAddress]);

    const toggleRowsDropdown = () => setIsRowsDropdownOpen(!isRowsDropdownOpen);
    const toggleSort = () => { setIsSortOpen(!isSortOpen); setIsFilterOpen(false); };
    const toggleFilter = () => { setIsFilterOpen(!isFilterOpen); setIsSortOpen(false); };
    const toggleTime = () => { setIsTimeOpen(!isTimeOpen); };

    const filteredData = useMemo(() => {
        if (activeTab === 'fee') {
            let result = [...models];

            // Search
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                result = result.filter(m =>
                    m.name.toLowerCase().includes(query) ||
                    m.id.toLowerCase().includes(query)
                );
            }

            // Filter
            if (filterBy !== 'all') {
                if (filterBy === 'google') result = result.filter(m => m.name.toLowerCase().includes('gemini') || m.id.toLowerCase().includes('google'));
                if (filterBy === 'openai') result = result.filter(m => m.name.toLowerCase().includes('gpt') || m.id.toLowerCase().includes('openai'));
                if (filterBy === 'anthropic') result = result.filter(m => m.name.toLowerCase().includes('claude') || m.id.toLowerCase().includes('anthropic'));
                if (filterBy === 'deepseek') result = result.filter(m => m.name.toLowerCase().includes('deepseek'));
                if (filterBy === 'meta') result = result.filter(m => m.name.toLowerCase().includes('llama') || m.id.toLowerCase().includes('meta'));
            }

            // Sort
            if (sortBy === 'input') {
                result.sort((a, b) => a.input_cost - b.input_cost);
            } else if (sortBy === 'output') {
                result.sort((a, b) => a.output_cost - b.output_cost);
            } else if (sortBy === 'name') {
                result.sort((a, b) => a.name.localeCompare(b.name));
            }

            return result;
        } else {
            let result = [...lastUsed];
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                result = result.filter(m => m.model.toLowerCase().includes(query));
            }
            return result;
        }
    }, [models, lastUsed, sortBy, filterBy, searchQuery, activeTab]);

    // Pagination
    const totalItems = filteredData.length;
    const totalPages = Math.ceil(totalItems / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const displayedData = filteredData.slice(startIndex, endIndex);

    const goToPage = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    return (
        <div style={{ paddingBottom: '32px' }}>
            <div className={styles.sectionTitle}>Model Fee</div>

            <div className={panelStyles.tableContainer} style={{ background: '#12000A', border: '1px solid #3A2530', borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: 'auto', maxHeight: 'calc(100vh - 220px)', minHeight: '500px' }}>

                {/* Tabs */}
                <div className={styles.tabsContainer}>
                    <button
                        className={`${styles.tabButton} ${activeTab === 'used' ? styles.activeTab : ''}`}
                        onClick={() => { setActiveTab('used'); setCurrentPage(1); setSearchQuery(''); }}
                    >
                        Last Used
                    </button>
                    <button
                        className={`${styles.tabButton} ${activeTab === 'fee' ? styles.activeTab : ''}`}
                        onClick={() => { setActiveTab('fee'); setCurrentPage(1); setSearchQuery(''); }}
                    >
                        Model Fee
                    </button>
                </div>

                {/* Controls */}
                <div className={panelStyles.controlsContainer} style={{ padding: '16px', borderBottom: '1px solid #3A2530', marginBottom: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                    {activeTab === 'used' ? (
                        <>
                            {/* Search Bar - First for Last Used */}
                            <div style={{ position: 'relative', width: '240px' }}>
                                <div style={{ position: 'absolute', top: '50%', left: '12px', transform: 'translateY(-50%)', color: '#A77590', display: 'flex', pointerEvents: 'none' }}>
                                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <circle cx="5.5" cy="5.5" r="4.5" stroke="currentColor" strokeWidth="1.5" />
                                        <path d="M13 13L9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search models..."
                                    value={searchQuery}
                                    onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                                    style={{
                                        background: '#11050D',
                                        border: '1px solid #3A2530',
                                        borderRadius: '8px',
                                        padding: '8px 12px 8px 36px',
                                        color: '#FFE1F2',
                                        fontSize: '13px',
                                        width: '100%',
                                        outline: 'none'
                                    }}
                                />
                            </div>

                            {/* Time Filter - Second (Right) for Last Used */}
                            <div className={panelStyles.dropdownContainer}>
                                <button
                                    className={`${panelStyles.dropdownButton} ${isTimeOpen ? panelStyles.active : ''}`}
                                    onClick={toggleTime}
                                    style={{ border: '1px solid #3A2530', padding: '6px 12px', borderRadius: '8px' }}
                                >
                                    {timeFilter.toUpperCase()}
                                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transition: 'transform 0.2s', marginLeft: '6px', transform: isTimeOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                                        <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </button>
                                {isTimeOpen && (
                                    <div className={panelStyles.dropdownMenu} style={{ minWidth: '80px' }}>
                                        {['24h', '7d', '30d', 'all'].map((tf) => (
                                            <button key={tf} className={`${panelStyles.dropdownItem} ${timeFilter === tf ? panelStyles.selected : ''}`} onClick={() => { setTimeFilter(tf); setIsTimeOpen(false); }}>{tf.toUpperCase()}</button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            <div className={panelStyles.controlsLeft} style={{ display: 'flex', gap: '12px' }}>
                                {/* Sort Dropdown */}
                                <div className={panelStyles.dropdownContainer}>
                                    <button
                                        className={`${panelStyles.dropdownButton} ${isSortOpen ? panelStyles.active : ''}`}
                                        onClick={toggleSort}
                                    >
                                        Sort by <span style={{ color: '#FFE1F2' }}>{sortBy === 'default' ? 'Default' : sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}</span>
                                        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transition: 'transform 0.2s', marginLeft: '6px', transform: isSortOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                                            <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </button>
                                    {isSortOpen && (
                                        <div className={panelStyles.dropdownMenu}>
                                            <button className={`${panelStyles.dropdownItem}`} onClick={() => { setSortBy('name'); setIsSortOpen(false); }}>Name</button>
                                            <button className={`${panelStyles.dropdownItem}`} onClick={() => { setSortBy('input'); setIsSortOpen(false); }}>Input Cost</button>
                                            <button className={`${panelStyles.dropdownItem}`} onClick={() => { setSortBy('output'); setIsSortOpen(false); }}>Output Cost</button>
                                        </div>
                                    )}
                                </div>

                                {/* Filter Dropdown */}
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
                                            {['all', 'openai', 'anthropic', 'google', 'deepseek', 'meta'].map((filter) => (
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
                            </div>

                            {/* Search Bar - Last for Model Fee */}
                            <div style={{ position: 'relative', width: '240px' }}>
                                <div style={{ position: 'absolute', top: '50%', left: '12px', transform: 'translateY(-50%)', color: '#A77590', display: 'flex', pointerEvents: 'none' }}>
                                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <circle cx="5.5" cy="5.5" r="4.5" stroke="currentColor" strokeWidth="1.5" />
                                        <path d="M13 13L9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search models..."
                                    value={searchQuery}
                                    onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                                    style={{
                                        background: '#11050D',
                                        border: '1px solid #3A2530',
                                        borderRadius: '8px',
                                        padding: '8px 12px 8px 36px',
                                        color: '#FFE1F2',
                                        fontSize: '13px',
                                        width: '100%',
                                        outline: 'none'
                                    }}
                                />
                            </div>
                        </>
                    )}
                </div>

                <div className={panelStyles.tableWrapper}>
                    {isLoading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px', color: '#A77590' }}>
                            {activeTab === 'fee' ? 'Fetching real-time pricing from OpenRouter...' : 'Loading usage history...'}
                        </div>
                    ) : (
                        <table className={panelStyles.table}>
                            <thead className={panelStyles.th}>
                                {activeTab === 'fee' ? (
                                    <tr>
                                        <th className={panelStyles.th} style={{ textAlign: 'left' }}>Model Name</th>
                                        <th className={panelStyles.th} style={{ textAlign: 'left' }}>Input ($/1M tokens)</th>
                                        <th className={panelStyles.th} style={{ textAlign: 'left' }}>Output ($/1M tokens)</th>
                                    </tr>
                                ) : (
                                    <tr>
                                        <th className={panelStyles.th} style={{ textAlign: 'left' }}>Model</th>
                                        <th className={panelStyles.th} style={{ textAlign: 'right' }}>Requests</th>
                                        <th className={panelStyles.th} style={{ textAlign: 'right' }}>Total Tokens</th>
                                        <th className={panelStyles.th} style={{ textAlign: 'right' }}>Total Cost</th>
                                        <th className={panelStyles.th} style={{ textAlign: 'right' }}>Last Used</th>
                                    </tr>
                                )}
                            </thead>
                            <tbody>
                                {displayedData.length > 0 ? (
                                    displayedData.map((item: any, idx: number) => (
                                        activeTab === 'fee' ?
                                            <ModelFeeRow key={item.id || idx} model={item} /> :
                                            <LastUsedRow key={item.model || idx} item={item} />
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={activeTab === 'fee' ? 3 : 5} style={{ textAlign: 'center', padding: '48px', color: '#A77590' }}>
                                            No data found matching current criteria
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}

                    {/* Footer */}
                    {!isLoading && totalItems > 0 && (
                        <div className={panelStyles.tableFooter}>
                            <div className={panelStyles.footerGrid}>
                                <div className={panelStyles.footerMessage}>
                                    Showing {startIndex + 1} - {Math.min(endIndex, totalItems)} out of {totalItems}
                                </div>

                                <div className={panelStyles.footerControls}>
                                    <button
                                        className={panelStyles.paginationButton}
                                        onClick={() => goToPage(currentPage - 1)}
                                        disabled={currentPage === 1}
                                    >
                                        &lt;
                                    </button>

                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        let startPage = Math.max(1, currentPage - 2);
                                        if (startPage + 4 > totalPages) {
                                            startPage = Math.max(1, totalPages - 4);
                                        }
                                        const p = startPage + i;
                                        if (p > totalPages) return null;
                                        if (p < 1) return null;

                                        return (
                                            <button
                                                key={p}
                                                className={`${panelStyles.paginationButton} ${currentPage === p ? panelStyles.active : ''}`}
                                                onClick={() => goToPage(p)}
                                            >
                                                {p}
                                            </button>
                                        );
                                    })}

                                    <button
                                        className={panelStyles.paginationButton}
                                        onClick={() => goToPage(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                    >
                                        &gt;
                                    </button>
                                </div>

                                <div className={panelStyles.footerActions}>
                                    <span>Show</span>
                                    <div className={panelStyles.dropdownContainer}>
                                        <button
                                            className={`${panelStyles.dropdownButton} ${isRowsDropdownOpen ? panelStyles.active : ''}`}
                                            onClick={toggleRowsDropdown}
                                            style={{ border: '1px solid #3A2530', padding: '4px 8px', borderRadius: '6px', height: '32px' }}
                                        >
                                            {rowsPerPage}
                                            <svg
                                                width="10"
                                                height="6"
                                                viewBox="0 0 10 6"
                                                fill="none"
                                                xmlns="http://www.w3.org/2000/svg"
                                                style={{
                                                    transition: 'transform 0.2s',
                                                    marginLeft: '6px',
                                                    transform: isRowsDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)'
                                                }}
                                            >
                                                <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </button>
                                        {isRowsDropdownOpen && (
                                            <div className={panelStyles.dropdownMenu} style={{ minWidth: '60px', bottom: '100%', top: 'auto', marginBottom: '4px' }}>
                                                {[10, 20, 50, 100].map((rows) => (
                                                    <button
                                                        key={rows}
                                                        className={`${panelStyles.dropdownItem} ${rowsPerPage === rows ? panelStyles.selected : ''}`}
                                                        onClick={() => { setRowsPerPage(rows); setCurrentPage(1); setIsRowsDropdownOpen(false); }}
                                                    >
                                                        {rows}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ModelFee;
