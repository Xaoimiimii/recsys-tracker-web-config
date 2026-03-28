import React, { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { RefreshCw } from 'lucide-react';
import type { InteractionTypeCountItem } from '../../lib/api/types';
import styles from './InteractionTypeChart.module.css';

interface InteractionTypeChartProps {
    data: InteractionTypeCountItem[];
    totalEvents?: number;
    loading: boolean;
    onRefresh: () => void;
    title: string;
    domainType?: string;
}

const DOMAIN_ACTION_LABELS: Record<string, Record<string, string>> = {
    'Music Streaming': {
        View: 'Play song',
        AddToFavorite: 'Add song to favorite',
        AddToWishlist: 'Add song to playlist',
        AddToCart: 'Download song',
        Purchase: 'Buy/Unlock song',
    },
    'Movies & Video': {
        View: 'Play video',
        AddToFavorite: 'Add video to favorite',
        AddToWishlist: 'Add video to watchlist / watch later',
        AddToCart: 'Download video',
        Purchase: 'Buy/Unlock video',
    },
    'E-Commerce': {
        View: 'View product',
        AddToFavorite: 'Add product to favorite',
        AddToWishlist: 'Add product to wishlist',
        AddToCart: 'Add product to cart',
        Purchase: 'Purchase / Checkout',
    },
    'News & Media': {
        View: 'View article',
        AddToFavorite: 'Save/Bookmark article',
        AddToWishlist: 'Add to read later',
        AddToCart: 'Download article',
        Purchase: 'Buy/Unlock paywall',
    },
    'General': {
        View: 'View',
        AddToFavorite: 'Add to favorite',
        AddToWishlist: 'Add to wishlist',
        AddToCart: 'Add to cart',
        Purchase: 'Purchase / Checkout',
    },
};

const BAR_COLORS = ['#82ca9d', '#ffc658', '#ff7c7c', '#8884d8', '#8dd1e1', 
    '#d084d0', '#a4de6c', '#ffb347', '#ba55d3', '#20b2aa'];

const resolveInteractionLabel = (interactionType: string, domainType: string): string => {
    if (interactionType === 'Rating' || interactionType === 'Review') {
        return interactionType;
    }

    if (interactionType.startsWith('EventType:')) {
        return `Other (${interactionType})`;
    }

    const mapping = DOMAIN_ACTION_LABELS[domainType] || DOMAIN_ACTION_LABELS.General;
    return mapping[interactionType] || interactionType;
};

export const InteractionTypeChart: React.FC<InteractionTypeChartProps> = ({
    data,
    totalEvents,
    loading,
    onRefresh,
    title,
    domainType = 'General',
}) => {
    const normalizedDomainType = domainType.toLowerCase() === 'general' ? 'General' : domainType;
    const chartData = useMemo(() => {
        return [...data]
            .sort((a, b) => b.count - a.count)
            .map((item, index) => ({
                name: resolveInteractionLabel(item.interactionType, normalizedDomainType),
                count: item.count,
                color: BAR_COLORS[index % BAR_COLORS.length],
            }));
    }, [data, normalizedDomainType]);

    return (
        <div className={styles.chartCard}>
            <div className={styles.header}>
                <div className={styles.titleGroup}>
                    <h3 className={styles.title}>{title}</h3>
                    <p className={styles.subtitle}>
                        {totalEvents !== undefined ? `Total events: ${totalEvents}` : 'Total events: -'}
                    </p>
                </div>
                <button
                    type="button"
                    className={styles.refreshButton}
                    onClick={onRefresh}
                    disabled={loading}
                    title="Refresh data"
                >
                    <RefreshCw className={loading ? styles.spinning : ''} size={18} />
                </button>
            </div>

            {chartData.length === 0 ? (
                <div className={styles.emptyState}>No interaction data</div>
            ) : (
                <div className={styles.chartWrapper}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" tick={{ fontSize: 12 }} />
                            <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12 }} />
                            <Tooltip
                                formatter={(value: number) => [`${value}`, 'Events']}
                                cursor={{ fill: 'rgba(0, 0, 0, 0.04)' }}
                            />
                            <Bar dataKey="count" radius={[6, 6, 6, 6]}>
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}

            {chartData.length > 0 && (
                <div className={styles.legend}>
                    {chartData.map((item, index) => (
                        <span key={item.name} className={styles.legendItem}>
                            <span className={styles.legendSwatch} style={{ background: item.color }} />
                            {item.name}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
};
