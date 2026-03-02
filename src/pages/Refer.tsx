import React, { useEffect, useState } from 'react';
import portfolioStyles from '../components/Portfolio/Portfolio.module.css';
import panelStyles from '../components/Positions/PositionsPanel.module.css';
import { useUIStore } from '../store/useUIStore';
import { useWallet } from '../hooks';
import dotsPattern from '../assets/Dots pettern.png';
import { referralService, type LegacyRow, type ReferralRow, type ReferralSummary } from '../api/referralService';

const Refer: React.FC = () => {
    const { openEnterCodeModal, openCreateCodeModal, openClaimRewardsModal, openShareLinkModal } = useUIStore();
    const { walletAddress } = useWallet();

    const [activeTab, setActiveTab] = useState<'referrals' | 'legacy'>('referrals');
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [isRowsDropdownOpen, setIsRowsDropdownOpen] = useState(false);
    const [summary, setSummary] = useState<ReferralSummary | null>(null);
    const [referrals, setReferrals] = useState<ReferralRow[]>([]);
    const [legacyRows, setLegacyRows] = useState<LegacyRow[]>([]);
    const [totalRows, setTotalRows] = useState(0);

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);

    useEffect(() => {
        let mounted = true;
        const loadSummary = async () => {
            try {
                const data = await referralService.getSummary(walletAddress);
                if (mounted) setSummary(data);
            } catch {
                if (mounted) setSummary(null);
            }
        };
        loadSummary();
        const t = window.setInterval(loadSummary, 12000);
        return () => {
            mounted = false;
            window.clearInterval(t);
        };
    }, [walletAddress]);

    useEffect(() => {
        let mounted = true;
        const loadRows = async () => {
            try {
                if (activeTab === 'referrals') {
                    const data = await referralService.getReferrals(walletAddress || '', currentPage, rowsPerPage);
                    if (!mounted) return;
                    setReferrals(data.rows || []);
                    setTotalRows(data.total || 0);
                } else {
                    const data = await referralService.getLegacy(walletAddress || '', currentPage, rowsPerPage);
                    if (!mounted) return;
                    setLegacyRows(data.rows || []);
                    setTotalRows(data.total || 0);
                }
            } catch {
                if (!mounted) return;
                setReferrals([]);
                setLegacyRows([]);
                setTotalRows(0);
            }
        };
        loadRows();
        return () => {
            mounted = false;
        };
    }, [walletAddress, activeTab, currentPage, rowsPerPage]);

    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab]);

    const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage));
    const hasRows = totalRows > 0;
    const toggleRowsDropdown = () => setIsRowsDropdownOpen(!isRowsDropdownOpen);

    const goToPage = (page: number) => {
        if (page >= 1 && page <= totalPages) setCurrentPage(page);
    };

    return (
        <div style={{ height: '100%', overflow: 'hidden', display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: '100%', maxWidth: '1300px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '32px', height: '100%', boxSizing: 'border-box' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                        <h1 style={{ fontSize: '32px', fontWeight: 500, margin: '0 0 8px 0', color: '#FFE1F2' }}>Referrals</h1>
                        <p style={{ margin: 0, color: '#FFE1F2', fontSize: '15px' }}>
                            Refer users to earn rewards. <span style={{ color: '#FFE1F2', cursor: 'pointer', textDecoration: 'underline' }}>Learn more</span>
                        </p>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <button onClick={openEnterCodeModal} style={{ backgroundColor: 'transparent', border: '1px solid #3A2530', color: '#FFE1F2', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}>
                            Enter Code
                        </button>
                        <button onClick={openCreateCodeModal} style={{ backgroundColor: 'transparent', border: '1px solid #3A2530', color: '#FFE1F2', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}>
                            Create Code
                        </button>
                        <button
                            onClick={openShareLinkModal}
                            style={{ backgroundColor: 'transparent', border: '1px solid #3A2530', color: '#FFE1F2', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="18" cy="5" r="3" stroke="currentColor" strokeWidth="2" />
                                <circle cx="6" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                                <circle cx="18" cy="19" r="3" stroke="currentColor" strokeWidth="2" />
                                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                            Share Link
                        </button>
                        <button onClick={openClaimRewardsModal} style={{ backgroundColor: '#660035', border: '1px solid #36001E', color: '#FFFFFF', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}>
                            Claim Rewards
                        </button>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
                    <div style={{ backgroundColor: '#11050D', border: '1px solid #3A2530', borderRadius: '12px', padding: '24px' }}>
                        <div style={{ color: '#A77590', fontSize: '14px', marginBottom: '8px' }}>Traders Referred</div>
                        <div style={{ color: '#FFE1F2', fontSize: '28px', fontWeight: 500 }}>{summary?.tradersReferred ?? 0}</div>
                    </div>
                    <div style={{ backgroundColor: '#11050D', border: '1px solid #3A2530', borderRadius: '12px', padding: '24px', backgroundImage: `linear-gradient(rgba(17, 5, 13, 0.7), rgba(17, 5, 13, 0.7)), url("${dotsPattern}")`, backgroundSize: '80px', backgroundPosition: 'center', backgroundRepeat: 'repeat' }}>
                        <div style={{ color: '#A77590', fontSize: '14px', marginBottom: '8px', position: 'relative', zIndex: 1 }}>Rewards Earned</div>
                        <div style={{ color: '#FFE1F2', fontSize: '28px', fontWeight: 500, position: 'relative', zIndex: 1 }}>{formatCurrency(summary?.rewardsEarned ?? 0)}</div>
                    </div>
                    <div style={{ backgroundColor: '#11050D', border: '1px solid #3A2530', borderRadius: '12px', padding: '24px', backgroundImage: `linear-gradient(rgba(17, 5, 13, 0.7), rgba(17, 5, 13, 0.7)), url("${dotsPattern}")`, backgroundSize: '80px', backgroundPosition: 'center', backgroundRepeat: 'repeat' }}>
                        <div style={{ color: '#A77590', fontSize: '14px', marginBottom: '8px', position: 'relative', zIndex: 1 }}>Claimable Rewards</div>
                        <div style={{ color: '#FFE1F2', fontSize: '28px', fontWeight: 500, position: 'relative', zIndex: 1 }}>{formatCurrency(summary?.claimableRewards ?? 0)}</div>
                    </div>
                </div>

                <div className={panelStyles.tableContainer} style={{ height: 'auto', display: 'flex', flexDirection: 'column', border: '1px solid #3A2530', borderRadius: '12px', overflow: 'hidden', flex: 1, minHeight: 0 }}>
                    <div className={portfolioStyles.tabsContainer}>
                        <button className={`${portfolioStyles.tabButton} ${activeTab === 'referrals' ? portfolioStyles.activeTab : ''}`} onClick={() => setActiveTab('referrals')}>
                            Referrals
                        </button>
                        <button className={`${portfolioStyles.tabButton} ${activeTab === 'legacy' ? portfolioStyles.activeTab : ''}`} onClick={() => setActiveTab('legacy')}>
                            Legacy Reward History
                        </button>
                    </div>

                    <div className={panelStyles.tableWrapper}>
                        <table className={panelStyles.table}>
                            <thead>
                                {activeTab === 'referrals' ? (
                                    <tr>
                                        <th className={`${panelStyles.th} ${panelStyles.thFirst}`}>Address</th>
                                        <th className={`${panelStyles.th}`}>Date Joined</th>
                                        <th className={`${panelStyles.th} ${panelStyles.thRight}`}>Total Volume</th>
                                        <th className={`${panelStyles.th} ${panelStyles.thRight}`}>Fees Paid</th>
                                        <th className={`${panelStyles.th} ${panelStyles.thRight}`}>Your Rewards</th>
                                    </tr>
                                ) : (
                                    <tr>
                                        <th className={`${panelStyles.th} ${panelStyles.thFirst}`}>Date</th>
                                        <th className={`${panelStyles.th}`}>Description</th>
                                        <th className={`${panelStyles.th}`}>Status</th>
                                        <th className={`${panelStyles.th} ${panelStyles.thRight}`}>Amount</th>
                                    </tr>
                                )}
                            </thead>
                            <tbody style={{ borderTop: 'none' }}>
                                {hasRows ? (
                                    activeTab === 'referrals' ? (
                                        referrals.map((referral, index) => (
                                            <tr key={index} className={panelStyles.row}>
                                                <td className={`${panelStyles.td} ${panelStyles.tdFirst}`}>{referral.address}</td>
                                                <td className={`${panelStyles.td}`}>{referral.dateJoined}</td>
                                                <td className={`${panelStyles.td} ${panelStyles.tdRight}`}>{formatCurrency(referral.totalVolume)}</td>
                                                <td className={`${panelStyles.td} ${panelStyles.tdRight}`}>{formatCurrency(referral.feesPaid)}</td>
                                                <td className={`${panelStyles.td} ${panelStyles.tdRight}`} style={{ color: '#00E396' }}>{formatCurrency(referral.yourRewards)}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        legacyRows.map((row) => (
                                            <tr key={row.id} className={panelStyles.row}>
                                                <td className={`${panelStyles.td} ${panelStyles.tdFirst}`}>{row.date}</td>
                                                <td className={`${panelStyles.td}`}>{row.description}</td>
                                                <td className={`${panelStyles.td}`}>{row.status}</td>
                                                <td className={`${panelStyles.td} ${panelStyles.tdRight}`} style={{ color: '#00E396' }}>{formatCurrency(row.amount)}</td>
                                            </tr>
                                        ))
                                    )
                                ) : (
                                    <tr>
                                        <td colSpan={activeTab === 'referrals' ? 5 : 4} style={{ padding: '64px 0' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#A77590' }}>
                                                <div style={{ fontSize: '14px', fontWeight: 500, color: '#FFE1F2' }}>
                                                    {activeTab === 'referrals' ? 'No referrals yet' : 'No legacy rewards yet'}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {hasRows && (
                        <div className={panelStyles.tableFooter}>
                            <div className={panelStyles.footerGrid}>
                                <div className={panelStyles.footerMessage}>
                                    Showing {((currentPage - 1) * rowsPerPage) + 1} - {Math.min(currentPage * rowsPerPage, totalRows)} out of {totalRows}
                                </div>

                                <div className={panelStyles.footerControls}>
                                    {totalPages > 1 && (
                                        <>
                                            <button className={panelStyles.paginationButton} onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>
                                                &lt;
                                            </button>
                                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                                let startPage = Math.max(1, currentPage - 2);
                                                if (startPage + 4 > totalPages) startPage = Math.max(1, totalPages - 4);
                                                const p = startPage + i;
                                                return (
                                                    <button key={p} className={`${panelStyles.paginationButton} ${currentPage === p ? panelStyles.active : ''}`} onClick={() => goToPage(p)}>
                                                        {p}
                                                    </button>
                                                );
                                            })}
                                            <button className={panelStyles.paginationButton} onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}>
                                                &gt;
                                            </button>
                                        </>
                                    )}
                                </div>

                                <div className={panelStyles.footerActions}>
                                    <span>Show</span>
                                    <div className={panelStyles.dropdownContainer}>
                                        <button className={`${panelStyles.dropdownButton} ${isRowsDropdownOpen ? panelStyles.active : ''}`} onClick={toggleRowsDropdown} style={{ border: '1px solid #3A2530', padding: '4px 8px', borderRadius: '6px', height: '32px' }}>
                                            {rowsPerPage}
                                            <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transition: 'transform 0.2s', marginLeft: '6px', transform: isRowsDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                                                <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </button>
                                        {isRowsDropdownOpen && (
                                            <div className={panelStyles.dropdownMenu} style={{ minWidth: '60px', bottom: '100%', top: 'auto', marginBottom: '4px' }}>
                                                {[10, 20, 50, 100].map((rows) => (
                                                    <button
                                                        key={rows}
                                                        className={`${panelStyles.dropdownItem} ${rowsPerPage === rows ? panelStyles.selected : ''}`}
                                                        onClick={() => {
                                                            setRowsPerPage(rows);
                                                            setCurrentPage(1);
                                                            setIsRowsDropdownOpen(false);
                                                        }}
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

export default Refer;
