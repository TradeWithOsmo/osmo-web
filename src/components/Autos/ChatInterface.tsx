import React, { useState, useRef, useEffect, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import styles from './ChatInterface.module.css';
import type { Workspace, Message, ChatAttachment } from '../../types/autos';
import { usageService } from '../../api/usageService';
import { useWallets, usePrivy } from '@privy-io/react-auth';
import { useUsageStore } from '../../store/useUsageStore';
import brainIcon from '../../assets/Icons/Brain.png';
import TokenIcon from '../MarketDetails/TokenIcon';
import { useMarketStore } from '../../store/useMarketStore';
import { agentService } from '../../api/agentService';



interface ChatInterfaceProps {
    activeSessionId?: string;
    activeSessionTitle?: string;
    messages: Message[];
    onSendMessage: (content: string, modelId: string, attachments?: ChatAttachment[], toolStates?: any) => void;
    isTyping: boolean;
    workspaces?: Workspace[];
    onRenameSession?: (sessionId: string, newName: string) => void;
    onDeleteSession?: (sessionId: string) => void;
    onMoveSessionToWorkspace?: (sessionId: string, workspaceId: string) => void;
    onOpenChart?: (symbol?: string, indicators?: string[], timeframe?: string) => void;
    onEditMessage?: (sessionId: string, messageId: string, newContent: string, modelId?: string, reasoningEffort?: string) => void;
    onRegenerateResponse?: (messageId: string, modelId?: string, reasoningEffort?: string) => void;
    onFeedback?: (messageId: string, feedback: 'like' | 'dislike' | null) => void;
    currentSymbol?: string;
    onToggleMinimize?: () => void;
    isMinimized?: boolean;
    onNewChat?: () => void;
}

interface PlanStepItem {
    id: string;
    label: string;
    reason?: string;
}

interface PlanPreviewState {
    title: string;
    intent: string;
    steps: PlanStepItem[];
    warnings: string[];
    blocks: string[];
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
    activeSessionId,
    messages,
    onSendMessage,
    isTyping,
    onOpenChart,
    onEditMessage,
    onRegenerateResponse,
    onFeedback,
    currentSymbol
}) => {
    const [inputValue, setInputValue] = useState('');
    const [inputLinks, setInputLinks] = useState<string[]>([]);
    const [planPreview, setPlanPreview] = useState<PlanPreviewState | null>(null);
    const [isPlanLoading, setIsPlanLoading] = useState(false);
    const [isPlanMinimized, setIsPlanMinimized] = useState(false);
    const [planActiveStep, setPlanActiveStep] = useState(0);
    const planRequestSeqRef = useRef(0);

    const { markets, fetchMarkets, selectedMarket } = useMarketStore();
    useEffect(() => {
        if (markets.length === 0) {
            fetchMarkets();
        }
    }, [markets.length, fetchMarkets]);

    const marketByBase = useMemo(() => {
        const map = new Map<string, any>();
        markets.forEach(m => {
            const base = (m.symbol || '').split('-')[0]?.toUpperCase();
            if (base && !map.has(base)) {
                map.set(base, m);
            }
        });
        return map;
    }, [markets]);

    const marketBySymbol = useMemo(() => {
        const map = new Map<string, any>();
        markets.forEach(m => {
            const raw = (m.symbol || '').toUpperCase();
            if (!raw) return;
            map.set(raw, m);
            if (raw.includes('-')) {
                map.set(raw.replace('-', '/'), m);
            }
            if (raw.includes('/')) {
                map.set(raw.replace('/', '-'), m);
            }
        });
        return map;
    }, [markets]);

    const formatPrice = (val: number) => {
        if (!val && val !== 0) return '-';
        if (val === 0) return '0.0000';
        const locale = 'en-US';
        if (val >= 100) {
            return `${val.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
        return `${val.toLocaleString(locale, { minimumFractionDigits: 4, maximumFractionDigits: 4 })}`;
    };

    const timeframes = ['1m', '5m', '15m', '1H', '4H', '1D', '1W'];
    const MIN_MAX_THINKING = 1;
    const MAX_MAX_THINKING = 32;
    const DEFAULT_MAX_THINKING = 6;

    const indicatorAliases: Record<string, { label: string; study: string }> = {
        RSI: { label: 'RSI', study: 'RSI' },
        MACD: { label: 'MACD', study: 'MACD' },
        ATR: { label: 'ATR', study: 'ATR' },
        CCI: { label: 'CCI', study: 'CCI' },
        STOCHASTIC: { label: 'Stochastic', study: 'Stochastic' },
        STOCH: { label: 'Stochastic', study: 'Stochastic' },
        'BOLLINGER BANDS': { label: 'Bollinger Bands', study: 'Bollinger Bands' },
        BB: { label: 'Bollinger Bands', study: 'Bollinger Bands' },
        'ICHIMOKU CLOUD': { label: 'Ichimoku Cloud', study: 'Ichimoku Cloud' },
        ICHIMOKU: { label: 'Ichimoku Cloud', study: 'Ichimoku Cloud' },
        'PARABOLIC SAR': { label: 'Parabolic SAR', study: 'Parabolic SAR' },
        PSAR: { label: 'Parabolic SAR', study: 'Parabolic SAR' },
        'MOVING AVERAGE': { label: 'Moving Average', study: 'Moving Average' },
        EMA: { label: 'EMA', study: 'Moving Average' },
        SMA: { label: 'SMA', study: 'Moving Average' },
        WMA: { label: 'WMA', study: 'Moving Average' }
    };

    const indicatorRegex = useMemo(() => {
        const group = [
            'RSI',
            'MACD',
            'ATR',
            'CCI',
            'Stochastic',
            'Stoch',
            'Bollinger\\s+Bands',
            'BB',
            'Ichimoku\\s+Cloud',
            'Ichimoku',
            'Parabolic\\s+SAR',
            'PSAR',
            'Moving\\s+Average',
            'EMA',
            'SMA',
            'WMA'
        ].join('|');
        return new RegExp(`\\b(${group})\\s*[:\\-\\(\\[]?\\s*(\\d{1,4})\\b`, 'gi');
    }, []);

    const timeframeMap = useMemo(() => {
        const map = new Map<string, string>();
        timeframes.forEach(tf => map.set(tf.toLowerCase(), tf));
        return map;
    }, [timeframes]);

    const renderToolNameNodes = (text: string, keyPrefix: string) => {
        const regex = /\b(?:get|add|set|place|open|close|fetch|update|list|create|delete|remove|capture|draw|write)_[a-z0-9_]{2,}\b/g;
        const parts: React.ReactNode[] = [];
        let lastIndex = 0;
        let match: RegExpExecArray | null;

        while ((match = regex.exec(text)) !== null) {
            if (match.index > lastIndex) {
                parts.push(text.slice(lastIndex, match.index));
            }
            const token = match[0];
            parts.push(
                <span key={`${keyPrefix}-tool-${token}-${match.index}`} className={styles.toolUsageInlinePill}>
                    {token.replace(/_/g, ' ')}
                </span>
            );
            lastIndex = match.index + token.length;
        }

        if (lastIndex < text.length) {
            parts.push(text.slice(lastIndex));
        }

        return parts.length ? parts : [text];
    };

    const renderSymbolNodes = (text: string, keyPrefix: string) => {
        const regex = /\b[A-Z0-9]{2,12}(?:[-/][A-Z0-9]{2,12})?\b|\b\d{1,3}[mhdw]\b/gi;
        const parts: React.ReactNode[] = [];
        let lastIndex = 0;
        let match: RegExpExecArray | null;

        while ((match = regex.exec(text)) !== null) {
            const token = match[0];
            const isTimeframe = /^\d/.test(token);
            const timeframeLabel = isTimeframe ? timeframeMap.get(token.toLowerCase()) : undefined;

            if (isTimeframe && !timeframeLabel) continue;

            const tokenUpper = token.toUpperCase();
            const market = !isTimeframe
                ? marketBySymbol.get(tokenUpper) || marketByBase.get(tokenUpper.split(/[-/]/)[0])
                : undefined;

            if (!isTimeframe && !market) continue;

            if (match.index > lastIndex) {
                parts.push(...renderToolNameNodes(text.slice(lastIndex, match.index), `${keyPrefix}-txt-${match.index}`));
            }

            if (isTimeframe && timeframeLabel) {
                const targetSymbol = currentSymbol || selectedMarket?.symbol || 'BTC/USDT';
                parts.push(
                    <button
                        key={`${keyPrefix}-tf-${timeframeLabel}-${match.index}`}
                        className={styles.timeframeBadge}
                        type="button"
                        onClick={() => {
                            setToolStates(prev => ({ ...prev, timeframe: [timeframeLabel] }));
                            onOpenChart?.(targetSymbol, undefined, timeframeLabel);
                        }}
                        title={`Set timeframe ${timeframeLabel}`}
                    >
                        <span className={styles.timeframeBadgeText}>{timeframeLabel}</span>
                    </button>
                );
            } else {
                const displaySymbol = tokenUpper.split(/[-/]/)[0];
                const price = market?.price || 0;
                const priceLabel = price ? `$${formatPrice(price)}` : '-';
                const changeValue =
                    market?.change24hPercent !== undefined
                        ? market.change24hPercent
                        : market?.change24h !== undefined
                            ? market.change24h
                            : 0;
                const priceTrendClass =
                    changeValue > 0
                        ? styles.symbolBadgePriceUp
                        : changeValue < 0
                            ? styles.symbolBadgePriceDown
                            : '';

                const tvSymbol = market?.symbol || displaySymbol;
                parts.push(
                    <button
                        key={`${keyPrefix}-sym-${tokenUpper}-${match.index}`}
                        className={styles.symbolBadge}
                        type="button"
                        onClick={() => onOpenChart?.(tvSymbol)}
                        title={`Open ${tvSymbol}`}
                    >
                        <TokenIcon symbol={displaySymbol} size={16} className={styles.symbolBadgeIcon} />
                        <span className={styles.symbolBadgeText}>{displaySymbol}</span>
                        <span className={`${styles.symbolBadgePrice} ${priceTrendClass}`}>{priceLabel}</span>
                    </button>
                );
            }

            lastIndex = match.index + token.length;
        }

        if (lastIndex < text.length) {
            parts.push(...renderToolNameNodes(text.slice(lastIndex), `${keyPrefix}-tail`));
        }

        return parts.length ? parts : renderToolNameNodes(text, `${keyPrefix}-all`);
    };

    const renderTextWithTokens = (text: string) => {
        const parts: React.ReactNode[] = [];
        let lastIndex = 0;
        let match: RegExpExecArray | null;
        let segIndex = 0;
        indicatorRegex.lastIndex = 0;

        while ((match = indicatorRegex.exec(text)) !== null) {
            const rawName = match[1];
            const number = match[2];
            const normalized = rawName.replace(/\s+/g, ' ').toUpperCase();
            const config = indicatorAliases[normalized];
            if (!config) continue;

            if (match.index > lastIndex) {
                parts.push(...renderSymbolNodes(text.slice(lastIndex, match.index), `seg-${segIndex++}`));
            }

            const targetSymbol = currentSymbol || selectedMarket?.symbol || 'BTC/USDT';
            parts.push(
                <button
                    key={`ind-${normalized}-${match.index}`}
                    className={styles.indicatorBadge}
                    type="button"
                    onClick={() => {
                        setToolStates(prev => ({
                            ...prev,
                            indicators: prev.indicators.includes(config.study)
                                ? prev.indicators
                                : [...prev.indicators, config.study]
                        }));
                        onOpenChart?.(targetSymbol, [config.study]);
                    }}
                    title={`Add ${config.study}`}
                >
                    <span className={styles.indicatorBadgeText}>{config.label}</span>
                    <span className={styles.indicatorBadgeNumber}>{number}</span>
                </button>
            );

            lastIndex = match.index + match[0].length;
        }

        if (lastIndex < text.length) {
            parts.push(...renderSymbolNodes(text.slice(lastIndex), `seg-${segIndex++}`));
        }

        return parts.length ? parts : renderSymbolNodes(text, 'seg-0');
    };



    const { wallets } = useWallets();
    const { getAccessToken } = usePrivy();
    const userAddress = wallets[0]?.address;

    // Model Selection State
    const [selectedModel, setSelectedModel] = useState('');
    const [reasoningEffort, setReasoningEffort] = useState<'low' | 'medium' | 'high' | 'extra_high'>('medium');
    const [availableModels, setAvailableModels] = useState<{ id: string, name: string }[]>([]);
    const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);

    const { enabledModels, fetchEnabledModels } = useUsageStore();

    // 1. Initial load of enabled models
    useEffect(() => {
        fetchEnabledModels(userAddress);
    }, [userAddress, fetchEnabledModels]);

    // 2. React to changes in enabledModels or fetch all models
    useEffect(() => {
        const syncModels = async () => {
            try {
                const allModels = await usageService.getModels();
                const enabledIds = Object.keys(enabledModels).filter(id => enabledModels[id]);

                // Keep provider list strict: enabled models + Groq models only.
                let filtered = allModels.filter((m: any) =>
                    enabledIds.includes(m.id) || m.id.startsWith('groq/')
                );

                if (filtered.length === 0 && allModels.length > 0) {
                    filtered = allModels.filter((m: any) => m.id.startsWith('groq/'));
                }

                if (filtered.length > 0) {
                    setAvailableModels(filtered);
                    setSelectedModel(prevSelected => {
                        const isSelectedStillAvailable = filtered.some((m: any) => m.name === prevSelected);
                        return isSelectedStillAvailable ? prevSelected : filtered[0].name;
                    });
                } else {
                    setAvailableModels([]);
                    setSelectedModel('');
                }
            } catch (err) {
                console.error("Sync models failed", err);
            }
        };
        syncModels();
    }, [enabledModels]);

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
        planMode: false,
        timeframe: ['1D'],
        indicators: [] as string[],
        webObservation: true,
        knowledgeEnabled: true,
        memoryEnabled: false,
        maxThinking: DEFAULT_MAX_THINKING
    });
    const [activeToolView, setActiveToolView] = useState<'main' | 'indicators' | 'timeframe' | 'more'>('main');
    const [indicatorSearch, setIndicatorSearch] = useState('');
    const toolsRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [attachments, setAttachments] = useState<File[]>([]);
    const [isPreparingAttachments, setIsPreparingAttachments] = useState(false);
    const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024; // 5MB per file
    const attachmentPreviews = useMemo(
        () =>
            attachments.map(file => ({
                file,
                url: URL.createObjectURL(file)
            })),
        [attachments]
    );

    useEffect(() => {
        return () => {
            attachmentPreviews.forEach(preview => {
                URL.revokeObjectURL(preview.url);
            });
        };
    }, [attachmentPreviews]);

    const readFileAsDataUrl = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result || ''));
            reader.onerror = () => reject(reader.error || new Error('Failed to read file'));
            reader.readAsDataURL(file);
        });
    };

    const buildAttachmentPayloads = async (files: File[]): Promise<ChatAttachment[]> => {
        const payloads: ChatAttachment[] = [];
        const errors: string[] = [];

        await Promise.all(
            files.map(async (file) => {
                if (file.size > MAX_ATTACHMENT_BYTES) {
                    errors.push(`${file.name} is too large (max 5MB).`);
                    return;
                }
                const dataUrl = await readFileAsDataUrl(file);
                payloads.push({
                    name: file.name,
                    type: file.type || 'application/octet-stream',
                    data: dataUrl,
                    size: file.size
                });
            })
        );

        if (errors.length > 0) {
            alert(errors.join('\n'));
        }

        return payloads;
    };
    const [expandedImage, setExpandedImage] = useState<{ name: string; url: string } | null>(null);

    const closeExpandedImage = () => {
        if (expandedImage?.url?.startsWith('blob:')) {
            URL.revokeObjectURL(expandedImage.url);
        }
        setExpandedImage(null);
    };

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

    const getSelectedModelId = () => {
        const model = availableModels.find(m => m.name === selectedModel);
        return model?.id;
    };

    const buildOutboundToolStates = () => {
        const marketRaw = currentSymbol || selectedMarket?.symbol || '';
        const normalizedMarket = marketRaw
            ? marketRaw.replace('/', '-').toUpperCase()
            : '';
        const selectedModelId = getSelectedModelId();
        const timeframeList = Array.isArray(toolStates.timeframe)
            ? toolStates.timeframe
            : (toolStates.timeframe ? [toolStates.timeframe] : []);

        return {
            ...toolStates,
            plan_mode: toolStates.planMode,
            planner_source: 'ai',
            planner_fallback: 'none',
            ...(selectedModelId ? { planner_model_id: selectedModelId } : {}),
            reasoning_effort: reasoningEffort,
            web_observation_enabled: !!toolStates.webObservation,
            knowledge_enabled: !!toolStates.knowledgeEnabled,
            memory_enabled: !!toolStates.memoryEnabled,
            strict_react: true,
            max_react_iterations: Number(toolStates.maxThinking || DEFAULT_MAX_THINKING),
            market_symbol: normalizedMarket,
            market_display: marketRaw ? marketRaw.replace(/-/g, '/') : normalizedMarket.replace(/-/g, '/'),
            timeframe: timeframeList
        };
    };

    useEffect(() => {
        if (!toolStates.planMode) {
            planRequestSeqRef.current += 1;
            setPlanPreview(null);
            setIsPlanLoading(false);
            return;
        }

        const contentWithLinks = [inputValue.trim(), ...inputLinks].filter(Boolean).join(' ').trim();
        const hasSignal = contentWithLinks.length >= 2;

        if (!hasSignal) {
            planRequestSeqRef.current += 1;
            setPlanPreview(null);
            setIsPlanLoading(false);
            return;
        }

        const reqId = ++planRequestSeqRef.current;
        setPlanPreview(null);
        setIsPlanLoading(true);
        const timer = setTimeout(async () => {
            try {
                const token = await getAccessToken();
                const history = (messages || []).slice(-6).map(m => ({ role: m.role, content: m.content }));
                const selectedModelId = getSelectedModelId();
                const data = await agentService.planPreview({
                    model_id: selectedModelId || undefined,
                    message: contentWithLinks || 'Plan based on current context.',
                    history,
                    tool_states: buildOutboundToolStates(),
                    token: token || undefined
                });

                if (reqId !== planRequestSeqRef.current) return;
                setPlanPreview({
                    title: data?.render?.title || 'AI Plan',
                    intent: data?.render?.intent || 'analysis',
                    steps: Array.isArray(data?.render?.steps) ? data.render.steps.slice(0, 6) : [],
                    warnings: Array.isArray(data?.render?.warnings) ? data.render.warnings.slice(0, 3) : [],
                    blocks: Array.isArray(data?.render?.blocks) ? data.render.blocks.slice(0, 3) : []
                });
            } catch (error) {
                if (reqId !== planRequestSeqRef.current) return;
                setPlanPreview(null);
                console.error('Plan preview failed', error);
            } finally {
                if (reqId === planRequestSeqRef.current) {
                    setIsPlanLoading(false);
                }
            }
        }, 350);

        return () => {
            clearTimeout(timer);
            if (reqId === planRequestSeqRef.current) {
                setIsPlanLoading(false);
            }
        };
    }, [
        inputValue,
        inputLinks,
        toolStates,
        currentSymbol,
        selectedMarket?.symbol,
        messages,
        getAccessToken
    ]);

    useEffect(() => {
        setPlanActiveStep(0);
    }, [planPreview?.intent, planPreview?.steps?.length]);

    useEffect(() => {
        const steps = planPreview?.steps || [];
        if (steps.length === 0) return;

        const maxIndex = steps.length - 1;
        const isRunning = isPlanLoading || isTyping;

        if (!isRunning) {
            setPlanActiveStep(maxIndex);
            return;
        }

        setPlanActiveStep(0);
        const intervalMs = isPlanLoading ? 700 : 1100;
        const timer = setInterval(() => {
            setPlanActiveStep(prev => (prev >= maxIndex ? maxIndex : prev + 1));
        }, intervalMs);
        return () => clearInterval(timer);
    }, [isPlanLoading, isTyping, planPreview?.steps]);

    const handleSaveEdit = (msgId: string) => {
        if (onEditMessage && activeSessionId) {
            const modelId = getSelectedModelId();
            if (!modelId) {
                alert('Model belum dipilih. Pilih model dulu.');
                return;
            }
            onEditMessage(activeSessionId, msgId, editValue, modelId, reasoningEffort);
            // Optionally trigger regeneration here if desired, but for now just edit
        }
        setEditingMessageId(null);
        setEditValue('');
    };

    const handleRegenerate = (content: string) => {
        const modelId = getSelectedModelId();
        if (!modelId) {
            alert('Model belum dipilih. Pilih model dulu.');
            return;
        }
        onSendMessage(content, modelId, [], buildOutboundToolStates());
    };

    const handleAssistantRegenerate = (messageId: string) => {
        if (!onRegenerateResponse) return;
        const modelId = getSelectedModelId();
        if (!modelId) {
            alert('Model belum dipilih. Pilih model dulu.');
            return;
        }
        onRegenerateResponse(messageId, modelId, reasoningEffort);
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

    const getLinkDomain = (href?: string) => {
        if (!href) return '';
        try {
            const url = new URL(href);
            return url.hostname.replace(/^www\./, '');
        } catch {
            return '';
        }
    };

    const extractLinks = (text: string) => {
        const regex = /\bhttps?:\/\/[^\s<>"]+/gi;
        const matches = text.match(regex) || [];
        return Array.from(new Set(matches));
    };

    const getLinkLabel = (url: string) => {
        try {
            const u = new URL(url);
            const parts = u.pathname.split('/').filter(Boolean);
            return parts[parts.length - 1] || u.hostname;
        } catch {
            return url;
        }
    };

    const linksInInput = useMemo(() => inputLinks, [inputLinks]);

    const removeLinkFromInput = (url: string) => {
        setInputLinks(prev => prev.filter(link => link !== url));
        setInputValue(prev => prev.replace(url, '').replace(/\s{2,}/g, ' ').trim());
    };

    const isImageAttachment = (att: ChatAttachment) => (att.type || '').startsWith('image/');
    const formatAttachmentType = (type?: string, name?: string) => {
        if (type) {
            if (type === 'application/pdf') return 'PDF';
            if (type.includes('wordprocessingml')) return 'DOCX';
            if (type.includes('msword')) return 'DOC';
            if (type.startsWith('text/')) return 'TXT';
            if (type.startsWith('image/')) return (type.split('/')[1] || 'IMAGE').toUpperCase();
        }
        if (name && name.includes('.')) {
            const ext = name.split('.').pop();
            if (ext) return ext.toUpperCase();
        }
        return 'FILE';
    };

    const openAttachmentImage = (att: ChatAttachment) => {
        if (!att?.data) return;
        setExpandedImage({ name: att.name || 'image', url: att.data });
    };


    const availableIndicators = ['RSI', 'MACD', 'Bollinger Bands', 'Moving Average', 'Volume', 'Stochastic', 'ATR', 'Ichimoku Cloud', 'CCI', 'Parabolic SAR'];

    // Close menus on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (modelSectionRef.current && !modelSectionRef.current.contains(event.target as Node)) {
                setIsModelMenuOpen(false);
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
    const lastThoughtCountsRef = useRef<Record<string, number>>({});
    const lastThinkingRef = useRef<Record<string, boolean>>({});

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

    useEffect(() => {
        const newSteps: { id: string; index: number }[] = [];
        const finished: string[] = [];

        for (const msg of messages) {
            if (msg.role !== 'assistant') continue;
            const count = Array.isArray(msg.thoughts) ? msg.thoughts.length : 0;
            const prevCount = lastThoughtCountsRef.current[msg.id] ?? 0;
            if (count > prevCount) {
                newSteps.push({ id: msg.id, index: count - 1 });
                lastThoughtCountsRef.current[msg.id] = count;
            }

            const wasThinking = lastThinkingRef.current[msg.id] ?? false;
            const isThinking = !!msg.isThinking;
            if (wasThinking && !isThinking) {
                finished.push(msg.id);
            }
            lastThinkingRef.current[msg.id] = isThinking;
        }

        if (newSteps.length > 0) {
            setExpandedThoughtIds(prev => {
                const next = new Set(prev);
                for (const s of newSteps) next.add(s.id);
                return next;
            });

            setExpandedStepKeys(prev => {
                const next = new Set(prev);
                for (const s of newSteps) {
                    for (const existing of [...next]) {
                        if (existing.startsWith(`${s.id}-`)) {
                            next.delete(existing);
                        }
                    }
                    if (s.index >= 0) {
                        next.add(`${s.id}-${s.index}`);
                    }
                }
                return next;
            });
        }

        if (finished.length > 0) {
            setExpandedThoughtIds(prev => {
                const next = new Set(prev);
                for (const id of finished) next.delete(id);
                return next;
            });
            setExpandedStepKeys(prev => {
                const next = new Set([...prev].filter(k => !finished.some(id => k.startsWith(`${id}-`))));
                return next;
            });
        }
    }, [messages]);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);



    const handleSend = async () => {
        if (!inputValue.trim() && attachments.length === 0 && inputLinks.length === 0) return;
        if (isPreparingAttachments) return;

        const finalModelId = getSelectedModelId();
        if (!finalModelId) {
            alert('Model belum dipilih. Pilih model dulu.');
            return;
        }

        let attachmentPayloads: ChatAttachment[] = [];
        try {
            setIsPreparingAttachments(true);
            attachmentPayloads = attachments.length > 0 ? await buildAttachmentPayloads(attachments) : [];
        } catch (error) {
            console.error('Failed to prepare attachments', error);
            alert('Attachment gagal diproses. Coba lagi.');
            return;
        } finally {
            setIsPreparingAttachments(false);
        }
        const contentWithLinks = [inputValue.trim(), ...inputLinks].filter(Boolean).join(' ').trim();
        if (!contentWithLinks && attachmentPayloads.length === 0) {
            return;
        }
        onSendMessage(contentWithLinks, finalModelId, attachmentPayloads, buildOutboundToolStates());
        setInputValue('');
        setInputLinks([]);
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

    const inputAttachmentItems = attachments.map((file, index) => ({ file, index }));
    const inputImageAttachments = inputAttachmentItems.filter(item => item.file.type.startsWith('image/'));
    const inputFileAttachments = inputAttachmentItems.filter(item => !item.file.type.startsWith('image/'));
    const activeMarketLabel = (currentSymbol || selectedMarket?.symbol || '').replace(/-/g, '/');
    const selectedTimeframes = Array.isArray(toolStates.timeframe) ? toolStates.timeframe : [];



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
                            (() => {
                                const thoughtsList = Array.isArray(msg.thoughts) ? msg.thoughts : [];
                                const hasStructuredThoughts = thoughtsList.some(item => {
                                    if (!item || typeof item !== 'object') return false;
                                    const type = String((item as any).type || 'text');
                                    return type === 'tool' || type === 'code' || type === 'browsing';
                                });
                                const shouldShowThoughtBlock = thoughtsList.length > 0 && (hasStructuredThoughts || !!msg.isThinking);
                                return (
                            <div key={msg.id} className={`${styles.messageItem} ${msg.role === 'user' ? styles.user : styles.assistant}`}>
                                {msg.role === 'user' ? (
                                    <div className={`${styles.userMessageGroup} ${msg.attachments && msg.attachments.length > 0 ? styles.userMessageWithAttachments : ''}`}>
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
                                                {msg.attachments && msg.attachments.length > 0 && (
                                                    <div className={styles.userAttachments}>
                                                        {msg.attachments.map((att, idx) => (
                                                            isImageAttachment(att) ? (
                                                                <div key={`att-img-${idx}`} className={styles.userImageCard}>
                                                                    <img
                                                                        src={att.data}
                                                                        alt={att.name}
                                                                        className={styles.userAttachmentImage}
                                                                        onClick={() => openAttachmentImage(att)}
                                                                    />
                                                                </div>
                                                            ) : (
                                                                <div key={`att-file-${idx}`} className={styles.userFileCard}>
                                                                    <div className={styles.userFileIcon}>
                                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                                                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                                                            <polyline points="14 2 14 8 20 8"></polyline>
                                                                        </svg>
                                                                    </div>
                                                                    <div className={styles.userFileMeta}>
                                                                        <div className={styles.userFileName}>{att.name}</div>
                                                                        <div className={styles.userFileType}>{formatAttachmentType(att.type, att.name)}</div>
                                                                    </div>
                                                                </div>
                                                            )
                                                        ))}
                                                    </div>
                                                )}
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
                                        {shouldShowThoughtBlock && (
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
                                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3B2030" strokeWidth="2">
                                                                    <path d="M12 2a10 10 0 1 0 10 10H12V2z" fill="#3B2030" />
                                                                    <path d="M12 2a10 10 0 0 1 10 10" />
                                                                    {/* Simple quarter circle or brain metaphor */}
                                                                </svg>
                                                                <span style={{ color: '#5B354C' }}>Thought Process</span>
                                                            </>
                                                        )}
                                                    </div>
                                                    <svg
                                                        width="16"
                                                        height="16"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke={msg.isThinking ? "#A77590" : "#3B2030"}
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

                                                        {thoughtsList.map((stepItem, idx) => {
                                                            const stepKey = `${msg.id}-${idx}`;
                                                            const isStepExpanded = expandedStepKeys.has(stepKey);

                                                            // Handle legacy string steps or new object steps
                                                            const isObject = typeof stepItem === 'object';
                                                            const stepType = isObject ? stepItem.type : 'text';
                                                            const stepTitle = isObject ? stepItem.title : String(stepItem);
                                                            const stepContent = isObject ? String((stepItem as any).content || '') : '';
                                                            const stepResults = isObject && stepItem.type === 'browsing' ? stepItem.results : undefined;
                                                            const stepToolName = isObject ? (stepItem as any).toolName : '';
                                                            const stepPhase = isObject ? String((stepItem as any).phase || '') : '';
                                                            const stepStatus = isObject ? String((stepItem as any).status || '').toLowerCase() : '';
                                                            const hasDetail =
                                                                (stepType === 'browsing' && Array.isArray(stepResults) && stepResults.length > 0) ||
                                                                (stepType === 'code' && !!stepContent.trim()) ||
                                                                (stepType === 'tool' && !!stepContent.trim() && stepContent.trim() !== stepTitle.trim()) ||
                                                                (stepType === 'text' && isObject && !!stepContent.trim() && stepContent.trim() !== stepTitle.trim());

                                                            return (
                                                                <div key={idx} style={{ borderBottom: idx === thoughtsList.length - 1 ? 'none' : '1px solid #3A2530' }}>
                                                                    <div
                                                                        className={styles.thinkingStep}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            if (hasDetail) {
                                                                                toggleStep(msg.id, idx);
                                                                            }
                                                                        }}
                                                                        role={hasDetail ? 'button' : undefined}
                                                                        aria-expanded={hasDetail ? isStepExpanded : undefined}
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
                                                                                    {hasDetail && (
                                                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: isStepExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                                                                                            <path d="M6 9l6 6 6-6" />
                                                                                        </svg>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        ) : stepType === 'code' ? (
                                                                            // Code Step
                                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
                                                                                <div className={styles.stepIcon}>
                                                                                    {/* Code Icon */}
                                                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3B2030" strokeWidth="2">
                                                                                        <polyline points="16 18 22 12 16 6" />
                                                                                        <polyline points="8 6 2 12 8 18" />
                                                                                    </svg>
                                                                                </div>
                                                                                <span style={{ flex: 1 }}>{stepTitle}</span>
                                                                                {hasDetail && (
                                                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3A2530" strokeWidth="2" style={{ transform: isStepExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                                                                                        <path d="M6 9l6 6 6-6" />
                                                                                    </svg>
                                                                                )}
                                                                            </div>
                                                                        ) : stepType === 'tool' ? (
                                                                            <div className={styles.toolStepContent}>
                                                                                <div className={styles.stepIcon}>
                                                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A77590" strokeWidth="2">
                                                                                        <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18v3h3l6.3-6.3a4 4 0 0 0 5.4-5.4l-2.2 2.2-3.2-3.2 2.4-2z" />
                                                                                    </svg>
                                                                                </div>
                                                                                <span style={{ flex: 1 }}>{stepTitle}</span>
                                                                                <span className={`${styles.toolStepPill} ${stepStatus === 'error' ? styles.toolStepPillError : styles.toolStepPillOk}`}>
                                                                                    {stepToolName || (stepPhase ? stepPhase.replace(/_/g, ' ') : 'tool')}
                                                                                </span>
                                                                                {hasDetail && (
                                                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3A2530" strokeWidth="2" style={{ transform: isStepExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                                                                                        <path d="M6 9l6 6 6-6" />
                                                                                    </svg>
                                                                                )}
                                                                            </div>
                                                                        ) : (
                                                                            // Text Step
                                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
                                                                                <div className={styles.stepIcon}>
                                                                                    {/* Dot Icon for Text */}
                                                                                    <div style={{ width: '6px', height: '6px', backgroundColor: '#3A2530', borderRadius: '50%' }}></div>
                                                                                </div>
                                                                                <span style={{ flex: 1 }}>{stepTitle}</span>
                                                                                {hasDetail && (
                                                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3A2530" strokeWidth="2" style={{ transform: isStepExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                                                                                        <path d="M6 9l6 6 6-6" />
                                                                                    </svg>
                                                                                )}
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    {/* Expanded Content */}
                                                                    {hasDetail && isStepExpanded && (
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
                                                                            ) : stepType === 'tool' ? (
                                                                                <div className={styles.toolStepDetail}>
                                                                                    {stepContent || 'Tool phase completed.'}
                                                                                </div>
                                                                              ) : (
                                                                                  <div style={{ marginLeft: '28px' }}>
                                                                                      {stepContent || stepTitle}
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
                                        {msg.isThinking && (!msg.content || msg.content.trim().length === 0) && (
                                            <div className={styles.loadingRow}>
                                                <div className={styles.loadingBars}>
                                                    <span className={styles.loadingBar}></span>
                                                    <span className={styles.loadingBar}></span>
                                                    <span className={styles.loadingBar}></span>
                                                    <span className={styles.loadingBar}></span>
                                                </div>
                                                <span className={styles.loadingText}>Loading</span>
                                            </div>
                                        )}
                                        <div className={styles.responseContent}>
                                            <ReactMarkdown
                                                remarkPlugins={[remarkGfm]}
                                                components={{
                                                    text: ({ node, children }) => {
                                                        const parentType = (node as any)?.parent?.type;
                                                        if (parentType === 'link' || parentType === 'code' || parentType === 'inlineCode') {
                                                            return <>{children}</>;
                                                        }
                                                        const text = typeof children === 'string' ? children : String(children);
                                                        return <>{renderTextWithTokens(text)}</>;
                                                    },
                                                    a: ({ href, children, ...props }) => {
                                                        const domain = getLinkDomain(href);
                                                        const showIcon = !!domain && (href?.startsWith('http://') || href?.startsWith('https://'));
                                                        const favicon = showIcon ? `https://www.google.com/s2/favicons?domain=${domain}&sz=64` : '';
                                                        return (
                                                            <a
                                                                className={styles.linkWithIcon}
                                                                href={href}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                {...props}
                                                            >
                                                                {showIcon && (
                                                                    <img
                                                                        className={styles.linkIcon}
                                                                        src={favicon}
                                                                        alt=""
                                                                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                                                    />
                                                                )}
                                                                <span className={styles.linkText}>{children}</span>
                                                            </a>
                                                        );
                                                    },
                                                    pre: ({ children }) => (
                                                        <pre className={styles.codeBlock}>{children}</pre>
                                                    ),
                                                    code: ({ className, children }) => (
                                                        className
                                                            ? <code className={className}>{children}</code>
                                                            : <code className={styles.inlineCode}>{children}</code>
                                                    ),
                                                    table: ({ children }) => (
                                                        <div className={styles.tableWrapper}>
                                                            <table className={styles.markdownTable}>{children}</table>
                                                        </div>
                                                    ),
                                                    th: ({ children }) => (
                                                        <th className={styles.tableHeader}>{children}</th>
                                                    ),
                                                    td: ({ children }) => (
                                                        <td className={styles.tableCell}>{children}</td>
                                                    ),
                                                    blockquote: ({ children }) => (
                                                        <blockquote className={styles.blockquote}>{children}</blockquote>
                                                    )
                                                }}
                                            >
                                                {msg.content}
                                            </ReactMarkdown>
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

                                        {!msg.isThinking && (
                                            <>
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
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={msg.feedback === 'like' ? "#3B2030" : "currentColor"} strokeWidth="2">
                                                            <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        className={`${styles.actionBtn} ${msg.feedback === 'dislike' ? styles.activeFeedback : ''}`}
                                                        title="Bad response"
                                                        onClick={() => onFeedback && onFeedback(msg.id, msg.feedback === 'dislike' ? null : 'dislike')}
                                                    >
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={msg.feedback === 'dislike' ? "#FF4B4B" : "currentColor"} strokeWidth="2">
                                                            <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2 0 0 1-2.33 2H17" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        className={styles.actionBtn}
                                                        title="Regenerate"
                                                        onClick={() => handleAssistantRegenerate(msg.id)}
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
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                                );
                            })()
                        ))}
                          {isTyping && null}
                        <div ref={messagesEndRef} />
                    </div>
                )}

                {/* Input Area */}
                <div className={`${styles.inputWrapper} ${isToolsMenuOpen ? styles.toolsOpen : ''} ${isModelMenuOpen ? styles.modelOpen : ''}`}>
                    {toolStates.planMode && planPreview && (
                        <div className={styles.aiPlanCard}>
                            <div className={styles.aiPlanHeader}>
                                <span className={styles.aiPlanTitle}>
                                    <img src={brainIcon} alt="" className={styles.aiPlanBrain} />
                                    {planPreview?.title || 'AI Plan'}
                                </span>
                                <div className={styles.aiPlanHeaderRight}>
                                    <span className={styles.aiPlanIntent}>
                                        {planPreview?.intent || 'analysis'}
                                    </span>
                                    <button
                                        type="button"
                                        className={styles.aiPlanToggle}
                                        onClick={() => setIsPlanMinimized(prev => !prev)}
                                        title={isPlanMinimized ? 'Expand AI Plan' : 'Minimize AI Plan'}
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: isPlanMinimized ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                                            <path d="M6 9l6 6 6-6" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            {planPreview?.steps?.length ? (
                                <>
                                    {isPlanMinimized ? (
                                        <div className={styles.aiPlanSteps}>
                                            {(() => {
                                                const maxIndex = planPreview.steps.length - 1;
                                                const activeIndex = Math.min(planActiveStep, maxIndex);
                                                const activeStep = planPreview.steps[activeIndex];
                                                const status = 'running';
                                                return (
                                                    <div className={styles.aiPlanStep}>
                                                        <span className={`${styles.aiPlanStatus} ${status === 'running' ? styles.aiPlanStatusRunning : styles.aiPlanStatusDone}`}>
                                                            {status === 'running' ? <span className={styles.aiPlanSpinner}></span> : <span className={styles.aiPlanCheck}>✓</span>}
                                                        </span>
                                                        <span className={styles.aiPlanStepIndex}>{activeIndex + 1}.</span>
                                                        <div className={styles.aiPlanStepBody}>
                                                            <span className={styles.aiPlanStepText}>{activeStep?.label}</span>
                                                            {activeStep?.reason && (
                                                                <span className={styles.aiPlanStepMeta}>{activeStep.reason}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    ) : (
                                        <div className={`${styles.aiPlanSteps} ${styles.aiPlanStepsScrollable}`}>
                                            {planPreview.steps.map((step, idx) => {
                                                const running = isPlanLoading || isTyping;
                                                const activeIndex = Math.min(planActiveStep, Math.max(planPreview.steps.length - 1, 0));
                                                const status: 'done' | 'running' | 'pending' = running
                                                    ? (idx < activeIndex ? 'done' : idx === activeIndex ? 'running' : 'pending')
                                                    : 'done';

                                                return (
                                                    <div key={step.id || `${idx}`} className={styles.aiPlanStep}>
                                                        <span className={`${styles.aiPlanStatus} ${status === 'running' ? styles.aiPlanStatusRunning : status === 'done' ? styles.aiPlanStatusDone : styles.aiPlanStatusPending}`}>
                                                            {status === 'running' ? (
                                                                <span className={styles.aiPlanSpinner}></span>
                                                            ) : status === 'done' ? (
                                                                <span className={styles.aiPlanCheck}>✓</span>
                                                            ) : (
                                                                <span className={styles.aiPlanDot}></span>
                                                            )}
                                                        </span>
                                                        <span className={styles.aiPlanStepIndex}>{idx + 1}.</span>
                                                        <div className={styles.aiPlanStepBody}>
                                                            <span className={styles.aiPlanStepText}>{step.label}</span>
                                                            {step.reason && (
                                                                <span className={styles.aiPlanStepMeta}>{step.reason}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                    {!isPlanMinimized && planPreview.steps.length > 3 && (
                                        <div className={styles.aiPlanFooter}>
                                            {(() => {
                                                const activeIndex = Math.min(
                                                    planActiveStep,
                                                    Math.max(planPreview.steps.length - 1, 0)
                                                );
                                                return `Task ${activeIndex + 1} of ${planPreview.steps.length} · Scroll to see all`;
                                            })()}
                                        </div>
                                    )}

                                    {!isPlanMinimized && planPreview?.warnings?.length ? (
                                        <div className={styles.aiPlanNotes}>
                                            {planPreview.warnings.map((w, i) => (
                                                <span key={`warn-${i}`} className={styles.aiPlanWarnChip}>{w}</span>
                                            ))}
                                        </div>
                                    ) : null}
                                    {!isPlanMinimized && planPreview?.blocks?.length ? (
                                        <div className={styles.aiPlanNotes}>
                                            {planPreview.blocks.map((b, i) => (
                                                <span key={`block-${i}`} className={styles.aiPlanBlockChip}>{b}</span>
                                            ))}
                                        </div>
                                    ) : null}
                                </>
                            ) : null}
                        </div>
                    )}
                    <div className={styles.textWrapper}>
                        {(linksInInput.length > 0 || inputFileAttachments.length > 0) && (
                            <div className={styles.linkChipsRow}>
                                {linksInInput.map((link) => (
                                    <div key={link} className={styles.linkChip}>
                                        <svg className={styles.linkChipIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M10 13a5 5 0 0 1 0-7l2-2a5 5 0 0 1 7 7l-1 1" />
                                            <path d="M14 11a5 5 0 0 1 0 7l-2 2a5 5 0 0 1-7-7l1-1" />
                                        </svg>
                                        <span className={styles.linkChipText}>{getLinkLabel(link)}</span>
                                        <button className={styles.linkChipRemove} type="button" onClick={() => removeLinkFromInput(link)}>
                                            ×
                                        </button>
                                    </div>
                                ))}
                                {inputFileAttachments.map(({ file, index }) => (
                                    <div key={`file-chip-${index}`} className={styles.fileChip}>
                                        <div className={styles.fileChipIcon}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                                <polyline points="14 2 14 8 20 8"></polyline>
                                            </svg>
                                        </div>
                                        <span className={styles.fileChipText}>{file.name}</span>
                                        <button
                                            className={styles.fileChipRemove}
                                            type="button"
                                            onClick={() => setAttachments(prev => prev.filter((_, i) => i !== index))}
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                        {inputImageAttachments.length > 0 && (
                            <div className={styles.inputAttachmentRow}>
                                {inputImageAttachments.map(({ file, index }) => (
                                    <div key={index} className={styles.inputAttachmentItem}>
                                        {file.type.startsWith('image/') ? (
                                            <div className={styles.inputImageCard}>
                                                {attachmentPreviews[index] && (
                                                    <img
                                                        src={attachmentPreviews[index].url}
                                                        alt="preview"
                                                        className={styles.inputImagePreview}
                                                        onClick={() => {
                                                            setExpandedImage({ name: file.name, url: attachmentPreviews[index].url });
                                                        }}
                                                    />
                                                )}
                                                <button
                                                    className={styles.inputAttachmentRemove}
                                                    type="button"
                                                    onClick={() => setAttachments(prev => prev.filter((_, i) => i !== index))}
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ) : (
                                            <div className={styles.inputFileCard}>
                                                <div className={styles.inputFileIcon}>
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                                        <polyline points="14 2 14 8 20 8"></polyline>
                                                    </svg>
                                                </div>
                                                <div className={styles.inputFileMeta}>
                                                    <div className={styles.inputFileName}>{file.name}</div>
                                                    <div className={styles.inputFileType}>{formatAttachmentType(file.type, file.name)}</div>
                                                </div>
                                                <button
                                                    className={styles.inputFileRemove}
                                                    type="button"
                                                    onClick={() => setAttachments(prev => prev.filter((_, i) => i !== index))}
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                        {(activeMarketLabel || toolStates.indicators.length > 0 || selectedTimeframes.length > 0 || toolStates.webObservation || toolStates.knowledgeEnabled || toolStates.memoryEnabled || toolStates.maxThinking !== DEFAULT_MAX_THINKING) && (
                            <div className={styles.contextChipsRow}>
                                {activeMarketLabel && (
                                    <button
                                        type="button"
                                        className={`${styles.contextChip} ${styles.marketContextChip}`}
                                        onClick={() => onOpenChart?.(activeMarketLabel)}
                                        title={`Open ${activeMarketLabel}`}
                                    >
                                        <span className={styles.contextChipKey}>Market</span>
                                        <span className={styles.contextChipValue}>{activeMarketLabel}</span>
                                    </button>
                                )}
                                {selectedTimeframes.map((tf) => (
                                    <div key={`tf-${tf}`} className={`${styles.contextChip} ${styles.timeframeContextChip}`}>
                                        <span className={styles.contextChipKey}>Timeframe</span>
                                        <span className={styles.contextChipValue}>{tf}</span>
                                        <button
                                            type="button"
                                            className={styles.contextChipRemove}
                                            onClick={() => {
                                                setToolStates(prev => ({
                                                    ...prev,
                                                    timeframe: prev.timeframe.filter(item => item !== tf)
                                                }));
                                            }}
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                                {toolStates.indicators.map((indicator) => (
                                    <div key={`ind-${indicator}`} className={`${styles.contextChip} ${styles.indicatorContextChip}`}>
                                        <span className={styles.contextChipKey}>Indicator</span>
                                        <span className={styles.contextChipValue}>{indicator}</span>
                                        <button
                                            type="button"
                                            className={styles.contextChipRemove}
                                            onClick={() => {
                                                setToolStates(prev => ({
                                                    ...prev,
                                                    indicators: prev.indicators.filter(item => item !== indicator)
                                                }));
                                            }}
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                                {toolStates.webObservation && (
                                    <div className={styles.contextChip}>
                                        <span className={styles.contextChipKey}>Web</span>
                                        <span className={styles.contextChipValue}>Search On</span>
                                    </div>
                                )}
                                {toolStates.knowledgeEnabled && (
                                    <div className={styles.contextChip}>
                                        <span className={styles.contextChipKey}>Knowledge</span>
                                        <span className={styles.contextChipValue}>RAG On</span>
                                    </div>
                                )}
                                {toolStates.memoryEnabled && (
                                    <div className={styles.contextChip}>
                                        <span className={styles.contextChipKey}>Memory</span>
                                        <span className={styles.contextChipValue}>On</span>
                                    </div>
                                )}
                                {toolStates.maxThinking !== DEFAULT_MAX_THINKING && (
                                    <div className={styles.contextChip}>
                                        <span className={styles.contextChipKey}>Max Thinking</span>
                                        <span className={styles.contextChipValue}>{toolStates.maxThinking}</span>
                                    </div>
                                )}
                            </div>
                        )}
                        {isPreparingAttachments && (
                            <div className={styles.loadingRow}>
                                <span className={styles.loadingBars}>
                                    <span className={styles.loadingBar}></span>
                                    <span className={styles.loadingBar}></span>
                                    <span className={styles.loadingBar}></span>
                                    <span className={styles.loadingBar}></span>
                                </span>
                                <span className={styles.loadingText}>Uploading attachments...</span>
                            </div>
                        )}
                        <textarea
                            className={styles.inputField}
                            placeholder="Ask osmo to help you trade..."
                            rows={3}
                            value={inputValue}
                            onChange={(e) => {
                                const nextValue = e.target.value;
                                const foundLinks = extractLinks(nextValue);
                                if (foundLinks.length > 0) {
                                    setInputLinks(prev => Array.from(new Set([...prev, ...foundLinks])));
                                }
                                const cleaned = nextValue
                                    .replace(/\bhttps?:\/\/[^\s<>"]+/gi, '')
                                    .replace(/\s{2,}/g, ' ');
                                setInputValue(cleaned);
                            }}
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
                                accept="image/*,application/pdf,text/*,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
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

                                            {/* 6. Plan Mode */}
                                            <div className={styles.toolItem} onClick={() => setToolStates(prev => ({ ...prev, planMode: !prev.planMode }))}>
                                                <div className={styles.toolIconWrapper}>
                                                    <img src={brainIcon} alt="Plan Mode" width={18} height={18} />
                                                </div>
                                                <span>Plan Mode</span>
                                                <div className={`${styles.toggleSwitch} ${toolStates.planMode ? styles.checked : ''}`}></div>
                                            </div>

                                            {/* 7. More */}
                                            <div className={styles.toolItem} onClick={() => setActiveToolView('more')}>
                                                <div className={styles.toolIconWrapper}>
                                                    <img src={brainIcon} alt="More" width={18} height={18} />
                                                </div>
                                                <span>More</span>
                                                <span className={styles.toolValue}>
                                                    {`${toolStates.webObservation ? 'Web On' : 'Web Off'} | ${toolStates.knowledgeEnabled ? 'Rag On' : 'Rag Off'} | ${toolStates.memoryEnabled ? 'Mem On' : 'Mem Off'} | Max ${toolStates.maxThinking}`}
                                                </span>
                                                <span className={styles.toolArrow}>â€º</span>
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
                                    ) : activeToolView === 'timeframe' ? (
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
                                    ) : (
                                        /* MORE SUB-PAGE */
                                        <div className={styles.toolSubPage}>
                                            <div className={styles.toolPageHeader}>
                                                <button className={styles.backButton} onClick={() => setActiveToolView('main')}>
                                                    â€¹
                                                </button>
                                                <span>More Settings</span>
                                            </div>
                                            <div className={styles.toolList}>
                                                <div
                                                    className={styles.toolItem}
                                                    onClick={() => setToolStates(prev => ({ ...prev, webObservation: !prev.webObservation }))}
                                                >
                                                    <div className={styles.toolIconWrapper}>
                                                        <img src={brainIcon} alt="Web Search" width={18} height={18} />
                                                    </div>
                                                    <span>Web Search</span>
                                                    <div className={`${styles.toggleSwitch} ${toolStates.webObservation ? styles.checked : ''}`}></div>
                                                </div>

                                                <div
                                                    className={styles.toolItem}
                                                    onClick={() => setToolStates(prev => ({ ...prev, memoryEnabled: !prev.memoryEnabled }))}
                                                >
                                                    <div className={styles.toolIconWrapper}>
                                                        <img src={brainIcon} alt="Memory" width={18} height={18} />
                                                    </div>
                                                    <span>Memory</span>
                                                    <div className={`${styles.toggleSwitch} ${toolStates.memoryEnabled ? styles.checked : ''}`}></div>
                                                </div>

                                                <div
                                                    className={styles.toolItem}
                                                    onClick={() => setToolStates(prev => ({ ...prev, knowledgeEnabled: !prev.knowledgeEnabled }))}
                                                >
                                                    <div className={styles.toolIconWrapper}>
                                                        <img src={brainIcon} alt="Knowledge" width={18} height={18} />
                                                    </div>
                                                    <span>Knowledge (RAG)</span>
                                                    <div className={`${styles.toggleSwitch} ${toolStates.knowledgeEnabled ? styles.checked : ''}`}></div>
                                                </div>

                                                <div className={styles.toolItem}>
                                                    <div className={styles.toolIconWrapper}>
                                                        <img src={brainIcon} alt="Max Thinking" width={18} height={18} />
                                                    </div>
                                                    <span>Max Thinking</span>
                                                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setToolStates(prev => ({
                                                                    ...prev,
                                                                    maxThinking: Math.max(MIN_MAX_THINKING, Number(prev.maxThinking || DEFAULT_MAX_THINKING) - 1)
                                                                }));
                                                            }}
                                                            style={{
                                                                width: 24,
                                                                height: 24,
                                                                borderRadius: 6,
                                                                border: '1px solid #3A2530',
                                                                background: '#12000A',
                                                                color: '#FFE1F2',
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            -
                                                        </button>
                                                        <span className={styles.toolValue} style={{ minWidth: 34, textAlign: 'center' }}>
                                                            {toolStates.maxThinking}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setToolStates(prev => ({
                                                                    ...prev,
                                                                    maxThinking: Math.min(MAX_MAX_THINKING, Number(prev.maxThinking || DEFAULT_MAX_THINKING) + 1)
                                                                }));
                                                            }}
                                                            style={{
                                                                width: 24,
                                                                height: 24,
                                                                borderRadius: 6,
                                                                border: '1px solid #3A2530',
                                                                background: '#12000A',
                                                                color: '#FFE1F2',
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                </div>
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
                                <span>{selectedModel || 'Select model'}</span>
                                <div style={{ flex: 1 }}></div>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: isModelMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                                    <path d="M6 9l6 6 6-6" />
                                </svg>
                            </div>
                            {isModelMenuOpen && (
                                <div className={`${styles.modelMenu} ${styles.menuTop}`}>
                                    {/* Modes section */}
                                    <div style={{ padding: '8px', borderBottom: '1px solid #2A1A24', background: '#0A0005' }}>
                                        <div style={{ fontSize: '10px', color: '#5A4A54', marginBottom: '8px', paddingLeft: '8px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>Reasoning Effort</div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                                            {[
                                                { id: 'low', label: 'Low', level: 1 },
                                                { id: 'medium', label: 'Medium', level: 2 },
                                                { id: 'high', label: 'High', level: 3 },
                                                { id: 'extra_high', label: 'Extra High', level: 4 }
                                            ].map(mode => (
                                                <div
                                                    key={mode.id}
                                                    onClick={(e) => { e.stopPropagation(); setReasoningEffort(mode.id as any); }}
                                                    style={{
                                                        padding: '8px',
                                                        borderRadius: '6px',
                                                        background: reasoningEffort === mode.id ? '#3B2030' : '#12000A',
                                                        color: reasoningEffort === mode.id ? '#FFFFFF' : '#A77590',
                                                        fontSize: '11px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '6px',
                                                        cursor: 'pointer',
                                                        border: '1px solid',
                                                        borderColor: reasoningEffort === mode.id ? '#3B2030' : '#2A1A24'
                                                    }}
                                                >
                                                    <span className={styles.reasoningIconGroup}>
                                                        <img src={brainIcon} alt="" className={styles.reasoningIcon} />
                                                    </span>
                                                    <span>{mode.label}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div style={{ fontSize: '10px', color: '#5A4A54', padding: '8px 16px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>Select Model</div>
                                    {availableModels.map((model) => (
                                        <div key={model.id} className={styles.modelMenuItemWrapper}>
                                            <div className={styles.modelMenuItem}>
                                                <div
                                                    className={styles.modelMenuItemMain}
                                                    onClick={() => { setSelectedModel(model.name); setIsModelMenuOpen(false); }}
                                                    style={{ background: selectedModel === model.name ? '#1A0D15' : 'transparent' }}
                                                >
                                                    <span>{model.name}</span>
                                                    {selectedModel === model.name && <span style={{ color: '#3B2030', fontSize: '12px' }}>✓</span>}
                                                </div>
                                            </div>
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
                                className={`${styles.sendAction} ${inputValue.trim() || attachments.length > 0 || inputLinks.length > 0 ? styles.active : ''}`}
                                onClick={handleSend}
                                disabled={isPreparingAttachments || !(inputValue.trim() || attachments.length > 0 || inputLinks.length > 0)}
                            >
                                <img src="/src/assets/Arrow.png" alt="Send" className={styles.arrowIcon} width={18} height={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            {/* Image Overlay */}
            {expandedImage && (
                <div className={styles.imageOverlayBackdrop} onClick={closeExpandedImage}>
                    <div className={styles.imageOverlayContent} onClick={(e) => e.stopPropagation()}>
                        <button className={styles.overlayClose} onClick={closeExpandedImage}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                        <img src={expandedImage.url} alt="Expanded" className={styles.fullImage} />
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
