import React, { useState, useRef, useEffect } from 'react';
import styles from './Autos.module.css';
import AutosSidebar from './AutosSidebar';
import ChatInterface from './ChatInterface';
import type { Session, Workspace, Message } from '../../types/autos';
import TVChartContainer from '../TradingChart';
import { useMarketStore } from '../../store/useMarketStore';
import TradeJournal from './TradeJournal';

interface AutosProps {
    forceMobileMode?: boolean;
    compact?: boolean;
    currentSymbol?: string;
    chartState?: { symbol: string; timeframe: string; indicators: string[] } | null;
    onRestoreChartState?: (state: { interval: string; indicators: string[] }) => void;
}

const Autos: React.FC<AutosProps> = ({ forceMobileMode, compact, currentSymbol = 'BTC/USDT', chartState, onRestoreChartState }) => {
    const [activeSessionId, setActiveSessionId] = useState<string>('new-chat-1');
    const [isMinimized, setIsMinimized] = useState(false); // Default open on desktop

    useEffect(() => {
        const handleResize = () => {
            // Only force minimize if NOT compact and conditions met
            if (!compact && (window.innerWidth <= 768 || forceMobileMode)) {
                setIsMinimized(true);
            }
        };
        // Initial check
        handleResize();
        if (!forceMobileMode && !compact) {
            window.addEventListener('resize', handleResize);
            return () => window.removeEventListener('resize', handleResize);
        }
    }, [forceMobileMode, compact]);

    const [chartTabs, setChartTabs] = useState<{ symbol: string; interval: string; indicators: string[] }[]>([]);
    const [activeArtifact, setActiveArtifact] = useState<{ type: 'chart' | 'other', data?: any } | null>(null);

    // Sync Active Chart Artifact with Main Chart State
    useEffect(() => {
        if (activeArtifact?.type === 'chart') {
            // Prioritize currentSymbol from props as the "Target" symbol (Global Store)
            // chartState might be stale from the previous symbol until the Main Chart loads.
            const newSymbol = currentSymbol;

            // Only use chartState for interval/indicators if it matches the current target symbol
            // This prevents stale state (e.g. BTC interval) from applying to new symbol (e.g. ETH) 
            // or reverting the symbol back to BTC.
            const isStateMatching = chartState?.symbol === newSymbol || chartState?.symbol === newSymbol.replace('/', '');

            const newInterval = isStateMatching ? chartState?.timeframe : undefined;
            const newIndicators = isStateMatching ? (chartState?.indicators || []) : [];

            // 1. Update Tabs Logic
            setChartTabs(prevTabs => {
                const existingTabIndex = prevTabs.findIndex(t => t.symbol === newSymbol);

                // If tab exists, update it if needed
                if (existingTabIndex !== -1) {
                    const existingTab = prevTabs[existingTabIndex];
                    const indicatorsChanged = JSON.stringify(existingTab.indicators) !== JSON.stringify(newIndicators);

                    if ((newInterval && existingTab.interval !== newInterval) || indicatorsChanged) {
                        const updatedTabs = [...prevTabs];
                        updatedTabs[existingTabIndex] = {
                            ...existingTab,
                            interval: newInterval || existingTab.interval,
                            indicators: newIndicators
                        };
                        return updatedTabs;
                    }
                    return prevTabs;
                } else {
                    // If tab doesn't exist, create it (External sync forcing new tab)
                    // But usually we only want to ADD if the user explicitly clicked or if we want to force open.
                    // For now, let's assume if chartState changes, we update the CURRENT active artifact if it matches,
                    // OR if we strictly follow "sync", we should probably just ensure the ACTIVE one matches.

                    // Actually, the original logic was: "Start with activeArtifact, update it."
                    // New logic: "Start with activeArtifact. If it's a chart, ensure it's in tabs."
                    return prevTabs;
                }
            });

            // 2. Update Active Artifact Data
            setActiveArtifact(prev => {
                if (!prev || prev.type !== 'chart') return prev;
                const currentData = prev.data || {};

                // If we are looking at a DIFFERENT symbol than what chartState says...
                // The original logic UPDATED the symbol. Meaning it forced the chart to follow the external state.
                // We should Preserve this behavior: If external state follows: If external state changes, the artifact view follows.

                const indicatorsChanged = JSON.stringify(currentData.indicators || []) !== JSON.stringify(newIndicators);
                if (currentData.symbol !== newSymbol || (newInterval && currentData.interval !== newInterval) || indicatorsChanged) {
                    const newData = {
                        ...currentData,
                        symbol: newSymbol,
                        interval: newInterval || currentData.interval || '1D',
                        indicators: newIndicators
                    };

                    // Also ensure this new state is reflected in tabs
                    setChartTabs(prevTabs => {
                        const idx = prevTabs.findIndex(t => t.symbol === newSymbol);
                        if (idx !== -1) {
                            const updated = [...prevTabs];
                            updated[idx] = newData;
                            return updated;
                        } else {
                            return [...prevTabs, newData];
                        }
                    });

                    return { ...prev, data: newData };
                }
                return prev;
            });
        }
    }, [currentSymbol, chartState]); // Removed activeArtifact?.type to avoid loops, handled inside

    // Ensure active artifact is always in tabs (initialization)
    useEffect(() => {
        if (activeArtifact?.type === 'chart' && activeArtifact.data?.symbol) {
            setChartTabs(prev => {
                if (!prev.find(t => t.symbol === activeArtifact.data.symbol)) {
                    return [...prev, {
                        symbol: activeArtifact.data.symbol,
                        interval: activeArtifact.data.interval || '1D',
                        indicators: activeArtifact.data.indicators || []
                    }];
                }
                return prev;
            });
        }
    }, [activeArtifact]);








    // Resizable Split View State
    const [chatPanelWidth, setChatPanelWidth] = useState<number>(50); // percentage
    const [hideArtifact, setHideArtifact] = useState(false);
    const splitLayoutRef = useRef<HTMLDivElement>(null);
    const isResizing = useRef(false);

    // Global Market Store
    const setGlobalMarket = useMarketStore(state => state.setMarket);

    // If currentSymbol is provided (from props), we should probably respect it initially?
    // But we have our own chartTabs logic.

    // Workspace & Session State
    const [workspaces, setWorkspaces] = useState<Workspace[]>([
        {
            id: 'ws-1',
            name: 'v1-web',
            isExpanded: true,
            sessions: [
                { id: 's-1', title: 'Trading Assistant', type: 'chat' },
                { id: 's-2', title: 'TradingView Dropdown M...', type: 'chat', isLoading: true },
                { id: 's-3', title: 'Order Book Header Position...', type: 'chat' }
            ]
        }
    ]);

    const [inboxSessions, setInboxSessions] = useState<Session[]>([
        { id: 'new-chat-1', title: 'New Chat', type: 'chat', isActive: true },
        { id: 'inbox-1', title: 'Quick Analysis', type: 'chat', isActive: false }
    ]);

    // Store messages per session (key = activeSessionId)
    const [sessionMessages, setSessionMessages] = useState<Record<string, Message[]>>({});
    const [typingStatus, setTypingStatus] = useState<Record<string, boolean>>({});

    const getSessionById = (id: string): Session | undefined => {
        const inbox = inboxSessions.find(s => s.id === id);
        if (inbox) return inbox;
        for (const ws of workspaces) {
            const s = ws.sessions.find(ses => ses.id === id);
            if (s) return s;
        }
        return undefined;
    };


    const generateAssistantResponse = (sessionId: string, userContent: string, attachments: File[], toolStates: any, existingResponseId?: string) => {
        setTypingStatus(prev => ({ ...prev, [sessionId]: true }));

        setTimeout(() => {
            const responseId = existingResponseId || (Date.now() + 1).toString();

            let responseContent = "Here is your generated response for: " + userContent;
            if (attachments.length > 0) {
                responseContent += `\n\n[System: Received ${attachments.length} attachment(s)]`;
            }

            const thoughts: any[] = [];

            // Check Tool States
            if (toolStates?.execution) {
                thoughts.push({ type: 'text', title: 'Auto Execution', content: 'Execution permission granted. Analyzing trade opportunities...' });
            } else {
                thoughts.push({ type: 'text', title: 'Safety Check', content: 'Auto Execution is disabled. Proceeding in Chat-Only mode.' });
            }

            if (toolStates?.write) {
                thoughts.push({ type: 'text', title: 'Write Permission', content: 'Write access enabled.' });
            }

            // Use passed currentSymbol or default
            const symbol = chartState?.symbol || currentSymbol || 'BTC/USDT';
            const interval = chartState?.timeframe || '1D';
            const baseAsset = symbol.split('/')[0] || 'BTC';

            const dummyResponse: Message = {
                id: responseId,
                role: 'assistant',
                content: responseContent,
                thoughts: [
                    ...thoughts,
                    {
                        type: 'browsing',
                        title: `${baseAsset} price today`,
                        results: [
                            { title: `${baseAsset} price today, ${symbol} live price`, domain: 'coinmarketcap.com', url: '#', icon: 'https://github.com/coinmarketcap.png' },
                            { title: `${baseAsset} price analysis`, domain: 'coindesk.com', url: '#', icon: 'https://github.com/coindesk.png' },
                            { title: `Buy ${baseAsset} `, domain: 'robinhood.com', url: '#', icon: 'https://github.com/robinhood.png' }
                        ]
                    },
                    { type: 'text', title: 'Great, I got current price information. Now let me search for market sentiment.' },
                    {
                        type: 'browsing',
                        title: `${baseAsset} market sentiment 2026`,
                        results: [
                            { title: `Synthesized ${baseAsset} fundamentals, pricing data`, domain: 'example.com', url: '#' },
                            { title: 'Crypto Market Sentiment Analysis', domain: 'analyst.com', url: '#' }
                        ]
                    },
                    {
                        type: 'code',
                        title: 'Generating TradingView Chart Configuration',
                        codeLanguage: 'json',
                        content: `{ \n  "symbol": "${symbol}", \n  "interval": "${interval}", \n  "theme": "dark", \n  "studies": ["Volume"]\n } `
                    },
                    { type: 'text', title: 'Finalizing output based on gathered data.' }
                ],
                isThinking: true,
                artifact: {
                    type: 'chart',
                    title: `${symbol} Analysis Chart`,
                    data: { symbol: symbol, interval: interval }
                }
            };

            setSessionMessages(prev => {
                const current = prev[sessionId] || [];
                const exists = current.some(m => m.id === responseId);

                if (exists) {
                    return {
                        ...prev,
                        [sessionId]: current.map(msg => msg.id === responseId ? dummyResponse : msg)
                    };
                } else {
                    return {
                        ...prev,
                        [sessionId]: [...current, dummyResponse]
                    };
                }
            });

            setTypingStatus(prev => ({ ...prev, [sessionId]: false }));

            setTimeout(() => {
                setSessionMessages(prev => ({
                    ...prev,
                    [sessionId]: (prev[sessionId] || []).map(msg =>
                        msg.id === responseId ? { ...msg, isThinking: false } : msg
                    )
                }));
            }, 2500);

        }, 1000);
    };

    const handleSendMessage = (content: string, attachments: File[] = [], toolStates: any = {}) => {
        const currentSessionId = activeSessionId;
        const currentSession = getSessionById(currentSessionId);

        // Auto-Title Logic
        if (currentSession && ((!sessionMessages[currentSessionId] || sessionMessages[currentSessionId].length === 0) || currentSession.title === 'New Chat')) {
            const newTitle = content.split(' ').slice(0, 5).join(' ') + (content.split(' ').length > 5 ? '...' : '');

            const isInbox = inboxSessions.some(s => s.id === currentSessionId);
            if (isInbox) {
                setInboxSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, title: newTitle, isEditing: false } : s));
            } else {
                setWorkspaces(prev => prev.map(ws => ({
                    ...ws,
                    sessions: ws.sessions.map(s => s.id === currentSessionId ? { ...s, title: newTitle, isEditing: false } : s)
                })));
            }
        }

        const newMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content,
            attachments, // Pass attachments
            timestamp: Date.now()
        };

        setSessionMessages(prev => ({
            ...prev,
            [currentSessionId]: [...(prev[currentSessionId] || []), newMessage]
        }));

        generateAssistantResponse(currentSessionId, content, attachments, toolStates);
    };

    const handleRenameSession = (sessionId: string, newName: string) => {
        const isInbox = inboxSessions.some(s => s.id === sessionId);
        if (isInbox) {
            setInboxSessions(prev => prev.map(s => s.id === sessionId ? { ...s, title: newName } : s));
        } else {
            setWorkspaces(prev => prev.map(ws => ({
                ...ws,
                sessions: ws.sessions.map(s => s.id === sessionId ? { ...s, title: newName } : s)
            })));
        }
    };

    const handleDeleteSession = (sessionId: string) => {
        setWorkspaces(prev => prev.map(ws => ({
            ...ws,
            sessions: ws.sessions.filter(s => s.id !== sessionId)
        })));
        setInboxSessions(prev => prev.filter(s => s.id !== sessionId));

        if (activeSessionId === sessionId) {
            const firstInbox = inboxSessions.find(s => s.id !== sessionId);
            if (firstInbox) {
                setActiveSessionId(firstInbox.id);
            } else {
                const firstWsSession = workspaces[0]?.sessions.find(s => s.id !== sessionId);
                if (firstWsSession) setActiveSessionId(firstWsSession.id);
            }
        }
    };

    const handleMoveSessionToWorkspace = (sessionId: string, targetWorkspaceId: string) => {
        let sessionToMove: Session | undefined;
        let sourceWorkspaceId: string | undefined;

        const inboxSession = inboxSessions.find(s => s.id === sessionId);
        if (inboxSession) {
            sessionToMove = { ...inboxSession };
            sourceWorkspaceId = 'inbox';
        } else {
            for (const ws of workspaces) {
                const s = ws.sessions.find(ses => ses.id === sessionId);
                if (s) {
                    sessionToMove = { ...s };
                    sourceWorkspaceId = ws.id;
                    break;
                }
            }
        }

        if (!sessionToMove || !sourceWorkspaceId) return;
        if (sourceWorkspaceId === targetWorkspaceId) return;

        if (sourceWorkspaceId === 'inbox') {
            setInboxSessions(prev => prev.filter(s => s.id !== sessionId));
            setWorkspaces(prev => prev.map(ws => ws.id === targetWorkspaceId ? {
                ...ws, sessions: [sessionToMove!, ...ws.sessions]
            } : ws));
        } else {
            setWorkspaces(prev => {
                const workspacesAfterRemove = prev.map(ws => ws.id === sourceWorkspaceId ? {
                    ...ws, sessions: ws.sessions.filter(s => s.id !== sessionId)
                } : ws);
                return workspacesAfterRemove.map(ws => ws.id === targetWorkspaceId ? {
                    ...ws, sessions: [sessionToMove!, ...ws.sessions]
                } : ws);
            });
        }
    };

    const handleChartStateChange = (newState: { symbol: string; timeframe: string; indicators: string[] }) => {
        // Update tabs with new state
        setChartTabs(prevTabs => {
            const index = prevTabs.findIndex(t => t.symbol === newState.symbol);
            if (index !== -1) {
                const updatedTabs = [...prevTabs];
                updatedTabs[index] = {
                    ...updatedTabs[index],
                    interval: newState.timeframe,
                    indicators: newState.indicators
                };
                return updatedTabs;
            }
            // If for some reason the tab doesn't exist (maybe triggered by initial load), create it? 
            // Better to only update existing.
            return prevTabs;
        });

        // Update active artifact if it's the current one
        setActiveArtifact(prev => {
            if (prev?.type === 'chart' && prev.data?.symbol === newState.symbol) {
                return {
                    ...prev,
                    data: {
                        ...prev.data,
                        interval: newState.timeframe,
                        indicators: newState.indicators
                    }
                };
            }
            return prev;
        });
    };

    const handleOpenChart = (symbol: string = "BTC/USDT") => {
        const existingTab = chartTabs.find(t => t.symbol === symbol);
        if (existingTab) {
            setActiveArtifact({ type: 'chart', data: existingTab });
            // Restore state to Main Chart
            if (onRestoreChartState) {
                onRestoreChartState({
                    interval: existingTab.interval,
                    indicators: existingTab.indicators
                });
            }
        } else {
            const newTab = { symbol, interval: '1D', indicators: [] };
            // setChartTabs handled by effect if needed, but for instant UI response:
            // Actually, the effect syncs activeArtifact -> tabs. 
            // But if we want to switch immediately with valid data:
            setActiveArtifact({ type: 'chart', data: newTab });
        }

        // Sync with Global Market (Trade Page)
        // Convert "BTC/USDT" -> "BTC-USDT" (or "BTC-USD" depending on store data, usually Hyphen)
        // Try to find the matching market in store logic, usually it expects hyphenated.
        const globalSymbol = symbol.replace('/', '-');
        setGlobalMarket(globalSymbol);
    };

    const handleCloseArtifact = () => {
        setActiveArtifact(null);
    };

    const handleCloseTab = (e: React.MouseEvent, symbol: string) => {
        e.stopPropagation();

        const newTabs = chartTabs.filter(t => t.symbol !== symbol);
        setChartTabs(newTabs);

        if (newTabs.length === 0) {
            handleCloseArtifact();
        } else if (activeArtifact?.type === 'chart' && activeArtifact.data?.symbol === symbol) {
            // Switch to the previous tab or the first one
            const closingIndex = chartTabs.findIndex(t => t.symbol === symbol);
            const newActiveTab = newTabs[Math.max(0, closingIndex - 1)];
            setActiveArtifact({ type: 'chart', data: newActiveTab });
        }
    };

    const handleEditMessage = (sessionId: string, messageId: string, newContent: string) => {
        let nextMessageId: string | undefined;

        setSessionMessages(prev => {
            const currentMessages = prev[sessionId] || [];
            const msgIndex = currentMessages.findIndex(m => m.id === messageId);

            if (msgIndex === -1) return prev;

            // Check if there's a response message following the edited message
            const nextMsg = currentMessages[msgIndex + 1];
            if (nextMsg && nextMsg.role === 'assistant') {
                nextMessageId = nextMsg.id;
            }

            // Slice up to the response (if it exists) or just the edited message
            // If nextMsg exists (assistant), we keep it but clear it to act as placeholder
            const sliceIndex = nextMessageId ? msgIndex + 2 : msgIndex + 1;

            const updatedMessages = currentMessages.slice(0, sliceIndex).map(msg => {
                if (msg.id === messageId) {
                    return { ...msg, content: newContent };
                }
                if (msg.id === nextMessageId) {
                    return {
                        ...msg,
                        content: '', // Clear content for loading state
                        isThinking: true,
                        thoughts: undefined, // Clear previous thoughts
                        artifact: undefined // Clear previous artifacts
                    };
                }
                return msg;
            });

            return {
                ...prev,
                [sessionId]: updatedMessages
            };
        });

        // Trigger regeneration
        setTimeout(() => {
            generateAssistantResponse(sessionId, newContent, [], {}, nextMessageId);
        }, 50);
    };

    const handleMouseDown = () => {
        isResizing.current = true;
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.body.style.userSelect = 'none';
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!isResizing.current || !splitLayoutRef.current) return;
        const containerRect = splitLayoutRef.current.getBoundingClientRect();
        const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
        if (newWidth > 20 && newWidth < 80) {
            setChatPanelWidth(newWidth);
        }
    };

    const handleMouseUp = () => {
        isResizing.current = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.userSelect = '';
    };

    // Drag to scroll tabs logic
    const tabsContainerRef = useRef<HTMLDivElement>(null);
    const isDraggingTabs = useRef(false);
    const startX = useRef(0);
    const scrollLeft = useRef(0);

    const handleTabsMouseDown = (e: React.MouseEvent) => {
        isDraggingTabs.current = true;
        if (tabsContainerRef.current) {
            startX.current = e.pageX - tabsContainerRef.current.offsetLeft;
            scrollLeft.current = tabsContainerRef.current.scrollLeft;
        }
    };

    const handleTabsMouseLeave = () => {
        isDraggingTabs.current = false;
    };

    const handleTabsMouseUp = () => {
        isDraggingTabs.current = false;
    };

    const handleTabsMouseMove = (e: React.MouseEvent) => {
        if (!isDraggingTabs.current || !tabsContainerRef.current) return;
        e.preventDefault();
        const x = e.pageX - tabsContainerRef.current.offsetLeft;
        const walk = (x - startX.current) * 2; // Scroll-fast
        tabsContainerRef.current.scrollLeft = scrollLeft.current - walk;
    };

    const getWorkspaceBySessionId = (sessionId: string): Workspace | undefined => {
        return workspaces.find(ws => ws.sessions.some(s => s.id === sessionId));
    };

    const activeSession = getSessionById(activeSessionId);
    const activeWorkspace = getWorkspaceBySessionId(activeSessionId);

    // Reset artifact when session changes
    const handleRegenerateResponse = (assistantMessageId: string) => {
        setSessionMessages(prev => {
            const currentMessages = prev[activeSessionId] || [];
            const msgIndex = currentMessages.findIndex(m => m.id === assistantMessageId);

            if (msgIndex === -1) return prev;

            // Find preceding user message
            const userMsg = currentMessages[msgIndex - 1];
            if (!userMsg || userMsg.role !== 'user') return prev;

            // Clear the assistant message content to show loading state
            const updatedMessages = currentMessages.map(msg => {
                if (msg.id === assistantMessageId) {
                    return {
                        ...msg,
                        content: '',
                        isThinking: true,
                        thoughts: undefined,
                        artifact: undefined
                    };
                }
                return msg;
            });

            // Trigger generation (this side effect in setState is a bit hacky but consistent with current pattern)
            setTimeout(() => {
                generateAssistantResponse(activeSessionId, userMsg.content, [], {}, assistantMessageId);
            }, 50);

            return {
                ...prev,
                [activeSessionId]: updatedMessages
            };
        });
    };

    const handleFeedback = (messageId: string, feedback: 'like' | 'dislike' | null) => {
        setSessionMessages(prev => ({
            ...prev,
            [activeSessionId]: (prev[activeSessionId] || []).map(msg =>
                msg.id === messageId ? { ...msg, feedback: feedback || undefined } : msg
            )
        }));
    };

    useEffect(() => {
        setActiveArtifact(null);
    }, [activeSessionId]);

    const handleSessionChange = (sessionId: string) => {
        setActiveSessionId(sessionId);
        if (!compact && (window.innerWidth <= 768 || forceMobileMode)) {
            setIsMinimized(true);
        }
    };

    return (
        <div className={`${styles.layoutContainer} ${compact ? styles.compact : ''} `}>
            <AutosSidebar
                activeSessionId={activeSessionId}
                onSessionChange={handleSessionChange}
                isMinimized={isMinimized}
                onToggleMinimize={() => setIsMinimized(!isMinimized)}
                workspaces={workspaces}
                setWorkspaces={setWorkspaces}
                inboxSessions={inboxSessions}
                setInboxSessions={setInboxSessions}
                forceMobileMode={forceMobileMode && !compact}
                hideToggle={!!activeArtifact}
            />

            <div className={`${styles.contentArea} ${isMinimized && !activeArtifact ? styles.contentCentered : ''} `} style={{ padding: 0 }}>

                {activeArtifact ? (
                    <div className={styles.artifactPanel} style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <div className={styles.artifactHeader}>
                            <button
                                className={styles.closeArtifactBtn}
                                onClick={handleCloseArtifact}
                                style={{ marginRight: '8px', padding: '4px', flexShrink: 0 }}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="19" y1="12" x2="5" y2="12"></line>
                                    <polyline points="12 19 5 12 12 5"></polyline>
                                </svg>
                            </button>

                            {/* Dynamic Title */}
                            <div style={{ marginRight: '12px', fontWeight: 600, fontSize: '14px', color: '#FFE1F2', whiteSpace: 'nowrap' }}>
                                {activeArtifact.data?.symbol || currentSymbol} Analysis Chart
                            </div>

                            <div
                                className={styles.tabScrollContainer}
                                ref={tabsContainerRef}
                                onMouseDown={handleTabsMouseDown}
                                onMouseLeave={handleTabsMouseLeave}
                                onMouseUp={handleTabsMouseUp}
                                onMouseMove={handleTabsMouseMove}
                            >

                                {chartTabs.map((tab) => (
                                    <div
                                        key={tab.symbol}
                                        onClick={() => handleOpenChart(tab.symbol)}
                                        style={{
                                            background: activeArtifact.data?.symbol === tab.symbol ? 'rgba(93, 95, 239, 0.1)' : 'transparent',
                                            color: activeArtifact.data?.symbol === tab.symbol ? '#5D5FEF' : '#A77590',
                                            border: '1px solid',
                                            borderColor: activeArtifact.data?.symbol === tab.symbol ? 'rgba(93, 95, 239, 0.3)' : 'transparent',
                                            borderRadius: '6px',
                                            padding: '4px 6px 4px 8px',
                                            fontSize: '12px',
                                            cursor: 'pointer',
                                            whiteSpace: 'nowrap',
                                            transition: 'all 0.2s',
                                            flexShrink: 0,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px'
                                        }}
                                    >
                                        <span>{tab.symbol}</span>
                                        <button
                                            onClick={(e) => handleCloseTab(e, tab.symbol)}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                color: 'currentColor',
                                                opacity: 0.6,
                                                padding: '2px',
                                                borderRadius: '50%',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                            onMouseOver={e => e.currentTarget.style.opacity = '1'}
                                            onMouseOut={e => e.currentTarget.style.opacity = '0.6'}
                                        >
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                                <line x1="6" y1="6" x2="18" y2="18"></line>
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>

                        </div>
                        <div style={{ flex: 1, position: 'relative' }}>
                            <TVChartContainer
                                symbol={activeArtifact.data?.symbol || "BTC/USDT"}
                                interval={activeArtifact.data?.interval || "1D"}
                                studies={activeArtifact.data?.indicators || []}
                                onChartStateChange={handleChartStateChange}
                                theme="dark"
                                height="100%"
                                hideTopToolbar={true}
                                hideSideToolbar={true}
                            />
                        </div>
                    </div>
                ) : (
                    <div className={`${isMinimized ? styles.contentCentered : ''} `} style={{ height: '100%', display: 'flex', flexDirection: 'column', width: '100%', maxWidth: isMinimized ? '1300px' : 'none', margin: isMinimized ? '0 auto' : '0' }}>
                        {activeSession?.type === 'position' ? (
                            <TradeJournal sessionTitle={activeSession.title} workspaceName={activeWorkspace?.name || 'Inbox'} />
                        ) : (
                            <ChatInterface
                                activeSessionId={activeSessionId}
                                activeSessionTitle={activeSession?.title}
                                messages={sessionMessages[activeSessionId] || []}
                                onSendMessage={handleSendMessage}
                                isTyping={typingStatus[activeSessionId] || false}
                                workspaces={workspaces}
                                onRenameSession={handleRenameSession}
                                onDeleteSession={handleDeleteSession}
                                onMoveSessionToWorkspace={handleMoveSessionToWorkspace}
                                onOpenChart={handleOpenChart}
                                onEditMessage={handleEditMessage}
                                onRegenerateResponse={handleRegenerateResponse}
                                onFeedback={handleFeedback}
                                currentSymbol={currentSymbol}
                            />
                        )}
                    </div>
                )}

            </div>
        </div>
    );
};

export default Autos;
