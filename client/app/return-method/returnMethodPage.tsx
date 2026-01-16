import React, { useState, useEffect, JSX } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Container } from '../../types';
import { Plus, Eye, Edit2, Trash2, Layers, Puzzle } from 'lucide-react';
import styles from './returnMethodPage.module.css';
import { DisplayConfiguration, DisplayType } from './types';
import { returnMethodApi } from '../../lib/api/return-method';
import { searchInputApi } from '../../lib/api/search-input';
import type { ReturnMethodResponse, SearchInputResponse } from '../../lib/api/types';
import { useDataCache } from '../../contexts/DataCacheContext';
import { DEFAULT_POPUP_LAYOUT, DEFAULT_STYLE_CONFIG } from './returnMethodDefaults';

type TabType = 'display-method' | 'search-input';
import { parse } from 'path';

interface ReturnMethodPageProps {
    container: Container | null;
    setContainer: (c: Container) => void;
}

export const ReturnMethodPage: React.FC<ReturnMethodPageProps> = ({ container }) => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState<TabType>('display-method');
    const [configurations, setConfigurations] = useState<DisplayConfiguration[]>([]);
    const [searchInputConfigs, setSearchInputConfigs] = useState<SearchInputResponse[]>([]);
    
    // State lưu tên Operator để hiển thị
    const [operatorNames, setOperatorNames] = useState<Record<string, string>>({});
    
    const [filterType, setFilterType] = useState<DisplayType | 'all'>('all');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const { 
        getReturnMethodsByDomain, 
        setReturnMethodsByDomain,
        getSearchInputsByDomain,
        setSearchInputsByDomain 
    } = useDataCache();

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
                    operator: parseInt(item.OperatorId),
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

    // Fetch search input configurations
    useEffect(() => {
        const fetchSearchInputs = async () => {
            if (!container?.uuid) return;
            
            // Check cache first
            const cachedSearchInputs = getSearchInputsByDomain(container.uuid);
            if (cachedSearchInputs) {
                transformAndSetSearchInputs(cachedSearchInputs);
                return;
            }

            setIsLoading(true);
            setError(null);

            try {
                const response = await searchInputApi.getByDomainKey(container.uuid);
                setSearchInputsByDomain(container.uuid, response);
                transformAndSetSearchInputs(response);
            } catch (err) {
                console.error('Failed to fetch search inputs:', err);
                setError('Failed to load search inputs. Please try again.');
            } finally {
                setIsLoading(false);
            }
        };

        const transformAndSetSearchInputs = (response: SearchInputResponse[]) => {
            setSearchInputConfigs(response);
        };

        if (activeTab === 'search-input') {
            fetchSearchInputs();
        }
    }, [container?.uuid, activeTab, getSearchInputsByDomain, setSearchInputsByDomain]);

    const filteredConfigurations = configurations.filter(config => {
        const typeMatch = filterType === 'all' || config.displayType === filterType;
        return typeMatch;
    });

    const handleCreateNew = () => {
        if (activeTab === 'display-method') {
            navigate('/dashboard/recommendation-display/create');
        } else {
            navigate('/dashboard/recommendation-display/search-input/create');
        }
    };

    const handleView = (id: string) => {
        if (activeTab === 'display-method') {
            navigate(`/dashboard/recommendation-display/view/${id}`);
        } else {
            navigate(`/dashboard/recommendation-display/search-input/view/${id}`);
        }
    };

    const handleEdit = (id: string) => {
        if (activeTab === 'display-method') {
            navigate(`/dashboard/recommendation-display/edit/${id}`);
        } else {
            navigate(`/dashboard/recommendation-display/search-input/edit/${id}`);
        }
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

    const getSummary = (config: DisplayConfiguration): string => {
        if (config.displayType === 'inline-injection') {
            return `Div: ${config.value}`;
        } else if (config.displayType === 'popup') {
            return `URL: ${config.value}`;
        }
        return `${config.value}`;
    };

    return (
        <div className={styles.container}>
            <div className={styles.configCard}>
                <div className={styles.cardHeader}>
                    <h1 className={styles.pageTitle}>Recommendation Display Configurations</h1>
                    <button className={styles.addButton} onClick={handleCreateNew}>
                        <Plus size={18} />
                        {activeTab === 'display-method' ? 'Create new configuration' : 'Add Search Input'}
                    </button>
                </div>

                {/* Tabs */}
                <div className={styles.tabs}>
                    <button 
                        className={`${styles.tab} ${activeTab === 'display-method' ? styles.tabActive : ''}`}
                        onClick={() => setActiveTab('display-method')}
                    >
                        Display Method
                    </button>
                    <button 
                        className={`${styles.tab} ${activeTab === 'search-input' ? styles.tabActive : ''}`}
                        onClick={() => setActiveTab('search-input')}
                    >
                        Search Input Configuration
                    </button>
                </div>

                {/* Display Method Tab Content */}
                {activeTab === 'display-method' && (
                    <>
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
                                                <td className={styles.nameCell}>{config.configurationName}</td>
                                                <td>
                                                    <span className={styles.typeTag}>
                                                        {config.displayType === 'popup' ? 'Popup' : 'Inline Injection'}
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
                    </>
                )}

                {/* Search Input Configuration Tab Content */}
                {activeTab === 'search-input' && (
                    <>
                        {searchInputConfigs.length === 0 ? (
                            <div className={styles.emptyState}>
                                <p className={styles.emptyTitle}>No search input configurations yet</p>
                                <p className={styles.emptyDescription}>
                                    Create your first search input configuration to enable search keyword tracking.
                                </p>
                                <button className={styles.emptyButton} onClick={handleCreateNew}>
                                    <Plus size={18} />
                                    Add your first search input
                                </button>
                            </div>
                        ) : (
                            <div className={styles.tableContainer}>
                                <table className={styles.configTable}>
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Name</th>
                                            <th>Selector</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {searchInputConfigs.map((config, index) => (
                                            <tr key={config.Id}>
                                                <td>#{index + 1}</td>
                                                <td className={styles.nameCell}>{config.ConfigurationName}</td>
                                                <td className={styles.summaryCell}>{config.InputSelector}</td>
                                                <td className={styles.actionsCell}>
                                                    <button 
                                                        className={styles.actionButton}
                                                        onClick={() => handleView(config.Id.toString())}
                                                        title="View details"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                    <button 
                                                        className={styles.actionButton}
                                                        onClick={() => handleEdit(config.Id.toString())}
                                                        title="Edit configuration"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button 
                                                        className={styles.deleteButton}
                                                        onClick={() => handleDelete(config.Id.toString())}
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
                    </>
                )}
            </div>
        </div>
    );
};