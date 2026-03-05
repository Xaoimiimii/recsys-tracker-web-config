import React, { useState, useEffect } from 'react';
import { Container, UserState } from '../../types';
import { X, Copy, RefreshCw } from 'lucide-react';
import styles from './DashboardPage.module.css';
import { MOCK_SCRIPT_TEMPLATE } from '../../lib/constants';
import { useDataCache } from '../../contexts/DataCacheContext';
import { ruleApi, eventApi } from '../../lib/api';
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

    // Event state
    const [latestEvents, setLatestEvents] = useState<TrackedEvent[]>([]);
    const [loadingEvents, setLoadingEvents] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [eventsPerPage] = useState(10);

    const [selectedRuleId, setSelectedRuleId] = useState<number | undefined>(undefined);
    const [selectedEvent, setSelectedEvent] = useState<TrackedEvent | null>(null);

    // Get cache context
    const { getRulesByDomain, setRulesByDomain } = useDataCache();

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    const generateLoaderScript = () => {
        return MOCK_SCRIPT_TEMPLATE(container);
    };

    const mapDomainToContainer = (domain: DomainResponse): Container => {
        const domainTypeMap: Record<number, any> = {
            1: 'Music Streaming',
            2: 'Movies & Video',
            3: 'E-Commerce',
            4: 'News & Media',
            5: 'General',
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

    const fetchLatestEvents = async (page: number = currentPage, ruleId?: number) => {
        if (!container?.uuid) return;
        setLoadingEvents(true);
        try {
            const events = await eventApi.getLatestByDomain(container.uuid, eventsPerPage, page, ruleId);
            setLatestEvents(events);
        } catch (error) {
            console.error('Failed to fetch domain events:', error);
        } finally {
            setLoadingEvents(false);
        }
    };

    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
        fetchLatestEvents(newPage, selectedRuleId);
    };

    const handleRuleSelect = (ruleId: number) => {
        // If ruleId is 0, clear the filter
        if (ruleId === 0) {
            setSelectedRuleId(undefined);
            setCurrentPage(1);
            fetchLatestEvents(1, undefined);
        } else {
            // Toggle selection
            if (selectedRuleId === ruleId) {
                setSelectedRuleId(undefined);
                setCurrentPage(1);
                fetchLatestEvents(1, undefined);
            } else {
                setSelectedRuleId(ruleId);
                setCurrentPage(1);
                fetchLatestEvents(1, ruleId);
            }
        }
        setSelectedEvent(null); // Clear event selection when changing rules
    };

    // Fetch and cache rules for the domain
    const fetchAndCacheRules = async (domainKey: string) => {
        // Check cache first
        const cachedRules = getRulesByDomain(domainKey);
        if (cachedRules) {
            return;
        }

        try {
            const rulesData = await ruleApi.getRulesByDomain(domainKey);
            setRulesByDomain(domainKey, rulesData);
        } catch (error) {
            console.error('Failed to fetch and cache rules:', error);
        }
    };

    // Effect to fetch domain events and rules when container changes
    useEffect(() => {
        if (container?.uuid) {
            // Reset all filters and pagination when domain changes
            setSelectedRuleId(undefined);
            setCurrentPage(1);
            fetchLatestEvents(1, undefined);
            
            // Fetch and cache rules for filter dropdown
            fetchAndCacheRules(container.uuid);
        }
    }, [container?.uuid]);

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
                {/* Domain Events Chart with Pagination and Filtering */}
                <EventsChart
                    events={latestEvents}
                    loading={loadingEvents}
                    onRefresh={() => fetchLatestEvents(currentPage, selectedRuleId)}
                    title={selectedRuleId ? `Events for Rule #${selectedRuleId}` : "Latest Domain Events"}
                    selectedRuleId={selectedRuleId}
                    onRuleSelect={handleRuleSelect}
                    domainType={container?.domainType}
                    currentPage={currentPage}
                    onPageChange={handlePageChange}
                    eventsPerPage={eventsPerPage}
                    allRules={container?.uuid ? getRulesByDomain(container.uuid) || undefined : undefined}
                />
            </div>

        </div>
    );
};
