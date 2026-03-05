import React from 'react';
import PortfolioLeaderboard from '../components/Portfolio/PortfolioLeaderboard';

const Leaderboard: React.FC = () => {
    return (
        <div style={{ height: '100%', overflowY: 'auto', display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: '100%', maxWidth: '1300px', padding: '24px' }}>
                <PortfolioLeaderboard />
            </div>
        </div>
    );
};

export default Leaderboard;
