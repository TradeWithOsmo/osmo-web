import React, { useState, useEffect, useRef } from 'react';
import styles from './GlobalChat.module.css';
import { useMarketStore } from '../../store/useMarketStore';
import { useWallet } from '../../hooks';
import TokenIcon from '../MarketDetails/TokenIcon';
import PlusIcon from '../../assets/Icons/Plus.png';

interface ChatMessage {
    id: string;
    address: string;
    text: string;
    timestamp: number;
    replyTo?: {
        id: string;
        address: string;
        text: string;
    };
    sharedNews?: {
        title: string;
        photoUrl?: string;
        link: string;
    };
    images?: string[];
}

const GlobalChat: React.FC = () => {
    const { selectedMarket, setMarket } = useMarketStore();
    const { truncatedAddress, authenticated } = useWallet();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const [hoveredMsgId, setHoveredMsgId] = useState<string | null>(null);
    const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
    const [detectedLink, setDetectedLink] = useState<string | null>(null);
    const [lastMessageTime, setLastMessageTime] = useState<number>(0);
    const [timeLeft, setTimeLeft] = useState<number>(0);
    const [selectedImages, setSelectedImages] = useState<string[]>([]);
    const [fullScreenImages, setFullScreenImages] = useState<string[] | null>(null);
    const [fullScreenIndex, setFullScreenIndex] = useState<number>(0);
    const [highlightedMsgId, setHighlightedMsgId] = useState<string | null>(null);
    const [onlineCount, setOnlineCount] = useState<number>(1);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const toChatRoomSymbol = (rawSymbol?: string | null): string => {
        const raw = String(rawSymbol || '').trim().toUpperCase();
        if (!raw) return 'BTC';
        const normalized = raw.replace(/_/g, '-').replace(/\//g, '-');
        return normalized.split('-')[0] || 'BTC';
    };

    const symbol = toChatRoomSymbol(selectedMarket?.symbol);

    const fetchMessages = async () => {
        const API_ORIGIN = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        try {
            const res = await fetch(`${API_ORIGIN}/api/chat/global?symbol=${encodeURIComponent(symbol)}`);
            if (res.ok) {
                const data = await res.json();
                setMessages(data.messages || []);
                setOnlineCount(data.online_count || 1);
            }
        } catch (e) {
            console.error('Failed to fetch chat messages', e);
        }
    };

    useEffect(() => {
        fetchMessages();
        const interval = setInterval(fetchMessages, 5000); // 5 second polling
        return () => clearInterval(interval);
    }, [symbol]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [timeLeft]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!fullScreenImages) return;

            if (e.key === 'ArrowRight') {
                handleNextImage();
            } else if (e.key === 'ArrowLeft') {
                handlePrevImage();
            } else if (e.key === 'Escape') {
                setFullScreenImages(null);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [fullScreenImages, fullScreenIndex]);

    const handleNextImage = () => {
        if (fullScreenImages && fullScreenImages.length > 1) {
            setFullScreenIndex((prev) => (prev + 1) % fullScreenImages.length);
        }
    };

    const handlePrevImage = () => {
        if (fullScreenImages && fullScreenImages.length > 1) {
            setFullScreenIndex((prev) => (prev - 1 + fullScreenImages.length) % fullScreenImages.length);
        }
    };

    const scrollToMessage = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const el = document.getElementById(`msg-${id}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setHighlightedMsgId(id);
            setTimeout(() => setHighlightedMsgId(null), 2000);
        }
    };

    useEffect(() => {
        if (isOpen && messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen]);

    useEffect(() => {
        if (!detectedLink) {
            const urlMatch = inputValue.match(/(https?:\/\/[^\s]+)/);
            if (urlMatch) {
                setDetectedLink(urlMatch[0]);
                setInputValue(prev => prev.replace(urlMatch[0], '').trim());
            }
        }
    }, [inputValue, detectedLink]);

    let previewData: any = null;
    let shortDomain = '';
    if (detectedLink) {
        try {
            const urlObj = new URL(detectedLink);
            shortDomain = urlObj.hostname.replace('www.', '');

            // Try to extract a title from the URL path
            let generatedTitle = shortDomain;
            const segments = urlObj.pathname.split('/').filter(s => s.length > 3);
            if (segments.length > 0) {
                const lastSegment = segments[segments.length - 1];
                let cleanWord = lastSegment.replace(/[-_.]/g, ' ');
                // remove common file extensions from cleanWord if present at end
                cleanWord = cleanWord.replace(/ html$/i, '').replace(/ htm$/i, '').replace(/ php$/i, '');
                generatedTitle = cleanWord.charAt(0).toUpperCase() + cleanWord.slice(1);
            } else {
                const domainParts = shortDomain.split('.');
                if (domainParts.length > 0) {
                    generatedTitle = domainParts[0].charAt(0).toUpperCase() + domainParts[0].slice(1) + ' Updates';
                }
            }

            previewData = {
                title: generatedTitle,
                photoUrl: `https://www.google.com/s2/favicons?domain=${shortDomain}&sz=128`,
                link: detectedLink
            };
        } catch (error) {
            // invalid url
        }
    }

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) {
            const promises = files.map(file => {
                return new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.readAsDataURL(file);
                });
            });

            Promise.all(promises).then(base64Images => {
                setSelectedImages(prev => [...prev, ...base64Images].slice(0, 4)); // Max 4 images
            });
        }

        // Reset the input value so the same file selection can trigger onChange again
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault(); // Keep preventDefault for form submission
        if ((!inputValue.trim() && !detectedLink && selectedImages.length === 0) || !authenticated) return;

        // 10 second delay check
        const now = Date.now();
        if (now - lastMessageTime < 10000) {
            // Already handled by disabling the button and showing the timer, but adding a check here just in case
            return;
        }

        const messageText = inputValue.trim();

        // Check if there is a preview data
        let sharedNewsData = undefined;
        if (previewData) {
            sharedNewsData = previewData;
        }

        const payload = {
            symbol: symbol,
            address: truncatedAddress || 'Anon',
            text: messageText,
            replyTo: replyingTo ? { id: replyingTo.id, address: replyingTo.address, text: replyingTo.text } : undefined,
            sharedNews: sharedNewsData,
            images: selectedImages.length > 0 ? selectedImages : undefined
        };

        const optimisticMsg: ChatMessage = {
            id: Date.now().toString(),
            timestamp: Date.now(),
            ...payload
        };
        setMessages(prev => [...prev, optimisticMsg]);

        setInputValue('');
        setReplyingTo(null);
        setDetectedLink(null);
        setSelectedImages([]);
        setLastMessageTime(now);
        setTimeLeft(10);

        const API_ORIGIN = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        try {
            await fetch(`${API_ORIGIN}/api/chat/global`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            fetchMessages(); // Re-sync
        } catch (error) {
            console.error('Failed to send message', error);
        }
    };

    const handleDelete = (id: string) => {
        setMessages(prev => prev.filter(msg => msg.id !== id));
    };

    return (
        <div className={styles.chatContainer}>
            {/* Header acts as the toggle button on the footer */}
            <div className={styles.chatHeader} onClick={() => setIsOpen(!isOpen)}>
                <div className={styles.headerLeft}>
                    {/* Chat Icon SVG */}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                    <span className={styles.title}>{symbol} Chat</span>
                    <span className={styles.onlineDot}></span>
                    <span className={styles.onlineCount}>{onlineCount} Online</span>
                </div>
                {/* Arrow indicator for open/close state */}
                <div className={styles.headerRight} style={{ marginLeft: '12px' }}>
                    <svg className={`${styles.arrow} ${isOpen ? styles.arrowDown : ''}`} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="18 15 12 9 6 15"></polyline>
                    </svg>
                </div>
            </div>

            {/* The popup window that opens above the footer */}
            <div className={`${styles.chatWindow} ${isOpen ? styles.open : ''}`}>
                <div className={styles.windowTopBar}>
                    <div className={styles.headerLeft}>
                        <span className={styles.title}>{symbol} Chat</span>
                    </div>
                    <div className={styles.headerRight}>
                        {timeLeft > 0 && <span className={styles.cooldownText}>Try again in {timeLeft}s</span>}
                        <button className={styles.closeBtn} onClick={() => setIsOpen(false)}>×</button>
                    </div>
                </div>
                <div className={styles.chatBodyWrapper}>
                    <div className={styles.chatMessages}>
                        {messages.map((msg) => {
                            const isOwnMsg = authenticated && msg.address === truncatedAddress;
                            return (
                                <div
                                    key={msg.id}
                                    id={`msg-${msg.id}`}
                                    className={`${styles.messageRow} ${hoveredMsgId === msg.id ? styles.activeRow : ''} ${highlightedMsgId === msg.id ? styles.highlightedRow : ''}`}
                                    onClick={() => setHoveredMsgId(hoveredMsgId === msg.id ? null : msg.id)}
                                    onMouseEnter={() => setHoveredMsgId(msg.id)}
                                    onMouseLeave={() => setHoveredMsgId(null)}
                                >
                                    <div className={styles.msgColumn}>
                                        {msg.replyTo && (
                                            <div className={styles.repliedContext} onClick={(e) => scrollToMessage(msg.replyTo!.id, e)}>
                                                <div className={styles.replyLine}></div>
                                                <div className={styles.repliedContentWrap}>
                                                    <span className={styles.repliedAddress}>{msg.replyTo.address}</span>
                                                    <span className={styles.repliedText}>{msg.replyTo.text}</span>
                                                </div>
                                            </div>
                                        )}
                                        <div className={styles.msgContent} style={{ alignItems: msg.text ? 'flex-start' : 'center' }}>
                                            <span className={styles.msgAddress}>{msg.address}</span>
                                            {msg.text && (
                                                <span className={styles.msgText}>
                                                    {msg.text.split(/(\$[A-Za-z0-9]+|\b(?:BTC|ETH|USDT|BNB|SOL|ADA|DOGE|XRP|DOT|AVAX|MATIC|LTC|LINK|BCH|ATOM|XLM|ALGO|USDC)\b|https?:\/\/[^\s]+)/i).map((part, i) => {
                                                        const isTicker = /^\$[A-Za-z0-9]+$/i.test(part) || /^(?:BTC|ETH|USDT|BNB|SOL|ADA|DOGE|XRP|DOT|AVAX|MATIC|LTC|LINK|BCH|ATOM|XLM|ALGO|USDC)$/i.test(part);
                                                        const isLink = /^https?:\/\/[^\s]+$/i.test(part);

                                                        if (isTicker) {
                                                            const sym = part.startsWith('$') ? part.substring(1).toUpperCase() : part.toUpperCase();
                                                            const displayPart = part.startsWith('$') ? part.toUpperCase() : `$${part.toUpperCase()}`;
                                                            return (
                                                                <span key={i} className={styles.tickerTag} onClick={() => setMarket(sym)} style={{ cursor: 'pointer' }}>
                                                                    <TokenIcon symbol={sym} className={styles.tickerIcon} size={14} />
                                                                    {displayPart}
                                                                </span>
                                                            );
                                                        } else if (isLink) {
                                                            let displayUrl = part;
                                                            try {
                                                                const urlObj = new URL(part);
                                                                displayUrl = urlObj.hostname.replace('www.', '');
                                                            } catch (e) { }

                                                            return (
                                                                <a key={i} href={part} target="_blank" rel="noopener noreferrer" className={styles.linkTag}>
                                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                                                                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                                                                    </svg>
                                                                    {displayUrl}
                                                                </a>
                                                            );
                                                        }
                                                        return <span key={i}>{part}</span>;
                                                    })}
                                                </span>
                                            )}
                                        </div>
                                        {msg.sharedNews && (
                                            <a href={msg.sharedNews.link} target="_blank" rel="noopener noreferrer" className={styles.newsPreview}>
                                                {msg.sharedNews.photoUrl && (
                                                    <img src={msg.sharedNews.photoUrl} alt="News thumbnail" className={styles.newsPhoto} />
                                                )}
                                                <div className={styles.newsInfo}>
                                                    <span className={styles.newsTitle}>{msg.sharedNews.title}</span>
                                                    <span className={styles.newsReadMore}>Read more &rarr;</span>
                                                </div>
                                            </a>
                                        )}
                                        {msg.images && msg.images.length > 0 && (
                                            <div className={styles.imageAttachmentsContainer}>
                                                {msg.images.map((imgUrl, idx) => (
                                                    <div
                                                        key={idx}
                                                        className={styles.imageAttachment}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setFullScreenImages(msg.images || []);
                                                            setFullScreenIndex(idx);
                                                        }}
                                                    >
                                                        <img src={imgUrl} alt="Shared image" className={styles.imageAttachmentThumb} />
                                                        <div className={styles.imageAttachmentInfo}>
                                                            <span className={styles.imageAttachmentTitle}>Image {idx + 1}</span>
                                                            <span className={styles.imageAttachmentSub}>Click to view full size</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {hoveredMsgId === msg.id && (
                                        <div className={styles.msgActions}>
                                            <button className={styles.actionBtn} title="Reply" onClick={(e) => { e.stopPropagation(); setReplyingTo(msg); }}>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="9 14 4 9 9 4"></polyline>
                                                    <path d="M20 20v-7a4 4 0 0 0-4-4H4"></path>
                                                </svg>
                                            </button>
                                            {isOwnMsg && (
                                                <button className={styles.actionBtn} title="Delete" onClick={(e) => { e.stopPropagation(); handleDelete(msg.id); }}>
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FF4560" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <polyline points="3 6 5 6 21 6"></polyline>
                                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>
                    <div className={styles.inputContainer}>
                        {replyingTo && (
                            <div className={styles.replyPreview}>
                                <div className={styles.replyPreviewContent}>
                                    <div className={styles.replyHeader}>
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
                                            <polyline points="9 14 4 9 9 4"></polyline>
                                            <path d="M20 20v-7a4 4 0 0 0-4-4H4"></path>
                                        </svg>
                                        <span className={styles.replyingToLabel}>Replying to </span>
                                        <span className={styles.replyingToAddress}>{replyingTo.address}</span>
                                    </div>
                                    <span className={styles.replyingToText}>{replyingTo.text}</span>
                                </div>
                                <button type="button" className={styles.cancelReplyBtn} onClick={() => setReplyingTo(null)}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                </button>
                            </div>
                        )}

                        {previewData && !replyingTo && (
                            <div className={styles.replyPreview}>
                                <div className={styles.replyPreviewContent}>
                                    <div className={styles.replyHeader}>
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
                                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                                            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                                        </svg>
                                        <span className={styles.replyingToLabel}>Link Preview</span>
                                    </div>
                                    <div className={styles.newsPreview} style={{ marginTop: '8px', pointerEvents: 'none' }}>
                                        {previewData.photoUrl && (
                                            <img src={previewData.photoUrl} alt="News thumbnail" className={styles.newsPhoto} />
                                        )}
                                        <div className={styles.newsInfo}>
                                            <span className={styles.newsTitle}>{previewData.title}</span>
                                            <span className={styles.newsReadMore}>Read more &rarr;</span>
                                        </div>
                                    </div>
                                </div>
                                <button type="button" className={styles.cancelReplyBtn} onClick={() => setDetectedLink(null)}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                </button>
                            </div>
                        )}

                        {selectedImages.length > 0 && (
                            <div className={styles.selectedImagesPreview}>
                                {selectedImages.map((img, idx) => (
                                    <div key={idx} className={styles.selectedImageItem}>
                                        <img src={img} alt="Selected preview" className={styles.selectedImageThumb} />
                                        <button
                                            type="button"
                                            className={styles.removeImageBtn}
                                            onClick={() => setSelectedImages(prev => prev.filter((_, i) => i !== idx))}
                                        >
                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                                <line x1="6" y1="6" x2="18" y2="18"></line>
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                                {selectedImages.length < 4 && (
                                    <div className={styles.addImageBtn} onClick={() => fileInputRef.current?.click()}>
                                        <img src={PlusIcon} alt="Add image" style={{ width: '16px', height: '16px' }} />
                                    </div>
                                )}
                            </div>
                        )}

                        <form className={styles.chatInputArea} onSubmit={handleSend}>
                            <div className={styles.inputWrapper}>
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    style={{ display: 'none' }}
                                    ref={fileInputRef}
                                    onChange={handleImageChange}
                                />
                                <input
                                    type="text"
                                    className={styles.chatInput}
                                    placeholder={!authenticated ? "Connect wallet to chat" : timeLeft > 0 ? `Please wait ${timeLeft}s...` : "Type a message..."}
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    disabled={!authenticated || timeLeft > 0}
                                />
                                <div style={{ display: 'flex', gap: '4px' }}>
                                    <button
                                        type="button"
                                        className={styles.uploadBtn}
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={!authenticated || timeLeft > 0}
                                        title="Attach image"
                                    >
                                        <img src={PlusIcon} alt="Attach image" style={{ width: '16px', height: '16px', filter: 'brightness(0) saturate(100%) invert(51%) sepia(8%) saturate(1478%) hue-rotate(293deg) brightness(98%) contrast(90%)' }} />
                                    </button>
                                    <button
                                        type="submit"
                                        className={styles.sendBtn}
                                        disabled={!authenticated || (!inputValue.trim() && !detectedLink && selectedImages.length === 0) || timeLeft > 0}
                                        title={timeLeft > 0 ? `Wait ${timeLeft}s` : "Send"}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="22" y1="2" x2="11" y2="13"></line>
                                            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {fullScreenImages && fullScreenImages.length > 0 && (
                <div className={styles.fullScreenOverlay} onClick={() => setFullScreenImages(null)}>
                    {fullScreenImages.length > 1 && (
                        <button
                            className={`${styles.navImageBtn} ${styles.prevImageBtn}`}
                            onClick={(e) => { e.stopPropagation(); handlePrevImage(); }}
                        >
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="15 18 9 12 15 6"></polyline>
                            </svg>
                        </button>
                    )}

                    <img
                        src={fullScreenImages[fullScreenIndex]}
                        alt={`Full screen preview ${fullScreenIndex + 1}`}
                        className={styles.fullScreenImage}
                        onClick={(e) => e.stopPropagation()}
                    />

                    {fullScreenImages.length > 1 && (
                        <button
                            className={`${styles.navImageBtn} ${styles.nextImageBtn}`}
                            onClick={(e) => { e.stopPropagation(); handleNextImage(); }}
                        >
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="9 18 15 12 9 6"></polyline>
                            </svg>
                        </button>
                    )}

                    {fullScreenImages.length > 1 && (
                        <div className={styles.imageCounter}>
                            {fullScreenIndex + 1} / {fullScreenImages.length}
                        </div>
                    )}

                    <button className={styles.closeFullScreenBtn} onClick={() => setFullScreenImages(null)}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
            )}
        </div>
    );
};

export default GlobalChat;
