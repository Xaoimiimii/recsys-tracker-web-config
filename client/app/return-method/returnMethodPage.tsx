import React, { useState, useEffect, JSX } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Container } from '../../types';
import { Plus, Eye, Edit2, Trash2, Layers, Puzzle } from 'lucide-react';
import styles from './returnMethodPage.module.css';
import { DisplayConfiguration, DisplayType } from './types';
import { returnMethodApi } from '../../lib/api/return-method';
import type { ReturnMethodResponse } from '../../lib/api/types';
import { useDataCache } from '../../contexts/DataCacheContext';
import { DEFAULT_POPUP_LAYOUT, DEFAULT_STYLE_CONFIG } from './returnMethodDefaults';

interface ReturnMethodPageProps {
    container: Container | null;
    setContainer: (c: Container) => void;
}

export const ReturnMethodPage: React.FC<ReturnMethodPageProps> = ({ container }) => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [configurations, setConfigurations] = useState<DisplayConfiguration[]>([]);
    
    // State lưu tên Operator để hiển thị
    const [operatorNames, setOperatorNames] = useState<Record<string, string>>({});
    
    const [filterType, setFilterType] = useState<DisplayType | 'all'>('all');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const { getReturnMethodsByDomain, setReturnMethodsByDomain, operators } = useDataCache();

    // Fetch return methods from API
    useEffect(() => {
        const fetchReturnMethods = async () => {
            if (!container?.uuid) {
                setError('No domain selected');
                return;
            }

            const cachedReturnMethods = getReturnMethodsByDomain(container.uuid);
            if (cachedReturnMethods) {
                transformAndSetConfigurations(cachedReturnMethods);
                return;
            }

            setIsLoading(true);
            setError(null);

            try {
                const response = await returnMethodApi.getByDomainKey(container.uuid);
                setReturnMethodsByDomain(container.uuid, response);
                transformAndSetConfigurations(response);
            } catch (err) {
                console.error('Failed to fetch return methods:', err);
                setError('Failed to load return methods. Please try again.');
            } finally {
                setIsLoading(false);
            }
        };

        const transformAndSetConfigurations = (response: ReturnMethodResponse[]) => {
            const transformedConfigs: DisplayConfiguration[] = response.map((item, index) => {
                const displayType: DisplayType = item.ReturnType === 'POPUP' ? 'popup' : 'inline-injection';
                
                // --- QUAN TRỌNG: Xử lý ID ---
                // Do ReturnMethodResponse trong types.ts hiện không có trường Id,
                // ta tạo tạm một ID giả để React có thể render list (dùng index).
                // Khi Backend cập nhật trả về Id, hãy sửa lại dòng này: const id = item.Id.toString();

                return {
                    id: item.Key,
                    configurationName: item.ConfigurationName,
                    displayType,
                    operator: 1, 
                    value: item.Value,
                    layoutJson: item.LayoutJson || DEFAULT_POPUP_LAYOUT,
                    styleJson: item.StyleJson || DEFAULT_STYLE_CONFIG,
                    customizingFields: item.CustomizingFields || {},
                    Duration: item.DelayDuration || 0,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
            });

            setConfigurations(transformedConfigs);
        };

        fetchReturnMethods();
    }, [container?.uuid, getReturnMethodsByDomain, setReturnMethodsByDomain]);

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
        // Cảnh báo: ID hiện tại là ID giả, lệnh delete này sẽ thất bại nếu gửi lên server
        // Trừ khi bạn sửa lại logic lấy ID thực từ response
        // if (confirm('Are you sure you want to delete this configuration?')) {
        //     try {
        //          await returnMethodApi.delete(id); 
        //         setConfigurations(prev => prev.filter(config => config.id !== id));
        //         if (container?.uuid) {
        //             // Logic clear cache nếu cần
        //         }
        //     } catch (e) {
        //         console.error("Delete failed", e);
        //         alert("Failed to delete (ID might be invalid)");
        //     }
        // }
    };

    const getSummary = (config: DisplayConfiguration): JSX.Element => {
        // Lấy tên Operator từ map (ưu tiên) hoặc tìm trong context
        const opName = operatorNames[config.id] || 
                       operators.find(op => op.Id === config.operator)?.Name || 
                       'Contains';
        
        const operatorText = `[${opName}]`;
        
        if (config.displayType === 'inline-injection') {
            return (
                <div>
                    <span style={{color: '#6b7280', fontSize: '0.8em'}}>Target Div: </span>
                    <span style={{fontWeight: 500}}>{config.value}</span>
                    <div style={{fontSize: '0.75em', color: '#9ca3af'}}>
                        Inside element matching selector
                    </div>
                </div>
            );
        } else {
            return (
                <div>
                     <span style={{color: '#6b7280', fontSize: '0.8em'}}>Trigger URL {operatorText}: </span>
                     <span style={{fontWeight: 500}}>{config.value}</span>
                </div>
            );
        }
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
                            <option value="inline-injection">Inline Injection</option>
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
                                        <td className={styles.nameCell}>
                                            <div style={{fontWeight: 'bold'}}>{config.configurationName}</div>
                                            {/* Ẩn ID giả đi vì nó không có ý nghĩa với người dùng */}
                                            {/* <div style={{fontSize: '0.75rem', color: '#9ca3af'}}>ID: {config.id}</div> */}
                                        </td>
                                        <td>
                                            <span className={styles.typeTag} style={{
                                                backgroundColor: config.displayType === 'popup' ? '#e0f2fe' : '#f3e8ff',
                                                color: config.displayType === 'popup' ? '#0284c7' : '#9333ea',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '4px'
                                            }}>
                                                {config.displayType === 'popup' ? <Layers size={12}/> : <Puzzle size={12}/>}
                                                {config.displayType === 'popup' ? 'Popup' : 'Inline'}
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