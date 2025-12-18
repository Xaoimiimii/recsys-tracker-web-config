import React, { useState } from 'react';
import { Container, UserState } from '../../types';
import { Activity, X, Copy } from 'lucide-react';
import styles from './DashboardPage.module.css';
import { MOCK_SCRIPT_TEMPLATE } from '../../lib/constants';

interface DashboardPageProps {
    user: UserState;
    container: Container | null;
    setContainer: (c: Container) => void;
    onLogout: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ user, container, setContainer, onLogout }) => {
    const [showModal, setShowModal] = useState(false);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    const generateLoaderScript = () => {
        return MOCK_SCRIPT_TEMPLATE(container);
    };

    // Mock data for behavior tracking chart
    const generateMockData = () => {
        const days = 7;
        const data = [];
        for (let i = 0; i < days; i++) {
            const point: any = { day: `Day ${i + 1}` };
            container?.rules.forEach((rule, idx) => {
                point[rule.name] = Math.floor(Math.random() * 100) + 20;
            });
            data.push(point);
        }
        return data;
    };

    const mockChartData = generateMockData();
    const colors = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];

    return (
        <div className={styles.container}>
            {/* Top Stats / Info */}
            <div className={styles.statsGrid}>
                <div className={styles.gradientCard} onClick={() => setShowModal(true)} style={{ cursor: 'pointer' }}>
                    <p className={styles.cardLabel}>Domain Key</p>
                    {/* <code className={styles.domainKey}>{container?.uuid.substring(0, 40)}...</code> */}
                    <p className={styles.domainUrl}>{container?.url}</p>
                </div>
            </div>

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

            {/* Behavior Tracking Chart */}
            <div className={styles.overviewCard}>
                    <h3 className={styles.chartTitle}>Tracked Behavior Over Time</h3>
                    {container?.rules.length === 0 ? (
                        <div className={styles.emptyState}>
                            <Activity className={styles.emptyIcon} />
                            <p>No tracking data available. Add rules to start tracking.</p>
                        </div>
                    ) : (
                        <div className={styles.chartContainer}>
                            <div className={styles.chartLegend}>
                                {container?.rules.map((rule, idx) => (
                                    <div key={rule.id} className={styles.legendItem}>
                                        <div 
                                            className={styles.legendColor} 
                                            style={{ backgroundColor: colors[idx % colors.length] }}
                                        />
                                        <span>{rule.name}</span>
                                    </div>
                                ))}
                            </div>
                            <div className={styles.chart}>
                                <div className={styles.chartYAxis}>
                                    <span>100</span>
                                    <span>75</span>
                                    <span>50</span>
                                    <span>25</span>
                                    <span>0</span>
                                </div>
                                <div className={styles.chartArea}>
                                    <svg width="100%" height="300" viewBox="0 0 700 300" preserveAspectRatio="none">
                                        {container?.rules.map((rule, idx) => {
                                            const points = mockChartData.map((d, i) => {
                                                const x = (i / (mockChartData.length - 1)) * 700;
                                                const y = 300 - (d[rule.name] / 100) * 300;
                                                return `${x},${y}`;
                                            }).join(' ');
                                            return (
                                                <polyline
                                                    key={rule.id}
                                                    points={points}
                                                    fill="none"
                                                    stroke={colors[idx % colors.length]}
                                                    strokeWidth="3"
                                                    strokeLinejoin="round"
                                                />
                                            );
                                        })}
                                    </svg>
                                    <div className={styles.chartXAxis}>
                                        {mockChartData.map((d, i) => (
                                            <span key={i}>{d.day}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
        </div>
    );
};
