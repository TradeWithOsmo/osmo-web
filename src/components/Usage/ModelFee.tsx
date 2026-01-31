import React, { useState, useMemo } from 'react';
import styles from './Usage.module.css';
import panelStyles from '../Positions/PositionsPanel.module.css';

// Import logos
import anthropicLogo from '../../assets/Model logos/Anthropic.svg';
import deepseekLogo from '../../assets/Model logos/DeepSeek.png';
import googleLogo from '../../assets/Model logos/GoogleGemini.svg';
import openaiLogo from '../../assets/Model logos/OpenAI.svg';
import qwenLogo from '../../assets/Model logos/Qwen.png';

const MODEL_FEES = [
    { logo: googleLogo, name: 'Gemini 1.5 Pro', input: '$3.50', output: '$10.50' },
    { logo: openaiLogo, name: 'GPT-4o', input: '$5.00', output: '$15.00' },
    { logo: anthropicLogo, name: 'Claude 3.5 Sonnet', input: '$3.00', output: '$15.00' },
    { logo: deepseekLogo, name: 'DeepSeek V3', input: '$0.14', output: '$0.28' },
    { logo: qwenLogo, name: 'Qwen 2.5', input: '$0.10', output: '$0.20' }, // Estimated pricing
    { logo: googleLogo, name: 'Gemini 1.0 Pro', input: '$1.50', output: '$4.50' },
    { logo: openaiLogo, name: 'GPT-3.5 Turbo', input: '$0.50', output: '$1.50' },
    { logo: anthropicLogo, name: 'Claude 3 Haiku', input: '$0.25', output: '$1.25' },
    { logo: deepseekLogo, name: 'DeepSeek Coder', input: '$0.10', output: '$0.20' },
    { logo: qwenLogo, name: 'Qwen 1.5', input: '$0.05', output: '$0.10' },
    { logo: googleLogo, name: 'Gemini Ultra', input: '$10.00', output: '$30.00' },
    { logo: openaiLogo, name: 'GPT-4 Turbo', input: '$10.00', output: '$30.00' },
    { logo: anthropicLogo, name: 'Claude 3 Opus', input: '$15.00', output: '$75.00' },
    { logo: deepseekLogo, name: 'DeepSeek Lite', input: '$0.05', output: '$0.10' },
    { logo: qwenLogo, name: 'Qwen Large', input: '$0.50', output: '$1.00' },
];

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

const ModelFee: React.FC = () => {
    const [sortBy, setSortBy] = useState<string>('default');
    const [filterBy, setFilterBy] = useState<string>('all');
    const [isSortOpen, setIsSortOpen] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [isRowsDropdownOpen, setIsRowsDropdownOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);

    const toggleRowsDropdown = () => setIsRowsDropdownOpen(!isRowsDropdownOpen);
    const toggleSort = () => { setIsSortOpen(!isSortOpen); setIsFilterOpen(false); };
    const toggleFilter = () => { setIsFilterOpen(!isFilterOpen); setIsSortOpen(false); };

    const filteredData = useMemo(() => {
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
    }, [sortBy, filterBy]);

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

                {/* Controls */}
                <div className={panelStyles.controlsContainer} style={{ padding: '16px', borderBottom: '1px solid #3A2530', marginBottom: 0 }}>
                    <div className={panelStyles.controlsLeft}>
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
                    </div>
                </div>

                <div className={panelStyles.tableWrapper}>
                    <table className={panelStyles.table}>
                        <thead className={panelStyles.th}>
                            <tr>
                                <th className={panelStyles.th} style={{ textAlign: 'left' }}>Model Name</th>
                                <th className={panelStyles.th} style={{ textAlign: 'left' }}>Input ($/1M tokens)</th>
                                <th className={panelStyles.th} style={{ textAlign: 'left' }}>Output ($/1M tokens)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayedData.length > 0 ? (
                                displayedData.map((item: any) => (
                                    <ModelFeeRow key={item.name} model={item} />
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={3} style={{ textAlign: 'center', padding: '48px', color: '#A77590' }}>
                                        No model fees found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    {/* Footer */}
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
                </div>
            </div>
        </div>
    );
};

export default ModelFee;
