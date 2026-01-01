import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ZAxis } from 'recharts';
import { TrackedEvent } from '../../lib/api/types';
import { RefreshCw } from 'lucide-react';
import styles from './EventsChart.module.css';

interface EventsChartProps {
    events: TrackedEvent[];
    loading: boolean;
    onRefresh: () => void;
    title: string;
    selectedRuleId?: number;
    onRuleSelect?: (ruleId: number) => void;
}

// Generate distinct colors for different tracking rules
const RULE_COLORS = [
    '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#a4de6c',
    '#d084d0', '#8dd1e1', '#ffb347', '#ba55d3', '#20b2aa'
];

export const EventsChart: React.FC<EventsChartProps> = ({
    events,
    loading,
    onRefresh,
    title,
    selectedRuleId,
    onRuleSelect
}) => {
    // Group events by rule ID
    const ruleIds = [...new Set(events.map(e => e.TrackingRuleId))].sort((a, b) => (a as number) - (b as number));
    const ruleColorMap = new Map<number, string>();
    ruleIds.forEach((id, index) => {
        ruleColorMap.set(id as number, RULE_COLORS[index % RULE_COLORS.length]);
    });

    // Transform events into chart data for scatter plot
    const chartData = events
        .sort((a, b) => new Date(a.Timestamp).getTime() - new Date(b.Timestamp).getTime())
        .map((event, index) => ({
            x: index, // Index for X-axis positioning
            y: event.TrackingRuleId, // Rule ID on Y-axis
            timestamp: new Date(event.Timestamp).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            }),
            eventId: event.Id,
            ruleId: event.TrackingRuleId,
            user: event.UserValue,
            item: event.ItemValue,
            eventType: event.EventTypeId,
            fullTimestamp: new Date(event.Timestamp).toLocaleString(),
            timestampMs: new Date(event.Timestamp).getTime()
        }));

    // Group data by rule for scatter plot
    const dataByRule = new Map<number, any[]>();
    chartData.forEach(point => {
        if (!dataByRule.has(point.ruleId)) {
            dataByRule.set(point.ruleId, []);
        }
        dataByRule.get(point.ruleId)!.push(point);
    });

    // Custom tooltip
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className={styles.customTooltip}>
                    <p className={styles.tooltipLabel}>Event #{data.eventId}</p>
                    <p className={styles.tooltipItem}>Rule ID: {data.ruleId}</p>
                    <p className={styles.tooltipItem}>Time: {data.fullTimestamp}</p>
                    <p className={styles.tooltipItem}>User: {data.user}</p>
                    <p className={styles.tooltipItem}>Item: {data.item}</p>
                    <p className={styles.tooltipItem}>Type: {data.eventType}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className={styles.chartContainer}>
            <div className={styles.chartHeader}>
                <h3 className={styles.chartTitle}>{title}</h3>
                <button 
                    className={styles.refreshButton} 
                    onClick={onRefresh}
                    disabled={loading}
                    title="Refresh data"
                >
                    <RefreshCw className={loading ? styles.spinning : ''} size={18} />
                </button>
            </div>

            {loading ? (
                <div className={styles.loadingContainer}>
                    <RefreshCw className={styles.spinning} size={32} />
                    <p>Loading events...</p>
                </div>
            ) : events.length === 0 ? (
                <div className={styles.emptyState}>
                    <p>No events found</p>
                </div>
            ) : (
<>
                    <ResponsiveContainer width="100%" height={400}>
                        <ScatterChart
                            margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                                type="number"
                                dataKey="x"
                                name="Time"
                                label={{ value: 'Timeline', position: 'insideBottom', offset: -10 }}
                                tick={{ fontSize: 12 }}
                                tickFormatter={(value) => {
                                    const event = chartData[value];
                                    return event ? event.timestamp : '';
                                }}
                            />
                            <YAxis 
                                type="number"
                                dataKey="y"
                                name="Rule ID"
                                label={{ value: 'Tracking Rule ID', angle: -90, position: 'insideLeft' }}
                                tick={{ fontSize: 12 }}
                                domain={['dataMin - 0.5', 'dataMax + 0.5']}
                                allowDecimals={false}
                            />
                            <ZAxis range={[100, 100]} />
                            <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                            <Legend />
                            {ruleIds.map(ruleId => (
                                <Scatter
                                    key={ruleId as number}
                                    name={`Rule #${ruleId}`}
                                    data={dataByRule.get(ruleId as number)}
                                    fill={ruleColorMap.get(ruleId as number)}
                                    shape="circle"
                                />
                            ))}
                        </ScatterChart>
                    </ResponsiveContainer>

                    {onRuleSelect && (
                        <div className={styles.ruleSelector}>
                            <p className={styles.ruleSelectorLabel}>Click to filter by rule:</p>
                            <div className={styles.ruleBadges}>
                                {ruleIds.map(ruleId => (
                                    <button
                                        key={ruleId as number}
                                        className={`${styles.ruleBadge} ${selectedRuleId === ruleId ? styles.selected : ''}`}
                                        style={{ 
                                            backgroundColor: ruleColorMap.get(ruleId as number),
                                            opacity: selectedRuleId === ruleId ? 1 : 0.7
                                        }}
                                        onClick={() => onRuleSelect(ruleId as number)}
                                    >
                                        Rule #{ruleId}
                                        <span className={styles.eventCount}>
                                            ({dataByRule.get(ruleId as number)?.length || 0} events)
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};
