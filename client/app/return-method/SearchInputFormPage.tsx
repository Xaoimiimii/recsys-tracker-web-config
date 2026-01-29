import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Container } from '../../types';
import { Save, X } from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import styles from './returnMethodPage.module.css';
import { useDataCache } from '../../contexts/DataCacheContext';
import { searchInputApi } from '../../lib/api/search-input';

interface SearchInputFormPageProps {
    container: Container | null;
    mode: 'create' | 'edit' | 'view';
}

export const SearchInputFormPage: React.FC<SearchInputFormPageProps> = ({ container, mode }) => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isReadOnly = mode === 'view';
    
    const [name, setName] = useState('');
    const [operatorId, setOperatorId] = useState<number>(1);
    const [selector, setSelector] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    const [errors, setErrors] = useState<{
        name?: string;
        selector?: string;
        general?: string;
    }>({});

    // Get cached data from context
    const { clearSearchInputsByDomain, getSearchInputsByDomain } = useDataCache();

    // Load data for view/edit modes
    useEffect(() => {
        const loadData = async () => {
            if ((mode === 'view' || mode === 'edit') && id && container?.uuid) {
                setIsLoading(true);
                try {
                    let allConfigs = getSearchInputsByDomain(container.uuid);
                    
                    if (!allConfigs) {
                        allConfigs = await searchInputApi.getByDomainKey(container.uuid);
                    }
                    
                    const config = allConfigs.find(c => c.Id === Number(id));
                    
                    if (config) {
                        setName(config.ConfigurationName);
                        setSelector(config.InputSelector);
                    } else {
                        setErrors({ general: 'Configuration not found.' });
                    }
                } catch (error) {
                    console.error('Error loading search input config:', error);
                    setErrors({ general: 'Failed to load configuration data.' });
                } finally {
                    setIsLoading(false);
                }
            }
        };

        loadData();
    }, [mode, id, container?.uuid, getSearchInputsByDomain]);

    const handleSave = async () => {
        // Reset errors
        setErrors({});
        
        // Validate fields
        const newErrors: typeof errors = {};
        
        if (!name.trim()) {
            newErrors.name = 'Please enter a configuration name';
        }

        if (!selector.trim()) {
            newErrors.selector = 'Please enter a CSS selector';
        }

        if (!container?.uuid) {
            newErrors.general = 'Domain key is missing';
        }
        
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setIsSaving(true);
        
        try {
            if (mode === 'edit' && id) {
                // Update existing configuration
                const updateData = {
                    Id: Number(id),
                    DomainKey: container.uuid,
                    ConfigurationName: name,
                    InputSelector: selector
                };
                await searchInputApi.update(updateData);
            } else {
                // Create new configuration
                const createData = {
                    DomainKey: container.uuid,
                    ConfigurationName: name,
                    InputSelector: selector
                };
                await searchInputApi.create(createData);
            }
            
            // Clear cache để trang danh sách sẽ fetch lại data mới
            clearSearchInputsByDomain(container.uuid);
            navigate('/dashboard/recommendation-display');
        } catch (error) {
            console.error('Error saving configuration:', error);
            setErrors({ general: 'Failed to save configuration. Please try again.' });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <LoadingSpinner />;
    }

    return (
        <div className={styles.container}>
            {/* Section 1: Create/Edit/View Search Input Configuration */}
            <div className={styles.sectionCard}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>
                        {mode === 'create' ? 'Create' : mode === 'edit' ? 'Edit' : 'View'} Search Input Configuration
                    </h2>
                    <button 
                        className={styles.closeButton}
                        onClick={() => navigate('/dashboard/recommendation-display')}
                        aria-label="Close"
                    >
                        <X size={20} />
                    </button>
                </div>
                <div className={styles.sectionContent}>
                    {errors.general && (
                        <div className={styles.errorAlert}>
                            {errors.general}
                        </div>
                    )}
                    <div className={styles.formGroup}>
                        <label className={styles.fieldLabel}>
                            Configuration Name <span className={styles.required}>*</span>
                        </label>
                        <input
                            type="text"
                            className={`${styles.textInput} ${errors.name ? styles.inputError : ''}`}
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                if (errors.name) {
                                    setErrors(prev => ({ ...prev, name: undefined }));
                                }
                            }}
                            placeholder="e.g., Header Search Bar"
                            disabled={isReadOnly}
                        />
                        {errors.name && (
                            <span className={styles.errorText}>{errors.name}</span>
                        )}
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.fieldLabel}>
                            Search Input CSS Selector <span className={styles.required}>*</span>
                        </label>

                        <div className={styles.formRow}>
                            <div className={styles.formCol}>
                                <label className={styles.inputLabel}>Target Type</label>
                                <input
                                    className={styles.selectInput}
                                    value="CSS Selector"
                                    disabled
                                />
                            </div>
                            <div className={styles.formCol}>
                                <label className={styles.inputLabel}>Match Condition</label>
                                <input
                                    className={styles.selectInput}
                                    value="Contains"
                                    disabled
                                />
                            </div>
                            <div className={styles.formCol} style={{ flex: 2 }}>
                                <label className={styles.inputLabel}>
                                    Selector Pattern <span className={styles.required}>*</span>
                                </label>
                                <input
                                    type="text"
                                    className={`${styles.textInput} ${errors.selector ? styles.inputError : ''}`}
                                    value={selector}
                                    onChange={(e) => {
                                        setSelector(e.target.value);
                                        if (errors.selector) {
                                            setErrors(prev => ({ ...prev, selector: undefined }));
                                        }
                                    }}
                                    placeholder='e.g., .search-input, #search-box'
                                    disabled={isReadOnly}
                                />
                                {errors.selector && (
                                    <span className={styles.errorText}>{errors.selector}</span>
                                )}
                            </div>
                        </div>
                        <div className={styles.helperBox}>
                            <ul className={styles.noteList}>
                                <li>The selector is only used to read keywords and does not interfere with the UI.</li>
                                <li>An incorrect selector will result in the keyword not being recognized.</li>
                                <li>When enabled, the system will use the keywords entered in the search bar (if any) to filter/rearrange the recommended results.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            {!isReadOnly && (
                <div className={styles.formActions}>
                    <button 
                        className={styles.saveButton} 
                        onClick={handleSave}
                        disabled={isSaving}
                    >
                        <Save size={18} />
                        {isSaving ? 'Saving...' : 'Save Configuration'}
                    </button>
                </div>
            )}
        </div>
    );
};
