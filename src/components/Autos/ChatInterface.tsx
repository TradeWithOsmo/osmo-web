import React, { useState, useRef, useEffect, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import styles from "./ChatInterface.module.css";
import type {
  Workspace,
  Message,
  ChatAttachment,
  ThoughtStep,
} from "../../types/autos";
import { usageService } from "../../api/usageService";
import { useWallets, usePrivy } from "@privy-io/react-auth";
import { useUsageStore } from "../../store/useUsageStore";
import brainIcon from "../../assets/Icons/Brain.png";
import gearIcon from "../../assets/Icons/Gear.png";
import MarketIcon from "../MarketDetails/MarketIcon";
import { useMarketStore } from "../../store/useMarketStore";
import { agentService } from "../../api/agentService";
import { useUIStore } from "../../store/useUIStore";

interface ChatInterfaceProps {
  activeSessionId?: string;
  activeSessionTitle?: string;
  messages: Message[];
  onSendMessage: (
    content: string,
    modelId: string,
    attachments?: ChatAttachment[],
    toolStates?: any,
  ) => void;
  isTyping: boolean;
  workspaces?: Workspace[];
  onRenameSession?: (sessionId: string, newName: string) => void;
  onDeleteSession?: (sessionId: string) => void;
  onMoveSessionToWorkspace?: (sessionId: string, workspaceId: string) => void;
  onOpenChart?: (
    symbol?: string,
    indicators?: string[],
    timeframe?: string,
  ) => void;
  onEditMessage?: (
    sessionId: string,
    messageId: string,
    newContent: string,
    modelId?: string,
    reasoningEffort?: string,
    toolStates?: any,
  ) => void;
  onRegenerateResponse?: (
    messageId: string,
    modelId?: string,
    reasoningEffort?: string,
    toolStates?: any,
  ) => void;
  onFeedback?: (messageId: string, feedback: "like" | "dislike" | null) => void;
  currentSymbol?: string;
  currentTimeframe?: string;
  currentIndicators?: string[];
  onToggleMinimize?: () => void;
  isMinimized?: boolean;
  onNewChat?: () => void;
  onStop?: () => void;
}

type IndicatorOption = {
  value: string;
  label: string;
  searchKey: string;
};

const FALLBACK_INDICATOR_VALUES = [
  "RSI",
  "MACD",
  "Bollinger Bands",
  "Moving Average",
  "Volume",
  "Stochastic",
  "ATR",
  "Ichimoku",
  "CCI",
  "Parabolic SAR",
  "VWAP",
  "ADX",
  "OBV",
  "SuperTrend",
  "StochRSI",
];

const prettifyIndicatorToken = (raw: string): string => {
  const value = String(raw || "").trim();
  if (!value) return "";
  const withSpaces = value
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();
  return withSpaces
    .split(" ")
    .map((part) => {
      const upper = part.toUpperCase();
      if (upper === "RSI" || upper === "MACD" || upper === "ATR" || upper === "ADX" || upper === "VWAP" || upper === "VWMA" || upper === "OBV" || upper === "MFI" || upper === "CCI" || upper === "TSI" || upper === "ROC" || upper === "AO" || upper === "CMF" || upper === "DMI" || upper === "KST" || upper === "VPVR" || upper === "VPFR" || upper === "SAR") {
        return upper;
      }
      if (upper.length <= 2) return upper;
      return upper.charAt(0) + upper.slice(1).toLowerCase();
    })
    .join(" ");
};

const buildIndicatorOptions = (
  aliasMap: Record<string, string> = {},
): IndicatorOption[] => {
  const merged = new Map<string, IndicatorOption>();

  const addOption = (rawValue: string, rawCanonical?: string) => {
    const value = String(rawValue || "").trim();
    if (!value) return;
    const normalizedValue = prettifyIndicatorToken(value);
    const canonical = prettifyIndicatorToken(rawCanonical || value);
    const label =
      canonical &&
        canonical.toLowerCase() !== normalizedValue.toLowerCase()
        ? `${normalizedValue} (${canonical})`
        : normalizedValue;
    const key = normalizedValue.toLowerCase();
    if (!merged.has(key)) {
      merged.set(key, {
        value: normalizedValue,
        label,
        searchKey: `${normalizedValue} ${canonical}`.toLowerCase(),
      });
    }
  };

  Object.entries(aliasMap || {}).forEach(([alias, canonical]) =>
    addOption(alias, canonical),
  );
  FALLBACK_INDICATOR_VALUES.forEach((item) => addOption(item, item));

  return Array.from(merged.values()).sort((a, b) =>
    a.label.localeCompare(b.label),
  );
};

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  activeSessionId,
  messages,
  onSendMessage,
  isTyping,
  onOpenChart,
  onEditMessage,
  onRegenerateResponse,
  onFeedback,

  currentSymbol,
  currentTimeframe,
  currentIndicators,
  onStop,
}) => {
  const [inputValue, setInputValue] = useState("");
  const [inputLinks, setInputLinks] = useState<string[]>([]);
  const [loadingDotCount, setLoadingDotCount] = useState(1);

  const { markets, fetchMarkets, selectedMarket } = useMarketStore();
  useEffect(() => {
    if (markets.length === 0) {
      fetchMarkets();
    }
  }, [markets.length, fetchMarkets]);

  const marketByBase = useMemo(() => {
    const map = new Map<string, any>();
    markets.forEach((m) => {
      const base = (m.symbol || "").split("-")[0]?.toUpperCase();
      if (base && !map.has(base)) {
        map.set(base, m);
      }
    });
    return map;
  }, [markets]);

  const marketBySymbol = useMemo(() => {
    const map = new Map<string, any>();
    markets.forEach((m) => {
      const raw = (m.symbol || "").toUpperCase();
      if (!raw) return;
      map.set(raw, m);
      if (raw.includes("-")) {
        map.set(raw.replace("-", "/"), m);
      }
      if (raw.includes("/")) {
        map.set(raw.replace("/", "-"), m);
      }
    });
    return map;
  }, [markets]);

  const formatPrice = (val: number) => {
    if (!val && val !== 0) return "-";
    if (val === 0) return "0.0000";
    const locale = "en-US";
    if (val >= 100) {
      return `${val.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `${val.toLocaleString(locale, { minimumFractionDigits: 4, maximumFractionDigits: 4 })}`;
  };

  const timeframes = ["1m", "5m", "15m", "1H", "4H", "1D", "1W"];
  const indicatorAliases: Record<string, { label: string; study: string }> = {
    RSI: { label: "RSI", study: "RSI" },
    MACD: { label: "MACD", study: "MACD" },
    ATR: { label: "ATR", study: "ATR" },
    CCI: { label: "CCI", study: "CCI" },
    STOCHASTIC: { label: "Stochastic", study: "Stochastic" },
    STOCH: { label: "Stochastic", study: "Stochastic" },
    "BOLLINGER BANDS": { label: "Bollinger Bands", study: "Bollinger Bands" },
    BB: { label: "Bollinger Bands", study: "Bollinger Bands" },
    "ICHIMOKU CLOUD": { label: "Ichimoku Cloud", study: "Ichimoku Cloud" },
    ICHIMOKU: { label: "Ichimoku Cloud", study: "Ichimoku Cloud" },
    "PARABOLIC SAR": { label: "Parabolic SAR", study: "Parabolic SAR" },
    PSAR: { label: "Parabolic SAR", study: "Parabolic SAR" },
    "MOVING AVERAGE": { label: "Moving Average", study: "Moving Average" },
    EMA: { label: "EMA", study: "Moving Average" },
    SMA: { label: "SMA", study: "Moving Average" },
    WMA: { label: "WMA", study: "Moving Average" },
  };

  const indicatorRegex = useMemo(() => {
    const group = [
      "RSI",
      "MACD",
      "ATR",
      "CCI",
      "Stochastic",
      "Stoch",
      "Bollinger\\s+Bands",
      "BB",
      "Ichimoku\\s+Cloud",
      "Ichimoku",
      "Parabolic\\s+SAR",
      "PSAR",
      "Moving\\s+Average",
      "EMA",
      "SMA",
      "WMA",
    ].join("|");
    return new RegExp(`\\b(${group})\\s*[:\\-\\(\\[]?\\s*(\\d{1,4})\\b`, "gi");
  }, []);

  const timeframeMap = useMemo(() => {
    const map = new Map<string, string>();
    timeframes.forEach((tf) => map.set(tf.toLowerCase(), tf));
    return map;
  }, [timeframes]);

  const normalizeTimeframeLabel = (value?: string | null): string => {
    const raw = String(value || "").trim();
    if (!raw) return "";

    const byMap = timeframeMap.get(raw.toLowerCase());
    if (byMap) return byMap;

    const upper = raw.toUpperCase();
    const directMap: Record<string, string> = {
      "1": "1m",
      "3": "3m",
      "5": "5m",
      "15": "15m",
      "30": "30m",
      "60": "1H",
      "240": "4H",
      D: "1D",
      "1D": "1D",
      W: "1W",
      "1W": "1W",
    };
    if (directMap[upper]) return directMap[upper];

    if (/^\d+$/.test(raw)) {
      const minutes = Number(raw);
      if (minutes > 0 && minutes < 60) return `${minutes}m`;
      if (minutes % 60 === 0 && minutes < 1440) return `${minutes / 60}H`;
      return `${minutes}m`;
    }
    return raw;
  };

  const renderToolNameNodes = (text: string, keyPrefix: string) => {
    const regex =
      /\b(?:get|add|set|place|open|close|fetch|update|list|create|delete|remove|capture|draw|write)_[a-z0-9_]{2,}\b/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }
      const token = match[0];
      parts.push(
        <span
          key={`${keyPrefix}-tool-${token}-${match.index}`}
          className={styles.toolUsageInlinePill}
        >
          {token.replace(/_/g, " ")}
        </span>,
      );
      lastIndex = match.index + token.length;
    }

    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts.length ? parts : [text];
  };

  const renderSymbolNodes = (text: string, keyPrefix: string) => {
    const regex =
      /\b[A-Z0-9]{2,12}(?:[-/][A-Z0-9]{2,12})?\b|\b\d{1,3}[mhdw]\b/gi;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      const token = match[0];
      const isTimeframe = /^\d/.test(token);
      const timeframeLabel = isTimeframe
        ? timeframeMap.get(token.toLowerCase())
        : undefined;

      if (isTimeframe && !timeframeLabel) continue;

      const tokenUpper = token.toUpperCase();
      const market = !isTimeframe
        ? marketBySymbol.get(tokenUpper) ||
        marketByBase.get(tokenUpper.split(/[-/]/)[0])
        : undefined;

      if (!isTimeframe && !market) continue;

      if (match.index > lastIndex) {
        parts.push(
          ...renderToolNameNodes(
            text.slice(lastIndex, match.index),
            `${keyPrefix}-txt-${match.index}`,
          ),
        );
      }

      if (isTimeframe && timeframeLabel) {
        const targetSymbol =
          currentSymbol || selectedMarket?.symbol || "BTC/USDT";
        parts.push(
          <button
            key={`${keyPrefix}-tf-${timeframeLabel}-${match.index}`}
            className={styles.timeframeBadge}
            type="button"
            onClick={() => {
              setToolStates((prev) => ({
                ...prev,
                timeframe: [timeframeLabel],
              }));
              onOpenChart?.(targetSymbol, undefined, timeframeLabel);
            }}
            title={`Set timeframe ${timeframeLabel}`}
          >
            <span className={styles.timeframeBadgeText}>{timeframeLabel}</span>
          </button>,
        );
      } else {
        const displaySymbol = tokenUpper.split(/[-/]/)[0];
        const price = market?.price || 0;
        const priceLabel = price ? `$${formatPrice(price)}` : "-";
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
              : "";

        const tvSymbol = market?.symbol || displaySymbol;
        parts.push(
          <button
            key={`${keyPrefix}-sym-${tokenUpper}-${match.index}`}
            className={styles.symbolBadge}
            type="button"
            onClick={() => onOpenChart?.(tvSymbol)}
            title={`Open ${tvSymbol}`}
          >
            <MarketIcon
              symbol={displaySymbol}
              size={16}
              className={styles.symbolBadgeIcon}
            />
            <span className={styles.symbolBadgeText}>{displaySymbol}</span>
            <span className={`${styles.symbolBadgePrice} ${priceTrendClass}`}>
              {priceLabel}
            </span>
          </button>,
        );
      }

      lastIndex = match.index + token.length;
    }

    if (lastIndex < text.length) {
      parts.push(
        ...renderToolNameNodes(text.slice(lastIndex), `${keyPrefix}-tail`),
      );
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
      const normalized = rawName.replace(/\s+/g, " ").toUpperCase();
      const config = indicatorAliases[normalized];
      if (!config) continue;

      if (match.index > lastIndex) {
        parts.push(
          ...renderSymbolNodes(
            text.slice(lastIndex, match.index),
            `seg-${segIndex++}`,
          ),
        );
      }

      const targetSymbol =
        currentSymbol || selectedMarket?.symbol || "BTC/USDT";
      parts.push(
        <button
          key={`ind-${normalized}-${match.index}`}
          className={styles.indicatorBadge}
          type="button"
          onClick={() => {
            setToolStates((prev) => ({
              ...prev,
              indicators: prev.indicators.includes(config.study)
                ? prev.indicators
                : [...prev.indicators, config.study],
            }));
            onOpenChart?.(targetSymbol, [config.study]);
          }}
          title={`Add ${config.study}`}
        >
          <span className={styles.indicatorBadgeText}>{config.label}</span>
          <span className={styles.indicatorBadgeNumber}>{number}</span>
        </button>,
      );

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push(
        ...renderSymbolNodes(text.slice(lastIndex), `seg-${segIndex++}`),
      );
    }

    return parts.length ? parts : renderSymbolNodes(text, "seg-0");
  };

  const { wallets } = useWallets();
  const { authenticated } = usePrivy();
  const { hasSession, isSessionChecking } = useUIStore();
  const userAddress = wallets[0]?.address;
  const hasWalletConnection = Boolean(authenticated && userAddress);
  const storedSessionKey = localStorage.getItem("osmo_session_key");
  const storedSessionAddress = localStorage.getItem("osmo_session_address");
  const hasStoredSessionForWallet = Boolean(
    storedSessionKey &&
    (!storedSessionAddress ||
      !userAddress ||
      storedSessionAddress.toLowerCase() === userAddress.toLowerCase()),
  );
  const hasValidSession = Boolean(hasSession || hasStoredSessionForWallet);
  const isSessionBlocked = Boolean(
    !hasValidSession || (isSessionChecking && !hasStoredSessionForWallet),
  );

  // Model Selection State
  const [selectedModel, setSelectedModel] = useState("");
  const [reasoningEffort, setReasoningEffort] = useState<
    "low" | "medium" | "high" | "extra_high"
  >("medium");
  const [availableModels, setAvailableModels] = useState<
    { id: string; name: string }[]
  >([]);
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);

  const { enabledModels, fetchEnabledModels, stats } = useUsageStore();
  const usageCreditBalance = Number(stats?.credit_balance ?? 0);
  const hasUsageCredit = usageCreditBalance > 0;
  const isUsageBlocked = Boolean(
    hasWalletConnection && !isSessionBlocked && !hasUsageCredit,
  );

  const ensureUsageCredit = () => {
    if (hasUsageCredit) return true;
    alert(
      "AI credit balance kosong. Deposit dulu ke AI Vault untuk pakai chat.",
    );
    return false;
  };

  // 1. Initial load of enabled models
  useEffect(() => {
    fetchEnabledModels(userAddress);
  }, [userAddress, fetchEnabledModels]);

  // 2. React to changes in enabledModels or fetch all models
  useEffect(() => {
    const syncModels = async () => {
      try {
        const allModels = await usageService.getModels();
        const enabledIds = Object.keys(enabledModels).filter(
          (id) => enabledModels[id],
        );

        // Keep provider list strict: enabled models only.
        let filtered = allModels.filter((m: any) => enabledIds.includes(m.id));

        if (filtered.length === 0 && allModels.length > 0) {
          filtered = allModels;
        }

        if (filtered.length > 0) {
          setAvailableModels(filtered);
          setSelectedModel((prevSelected) => {
            const isSelectedStillAvailable = filtered.some(
              (m: any) => m.name === prevSelected,
            );
            return isSelectedStillAvailable ? prevSelected : filtered[0].name;
          });
        } else {
          setAvailableModels([]);
          setSelectedModel("");
        }
      } catch (err) {
        console.error("Sync models failed", err);
      }
    };
    syncModels();
  }, [enabledModels]);

  const [voiceLanguage, setVoiceLanguage] = useState("en-US"); // Default fallback
  const [isVoiceLanguageMenuOpen, setIsVoiceLanguageMenuOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const languages = [
    { code: "en-US", label: "English", short: "EN" },
    { code: "id-ID", label: "Indonesia", short: "ID" },
    { code: "zh-CN", label: "Chinese", short: "ZH" },
    { code: "ja-JP", label: "Japanese", short: "JP" },
    { code: "ko-KR", label: "Korean", short: "KO" },
    { code: "es-ES", label: "Spanish", short: "ES" },
    { code: "fr-FR", label: "French", short: "FR" },
    { code: "de-DE", label: "German", short: "DE" },
    { code: "ru-RU", label: "Russian", short: "RU" },
    { code: "pt-PT", label: "Portuguese", short: "PT" },
  ];

  // Auto-detect language on mount (with persistence)
  useEffect(() => {
    const savedLang = localStorage.getItem("chat_voice_language");
    if (savedLang) {
      setVoiceLanguage(savedLang);
      return;
    }

    const browserLang = navigator.language;
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // 1. Try timezone deduction
    if (
      timeZone &&
      (timeZone.startsWith("Asia/Jakarta") ||
        timeZone.startsWith("Asia/Pontianak") ||
        timeZone.startsWith("Asia/Makassar") ||
        timeZone.startsWith("Asia/Jayapura"))
    ) {
      setVoiceLanguage("id-ID");
      return;
    }

    // 2. Try browser language matching
    const found = languages.find(
      (l) =>
        l.code === browserLang || l.code.startsWith(browserLang.split("-")[0]),
    );

    if (found) {
      setVoiceLanguage(found.code);
    }
  }, []);

  // Tools State
  const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false);
  const [toolStates, setToolStates] = useState({
    execution: false,
    write: true,
    timeframe: [] as string[],
    indicators: [] as string[],
    conversation_style: "normal" as
      | "normal"
      | "learning"
      | "concise"
      | "explanatory"
      | "formal",
    trading_style_profile: "off" as
      | "off"
      | "jesse_livermore"
      | "paul_tudor_jones"
      | "mark_minervini"
      | "nicolas_darvas"
      | "william_oneil"
      | "stan_weinstein"
      | "willy_woo"
      | "rekt_capital"
      | "benjamin_cowen",
    webObservation: false,
    memoryEnabled: false,
  });
  const [activeToolView, setActiveToolView] = useState<
    "main" | "indicators" | "timeframe" | "more" | "style"
  >("main");
  const [openStyleSection, setOpenStyleSection] = useState<
    null | "conversation" | "trading"
  >("conversation");
  const [indicatorSearch, setIndicatorSearch] = useState("");
  const [indicatorOptions, setIndicatorOptions] = useState<IndicatorOption[]>(
    () => buildIndicatorOptions(),
  );
  const toolsRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isPreparingAttachments, setIsPreparingAttachments] = useState(false);
  const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024; // 5MB per file
  const attachmentPreviews = useMemo(
    () =>
      attachments.map((file) => ({
        file,
        url: URL.createObjectURL(file),
      })),
    [attachments],
  );

  useEffect(() => {
    return () => {
      attachmentPreviews.forEach((preview) => {
        URL.revokeObjectURL(preview.url);
      });
    };
  }, [attachmentPreviews]);

  // Persist style settings (keep runtime tool_states stable across reloads)
  useEffect(() => {
    const rawConv = localStorage.getItem("chat_conversation_style");
    const rawProfile = localStorage.getItem("chat_trading_style_profile");
    const allowedConv = new Set([
      "normal",
      "learning",
      "concise",
      "explanatory",
      "formal",
    ]);
    const allowedProfile = new Set([
      "off",
      "jesse_livermore",
      "paul_tudor_jones",
      "mark_minervini",
      "nicolas_darvas",
      "william_oneil",
      "stan_weinstein",
      "willy_woo",
      "rekt_capital",
      "benjamin_cowen",
    ]);

    setToolStates((prev) => ({
      ...prev,
      conversation_style: allowedConv.has(String(rawConv))
        ? (rawConv as any)
        : prev.conversation_style,
      trading_style_profile: allowedProfile.has(String(rawProfile))
        ? (rawProfile as any)
        : prev.trading_style_profile,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        "chat_conversation_style",
        toolStates.conversation_style,
      );
      localStorage.setItem(
        "chat_trading_style_profile",
        toolStates.trading_style_profile,
      );
    } catch {
      // Ignore persistence failures (private mode, quota, etc.)
    }
  }, [toolStates.conversation_style, toolStates.trading_style_profile]);

  useEffect(() => {
    let cancelled = false;
    const loadIndicatorOptions = async () => {
      try {
        const payload = await agentService.getTradingViewIndicatorAliases();
        const aliasMap =
          payload && typeof payload === "object" && payload.alias_map
            ? payload.alias_map
            : {};
        const options = buildIndicatorOptions(aliasMap);
        if (!cancelled && options.length > 0) {
          setIndicatorOptions(options);
        }
      } catch (error) {
        console.warn(
          "[ChatInterface] Failed loading indicator aliases, using fallback list.",
          error,
        );
      }
    };
    loadIndicatorOptions();
    return () => {
      cancelled = true;
    };
  }, []);

  const readFileAsDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () =>
        reject(reader.error || new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  };

  const buildAttachmentPayloads = async (
    files: File[],
  ): Promise<ChatAttachment[]> => {
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
          type: file.type || "application/octet-stream",
          data: dataUrl,
          size: file.size,
        });
      }),
    );

    if (errors.length > 0) {
      alert(errors.join("\n"));
    }

    return payloads;
  };
  const [expandedImage, setExpandedImage] = useState<{
    name: string;
    url: string;
  } | null>(null);

  const closeExpandedImage = () => {
    if (expandedImage?.url?.startsWith("blob:")) {
      URL.revokeObjectURL(expandedImage.url);
    }
    setExpandedImage(null);
  };

  // Editing State
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleEditClick = (msg: Message) => {
    setEditingMessageId(msg.id);
    setEditValue(msg.content);
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditValue("");
  };

  const getSelectedModelId = () => {
    const byName = availableModels.find((m) => m.name === selectedModel);
    if (byName?.id) return byName.id;
    const byId = availableModels.find((m) => m.id === selectedModel);
    if (byId?.id) return byId.id;
    return availableModels[0]?.id;
  };

  const buildOutboundToolStates = () => {
    const marketRaw = currentSymbol || selectedMarket?.symbol || "";
    const normalizedMarket = marketRaw
      ? marketRaw.replace("/", "-").toUpperCase()
      : "";
    const normalizedChartTimeframe = normalizeTimeframeLabel(currentTimeframe);
    const marketActiveIndicators = Array.from(
      new Set(
        (Array.isArray(currentIndicators) ? currentIndicators : [])
          .map((item) => String(item || "").trim())
          .filter(Boolean),
      ),
    );
    const selectedModelId = getSelectedModelId();
    const timeframeCandidates = Array.isArray(toolStates.timeframe)
      ? toolStates.timeframe
      : toolStates.timeframe
        ? [toolStates.timeframe]
        : [];
    const timeframeList = Array.from(
      new Set(
        timeframeCandidates
          .map((item) => normalizeTimeframeLabel(String(item || "").trim()))
          .filter(Boolean),
      ),
    );
    const indicatorList = Array.isArray(toolStates.indicators)
      ? toolStates.indicators
      : [];

    const styleProfile = toolStates.trading_style_profile;
    const STYLE_PROMPTS: Record<string, string> = {
      jesse_livermore:
        "Use pivotal points + trend confirmation. Prefer breakouts to new highs with volume expansion; add only as trend proves (pyramiding). Cut losses fast; never average down.",
      paul_tudor_jones:
        "Use 200D MA as primary regime filter; align direction with the regime. Keep risk tiny per trade; exit quickly when regime breaks. Prioritize defense and asymmetry.",
      mark_minervini:
        "Use trend-template alignment (price above rising MAs) and contraction/VCP patterns with volume dry-up. Enter on pivot breakout with volume. Use tight invalidation; avoid late entries.",
      nicolas_darvas:
        "Use box/range structure: define box high/low, trade breakouts with volume confirmation, and trail risk to the bottom of the current box. Prefer new highs; avoid chop.",
      william_oneil:
        "Use base-breakout logic with relative strength and volume confirmation. Prefer leading strength; avoid weak/lagging names. Use strict stops and focus on clean setups.",
      stan_weinstein:
        "Use stage analysis with a long MA (e.g., 30-week/200D) slope. Favor stage-2 breakouts, avoid stage-4 downtrends, and reduce/exit in stage-3 topping behavior.",
      willy_woo:
        "Combine on-chain regime signals (flows, valuation bands, holder behavior) with price action to set bias. Prefer higher timeframes for bias; use risk controls for perps volatility.",
      rekt_capital:
        "Use cycle/phase awareness and range re-accumulation structure. Focus on key range levels and post-event phase shifts; avoid forcing trades mid-range without confirmation.",
      benjamin_cowen:
        "Use macro + dominance/regime framing and long-term support-band logic to set risk-on/off posture. Prefer probabilistic, risk-managed positioning over precise predictions.",
    };

    const commonStylePrefix =
      "Apply only for trading/TA. Prioritize selected timeframe+indicators. Do not mention trader/style names. Output: Context, Signals, Levels, Risk.";
    const stylePromptCore = STYLE_PROMPTS[styleProfile] || "";
    const tradingStylePrompt = stylePromptCore
      ? `${commonStylePrefix} ${stylePromptCore}`
      : "";

    return {
      ...toolStates,
      execution: !!toolStates.execution,
      write: !!toolStates.write,
      // Execution policy:
      // - execution=false => execution tools are not exposed to the agent
      // - execution=true => allow execution tools, with policy_mode=auto_exec for immediate execution
      policy_mode: toolStates.execution ? "auto_exec" : "advice_only",
      planner_source: "ai",
      planner_fallback: "none",
      ...(selectedModelId ? { planner_model_id: selectedModelId } : {}),
      reasoning_effort: reasoningEffort,
      web_observation_enabled: !!toolStates.webObservation,
      memory_enabled: !!toolStates.memoryEnabled,
      strict_react: true,
      tool_retry_max: 1,
      tool_profile: "compact",
      model_timeout_sec: 90,
      market_symbol: normalizedMarket,
      market_display: marketRaw
        ? marketRaw.replace(/-/g, "/")
        : normalizedMarket.replace(/-/g, "/"),
      ...(normalizedChartTimeframe
        ? { market_timeframe: normalizedChartTimeframe }
        : {}),
      market_active_indicators: marketActiveIndicators,
      preferred_timeframes: timeframeList,
      preferred_indicators: indicatorList,
      timeframe: normalizedChartTimeframe
        ? [normalizedChartTimeframe]
        : timeframeList,
      ...(tradingStylePrompt
        ? {
          trading_style: styleProfile,
          trading_style_prompt: tradingStylePrompt,
        }
        : {}),
    };
  };

  const resolveDispatchToolStates = async () => {
    const outbound = buildOutboundToolStates();
    if (!outbound.write) {
      return outbound;
    }

    const marketRaw = currentSymbol || selectedMarket?.symbol || "";
    const symbolQuery = marketRaw
      ? marketRaw.replace("/", "-").toUpperCase()
      : undefined;
    try {
      const status = await agentService.getTradingViewConsumerStatus(
        symbolQuery,
        6,
      );
      if (status && status.consumer_online === false) {
        setToolStates((prev) =>
          prev.write ? { ...prev, write: false } : prev,
        );
        alert(
          "Allow Write dimatikan otomatis untuk request ini karena TradingView chart belum aktif. " +
          "Buka chart dulu lalu coba lagi.",
        );
        return {
          ...outbound,
          write: false,
          write_auto_disabled_reason: "tradingview_consumer_offline",
        };
      }
    } catch (error) {
      // Keep backward-compatible behavior when the status endpoint is unavailable.
      console.warn(
        "TradingView consumer status check failed, continuing with current write flag.",
        error,
      );
    }

    return outbound;
  };

  useEffect(() => {
    const hasActiveLoading = isTyping || isPreparingAttachments;
    if (!hasActiveLoading) {
      setLoadingDotCount(1);
      return;
    }
    const timer = setInterval(() => {
      setLoadingDotCount((prev) => (prev % 3) + 1);
    }, 420);
    return () => clearInterval(timer);
  }, [isTyping, isPreparingAttachments]);

  const handleSaveEdit = async (msgId: string) => {
    if (onEditMessage && activeSessionId) {
      const modelId = getSelectedModelId();
      if (!modelId) {
        alert("Model belum dipilih. Pilih model dulu.");
        return;
      }
      const outboundToolStates = await resolveDispatchToolStates();
      onEditMessage(
        activeSessionId,
        msgId,
        editValue,
        modelId,
        reasoningEffort,
        outboundToolStates,
      );
      // Optionally trigger regeneration here if desired, but for now just edit
    }
    setEditingMessageId(null);
    setEditValue("");
  };

  const handleRegenerate = async (content: string) => {
    if (!ensureUsageCredit()) return;
    const modelId = getSelectedModelId();
    if (!modelId) {
      alert("Model belum dipilih. Pilih model dulu.");
      return;
    }
    const outboundToolStates = await resolveDispatchToolStates();
    onSendMessage(content, modelId, [], outboundToolStates);
  };

  const handleAssistantRegenerate = async (messageId: string) => {
    if (!onRegenerateResponse) return;
    if (!ensureUsageCredit()) return;
    const modelId = getSelectedModelId();
    if (!modelId) {
      alert("Model belum dipilih. Pilih model dulu.");
      return;
    }
    const outboundToolStates = await resolveDispatchToolStates();
    onRegenerateResponse(
      messageId,
      modelId,
      reasoningEffort,
      outboundToolStates,
    );
  };

  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const formatTime = (timestamp?: number) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date
      .toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
      .replace(":", ".");
  };

  const getLinkDomain = (href?: string) => {
    if (!href) return "";
    try {
      const url = new URL(href);
      return url.hostname.replace(/^www\./, "");
    } catch {
      return "";
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
      const parts = u.pathname.split("/").filter(Boolean);
      return parts[parts.length - 1] || u.hostname;
    } catch {
      return url;
    }
  };

  const loadingDots = ".".repeat(loadingDotCount);

  // NOTE: do NOT add trailing dots here — animated {loadingDots} is appended in JSX
  const normalizeLoadingLabel = (raw: string) => {
    if (!raw) return "";
    const key = raw.trim().toLowerCase().replace(/[-\s]+/g, "_");
    // Suppress round-number phases — show generic label
    if (/^tool_round_\d+$/.test(key)) return "Working";
    // Suppress generic runtime noise
    if (["runtime_ready", "plan_ready", "tool_round_complete"].includes(key)) return "";
    // Known phase → human label (no trailing dots)
    const phaseLabels: Record<string, string> = {
      plan_start: "Planning",
      tool_execution: "Working",
      tool_followup: "Following up",
      execution_adapter: "Executing",
    };
    if (phaseLabels[key]) return phaseLabels[key];
    // Looks like a tool name → humanize
    if (/^[a-z][a-z0-9]*(_[a-z0-9]+)+$/.test(key)) {
      const toolLabels: Record<string, string> = {
        get_price: "Fetching price", get_indicators: "Reading indicators",
        get_technical_analysis: "Running analysis", get_technical_summary: "Summarizing market",
        get_high_low_levels: "Finding S/R levels", get_candles: "Loading candles",
        get_funding_rate: "Checking funding rate", get_ticker_stats: "Loading stats",
        research_market: "Researching market", compare_markets: "Comparing markets",
        scan_market_overview: "Scanning markets", search_news: "Searching news",
        search_sentiment: "Analyzing sentiment", search_web: "Browsing web",
        search_web_hybrid: "Searching web", add_memory: "Saving to memory",
        search_memory: "Recalling memory", get_recent_history: "Loading history",
        get_positions: "Loading positions", place_order: "Preparing order",
        get_active_indicators: "Reading chart", draw: "Drawing on chart",
        add_indicator: "Adding indicator", remove_indicator: "Removing indicator",
        set_symbol: "Switching symbol", set_timeframe: "Switching timeframe",
      };
      if (toolLabels[key]) return toolLabels[key];
      // Generic verb pattern
      const m = key.match(/^(get|search|scan|fetch|add|remove|clear|update|verify|place|draw|close|cancel|adjust|setup)_(.+)$/);
      if (m) {
        const verbMap: Record<string, string> = {
          get: "Getting", search: "Searching", scan: "Scanning", fetch: "Fetching",
          add: "Adding", remove: "Removing", clear: "Clearing", update: "Updating",
          verify: "Verifying", place: "Placing", draw: "Drawing", close: "Closing",
          cancel: "Cancelling", adjust: "Adjusting", setup: "Setting up",
        };
        const verb = verbMap[m[1]] || (m[1].charAt(0).toUpperCase() + m[1].slice(1) + "ing");
        const noun = m[2].replace(/_/g, " ");
        return `${verb} ${noun}`;
      }
    }
    // Fallback — clean underscores, capitalize, strip trailing punctuation
    const compact = raw.replace(/_/g, " ").replace(/\s+/g, " ").trim();
    return compact.charAt(0).toUpperCase() + compact.slice(1).replace(/[.!?]+$/, "");
  };

  const isPhaseActive = (statusRaw: string) => {
    const status = statusRaw.trim().toLowerCase();
    if (!status) return true;
    return [
      "running",
      "in_progress",
      "processing",
      "pending",
      "queued",
      "started",
      "streaming",
      "active",
    ].some((token) => status.includes(token));
  };

  const getAssistantLoadingLabel = (msg: Message) => {
    const runtimePhases = Array.isArray(msg.runtimePhases)
      ? msg.runtimePhases
      : [];
    if (runtimePhases.length > 0) {
      const runtimeActive = [...runtimePhases]
        .reverse()
        .find((phase) => isPhaseActive(String(phase?.status || "")));
      const runtimeLatest =
        runtimeActive || runtimePhases[runtimePhases.length - 1];
      const runtimeLabel = normalizeLoadingLabel(
        String(runtimeLatest?.detail || runtimeLatest?.name || ""),
      );
      if (runtimeLabel) return runtimeLabel;
    }

    const thoughtObjects = (Array.isArray(msg.thoughts) ? msg.thoughts : [])
      .filter((item) => {
        if (!item || typeof item !== "object") return false;
        const title = String((item as any).title || "").trim();
        const content = String((item as any).content || "").trim();
        const combined = `${title}\n${content}`;
        const isSummary =
          /reflexion\s+summary/i.test(combined) ||
          (/steps\s*=\s*\d+/i.test(combined) &&
            /good\s*=\s*\d+/i.test(combined) &&
            /errors\s*=\s*\d+/i.test(combined));
        return !isSummary;
      })
      .filter(
        (item): item is ThoughtStep =>
          !!item && typeof item === "object" && "title" in item,
      );
    if (thoughtObjects.length > 0) {
      const thoughtActive = [...thoughtObjects]
        .reverse()
        .find((item) => isPhaseActive(String(item?.status || "")));
      const thoughtLatest =
        thoughtActive || thoughtObjects[thoughtObjects.length - 1];
      const thoughtLabel = normalizeLoadingLabel(
        String(thoughtLatest?.title || thoughtLatest?.content || ""),
      );
      if (thoughtLabel) return thoughtLabel;
    }
    if (isTyping) return "Working";
    return "Loading";
  };

  const parseLegacyThoughtText = (
    rawText: string,
  ): {
    type: "text" | "tool";
    title: string;
    content: string;
    toolName?: string;
    phase?: string;
  } => {
    const original = String(rawText || "")
      .replace(/\s+/g, " ")
      .trim();
    if (!original) {
      return { type: "text", title: "", content: "" };
    }

    let text = original.replace(/^[-*]\s+/, "").trim();
    let phase = "";
    const phaseMatch = text.match(/^\[([a-z0-9_:-]+)\]\s*(.*)$/i);
    if (phaseMatch) {
      phase = String(phaseMatch[1] || "")
        .trim()
        .toLowerCase();
      text = String(phaseMatch[2] || "").trim();
    }

    let title = text;
    let content = "";

    const semicolonIdx = text.indexOf(";");
    if (semicolonIdx > 0) {
      title = text.slice(0, semicolonIdx).trim();
      content = text.slice(semicolonIdx + 1).trim();
    } else {
      const becauseIdx = text.toLowerCase().indexOf(" because ");
      if (becauseIdx > 0) {
        title = text.slice(0, becauseIdx).trim();
        content = text.slice(becauseIdx + " because ".length).trim();
      } else {
        const colonIdx = text.indexOf(":");
        if (colonIdx > 0 && colonIdx <= 42) {
          title = text.slice(0, colonIdx).trim();
          content = text.slice(colonIdx + 1).trim();
        }
      }
    }

    const toolMatch =
      text.match(
        /\b(?:used|using|call(?:ed)?|invoke(?:d)?)\s+([a-z_][a-z0-9_]*)\b/i,
      ) ||
      text.match(
        /\b(get_[a-z0-9_]+|search_[a-z0-9_]+|set_[a-z0-9_]+|add_[a-z0-9_]+|remove_[a-z0-9_]+|verify_[a-z0-9_]+|place_order|draw|update_drawing|clear_drawings)\b/i,
      );
    const toolName = toolMatch ? String(toolMatch[1] || "").trim() : "";

    const lower = text.toLowerCase();
    if (lower.startsWith("user query")) {
      title = "Intent Assessment";
      if (!content) content = text;
    } else if (lower.startsWith("evidence sufficient")) {
      title = "Evidence Sufficiency";
      if (!content) content = text;
    } else if (lower.includes("no need for more tools")) {
      title = "Tool Budget Decision";
      if (!content) content = text;
    } else if (lower.includes("ambiguous")) {
      title = "Ambiguity Check";
      if (!content) content = text;
    }

    const type: "text" | "tool" = toolName ? "tool" : "text";
    return {
      type,
      title: title || text,
      content: content || "",
      toolName: toolName || undefined,
      phase: phase || undefined,
    };
  };

  const deriveReasoningPresentation = (
    rawTitle: string,
    rawContent: string,
  ): { title: string; content: string } => {
    let title = String(rawTitle || "").trim();
    let content = String(rawContent || "").trim();

    content = content
      .replace(/<\/?step_\d+\/\d+>/gi, "")
      .replace(/<\/?reflexion_update>/gi, "")
      .replace(/<\/?reflection>/gi, "")
      .replace(/<\/?thinking>/gi, "")
      .replace(/<\/?scratchpad>/gi, "")
      .replace(/<\/?internal>/gi, "")
      .replace(/<\/?analysis>/gi, "");

    title = title
      .replace(/<\/?step_\d+\/\d+>/gi, "")
      .replace(/<\/?reflexion_update>/gi, "")
      .replace(/<\/?reflection>/gi, "")
      .replace(/<\/?thinking>/gi, "")
      .replace(/<\/?scratchpad>/gi, "")
      .replace(/<\/?internal>/gi, "")
      .replace(/<\/?analysis>/gi, "")
      .trim();

    const isGenericTitle =
      !title ||
      /^(?:reasoning(?:\s*(?:trace|\d+))?|analysis|thinking|intent|strategy)$/i.test(title);

    if (!isGenericTitle) {
      return { title, content };
    }

    const fromBold = content.match(/^\s*\*\*([^*\n]{3,120})\*\*\s*/);
    if (fromBold?.[1]) {
      const extracted = fromBold[1].trim();
      const contentWithoutLead = content.replace(fromBold[0], "").trim();
      return {
        title: extracted || "Reasoning",
        content: contentWithoutLead || content,
      };
    }

    const fromHeading = content.match(/^\s{0,3}#{1,6}\s+(.+?)\s*(?:\n|$)/);
    if (fromHeading?.[1]) {
      const extracted = fromHeading[1].trim();
      return { title: extracted || "Reasoning", content };
    }

    const sentenceLead = content.match(/^(.{12,90}?)(?:[.!?](?:\s|$)|\n|$)/);
    if (sentenceLead?.[1]) {
      return { title: sentenceLead[1].trim(), content };
    }

    return { title: title || "Reasoning", content };
  };

  // ── Tool / phase name humanizer ───────────────────────────────────────────
  const TOOL_LABEL_MAP: Record<string, string> = {
    // Market data
    get_price: "Fetching Price",
    get_ticker_stats: "Loading Market Stats",
    get_funding_rate: "Checking Funding Rate",
    get_candles: "Loading Candle Data",
    get_high_low_levels: "Finding Support & Resistance",
    get_technical_analysis: "Running Technical Analysis",
    get_technical_summary: "Summarizing Market",
    get_indicators: "Reading Indicators",
    get_active_indicators: "Reading Chart Indicators",
    get_patterns: "Detecting Chart Patterns",
    get_chainlink_price: "Fetching Oracle Price",
    get_box: "Reading Chart Box",
    get_canvas: "Reading Chart Canvas",
    get_photo_chart: "Capturing Chart",
    // Research
    research_market: "Researching Market",
    compare_markets: "Comparing Markets",
    scan_market_overview: "Scanning Markets",
    // Web / news / sentiment
    search_news: "Searching News",
    search_sentiment: "Analyzing Sentiment",
    search_web: "Browsing the Web",
    search_web_hybrid: "Searching the Web",
    // Memory
    add_memory: "Saving to Memory",
    add_memory_messages: "Saving Conversation",
    search_memory: "Recalling Memory",
    get_recent_history: "Loading History",
    // Chart – drawing / indicators
    draw: "Drawing on Chart",
    add_indicator: "Adding Indicator",
    remove_indicator: "Removing Indicator",
    clear_indicators: "Clearing Indicators",
    update_drawing: "Updating Chart",
    clear_drawings: "Clearing Drawings",
    list_supported_draw_tools: "Listing Draw Tools",
    list_supported_indicator_aliases: "Listing Indicators",
    verify_indicator_present: "Verifying Indicator",
    // Chart – navigation / interaction
    set_symbol: "Switching Symbol",
    set_timeframe: "Switching Timeframe",
    focus_chart: "Focusing Chart",
    focus_latest: "Going to Latest",
    reset_view: "Resetting View",
    zoom: "Zooming Chart",
    pan: "Panning Chart",
    hover_candle: "Inspecting Candle",
    move_crosshair: "Moving Crosshair",
    set_crosshair: "Setting Crosshair",
    inspect_cursor: "Reading Cursor",
    mark_trading_session: "Marking Session",
    mouse_move: "Moving Mouse",
    mouse_press: "Clicking Chart",
    press_key: "Pressing Key",
    capture_moment: "Capturing Moment",
    send_tradingview_command: "Sending Chart Command",
    verify_tradingview_state: "Verifying Chart State",
    ensure_mode: "Ensuring Chart Mode",
    // Trade / order
    place_order: "Preparing Order",
    setup_trade: "Setting Up Trade",
    cancel_order: "Cancelling Order",
    close_position: "Closing Position",
    close_all_positions: "Closing All Positions",
    reverse_position: "Reversing Position",
    adjust_position_tpsl: "Adjusting TP/SL",
    adjust_all_positions_tpsl: "Adjusting All TP/SL",
    add_price_alert: "Setting Price Alert",
    get_positions: "Loading Positions",
    // System / misc
    verify_session: "Verifying Session",
    // Legacy / generic aliases
    calling_tools: "Working",
    calling_tool: "Working",
  };

  // Phase labels — only keep meaningful ones, hide round numbers
  const PHASE_LABEL_MAP: Record<string, string> = {
    plan_start: "Planning",
    plan_ready: "Ready",
    tool_execution: "Working",
    tool_followup: "Following Up",
    tool_round_complete: "Done",
    execution_adapter: "Executing",
    runtime_ready: "Ready",
  };

  const humanizeToolName = (raw: string): string => {
    if (!raw) return "";
    const key = raw.trim().toLowerCase().replace(/[-\s]+/g, "_");
    if (TOOL_LABEL_MAP[key]) return TOOL_LABEL_MAP[key];
    // Generic pattern fallback: "get_xxx" → "Getting Xxx"
    const m = key.match(/^(get|search|scan|fetch|load|check|run|add|remove|clear|update|verify|place|draw|close|cancel|adjust|reverse|setup|capture)_(.+)$/);
    if (m) {
      const verbMap: Record<string, string> = {
        get: "Getting", search: "Searching", scan: "Scanning",
        fetch: "Fetching", load: "Loading", check: "Checking",
        run: "Running", add: "Adding", remove: "Removing",
        clear: "Clearing", update: "Updating", verify: "Verifying",
        place: "Placing", draw: "Drawing", close: "Closing",
        cancel: "Cancelling", adjust: "Adjusting", reverse: "Reversing",
        setup: "Setting Up", capture: "Capturing",
      };
      const verb = verbMap[m[1]] || (m[1].charAt(0).toUpperCase() + m[1].slice(1) + "ing");
      const noun = m[2].replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      return `${verb} ${noun}`;
    }
    return raw.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const humanizePhase = (raw: string): string => {
    if (!raw) return "";
    const key = raw.trim().toLowerCase();
    // Hide all tool_round_N — not meaningful to user
    if (/^tool_round_\d+$/.test(key)) return "Working";
    if (PHASE_LABEL_MAP[key]) return PHASE_LABEL_MAP[key];
    return raw.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const humanizeStepTitle = (title: string, toolName?: string): string => {
    if (!title) return toolName ? humanizeToolName(toolName) : "";
    // If title IS a raw tool name
    const asKey = title.trim().toLowerCase().replace(/[-\s]+/g, "_");
    if (TOOL_LABEL_MAP[asKey]) return TOOL_LABEL_MAP[asKey];
    // If title starts with "calling tool(s)" prefix
    const callingMatch = title.match(/^calling\s+tools?\s*[:\-]?\s*/i);
    if (callingMatch) {
      const rest = title.slice(callingMatch[0].length).trim();
      return rest ? humanizeToolName(rest) : "Using Tools";
    }
    // If title is raw snake_case that looks like a tool name
    if (/^[a-z][a-z0-9]*(_[a-z0-9]+)+$/.test(title.trim())) {
      return humanizeToolName(title.trim());
    }
    return title;
  };

  const cleanReasoningContent = (raw: string): string => {
    let clean = raw;
    clean = clean.replace(/\[SOURCE\]/gi, "**Source:**");
    clean = clean.replace(/\[Tools\]/gi, "**Tools:**");
    clean = clean.replace(/\[Active Market\]/gi, "**Active Market:**");
    clean = clean.replace(/\[Current Timeframe\]/gi, "**Timeframe:**");
    clean = clean.replace(/\[Current Indicators\]/gi, "**Indicators:**");
    clean = clean.replace(/\[SYSTEM\]/gi, "**System:**");
    clean = clean.replace(/\[NORMAL\]/gi, "");
    clean = clean.replace(/\[TREAT\]/gi, "");
    clean = clean.replace(/\[ABOVE\]/gi, "");

    clean = clean
      .replace(/\r\n/g, "\n")
      .replace(/\\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    return clean;
  };

  const extractResponseContent = (raw: string, thoughts?: (string | ThoughtStep)[]): string => {
    let content = String(raw || "");

    const stepTagRegex = /<\/?step_\d+\/\d+>/gi;
    const hasStepTags = stepTagRegex.test(content);

    if (hasStepTags) {
      const parts = content.split(/<\/?step_\d+\/\d+>/i);
      const nonEmptyParts = parts
        .map((p) => p.trim())
        .filter((p) => p.length > 0);

      if (nonEmptyParts.length > 1) {
        const lastPart = nonEmptyParts[nonEmptyParts.length - 1];
        const firstPart = nonEmptyParts[0];

        if (Array.isArray(thoughts) && thoughts.length > 0) {
          content = lastPart;
        } else {
          const isReasoningFirst = /^(oke|okay|let me|i will|i'll|thinking|analyzing|considering|first|now|so|well)/i.test(firstPart.substring(0, 50));

          if (isReasoningFirst && nonEmptyParts.length >= 2) {
            content = lastPart;
          } else {
            content = nonEmptyParts.join("\n\n");
          }
        }
      } else if (nonEmptyParts.length === 1) {
        content = nonEmptyParts[0];
      }
    }

    content = content
      .replace(stepTagRegex, "")
      .replace(/\r\n/g, "\n")
      .replace(/\\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    if (Array.isArray(thoughts) && thoughts.length > 0) {
      const thoughtTexts = thoughts
        .map((t) => (typeof t === "string" ? t : t?.content || t?.title || ""))
        .filter(Boolean)
        .map((t) => t.trim());

      for (const thoughtText of thoughtTexts) {
        if (thoughtText.length > 20 && content.includes(thoughtText)) {
          content = content.replace(thoughtText, "").trim();
        }
      }

      content = content.replace(/\n{3,}/g, "\n\n").trim();
    }

    return content;
  };

  const isReasoningFallbackText = (value: string): boolean => {
    const text = String(value || "")
      .trim()
      .toLowerCase();
    if (!text) return true;
    return (
      text.includes(
        "detailed provider reasoning is unavailable for this response",
      ) ||
      text.includes("showing execution trace when tool events are available") ||
      text.includes("provider did not expose explicit reasoning tokens")
    );
  };

  const parseReflexionSummaryNumbers = (value: string) => {
    const text = String(value || "");
    const parseField = (key: string): number => {
      const match = text.match(new RegExp(`${key}\\s*=\\s*(\\d+)`, "i"));
      return match ? Number(match[1]) : 0;
    };
    return {
      steps: parseField("steps"),
      good: parseField("good"),
      errors: parseField("errors"),
      retried: parseField("retried"),
      reflections: parseField("reflections"),
    };
  };

  const isReflexionSummaryText = (value: string): boolean => {
    const text = String(value || "").trim();
    if (!text) return false;
    if (/reflexion\s+summary/i.test(text)) return true;
    return (
      /steps\s*=\s*\d+/i.test(text) &&
      /good\s*=\s*\d+/i.test(text) &&
      /errors\s*=\s*\d+/i.test(text)
    );
  };

  const buildSummaryDerivedThoughts = (summaryText: string): any[] => {
    const stats = parseReflexionSummaryNumbers(summaryText);
    if (
      stats.steps <= 0 &&
      stats.good <= 0 &&
      stats.errors <= 0 &&
      stats.retried <= 0 &&
      stats.reflections <= 0
    ) {
      return [];
    }

    const derived: any[] = [];
    const toolWord = stats.steps === 1 ? "tool call" : "tool calls";
    const retryWord = stats.retried === 1 ? "retry" : "retries";
    const reflectionWord =
      stats.reflections === 1 ? "reflection" : "reflections";

    const primaryNarrative =
      stats.errors > 0
        ? `I worked through ${stats.steps} ${toolWord}. ${stats.good} completed cleanly, while ${stats.errors} ran into issues before finalizing the answer.`
        : `I ran ${stats.steps} ${toolWord} to gather context, and ${stats.good} completed successfully before I produced the response.`;

    derived.push({
      type: "reasoning",
      title: "How This Response Was Built",
      content: primaryNarrative,
      status: stats.errors > 0 ? "failed" : "done",
    });

    if (stats.reflections > 0 || stats.retried > 0) {
      const correctionNarrative =
        stats.retried > 0
          ? `I made ${stats.retried} ${retryWord} and recorded ${stats.reflections} ${reflectionWord} to adjust the approach.`
          : `I logged ${stats.reflections} ${reflectionWord} during the process, but no retry was needed.`;
      derived.push({
        type: "reasoning",
        title: "Self-Correction",
        content: correctionNarrative,
        status: "done",
      });
    }

    return derived;
  };

  const getRenderableThoughts = (rawThoughts: unknown): any[] => {
    if (!Array.isArray(rawThoughts)) return [];

    const summaryTexts: string[] = [];
    const filtered = rawThoughts.filter((item) => {
      if (!item) return false;

      if (typeof item === "string") {
        if (isReflexionSummaryText(item)) {
          summaryTexts.push(item);
          return false;
        }
        return !isReasoningFallbackText(item);
      }

      if (typeof item !== "object") return false;

      const title = String((item as any).title || "").trim();
      const content = String((item as any).content || "").trim();
      const type = String((item as any).type || "")
        .trim()
        .toLowerCase();
      const combined = `${title}\n${content}`.trim();

      if (!title && !content) return false;
      if (isReflexionSummaryText(combined)) {
        summaryTexts.push(combined);
        return false;
      }

      const isReasoningLike =
        type === "reasoning" ||
        type === "thinking" ||
        /^reasoning(?:\s*(?:trace|\d+))?$/i.test(title);
      if (isReasoningLike && isReasoningFallbackText(content)) {
        return false;
      }

      return true;
    });

    if (filtered.length > 0) {
      return filtered;
    }
    if (summaryTexts.length > 0) {
      return buildSummaryDerivedThoughts(summaryTexts[0]);
    }
    return filtered;
  };

  type ThoughtRenderType =
    | "text"
    | "code"
    | "browsing"
    | "tool"
    | "reasoning"
    | "summary"
    | "warning"
    | "info"
    | "plan";

  const normalizeThoughtType = (
    rawType: unknown,
    titleHint?: string,
  ): ThoughtRenderType => {
    const value = String(rawType || "")
      .trim()
      .toLowerCase();
    const title = String(titleHint || "")
      .trim()
      .toLowerCase();

    if (!value || value === "text") {
      if (title.startsWith("reasoning")) return "reasoning";
      return "text";
    }
    if (value === "analysis" || value === "thinking" || value === "thought") {
      return "reasoning";
    }
    if (
      value === "reasoning_trace" ||
      value === "reasoning_text" ||
      value === "reasoning_content"
    ) {
      return "reasoning";
    }
    if (value === "browser" || value === "search") return "browsing";
    if (value === "tools" || value === "tool_call" || value === "tool_result") {
      return "tool";
    }
    if (
      value === "code" ||
      value === "browsing" ||
      value === "tool" ||
      value === "reasoning" ||
      value === "summary" ||
      value === "warning" ||
      value === "info" ||
      value === "plan"
    ) {
      return value as ThoughtRenderType;
    }
    return "text";
  };

  const handleTableWrapperMouseDown = (
    event: React.MouseEvent<HTMLDivElement>,
  ) => {
    if (event.button !== 0) return;
    const container = event.currentTarget;
    if (container.scrollWidth <= container.clientWidth) return;

    const startX = event.clientX;
    const startScrollLeft = container.scrollLeft;
    const previousUserSelect = document.body.style.userSelect;
    container.classList.add(styles.tableWrapperDragging);
    document.body.style.userSelect = "none";

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      container.scrollLeft = startScrollLeft - deltaX;
      moveEvent.preventDefault();
    };

    const cleanup = () => {
      container.classList.remove(styles.tableWrapperDragging);
      document.body.style.userSelect = previousUserSelect;
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", cleanup);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", cleanup);
  };

  const markdownComponents = {
    text: ({ node, children }: any) => {
      const parentType = node?.parent?.type;
      if (
        parentType === "link" ||
        parentType === "code" ||
        parentType === "inlineCode"
      ) {
        return <>{children}</>;
      }
      const text = typeof children === "string" ? children : String(children);
      return <>{renderTextWithTokens(text)}</>;
    },
    a: ({ href, children, ...props }: any) => {
      const domain = getLinkDomain(href);
      const showIcon =
        !!domain &&
        (href?.startsWith("http://") || href?.startsWith("https://"));
      const favicon = showIcon
        ? `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
        : "";
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
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          )}
          <span className={styles.linkText}>{children}</span>
        </a>
      );
    },
    pre: ({ children }: any) => (
      <pre className={styles.codeBlock}>{children}</pre>
    ),
    code: ({ className, children }: any) =>
      className ? (
        <code className={className}>{children}</code>
      ) : (
        <code className={styles.inlineCode}>{children}</code>
      ),
    table: ({ children }: any) => (
      <div
        className={styles.tableWrapper}
        onMouseDown={handleTableWrapperMouseDown}
        onDragStart={(e) => e.preventDefault()}
      >
        <table className={styles.markdownTable}>{children}</table>
      </div>
    ),
    th: ({ children }: any) => (
      <th className={styles.tableHeader}>{children}</th>
    ),
    td: ({ children }: any) => <td className={styles.tableCell}>{children}</td>,
    blockquote: ({ children }: any) => (
      <blockquote className={styles.blockquote}>{children}</blockquote>
    ),
  };

  const linksInInput = useMemo(() => inputLinks, [inputLinks]);

  const removeLinkFromInput = (url: string) => {
    setInputLinks((prev) => prev.filter((link) => link !== url));
    setInputValue((prev) =>
      prev
        .replace(url, "")
        .replace(/\s{2,}/g, " ")
        .trim(),
    );
  };

  const isImageAttachment = (att: ChatAttachment) =>
    (att.type || "").startsWith("image/");
  const formatAttachmentType = (type?: string, name?: string) => {
    if (type) {
      if (type === "application/pdf") return "PDF";
      if (type.includes("wordprocessingml")) return "DOCX";
      if (type.includes("msword")) return "DOC";
      if (type.startsWith("text/")) return "TXT";
      if (type.startsWith("image/"))
        return (type.split("/")[1] || "IMAGE").toUpperCase();
    }
    if (name && name.includes(".")) {
      const ext = name.split(".").pop();
      if (ext) return ext.toUpperCase();
    }
    return "FILE";
  };

  const openAttachmentImage = (att: ChatAttachment) => {
    if (!att?.data) return;
    setExpandedImage({ name: att.name || "image", url: att.data });
  };

  const indicatorLabelByValue = useMemo(() => {
    const map = new Map<string, string>();
    indicatorOptions.forEach((opt) => {
      map.set(opt.value, opt.label);
    });
    return map;
  }, [indicatorOptions]);

  const filteredIndicatorOptions = useMemo(() => {
    const q = indicatorSearch.trim().toLowerCase();
    if (!q) return indicatorOptions;
    return indicatorOptions.filter((opt) => opt.searchKey.includes(q));
  }, [indicatorOptions, indicatorSearch]);

  // Close menus on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modelSectionRef.current &&
        !modelSectionRef.current.contains(event.target as Node)
      ) {
        setIsModelMenuOpen(false);
      }
      if (
        toolsRef.current &&
        !toolsRef.current.contains(event.target as Node)
      ) {
        setIsToolsMenuOpen(false);
      }
      if (!event.target) return; // Basic null check
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleVoiceInput = () => {
    if (sendBlockedByPrerequisite) return;
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    if (!("webkitSpeechRecognition" in window)) {
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
      setInputValue(""); // Reset input on start as requested
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        setInputValue((prev) => prev + (prev ? " " : "") + finalTranscript);
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
  const [expandedThoughtIds, setExpandedThoughtIds] = useState<Set<string>>(
    new Set(),
  );
  const [expandedStepKeys, setExpandedStepKeys] = useState<Set<string>>(
    new Set(),
  );
  const lastThoughtCountsRef = useRef<Record<string, number>>({});
  const lastThinkingRef = useRef<Record<string, boolean>>({});

  const toggleThoughts = (messageId: string) => {
    setExpandedThoughtIds((prev) => {
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
    setExpandedStepKeys((prev) => {
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
    const startedThinking: string[] = [];

    for (const msg of messages) {
      if (msg.role !== "assistant") continue;
      const count = Array.isArray(msg.thoughts) ? msg.thoughts.length : 0;
      const prevCount = lastThoughtCountsRef.current[msg.id] ?? 0;
      if (count > prevCount) {
        newSteps.push({ id: msg.id, index: count - 1 });
        lastThoughtCountsRef.current[msg.id] = count;
      }

      const wasThinking = lastThinkingRef.current[msg.id] ?? false;
      const isThinking = !!msg.isThinking;
      if (!wasThinking && isThinking) {
        startedThinking.push(msg.id);
      }
      if (wasThinking && !isThinking) {
        finished.push(msg.id);
      }
      lastThinkingRef.current[msg.id] = isThinking;
    }

    if (newSteps.length > 0) {
      setExpandedThoughtIds((prev) => {
        const next = new Set(prev);
        for (const s of newSteps) next.add(s.id);
        return next;
      });

      setExpandedStepKeys((prev) => {
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

    if (startedThinking.length > 0) {
      setExpandedThoughtIds((prev) => {
        const next = new Set(prev);
        for (const id of startedThinking) next.add(id);
        return next;
      });
    }

    if (finished.length > 0) {
      setExpandedThoughtIds((prev) => {
        const next = new Set(prev);
        for (const id of finished) next.delete(id);
        return next;
      });
      setExpandedStepKeys((prev) => {
        const next = new Set(
          [...prev].filter(
            (k) => !finished.some((id) => k.startsWith(`${id}-`)),
          ),
        );
        return next;
      });
    }
  }, [messages]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!hasWalletConnection || isSessionBlocked) return;
    if (!ensureUsageCredit()) return;
    if (
      !inputValue.trim() &&
      attachments.length === 0 &&
      inputLinks.length === 0
    )
      return;
    if (isPreparingAttachments) return;

    const finalModelId = getSelectedModelId();
    if (!finalModelId) {
      alert("Model belum dipilih. Pilih model dulu.");
      return;
    }

    let attachmentPayloads: ChatAttachment[] = [];
    try {
      setIsPreparingAttachments(true);
      attachmentPayloads =
        attachments.length > 0
          ? await buildAttachmentPayloads(attachments)
          : [];
    } catch (error) {
      console.error("Failed to prepare attachments", error);
      alert("Attachment gagal diproses. Coba lagi.");
      return;
    } finally {
      setIsPreparingAttachments(false);
    }
    const contentWithLinks = [inputValue.trim(), ...inputLinks]
      .filter(Boolean)
      .join(" ")
      .trim();
    if (!contentWithLinks && attachmentPayloads.length === 0) {
      return;
    }
    const outboundToolStates = await resolveDispatchToolStates();
    onSendMessage(
      contentWithLinks,
      finalModelId,
      attachmentPayloads,
      outboundToolStates,
    );
    setInputValue("");
    setInputLinks([]);
    setAttachments([]);

    // Reset text area height
    const textarea = document.querySelector(
      `.${styles.inputField}`,
    ) as HTMLTextAreaElement;
    if (textarea) textarea.style.height = "auto";
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const inputAttachmentItems = attachments.map((file, index) => ({
    file,
    index,
  }));
  const inputImageAttachments = inputAttachmentItems.filter((item) =>
    item.file.type.startsWith("image/"),
  );
  const inputFileAttachments = inputAttachmentItems.filter(
    (item) => !item.file.type.startsWith("image/"),
  );
  const activeMarketLabel = (
    currentSymbol ||
    selectedMarket?.symbol ||
    ""
  ).replace(/-/g, "/");
  const activeExchangeLabel = selectedMarket?.source
    ? selectedMarket.source.charAt(0).toUpperCase() + selectedMarket.source.slice(1)
    : "";
  const selectedTimeframes = Array.isArray(toolStates.timeframe)
    ? toolStates.timeframe
    : [];
  const activeMarketTimeframe = useMemo(() => {
    return normalizeTimeframeLabel(currentTimeframe);
  }, [currentTimeframe, timeframeMap]);
  const activeMarketIndicators = useMemo(
    () =>
      Array.from(
        new Set(
          (Array.isArray(currentIndicators) ? currentIndicators : [])
            .map((item) => String(item || "").trim())
            .filter(Boolean),
        ),
      ),
    [currentIndicators],
  );
  const activeMarketIndicatorsLabel = useMemo(
    () => activeMarketIndicators.join(", "),
    [activeMarketIndicators],
  );
  const hintedTimeframes = Array.from(
    new Set(
      selectedTimeframes
        .map((tf) => normalizeTimeframeLabel(tf))
        .filter((tf) => tf && tf !== activeMarketTimeframe),
    ),
  );
  const combinedHintValues = useMemo(
    () =>
      Array.from(
        new Set(
          [
            ...hintedTimeframes,
            ...(Array.isArray(toolStates.indicators)
              ? toolStates.indicators.map(
                (item) => indicatorLabelByValue.get(String(item || "").trim()) || item,
              )
              : []),
          ]
            .map((item) => String(item || "").trim())
            .filter(Boolean),
        ),
      ),
    [hintedTimeframes, toolStates.indicators, indicatorLabelByValue],
  );
  const hasDraftContent = Boolean(
    inputValue.trim() || attachments.length > 0 || inputLinks.length > 0,
  );
  const sendBlockedByPrerequisite = Boolean(
    !hasWalletConnection || isSessionBlocked || !hasUsageCredit,
  );
  const isSendDisabled =
    !isTyping &&
    (isPreparingAttachments || sendBlockedByPrerequisite || !hasDraftContent);
  const sendButtonTitle = isTyping
    ? "Stop generation"
    : isSessionChecking && !hasStoredSessionForWallet
      ? "Checking session key..."
      : !hasWalletConnection
        ? "Connect wallet first"
        : isSessionBlocked
          ? "Create session key first"
          : !hasUsageCredit
            ? "AI credit empty. Deposit to AI Vault first"
            : "Send message";

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
            {messages.map((msg) =>
              (() => {
                const thoughtsList = getRenderableThoughts(msg.thoughts);
                const runtimePhases = Array.isArray(msg.runtimePhases)
                  ? msg.runtimePhases
                  : [];
                const shouldShowThoughtBlock =
                  thoughtsList.length > 0 ||
                  (msg.role === "assistant" &&
                    (Boolean(msg.isThinking) || runtimePhases.length > 0));
                const visibleThoughts =
                  thoughtsList.length > 0
                    ? thoughtsList
                    : msg.role === "assistant" && msg.isThinking
                      ? [
                        {
                          type: "info",
                          title: "Initializing analysis",
                          content: getAssistantLoadingLabel(msg),
                          status: "running",
                        },
                      ]
                      : [];
                const hasAssistantContent = Boolean(
                  msg.role === "assistant" &&
                  msg.content &&
                  msg.content.trim().length > 0,
                );
                const showAssistantLoading = Boolean(
                  msg.role === "assistant" &&
                  msg.isThinking &&
                  !hasAssistantContent,
                );
                const assistantLoadingLabel =
                  msg.role === "assistant"
                    ? getAssistantLoadingLabel(msg)
                    : "Loading.";
                return (
                  <div
                    key={msg.id}
                    className={`${styles.messageItem} ${msg.role === "user" ? styles.user : styles.assistant}`}
                  >
                    {msg.role === "user" ? (
                      <div
                        className={`${styles.userMessageGroup} ${msg.attachments && msg.attachments.length > 0 ? styles.userMessageWithAttachments : ""}`}
                      >
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
                                <span
                                  style={{
                                    border: "1px solid #3A2530",
                                    width: "14px",
                                    height: "14px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    borderRadius: "50%",
                                    fontSize: "10px",
                                  }}
                                >
                                  i
                                </span>
                                Editing this message will create a new
                                conversation branch.
                              </div>
                              <div className={styles.editButtons}>
                                <button
                                  className={styles.editCancelBtn}
                                  onClick={handleCancelEdit}
                                >
                                  Cancel
                                </button>
                                <button
                                  className={styles.editSaveBtn}
                                  onClick={() => handleSaveEdit(msg.id)}
                                >
                                  Save
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          /* Normal Display Mode */
                          <div className={styles.userBubbleWrapper}>
                            {msg.attachments && msg.attachments.length > 0 && (
                              <div className={styles.userAttachments}>
                                {msg.attachments.map((att, idx) =>
                                  isImageAttachment(att) ? (
                                    <div
                                      key={`att-img-${idx}`}
                                      className={styles.userImageCard}
                                    >
                                      <img
                                        src={att.data}
                                        alt={att.name}
                                        className={styles.userAttachmentImage}
                                        onClick={() => openAttachmentImage(att)}
                                      />
                                    </div>
                                  ) : (
                                    <div
                                      key={`att-file-${idx}`}
                                      className={styles.userFileCard}
                                    >
                                      <div className={styles.userFileIcon}>
                                        <svg
                                          width="18"
                                          height="18"
                                          viewBox="0 0 24 24"
                                          fill="none"
                                          stroke="currentColor"
                                          strokeWidth="1.7"
                                        >
                                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                          <polyline points="14 2 14 8 20 8"></polyline>
                                        </svg>
                                      </div>
                                      <div className={styles.userFileMeta}>
                                        <div className={styles.userFileName}>
                                          {att.name}
                                        </div>
                                        <div className={styles.userFileType}>
                                          {formatAttachmentType(
                                            att.type,
                                            att.name,
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ),
                                )}
                              </div>
                            )}
                            <div
                              className={`${styles.bubble} ${styles.userBubble}`}
                            >
                              {msg.content}
                            </div>

                            {/* Action Bar (Time + Icons) */}
                            <div className={styles.userActionBar}>
                              {msg.timestamp && (
                                <span className={styles.messageTime}>
                                  {formatTime(msg.timestamp)}
                                </span>
                              )}

                              {/* Regenerate */}
                              <button
                                className={styles.userActionBtn}
                                title="Regenerate"
                                onClick={() => handleRegenerate(msg.content)}
                              >
                                <svg
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <path d="M23 4v6h-6" />
                                  <path d="M1 20v-6h6" />
                                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                                </svg>
                              </button>

                              {/* Edit */}
                              <button
                                className={styles.userActionBtn}
                                title="Edit Prompt"
                                onClick={() => handleEditClick(msg)}
                              >
                                <svg
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                              </button>

                              {/* Copy */}
                              <button
                                className={styles.userActionBtn}
                                title="Copy"
                                onClick={() => handleCopy(msg.content, msg.id)}
                              >
                                {copiedId === msg.id ? (
                                  <svg
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                  >
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                ) : (
                                  <svg
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                  >
                                    <rect
                                      x="9"
                                      y="9"
                                      width="13"
                                      height="13"
                                      rx="2"
                                      ry="2"
                                    />
                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                  </svg>
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : msg.isError ? (
                      <div className={styles.errorBubble}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="8" x2="12" y2="12" />
                          <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        <span>{msg.content}</span>
                      </div>
                    ) : (
                      <div
                        className={`${styles.bubble} ${styles.assistantBubble}`}
                      >
                        {/* Thinking Block */}
                        {shouldShowThoughtBlock && (
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 0,
                            }}
                          >
                            <div
                              className={styles.thinkingBlock}
                              onClick={() => toggleThoughts(msg.id)}
                              style={
                                expandedThoughtIds.has(msg.id)
                                  ? {
                                    borderRadius: "8px 8px 0 0",
                                    borderBottom: "none",
                                  }
                                  : {}
                              }
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                }}
                              >
                                {showAssistantLoading ? (
                                  <>
                                    <svg
                                      className={styles.loadingSpinner}
                                      width="16"
                                      height="16"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                    >
                                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                                    </svg>
                                    <span style={{ color: "#A77590" }}>
                                      Analyzing
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <svg
                                      width="16"
                                      height="16"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="#3B2030"
                                      strokeWidth="2"
                                    >
                                      <path
                                        d="M12 2a10 10 0 1 0 10 10H12V2z"
                                        fill="#3B2030"
                                      />
                                      <path d="M12 2a10 10 0 0 1 10 10" />
                                      {/* Simple quarter circle or brain metaphor */}
                                    </svg>
                                    <span style={{ color: "#5B354C" }}>
                                      How I reasoned
                                    </span>
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
                                style={{
                                  transform: expandedThoughtIds.has(msg.id)
                                    ? "rotate(180deg)"
                                    : "rotate(0deg)",
                                  transition: "transform 0.2s",
                                  marginLeft: "auto",
                                }}
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

                                {visibleThoughts.map((stepItem, idx, arr) => {
                                  const stepKey = `${msg.id}-${idx}`;
                                  const isStepExpanded =
                                    expandedStepKeys.has(stepKey);

                                  // Handle legacy string steps or new object steps
                                  const isObject = typeof stepItem === "object";
                                  const legacyParsed = !isObject
                                    ? parseLegacyThoughtText(
                                      String(stepItem || ""),
                                    )
                                    : null;
                                  const rawStepTitle = String(
                                    isObject
                                      ? stepItem.title || ""
                                      : legacyParsed?.title || String(stepItem),
                                  );
                                  const stepType = normalizeThoughtType(
                                    isObject
                                      ? (stepItem as any).type
                                      : legacyParsed?.type || "text",
                                    rawStepTitle,
                                  );
                                  const rawStepContent = String(
                                    isObject
                                      ? (stepItem as any).content || ""
                                      : legacyParsed?.content || "",
                                  );
                                  const reasoningPresentation =
                                    stepType === "reasoning"
                                      ? deriveReasoningPresentation(
                                        rawStepTitle,
                                        rawStepContent,
                                      )
                                      : null;
                                  const stepTitle = humanizeStepTitle(
                                    reasoningPresentation?.title || rawStepTitle,
                                    isObject ? (stepItem as any).toolName : legacyParsed?.toolName,
                                  );
                                  const stepContent =
                                    reasoningPresentation?.content ||
                                    rawStepContent;
                                  const stepResults =
                                    isObject && stepItem.type === "browsing"
                                      ? stepItem.results
                                      : undefined;
                                  const stepToolName = isObject
                                    ? (stepItem as any).toolName
                                    : String(legacyParsed?.toolName || "");
                                  const stepPhase = isObject
                                    ? String((stepItem as any).phase || "")
                                    : String(legacyParsed?.phase || "");
                                  const stepStatus = isObject
                                    ? String(
                                      (stepItem as any).status || "",
                                    ).toLowerCase()
                                    : "";
                                  const stepMeta = isObject
                                    ? (stepItem as any).meta
                                    : {};

                                  // HITL: Check for trade proposal
                                  if (
                                    stepToolName === "place_order" &&
                                    stepMeta?.status === "proposal"
                                  ) {
                                    const order = stepMeta.order || {};
                                    return (
                                      <div
                                        key={idx}
                                        style={{
                                          border: "1px solid #3A2530",
                                          borderRadius: 8,
                                          padding: 12,
                                          margin: "8px 0",
                                          background: "rgba(58, 37, 48, 0.3)",
                                        }}
                                      >
                                        <div
                                          style={{
                                            fontWeight: "bold",
                                            marginBottom: 8,
                                            color: "#FF9800",
                                          }}
                                        >
                                          Trade Proposal Requires Approval
                                        </div>
                                        <div
                                          style={{
                                            display: "grid",
                                            gridTemplateColumns:
                                              "min-content 1fr",
                                            gap: "4px 12px",
                                            fontSize: "0.9em",
                                            marginBottom: 12,
                                          }}
                                        >
                                          <span style={{ color: "#A77590" }}>
                                            Symbol:
                                          </span>{" "}
                                          <span>{order.symbol}</span>
                                          <span style={{ color: "#A77590" }}>
                                            Side:
                                          </span>{" "}
                                          <span
                                            style={{
                                              textTransform: "uppercase",
                                              color:
                                                order.side === "buy"
                                                  ? "#4CAF50"
                                                  : "#F44336",
                                            }}
                                          >
                                            {order.side}
                                          </span>
                                          <span style={{ color: "#A77590" }}>
                                            Amount:
                                          </span>{" "}
                                          <span>${order.amount_usd}</span>
                                          <span style={{ color: "#A77590" }}>
                                            Lev:
                                          </span>{" "}
                                          <span>{order.leverage || 1}x</span>
                                        </div>
                                        <div
                                          style={{ display: "flex", gap: 8 }}
                                        >
                                          <button
                                            disabled={
                                              !toolStates.execution ||
                                              !hasUsageCredit
                                            }
                                            onClick={async (e) => {
                                              e.stopPropagation();
                                              if (!toolStates.execution) return;
                                              if (!ensureUsageCredit()) return;
                                              const content = `Execute order for ${order.symbol} now.`;
                                              const modelId =
                                                getSelectedModelId();
                                              if (!modelId) return;
                                              const outboundToolStates =
                                                await resolveDispatchToolStates();
                                              onSendMessage(
                                                content,
                                                modelId,
                                                [],
                                                outboundToolStates,
                                              );
                                            }}
                                            style={{
                                              background: "#4CAF50",
                                              color: "white",
                                              border: "none",
                                              padding: "6px 12px",
                                              borderRadius: 4,
                                              cursor: toolStates.execution
                                                ? hasUsageCredit
                                                  ? "pointer"
                                                  : "not-allowed"
                                                : "not-allowed",
                                              opacity:
                                                toolStates.execution &&
                                                  hasUsageCredit
                                                  ? 1
                                                  : 0.6,
                                              fontWeight: 500,
                                              fontSize: "0.9em",
                                            }}
                                          >
                                            Approve
                                          </button>
                                          <button
                                            disabled={!hasUsageCredit}
                                            onClick={async (e) => {
                                              e.stopPropagation();
                                              if (!ensureUsageCredit()) return;
                                              const modelId =
                                                getSelectedModelId();
                                              if (!modelId) return;
                                              const outboundToolStates =
                                                await resolveDispatchToolStates();
                                              onSendMessage(
                                                "Cancel the proposed order.",
                                                modelId,
                                                [],
                                                outboundToolStates,
                                              );
                                            }}
                                            style={{
                                              background: "transparent",
                                              color: "#F44336",
                                              border: "1px solid #F44336",
                                              padding: "6px 12px",
                                              borderRadius: 4,
                                              cursor: hasUsageCredit
                                                ? "pointer"
                                                : "not-allowed",
                                              opacity: hasUsageCredit ? 1 : 0.6,
                                              fontWeight: 500,
                                              fontSize: "0.9em",
                                            }}
                                          >
                                            Reject
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  }

                                  const hasDetail =
                                    (stepType === "browsing" &&
                                      Array.isArray(stepResults) &&
                                      stepResults.length > 0) ||
                                    (stepType === "code" &&
                                      !!stepContent.trim()) ||
                                    (stepType === "tool" &&
                                      !!stepContent.trim() &&
                                      stepContent.trim() !==
                                      stepTitle.trim()) ||
                                    (stepType === "reasoning" &&
                                      !!stepContent.trim()) ||
                                    (stepType === "text" &&
                                      !!stepContent.trim() &&
                                      stepContent.trim() !== stepTitle.trim());

                                  // Reasoning type icons and colors — unified palette
                                  const getReasoningStyle = (title: string) => {
                                    const t = title.toLowerCase();
                                    if (t.includes("intent") || t.includes("user intent"))
                                      return { icon: null, color: "#A77590", label: title };
                                    if (t.includes("strategy") || t.includes("plan") || t.includes("strateg"))
                                      return { icon: null, color: "#A77590", label: title };
                                    if (t.includes("analysis") || t.includes("context") || t.includes("evidence"))
                                      return { icon: null, color: "#A77590", label: title };
                                    if (t.includes("risk") || t.includes("warning"))
                                      return { icon: null, color: "#A77590", label: title };
                                    // All other types — same muted purple
                                    return { icon: null, color: "#A77590", label: title || "Thinking" };
                                  };

                                  return (
                                    <div
                                      key={idx}
                                      style={{
                                        borderBottom:
                                          idx === arr.length - 1
                                            ? "none"
                                            : "1px solid #3A2530",
                                      }}
                                    >
                                      <div
                                        className={styles.thinkingStep}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (hasDetail) {
                                            toggleStep(msg.id, idx);
                                          }
                                        }}
                                        role={hasDetail ? "button" : undefined}
                                        aria-expanded={
                                          hasDetail ? isStepExpanded : undefined
                                        }
                                        style={{ borderBottom: "none" }}
                                      >
                                        {stepType === "browsing" ? (
                                          <div
                                            className={styles.browsingHeader}
                                          >
                                            <div
                                              className={styles.browsingLeft}
                                            >
                                              {/* Globe Icon for Browsing */}
                                              <div className={styles.stepIcon}>
                                                <svg
                                                  width="14"
                                                  height="14"
                                                  viewBox="0 0 24 24"
                                                  fill="none"
                                                  stroke="currentColor"
                                                  strokeWidth="2"
                                                >
                                                  <circle
                                                    cx="12"
                                                    cy="12"
                                                    r="10"
                                                  />
                                                  <path d="M2 12h20" />
                                                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                                                </svg>
                                              </div>
                                              <span>{stepTitle}</span>
                                            </div>
                                            <div
                                              className={styles.stepResultCount}
                                            >
                                              {stepResults
                                                ? `${stepResults.length} results`
                                                : ""}
                                              {hasDetail && (
                                                <svg
                                                  width="14"
                                                  height="14"
                                                  viewBox="0 0 24 24"
                                                  fill="none"
                                                  stroke="currentColor"
                                                  strokeWidth="2"
                                                  style={{
                                                    transform: isStepExpanded
                                                      ? "rotate(180deg)"
                                                      : "rotate(0deg)",
                                                    transition:
                                                      "transform 0.2s",
                                                  }}
                                                >
                                                  <path d="M6 9l6 6 6-6" />
                                                </svg>
                                              )}
                                            </div>
                                          </div>
                                        ) : stepType === "code" ? (
                                          // Code Step
                                          <div
                                            style={{
                                              display: "flex",
                                              alignItems: "center",
                                              gap: "12px",
                                              width: "100%",
                                            }}
                                          >
                                            <div className={styles.stepIcon}>
                                              {/* Code Icon */}
                                              <svg
                                                width="14"
                                                height="14"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="#3B2030"
                                                strokeWidth="2"
                                              >
                                                <polyline points="16 18 22 12 16 6" />
                                                <polyline points="8 6 2 12 8 18" />
                                              </svg>
                                            </div>
                                            <span style={{ flex: 1 }}>
                                              {stepTitle}
                                            </span>
                                            {hasDetail && (
                                              <svg
                                                width="14"
                                                height="14"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="#3A2530"
                                                strokeWidth="2"
                                                style={{
                                                  transform: isStepExpanded
                                                    ? "rotate(180deg)"
                                                    : "rotate(0deg)",
                                                  transition: "transform 0.2s",
                                                }}
                                              >
                                                <path d="M6 9l6 6 6-6" />
                                              </svg>
                                            )}
                                          </div>
                                        ) : stepType === "tool" ? (
                                          <div
                                            className={styles.toolStepContent}
                                          >
                                            <div className={styles.stepIcon}>
                                              <svg
                                                width="14"
                                                height="14"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="#A77590"
                                                strokeWidth="2"
                                              >
                                                <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18v3h3l6.3-6.3a4 4 0 0 0 5.4-5.4l-2.2 2.2-3.2-3.2 2.4-2z" />
                                              </svg>
                                            </div>
                                            <span style={{ flex: 1 }}>
                                              {stepTitle}
                                            </span>
                                            <span
                                              className={`${styles.toolStepPill} ${stepStatus === "error" ? styles.toolStepPillError : styles.toolStepPillOk}`}
                                            >
                                              {stepToolName
                                                ? humanizeToolName(stepToolName)
                                                : stepPhase
                                                  ? humanizePhase(stepPhase)
                                                  : "Tool"}
                                            </span>
                                            {hasDetail && (
                                              <svg
                                                width="14"
                                                height="14"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="#3A2530"
                                                strokeWidth="2"
                                                style={{
                                                  transform: isStepExpanded
                                                    ? "rotate(180deg)"
                                                    : "rotate(0deg)",
                                                  transition: "transform 0.2s",
                                                }}
                                              >
                                                <path d="M6 9l6 6 6-6" />
                                              </svg>
                                            )}
                                          </div>
                                        ) : (
                                          // Text Step
                                          <div
                                            style={{
                                              display: "flex",
                                              alignItems: "center",
                                              gap: "12px",
                                              width: "100%",
                                            }}
                                          >
                                            <div className={styles.stepIcon}>
                                              {/* Dot Icon for Text */}
                                              <div
                                                style={{
                                                  width: "6px",
                                                  height: "6px",
                                                  backgroundColor: "#3A2530",
                                                  borderRadius: "50%",
                                                }}
                                              ></div>
                                            </div>
                                            <span style={{ flex: 1 }}>
                                              {stepTitle}
                                            </span>
                                            {hasDetail && (
                                              <svg
                                                width="14"
                                                height="14"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="#3A2530"
                                                strokeWidth="2"
                                                style={{
                                                  transform: isStepExpanded
                                                    ? "rotate(180deg)"
                                                    : "rotate(0deg)",
                                                  transition: "transform 0.2s",
                                                }}
                                              >
                                                <path d="M6 9l6 6 6-6" />
                                              </svg>
                                            )}
                                          </div>
                                        )}
                                      </div>

                                      {/* Expanded Content */}
                                      {hasDetail && isStepExpanded && (
                                        <div className={styles.stepDetail}>
                                          {stepType === "browsing" &&
                                            stepResults ? (
                                            <div className={styles.resultList}>
                                              {stepResults.map(
                                                (result: any, rIdx: number) => (
                                                  <a
                                                    key={rIdx}
                                                    href={result.url}
                                                    className={
                                                      styles.resultItem
                                                    }
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={(e) =>
                                                      e.stopPropagation()
                                                    }
                                                  >
                                                    <img
                                                      src={
                                                        result.icon ||
                                                        `https://www.google.com/s2/favicons?domain=${result.domain}`
                                                      }
                                                      alt=""
                                                      onError={(e) => {
                                                        e.currentTarget.style.display =
                                                          "none";
                                                      }}
                                                    />
                                                    <div
                                                      className={
                                                        styles.resultText
                                                      }
                                                    >
                                                      <div
                                                        className={
                                                          styles.resultTitle
                                                        }
                                                      >
                                                        {result.title}
                                                      </div>
                                                      <div
                                                        className={
                                                          styles.resultDomain
                                                        }
                                                      >
                                                        {result.domain}
                                                      </div>
                                                    </div>
                                                  </a>
                                                ),
                                              )}
                                            </div>
                                          ) : stepType === "code" ? (
                                            <div
                                              style={{
                                                marginLeft: "28px",
                                                marginTop: "8px",
                                                background: "#12000A",
                                                padding: "12px",
                                                borderRadius: "6px",
                                                fontSize: "12px",
                                                fontFamily: "monospace",
                                                color: "#A77590",
                                                border: "1px solid #3A2530",
                                              }}
                                            >
                                              <pre
                                                style={{
                                                  margin: 0,
                                                  whiteSpace: "pre-wrap",
                                                }}
                                              >
                                                {(typeof stepItem ===
                                                  "object" &&
                                                  stepItem.content) ||
                                                  "Writing code..."}
                                              </pre>
                                            </div>
                                          ) : stepType === "reasoning" ? (
                                            <div
                                              className={styles.reasoningDetail}
                                              style={{
                                                color:
                                                  getReasoningStyle(stepTitle)
                                                    .color,
                                              }}
                                            >
                                              <ReactMarkdown
                                                remarkPlugins={[remarkGfm]}
                                                className={
                                                  styles.reasoningMarkdown
                                                }
                                                components={markdownComponents}
                                              >
                                                {cleanReasoningContent(
                                                  stepContent || stepTitle,
                                                )}
                                              </ReactMarkdown>
                                            </div>
                                          ) : stepType === "tool" ? (
                                            <div
                                              className={styles.toolStepDetail}
                                            >
                                              {stepContent || ""}
                                            </div>
                                          ) : (
                                            <div
                                              className={styles.reasoningDetail}
                                            >
                                              <ReactMarkdown
                                                remarkPlugins={[remarkGfm]}
                                                className={
                                                  styles.reasoningMarkdown
                                                }
                                                components={markdownComponents}
                                              >
                                                {cleanReasoningContent(
                                                  stepContent || stepTitle,
                                                )}
                                              </ReactMarkdown>
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
                        {showAssistantLoading && (
                          <div
                            className={styles.loadingRow}
                            role="status"
                            aria-live="polite"
                          >
                            <div
                              className={styles.loadingBars}
                              aria-hidden="true"
                            >
                              <span className={styles.loadingBar}></span>
                              <span className={styles.loadingBar}></span>
                              <span className={styles.loadingBar}></span>
                              <span className={styles.loadingBar}></span>
                            </div>
                            <span className={styles.loadingText}>
                              {assistantLoadingLabel}
                              <span className={styles.loadingDots}>
                                {loadingDots}
                              </span>
                            </span>
                          </div>
                        )}
                        <div className={styles.responseContent}>
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={markdownComponents}
                          >
                            {extractResponseContent(msg.content, msg.thoughts)}
                          </ReactMarkdown>
                        </div>

                        {/* Artifact Card (if present) */}
                        {msg.artifact && (
                          <div
                            className={styles.artifactCard}
                            onClick={() =>
                              onOpenChart &&
                              onOpenChart(msg.artifact?.data?.symbol)
                            }
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                              }}
                            >
                              <div className={styles.artifactIcon}>
                                {msg.artifact.type === "chart" ? (
                                  <svg
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                  >
                                    <line x1="18" y1="20" x2="18" y2="10" />
                                    <line x1="12" y1="20" x2="12" y2="4" />
                                    <line x1="6" y1="20" x2="6" y2="14" />
                                  </svg>
                                ) : (
                                  <svg
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                  >
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                    <polyline points="14 2 14 8 20 8" />
                                  </svg>
                                )}
                              </div>
                              <div className={styles.artifactInfo}>
                                <span className={styles.artifactTitle}>
                                  {msg.artifact.type === "chart" &&
                                    currentSymbol
                                    ? `${currentSymbol} Analysis Chart`
                                    : msg.artifact.title}
                                </span>
                                <span className={styles.artifactType}>
                                  Interactive{" "}
                                  {msg.artifact.type === "chart"
                                    ? "Chart"
                                    : "Artifact"}
                                </span>
                              </div>
                            </div>
                            {/* Open Icon */}
                            <svg
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="#A77590"
                              strokeWidth="2"
                            >
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
                                  <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                  >
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                ) : (
                                  <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                  >
                                    <rect
                                      x="9"
                                      y="9"
                                      width="13"
                                      height="13"
                                      rx="2"
                                      ry="2"
                                    />
                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                  </svg>
                                )}
                              </button>
                              <button
                                className={`${styles.actionBtn} ${msg.feedback === "like" ? styles.activeFeedback : ""}`}
                                title="Good response"
                                onClick={() =>
                                  onFeedback &&
                                  onFeedback(
                                    msg.id,
                                    msg.feedback === "like" ? null : "like",
                                  )
                                }
                              >
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke={
                                    msg.feedback === "like"
                                      ? "#3B2030"
                                      : "currentColor"
                                  }
                                  strokeWidth="2"
                                >
                                  <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                                </svg>
                              </button>
                              <button
                                className={`${styles.actionBtn} ${msg.feedback === "dislike" ? styles.activeFeedback : ""}`}
                                title="Bad response"
                                onClick={() =>
                                  onFeedback &&
                                  onFeedback(
                                    msg.id,
                                    msg.feedback === "dislike"
                                      ? null
                                      : "dislike",
                                  )
                                }
                              >
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke={
                                    msg.feedback === "dislike"
                                      ? "#FF4B4B"
                                      : "currentColor"
                                  }
                                  strokeWidth="2"
                                >
                                  <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2 0 0 1-2.33 2H17" />
                                </svg>
                              </button>
                              <button
                                className={styles.actionBtn}
                                title="Regenerate"
                                onClick={() =>
                                  handleAssistantRegenerate(msg.id)
                                }
                              >
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <path d="M1 4v6h6" />
                                  <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                                </svg>
                              </button>
                            </div>

                            {/* Assistant Logo (Star) */}
                            <div className={styles.assistantLogo}>
                              <svg
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                              >
                                <path d="M12 2L15.09 9.26L22 12L15.09 14.74L12 22L8.91 14.74L2 12L8.91 9.26L12 2Z" />
                              </svg>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })(),
            )}
            {isTyping && null}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Input Area */}
        <div
          className={`${styles.inputWrapper} ${isToolsMenuOpen ? styles.toolsOpen : ""} ${isModelMenuOpen ? styles.modelOpen : ""}`}
        >
          <div className={styles.textWrapper}>
            {isUsageBlocked && (
              <div className={styles.chatGateNotice}>
                AI credit balance di AI Vault kosong. Deposit dulu untuk pakai
                chat.
              </div>
            )}
            {(linksInInput.length > 0 || inputFileAttachments.length > 0) && (
              <div className={styles.linkChipsRow}>
                {linksInInput.map((link) => (
                  <div key={link} className={styles.linkChip}>
                    <svg
                      className={styles.linkChipIcon}
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M10 13a5 5 0 0 1 0-7l2-2a5 5 0 0 1 7 7l-1 1" />
                      <path d="M14 11a5 5 0 0 1 0 7l-2 2a5 5 0 0 1-7-7l1-1" />
                    </svg>
                    <span className={styles.linkChipText}>
                      {getLinkLabel(link)}
                    </span>
                    <button
                      className={styles.linkChipRemove}
                      type="button"
                      onClick={() => removeLinkFromInput(link)}
                    >
                      x
                    </button>
                  </div>
                ))}
                {inputFileAttachments.map(({ file, index }) => (
                  <div key={`file-chip-${index}`} className={styles.fileChip}>
                    <div className={styles.fileChipIcon}>
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                      </svg>
                    </div>
                    <span className={styles.fileChipText}>{file.name}</span>
                    <button
                      className={styles.fileChipRemove}
                      type="button"
                      onClick={() =>
                        setAttachments((prev) =>
                          prev.filter((_, i) => i !== index),
                        )
                      }
                    >
                      x
                    </button>
                  </div>
                ))}
              </div>
            )}
            {inputImageAttachments.length > 0 && (
              <div className={styles.inputAttachmentRow}>
                {inputImageAttachments.map(({ file, index }) => (
                  <div key={index} className={styles.inputAttachmentItem}>
                    {file.type.startsWith("image/") ? (
                      <div className={styles.inputImageCard}>
                        {attachmentPreviews[index] && (
                          <img
                            src={attachmentPreviews[index].url}
                            alt="preview"
                            className={styles.inputImagePreview}
                            onClick={() => {
                              setExpandedImage({
                                name: file.name,
                                url: attachmentPreviews[index].url,
                              });
                            }}
                          />
                        )}
                        <button
                          className={styles.inputAttachmentRemove}
                          type="button"
                          onClick={() =>
                            setAttachments((prev) =>
                              prev.filter((_, i) => i !== index),
                            )
                          }
                        >
                          x
                        </button>
                      </div>
                    ) : (
                      <div className={styles.inputFileCard}>
                        <div className={styles.inputFileIcon}>
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.7"
                          >
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                          </svg>
                        </div>
                        <div className={styles.inputFileMeta}>
                          <div className={styles.inputFileName}>
                            {file.name}
                          </div>
                          <div className={styles.inputFileType}>
                            {formatAttachmentType(file.type, file.name)}
                          </div>
                        </div>
                        <button
                          className={styles.inputFileRemove}
                          type="button"
                          onClick={() =>
                            setAttachments((prev) =>
                              prev.filter((_, i) => i !== index),
                            )
                          }
                        >
                          x
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            {!isUsageBlocked &&
              (activeMarketLabel ||
                activeExchangeLabel ||
                activeMarketTimeframe ||
                activeMarketIndicators.length > 0 ||
                combinedHintValues.length > 0) && (
                <div className={styles.contextChipsRow}>
                  {activeMarketLabel && (
                    <button
                      type="button"
                      className={`${styles.contextChip} ${styles.marketContextChip}`}
                      onClick={() => onOpenChart?.(activeMarketLabel)}
                      title={`Open ${activeMarketLabel}`}
                    >
                      <span className={styles.contextChipKey}>Market</span>
                      <span className={styles.contextChipValue}>
                        {activeMarketLabel}
                      </span>
                    </button>
                  )}
                  {activeExchangeLabel && (
                    <div
                      className={`${styles.contextChip} ${styles.exchangeContextChip}`}
                    >
                      <span className={styles.contextChipKey}>Exchange</span>
                      <span className={styles.contextChipValue}>
                        {activeExchangeLabel}
                      </span>
                    </div>
                  )}
                  {activeMarketTimeframe && (
                    <div
                      className={`${styles.contextChip} ${styles.timeframeContextChip}`}
                    >
                      <span className={styles.contextChipKey}>Timeframe</span>
                      <span className={styles.contextChipValue}>
                        {activeMarketTimeframe}
                      </span>
                    </div>
                  )}
                  {activeMarketIndicators.length > 0 && (
                    <div
                      className={`${styles.contextChip} ${styles.indicatorContextChip}`}
                    >
                      <span className={styles.contextChipKey}>
                        {activeMarketIndicators.length > 1
                          ? "Active Indicators"
                          : "Active Indicator"}
                      </span>
                      <span className={styles.contextChipValue}>
                        {activeMarketIndicatorsLabel}
                      </span>
                    </div>
                  )}
                  {combinedHintValues.length > 0 && (
                    <div
                      className={`${styles.contextChip} ${styles.indicatorContextChip}`}
                    >
                      <span className={styles.contextChipKey}>Hint</span>
                      <span className={styles.contextChipValue}>
                        {combinedHintValues.join(", ")}
                      </span>
                      <button
                        type="button"
                        className={styles.contextChipRemove}
                        onClick={() => {
                          setToolStates((prev) => ({
                            ...prev,
                            timeframe: [],
                            indicators: [],
                          }));
                        }}
                      >
                        x
                      </button>
                    </div>
                  )}
                </div>
              )}
            {isPreparingAttachments && (
              <div
                className={styles.loadingRow}
                role="status"
                aria-live="polite"
              >
                <span className={styles.loadingBars} aria-hidden="true">
                  <span className={styles.loadingBar}></span>
                  <span className={styles.loadingBar}></span>
                  <span className={styles.loadingBar}></span>
                  <span className={styles.loadingBar}></span>
                </span>
                <span className={styles.loadingText}>
                  Uploading attachments
                  <span className={styles.loadingDots}>{loadingDots}</span>
                </span>
              </div>
            )}
            <textarea
              className={`${styles.inputField} ${isUsageBlocked ? styles.inputFieldBlocked : ""}`}
              placeholder={
                isUsageBlocked
                  ? "Deposit AI Vault credit to start chatting..."
                  : "Ask osmo to help you trade..."
              }
              rows={3}
              value={inputValue}
              disabled={sendBlockedByPrerequisite}
              onChange={(e) => {
                const nextValue = e.target.value;
                const foundLinks = extractLinks(nextValue);
                if (foundLinks.length > 0) {
                  setInputLinks((prev) =>
                    Array.from(new Set([...prev, ...foundLinks])),
                  );
                }
                const cleaned = nextValue
                  .replace(/\bhttps?:\/\/[^\s<>"]+/gi, "")
                  .replace(/\s{2,}/g, " ");
                setInputValue(cleaned);
              }}
              onKeyDown={handleKeyDown}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "auto";
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
                style={{ display: "none" }}
                accept="image/*,application/pdf,text/*,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                multiple
                disabled={sendBlockedByPrerequisite}
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    setAttachments((prev) => [
                      ...prev,
                      ...Array.from(e.target.files!),
                    ]);
                    e.target.value = ""; // Reset input
                    setIsToolsMenuOpen(false);
                  }
                }}
              />
              <button
                className={`${styles.toolButton} ${isToolsMenuOpen ? styles.active : ""}`}
                disabled={sendBlockedByPrerequisite}
                onClick={() => setIsToolsMenuOpen(!isToolsMenuOpen)}
              >
                <img
                  src="/src/assets/Plus.png"
                  alt="Add"
                  width={18}
                  height={18}
                />
                <span>Tools</span>
              </button>

              {/* Tools Dropdown Menu */}
              {isToolsMenuOpen && (
                <div className={styles.toolsMenu}>
                  {activeToolView === "main" ? (
                    <div style={{ flex: 1, overflowY: "auto" }}>
                      {/* 1. Attachment */}
                      <div
                        className={styles.toolItem}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <div className={styles.toolIconWrapper}>
                          <img
                            src="/src/assets/Icons/Attechment photo or doc.png"
                            alt="Attach"
                            width={18}
                            height={18}
                          />
                        </div>
                        <span>Attachment</span>
                      </div>

                      {/* 2. Execution */}
                      <div
                        className={styles.toolItem}
                        onClick={() =>
                          setToolStates((prev) => ({
                            ...prev,
                            execution: !prev.execution,
                          }))
                        }
                      >
                        <div className={styles.toolIconWrapper}>
                          <img
                            src="/src/assets/Icons/Exexution.png"
                            alt="Execution"
                            width={18}
                            height={18}
                          />
                        </div>
                        <span>Auto Execution</span>
                        <div
                          className={`${styles.toggleSwitch} ${toolStates.execution ? styles.checked : ""}`}
                        ></div>
                      </div>

                      {/* 3. Indicators (Nested Page) */}
                      <div
                        className={`${styles.toolItem} ${styles.toolItemCompact}`}
                        onClick={() => setActiveToolView("indicators")}
                      >
                        <div className={styles.toolIconWrapper}>
                          <img
                            src="/src/assets/Icons/Indikator.png"
                            alt="Indicators"
                            width={18}
                            height={18}
                          />
                        </div>
                        <span>Indicators</span>
                        <span className={styles.toolValue}>
                          {toolStates.indicators.length > 0
                            ? `${toolStates.indicators.length}`
                            : ""}
                        </span>
                        <span className={styles.toolArrow}>{">"}</span>
                      </div>

                      {/* 4. Timeframe */}
                      <div
                        className={`${styles.toolItem} ${styles.toolItemCompact}`}
                        onClick={() => setActiveToolView("timeframe")}
                      >
                        <div className={styles.toolIconWrapper}>
                          <img
                            src="/src/assets/Icons/Time frame.png"
                            alt="Timeframe"
                            width={18}
                            height={18}
                          />
                        </div>
                        <span>Timeframe</span>
                        <span className={styles.toolValue}>
                          {Array.isArray(toolStates.timeframe) &&
                            toolStates.timeframe.length > 0
                            ? `${toolStates.timeframe.length}`
                            : ""}
                        </span>
                        <span className={styles.toolArrow}>{">"}</span>
                      </div>

                      {/* 5. Write Permission */}
                      <div
                        className={styles.toolItem}
                        onClick={() =>
                          setToolStates((prev) => ({
                            ...prev,
                            write: !prev.write,
                          }))
                        }
                      >
                        <div className={styles.toolIconWrapper}>
                          <img
                            src="/src/assets/Icons/Write-tradingview.png"
                            alt="Write"
                            width={18}
                            height={18}
                          />
                        </div>
                        <span>Allow Write</span>
                        <div
                          className={`${styles.toggleSwitch} ${toolStates.write ? styles.checked : ""}`}
                        ></div>
                      </div>

                      {/* 6. More */}
                      <div
                        className={`${styles.toolItem} ${styles.toolItemCompact}`}
                        onClick={() => setActiveToolView("more")}
                      >
                        <div className={styles.toolIconWrapper}>
                          <img
                            src={gearIcon}
                            alt="More"
                            width={18}
                            height={18}
                          />
                        </div>
                        <span>More</span>
                        <span className={styles.toolArrow}>{">"}</span>
                      </div>
                    </div>
                  ) : activeToolView === "indicators" ? (
                    /* INDICATORS SUB-PAGE */
                    <div className={styles.toolSubPage}>
                      <div className={styles.toolPageHeader}>
                        <button
                          className={styles.backButton}
                          onClick={() => setActiveToolView("main")}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
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
                        {filteredIndicatorOptions
                          .map((indicator) => (
                            <div
                              key={indicator.value}
                              className={styles.toolItem}
                              onClick={() => {
                                const isActive =
                                  toolStates.indicators.includes(indicator.value);
                                setToolStates((prev) => ({
                                  ...prev,
                                  indicators: isActive
                                    ? prev.indicators.filter(
                                      (i) => i !== indicator.value,
                                    )
                                    : [...prev.indicators, indicator.value],
                                }));
                              }}
                            >
                              <span>{indicator.label}</span>
                              {toolStates.indicators.includes(indicator.value) && (
                                <img
                                  src="/src/assets/Icons/Check.png"
                                  alt="Selected"
                                  width={14}
                                  height={14}
                                  style={{ marginLeft: "auto" }}
                                />
                              )}
                            </div>
                          ))}
                      </div>
                    </div>
                  ) : activeToolView === "timeframe" ? (
                    /* TIMEFRAME SUB-PAGE */
                    <div className={styles.toolSubPage}>
                      <div className={styles.toolPageHeader}>
                        <button
                          className={styles.backButton}
                          onClick={() => setActiveToolView("main")}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                        </button>
                        <span>Select Timeframe</span>
                      </div>
                      <div className={styles.toolList}>
                        {timeframes.map((tf) => (
                          <div
                            key={tf}
                            className={styles.toolItem}
                            onClick={() => {
                              // Multi-select logic for timeframe
                              setToolStates((prev) => {
                                const current = Array.isArray(prev.timeframe)
                                  ? prev.timeframe
                                  : [prev.timeframe];
                                const isSelected = current.includes(tf);
                                const newTimeframes = isSelected
                                  ? current.filter((t) => t !== tf)
                                  : [...current, tf];
                                return { ...prev, timeframe: newTimeframes };
                              });
                              // e.stopPropagation(); // Keep menu open for multi-select
                            }}
                          >
                            <span>{tf}</span>
                            {(Array.isArray(toolStates.timeframe)
                              ? toolStates.timeframe.includes(tf)
                              : toolStates.timeframe === tf) && (
                                <img
                                  src="/src/assets/Icons/Check.png"
                                  alt="Selected"
                                  width={14}
                                  height={14}
                                  style={{ marginLeft: "auto" }}
                                />
                              )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : activeToolView === "style" ? (
                    /* STYLE SUB-PAGE */
                    <div className={styles.toolSubPage}>
                      <div className={styles.toolPageHeader}>
                        <button
                          className={styles.backButton}
                          onClick={() => setActiveToolView("more")}
                        >
                          {"<"}
                        </button>
                        <span>Style</span>
                      </div>
                      <div className={styles.toolList}>
                        {(() => {
                          const convIndex: Record<string, number> = {
                            normal: 1,
                            learning: 2,
                            concise: 3,
                            explanatory: 4,
                            formal: 5,
                          };
                          const tradingIndex: Record<string, number> = {
                            off: 0,
                            jesse_livermore: 1,
                            paul_tudor_jones: 2,
                            mark_minervini: 3,
                            nicolas_darvas: 4,
                            william_oneil: 5,
                            stan_weinstein: 6,
                            willy_woo: 7,
                            rekt_capital: 8,
                            benjamin_cowen: 9,
                          };

                          const convOptions = [
                            { id: "normal", label: "Normal" },
                            { id: "learning", label: "Learning" },
                            { id: "concise", label: "Concise" },
                            { id: "explanatory", label: "Explanatory" },
                            { id: "formal", label: "Formal" },
                          ] as const;

                          const tradingOptions = [
                            { id: "off", label: "Off" },
                            { id: "jesse_livermore", label: "Jesse Livermore" },
                            {
                              id: "paul_tudor_jones",
                              label: "Paul Tudor Jones",
                            },
                            { id: "mark_minervini", label: "Mark Minervini" },
                            { id: "nicolas_darvas", label: "Nicolas Darvas" },
                            { id: "william_oneil", label: "William O'Neil" },
                            { id: "stan_weinstein", label: "Stan Weinstein" },
                            { id: "willy_woo", label: "Willy Woo" },
                            { id: "rekt_capital", label: "Rekt Capital" },
                            { id: "benjamin_cowen", label: "Benjamin Cowen" },
                          ] as const;

                          const isConvOpen =
                            openStyleSection === "conversation";
                          const isTradingOpen = openStyleSection === "trading";

                          return (
                            <>
                              <details
                                className={styles.styleDetails}
                                open={isConvOpen}
                              >
                                <summary
                                  className={`${styles.toolItem} ${styles.styleSummary}`}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setOpenStyleSection((prev) =>
                                      prev === "conversation"
                                        ? null
                                        : "conversation",
                                    );
                                  }}
                                >
                                  <div className={styles.toolIconWrapper}>
                                    <img
                                      src="/src/assets/Style/User.png"
                                      alt="Conversation"
                                      width={18}
                                      height={18}
                                    />
                                  </div>
                                  <span>Conversation Style</span>
                                  <span className={styles.toolValue}>
                                    {String(
                                      convIndex[
                                      String(toolStates.conversation_style)
                                      ] ?? 1,
                                    )}
                                  </span>
                                  <img
                                    className={`${styles.styleChevron} ${isConvOpen ? styles.styleChevronOpen : ""}`}
                                    src="/src/assets/Icons/Arrow/Arrow-down-Bullet.png"
                                    alt=""
                                    aria-hidden="true"
                                  />
                                </summary>
                                <div className={styles.stylePanel}>
                                  {convOptions.map((opt, idx) => (
                                    <div
                                      key={opt.id}
                                      className={styles.toolItem}
                                      onClick={() => {
                                        setToolStates((prev) => ({
                                          ...prev,
                                          conversation_style: opt.id as any,
                                        }));
                                        setOpenStyleSection(null);
                                      }}
                                    >
                                      <div className={styles.styleIndexPill}>
                                        {idx + 1}
                                      </div>
                                      <span>{opt.label}</span>
                                      {toolStates.conversation_style ===
                                        opt.id && (
                                          <img
                                            src="/src/assets/Icons/Check.png"
                                            alt="Selected"
                                            width={14}
                                            height={14}
                                            style={{ marginLeft: "auto" }}
                                          />
                                        )}
                                    </div>
                                  ))}
                                </div>
                              </details>

                              <details
                                className={styles.styleDetails}
                                open={isTradingOpen}
                              >
                                <summary
                                  className={`${styles.toolItem} ${styles.styleSummary}`}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setOpenStyleSection((prev) =>
                                      prev === "trading" ? null : "trading",
                                    );
                                  }}
                                >
                                  <div className={styles.toolIconWrapper}>
                                    <img
                                      src="/src/assets/Style/Student.png"
                                      alt="Trading Style"
                                      width={18}
                                      height={18}
                                    />
                                  </div>
                                  <span>Trading Styles</span>
                                  <span className={styles.toolValue}>
                                    {String(
                                      tradingIndex[
                                      String(toolStates.trading_style_profile)
                                      ] ?? 0,
                                    )}
                                  </span>
                                  <img
                                    className={`${styles.styleChevron} ${isTradingOpen ? styles.styleChevronOpen : ""}`}
                                    src="/src/assets/Icons/Arrow/Arrow-down-Bullet.png"
                                    alt=""
                                    aria-hidden="true"
                                  />
                                </summary>
                                <div className={styles.stylePanel}>
                                  {tradingOptions.map((opt, idx) => (
                                    <div
                                      key={opt.id}
                                      className={styles.toolItem}
                                      onClick={() => {
                                        setToolStates((prev) => ({
                                          ...prev,
                                          trading_style_profile: opt.id as any,
                                        }));
                                        setOpenStyleSection(null);
                                      }}
                                    >
                                      <div className={styles.styleIndexPill}>
                                        {opt.id === "off" ? 0 : idx}
                                      </div>
                                      <span>{opt.label}</span>
                                      {toolStates.trading_style_profile ===
                                        opt.id && (
                                          <img
                                            src="/src/assets/Icons/Check.png"
                                            alt="Selected"
                                            width={14}
                                            height={14}
                                            style={{ marginLeft: "auto" }}
                                          />
                                        )}
                                    </div>
                                  ))}
                                </div>
                              </details>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  ) : (
                    /* MORE SUB-PAGE */
                    <div className={styles.toolSubPage}>
                      <div className={styles.toolPageHeader}>
                        <button
                          className={styles.backButton}
                          onClick={() => setActiveToolView("main")}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                        </button>
                        <span>More Settings</span>
                      </div>
                      <div className={styles.toolList}>
                        <div
                          className={`${styles.toolItem} ${styles.toolItemCompact}`}
                          onClick={() => setActiveToolView("style")}
                        >
                          <div className={styles.toolIconWrapper}>
                            <img
                              src="/src/assets/Style/PencilSimple.png"
                              alt="Style"
                              width={18}
                              height={18}
                            />
                          </div>
                          <span>Style</span>
                          <span className={styles.toolArrow}>{">"}</span>
                        </div>

                        <div
                          className={styles.toolItem}
                          onClick={() =>
                            setToolStates((prev) => ({
                              ...prev,
                              webObservation: !prev.webObservation,
                            }))
                          }
                        >
                          <div className={styles.toolIconWrapper}>
                            <img
                              src={brainIcon}
                              alt="Web Search"
                              width={18}
                              height={18}
                            />
                          </div>
                          <span>Web Search</span>
                          <div
                            className={`${styles.toggleSwitch} ${toolStates.webObservation ? styles.checked : ""}`}
                          ></div>
                        </div>

                        <div
                          className={styles.toolItem}
                          onClick={() =>
                            setToolStates((prev) => ({
                              ...prev,
                              memoryEnabled: !prev.memoryEnabled,
                            }))
                          }
                        >
                          <div className={styles.toolIconWrapper}>
                            <img
                              src={brainIcon}
                              alt="Memory"
                              width={18}
                              height={18}
                            />
                          </div>
                          <span>Memory</span>
                          <div
                            className={`${styles.toggleSwitch} ${toolStates.memoryEnabled ? styles.checked : ""}`}
                          ></div>
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
                className={`${styles.modelSelectorTrigger} ${isModelMenuOpen ? styles.active : ""}`}
                onClick={toggleModelMenu}
              >
                <span>{selectedModel || "Select model"}</span>
                <div style={{ flex: 1 }}></div>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  style={{
                    transform: isModelMenuOpen
                      ? "rotate(180deg)"
                      : "rotate(0deg)",
                    transition: "transform 0.2s",
                  }}
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </div>
              {isModelMenuOpen && (
                <div className={`${styles.modelMenu} ${styles.menuTop}`}>
                  {/* Modes section */}
                  <div
                    style={{
                      padding: "8px",
                      borderBottom: "1px solid #2A1A24",
                      background: "#0A0005",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "10px",
                        color: "#5A4A54",
                        marginBottom: "8px",
                        paddingLeft: "8px",
                        fontWeight: "bold",
                        textTransform: "uppercase",
                        letterSpacing: "1px",
                      }}
                    >
                      Reasoning Effort
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "4px",
                      }}
                    >
                      {[
                        { id: "low", label: "Low", level: 1 },
                        { id: "medium", label: "Medium", level: 2 },
                        { id: "high", label: "High", level: 3 },
                        { id: "extra_high", label: "Extra High", level: 4 },
                      ].map((mode) => (
                        <div
                          key={mode.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setReasoningEffort(mode.id as any);
                          }}
                          style={{
                            padding: "8px",
                            borderRadius: "6px",
                            background:
                              reasoningEffort === mode.id
                                ? "#3B2030"
                                : "#12000A",
                            color:
                              reasoningEffort === mode.id
                                ? "#FFFFFF"
                                : "#A77590",
                            fontSize: "11px",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            cursor: "pointer",
                            border: "1px solid",
                            borderColor:
                              reasoningEffort === mode.id
                                ? "#3B2030"
                                : "#2A1A24",
                          }}
                        >
                          <span className={styles.reasoningIconGroup}>
                            <img
                              src={brainIcon}
                              alt=""
                              className={styles.reasoningIcon}
                            />
                          </span>
                          <span>{mode.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div
                    style={{
                      fontSize: "10px",
                      color: "#5A4A54",
                      padding: "8px 16px",
                      fontWeight: "bold",
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                    }}
                  >
                    Select Model
                  </div>
                  {availableModels.map((model) => (
                    <div key={model.id} className={styles.modelMenuItemWrapper}>
                      <div className={styles.modelMenuItem}>
                        <div
                          className={styles.modelMenuItemMain}
                          onClick={() => {
                            setSelectedModel(model.name);
                            setIsModelMenuOpen(false);
                          }}
                          style={{
                            background:
                              selectedModel === model.name
                                ? "#1A0D15"
                                : "transparent",
                          }}
                        >
                          <span>{model.name}</span>
                          {selectedModel === model.name && (
                            <span
                              style={{ color: "#3B2030", fontSize: "12px" }}
                            >
                              âœ“
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Chat toggle action removed as per request */}

            <div
              className={styles.iconSection}
              style={{ position: "relative" }}
            >
              <button
                className={`${styles.iconAction} ${isListening ? styles.listening : ""}`}
                onClick={toggleVoiceInput}
                onContextMenu={handleVoiceContextMenu}
                disabled={sendBlockedByPrerequisite}
                title={`Voice Input (${languages.find((l) => l.code === voiceLanguage)?.label})\nRight-click to change language`}
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
                    <img
                      src="/src/assets/Voice.png"
                      alt="Voice"
                      width={18}
                      height={18}
                    />
                    <span className={styles.voiceLanguageIndicator}>
                      {languages.find((l) => l.code === voiceLanguage)?.short}
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
                      className={`${styles.voiceLanguageItem} ${voiceLanguage === lang.code ? styles.activeLang : ""}`}
                      onClick={() => {
                        setVoiceLanguage(lang.code);
                        localStorage.setItem("chat_voice_language", lang.code); // Persist choice
                        setIsVoiceLanguageMenuOpen(false);
                      }}
                    >
                      <span style={{ width: "24px", opacity: 0.7 }}>
                        {lang.short}
                      </span>
                      <span>{lang.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={styles.sendSection}>
              <button
                className={`${styles.sendAction} ${isTyping || (hasDraftContent && !sendBlockedByPrerequisite && !isPreparingAttachments) ? styles.active : ""}`}
                onClick={isTyping ? onStop : handleSend}
                disabled={isSendDisabled}
                title={sendButtonTitle}
              >
                {isTyping ? (
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      background: "#FFE1F2",
                      borderRadius: 2,
                    }}
                  ></div>
                ) : (
                  <img
                    src="/src/assets/Arrow.png"
                    alt="Send"
                    className={styles.arrowIcon}
                    width={18}
                    height={18}
                  />
                )}
              </button>
            </div>
          </div>
        </div>
      </div >
      {/* Image Overlay */}
      {
        expandedImage && (
          <div
            className={styles.imageOverlayBackdrop}
            onClick={closeExpandedImage}
          >
            <div
              className={styles.imageOverlayContent}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className={styles.overlayClose}
                onClick={closeExpandedImage}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
              <img
                src={expandedImage.url}
                alt="Expanded"
                className={styles.fullImage}
              />
              <div className={styles.overlayInfo}>{expandedImage.name}</div>
            </div>
          </div>
        )
      }
    </div >
  );
};

export default ChatInterface;
