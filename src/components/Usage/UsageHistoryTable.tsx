import React, { useState } from 'react';
import panelStyles from '../Positions/PositionsPanel.module.css';

// Import logos
import anthropicLogo from '../../assets/Model logos/Anthropic.svg';
import deepseekLogo from '../../assets/Model logos/DeepSeek.png';
import openaiLogo from '../../assets/Model logos/OpenAI.svg';
import googleLogo from '../../assets/Model logos/GoogleGemini.svg';

const USAGE_HISTORY_DATA = [
    { id: 1, timestamp: '2024-05-20 14:30', logo: openaiLogo, model: 'GPT-4o', tokens: '1,250', cost: '$0.0075', speed: '45 ms/t', finish: 'Complete' },
    { id: 2, timestamp: '2024-05-20 14:28', logo: anthropicLogo, model: 'Claude 3.5 Sonnet', tokens: '890', cost: '$0.0027', speed: '38 ms/t', finish: 'Complete' },
    { id: 3, timestamp: '2024-05-20 14:15', logo: deepseekLogo, model: 'DeepSeek V3', tokens: '3,400', cost: '$0.0005', speed: '12 ms/t', finish: 'Complete' },
    { id: 4, timestamp: '2024-05-20 13:50', logo: googleLogo, model: 'Gemini 1.5 Pro', tokens: '5,600', cost: '$0.0196', speed: '55 ms/t', finish: 'Complete' },
    { id: 5, timestamp: '2024-05-20 13:45', logo: openaiLogo, model: 'GPT-4 Turbo', tokens: '150', cost: '$0.0015', speed: '48 ms/t', finish: 'Error' },
    { id: 6, timestamp: '2024-05-20 12:30', logo: anthropicLogo, model: 'Claude 3 Opus', tokens: '4,200', cost: '$0.0630', speed: '85 ms/t', finish: 'Complete' },
];

const UsageHistoryRow: React.FC<{ item: any }> = ({ item }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <React.Fragment>
            {/* Desktop Row */}
            <tr className={`${panelStyles.row} ${panelStyles.desktopRow}`}>
                <td className={panelStyles.td} style={{ color: '#A77590' }}>{item.timestamp}</td>
                <td className={panelStyles.td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <img src={item.logo} alt={item.model} style={{ width: '18px', height: '18px', borderRadius: '4px' }} />
                        <span>{item.model}</span>
                    </div>
                </td>
                <td className={panelStyles.td} style={{ textAlign: 'right' }}>{item.tokens}</td>
                <td className={panelStyles.td} style={{ textAlign: 'right' }}>{item.cost}</td>
                <td className={panelStyles.td} style={{ textAlign: 'right', color: '#A77590' }}>{item.speed}</td>
                <td className={panelStyles.td} style={{ textAlign: 'right' }}>
                    <span style={{
                        color: item.finish === 'Complete' ? '#00E396' : '#FF4560',
                        backgroundColor: item.finish === 'Complete' ? 'rgba(0, 227, 150, 0.1)' : 'rgba(255, 69, 96, 0.1)',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px'
                    }}>
                        {item.finish}
                    </span>
                </td>
            </tr>

            {/* Mobile Row */}
            <tr className={`${panelStyles.row} ${panelStyles.mobileRow}`}>
                <td className={panelStyles.td} colSpan={100}>
                    <div className={panelStyles.mobileCard}>
                        <div className={panelStyles.mobileHeader} onClick={() => setIsExpanded(!isExpanded)}>
                            <div className={panelStyles.mobileHeaderContent} style={{ gridTemplateColumns: '1fr 1fr' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <img src={item.logo} alt={item.model} style={{ width: '16px', height: '16px' }} />
                                        <span style={{ color: '#FFE1F2', fontSize: '14px', fontWeight: 600 }}>{item.model}</span>
                                    </div>
                                    <span style={{ color: '#A77590', fontSize: '11px' }}>{item.timestamp}</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                                    <span style={{ color: '#FFE1F2' }}>{item.cost}</span>
                                    <span style={{
                                        color: item.finish === 'Complete' ? '#00E396' : '#FF4560',
                                        fontSize: '10px'
                                    }}>
                                        {item.finish}
                                    </span>
                                </div>
                            </div>
                        </div>
                        {isExpanded && (
                            <div className={panelStyles.mobileDetails}>
                                <div className={panelStyles.mobileDetailRow}>
                                    <span className={panelStyles.mobileLabel}>Tokens</span>
                                    <span className={panelStyles.mobileValue}>{item.tokens}</span>
                                </div>
                                <div className={panelStyles.mobileDetailRow}>
                                    <span className={panelStyles.mobileLabel}>Speed</span>
                                    <span className={panelStyles.mobileValue}>{item.speed}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </td>
            </tr>
        </React.Fragment>
    );
};

const UsageHistoryTable: React.FC = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [isRowsDropdownOpen, setIsRowsDropdownOpen] = useState(false);

    const toggleRowsDropdown = () => setIsRowsDropdownOpen(!isRowsDropdownOpen);

    const totalItems = USAGE_HISTORY_DATA.length;
    const totalPages = Math.ceil(totalItems / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const displayedData = USAGE_HISTORY_DATA.slice(startIndex, endIndex);

    const goToPage = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    return (
        <div style={{ marginTop: '0px' }}>
            <div className={panelStyles.tableContainer} style={{ background: '#12000A', border: '1px solid #3A2530', borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: 'auto', maxHeight: 'calc(100vh - 220px)', minHeight: '500px' }}>
                <div style={{ padding: '16px 24px', borderBottom: '1px solid #3A2530', fontSize: '16px', fontWeight: 500, color: '#FFE1F2' }}>
                    Usage
                </div>
                <div className={panelStyles.tableWrapper}>
                    <table className={panelStyles.table}>
                        <thead className={panelStyles.th}>
                            <tr>
                                <th className={panelStyles.th} style={{ textAlign: 'left' }}>Timestamp</th>
                                <th className={panelStyles.th} style={{ textAlign: 'left' }}>Model</th>
                                <th className={panelStyles.th} style={{ textAlign: 'right' }}>Tokens</th>
                                <th className={panelStyles.th} style={{ textAlign: 'right' }}>Cost</th>
                                <th className={panelStyles.th} style={{ textAlign: 'right' }}>Speed</th>
                                <th className={panelStyles.th} style={{ textAlign: 'right' }}>Finish</th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayedData.length > 0 ? (
                                displayedData.map(item => (
                                    <UsageHistoryRow key={item.id} item={item} />
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: '48px', color: '#A77590' }}>
                                        No usage history found
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

export default UsageHistoryTable;
