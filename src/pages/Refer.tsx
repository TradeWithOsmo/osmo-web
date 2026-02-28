import React, { useState } from 'react';
import portfolioStyles from '../components/Portfolio/Portfolio.module.css';
import panelStyles from '../components/Positions/PositionsPanel.module.css';
import { useUIStore } from '../store/useUIStore';
import dotsPattern from '../assets/Dots pettern.png';

const Refer: React.FC = () => {
    const { openEnterCodeModal, openCreateCodeModal, openClaimRewardsModal } = useUIStore();
    const [activeTab, setActiveTab] = useState<'referrals' | 'legacy'>('referrals');
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [isRowsDropdownOpen, setIsRowsDropdownOpen] = useState(false);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
    };

    const dummyReferrals = [
        { address: '0x1A2B...3C4D', dateJoined: 'Oct 12, 2023', totalVolume: 125000, feesPaid: 250, yourRewards: 25 },
        { address: '0x5E6F...7G8H', dateJoined: 'Oct 15, 2023', totalVolume: 45000, feesPaid: 90, yourRewards: 9 },
        { address: '0x9I0J...1K2L', dateJoined: 'Nov 02, 2023', totalVolume: 800000, feesPaid: 1600, yourRewards: 160 },
        { address: '0x3M4N...5O6P', dateJoined: 'Dec 05, 2023', totalVolume: 12000, feesPaid: 24, yourRewards: 2.4 },
        { address: '0x7Q8R...9S0T', dateJoined: 'Jan 18, 2024', totalVolume: 350000, feesPaid: 700, yourRewards: 70 },
        { address: '0x8A1B...2C3D', dateJoined: 'Jan 22, 2024', totalVolume: 50000, feesPaid: 100, yourRewards: 10 },
        { address: '0x4E5F...6G7H', dateJoined: 'Feb 03, 2024', totalVolume: 320000, feesPaid: 640, yourRewards: 64 },
        { address: '0x8I9J...0K1L', dateJoined: 'Feb 15, 2024', totalVolume: 10500, feesPaid: 21, yourRewards: 2.1 },
        { address: '0x2M3N...4O5P', dateJoined: 'Feb 28, 2024', totalVolume: 960000, feesPaid: 1920, yourRewards: 192 },
        { address: '0x6Q7R...8S9T', dateJoined: 'Mar 10, 2024', totalVolume: 75000, feesPaid: 150, yourRewards: 15 },
        { address: '0x0A9B...8C7D', dateJoined: 'Mar 14, 2024', totalVolume: 22000, feesPaid: 44, yourRewards: 4.4 },
        { address: '0x6E5F...4G3H', dateJoined: 'Apr 01, 2024', totalVolume: 1500000, feesPaid: 3000, yourRewards: 300 },
        { address: '0x2I1J...0K9L', dateJoined: 'Apr 12, 2024', totalVolume: 8500, feesPaid: 17, yourRewards: 1.7 },
        { address: '0x8M7N...6O5P', dateJoined: 'May 05, 2024', totalVolume: 67000, feesPaid: 134, yourRewards: 13.4 },
        { address: '0x4Q3R...2S1T', dateJoined: 'May 20, 2024', totalVolume: 410000, feesPaid: 820, yourRewards: 82 },
        { address: '0x1H2I...3J4K', dateJoined: 'Jun 08, 2024', totalVolume: 180000, feesPaid: 360, yourRewards: 36 },
        { address: '0x5L6M...7N8O', dateJoined: 'Jun 19, 2024', totalVolume: 290000, feesPaid: 580, yourRewards: 58 },
        { address: '0x9P0Q...1R2S', dateJoined: 'Jul 04, 2024', totalVolume: 53000, feesPaid: 106, yourRewards: 10.6 },
        { address: '0x3T4U...5V6W', dateJoined: 'Jul 21, 2024', totalVolume: 15000, feesPaid: 30, yourRewards: 3 },
        { address: '0x7X8Y...9Z0A', dateJoined: 'Aug 11, 2024', totalVolume: 820000, feesPaid: 1640, yourRewards: 164 }
    ];

    const totalRewards = dummyReferrals.reduce((sum, item) => sum + item.yourRewards, 0);

    const hasReferrals = activeTab === 'referrals' && dummyReferrals.length > 0;

    const totalPages = Math.max(1, Math.ceil(dummyReferrals.length / rowsPerPage));
    const paginatedReferrals = dummyReferrals.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

    const toggleRowsDropdown = () => setIsRowsDropdownOpen(!isRowsDropdownOpen);

    const goToPage = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    return (
        <div style={{ height: '100%', overflow: 'hidden', display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: '100%', maxWidth: '1300px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '32px', height: '100%', boxSizing: 'border-box' }}>

                {/* Header Section */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                        <h1 style={{ fontSize: '32px', fontWeight: 500, margin: '0 0 8px 0', color: '#FFE1F2' }}>Referrals</h1>
                        <p style={{ margin: 0, color: '#FFE1F2', fontSize: '15px' }}>
                            Refer users to earn rewards. <span style={{ color: '#FFE1F2', cursor: 'pointer', textDecoration: 'underline' }}>Learn more</span>
                        </p>
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                            onClick={openEnterCodeModal}
                            style={{
                                backgroundColor: 'transparent',
                                border: '1px solid #3A2530',
                                color: '#FFE1F2',
                                padding: '10px 16px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: 500
                            }}
                        >
                            Enter Code
                        </button>
                        <button
                            onClick={openCreateCodeModal}
                            style={{
                                backgroundColor: 'transparent',
                                border: '1px solid #3A2530',
                                color: '#FFE1F2',
                                padding: '10px 16px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: 500
                            }}
                        >
                            Create Code
                        </button>
                        <button
                            onClick={openClaimRewardsModal}
                            style={{
                                backgroundColor: '#660035',
                                border: '1px solid #36001E',
                                color: '#FFFFFF',
                                padding: '10px 20px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: 600
                            }}
                        >
                            Claim Rewards
                        </button>
                    </div>
                </div>

                {/* Metrics Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
                    <div style={{ backgroundColor: '#11050D', border: '1px solid #3A2530', borderRadius: '12px', padding: '24px' }}>
                        <div style={{ color: '#A77590', fontSize: '14px', marginBottom: '8px' }}>Traders Referred</div>
                        <div style={{ color: '#FFE1F2', fontSize: '28px', fontWeight: 500 }}>{dummyReferrals.length}</div>
                    </div>
                    <div style={{
                        backgroundColor: '#11050D',
                        border: '1px solid #3A2530',
                        borderRadius: '12px',
                        padding: '24px',
                        backgroundImage: `linear-gradient(rgba(17, 5, 13, 0.7), rgba(17, 5, 13, 0.7)), url("${dotsPattern}")`,
                        backgroundSize: '80px',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'repeat'
                    }}>
                        <div style={{ color: '#A77590', fontSize: '14px', marginBottom: '8px', position: 'relative', zIndex: 1 }}>Rewards Earned</div>
                        <div style={{ color: '#FFE1F2', fontSize: '28px', fontWeight: 500, position: 'relative', zIndex: 1 }}>{formatCurrency(totalRewards)}</div>
                    </div>
                    <div style={{
                        backgroundColor: '#11050D',
                        border: '1px solid #3A2530',
                        borderRadius: '12px',
                        padding: '24px',
                        backgroundImage: `linear-gradient(rgba(17, 5, 13, 0.7), rgba(17, 5, 13, 0.7)), url("${dotsPattern}")`,
                        backgroundSize: '80px',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'repeat'
                    }}>
                        <div style={{ color: '#A77590', fontSize: '14px', marginBottom: '8px', position: 'relative', zIndex: 1 }}>Claimable Rewards</div>
                        <div style={{ color: '#FFE1F2', fontSize: '28px', fontWeight: 500, position: 'relative', zIndex: 1 }}>{formatCurrency(120.00)}</div>
                    </div>
                </div>

                {/* Table Section */}
                <div className={panelStyles.tableContainer} style={{ height: 'auto', display: 'flex', flexDirection: 'column', border: '1px solid #3A2530', borderRadius: '12px', overflow: 'hidden', flex: 1, minHeight: 0 }}>

                    {/* Tabs */}
                    <div className={portfolioStyles.tabsContainer}>
                        <button
                            className={`${portfolioStyles.tabButton} ${activeTab === 'referrals' ? portfolioStyles.activeTab : ''}`}
                            onClick={() => setActiveTab('referrals')}
                        >
                            Referrals
                        </button>
                        <button
                            className={`${portfolioStyles.tabButton} ${activeTab === 'legacy' ? portfolioStyles.activeTab : ''}`}
                            onClick={() => setActiveTab('legacy')}
                        >
                            Legacy Reward History
                        </button>
                    </div>

                    <div className={panelStyles.tableWrapper}>
                        <table className={panelStyles.table}>
                            <thead>
                                <tr>
                                    <th className={`${panelStyles.th} ${panelStyles.thFirst}`}>Address</th>
                                    <th className={`${panelStyles.th}`}>Date Joined</th>
                                    <th className={`${panelStyles.th} ${panelStyles.thRight}`}>Total Volume</th>
                                    <th className={`${panelStyles.th} ${panelStyles.thRight}`}>Fees Paid</th>
                                    <th className={`${panelStyles.th} ${panelStyles.thRight}`}>Your Rewards</th>
                                </tr>
                            </thead>
                            <tbody style={{ borderTop: 'none' }}>
                                {hasReferrals ? (
                                    paginatedReferrals.map((referral, index) => (
                                        <tr key={index} className={panelStyles.row}>
                                            <td className={`${panelStyles.td} ${panelStyles.tdFirst}`}>{referral.address}</td>
                                            <td className={`${panelStyles.td}`}>{referral.dateJoined}</td>
                                            <td className={`${panelStyles.td} ${panelStyles.tdRight}`}>{formatCurrency(referral.totalVolume)}</td>
                                            <td className={`${panelStyles.td} ${panelStyles.tdRight}`}>{formatCurrency(referral.feesPaid)}</td>
                                            <td className={`${panelStyles.td} ${panelStyles.tdRight}`} style={{ color: '#00E396' }}>{formatCurrency(referral.yourRewards)}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} style={{ padding: '64px 0' }}>
                                            <div style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '8px',
                                                color: '#A77590'
                                            }}>
                                                <div style={{ fontSize: '14px', fontWeight: 500, color: '#FFE1F2' }}>No referrals yet</div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Table Footer */}
                    {hasReferrals && (
                        <div className={panelStyles.tableFooter}>
                            <div className={panelStyles.footerGrid}>
                                <div className={panelStyles.footerMessage}>
                                    Showing {((currentPage - 1) * rowsPerPage) + 1} - {Math.min(currentPage * rowsPerPage, dummyReferrals.length)} out of {dummyReferrals.length}
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

export default Refer;
