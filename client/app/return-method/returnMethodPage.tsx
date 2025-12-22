import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Container } from '../../types';
import { Plus, Eye, Edit2, Trash2 } from 'lucide-react';
import styles from './returnMethodPage.module.css';
import { DisplayConfiguration, DisplayType } from './types';
import { returnMethodApi } from '../../lib/api/return-method';
import type { ReturnMethodResponse } from '../../lib/api/types';

interface ReturnMethodPageProps {
    container: Container | null;
    setContainer: (c: Container) => void;
}

export const ReturnMethodPage: React.FC<ReturnMethodPageProps> = ({ container }) => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [configurations, setConfigurations] = useState<DisplayConfiguration[]>([]);
    const [filterType, setFilterType] = useState<DisplayType | 'all'>('all');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch return methods from API
    useEffect(() => {
        const fetchReturnMethods = async () => {
            if (!container?.uuid) {
                setError('No domain selected');
                return;
            }

            setIsLoading(true);
            setError(null);

            try {
                const response = await returnMethodApi.getByDomainKey(container.uuid);
                
                // Transform API response to DisplayConfiguration format
                const transformedConfigs: DisplayConfiguration[] = response.map((item, index) => {
                    // Determine display type based on ReturnMethodID or Value
                    const displayType: DisplayType = item.Value === 'popup' ? 'popup' : 'custom-widget';
                    
                    const config: DisplayConfiguration = {
                        id: `${item.DomainID}-${index}`,
                        configurationName: item.ConfigurationName,
                        displayType,
                        operator: item.Operator,
                        value: item.Value,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                    };

                    if (displayType !== 'popup') {
                        config.widgetDesign = {
                            layout: 'grid',
                            theme: 'light',
                            spacing: 'medium',
                            size: 'medium'
                        };
                    }

                    return config;
                });

                setConfigurations(transformedConfigs);
            } catch (err) {
                console.error('Failed to fetch return methods:', err);
                setError('Failed to load return methods. Please try again.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchReturnMethods();
    }, [container?.uuid]);

    const filteredConfigurations = configurations.filter(config => {
        const typeMatch = filterType === 'all' || config.displayType === filterType;
        return typeMatch;
    });

    const handleCreateNew = () => {
        navigate('/dashboard/recommendation-display/create');
    };

    const handleView = (id: string) => {
        navigate(`/dashboard/recommendation-display/view/${id}`);
    };

    const handleEdit = (id: string) => {
        navigate(`/dashboard/recommendation-display/edit/${id}`);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this configuration?')) {
            setConfigurations(prev => prev.filter(config => config.id !== id));
        }
    };

    const getSummary = (config: DisplayConfiguration): string => {
        if (config.displayType === 'custom-widget') {
            return `${config.operator} ${config.value}`;
        } else if (config.displayType === 'popup') {
            return `URL ${config.operator} ${config.value}`;
        }
        return 'N/A';
    };

    return (
        <div className={styles.container}>
            <div className={styles.configCard}>
                <div className={styles.cardHeader}>
                    <h1 className={styles.pageTitle}>Recommendation Display Configurations</h1>
                    <button className={styles.addButton} onClick={handleCreateNew}>
                        <Plus size={18} />
                        Create new configuration
                    </button>
                </div>

                <div className={styles.filters}>
                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>Type:</label>
                        <select 
                            className={styles.filterSelect}
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value as DisplayType | 'all')}
                        >
                            <option value="all">All Types</option>
                            <option value="popup">Popup</option>
                            <option value="custom-widget">Custom Widget</option>
                        </select>
                    </div>
                </div>

                {isLoading ? (
                    <div className={styles.emptyState}>
                        <p className={styles.emptyTitle}>Loading...</p>
                        <p className={styles.emptyDescription}>
                            Fetching return method configurations...
                        </p>
                    </div>
                ) : error ? (
                    <div className={styles.emptyState}>
                        <p className={styles.emptyTitle}>Error</p>
                        <p className={styles.emptyDescription}>{error}</p>
                    </div>
                ) : filteredConfigurations.length === 0 ? (
                    <div className={styles.emptyState}>
                        <p className={styles.emptyTitle}>No display configurations yet</p>
                        <p className={styles.emptyDescription}>
                            Create your first recommendation display configuration to get started.
                        </p>
                        <button className={styles.emptyButton} onClick={handleCreateNew}>
                            <Plus size={18} />
                            Create your first configuration
                        </button>
                    </div>
                ) : (
                    <div className={styles.tableContainer}>
                        <table className={styles.configTable}>
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Name</th>
                                    <th>Type</th>
                                    <th>Target Condition</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredConfigurations.map((config, index) => (
                                    <tr key={config.id}>
                                        <td>#{index + 1}</td>
                                        <td className={styles.nameCell}>{config.name}</td>
                                        <td>
                                            <span className={styles.typeTag}>
                                                {config.displayType === 'popup' ? 'Popup' : 'Custom Widget'}
                                            </span>
                                        </td>
                                        <td className={styles.summaryCell}>
                                            {getSummary(config)}
                                        </td>
                                        <td className={styles.actionsCell}>
                                            <button 
                                                className={styles.actionButton}
                                                onClick={() => handleView(config.id)}
                                                title="View details"
                                            >
                                                <Eye size={16} />
                                            </button>
                                            <button 
                                                className={styles.actionButton}
                                                onClick={() => handleEdit(config.id)}
                                                title="Edit configuration"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button 
                                                className={styles.deleteButton}
                                                onClick={() => handleDelete(config.id)}
                                                title="Delete configuration"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};
