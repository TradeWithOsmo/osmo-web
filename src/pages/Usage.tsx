import React, { useState, useEffect } from 'react';
import styles from '../components/Usage/Usage.module.css';
import Sidebar from '../components/Usage/Sidebar';
import Overview from '../components/Usage/Overview';
import UsageTab from '../components/Usage/UsageTab';
import ModelFee from '../components/Usage/ModelFee';

const Usage: React.FC = () => {
    const [activeTab, setActiveTab] = useState('Overview');
    const [isMinimized, setIsMinimized] = useState(true);

    useEffect(() => {
        const query = new URLSearchParams(window.location.search);
        const tab = query.get('tab');
        if (tab) {
            setActiveTab(tab);
        }
    }, [window.location.search]);

    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
        setIsMinimized(true);
        const url = new URL(window.location.href);
        url.searchParams.set('tab', tab);
        window.history.pushState({}, '', url);
    };

    return (
        <div className={styles.layoutContainer}>
            <Sidebar
                activeTab={activeTab}
                onTabChange={handleTabChange}
                isMinimized={isMinimized}
                onToggleMinimize={() => setIsMinimized(!isMinimized)}
            />
            <div className={`${styles.contentArea} ${styles.contentCentered}`}>
                {activeTab === 'Overview' && <Overview />}
                {activeTab === 'Usage' && <UsageTab />}
                {activeTab === 'Model Fee' && <ModelFee />}
            </div>
        </div>
    );
};

export default Usage;
