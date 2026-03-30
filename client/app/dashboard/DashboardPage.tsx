import React, { useState, useEffect } from 'react';
import { Container, UserState } from '../../types';
import { X, Copy, RefreshCw, Download } from 'lucide-react';
import styles from './DashboardPage.module.css';
import { MOCK_SCRIPT_TEMPLATE } from '../../lib/constants';
import { useDataCache } from '../../contexts/DataCacheContext';
import { ruleApi, eventApi } from '../../lib/api';
import type { ActiveUserCountResponse, DomainResponse, InteractionTypeCountResponse, TrackedEvent } from '../../lib/api/types';
import { EventsChart } from '../../components/dashboard/EventsChart';
import { InteractionTypeChart } from '../../components/dashboard/InteractionTypeChart';

interface DashboardPageProps {
    user: UserState;
    container: Container | null;
    setContainer: (c: Container) => void;
    onLogout: () => void;
    domains: DomainResponse[];
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ user, container, setContainer, onLogout, domains }) => {
    const ACTIVE_USER_WINDOW_OPTIONS = [5, 15, 30, 60, 180];

    const [showModal, setShowModal] = useState(false);
    const [showDomainSwitcher, setShowDomainSwitcher] = useState(false);

    // Event state
    const [latestEvents, setLatestEvents] = useState<TrackedEvent[]>([]);
    const [loadingEvents, setLoadingEvents] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [eventsPerPage] = useState(10);

    const [selectedRuleId, setSelectedRuleId] = useState<number | undefined>(undefined);
    const [selectedEvent, setSelectedEvent] = useState<TrackedEvent | null>(null);

    const [activeUsersSummary, setActiveUsersSummary] = useState<ActiveUserCountResponse | null>(null);
    const [loadingActiveUsers, setLoadingActiveUsers] = useState(false);
    const [activeUsersError, setActiveUsersError] = useState<string | null>(null);
    const [activeWindowMode, setActiveWindowMode] = useState<string>('30');
    const [customActiveMinutes, setCustomActiveMinutes] = useState<string>('30');

    const [interactionSummary, setInteractionSummary] = useState<InteractionTypeCountResponse | null>(null);
    const [loadingInteractionSummary, setLoadingInteractionSummary] = useState(false);
    const [interactionSummaryError, setInteractionSummaryError] = useState<string | null>(null);

    const [exportingEvents, setExportingEvents] = useState(false);
    const [exportError, setExportError] = useState<string | null>(null);

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

    const getSelectedMinutes = (): number | null => {
        const minutes = activeWindowMode === 'custom'
            ? Number(customActiveMinutes)
            : Number(activeWindowMode);

        if (!Number.isInteger(minutes) || minutes <= 0) {
            return null;
        }

        return minutes;
    };

    const fetchActiveUsersSummary = async (minutes: number) => {
        if (!container?.uuid) return;

        setLoadingActiveUsers(true);
        setActiveUsersError(null);

        try {
            const summary = await eventApi.getActiveUsersCount(container.uuid, minutes);
            setActiveUsersSummary(summary);
        } catch (error) {
            console.error('Failed to fetch active users summary:', error);
            setActiveUsersError('Could not load active users. Please try again.');
        } finally {
            setLoadingActiveUsers(false);
        }
    };

    const fetchInteractionSummary = async () => {
        if (!container?.uuid) return;

        setLoadingInteractionSummary(true);
        setInteractionSummaryError(null);

        try {
            const summary = await eventApi.getInteractionTypeCounts(container.uuid);
            setInteractionSummary(summary);
        } catch (error) {
            console.error('Failed to fetch interaction summary:', error);
            setInteractionSummaryError('Could not load interaction summary. Please try again.');
        } finally {
            setLoadingInteractionSummary(false);
        }
    };

    const handleRefreshActiveUsers = async () => {
        const minutes = getSelectedMinutes();

        if (minutes === null) {
            setActiveUsersError('Minutes must be a positive integer.');
            return;
        }

        await fetchActiveUsersSummary(minutes);
    };

    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
        fetchLatestEvents(newPage, selectedRuleId);
    };

    const handleExportEvents = async () => {
        if (!container?.uuid) return;

        setExportError(null);
        setExportingEvents(true);

        try {
            const result = await eventApi.exportDomainEvents(container.uuid, selectedRuleId);
            const safeDomainKey = container.uuid.slice(0, 8);
            const ruleSuffix = selectedRuleId ? `-rule-${selectedRuleId}` : '';
            const fallbackName = `events-${safeDomainKey}${ruleSuffix}.xlsx`;
            const filename = result.filename || fallbackName;

            const downloadUrl = URL.createObjectURL(result.blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(downloadUrl);
        } catch (error) {
            console.error('Failed to export events:', error);
            setExportError('Could not export events. Please try again.');
        } finally {
            setExportingEvents(false);
        }
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
            setExportError(null);
            setExportingEvents(false);
            
            // Fetch and cache rules for filter dropdown
            fetchAndCacheRules(container.uuid);

            const minutes = getSelectedMinutes();
            if (minutes !== null) {
                fetchActiveUsersSummary(minutes);
            }

            fetchInteractionSummary();
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
                                            title="seCopy to clipboard"
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
                <div className={styles.activeUsersWidget}>
                    <div className={styles.activeUsersHeader}>
                        <div>
                            <h3 className={styles.activeUsersTitle}>Active Users</h3>
                            <p className={styles.activeUsersSubtitle}>Count in the last selected minutes.</p>
                        </div>
                        <button
                            type="button"
                            className={styles.activeUsersRefreshButton}
                            onClick={handleRefreshActiveUsers}
                            disabled={loadingActiveUsers || !container?.uuid}
                        >
                            <RefreshCw className={loadingActiveUsers ? styles.activeUsersSpinning : ''} size={16} />
                            {/* <span>Refresh</span> */}
                        </button>
                    </div>

                    <div className={styles.activeUsersControls}>
                        <label className={styles.activeUsersLabel}>Window</label>
                        <select
                            className={styles.activeUsersSelect}
                            value={activeWindowMode}
                            onChange={(e) => setActiveWindowMode(e.target.value)}
                            disabled={loadingActiveUsers}
                        >
                            {ACTIVE_USER_WINDOW_OPTIONS.map((minutes) => (
                                <option key={minutes} value={minutes.toString()}>{minutes} minutes</option>
                            ))}
                            <option value="custom">Custom</option>
                        </select>

                        {activeWindowMode === 'custom' && (
                            <input
                                type="number"
                                min={1}
                                className={styles.activeUsersInput}
                                value={customActiveMinutes}
                                onChange={(e) => setCustomActiveMinutes(e.target.value)}
                                placeholder="Enter minutes"
                                disabled={loadingActiveUsers}
                            />
                        )}
                    </div>

                    {activeUsersError && <p className={styles.activeUsersError}>{activeUsersError}</p>}

                    <div className={styles.activeUsersStats}>
                        <div className={styles.activeUsersStatCard}>
                            <span className={styles.activeUsersStatLabel}>Total Active</span>
                            <strong className={styles.activeUsersStatValue}>{activeUsersSummary?.activeUsers ?? '-'}</strong>
                        </div>
                        <div className={styles.activeUsersStatCard}>
                            <span className={styles.activeUsersStatLabel}>Authenticated</span>
                            <strong className={styles.activeUsersStatValue}>{activeUsersSummary?.authenticatedUsers ?? '-'}</strong>
                        </div>
                        <div className={styles.activeUsersStatCard}>
                            <span className={styles.activeUsersStatLabel}>Anonymous</span>
                            <strong className={styles.activeUsersStatValue}>{activeUsersSummary?.anonymousUsers ?? '-'}</strong>
                        </div>
                    </div>
                </div>

                <InteractionTypeChart
                    data={interactionSummary?.breakdown ?? []}
                    totalEvents={interactionSummary?.totalEvents}
                    loading={loadingInteractionSummary}
                    onRefresh={fetchInteractionSummary}
                    title="Interaction Types"
                    domainType={container?.domainType}
                />

                {interactionSummaryError && (
                    <p className={styles.activeUsersError}>{interactionSummaryError}</p>
                )}

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
                    bottomRightContent={(
                        <div className={styles.exportControls}>
                            <button
                                type="button"
                                className={styles.exportButton}
                                onClick={handleExportEvents}
                                disabled={!container?.uuid || exportingEvents}
                            >
                                <Download size={16} />
                                {exportingEvents ? 'Exporting...' : 'Export Events'}
                            </button>
                            {exportError && (
                                <span className={styles.exportError}>{exportError}</span>
                            )}
                        </div>
                    )}
                />
            </div>

        </div>
    );
};
