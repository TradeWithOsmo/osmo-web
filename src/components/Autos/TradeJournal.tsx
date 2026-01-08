import React from 'react';
// styles import removed

interface TradeJournalProps {
    sessionTitle?: string;
    workspaceName?: string;
}

const TradeJournal: React.FC<TradeJournalProps> = ({ sessionTitle, workspaceName }) => {
    return (
        <div style={{ padding: '32px', color: '#FFE1F2', display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <div style={{ fontSize: '24px', fontWeight: 500 }}>{sessionTitle || 'Trade Journal'}</div>
            <div style={{ fontSize: '14px', color: '#A77590', textAlign: 'center', maxWidth: '400px' }}>
                Journaling trades and analysis for <strong>{workspaceName || 'Global'}</strong> workspace.
                <br />
                Data here is isolated to this workspace.
                <br /><br />
                Currently empty.
            </div>
            {/* Placeholder Visual */}
            <div style={{ width: '64px', height: '64px', border: '2px dashed #3A2530', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3A2530' }}>
                ⌖
            </div>
        </div>
    );
};

export default TradeJournal;
