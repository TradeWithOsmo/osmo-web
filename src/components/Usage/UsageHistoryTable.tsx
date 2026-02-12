import React, { useEffect, useState } from 'react';
import panelStyles from '../Positions/PositionsPanel.module.css';
import { useWallet } from '../../hooks/useWallet';
import { useUsageStore } from '../../store/useUsageStore';

const UsageHistoryRow: React.FC<{ item: any }> = ({ item }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <React.Fragment>
            {/* Desktop Row */}
            <tr className={`${panelStyles.row} ${panelStyles.desktopRow}`}>
                <td className={`${panelStyles.td} ${panelStyles.tdFirst}`} style={{ color: '#A77590' }}>{item.timestamp}</td>
                <td className={panelStyles.td}>
                    <span>{item.model}</span>
                </td>
                <td className={`${panelStyles.td} ${panelStyles.tdRight}`}>{item.tokens}</td>
                <td className={`${panelStyles.td} ${panelStyles.tdRight}`}>{item.cost}</td>
                <td className={`${panelStyles.td} ${panelStyles.tdRight}`} style={{ color: '#A77590' }}>{item.speed}</td>
                <td className={`${panelStyles.td} ${panelStyles.tdRight}`}>
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
                                    <div>
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

    const { walletAddress } = useWallet();
    const { history, fetchHistory } = useUsageStore();

    useEffect(() => {
        if (walletAddress) {
            fetchHistory(walletAddress);
        }
    }, [walletAddress, fetchHistory]);

    useEffect(() => {
        if (!walletAddress) return;
        const id = window.setInterval(() => {
            void fetchHistory(walletAddress);
        }, 10000);
        return () => window.clearInterval(id);
    }, [walletAddress, fetchHistory]);

    const toggleRowsDropdown = () => setIsRowsDropdownOpen(!isRowsDropdownOpen);

    const totalItems = history.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / rowsPerPage));
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const displayedData = history.slice(startIndex, endIndex);
    const showingFrom = totalItems === 0 ? 0 : startIndex + 1;
    const showingTo = totalItems === 0 ? 0 : Math.min(endIndex, totalItems);

    const goToPage = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    return (
        <div style={{ marginTop: '0px' }}>
            <div className={panelStyles.tableContainer} style={{ background: '#12000A', border: '1px solid #3A2530', borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: 'auto', flex: '0 0 auto' }}>
                <div style={{ padding: '16px 24px', borderBottom: '1px solid #3A2530', fontSize: '16px', fontWeight: 500, color: '#FFE1F2' }}>
                    Usage
                </div>
                <div className={panelStyles.tableWrapper}>
                    <table className={panelStyles.table}>
                        <thead className={panelStyles.th}>
                            <tr>
                                <th className={`${panelStyles.th} ${panelStyles.thFirst}`}>Timestamp</th>
                                <th className={panelStyles.th}>Model</th>
                                <th className={`${panelStyles.th} ${panelStyles.thRight}`}>Tokens</th>
                                <th className={`${panelStyles.th} ${panelStyles.thRight}`}>Cost</th>
                                <th className={`${panelStyles.th} ${panelStyles.thRight}`}>Speed</th>
                                <th className={`${panelStyles.th} ${panelStyles.thRight}`}>Finish</th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayedData.length > 0 ? (
                                displayedData.map(item => (
                                    <UsageHistoryRow key={item.id} item={item} />
                                ))
                            ) : (
                                <tr style={{ height: '300px' }}>
                                    <td colSpan={6} style={{ textAlign: 'center', pointerEvents: 'none' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', opacity: 0.5 }}>
                                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15M9 5C9 6.10457 9.89543 7 11 7H13C14.1046 7 15 6.10457 15 5M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5" stroke="#FFE1F2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                                <span style={{ color: '#FFE1F2', fontSize: '16px', fontWeight: 500 }}>No Usage History</span>
                                                <span style={{ color: '#A77590', fontSize: '13px' }}>Your AI agent interactions will appear here</span>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    {/* Footer */}
                    {totalItems > 0 && (
                    <div className={panelStyles.tableFooter}>
                        <div className={panelStyles.footerGrid}>
                            <div className={panelStyles.footerMessage}>
                                Showing {showingFrom} - {showingTo} out of {totalItems}
                            </div>

                            <div className={panelStyles.footerControls}>
                                {totalPages > 1 && (
                                    <>
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
                                    </>
                                )}
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

export default UsageHistoryTable;
