import React, { useState, useRef, useEffect } from 'react';
import styles from './ChatInterface.module.css';
import type { Workspace, Message } from '../../types/autos';


interface ChatInterfaceProps {
    activeSessionId?: string;
    activeSessionTitle?: string;
    messages: Message[];
    onSendMessage: (content: string, attachments?: File[], toolStates?: any) => void;
    isTyping: boolean;
    workspaces?: Workspace[];
    onRenameSession?: (sessionId: string, newName: string) => void;
    onDeleteSession?: (sessionId: string) => void;
    onMoveSessionToWorkspace?: (sessionId: string, workspaceId: string) => void;
    onOpenChart?: (symbol?: string) => void;
    onEditMessage?: (sessionId: string, messageId: string, newContent: string) => void;
    onRegenerateResponse?: (messageId: string) => void;
    onFeedback?: (messageId: string, feedback: 'like' | 'dislike' | null) => void;
    currentSymbol?: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
    activeSessionId,
    activeSessionTitle,
    messages,
    onSendMessage,
    isTyping,
    workspaces = [],
    onRenameSession,
    onDeleteSession,
    onMoveSessionToWorkspace,
    onOpenChart,
    onEditMessage,
    onRegenerateResponse,
    onFeedback,
    currentSymbol
}) => {
    const [inputValue, setInputValue] = useState('');



    // Model Selection State
    const [selectedModel, setSelectedModel] = useState('Claude Sonnet 4.5');
    const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
    const [expandedModelId, setExpandedModelId] = useState<string | null>(null);
    const [effortLevel, setEffortLevel] = useState('High');
    const [isEffortMenuOpen, setIsEffortMenuOpen] = useState(false);
    const [voiceLanguage, setVoiceLanguage] = useState('en-US'); // Default fallback
    const [isVoiceLanguageMenuOpen, setIsVoiceLanguageMenuOpen] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<any>(null);

    const languages = [
        { code: 'en-US', label: 'English', short: 'EN' },
        { code: 'id-ID', label: 'Indonesia', short: 'ID' },
        { code: 'zh-CN', label: 'Chinese', short: 'ZH' },
        { code: 'ja-JP', label: 'Japanese', short: 'JP' },
        { code: 'ko-KR', label: 'Korean', short: 'KO' },
        { code: 'es-ES', label: 'Spanish', short: 'ES' },
        { code: 'fr-FR', label: 'French', short: 'FR' },
        { code: 'de-DE', label: 'German', short: 'DE' },
        { code: 'ru-RU', label: 'Russian', short: 'RU' },
        { code: 'pt-PT', label: 'Portuguese', short: 'PT' },
    ];

    // Auto-detect language on mount (with persistence)
    useEffect(() => {
        const savedLang = localStorage.getItem('chat_voice_language');
        if (savedLang) {
            setVoiceLanguage(savedLang);
            return;
        }

        const browserLang = navigator.language;
        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

        // 1. Try timezone deduction
        if (timeZone && (timeZone.startsWith('Asia/Jakarta') || timeZone.startsWith('Asia/Pontianak') || timeZone.startsWith('Asia/Makassar') || timeZone.startsWith('Asia/Jayapura'))) {
            setVoiceLanguage('id-ID');
            return;
        }

        // 2. Try browser language matching
        const found = languages.find(l =>
            l.code === browserLang ||
            l.code.startsWith(browserLang.split('-')[0])
        );

        if (found) {
            setVoiceLanguage(found.code);
        }
    }, []);

    // Tools State
    const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false);
    const [toolStates, setToolStates] = useState({
        execution: false,
        write: false,
        timeframe: ['1D'],
        indicators: [] as string[]
    });
    const [activeToolView, setActiveToolView] = useState<'main' | 'indicators' | 'timeframe'>('main');
    const [indicatorSearch, setIndicatorSearch] = useState('');
    const toolsRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [attachments, setAttachments] = useState<File[]>([]);
    const [expandedImage, setExpandedImage] = useState<File | null>(null);

    // Editing State
    const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const handleEditClick = (msg: Message) => {
        setEditingMessageId(msg.id);
        setEditValue(msg.content);
    };

    const handleCancelEdit = () => {
        setEditingMessageId(null);
        setEditValue('');
    };

    const handleSaveEdit = (msgId: string) => {
        if (onEditMessage && activeSessionId) {
            onEditMessage(activeSessionId, msgId, editValue);
            // Optionally trigger regeneration here if desired, but for now just edit
        }
        setEditingMessageId(null);
        setEditValue('');
    };

    const handleRegenerate = (content: string) => {
        onSendMessage(content, [], toolStates);
    };

    const handleCopy = (content: string, id: string) => {
        navigator.clipboard.writeText(content);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 1500);
    };

    const formatTime = (timestamp?: number) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }).replace(':', '.');
    };


    const timeframes = ['1m', '5m', '15m', '1H', '4H', '1D', '1W'];
    const availableIndicators = ['RSI', 'MACD', 'Bollinger Bands', 'Moving Average', 'Volume', 'Stochastic', 'ATR', 'Ichimoku Cloud', 'CCI', 'Parabolic SAR'];

    // Close menus on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (modelSectionRef.current && !modelSectionRef.current.contains(event.target as Node)) {
                setIsModelMenuOpen(false);
                setExpandedModelId(null);
            }
            if (toolsRef.current && !toolsRef.current.contains(event.target as Node)) {
                setIsToolsMenuOpen(false);
            }
            if (!event.target) return; // Basic null check
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const toggleVoiceInput = () => {
        if (isListening) {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
            setIsListening(false);
            return;
        }

        if (!('webkitSpeechRecognition' in window)) {
            alert("Speech recognition is not supported in this browser.");
            return;
        }

        const recognition = new (window as any).webkitSpeechRecognition();
        recognitionRef.current = recognition;
        recognition.continuous = true; // Enable continuous listening
        recognition.interimResults = true;
        recognition.lang = voiceLanguage;

        recognition.onstart = () => {
            setIsListening(true);
            setInputValue(''); // Reset input on start as requested
        };

        recognition.onresult = (event: any) => {
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                }
            }
            if (finalTranscript) {
                setInputValue(prev => prev + (prev ? ' ' : '') + finalTranscript);
            }
        };

        recognition.onerror = (event: any) => {
            console.error("Speech recognition error", event.error);
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognition.start();
    };

    const handleVoiceContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsVoiceLanguageMenuOpen(!isVoiceLanguageMenuOpen);
    };
    const modelSectionRef = useRef<HTMLDivElement>(null);

    const toggleModelMenu = () => {
        setIsModelMenuOpen(!isModelMenuOpen);
    };

    // Thought process state
    const [expandedThoughtIds, setExpandedThoughtIds] = useState<Set<string>>(new Set());
    const [expandedStepKeys, setExpandedStepKeys] = useState<Set<string>>(new Set());

    const toggleThoughts = (messageId: string) => {
        setExpandedThoughtIds(prev => {
            const next = new Set(prev);
            if (next.has(messageId)) {
                next.delete(messageId);
            } else {
                next.add(messageId);
            }
            return next;
        });
    };

    const toggleStep = (messageId: string, index: number) => {
        const key = `${messageId}-${index}`;
        setExpandedStepKeys(prev => {
            const next = new Set(prev);
            if (next.has(key)) {
                next.delete(key);
            } else {
                next.add(key);
            }
            return next;
        });
    };

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);



    const handleSend = () => {
        if (!inputValue.trim() && attachments.length === 0) return;

        onSendMessage(inputValue, attachments, toolStates);
        setInputValue('');
        setAttachments([]);

        // Reset text area height
        const textarea = document.querySelector(`.${styles.inputField}`) as HTMLTextAreaElement;
        if (textarea) textarea.style.height = 'auto';
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };



    return (
        <div className={styles.chatInterfaceContainer}>
            {/* Header Removed */}

            {/* Center Content */}
            <div className={styles.centerContent}>

                {/* Greeting - Only show if no messages */}
                {messages.length === 0 && (
                    <div className={styles.greetingContainer}>
                        <img
                            src="/src/assets/Icons/Osmo-Logos.png"
                            alt="Osmo"
                            className={styles.centerLogo}
                        />
                    </div>
                )}

                {/* Message List */}
                {messages.length > 0 && (
                    <div className={styles.messageList}>
                        {messages.map((msg) => (
                            <div key={msg.id} className={`${styles.messageItem} ${msg.role === 'user' ? styles.user : styles.assistant}`}>
                                {msg.role === 'user' ? (
                                    <div className={styles.userMessageGroup}>
                                        {/* Edit Mode */}
                                        {editingMessageId === msg.id ? (
                                            <div className={styles.editMessageContainer}>
                                                <textarea
                                                    className={styles.editInput}
                                                    value={editValue}
                                                    onChange={(e) => setEditValue(e.target.value)}
                                                    autoFocus
                                                    spellCheck={false}
                                                    autoComplete="off"
                                                    autoCorrect="off"
                                                />
                                                <div className={styles.editFooter}>
                                                    <div className={styles.editInfo}>
                                                        <span style={{ border: '1px solid #3A2530', width: '14px', height: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontSize: '10px' }}>i</span>
                                                        Editing this message will create a new conversation branch.
                                                    </div>
                                                    <div className={styles.editButtons}>
                                                        <button className={styles.editCancelBtn} onClick={handleCancelEdit}>Cancel</button>
                                                        <button className={styles.editSaveBtn} onClick={() => handleSaveEdit(msg.id)}>Save</button>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            /* Normal Display Mode */
                                            <div className={styles.userBubbleWrapper}>
                                                <div className={`${styles.bubble} ${styles.userBubble}`}>
                                                    {msg.content}
                                                </div>

                                                {/* Action Bar (Time + Icons) */}
                                                <div className={styles.userActionBar}>
                                                    {msg.timestamp && (
                                                        <span className={styles.messageTime}>{formatTime(msg.timestamp)}</span>
                                                    )}

                                                    {/* Regenerate */}
                                                    <button className={styles.userActionBtn} title="Regenerate" onClick={() => handleRegenerate(msg.content)}>
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <path d="M23 4v6h-6" />
                                                            <path d="M1 20v-6h6" />
                                                            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                                                        </svg>
                                                    </button>

                                                    {/* Edit */}
                                                    <button className={styles.userActionBtn} title="Edit Prompt" onClick={() => handleEditClick(msg)}>
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                        </svg>
                                                    </button>

                                                    {/* Copy */}
                                                    <button className={styles.userActionBtn} title="Copy" onClick={() => handleCopy(msg.content, msg.id)}>
                                                        {copiedId === msg.id ? (
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <polyline points="20 6 9 17 4 12" />
                                                            </svg>
                                                        ) : (
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                                            </svg>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className={`${styles.bubble} ${styles.assistantBubble}`}>
                                        {/* Thinking Block */}
                                        {msg.thoughts && msg.thoughts.length > 0 && (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                                                <div
                                                    className={styles.thinkingBlock}
                                                    onClick={() => toggleThoughts(msg.id)}
                                                    style={expandedThoughtIds.has(msg.id) ? { borderRadius: '8px 8px 0 0', borderBottom: 'none' } : {}}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        {msg.isThinking ? (
                                                            <>
                                                                <svg className={styles.loadingSpinner} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                                                                </svg>
                                                                <span style={{ color: '#A77590' }}>Thinking Process</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5D5FEF" strokeWidth="2">
                                                                    <path d="M12 2a10 10 0 1 0 10 10H12V2z" />
                                                                    <path d="M12 2a10 10 0 0 1 10 10" />
                                                                    {/* Simple quarter circle or brain metaphor */}
                                                                </svg>
                                                                <span style={{ color: '#5D5FEF' }}>Thought Process</span>
                                                            </>
                                                        )}
                                                    </div>
                                                    <svg
                                                        width="16"
                                                        height="16"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke={msg.isThinking ? "#A77590" : "#5D5FEF"}
                                                        strokeWidth="2"
                                                        style={{ transform: expandedThoughtIds.has(msg.id) ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', marginLeft: 'auto' }}
                                                    >
                                                        <path d="M6 9l6 6 6-6" />
                                                    </svg>
                                                </div>
                                                {expandedThoughtIds.has(msg.id) && (
                                                    <div className={styles.thinkingContent}>
                                                        {/* Tree Connector Line */}
                                                        <div className={styles.stepTreeContainer}>
                                                            <div className={styles.stepTreeLine}></div>
                                                        </div>

                                                        {msg.thoughts.map((stepItem, idx) => {
                                                            const stepKey = `${msg.id}-${idx}`;
                                                            const isStepExpanded = expandedStepKeys.has(stepKey);

                                                            // Handle legacy string steps or new object steps
                                                            const isObject = typeof stepItem === 'object';
                                                            const stepType = isObject ? stepItem.type : 'text';
                                                            const stepTitle = isObject ? stepItem.title : stepItem;
                                                            const stepResults = isObject && stepItem.type === 'browsing' ? stepItem.results : undefined;

                                                            return (
                                                                <div key={idx} style={{ borderBottom: idx === msg.thoughts!.length - 1 ? 'none' : '1px solid #3A2530' }}>
                                                                    <div
                                                                        className={styles.thinkingStep}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            toggleStep(msg.id, idx);
                                                                        }}
                                                                        style={{ borderBottom: 'none' }}
                                                                    >
                                                                        {stepType === 'browsing' ? (
                                                                            <div className={styles.browsingHeader}>
                                                                                <div className={styles.browsingLeft}>
                                                                                    {/* Globe Icon for Browsing */}
                                                                                    <div className={styles.stepIcon}>
                                                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                                            <circle cx="12" cy="12" r="10" />
                                                                                            <path d="M2 12h20" />
                                                                                            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                                                                                        </svg>
                                                                                    </div>
                                                                                    <span>{stepTitle}</span>
                                                                                </div>
                                                                                <div className={styles.stepResultCount}>
                                                                                    {stepResults ? `${stepResults.length} results` : ''}
                                                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: isStepExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                                                                                        <path d="M6 9l6 6 6-6" />
                                                                                    </svg>
                                                                                </div>
                                                                            </div>
                                                                        ) : stepType === 'code' ? (
                                                                            // Code Step
                                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
                                                                                <div className={styles.stepIcon}>
                                                                                    {/* Code Icon */}
                                                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5D5FEF" strokeWidth="2">
                                                                                        <polyline points="16 18 22 12 16 6" />
                                                                                        <polyline points="8 6 2 12 8 18" />
                                                                                    </svg>
                                                                                </div>
                                                                                <span style={{ flex: 1 }}>{stepTitle}</span>
                                                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3A2530" strokeWidth="2" style={{ transform: isStepExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                                                                                    <path d="M6 9l6 6 6-6" />
                                                                                </svg>
                                                                            </div>
                                                                        ) : (
                                                                            // Text Step
                                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
                                                                                <div className={styles.stepIcon}>
                                                                                    {/* Dot Icon for Text */}
                                                                                    <div style={{ width: '6px', height: '6px', backgroundColor: '#3A2530', borderRadius: '50%' }}></div>
                                                                                </div>
                                                                                <span style={{ flex: 1 }}>{stepTitle}</span>
                                                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3A2530" strokeWidth="2" style={{ transform: isStepExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                                                                                    <path d="M6 9l6 6 6-6" />
                                                                                </svg>
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    {/* Expanded Content */}
                                                                    {isStepExpanded && (
                                                                        <div className={styles.stepDetail}>
                                                                            {stepType === 'browsing' && stepResults ? (
                                                                                <div className={styles.resultList}>
                                                                                    {stepResults.map((result, rIdx) => (
                                                                                        <a key={rIdx} href={result.url} className={styles.resultItem} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                                                                                            <img src={result.icon || `https://www.google.com/s2/favicons?domain=${result.domain}`} alt="" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                                                                                            <div className={styles.resultText}>
                                                                                                <div className={styles.resultTitle}>{result.title}</div>
                                                                                                <div className={styles.resultDomain}>{result.domain}</div>
                                                                                            </div>
                                                                                        </a>
                                                                                    ))}
                                                                                </div>
                                                                            ) : stepType === 'code' ? (
                                                                                <div style={{ marginLeft: '28px', marginTop: '8px', background: '#12000A', padding: '12px', borderRadius: '6px', fontSize: '12px', fontFamily: 'monospace', color: '#A77590', border: '1px solid #3A2530' }}>
                                                                                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{(typeof stepItem === 'object' && stepItem.content) || 'Writing code...'}</pre>
                                                                                </div>
                                                                            ) : (
                                                                                // Dummy text detail for text steps
                                                                                <div style={{ marginLeft: '28px' }}>
                                                                                    This is a detailed explanation of the step "{stepTitle}".
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Response Text */}
                                        <div className={styles.responseContent}>
                                            {msg.content}
                                        </div>

                                        {/* Artifact Card (if present) */}
                                        {msg.artifact && (
                                            <div className={styles.artifactCard} onClick={() => onOpenChart && onOpenChart(msg.artifact?.data?.symbol)}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <div className={styles.artifactIcon}>
                                                        {msg.artifact.type === 'chart' ? (
                                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <line x1="18" y1="20" x2="18" y2="10" />
                                                                <line x1="12" y1="20" x2="12" y2="4" />
                                                                <line x1="6" y1="20" x2="6" y2="14" />
                                                            </svg>
                                                        ) : (
                                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                                                <polyline points="14 2 14 8 20 8" />
                                                            </svg>
                                                        )}
                                                    </div>
                                                    <div className={styles.artifactInfo}>
                                                        <span className={styles.artifactTitle}>
                                                            {msg.artifact.type === 'chart' && currentSymbol
                                                                ? `${currentSymbol} Analysis Chart`
                                                                : msg.artifact.title}
                                                        </span>
                                                        <span className={styles.artifactType}>Interactive {msg.artifact.type === 'chart' ? 'Chart' : 'Artifact'}</span>
                                                    </div>
                                                </div>
                                                {/* Open Icon */}
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#A77590" strokeWidth="2">
                                                    <path d="M15 3h6v6" />
                                                    <path d="M10 14L21 3" />
                                                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                                </svg>
                                            </div>
                                        )}

                                        {/* Action Buttons */}
                                        {/* Action Buttons */}
                                        <div className={styles.actionRow}>
                                            <button
                                                className={styles.actionBtn}
                                                title="Copy"
                                                onClick={() => handleCopy(msg.content, msg.id)}
                                            >
                                                {copiedId === msg.id ? (
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <polyline points="20 6 9 17 4 12" />
                                                    </svg>
                                                ) : (
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                                    </svg>
                                                )}
                                            </button>
                                            <button
                                                className={`${styles.actionBtn} ${msg.feedback === 'like' ? styles.activeFeedback : ''}`}
                                                title="Good response"
                                                onClick={() => onFeedback && onFeedback(msg.id, msg.feedback === 'like' ? null : 'like')}
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={msg.feedback === 'like' ? "#5D5FEF" : "currentColor"} strokeWidth="2">
                                                    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                                                </svg>
                                            </button>
                                            <button
                                                className={`${styles.actionBtn} ${msg.feedback === 'dislike' ? styles.activeFeedback : ''}`}
                                                title="Bad response"
                                                onClick={() => onFeedback && onFeedback(msg.id, msg.feedback === 'dislike' ? null : 'dislike')}
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={msg.feedback === 'dislike' ? "#FF4B4B" : "currentColor"} strokeWidth="2">
                                                    <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
                                                </svg>
                                            </button>
                                            <button
                                                className={styles.actionBtn}
                                                title="Regenerate"
                                                onClick={() => onRegenerateResponse && onRegenerateResponse(msg.id)}
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M1 4v6h6" />
                                                    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                                                </svg>
                                            </button>
                                        </div>

                                        {/* Assistant Logo (Star) */}
                                        <div className={styles.assistantLogo}>
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M12 2L15.09 9.26L22 12L15.09 14.74L12 22L8.91 14.74L2 12L8.91 9.26L12 2Z" />
                                            </svg>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                        {isTyping && (
                            <div className={`${styles.messageItem} ${styles.assistant}`}>
                                <div className={styles.assistantBubble} style={{ opacity: 0.7, paddingLeft: '8px' }}>
                                    Thinking...
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                )}

                {/* Input Area */}
                <div className={`${styles.inputWrapper} ${isToolsMenuOpen ? styles.toolsOpen : ''} ${isModelMenuOpen ? styles.modelOpen : ''}`}>
                    <div className={styles.textWrapper}>
                        {attachments.length > 0 && (
                            <div style={{ display: 'flex', gap: '8px', paddingBottom: '12px', overflowX: 'auto' }}>
                                {attachments.map((file, index) => (
                                    <div key={index} style={{ position: 'relative', width: '60px', height: '60px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #3A2530', flexShrink: 0, backgroundColor: '#12000A' }}>
                                        {file.type.startsWith('image/') ? (
                                            <img
                                                src={URL.createObjectURL(file)}
                                                alt="preview"
                                                style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }}
                                                onClick={() => setExpandedImage(file)}
                                            />
                                        ) : (
                                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFE1F2', fontSize: '10px', flexDirection: 'column' }}>
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                                    <polyline points="14 2 14 8 20 8"></polyline>
                                                </svg>
                                                <span style={{ fontSize: '8px', marginTop: '2px', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '0 2px' }}>{file.name}</span>
                                            </div>
                                        )}
                                        <div
                                            onClick={() => setAttachments(prev => prev.filter((_, i) => i !== index))}
                                            style={{ position: 'absolute', top: 0, right: 0, width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', color: 'white', cursor: 'pointer', borderBottomLeftRadius: '6px' }}
                                        >
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                                <line x1="6" y1="6" x2="18" y2="18"></line>
                                            </svg>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <textarea
                            className={styles.inputField}
                            placeholder="Ask osmo to help you trade..."
                            rows={3}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            onInput={(e) => {
                                const target = e.target as HTMLTextAreaElement;
                                target.style.height = 'auto';
                                target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
                            }}
                        />
                    </div>

                    <div className={styles.actionBar}>
                        {/* Tools Section */}
                        <div className={styles.toolSection} ref={toolsRef}>
                            <input
                                type="file"
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                                accept="image/*,application/pdf"
                                multiple
                                onChange={(e) => {
                                    if (e.target.files && e.target.files.length > 0) {
                                        setAttachments(prev => [...prev, ...Array.from(e.target.files!)]);
                                        e.target.value = ''; // Reset input
                                        setIsToolsMenuOpen(false);
                                    }
                                }}
                            />
                            <button
                                className={`${styles.toolButton} ${isToolsMenuOpen ? styles.active : ''}`}
                                onClick={() => setIsToolsMenuOpen(!isToolsMenuOpen)}
                            >
                                <img src="/src/assets/Plus.png" alt="Add" width={18} height={18} />
                                <span>Tools</span>
                            </button>

                            {/* Tools Dropdown Menu */}
                            {isToolsMenuOpen && (
                                <div className={styles.toolsMenu}>
                                    {activeToolView === 'main' ? (
                                        <div style={{ flex: 1, overflowY: 'auto' }}>
                                            {/* 1. Attachment */}
                                            <div className={styles.toolItem} onClick={() => fileInputRef.current?.click()}>
                                                <div className={styles.toolIconWrapper}>
                                                    <img src="/src/assets/Icons/Attechment photo or doc.png" alt="Attach" width={18} height={18} />
                                                </div>
                                                <span>Attachment</span>
                                            </div>

                                            {/* 2. Execution */}
                                            <div className={styles.toolItem} onClick={() => setToolStates(prev => ({ ...prev, execution: !prev.execution }))}>
                                                <div className={styles.toolIconWrapper}>
                                                    <img src="/src/assets/Icons/Exexution.png" alt="Execution" width={18} height={18} />
                                                </div>
                                                <span>Auto Execution</span>
                                                <div className={`${styles.toggleSwitch} ${toolStates.execution ? styles.checked : ''}`}></div>
                                            </div>

                                            {/* 3. Indicators (Nested Page) */}
                                            <div className={styles.toolItem} onClick={() => setActiveToolView('indicators')}>
                                                <div className={styles.toolIconWrapper}>
                                                    <img src="/src/assets/Icons/Indikator.png" alt="Indicators" width={18} height={18} />
                                                </div>
                                                <span>Indicators</span>
                                                <span className={styles.toolValue}>{toolStates.indicators.length > 0 ? `${toolStates.indicators.length} Active` : ''}</span>
                                                <span className={styles.toolArrow}>›</span>
                                            </div>

                                            {/* 4. Timeframe */}
                                            <div className={styles.toolItem} onClick={() => setActiveToolView('timeframe')}>
                                                <div className={styles.toolIconWrapper}>
                                                    <img src="/src/assets/Icons/Time frame.png" alt="Timeframe" width={18} height={18} />
                                                </div>
                                                <span>Timeframe</span>
                                                <span className={styles.toolValue}>{Array.isArray(toolStates.timeframe) && toolStates.timeframe.length > 0 ? `${toolStates.timeframe.length} Active` : ''}</span>
                                                <span className={styles.toolArrow}>›</span>
                                            </div>

                                            {/* 5. Write Permission */}
                                            <div className={styles.toolItem} onClick={() => setToolStates(prev => ({ ...prev, write: !prev.write }))}>
                                                <div className={styles.toolIconWrapper}>
                                                    <img src="/src/assets/Icons/Write-tradingview.png" alt="Write" width={18} height={18} />
                                                </div>
                                                <span>Allow Write</span>
                                                <div className={`${styles.toggleSwitch} ${toolStates.write ? styles.checked : ''}`}></div>
                                            </div>
                                        </div>
                                    ) : activeToolView === 'indicators' ? (
                                        /* INDICATORS SUB-PAGE */
                                        <div className={styles.toolSubPage}>
                                            <div className={styles.toolPageHeader}>
                                                <button className={styles.backButton} onClick={() => setActiveToolView('main')}>
                                                    ‹
                                                </button>
                                                <span>Select Indicators</span>
                                            </div>
                                            <div className={styles.toolSearch}>
                                                <input
                                                    type="text"
                                                    placeholder="Search indicators..."
                                                    value={indicatorSearch}
                                                    onChange={(e) => setIndicatorSearch(e.target.value)}
                                                    autoFocus
                                                />
                                            </div>
                                            <div className={styles.toolList}>
                                                {availableIndicators
                                                    .filter(i => i.toLowerCase().includes(indicatorSearch.toLowerCase()))
                                                    .map(indicator => (
                                                        <div
                                                            key={indicator}
                                                            className={styles.toolItem}
                                                            onClick={() => {
                                                                const isActive = toolStates.indicators.includes(indicator);
                                                                setToolStates(prev => ({
                                                                    ...prev,
                                                                    indicators: isActive
                                                                        ? prev.indicators.filter(i => i !== indicator)
                                                                        : [...prev.indicators, indicator]
                                                                }));
                                                            }}
                                                        >
                                                            <span>{indicator}</span>
                                                            {toolStates.indicators.includes(indicator) && (
                                                                <img src="/src/assets/Icons/Check.png" alt="Selected" width={14} height={14} style={{ marginLeft: 'auto' }} />
                                                            )}
                                                        </div>
                                                    ))}
                                            </div>
                                        </div>
                                    ) : (
                                        /* TIMEFRAME SUB-PAGE */
                                        <div className={styles.toolSubPage}>
                                            <div className={styles.toolPageHeader}>
                                                <button className={styles.backButton} onClick={() => setActiveToolView('main')}>
                                                    ‹
                                                </button>
                                                <span>Select Timeframe</span>
                                            </div>
                                            <div className={styles.toolList}>
                                                {timeframes.map(tf => (
                                                    <div
                                                        key={tf}
                                                        className={styles.toolItem}
                                                        onClick={() => {
                                                            // Multi-select logic for timeframe
                                                            setToolStates(prev => {
                                                                const current = Array.isArray(prev.timeframe) ? prev.timeframe : [prev.timeframe];
                                                                const isSelected = current.includes(tf);
                                                                const newTimeframes = isSelected
                                                                    ? current.filter(t => t !== tf)
                                                                    : [...current, tf];
                                                                return { ...prev, timeframe: newTimeframes };
                                                            });
                                                            // e.stopPropagation(); // Keep menu open for multi-select
                                                        }}
                                                    >
                                                        <span>{tf}</span>
                                                        {(Array.isArray(toolStates.timeframe) ? toolStates.timeframe.includes(tf) : toolStates.timeframe === tf) && (
                                                            <img src="/src/assets/Icons/Check.png" alt="Selected" width={14} height={14} style={{ marginLeft: 'auto' }} />
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Model Selector Section (Flex Grow) */}
                        <div className={styles.modelSection} ref={modelSectionRef}>
                            <div
                                className={`${styles.modelSelectorTrigger} ${isModelMenuOpen ? styles.active : ''}`}
                                onClick={toggleModelMenu}
                            >
                                <img
                                    src={
                                        selectedModel === 'Claude Sonnet 4.5' ? "/src/assets/Model logos/Anthropic.svg" :
                                            selectedModel === 'DeepSeek V3.2' ? "/src/assets/Model logos/DeepSeek.png" :
                                                selectedModel === 'Gemini 3' ? "/src/assets/Model logos/GoogleGemini.svg" :
                                                    selectedModel === 'Qwen3 Max' ? "/src/assets/Model logos/Qwen.png" :
                                                        "/src/assets/Model logos/OpenAI.svg"
                                    }
                                    style={selectedModel === 'ChatGPT 5.2' ? { filter: 'invert(1)' } : {}}
                                    alt={selectedModel}
                                    width={16}
                                    height={16}
                                />
                                <span>{selectedModel}</span>
                                <div style={{ flex: 1 }}></div>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: isModelMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                                    <path d="M6 9l6 6 6-6" />
                                </svg>
                            </div>
                            {isModelMenuOpen && (
                                <div className={`${styles.modelMenu} ${styles.menuTop}`}>
                                    {[
                                        { id: 'DeepSeek V3.2', icon: "/src/assets/Model logos/DeepSeek.png" },
                                        { id: 'Gemini 3', icon: "/src/assets/Model logos/GoogleGemini.svg" },
                                        { id: 'Claude Sonnet 4.5', icon: "/src/assets/Model logos/Anthropic.svg" },
                                        { id: 'Qwen3 Max', icon: "/src/assets/Model logos/Qwen.png" },
                                        { id: 'ChatGPT 5.2', icon: "/src/assets/Model logos/OpenAI.svg", style: { filter: 'invert(1)' } }
                                    ].map((model) => (
                                        <div key={model.id} className={styles.modelMenuItemWrapper}>
                                            <div className={styles.modelMenuItem}>
                                                <div
                                                    className={styles.modelMenuItemMain}
                                                    onClick={() => { setSelectedModel(model.id); setIsModelMenuOpen(false); }}
                                                >
                                                    <img src={model.icon} alt={model.id} width={16} height={16} style={model.style} />
                                                    <span>{model.id}</span>
                                                </div>
                                                <div
                                                    className={styles.modelMenuItemChevron}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setExpandedModelId(expandedModelId === model.id ? null : model.id);
                                                    }}
                                                >
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                                                        style={{ transform: expandedModelId === model.id ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                                                        <path d="M6 9l6 6 6-6" />
                                                    </svg>
                                                </div>
                                            </div>

                                            {/* Submenu for Model Config */}
                                            {expandedModelId === model.id && (
                                                <div className={styles.modelSubmenu}>
                                                    <div className={styles.modelInfoContent}>
                                                        <p className={styles.modelDescription}>
                                                            {model.id === 'Claude Sonnet 4.5' ? "Anthropic's smartest model, great for difficult tasks." :
                                                                model.id === 'DeepSeek V3.2' ? "Advanced reasoning model for complex analysis." :
                                                                    model.id === 'Gemini 3' ? "Google's most capable multimodal model." :
                                                                        model.id === 'Qwen3 Max' ? "Top-tier performance on coding and math." :
                                                                            "OpenAI's latest flagship model."}
                                                        </p>

                                                        <div className={styles.modelMetaRow}>
                                                            <div className={styles.modelMetaItem}>
                                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                                                    <line x1="9" y1="3" x2="9" y2="21"></line>
                                                                </svg>
                                                                <span>
                                                                    {model.id === 'Claude Sonnet 4.5' ? "200k context" :
                                                                        model.id === 'Gemini 3' ? "1M context" :
                                                                            "128k context"}
                                                                </span>
                                                            </div>
                                                            <div className={styles.modelMetaItem} style={{ position: 'relative', cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); setIsEffortMenuOpen(!isEffortMenuOpen); }}>
                                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <circle cx="12" cy="12" r="10"></circle>
                                                                    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
                                                                </svg>
                                                                <span>Version: {effortLevel} effort</span>
                                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: '4px', opacity: isEffortMenuOpen && expandedModelId === model.id ? 1 : 0.5 }}>
                                                                    <line x1="4" y1="21" x2="4" y2="14"></line>
                                                                    <line x1="4" y1="10" x2="4" y2="3"></line>
                                                                    <line x1="12" y1="21" x2="12" y2="12"></line>
                                                                    <line x1="12" y1="8" x2="12" y2="3"></line>
                                                                    <line x1="20" y1="21" x2="20" y2="16"></line>
                                                                    <line x1="20" y1="12" x2="20" y2="3"></line>
                                                                    <line x1="1" y1="14" x2="7" y2="14"></line>
                                                                    <line x1="9" y1="8" x2="15" y2="8"></line>
                                                                    <line x1="17" y1="16" x2="23" y2="16"></line>
                                                                </svg>

                                                                {isEffortMenuOpen && expandedModelId === model.id && (
                                                                    <div className={styles.effortDropdown}>
                                                                        {['Low', 'Medium', 'High'].map((level) => (
                                                                            <div
                                                                                key={level}
                                                                                className={styles.effortItem}
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    setEffortLevel(level);
                                                                                    setSelectedModel(model.id);
                                                                                    setIsEffortMenuOpen(false);
                                                                                    setIsModelMenuOpen(false);
                                                                                }}
                                                                            >
                                                                                {level}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Chat toggle action removed as per request */}

                        <div className={styles.iconSection} style={{ position: 'relative' }}>
                            <button
                                className={`${styles.iconAction} ${isListening ? styles.listening : ''}`}
                                onClick={toggleVoiceInput}
                                onContextMenu={handleVoiceContextMenu}
                                title={`Voice Input (${languages.find(l => l.code === voiceLanguage)?.label})\nRight-click to change language`}
                            >
                                {isListening ? (
                                    <div className={styles.recordingIndicator}>
                                        <div className={styles.waveBar}></div>
                                        <div className={styles.waveBar}></div>
                                        <div className={styles.waveBar}></div>
                                        <div className={styles.waveBar}></div>
                                    </div>
                                ) : (
                                    <>
                                        <img src="/src/assets/Voice.png" alt="Voice" width={18} height={18} />
                                        <span className={styles.voiceLanguageIndicator}>
                                            {languages.find(l => l.code === voiceLanguage)?.short}
                                        </span>
                                    </>
                                )}
                            </button>

                            {/* Language Selection Dropdown */}
                            {isVoiceLanguageMenuOpen && (
                                <div className={styles.voiceLanguageMenu}>
                                    {languages.map((lang) => (
                                        <div
                                            key={lang.code}
                                            className={`${styles.voiceLanguageItem} ${voiceLanguage === lang.code ? styles.activeLang : ''}`}
                                            onClick={() => {
                                                setVoiceLanguage(lang.code);
                                                localStorage.setItem('chat_voice_language', lang.code); // Persist choice
                                                setIsVoiceLanguageMenuOpen(false);
                                            }}
                                        >
                                            <span style={{ width: '24px', opacity: 0.7 }}>{lang.short}</span>
                                            <span>{lang.label}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className={styles.sendSection}>
                            <button
                                className={`${styles.sendAction} ${inputValue.trim() || attachments.length > 0 ? styles.active : ''}`}
                                onClick={handleSend}
                                disabled={!(inputValue.trim() || attachments.length > 0)}
                            >
                                <img src="/src/assets/Arrow.png" alt="Send" className={styles.arrowIcon} width={18} height={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            {/* Image Overlay */}
            {expandedImage && (
                <div className={styles.imageOverlayBackdrop} onClick={() => setExpandedImage(null)}>
                    <div className={styles.imageOverlayContent} onClick={(e) => e.stopPropagation()}>
                        <button className={styles.overlayClose} onClick={() => setExpandedImage(null)}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                        <img src={URL.createObjectURL(expandedImage)} alt="Expanded" className={styles.fullImage} />
                        <div className={styles.overlayInfo}>
                            {expandedImage.name}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatInterface;
