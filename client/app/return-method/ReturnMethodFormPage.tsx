import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Container } from '../../types';
import { Save, Copy } from 'lucide-react';
import styles from './returnMethodPage.module.css';
import { DisplayConfiguration, DisplayType } from './types';
import { useDataCache } from '../../contexts/DataCacheContext';
import { returnMethodApi } from '../../lib/api/return-method';
import { ReturnType } from '../../lib/api/types';

interface ReturnMethodFormPageProps {
    container: Container | null;
    mode: 'create' | 'edit' | 'view';
}

export const ReturnMethodFormPage: React.FC<ReturnMethodFormPageProps> = ({ container, mode }) => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isReadOnly = mode === 'view';
    
    const [displayType, setDisplayType] = useState<DisplayType>('inline-injection');
    const [name, setName] = useState('');
    const [operatorId, setOperatorId] = useState<number>(1);
    const [value, setValue] = useState('');
    
    // Custom Widget fields
    const [layoutStyle, setLayoutStyle] = useState('grid');
    const [theme, setTheme] = useState('light');
    const [spacing, setSpacing] = useState('medium');
    const [size, setSize] = useState('large');
    
    // Popup fields
    const [isSaving, setIsSaving] = useState(false);
    
    // Search keyword signals
    const [enableSearchKeyword, setEnableSearchKeyword] = useState(false);
    const [selectedSearchConfigId, setSelectedSearchConfigId] = useState<string>('');
    const [searchInputConfigs, setSearchInputConfigs] = useState<Array<{ id: string; name: string }>>([]);
    
    // Error states
    const [errors, setErrors] = useState<{
        name?: string;
        value?: string;
        general?: string;
    }>({});
    
    // Get cached operators from context
    const { operators, clearReturnMethodsByDomain } = useDataCache();

    // Fetch search input configurations
    useEffect(() => {
        const fetchSearchInputs = async () => {
            if (!container?.uuid) return;
            
            // TODO: Replace with actual API call
            // Mock data for now
            const mockData = [
                { id: '1', name: 'Header Search Bar' },
                { id: '2', name: 'Sidebar Search Box' },
            ];
            setSearchInputConfigs(mockData);
        };

        fetchSearchInputs();
    }, [container?.uuid]);

    useEffect(() => {
        if (mode !== 'create' && id) {
            // Mock loading existing configuration
            const mockConfig: DisplayConfiguration = {
                id: id,
                configurationName: 'Product Page Widget',
                displayType: 'inline-injection',
                operator: 'contains',
                value: 'product-detail',
                widgetDesign: {
                    layout: 'grid',
                    theme: 'light',
                    spacing: 'medium',
                    size: 'large'
                }
            };

            setName(mockConfig.configurationName);
            setDisplayType(mockConfig.displayType);
            const operatorId = mockConfig.operator === 'contains' ? 1 : 
                    mockConfig.operator === 'equals' ? 2 : 
                    mockConfig.operator === 'starts with' ? 3 : 
                    mockConfig.operator === 'ends with' ? 4 : 1;
            setOperatorId(operatorId);
            setValue(mockConfig.value);

            if (mockConfig.displayType === 'inline-injection') {
                if (mockConfig.widgetDesign) {
                    setLayoutStyle(mockConfig.widgetDesign.layout);
                    setTheme(mockConfig.widgetDesign.theme);
                    setSpacing(mockConfig.widgetDesign.spacing);
                    setSize(mockConfig.widgetDesign.size);
                }
            }
        }
    }, [mode, id]);

    const handleSave = async () => {
        // Reset errors
        setErrors({});
        
        // Validate fields
        const newErrors: typeof errors = {};
        
        if (!name.trim()) {
            newErrors.name = 'Please enter a configuration name';
        }

        if (!value.trim()) {
            newErrors.value = displayType === 'inline-injection' 
                ? 'Please enter a selector value'
                : 'Please enter a URL value';
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
            const requestData = {
                Key: container.uuid,
                ConfigurationName: name,
                ReturnType: displayType === 'popup' ? ReturnType.POPUP : ReturnType.INLINE_INJECTION,
                Value: value,
                OperatorId: operatorId
            };

            await returnMethodApi.create(requestData);
            // Clear cache để trang danh sách sẽ fetch lại data mới
            clearReturnMethodsByDomain(container.uuid);
            navigate('/dashboard/recommendation-display');
        } catch (error) {
            console.error('Error saving configuration:', error);
            setErrors({ general: 'Failed to save configuration. Please try again.' });
        } finally {
            setIsSaving(false);
        }
    };

    const getHelperText = () => {
        if (displayType === 'inline-injection') {
            const operatorName = operators.find(op => op.Id === operatorId)?.Name || 'contains';
            return `The widget will be rendered inside the element matching: ${value} (${operatorName})`;
        } else {
            const operatorName = operators.find(op => op.Id === operatorId)?.Name || 'contains';
            return `The popup will appear when URL ${operatorName}: ${value || '[enter value]'}`;
        }
    };

    return (
        <div className={styles.container}>
            {/* Section 1: Create Display Method Configuration */}
            <div className={styles.sectionCard}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>Create Display Method Configuration</h2>
                </div>
                <div className={styles.sectionContent}>
                    {errors.general && (
                        <div className={styles.errorAlert}>
                            {errors.general}
                        </div>
                    )}
                    {/* Display Type Selection */}
                    <div className={styles.formGroup}>
                        <label className={styles.fieldLabel}>Display Type</label>
                        <div className={styles.displayTypeGrid}>
                            <button
                                type="button"
                                className={`${styles.displayTypeCard} ${displayType === 'inline-injection' ? styles.displayTypeCardActive : ''}`}
                                onClick={() => !isReadOnly && mode === 'create' && setDisplayType('inline-injection')}
                                disabled={isReadOnly || mode !== 'create'}
                            >
                                <div className={styles.displayTypeIcon}>📦</div>
                                <div className={styles.displayTypeTitle}>Inline Injection</div>
                                <div className={styles.displayTypeDescription}>
                                    Embed recommendations in a specific location on your page
                                </div>
                            </button>
                            <button
                                type="button"
                                className={`${styles.displayTypeCard} ${displayType === 'popup' ? styles.displayTypeCardActive : ''}`}
                                onClick={() => !isReadOnly && mode === 'create' && setDisplayType('popup')}
                                disabled={isReadOnly || mode !== 'create'}
                            >
                                <div className={styles.displayTypeIcon}>🔔</div>
                                <div className={styles.displayTypeTitle}>Popup</div>
                                <div className={styles.displayTypeDescription}>
                                    Show recommendations in a popup overlay
                                </div>
                            </button>
                        </div>
                        {mode !== 'create' && (
                            <p className={styles.helperText}>Display type cannot be changed after creation</p>
                        )}
                    </div>

                    {/* Configuration Name */}
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
                            placeholder="e.g., Product Page Widget"
                            disabled={isReadOnly}
                        />
                        {errors.name && (
                            <span className={styles.errorText}>{errors.name}</span>
                        )}
                    </div>

                    {/* Target Selector / URL Trigger */}
                    <div className={styles.formGroup}>
                        <label className={styles.fieldLabel}>
                            {displayType === 'inline-injection' ? 'Target CSS Selector' : 'URL Trigger'}
                        </label>
                        
                        <div className={styles.formRow}>
                            <div className={styles.formCol}>
                                <label className={styles.inputLabel}>Match Operator</label>
                                <select 
                                    className={styles.selectInput}
                                    value={operatorId}
                                    onChange={(e) => setOperatorId(Number(e.target.value))}
                                    disabled={isReadOnly}
                                >
                                    {operators.length > 0 ? (
                                        operators.map(op => (
                                            <option key={op.Id} value={op.Id}>
                                                {op.Name}
                                            </option>
                                        ))
                                    ) : (
                                        <>
                                            <option value="1">Contains</option>
                                            <option value="2">Equals</option>
                                            <option value="3">Starts with</option>
                                            <option value="4">Ends with</option>
                                        </>
                                    )}
                                </select>
                            </div>
                            <div className={styles.formCol} style={{ flex: 2 }}>
                                <label className={styles.inputLabel}>
                                    {displayType === 'inline-injection' ? 'CSS Selector Value' : 'URL Value'} <span className={styles.required}>*</span>
                                </label>
                                <input
                                    type="text"
                                    className={`${styles.textInput} ${errors.value ? styles.inputError : ''}`}
                                    value={value}
                                    onChange={(e) => {
                                        setValue(e.target.value);
                                        if (errors.value) {
                                            setErrors(prev => ({ ...prev, value: undefined }));
                                        }
                                    }}
                                    placeholder={displayType === 'inline-injection' ? 'e.g., product-detail' : 'e.g., /product'}
                                    disabled={isReadOnly}
                                />
                                {errors.value && (
                                    <span className={styles.errorText}>{errors.value}</span>
                                )}
                            </div>
                        </div>
                        <div className={styles.helperBox}>
                            {getHelperText()}
                        </div>
                    </div>
                </div>
            </div>

            {/* Section 2: Widget Design (for inline) or Preview (for popup) */}
            {displayType === 'inline-injection' ? (
                <div className={styles.sectionCard}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>Widget Design</h2>
                    </div>
                    <div className={styles.sectionContent}>
                        <div className={styles.formRow}>
                            <div className={styles.formCol}>
                                <label className={styles.fieldLabel}>Layout</label>
                                <select 
                                    className={styles.selectInput}
                                    value={layoutStyle}
                                    onChange={(e) => setLayoutStyle(e.target.value)}
                                    disabled={isReadOnly}
                                >
                                    <option value="grid">Grid</option>
                                    <option value="list">List</option>
                                    <option value="carousel">Carousel</option>
                                </select>
                            </div>
                            <div className={styles.formCol}>
                                <label className={styles.fieldLabel}>Theme</label>
                                <select 
                                    className={styles.selectInput}
                                    value={theme}
                                    onChange={(e) => setTheme(e.target.value)}
                                    disabled={isReadOnly}
                                >
                                    <option value="light">Light</option>
                                    <option value="dark">Dark</option>
                                </select>
                            </div>
                            <div className={styles.formCol}>
                                <label className={styles.fieldLabel}>Spacing</label>
                                <select 
                                    className={styles.selectInput}
                                    value={spacing}
                                    onChange={(e) => setSpacing(e.target.value)}
                                    disabled={isReadOnly}
                                >
                                    <option value="small">Small</option>
                                    <option value="medium">Medium</option>
                                    <option value="large">Large</option>
                                </select>
                            </div>
                            <div className={styles.formCol}>
                                <label className={styles.fieldLabel}>Size</label>
                                <select 
                                    className={styles.selectInput}
                                    value={size}
                                    onChange={(e) => setSize(e.target.value)}
                                    disabled={isReadOnly}
                                >
                                    <option value="small">Small</option>
                                    <option value="medium">Medium</option>
                                    <option value="large">Large</option>
                                </select>
                            </div>
                        </div>

                        <div className={styles.previewBox}>
                            <p className={styles.previewLabel}>Widget Preview (Illustrative)</p>
                            <div className={styles.widgetPreview}>
                                <div className={`${styles.previewItem} ${styles[`preview-${theme}`]}`}>
                                    <div className={styles.previewImage}>🖼️</div>
                                    <div className={styles.previewTitle}>Recommended Item 1</div>
                                    <div className={styles.previewPrice}>$29.99</div>
                                </div>
                                <div className={`${styles.previewItem} ${styles[`preview-${theme}`]}`}>
                                    <div className={styles.previewImage}>🖼️</div>
                                    <div className={styles.previewTitle}>Recommended Item 2</div>
                                    <div className={styles.previewPrice}>$39.99</div>
                                </div>
                                <div className={`${styles.previewItem} ${styles[`preview-${theme}`]}`}>
                                    <div className={styles.previewImage}>🖼️</div>
                                    <div className={styles.previewTitle}>Recommended Item 3</div>
                                    <div className={styles.previewPrice}>$49.99</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className={styles.sectionCard}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>Preview</h2>
                    </div>
                    <div className={styles.sectionContent}>
                        <div className={styles.previewBox}>
                            <p className={styles.previewLabel}>Popup Preview (Illustrative)</p>
                            <div className={styles.popupPreview}>
                                <div className={styles.popupOverlay}>
                                    <div className={styles.popupContent}>
                                        <div className={styles.popupHeader}>
                                            <h3>Recommended for You</h3>
                                            <span className={styles.popupClose}>×</span>
                                        </div>
                                        <div className={styles.popupBody}>
                                            <div className={styles.popupItem}>
                                                <div className={styles.popupImage}>🖼️</div>
                                                <div className={styles.popupInfo}>
                                                    <div className={styles.popupTitle}>Product Name</div>
                                                    <div className={styles.popupPrice}>$29.99</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Section: Search Keyword Signals */}
            <div className={styles.sectionCard}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>Search Keyword Signals</h2>
                </div>
                <div className={styles.sectionContent}>
                    <div className={styles.formGroup}>
                        <div className={styles.switchContainer}>
                            <label className={styles.switchLabel}>
                                Apply search keyword to this display rule
                            </label>
                            <label className={styles.switch}>
                                <input
                                    type="checkbox"
                                    checked={enableSearchKeyword}
                                    onChange={(e) => {
                                        setEnableSearchKeyword(e.target.checked);
                                        if (!e.target.checked) {
                                            setSelectedSearchConfigId('');
                                        }
                                    }}
                                    disabled={isReadOnly}
                                />
                                <span className={styles.slider}></span>
                            </label>
                        </div>
                    </div>

                    {enableSearchKeyword && (
                        <div className={styles.formGroup}>
                            <label className={styles.fieldLabel}>
                                Choose search keyword configuration
                            </label>
                            <select 
                                className={styles.selectInput}
                                value={selectedSearchConfigId}
                                onChange={(e) => setSelectedSearchConfigId(e.target.value)}
                                disabled={isReadOnly}
                            >
                                <option value="">Select a configuration...</option>
                                {searchInputConfigs.map(config => (
                                    <option key={config.id} value={config.id}>
                                        {config.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className={styles.helperBox}>
                        When enabled, the system will use the keywords entered in the search bar (if any) to filter/rearrange the recommended results.
                    </div>
                </div>
            </div>

            {/* Section 3: Instructions */}
            <div className={styles.sectionCard}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>Instructions</h2>
                </div>
                <div className={styles.sectionContent}>
                    <div className={styles.guideBox}>
                        <h3 className={styles.guideTitle}>
                            {displayType === 'inline-injection' ? 'How to integrate this widget:' : 'How does popup work?'}
                        </h3>
                        <ol className={styles.guideList}>
                            {displayType === 'inline-injection' ? (
                                <>
                                    <li>Ensure the target element exists on your page</li>
                                    <li>The widget will automatically render inside the target element</li>
                                    <li>Design your widget for best user experience</li>
                                </>
                            ) : (
                                <>
                                    <li>Search for matching URLs based on your specified conditions</li>
                                    <li>Render the popup on matching pages into the specified div</li>
                                    <li>The popup will automatically appear when the condition is met</li>
                                    <li>The popup can move or be closed by the user</li>
                                </>
                            )}
                        </ol>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            {!isReadOnly && (
                <div className={styles.formActions}>
                    <button 
                        className={styles.cancelButton} 
                        onClick={() => navigate('/dashboard/recommendation-display')}
                    >
                        Cancel
                    </button>
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
