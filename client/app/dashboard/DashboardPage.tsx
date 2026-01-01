import React, { useState, useEffect } from 'react';
import { Container, UserState } from '../../types';
import { Activity, X, Copy, Plus, RefreshCw } from 'lucide-react';
import styles from './DashboardPage.module.css';
import { MOCK_SCRIPT_TEMPLATE } from '../../lib/constants';
import { useDataCache } from '../../contexts/DataCacheContext';
import { domainApi, ruleApi, eventApi } from '../../lib/api';
import type { DomainResponse, TrackedEvent } from '../../lib/api/types';
import { EventsChart } from '../../components/dashboard/EventsChart';

interface DashboardPageProps {
    user: UserState;
    container: Container | null;
    setContainer: (c: Container) => void;
    onLogout: () => void;
    domains: DomainResponse[];
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ user, container, setContainer, onLogout, domains }) => {
    const [showModal, setShowModal] = useState(false);
    const [showDomainSwitcher, setShowDomainSwitcher] = useState(false);
    const { patterns, operators, setPatterns, setOperators } = useDataCache();

    // Event state
    const [latestEvents, setLatestEvents] = useState<TrackedEvent[]>([]);
    const [latestRuleEvents, setLatestRuleEvents] = useState<TrackedEvent[]>([]);
    const [loadingEvents, setLoadingEvents] = useState(false);
    const [loadingRuleEvents, setLoadingRuleEvents] = useState(false);

    const [selectedRuleId, setSelectedRuleId] = useState<number | undefined>(undefined);
    const [selectedEvent, setSelectedEvent] = useState<TrackedEvent | null>(null);

    // Fetch master data when dashboard loads
    useEffect(() => {
        const fetchMasterData = async () => {
            try {
                // Only fetch if not already in cache
                const promises = [];

                if (patterns.length === 0) {
                    promises.push(
                        ruleApi.getPatterns().then(data => setPatterns(data))
                    );
                }

                if (operators.length === 0) {
                    promises.push(
                        ruleApi.getOperators().then(data => setOperators(data))
                    );
                }

                if (promises.length > 0) {
                    await Promise.all(promises);
                }
            } catch (error) {
                console.error('Failed to fetch master data:', error);
            }
        };

        fetchMasterData();
    }, [patterns.length, operators.length, setPatterns, setOperators]);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    const generateLoaderScript = () => {
        return MOCK_SCRIPT_TEMPLATE(container);
    };

    const mapDomainToContainer = (domain: DomainResponse): Container => {
        const domainTypeMap: Record<number, any> = {
            1: 'music',
            2: 'movie',
            3: 'news',
            4: 'ecommerce',
            5: 'general',
        };

        return {
            id: domain.Id.toString(),
            uuid: domain.Key,
            name: new URL(domain.Url).hostname,
            url: domain.Url,
            domainType: domainTypeMap[domain.Type] || 'general',
            rules: [],
            outputConfig: {
                displayMethods: [],
            },
        };
    };

    const handleDomainSwitch = async (domain: DomainResponse) => {
        try {
            const newContainer = mapDomainToContainer(domain);
            setContainer(newContainer);
            localStorage.setItem('selectedDomainKey', domain.Key);
            setShowDomainSwitcher(false);
        } catch (error) {
            console.error('Failed to switch domain:', error);
        }
    };

    const handleOpenDomainSwitcher = () => {
        setShowDomainSwitcher(true);
    };

    const fetchLatestEvents = async () => {
        if (!container?.uuid) return;
        setLoadingEvents(true);
        try {
            const events = await eventApi.getLatestByDomain(container.uuid, 10);
            setLatestEvents(events);
        } catch (error) {
            console.error('Failed to fetch domain events:', error);
        } finally {
            setLoadingEvents(false);
        }
    };

    const fetchLatestRuleEvents = async (ruleId: number) => {
        setLoadingRuleEvents(true);
        try {
            const events = await eventApi.getLatestByRule(ruleId, 10);
            setLatestRuleEvents(events);
        } catch (error) {
            console.error('Failed to fetch rule events:', error);
        } finally {
            setLoadingRuleEvents(false);
        }
    };

    // Effect to fetch rule events when selection changes
    useEffect(() => {
        if (selectedRuleId) {
            fetchLatestRuleEvents(selectedRuleId);
        } else {
            setLatestRuleEvents([]);
        }
    }, [selectedRuleId]);

    // Effect to fetch domain events when container changes
    useEffect(() => {
        if (container?.uuid) {
            fetchLatestEvents();
            // Reset rule events when domain changes
            setSelectedRuleId(undefined);
            setLatestRuleEvents([]);
        }
    }, [container?.uuid]);

    const handleRuleSelect = (ruleId: number) => {
        // Toggle selection
        if (selectedRuleId === ruleId) {
            setSelectedRuleId(undefined);
        } else {
            setSelectedRuleId(ruleId);
        }
        setSelectedEvent(null); // Clear event selection when changing rules
    };

    const handleEventClick = (event: TrackedEvent) => {
        setSelectedEvent(event);
    };

    const displayEvents = selectedRuleId ? latestRuleEvents : latestEvents;
    const displayLoading = selectedRuleId ? loadingRuleEvents : loadingEvents;
    const displayTitle = selectedRuleId ? `Events for Rule #${selectedRuleId}` : `Latest Domain Events`;

    return (
        <div className={styles.container}>
            {/* Top Stats / Info */}
            <div className={styles.statsGrid}>
                <div className={styles.gradientCard} onClick={() => setShowModal(true)} style={{ cursor: 'pointer' }}>
                    <p className={styles.cardLabel}>Domain</p>
                    {/* <code className={styles.domainKey}>{container?.uuid.substring(0, 40)}...</code> */}
                    <p className={styles.domainUrl}>{container?.url}</p>
                </div>
                <button className={styles.switchDomainButton} onClick={handleOpenDomainSwitcher}>
                    <RefreshCw size={20} />
                    <span>Switch Domain</span>
                </button>
            </div>

            {/* Domain Switcher Modal */}
            {showDomainSwitcher && (
                <div className={styles.modalOverlay} onClick={() => setShowDomainSwitcher(false)}>
                    <div className={styles.domainSwitcherModal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2>Switch Domain</h2>
                            <button className={styles.closeButton} onClick={() => setShowDomainSwitcher(false)}>
                                <X />
                            </button>
                        </div>
                        <div className={styles.domainSwitcherBody}>
                            <div className={styles.domainGrid}>
                                {domains.map((domain) => {
                                    const domainUrl = new URL(domain.Url);
                                    const hostname = domainUrl.hostname;
                                    const isCurrentDomain = domain.Key === container?.uuid;

                                    return (
                                        <button
                                            key={domain.Id}
                                            onClick={() => !isCurrentDomain && handleDomainSwitch(domain)}
                                            className={`${styles.domainCard} ${isCurrentDomain ? styles.currentDomain : ''}`}
                                            disabled={isCurrentDomain}
                                        >
                                            <div className={styles.domainIconLarge}>
                                                {hostname.charAt(0).toUpperCase()}
                                            </div>
                                            <div className={styles.domainCardContent}>
                                                <h3 className={styles.domainCardTitle}>{hostname}</h3>
                                                <p className={styles.domainCardUrl}>{domain.Url}</p>
                                                <div className={styles.domainCardFooter}>
                                                    <span className={styles.domainCardKey}>Key: {domain.Key.substring(0, 8)}...</span>
                                                    <span className={styles.domainCardDate}>
                                                        {new Date(domain.CreatedAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                {isCurrentDomain && (
                                                    <div className={styles.currentBadge}>Current</div>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal for Domain Details */}
            {showModal && (
                <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2>Domain Details</h2>
                            <button className={styles.closeButton} onClick={() => setShowModal(false)}>
                                <X />
                            </button>
                        </div>
                        <div className={styles.modalBody}>
                            <div className={styles.detailSection}>
                                <h3>Domain Information</h3>
                                <div className={styles.detailItem}>
                                    <label>Domain Key:</label>
                                    <div className={styles.copyContainer}>
                                        <code>{container?.uuid}</code>
                                        <button
                                            className={styles.copyButton}
                                            onClick={() => copyToClipboard(container?.uuid || '')}
                                            title="Copy to clipboard"
                                        >
                                            <Copy size={16} />
                                        </button>
                                    </div>
                                </div>
                                <div className={styles.detailItem}>
                                    <label>Domain URL:</label>
                                    <div className={styles.copyContainer}>
                                        <code>{container?.url}</code>
                                        <button
                                            className={styles.copyButton}
                                            onClick={() => copyToClipboard(container?.url || '')}
                                            title="Copy to clipboard"
                                        >
                                            <Copy size={16} />
                                        </button>
                                    </div>
                                </div>
                                <div className={styles.detailItem}>
                                    <label>Domain Type:</label>
                                    <span className={styles.domainType}>{container?.domainType}</span>
                                </div>
                            </div>
                            <div className={styles.detailSection}>
                                <h3>Loader Script</h3>
                                <div className={styles.scriptContainer}>
                                    <pre className={styles.scriptCode}>{generateLoaderScript()}</pre>
                                    <button
                                        className={styles.copyButtonLarge}
                                        onClick={() => copyToClipboard(generateLoaderScript())}
                                    >
                                        <Copy size={16} /> Copy Script
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Event Visualizations */}
            <div className={styles.visualizationSection}>                
                {/* Domain Events Chart */}
                <EventsChart
                    events={latestEvents}
                    loading={loadingEvents}
                    onRefresh={fetchLatestEvents}
                    title="Latest Domain Events (Last 10)"
                    selectedRuleId={selectedRuleId}
                    onRuleSelect={handleRuleSelect}
                />

                {/* Rule-Specific Events Chart */}
                {selectedRuleId && (
                    <EventsChart
                        events={latestRuleEvents}
                        loading={loadingRuleEvents}
                        onRefresh={() => fetchLatestRuleEvents(selectedRuleId)}
                        title={`Events for Rule #${selectedRuleId} (Last 10)`}
                    />
                )}
            </div>

        </div>
    );
};
