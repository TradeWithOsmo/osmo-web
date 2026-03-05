import React, { useState, useEffect, useMemo } from 'react';
import { useWallets } from '@privy-io/react-auth';
import { useUsageStore } from '../../store/useUsageStore';
import styles from './AutosSettings.module.css';
import { usageService } from '../../api/usageService';
import ArrowUpBulletIcon from '../../assets/Icons/Arrow/Arrow-up-Bullet.png';

interface Model {
    id: string;
    name: string;
    description?: string;
    input_cost?: number;
    output_cost?: number;
}

const PRIORITY_ORDER = [
    "google", "anthropic", "deepseek", "openai", "qwen",
    "mistral", "z-ai", "moonshot", "x-ai", "meta"
];

const sortProviderList = (list: string[]) => {
    return [...list].sort((a, b) => {
        const aLower = a.toLowerCase();
        const bLower = b.toLowerCase();

        let idxA = PRIORITY_ORDER.findIndex(p => aLower.includes(p));
        let idxB = PRIORITY_ORDER.findIndex(p => bLower.includes(p));

        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;

        return a.localeCompare(b);
    });
};

interface AutosSettingsProps {
    onBack: () => void;
}

interface ModelRowProps {
    model: Model;
    index: number;
    enabledModels: Record<string, boolean>;
    onToggle: (id: string) => void;
}

