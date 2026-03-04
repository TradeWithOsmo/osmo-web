import React, { useState } from 'react';
import styles from '../components/Portfolio/Portfolio.module.css';
import Sidebar from '../components/Portfolio/Sidebar';
import Overview from '../components/Portfolio/Overview';
import PortfolioPositions from '../components/Portfolio/PortfolioPositions';
import PortfolioOrders from '../components/Portfolio/PortfolioOrders';
import PortfolioHistory from '../components/Portfolio/PortfolioHistory';
import PortfolioFees from '../components/Portfolio/PortfolioFees';

const Portfolio: React.FC = () => {
    // State to toggle between 'Overview', 'Positions', 'Orders', 'History', 'Fees', 'Leaderboard'
    const [activeTab, setActiveTab] = useState('Overview');
    const [isMinimized, setIsMinimized] = useState(true);

    React.useEffect(() => {
        const query = new URLSearchParams(window.location.search);
        const tab = query.get('tab');
        if (tab) {
            setActiveTab(tab);
        }
    }, [window.location.search]);

    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
        setIsMinimized(true);
        // Optional: Update URL without reloading when internal tab change happens
        const url = new URL(window.location.href);
        url.searchParams.set('tab', tab);
        window.history.pushState({}, '', url);
    };

    return (
        <div className={styles.layoutContainer}>
            {/* Sidebar */}
            <Sidebar
                activeTab={activeTab}
                onTabChange={handleTabChange}
                isMinimized={isMinimized}
                onToggleMinimize={() => setIsMinimized(!isMinimized)}
            />

            {/* Main Content Area */}
            <div className={`${styles.contentArea} ${styles.contentCentered}`}>
                {activeTab === 'Overview' && <Overview />}
                {activeTab === 'Positions' && <PortfolioPositions />}
                {activeTab === 'Orders' && <PortfolioOrders />}
                {activeTab === 'History' && <PortfolioHistory />}
                {activeTab === 'Fees' && <PortfolioFees />}
            </div>
        </div>
    );
};

export default Portfolio;
