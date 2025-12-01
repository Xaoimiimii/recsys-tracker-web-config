import React from 'react';
import { Container, UserState } from '../../types';
import { Check, Globe, Activity } from 'lucide-react';
import styles from './DashboardPage.module.css';

interface DashboardPageProps {
    user: UserState;
    container: Container | null;
    setContainer: (c: Container) => void;
    onLogout: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ user, container, setContainer, onLogout }) => {

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
                <div className={styles.gradientCard}>
                    <p className={styles.cardLabel}>Domain Key</p>
                    <code className={styles.domainKey}>{container?.uuid.split('-')[0]}...</code>
                    <p className={styles.domainUrl}>{container?.url}</p>
                </div>
                <div className={styles.whiteCard}>
                    <div className={styles.cardContent}>
                        <p className={styles.cardLabelGray}>Active Rules</p>
                        <p className={styles.cardValue}>{container?.rules.length}</p>
                    </div>
                    <div className={styles.iconCircleGreen}>
                        <Check className="w-6 h-6" />
                    </div>
                </div>
                <div className={styles.whiteCard}>
                    <div className={styles.cardContent}>
                        <p className={styles.cardLabelGray}>Configuration Mode</p>
                        <p className={styles.cardValueSmall}>{container?.domainType}</p>
                    </div>
                    <div className={styles.iconCircleBlue}>
                        <Globe className="w-6 h-6" />
                    </div>
                </div>
            </div>

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
