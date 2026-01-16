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

const EVENT_TYPE_MAP: { [key: number]: string } = {
    1: 'Click',
    2: 'Rating',
    3: 'Review',
    4: 'Scroll',
    5: 'Page View'
};

function getEventTypeName(eventTypeId: number): string {
    return EVENT_TYPE_MAP[eventTypeId] || 'Unknown';
}

export const EventsChart: React.FC<EventsChartProps> = ({
    events,
    loading,
    onRefresh,
    title,
    selectedRuleId,
    onRuleSelect
}) => {
    // Group events by rule ID
    const ruleIds = [...new Set(events.map(e => e.TrackingRule.Id))].sort((a, b) => (a as number) - (b as number));
    const ruleColorMap = new Map<number, string>();
    const ruleNameMap = new Map<number, string>();
    const ruleIdToIndex = new Map<number, number>();
    const indexToRuleName = new Map<number, string>();
    
    ruleIds.forEach((id, index) => {
        ruleColorMap.set(id as number, RULE_COLORS[index % RULE_COLORS.length]);
        ruleIdToIndex.set(id as number, index);
        const event = events.find(e => e.TrackingRule.Id === id);
        if (event) {
            ruleNameMap.set(id as number, event.TrackingRule.Name);
            indexToRuleName.set(index, event.TrackingRule.Name);
        }
    });

    // Transform events into chart data for scatter plot
    const chartData = [...events]
        .sort((a, b) => new Date(a.Timestamp).getTime() - new Date(b.Timestamp).getTime())
        .map((event, index) => ({
            x: index, // Index for X-axis positioning
            y: ruleIdToIndex.get(event.TrackingRule.Id) ?? 0, // Sequential index for Y-axis
            timestamp: new Date(event.Timestamp).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            }),
            eventId: event.Id,
            ruleId: event.TrackingRule.Id,
            ruleName: event.TrackingRule.Name,
            userId: event.UserId,
            anonymousId: event.AnonymousId,
            item: event.ItemValue,
            eventType: event.EventTypeId,
            ratingValue: event.RatingValue,
            reviewValue: event.ReviewValue,
            fullTimestamp: new Date(event.Timestamp).toLocaleString(),
            timestampMs: new Date(event.Timestamp).getTime()
        }));

    // Group data by rule for scatter plot
    const dataByRule = new Map<number, any[]>();
    chartData.forEach(point => {
        if (!dataByRule.has(point.y)) {
            dataByRule.set(point.y, []);
        }
        dataByRule.get(point.y)!.push(point);
    });

    // Custom tooltip
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className={styles.customTooltip}>
                    <p className={styles.tooltipLabel}>Event #{data.eventId}</p>
                    <p className={styles.tooltipItem}>Rule name: {data.ruleName}</p>
                    <p className={styles.tooltipItem}>Event type: {getEventTypeName(data.eventType)}</p>
                    <p className={styles.tooltipItem}>Item: {data.item}</p>
                    <p className={styles.tooltipItem}>User ID: {data.userId}</p>
                    <p className={styles.tooltipItem}>Anonymous ID: {data.anonymousId}</p>
                    
                    {data.eventType === 2 && data.ratingValue !== null && (
                        <p className={styles.tooltipItem}>Rating: {data.ratingValue}</p>
                    )}
                    {data.eventType === 3 && data.reviewValue !== null && (
                        <p className={styles.tooltipItem}>Review: {data.reviewValue}</p>
                    )}
                    <p className={styles.tooltipItem}>Timestamp: {data.fullTimestamp}</p>
                    
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
                                label={{ 
                                    value: 'Timeline', 
                                    fontSize: 14,
                                    position: 'insideBottom', 
                                    offset: -10 }}
                                tick={{ fontSize: 12 }}
                                tickFormatter={(value) => {
                                    const event = chartData[value];
                                    return event ? event.timestamp : '';
                                }}
                            />
                            <YAxis 
                                type="number"
                                dataKey="y"
                                name="Rule"
                                label={{ 
                                    value: 'Tracking Rule', 
                                    fontSize: 14,
                                    angle: -90, 
                                    dx: -20,
                                    dy: 40,
                                    position: 'insideLeft' }}
                                tick={{ fontSize: 12 }}
                                tickFormatter={(value) => {
                                    return indexToRuleName.get(value) || '';
                                }}
                                ticks={Array.from({length: ruleIds.length}, (_, i) => i)}
                                domain={[-0.5, ruleIds.length - 0.5]}
                                allowDecimals={false}
                            />
                            <ZAxis range={[100, 100]} />
                            <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                            <Legend 
                                wrapperStyle={{
                                    paddingTop: "20px",
                                    paddingLeft: "10px",
                                    fontSize: "14px"
                                }}
                             />
                            {ruleIds.map((ruleId, index) => (
                                <Scatter
                                    key={ruleId as number}
                                    name={ruleNameMap.get(ruleId as number) || `Rule #${ruleId}`}
                                    data={dataByRule.get(index)}
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
                                        {ruleNameMap.get(ruleId as number) || `Rule #${ruleId}`}
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