const ModelRow = React.memo(({ model, index, enabledModels, onToggle }: ModelRowProps) => {
    return (
        <tr className={`${styles.row} ${styles.childRow}`}>
            <td className={`${styles.td} ${styles.tdFirst}`} style={{ paddingLeft: '40px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '11px', color: '#5A4A54', minWidth: '20px' }}>{index + 1}.</span>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '13px', fontWeight: '500', color: '#FFE1F2' }}>
                                {model.name}
                            </span>
                            {model.input_cost === 0 && model.output_cost === 0 && (
                                <span style={{
                                    fontSize: '10px',
                                    border: '1px solid #3B2030',
                                    borderRadius: '4px',
                                    padding: '0 4px',
                                    color: '#3B2030',
                                    height: '16px',
                                    display: 'flex',
                                    alignItems: 'center'
                                }}>
                                    Free
                                </span>
                            )}
                        </div>
                        <span style={{ fontSize: '11px', color: '#5A4A54' }}>{model.id}</span>
                    </div>
                </div>
            </td>
            <td className={`${styles.td} ${styles.tdRight}`}>
                <div className={styles.tdRightContent}>
                    <label className={styles.switch} onClick={e => e.stopPropagation()}>
                        <input
                            type="checkbox"
                            checked={!!enabledModels[model.id]}
                            onChange={() => onToggle(model.id)}
                        />
                        <span className={styles.slider}></span>
                    </label>
                </div>
            </td>
        </tr>
    );
});

interface ProviderRowProps {
    provider: string;
    models?: Model[];
    enabledModels: Record<string, boolean>;
    onToggle: (id: string) => void;
    onExpand: (p: string) => void;
    searchQuery: string;
}

const ProviderRow = React.memo(({
    provider,
    models,
    enabledModels,
    onToggle,
    onExpand,
    searchQuery
}: ProviderRowProps) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleExpand = async () => {
        if (!isExpanded && (!models || models.length === 0)) {
            setIsLoading(true);
            await onExpand(provider);
            setIsLoading(false);
        }
        setIsExpanded(!isExpanded);
    };

    const hasModels = models && models.length > 0;
    const displayModels = (searchQuery && hasModels)
        ? models!.filter(m =>
            m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            provider.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : (models || []);

    return (
        <>
            <tr
                className={`${styles.row} ${styles.providerRow}`}
                onClick={handleExpand}
                style={{ cursor: 'pointer' }}
            >
                <td className={`${styles.td} ${styles.tdFirst}`} style={{ fontWeight: 'bold' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {provider}
                        {isLoading ? (
                            <span style={{ fontSize: '10px', color: '#A77590', marginLeft: '4px' }}>Loading...</span>
                        ) : (
                            hasModels && (
                                <span style={{ fontSize: '10px', color: '#5A4A54', fontWeight: 'normal', marginLeft: '4px' }}>
                                    ({displayModels.length})
                                </span>
                            )
                        )}
                    </div>
                </td>
                <td className={`${styles.td} ${styles.tdRight}`}>
                    <div className={styles.tdRightContent}>
                        <div style={{ display: 'inline-flex', width: '40px', justifyContent: 'center' }}>
                            <img
                                src={ArrowUpBulletIcon}
                                alt="Toggle"
                                style={{
                                    width: '18px',
                                    height: '18px',
                                    transform: isExpanded ? 'rotate(0deg)' : 'rotate(180deg)',
                                    transition: 'transform 0.2s',
                                    opacity: 0.7
                                }}
                            />
                        </div>
                    </div>
                </td>
            </tr>
            {isExpanded && hasModels && displayModels.map((model, index) => (
                <ModelRow
                    key={model.id}
                    model={model}
                    index={index}
                    enabledModels={enabledModels}
                    onToggle={onToggle}
                />
            ))}
        </>
    );
});

const AutosSettings: React.FC<AutosSettingsProps> = ({ onBack }) => {
    const { wallets } = useWallets();
    const userAddress = wallets[0]?.address;

    // State
    const [providerModels, setProviderModels] = useState<Record<string, Model[]>>({});
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [inputValue, setInputValue] = useState('');

    useEffect(() => {
        const handler = setTimeout(() => {
            setSearchQuery(inputValue);
        }, 300);
        return () => clearTimeout(handler);
    }, [inputValue]);

    const {
        enabledModels, fetchEnabledModels, toggleModel
    } = useUsageStore();

    useEffect(() => {
        fetchEnabledModels(userAddress);
    }, [userAddress, fetchEnabledModels]);

    const handleToggle = (id: string) => {
        toggleModel(id, userAddress);
    };

    // Tab State: Simplified to just Active vs All
    const [activeTab, setActiveTab] = useState<'active' | 'all'>(() => {
        const saved = localStorage.getItem('autos_settings_active_tab_simple');
        return (saved === 'active' || saved === 'all') ? saved : 'active';
    });

    useEffect(() => {
        localStorage.setItem('autos_settings_active_tab_simple', activeTab);
    }, [activeTab]);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);

    // Initial Load
    useEffect(() => {
        const init = async () => {
            setLoading(true);
            try {
                const allModels = await usageService.getModels();
                const grouped: Record<string, Model[]> = {};
                allModels.forEach((m: Model) => {
                    const parts = m.id.split('/');
                    let p = parts.length > 1 ? parts[0] : 'Other';
                    p = p.charAt(0).toUpperCase() + p.slice(1);
                    if (!grouped[p]) grouped[p] = [];
                    grouped[p].push(m);
                });

                setProviderModels(grouped);
            } catch (err) {
                console.error("Failed to fetch models", err);
            } finally {
                setLoading(false);
            }
        };
        init();
    }, []);

    const handleRefresh = async () => {
        setLoading(true);
        try {
            // Refresh enabled list (localStorage + backend) and models list without hard reload.
            await fetchEnabledModels(userAddress);

            const allModels = await usageService.getModels();
            const grouped: Record<string, Model[]> = {};
            allModels.forEach((m: Model) => {
                const parts = m.id.split('/');
                let p = parts.length > 1 ? parts[0] : 'Other';
                p = p.charAt(0).toUpperCase() + p.slice(1);
                if (!grouped[p]) grouped[p] = [];
                grouped[p].push(m);
            });
            setProviderModels(grouped);
        } catch (err) {
            console.error('Failed to refresh models', err);
        } finally {
            setLoading(false);
        }
    };

    // Filter logic
    const filteredProviderModels = useMemo(() => {
        if (!searchQuery) return providerModels;

        const query = searchQuery.toLowerCase();
        const filtered: Record<string, Model[]> = {};

        Object.entries(providerModels).forEach(([provider, models]) => {
            const matchesProvider = provider.toLowerCase().includes(query);
            const matchingModels = models.filter(m =>
                m.name.toLowerCase().includes(query) ||
                m.id.toLowerCase().includes(query)
            );

            if (matchesProvider || matchingModels.length > 0) {
                filtered[provider] = matchingModels.length > 0 ? matchingModels : models;
            }
        });

        return filtered;
    }, [providerModels, searchQuery]);

    const displayedProviders = useMemo(() => {
        let allKeys = Object.keys(filteredProviderModels);

        const filtered = allKeys.filter(p => {
            if (activeTab === 'active') {
                const models = filteredProviderModels[p] || [];
                const hasActive = models.some(m => enabledModels[m.id]);
                if (!hasActive) return false;
            }
            return true;
        });

        return sortProviderList(filtered);
    }, [filteredProviderModels, activeTab, enabledModels]);

    const totalPages = Math.ceil(displayedProviders.length / itemsPerPage);
    const paginatedProviders = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return displayedProviders.slice(start, start + itemsPerPage);
    }, [displayedProviders, currentPage, itemsPerPage]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, activeTab]);

    const fetchModelsForProvider = async (provider: string) => {
        if (providerModels[provider] && providerModels[provider].length > 0) return;
        try {
            const models = await usageService.getModelsByProvider(provider);
            setProviderModels(prev => ({ ...prev, [provider]: models }));
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className={styles.settingsContainer}>
            {/* Header: Consolidated into one row as requested */}
            <div className={styles.tabsHeader}>
                <div className={styles.backButtonHeader} onClick={onBack} title="Back" style={{ width: '48px', height: '100%', justifyContent: 'center', borderRight: '1px solid #2A1A24', marginRight: 0 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="19" y1="12" x2="5" y2="12"></line>
                        <polyline points="12 19 5 12 12 5"></polyline>
                    </svg>
                </div>
                <div
                    className={`${styles.tab} ${activeTab === 'active' ? styles.active : ''}`}
                    onClick={() => setActiveTab('active')}
                    style={{ minWidth: '130px' }}
                >
                    Active Models
                </div>
                <div
                    className={`${styles.tab} ${activeTab === 'all' ? styles.active : ''}`}
                    onClick={() => setActiveTab('all')}
                    style={{ minWidth: '130px' }}
                >
                    All Models
                </div>
            </div>

            {/* Search Bar */}
            <div className={styles.filterBar} style={{ borderBottom: '1px solid #1A0D15' }}>
                <div className={styles.searchWrapper}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ opacity: 0.3 }}>
                        <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                    <input
                        type="text"
                        className={styles.searchInput}
                        placeholder={activeTab === 'active' ? "Search active models..." : "Search all models..."}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                    />
                </div>
                <button
                    className={styles.refreshButton}
                    onClick={handleRefresh}
                    title="Refresh"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M23 4v6h-6"></path><path d="M1 20v-6h6"></path><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                    </svg>
                </button>
            </div>

            {/* Content Table */}
            <div className={styles.tableWrapper}>
                {loading && !searchQuery && Object.keys(providerModels).length === 0 ? (
                    <div className={styles.loadingContainer}>
                        <div className={styles.spinner}></div>
                        <span>Loading...</span>
                    </div>
                ) : (
                    <table className={styles.table}>
                        <tbody>
                            <tr className={styles.sectionHeaderRow}>
                                <th className={`${styles.th} ${styles.thFirst}`}>Provider / Model</th>
                                <th className={`${styles.th} ${styles.thRight}`}>Enabled</th>
                            </tr>
                            {paginatedProviders.map(provider => {
                                let models = filteredProviderModels[provider] || [];
                                if (activeTab === 'active') {
                                    models = models.filter(m => enabledModels[m.id]);
                                }

                                return (
                                    <ProviderRow
                                        key={provider}
                                        provider={provider}
                                        models={models}
                                        enabledModels={enabledModels}
                                        onToggle={handleToggle}
                                        onExpand={fetchModelsForProvider}
                                        searchQuery={searchQuery}
                                    />
                                );
                            })}
                            {paginatedProviders.length === 0 && (
                                <tr>
                                    <td colSpan={2} style={{ textAlign: 'center', padding: '32px', color: '#5A4A54', fontStyle: 'italic' }}>
                                        {activeTab === 'active' ? 'No active models found.' : 'No models found.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Footer */}
            <div className={styles.footer}>
                <div style={{ color: '#5A4A54', fontSize: '11px' }}>
                    {displayedProviders.length} Providers
                </div>
                <div className={styles.pagination}>
                    <button
                        className={styles.pageButton}
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                    >
                        &lt;
                    </button>
                    <span style={{ fontSize: '11px', color: '#FFE1F2', opacity: 0.8 }}>
                        Page {currentPage} of {Math.max(1, totalPages)}
                    </span>
                    <button
                        className={styles.pageButton}
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages || totalPages === 0}
                    >
                        &gt;
                    </button>
                </div>
                <select
                    className={styles.pageSizeSelect}
                    value={itemsPerPage}
                    onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                    }}
                >
                    {[20, 50, 100].map(size => (
                        <option key={size} value={size}>{size} / page</option>
                    ))}
                </select>
            </div>
        </div>
    );
};

export default AutosSettings;
