import React from 'react';
import styles from './BottomNav.module.css';
import osmoLogo from '../../assets/Icons/Osmo-Logos.png';

interface BottomNavProps {
    activeTab?: 'market' | 'trade' | 'account';
    onTabChange?: (tab: 'market' | 'trade' | 'account') => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab = 'market', onTabChange }) => {
    return (
        <div className={styles.bottomNav}>
            <button
                className={`${styles.navItem} ${activeTab === 'account' ? styles.active : ''}`}
                onClick={() => onTabChange?.('account')}
            >
                <img src={osmoLogo} alt="Auto" width="24" height="24" style={{ marginBottom: '4px', objectFit: 'contain' }} />
                Auto
            </button>
            <button
                className={`${styles.navItem} ${activeTab === 'market' ? styles.active : ''}`}
                onClick={() => onTabChange?.('market')}
            >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="20" x2="18" y2="10"></line>
                    <line x1="12" y1="20" x2="12" y2="4"></line>
                    <line x1="6" y1="20" x2="6" y2="14"></line>
                </svg>
                Markets
            </button>
            <button
                className={`${styles.navItem} ${activeTab === 'trade' ? styles.active : ''}`}
                onClick={() => onTabChange?.('trade')}
            >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="9" cy="12" r="1"></circle>
                    <circle cx="15" cy="12" r="1"></circle>
                    <path d="M7 12a5 5 0 0 1 5-5v0a5 5 0 0 1 5 5v0a5 5 0 0 1-5 5v0a5 5 0 0 1-5-5z"></path>
                </svg>
                Trade
            </button>
        </div>
    );
};

export default BottomNav;
