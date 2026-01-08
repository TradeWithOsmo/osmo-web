import React, { useState, useRef, useEffect } from 'react';
import styles from './Autos.module.css';
import AutosSidebar from '../components/Autos/AutosSidebar';
import ChatInterface from '../components/Autos/ChatInterface';
import type { Session, Workspace, Message } from '../types/autos';
import TVChartContainer from '../components/TradingChart';
import TradeJournal from '../components/Autos/TradeJournal';

const Autos: React.FC = () => {
    const [activeSessionId, setActiveSessionId] = useState<string>('new-chat-1');
    const [isMinimized, setIsMinimized] = useState(true); // Default hidden/minimized

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth <= 768) {
                setIsMinimized(true);
            }
        };
        // Initial check
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    const [activeArtifact, setActiveArtifact] = useState<{ type: 'chart' | 'other', data?: any } | null>(null);

    // Resizable Split View State
    const [chatPanelWidth, setChatPanelWidth] = useState<number>(50); // percentage
    const splitLayoutRef = useRef<HTMLDivElement>(null);
    const isResizing = useRef(false);

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

            const dummyResponse: Message = {
                id: responseId,
                role: 'assistant',
                content: responseContent,
                thoughts: [
                    ...thoughts,
                    {
                        type: 'browsing',
                        title: 'Bitcoin BTC price today',
                        results: [
                            { title: 'Bitcoin price today, BTC to USD live price', domain: 'coinmarketcap.com', url: '#', icon: 'https://github.com/coinmarketcap.png' },
                            { title: 'Bitcoin price today, BTC to USD live price', domain: 'coindesk.com', url: '#', icon: 'https://github.com/coindesk.png' },
                            { title: 'Buy Bitcoin - BTC Price Today', domain: 'robinhood.com', url: '#', icon: 'https://github.com/robinhood.png' }
                        ]
                    },
                    { type: 'text', title: 'Great, I got current price information. Now let me search for market sentiment.' },
                    {
                        type: 'browsing',
                        title: 'Bitcoin market sentiment 2026',
                        results: [
                            { title: 'Synthesized Bitcoin fundamentals, pricing data', domain: 'example.com', url: '#' },
                            { title: 'Crypto Market Sentiment Analysis', domain: 'analyst.com', url: '#' }
                        ]
                    },
                    {
                        type: 'code',
                        title: 'Generating TradingView Chart Configuration',
                        codeLanguage: 'json',
                        content: '{\n  "symbol": "BTC/USDT",\n  "interval": "1D",\n  "theme": "dark",\n  "studies": ["Volume"]\n}'
                    },
                    { type: 'text', title: 'Finalizing output based on gathered data.' }
                ],
                isThinking: true,
                artifact: {
                    type: 'chart',
                    title: 'Bitcoin (BTC/USDT) Analysis Chart',
                    data: { symbol: 'BTC/USDT' }
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

    const handleOpenChart = (symbol: string = "BTC/USDT") => {
        setActiveArtifact({ type: 'chart', data: { symbol } });
    };

    const handleCloseArtifact = () => {
        setActiveArtifact(null);
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
        setIsMinimized(true);
    };

    return (
        <div className={styles.layoutContainer}>
            <AutosSidebar
                activeSessionId={activeSessionId}
                onSessionChange={handleSessionChange}
                isMinimized={isMinimized}
                onToggleMinimize={() => setIsMinimized(!isMinimized)}
                workspaces={workspaces}
                setWorkspaces={setWorkspaces}
                inboxSessions={inboxSessions}
                setInboxSessions={setInboxSessions}
            />

            <div className={`${styles.contentArea} ${isMinimized && !activeArtifact ? styles.contentCentered : ''}`} style={{ padding: 0 }}>
                {activeArtifact ? (
                    <div className={styles.splitLayout} ref={splitLayoutRef}>
                        <div className={styles.chatPanel} style={{ minWidth: 0, maxWidth: `${chatPanelWidth}%`, flexBasis: `${chatPanelWidth}%`, borderRight: 'none' }}>
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
                                />
                            )}
                        </div>

                        <div className={styles.resizer} onMouseDown={handleMouseDown}>
                            <div className={styles.resizerHandle}></div>
                        </div>

                        <div className={styles.artifactPanel} style={{ flex: 1, minWidth: 0 }}>
                            <div className={styles.artifactHeader}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span>TradingView Chart</span>
                                    <span style={{ color: '#5D5FEF', fontSize: '12px', background: 'rgba(93, 95, 239, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                                        {activeArtifact.data?.symbol || 'BTC/USDT'}
                                    </span>
                                </div>
                                <button className={styles.closeArtifactBtn} onClick={handleCloseArtifact}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M18 6L6 18M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <div style={{ flex: 1, position: 'relative' }}>
                                <TVChartContainer
                                    symbol={activeArtifact.data?.symbol || "BTC/USDT"}
                                    theme="dark"
                                    height="100%"
                                    hideTopToolbar={true}
                                    hideSideToolbar={true}
                                />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className={`${isMinimized ? styles.contentCentered : ''}`} style={{ height: '100%', display: 'flex', flexDirection: 'column', width: '100%', maxWidth: isMinimized ? '1200px' : 'none', margin: isMinimized ? '0 auto' : '0' }}>
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
                            />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Autos;
