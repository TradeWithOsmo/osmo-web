import React, { useState, useRef, useEffect } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import styles from './Autos.module.css';
import AutosSidebar from './AutosSidebar';
import ChatInterface from './ChatInterface';
import type { Session, Workspace, Message, ChatAttachment } from '../../types/autos';
import TVChartContainer from '../TradingChart';
import sidebarIcon from '../../assets/Icons/Sidebar.png';
import plusIcon from '../../assets/Icons/Plus.png';
import modelIcon from '../../assets/Icons/Model.png';
import { useMarketStore } from '../../store/useMarketStore';
import AutosSettings from './AutosSettings';
import { agentService } from '../../api/agentService';
import axios from 'axios';
import type { TradeDecisionTriggerEvent } from '../../hooks/useTradingViewConnector';

const dedupeSessionsById = <T extends { id: string }>(sessions: T[]): T[] =>
    Array.from(new Map(sessions.map((s) => [s.id, s])).values());

interface AutosProps {
    forceMobileMode?: boolean;
    compact?: boolean;
    currentSymbol?: string;
    chartState?: { symbol: string; timeframe: string; indicators: string[] } | null;
    onRestoreChartState?: (state: { interval: string; indicators: string[] }) => void;
}

const Autos: React.FC<AutosProps> = ({ forceMobileMode, compact, currentSymbol = 'BTC/USDT', chartState, onRestoreChartState }) => {
    const [activeSessionId, setActiveSessionId] = useState<string>('new-chat-1');
    const [isMinimized, setIsMinimized] = useState(true); // Default closed
    const [showSettings, setShowSettings] = useState(false);
    const { getAccessToken } = usePrivy();
    const { wallets } = useWallets();
    const walletAddress = wallets[0]?.address;

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
    const pendingTitleRef = useRef<Record<string, string>>({});
    const abortControllerRef = useRef<AbortController | null>(null);
    const generationSessionRef = useRef<string | null>(null);

    const handleStopGeneration = () => {
        const sessionId = generationSessionRef.current;
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        if (sessionId && !sessionId.startsWith('new-chat')) {
            void (async () => {
                try {
                    const token = await getAccessToken();
                    await agentService.interruptSession(sessionId, token || undefined, walletAddress);
                } catch (err) {
                    console.debug('Interrupt request failed:', err);
                }
            })();
        }
    };

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








    // Global Market Store
    const setGlobalMarket = useMarketStore(state => state.setMarket);

    // If currentSymbol is provided (from props), we should probably respect it initially?
    // But we have our own chartTabs logic.

    // Workspace & Session State
    // Workspace & Session State
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);

    const [inboxSessions, setInboxSessions] = useState<Session[]>([
        { id: 'new-chat-1', title: 'New Chat', type: 'chat', isActive: true }
    ]);
    // Store messages per session (key = activeSessionId)
    const [sessionMessages, setSessionMessages] = useState<Record<string, Message[]>>({});
    const [typingStatus, setTypingStatus] = useState<Record<string, boolean>>({});

    // 1. Initial Load: Fetch Sessions & Workspaces from Backend
    useEffect(() => {
        const fetchData = async () => {
            if (!walletAddress) return;
            try {
                const token = await getAccessToken();
                if (!token) return;

                // 1. Fetch Workspaces
                const wsData = await agentService.getWorkspaces(token, walletAddress);

                // 2. Fetch All Sessions
                const sessions = await agentService.getSessions(token, walletAddress);
                const uniqueSessions = Array.from(
                    new Map((sessions || []).map((s: any) => [s.id, s])).values()
                );

                if (wsData) {
                    const formattedWorkspaces: Workspace[] = wsData.map((w: any) => ({
                        id: w.id,
                        name: w.name,
                        isExpanded: w.is_expanded,
                        sessions: uniqueSessions.filter((s: any) => s.workspace_id === w.id).map((s: any) => ({
                            id: s.id,
                            title: s.title,
                            type: 'chat'
                        }))
                    }));
                    setWorkspaces(formattedWorkspaces);
                }

                if (uniqueSessions) {
                    const inboxOnly: Session[] = uniqueSessions.filter((s: any) => !s.workspace_id).map((s: any) => ({
                        id: s.id,
                        title: s.title,
                        type: 'chat'
                    }));
                    setInboxSessions(prev => {
                        const pendingNewChats = prev.filter(s => s.id.startsWith('new-chat'));
                        return dedupeSessionsById([...pendingNewChats, ...inboxOnly]);
                    });
                }
            } catch (err) {
                console.error("Failed to fetch data", err);
            }
        };
        fetchData();
    }, [getAccessToken, walletAddress]);

    // 2. Fetch History when session changes
    useEffect(() => {
        const loadHistory = async () => {
            if (!activeSessionId || activeSessionId.startsWith('new-chat')) return;
            if (sessionMessages[activeSessionId]) return; // Already loaded
            if (!walletAddress) return;

            try {
                const token = await getAccessToken();
                if (!token) return;

                const history = await agentService.getHistory(activeSessionId, token, walletAddress);
                if (history) {
                    const formattedMessages: Message[] = history.map((m: any, idx: number) => ({
                        id: `msg-${idx}`,
                        role: m.role,
                        content: m.content,
                        timestamp: Date.now() // API doesn't return timestamp yet in history endpoint, can add later
                    }));

                    setSessionMessages(prev => ({
                        ...prev,
                        [activeSessionId]: formattedMessages
                    }));
                }
            } catch (err) {
                console.error("Failed to load history", err);
            }
        };
        loadHistory();
    }, [activeSessionId, getAccessToken, walletAddress, sessionMessages]);

    const getSessionById = (id: string): Session | undefined => {
        const inbox = inboxSessions.find(s => s.id === id);
        if (inbox) return inbox;
        for (const ws of workspaces) {
            const s = ws.sessions.find(ses => ses.id === id);
            if (s) return s;
        }
        return undefined;
    };


    const formatChatError = (error: unknown): string => {
        if (axios.isAxiosError(error)) {
            const status = error.response?.status;
            const detail =
                (error.response?.data as any)?.detail ||
                (error.response?.data as any)?.message ||
                error.message;
            return `${status ? `(${status}) ` : ''}${detail}`;
        }
        if (error && typeof error === 'object' && 'message' in error) {
            return String((error as any).message);
        }
        return 'Unknown error';
    };

    const generateAssistantResponse = async (
        sessionId: string,
        userContent: string,
        modelId: string,
        history: Message[] = [],
        reasoningEffort?: string,
        toolStates?: any,
        attachments: ChatAttachment[] = []
    ) => {
        let currentSessionId = sessionId;
        generationSessionRef.current = currentSessionId;
        const responseId = `assistant-${Date.now()}`;
        const isProviderFallbackMessage = (text: string) => {
            if (!text) return false;
            const normalized = text.replace(/\s+/g, ' ').trim().toLowerCase();
            return normalized === "i'm sorry, but i'm unable to continue the conversation right now due to a technical issue. please try again later.";
        };

        const appendAssistantMessage = (content: string, thoughts?: any[], isThinking: boolean = false) => {
            setSessionMessages(prev => {
                const existing = prev[currentSessionId] || [];
                const updated = existing.map(m => m.id === responseId ? {
                    ...m,
                    content,
                    thoughts: thoughts && thoughts.length > 0 ? thoughts : m.thoughts,
                    isThinking,
                    modelId
                } : m);
                return { ...prev, [currentSessionId]: updated };
            });
        };

        const buildThoughtKey = (item: any) => {
            if (typeof item === 'string') {
                return `s:${item.trim()}`;
            }
            if (!item || typeof item !== 'object') {
                return `x:${String(item)}`;
            }
            const type = String(item.type || 'text');
            const title = String(item.title || '');
            const content = String(item.content || '');
            const toolName = String(item.toolName || '');
            const status = String(item.status || '');
            const phase = String(item.phase || '');
            return `o:${type}|${phase}|${toolName}|${status}|${title}|${content}`;
        };

        const isRuntimePhaseLine = (value: string) =>
            /^\[(plan_|tool_|execution_adapter|runtime_ready|plan_ready|plan_start|tool_round_|tool_execution|tool_followup|tool_round_complete)/i.test(
                value.trim()
            );

        const mergeAssistantThoughts = (incomingThoughts: any[]) => {
            if (!Array.isArray(incomingThoughts) || incomingThoughts.length === 0) return;
            setSessionMessages(prev => {
                const existing = prev[currentSessionId] || [];
                const updated = existing.map(m => {
                    if (m.id !== responseId) return m;
                    const base = Array.isArray(m.thoughts) ? [...m.thoughts] : [];
                    const keys = new Set(base.map(buildThoughtKey));
                    for (const item of incomingThoughts) {
                        if (typeof item === 'string' && isRuntimePhaseLine(item)) continue;
                        const key = buildThoughtKey(item);
                        if (!keys.has(key)) {
                            keys.add(key);
                            base.push(item);
                        }
                    }
                    return { ...m, thoughts: base, isThinking: true, modelId };
                });
                return { ...prev, [currentSessionId]: updated };
            });
        };

        const appendThought = (thought: any) => {
            if (!thought) return;
            if (typeof thought === 'string' && isRuntimePhaseLine(thought)) return;
            setSessionMessages(prev => {
                const existing = prev[currentSessionId] || [];
                const updated = existing.map(m => {
                    if (m.id !== responseId) return m;
                    const nextThoughts = Array.isArray(m.thoughts) ? [...m.thoughts] : [];
                    const key = buildThoughtKey(thought);
                    const hasKey = nextThoughts.some(item => buildThoughtKey(item) === key);
                    if (!hasKey) {
                        nextThoughts.push(thought);
                    }
                    return { ...m, thoughts: nextThoughts, isThinking: true };
                });
                return { ...prev, [currentSessionId]: updated };
            });
        };

        const appendRuntimePhase = (phase: any) => {
            const phaseName = String(phase?.name || '').trim();
            if (!phaseName) return;
            const status = String(phase?.status || 'done').trim();
            const detail = String(phase?.detail || phaseName.replace(/_/g, ' ')).trim();
            const phaseTool = String(phase?.meta?.tool || '').trim();
            const phaseStage = String(phase?.meta?.stage || '').trim().toLowerCase();
            const loopRaw = phase?.meta?.loop;
            const phaseLoop = Number.isFinite(Number(loopRaw)) ? Number(loopRaw) : null;
            const attemptRaw = phase?.meta?.attempt;
            const phaseAttempt = Number.isFinite(Number(attemptRaw)) ? Number(attemptRaw) : null;
            const seqRaw = phase?.meta?.seq;
            const phaseSeq = Number.isFinite(Number(seqRaw)) ? Number(seqRaw) : null;
            const normalizedDetail = detail.toLowerCase();
            const isSynthetic = Boolean(phase?.meta?.synthetic);
            const phaseIdentity = `${phaseName}|${phaseTool}|${phaseStage}|${phaseLoop ?? ''}|${phaseAttempt ?? ''}|${phaseSeq ?? ''}`;

            if (status.toLowerCase() === 'skipped') return;
            if (normalizedDetail.includes('not triggered for this request')) return;

            const stageLabel = phaseStage
                ? (
                    {
                        think: 'Think',
                        act: 'Act',
                        observe: 'Observe',
                        plan: 'Plan'
                    } as Record<string, string>
                )[phaseStage] || phaseStage
                : '';

            const baseTitle = detail || (stageLabel ? `${stageLabel}: ${phaseName.replace(/_/g, ' ')}` : phaseName.replace(/_/g, ' '));
            const hasLoopPrefix = /^\s*(plan\s+loop|loop\s+\d+)/i.test(baseTitle);
            const title =
                phaseLoop && phaseLoop > 0 && !hasLoopPrefix
                    ? `Loop ${phaseLoop}: ${baseTitle}`
                    : baseTitle;

            const contentParts = [`status=${status}`];
            if (phaseTool) {
                contentParts.push(`tool=${phaseTool}`);
            }
            if (phaseLoop && phaseLoop > 0) {
                contentParts.push(`loop=${phaseLoop}`);
            }
            if (phaseAttempt && phaseAttempt > 0) {
                contentParts.push(`attempt=${phaseAttempt}`);
            }
            if (stageLabel) {
                contentParts.push(`stage=${stageLabel}`);
            }
            const content = contentParts.join(', ');
            const baseLabel = phaseTool || stageLabel || 'runtime';
            const toolLabel = phaseLoop && phaseLoop > 0 ? `${baseLabel} - L${phaseLoop}` : baseLabel;

            setSessionMessages(prev => {
                const existing = prev[currentSessionId] || [];
                const updated = existing.map(m => {
                    if (m.id !== responseId) return m;
                    const currentPhases = Array.isArray(m.runtimePhases) ? [...m.runtimePhases] : [];
                    const incomingPhase = {
                        name: phaseName,
                        status,
                        detail,
                        meta: { ...phase?.meta, identity: phaseIdentity },
                    };
                    const existingIdx = currentPhases.findIndex(
                        p =>
                            String(p?.meta?.identity || '') === phaseIdentity ||
                            (
                                p.name === phaseName &&
                                String(p?.meta?.tool || '') === phaseTool &&
                                String(p?.meta?.stage || '').toLowerCase() === phaseStage &&
                                Number(p?.meta?.loop ?? NaN) === Number(phaseLoop ?? NaN) &&
                                Number(p?.meta?.attempt ?? NaN) === Number(phaseAttempt ?? NaN) &&
                                Number(p?.meta?.seq ?? NaN) === Number(phaseSeq ?? NaN)
                            )
                    );
                    if (existingIdx >= 0) {
                        currentPhases[existingIdx] = incomingPhase;
                    } else {
                        currentPhases.push(incomingPhase);
                    }
                    // Prevent unbounded phase growth from flooding the UI.
                    const trimmedPhases = currentPhases.slice(-24);
                    return { ...m, runtimePhases: trimmedPhases, isThinking: true };
                });
                return { ...prev, [currentSessionId]: updated };
            });

            if (isSynthetic) return;

            appendThought({
                type: 'tool',
                title,
                content,
                toolName: toolLabel || undefined,
                status,
                phase: phaseName,
                meta: phase?.meta || undefined,
            });
        };

        let streamedText = '';
        const stopTyping = () => {
            setTypingStatus(prev => ({ ...prev, [currentSessionId]: false }));
        };

        const THOUGHT_DELAY_MS = 35;
        let thoughtQueue: any[] = [];
        let thoughtTimer: ReturnType<typeof setTimeout> | null = null;

        const flushThoughtQueue = () => {
            if (thoughtTimer) {
                clearTimeout(thoughtTimer);
                thoughtTimer = null;
            }
            while (thoughtQueue.length > 0) {
                const next = thoughtQueue.shift();
                if (next) appendThought(next);
            }
        };

        const scheduleThoughtFlush = () => {
            if (thoughtTimer) return;
            thoughtTimer = setTimeout(() => {
                const next = thoughtQueue.shift();
                if (next) appendThought(next);
                thoughtTimer = null;
                if (thoughtQueue.length > 0) {
                    scheduleThoughtFlush();
                }
            }, THOUGHT_DELAY_MS);
        };

        const migrateSession = (newSessionId: string) => {
            if (newSessionId === currentSessionId) return;
            setSessionMessages(prev => {
                const oldMessages = prev[currentSessionId] || [];
                const { [currentSessionId]: _, ...rest } = prev;
                return { ...rest, [newSessionId]: oldMessages };
            });
            setTypingStatus(prev => {
                const isTyping = !!prev[currentSessionId];
                const { [currentSessionId]: _, ...rest } = prev;
                return { ...rest, [newSessionId]: isTyping };
            });
            setInboxSessions(prev => dedupeSessionsById(
                prev.map(s => s.id === currentSessionId ? { ...s, id: newSessionId } : s)
            ));
            if (generationSessionRef.current === currentSessionId) {
                generationSessionRef.current = newSessionId;
            }
            currentSessionId = newSessionId;
            setActiveSessionId(newSessionId);
        };

        const persistSessionTitle = async (sessionId: string, title: string) => {
            if (!sessionId || sessionId.startsWith('new-chat')) {
                pendingTitleRef.current[sessionId] = title;
                return;
            }
            try {
                const token = await getAccessToken();
                if (token) {
                    await agentService.renameSession(sessionId, title, token, walletAddress);
                }
            } catch (err) {
                console.error("Failed to persist session title", err);
            }
        };

        setTypingStatus(prev => ({ ...prev, [currentSessionId]: true }));

        // Create placeholder assistant message for streaming
        setSessionMessages(prev => ({
            ...prev,
            [currentSessionId]: [
                ...(prev[currentSessionId] || []),
                {
                    id: responseId,
                    role: 'assistant',
                    content: '',
                    timestamp: Date.now(),
                    isThinking: true,
                    modelId
                }
            ]
        }));

        const controller = new AbortController();
        abortControllerRef.current = controller;

        try {
            const apiHistory = history.map(m => ({
                role: m.role,
                content: m.content
            }));

            const token = await getAccessToken();
            let contentBuffer = '';

            const apiSessionId = currentSessionId.startsWith('new-chat') ? 'new-chat' : currentSessionId;
            await agentService.chatStream({
                model_id: modelId,
                message: userContent,
                session_id: apiSessionId,
                history: apiHistory,
                token: token || undefined,
                wallet_address: walletAddress,
                reasoning_effort: reasoningEffort,
                tool_states: toolStates,
                attachments,
                signal: controller.signal
            }, {
                onMeta: (event) => {
                    if (event.session_id && event.session_id !== currentSessionId) {
                        const oldId = currentSessionId;
                        migrateSession(event.session_id);
                        const pendingTitle = pendingTitleRef.current[oldId];
                        if (pendingTitle) {
                            delete pendingTitleRef.current[oldId];
                            void persistSessionTitle(event.session_id, pendingTitle);
                        }
                    }
                },
                onDelta: (delta) => {
                    if (!delta) return;
                    contentBuffer += delta;
                    streamedText = contentBuffer;
                    appendAssistantMessage(streamedText, undefined, true);
                },
                onThoughts: (thoughts) => {
                    mergeAssistantThoughts(thoughts);
                },
                onThoughtDelta: (thought) => {
                    if (!thought) return;
                    thoughtQueue.push(thought);
                    scheduleThoughtFlush();
                },
                onRuntime: (runtime) => {
                    const phases = Array.isArray(runtime?.phases) ? runtime.phases : [];
                    for (const phase of phases) {
                        appendRuntimePhase(phase);
                    }
                },
                onRuntimePhase: (phase) => {
                    appendRuntimePhase(phase);
                },
                onDone: (event) => {
                    const finalContent = event.content || contentBuffer;
                    const finalThoughts = Array.isArray(event.thoughts) ? event.thoughts : undefined;
                    if (finalThoughts && finalThoughts.length > 0) {
                        mergeAssistantThoughts(finalThoughts);
                    }
                    flushThoughtQueue();
                    streamedText = finalContent;
                    stopTyping();
                    if (isProviderFallbackMessage(finalContent)) {
                        appendAssistantMessage("Maaf, chat gagal. Provider error. Silakan coba lagi.", undefined, false);
                        return;
                    }
                    appendAssistantMessage(finalContent, undefined, false);
                },
                onError: (message) => {
                    stopTyping();
                    appendAssistantMessage(`Maaf, chat gagal. ${message}`, undefined, false);
                }
            });
        } catch (error: any) {
            if (error.name === 'AbortError' || error.message === 'Aborted') {
                console.log("Generation aborted by user");
                stopTyping();
                appendAssistantMessage(streamedText + " [Dibatalkan]", undefined, false);
                return;
            }
            console.error("Chat Error:", error);
            const errorMessage = formatChatError(error);
            stopTyping();
            appendAssistantMessage(`Maaf, chat gagal. ${errorMessage}`, undefined, false);
        } finally {
            if (abortControllerRef.current === controller) {
                abortControllerRef.current = null;
            }
            generationSessionRef.current = null;
            setTypingStatus(prev => ({ ...prev, [currentSessionId]: false }));
        }
    };

    const handleSendMessage = async (content: string, modelId: string, attachments: ChatAttachment[] = [], toolStates: any = {}) => {
        const currentSessionId = activeSessionId;
        const currentSession = getSessionById(currentSessionId);
        const history = sessionMessages[currentSessionId] || [];
        const reasoningEffort = toolStates?.reasoning_effort;

        // Auto-Title Logic
        if (currentSession && (history.length === 0 || currentSession.title === 'New Chat')) {
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

            void (async () => {
                try {
                    const token = await getAccessToken();
                    if (!token) return;
                    if (currentSessionId.startsWith('new-chat')) {
                        pendingTitleRef.current[currentSessionId] = newTitle;
                        return;
                    }
                    await agentService.renameSession(currentSessionId, newTitle, token, walletAddress);
                } catch (err) {
                    console.error("Failed to persist auto-title", err);
                }
            })();
        }

        const newMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content,
            attachments,
            timestamp: Date.now()
        };

        const updatedHistory = [...history, newMessage];

        setSessionMessages(prev => ({
            ...prev,
            [currentSessionId]: updatedHistory
        }));

        generateAssistantResponse(currentSessionId, content, modelId, history, reasoningEffort, toolStates, attachments);
    };

    const resolveAutoTriggerModelId = (sessionId: string): string => {
        const history = sessionMessages[sessionId] || [];
        for (let i = history.length - 1; i >= 0; i -= 1) {
            const msg = history[i] as Message & { modelId?: string };
            if (msg.role === 'assistant' && msg.modelId) {
                const raw = String(msg.modelId).trim();
                if (raw.toLowerCase().startsWith('nvidia/')) {
                    return raw.split('/').slice(1).join('/');
                }
                return raw;
            }
        }
        return 'moonshotai/kimi-k2.5';
    };

    const handleTradeDecisionTrigger = async (event: TradeDecisionTriggerEvent) => {
        const modelId = resolveAutoTriggerModelId(activeSessionId);
        const triggerLabel = event.triggerType === 'validation' ? 'VALIDATION' : 'INVALIDATION';
        const actionHint =
            event.triggerType === 'validation'
                ? 'update rencana saat profit/konfirmasi setup'
                : 'defensive action karena setup terancam';
        const note = event.note ? `\nNote: ${event.note}` : '';
        const autoPrompt =
            `[AUTO_TRIGGER ${triggerLabel}] ${event.symbol} ${event.timeframe}\n` +
            `Side: ${event.side || 'unknown'}\n` +
            `Trigger level hit: ${event.triggerLevel}\n` +
            `Current price: ${event.currentPrice}\n` +
            `Tolong generate decision message baru otomatis untuk ${actionHint}.\n` +
            `Gunakan flow Think -> Act -> Observe, cek data terbaru (price/teknikal/funding/orderbook/news bila perlu), ` +
            `lalu berikan langkah next action + risk control singkat.${note}`;

        const autoToolStates = {
            plan_mode: true,
            reasoning_effort: 'high',
            execution: false,
            write: false,
            memory_enabled: true,
            market_symbol: event.symbol,
            timeframe: [event.timeframe],
            auto_trigger_source: 'tradingview'
        };

        await handleSendMessage(autoPrompt, modelId, [], autoToolStates);
    };

    const handleRenameSession = async (sessionId: string, newName: string) => {
        const isInbox = inboxSessions.some(s => s.id === sessionId);
        if (isInbox) {
            setInboxSessions(prev => prev.map(s => s.id === sessionId ? { ...s, title: newName } : s));
        } else {
            setWorkspaces(prev => prev.map(ws => ({
                ...ws,
                sessions: ws.sessions.map(s => s.id === sessionId ? { ...s, title: newName } : s)
            })));
        }

        // Sync with backend if it's a real session
        if (!sessionId.startsWith('new-chat')) {
            try {
                const token = await getAccessToken();
                if (token) {
                    await agentService.renameSession(sessionId, newName, token, walletAddress);
                }
            } catch (err) {
                console.error("Failed to rename session in backend", err);
            }
        }
    };

    const handleDeleteSession = async (sessionId: string) => {
        // Optimistic UI
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

        // Backend sync
        if (!sessionId.startsWith('new-chat')) {
            try {
                const token = await getAccessToken();
                if (token) {
                    await agentService.deleteSession(sessionId, token, walletAddress);
                }
            } catch (err) {
                console.error("Failed to delete session", err);
            }
        }
    };

    const handleCreateWorkspace = async (name: string) => {
        if (!name || name.trim() === '') {
            alert("pembikinan workspace gagal: Nama tidak boleh kosong");
            return;
        }

        try {
            const token = await getAccessToken();
            if (!token) return;

            const tempId = `ws-${Date.now()}`;
            const result = await agentService.createWorkspace(name.trim(), token, tempId, walletAddress);

            if (result.status === 'success') {
                const newWs: Workspace = {
                    id: result.id || tempId,
                    name: name,
                    isExpanded: true,
                    sessions: []
                };
                setWorkspaces(prev => [...prev, newWs]);
            }
        } catch (err: any) {
            console.error("Failed to create workspace", err);
            if (err.response) {
                console.error("Server response:", err.response.data);
                alert(`Creation failed: ${JSON.stringify(err.response.data)}`);
            } else {
                alert(`Creation failed: ${err.message}`);
            }
        }
    };

    const handleToggleWorkspaceExpand = async (workspaceId: string, expanded: boolean) => {
        // Optimistic
        setWorkspaces(prev => prev.map(ws => ws.id === workspaceId ? { ...ws, isExpanded: expanded } : ws));

        try {
            const token = await getAccessToken();
            if (token) {
                await agentService.updateWorkspace(workspaceId, { is_expanded: expanded }, token, walletAddress);
            }
        } catch (err) {
            console.error("Failed to toggle workspace", err);
        }
    };

    const handleMoveSessionToWorkspace = async (sessionId: string, targetWorkspaceId: string | null) => {
        if (sessionId.startsWith('new-chat')) return;

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
        const targetId = targetWorkspaceId === 'inbox' ? null : targetWorkspaceId;
        const sourceId = sourceWorkspaceId === 'inbox' ? null : sourceWorkspaceId;

        if (sourceId === targetId) {
            console.log(`Move skipped: Source ${sourceId} same as Target ${targetId}`);
            return;
        }

        console.log(`Moving session ${sessionId} from ${sourceWorkspaceId} to ${targetWorkspaceId}`);

        // Optimistic UI Update
        if (sourceWorkspaceId === 'inbox') {
            setInboxSessions(prev => prev.filter(s => s.id !== sessionId));
        } else {
            setWorkspaces(prev => prev.map(ws => ws.id === sourceId ? {
                ...ws, sessions: ws.sessions.filter(s => s.id !== sessionId)
            } : ws));
        }

        if (targetWorkspaceId === 'inbox') {
            setInboxSessions(prev => [sessionToMove!, ...prev]);
        } else {
            setWorkspaces(prev => prev.map(ws => ws.id === targetWorkspaceId ? {
                ...ws, isExpanded: true, sessions: [sessionToMove!, ...ws.sessions]
            } : ws));
        }

        // Backend Sync
        try {
            const token = await getAccessToken();
            if (token) {
                await agentService.moveSession(sessionId, targetId, token, walletAddress);
            }
        } catch (err) {
            console.error("Failed to move session", err);
            // Optional: Revert UI on error
        }
    };

    const handleDeleteWorkspace = async (workspaceId: string) => {
        // Need to add backend endpoint for delete workspace if needed, 
        // for now just UI cleanup or move sessions to inbox first.
        setWorkspaces(prev => prev.filter(ws => ws.id !== workspaceId));
    };

    const handleUpdateWorkspace = async (workspaceId: string, data: any) => {
        setWorkspaces(prev => prev.map(ws => ws.id === workspaceId ? { ...ws, ...data } : ws));
        try {
            const token = await getAccessToken();
            if (token) {
                await agentService.updateWorkspace(workspaceId, data, token, walletAddress);
            }
        } catch (err) {
            console.error("Failed to update workspace", err);
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

    const mergeIndicators = (base: string[] = [], extra?: string[]) => {
        if (!extra || extra.length === 0) return base;
        const merged = new Set(base);
        extra.forEach(i => merged.add(i));
        return Array.from(merged);
    };

    const handleOpenChart = (symbol: string = "BTC/USDT", indicators?: string[], timeframe?: string) => {
        const existingTab = chartTabs.find(t => t.symbol === symbol);
        if (existingTab) {
            const mergedIndicators = mergeIndicators(existingTab.indicators || [], indicators);
            const nextInterval = timeframe || existingTab.interval || '1D';
            if ((indicators && mergedIndicators.length !== existingTab.indicators.length) || (timeframe && nextInterval !== existingTab.interval)) {
                setChartTabs(prev => prev.map(t => t.symbol === symbol ? { ...t, indicators: mergedIndicators, interval: nextInterval } : t));
            }
            setActiveArtifact({ type: 'chart', data: { ...existingTab, indicators: mergedIndicators, interval: nextInterval } });
            // Restore state to Main Chart
            if (onRestoreChartState) {
                onRestoreChartState({
                    interval: nextInterval,
                    indicators: mergedIndicators
                });
            }
        } else {
            const newTab = { symbol, interval: timeframe || '1D', indicators: indicators || [] };
            // setChartTabs handled by effect if needed, but for instant UI response:
            // Actually, the effect syncs activeArtifact -> tabs. 
            // But if we want to switch immediately with valid data:
            setActiveArtifact({ type: 'chart', data: newTab });
            if (onRestoreChartState) {
                onRestoreChartState({
                    interval: newTab.interval,
                    indicators: newTab.indicators
                });
            }
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

    const handleEditMessage = (
        sessionId: string,
        messageId: string,
        newContent: string,
        modelId?: string,
        reasoningEffort?: string,
        toolStates?: any
    ) => {
        const history = sessionMessages[sessionId] || [];
        const msgIndex = history.findIndex(m => m.id === messageId);
        if (msgIndex === -1) return;

        const croppedHistory = history.slice(0, msgIndex);

        setSessionMessages(prev => ({
            ...prev,
            [sessionId]: [...croppedHistory, {
                id: messageId,
                role: 'user',
                content: newContent,
                timestamp: Date.now()
            }]
        }));

        if (!modelId) {
            setSessionMessages(prev => ({
                ...prev,
                [sessionId]: [
                    ...(prev[sessionId] || []),
                    {
                        id: `error-${Date.now()}`,
                        role: 'assistant',
                        content: 'Maaf, chat gagal. Model belum dipilih.',
                        timestamp: Date.now()
                    }
                ]
            }));
            return;
        }
        generateAssistantResponse(sessionId, newContent, modelId, croppedHistory, reasoningEffort, toolStates);
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

    const activeSession = getSessionById(activeSessionId);

    // Reset artifact when session changes
    const handleRegenerateResponse = (
        assistantMessageId: string,
        modelId?: string,
        reasoningEffort?: string,
        toolStates?: any
    ) => {
        const history = sessionMessages[activeSessionId] || [];
        const msgIndex = history.findIndex(m => m.id === assistantMessageId);
        if (msgIndex === -1) return;

        const userMsg = history[msgIndex - 1];
        if (!userMsg || userMsg.role !== 'user') return;

        const croppedHistory = history.slice(0, msgIndex - 1);

        setSessionMessages(prev => ({
            ...prev,
            [activeSessionId]: [...croppedHistory, userMsg]
        }));

        if (!modelId) {
            setSessionMessages(prev => ({
                ...prev,
                [activeSessionId]: [
                    ...(prev[activeSessionId] || []),
                    {
                        id: `error-${Date.now()}`,
                        role: 'assistant',
                        content: 'Maaf, chat gagal. Model belum dipilih.',
                        timestamp: Date.now()
                    }
                ]
            }));
            return;
        }
        generateAssistantResponse(activeSessionId, userMsg.content, modelId, croppedHistory, reasoningEffort, toolStates);
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
        setShowSettings(false);
    };

    const handleNewChat = () => {
        const newId = `new-chat-${Date.now()}`;
        const newSession: Session = { id: newId, title: 'New Chat', type: 'chat', isEditing: false };
        setInboxSessions(prev => dedupeSessionsById([newSession, ...prev]));
        setActiveSessionId(newId);
        setIsMinimized(true);
        setShowSettings(false);
    };

    return (
        <div className={`${styles.layoutContainer} ${compact ? styles.compact : ''} `}>
            {!showSettings && (
                <AutosSidebar
                    activeSessionId={activeSessionId}
                    onSessionChange={handleSessionChange}
                    isMinimized={isMinimized}
                    onToggleMinimize={() => setIsMinimized(!isMinimized)}
                    workspaces={workspaces}
                    setWorkspaces={setWorkspaces}
                    inboxSessions={inboxSessions}
                    setInboxSessions={setInboxSessions}
                    onCreateWorkspace={handleCreateWorkspace}
                    onDeleteWorkspace={handleDeleteWorkspace}
                    onUpdateWorkspace={handleUpdateWorkspace}
                    onToggleWorkspaceExpand={handleToggleWorkspaceExpand}
                    onMoveSession={handleMoveSessionToWorkspace}
                    onDeleteSession={handleDeleteSession}
                    onRenameSession={handleRenameSession}
                    forceMobileMode={forceMobileMode && !compact}
                    hideToggle={!!activeArtifact || isMinimized}
                />
            )}

            <div className={`${styles.contentArea} ${isMinimized && !activeArtifact ? styles.contentCentered : ''} `} style={{ padding: 0, position: 'relative' }}>

                {isMinimized && !activeArtifact && !showSettings && (
                    <div className={styles.floatingHeaderActions}>
                        <button
                            className={styles.headerIconButton}
                            onClick={() => setIsMinimized(false)}
                            title="Expand sidebar"
                        >
                            <img src={sidebarIcon} alt="Sidebar" />
                        </button>

                        <div className={styles.rightHeaderActions}>
                            <button
                                className={styles.headerIconButton}
                                onClick={handleNewChat}
                                title="New Chat Session"
                            >
                                <img src={plusIcon} alt="New Chat" />
                            </button>
                            <button
                                className={styles.headerIconButton}
                                onClick={() => setShowSettings(true)}
                                title="Model"
                            >
                                <img src={modelIcon} alt="Model" />
                            </button>
                        </div>
                    </div>
                )}

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
                                            background: activeArtifact.data?.symbol === tab.symbol ? 'rgba(59, 32, 48, 0.1)' : 'transparent',
                                            color: activeArtifact.data?.symbol === tab.symbol ? '#3B2030' : '#A77590',
                                            borderBottomColor: activeArtifact.data?.symbol === tab.symbol ? '#3B2030' : 'transparent',
                                            border: '1px solid',
                                            borderColor: activeArtifact.data?.symbol === tab.symbol ? 'rgba(59, 32, 48, 0.3)' : 'transparent',
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
                                                background: 'transparent',
                                                border: '1px solid #3B2030',
                                                borderRadius: '8px',
                                                color: '#3B2030',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                opacity: 0.6,
                                                padding: '2px',
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
                                onTradeDecisionTrigger={handleTradeDecisionTrigger}
                                theme="dark"
                                height="100%"
                                hideTopToolbar={true}
                                hideSideToolbar={true}
                            />
                        </div>
                    </div>
                ) : (
                    <div className={`${isMinimized ? styles.contentCentered : ''} `} style={{ height: '100%', display: 'flex', flexDirection: 'column', width: '100%', maxWidth: isMinimized ? '1300px' : 'none', margin: isMinimized ? '0 auto' : '0' }}>
                        {showSettings ? (
                            <AutosSettings onBack={() => setShowSettings(false)} />
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
                                currentTimeframe={chartState?.timeframe}
                                currentIndicators={chartState?.indicators || []}
                                onToggleMinimize={() => setIsMinimized(!isMinimized)}
                                isMinimized={isMinimized}
                                onNewChat={handleNewChat}
                                onStop={handleStopGeneration}
                            />
                        )}
                    </div>
                )}

            </div>
        </div >
    );
};

export default Autos;


