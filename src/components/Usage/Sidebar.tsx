import React from 'react';
import styles from './Usage.module.css';
import sidebarIcon from '../../assets/Icons/Sidebar.png';
import { useUIStore } from '../../store/useUIStore';

interface SidebarProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
    isMinimized: boolean;
    onToggleMinimize: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, isMinimized, onToggleMinimize }) => {
    const { openDepositModal } = useUIStore();

    return (
        <div className={`${styles.sidebar} ${isMinimized ? styles.sidebarMinimized : ''}`}>
            {/* Toggle Button */}
            <button
                className={styles.toggleButton}
                onClick={onToggleMinimize}
                aria-label={isMinimized ? "Expand sidebar" : "Minimize sidebar"}
            >
                <img src={sidebarIcon} alt="Toggle Sidebar" className={styles.toggleIcon} />
            </button>

            {!isMinimized && (
                <>
                    <div className={styles.sidebarContent}>
                        {/* General Section */}
                        <div>
                            <div className={styles.sidebarSectionTitle}>General</div>
                            <div
                                className={`${styles.menuItem} ${activeTab === 'Overview' ? styles.active : ''}`}
                                onClick={() => onTabChange('Overview')}
                            >
                                <span>Overview</span>
                            </div>
                            <div
                                className={`${styles.menuItem} ${activeTab === 'Usage' ? styles.active : ''}`}
                                onClick={() => onTabChange('Usage')}
                            >
                                <span>Usage</span>
                            </div>
                        </div>

                        {/* Billing Section */}
                        <div>
                            <div className={styles.sidebarSectionTitle}>Billing</div>
                            <div
                                className={`${styles.menuItem} ${activeTab === 'Model Fee' ? styles.active : ''}`}
                                onClick={() => onTabChange('Model Fee')}
                            >
                                <span>Model Fee</span>
                            </div>
                        </div>
                    </div>

                    {/* Footer Section */}
                    <div className={styles.sidebarFooter}>
                        <button className={styles.sidebarActionButton} onClick={() => openDepositModal('refill')}>
                            Refill
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default Sidebar;
