import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Container } from '../../types';
import { Save, Copy } from 'lucide-react';
import styles from './returnMethodPage.module.css';
import { DisplayConfiguration, DisplayType, SelectorType, MatchOperator } from './types';

interface ReturnMethodFormPageProps {
    container: Container | null;
    mode: 'create' | 'edit' | 'view';
}

export const ReturnMethodFormPage: React.FC<ReturnMethodFormPageProps> = ({ container, mode }) => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isReadOnly = mode === 'view';
    
    const [displayType, setDisplayType] = useState<DisplayType>('custom-widget');
    const [name, setName] = useState('');
    
    // Custom Widget fields
    const [selectorType, setSelectorType] = useState<SelectorType>('class');
    const [matchOperator, setMatchOperator] = useState<MatchOperator>('contains');
    const [selectorValue, setSelectorValue] = useState('');
    const [layoutStyle, setLayoutStyle] = useState('grid');
    const [theme, setTheme] = useState('light');
    const [spacing, setSpacing] = useState('medium');
    const [size, setSize] = useState('large');
    
    // Popup fields
    const [urlOperator, setUrlOperator] = useState<MatchOperator>('contains');
    const [urlValue, setUrlValue] = useState('');
    const [slotName, setSlotName] = useState('');

    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (mode !== 'create' && id) {
            // Mock loading existing configuration
            const mockConfig: DisplayConfiguration = {
                id: id,
                name: 'Product Page Widget',
                displayType: 'custom-widget',
                targetSelector: {
                    type: 'class',
                    operator: 'contains',
                    value: 'product-detail'
                },
                widgetDesign: {
                    layout: 'grid',
                    theme: 'light',
                    spacing: 'medium',
                    size: 'large'
                },
                createdAt: '2025-12-15T10:00:00Z',
                updatedAt: '2025-12-15T10:00:00Z'
            };

            setName(mockConfig.name);
            setDisplayType(mockConfig.displayType);

            if (mockConfig.displayType === 'custom-widget' && mockConfig.targetSelector) {
                setSelectorType(mockConfig.targetSelector.type);
                setMatchOperator(mockConfig.targetSelector.operator);
                setSelectorValue(mockConfig.targetSelector.value);
                if (mockConfig.widgetDesign) {
                    setLayoutStyle(mockConfig.widgetDesign.layout);
                    setTheme(mockConfig.widgetDesign.theme);
                    setSpacing(mockConfig.widgetDesign.spacing);
                    setSize(mockConfig.widgetDesign.size);
                }
            } else if (mockConfig.displayType === 'popup' && mockConfig.urlTrigger) {
                setUrlOperator(mockConfig.urlTrigger.operator);
                setUrlValue(mockConfig.urlTrigger.value);
                setSlotName(mockConfig.slotName || '');
            }
        }
    }, [mode, id]);

    const handleSave = async () => {
        if (!name.trim()) {
            alert('Please enter a configuration name');
            return;
        }

        if (displayType === 'custom-widget' && !selectorValue.trim()) {
            alert('Please enter a selector value');
            return;
        }

        if (displayType === 'popup' && (!urlValue.trim() || !slotName.trim())) {
            alert('Please fill in all required popup fields');
            return;
        }

        setIsSaving(true);
        
        // Simulate API call
        setTimeout(() => {
            setIsSaving(false);
            navigate('/dashboard/recommendation-display');
        }, 500);
    };

    const generateWidgetCode = () => {
        const configId = id || 'new-config';
        return `<!-- RecoTrack Custom Widget -->
<div id="recotrack-widget-${configId}"></div>
<script>
  window.recoTrackWidget = {
    configId: '${configId}',
    containerId: 'recotrack-widget-${configId}',
    layout: '${layoutStyle}',
    theme: '${theme}'
  };
</script>`;
    };

    const generatePopupCode = () => {
        const configId = id || 'new-config';
        return `<!-- RecoTrack Popup -->
<div data-recotrack-slot="${slotName}"></div>
<script>
  window.recoTrackPopup = {
    configId: '${configId}',
    slotName: '${slotName}',
    urlPattern: '${urlValue}'
  };
</script>`;
    };

    const getHelperText = () => {
        if (displayType === 'custom-widget') {
            return `The widget will be rendered inside the element matching: ${selectorValue} (${matchOperator})`;
        } else {
            return `The popup will appear when URL ${urlOperator}: ${urlValue || '[enter value]'}`;
        }
    };

    const copyCode = () => {
        const code = displayType === 'custom-widget' ? generateWidgetCode() : generatePopupCode();
        navigator.clipboard.writeText(code);
        alert('Code copied to clipboard!');
    };

    return (
        <div className={styles.container}>
            <div className={styles.configCard}>
                <div className={styles.formHeader}>
                    <h1 className={styles.formTitle}>
                        {mode === 'create' ? 'Create New Configuration' : 
                         mode === 'edit' ? 'Edit Configuration' : 'View Configuration'}
                    </h1>
                    <button className={styles.closeButton} onClick={() => navigate('/dashboard/recommendation-display')}>
                        <span className="sr-only">Close</span>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className={styles.formContent}>
                    {/* Display Type Selection */}
                    <div className={styles.formSection}>
                        <label className={styles.sectionLabel}>Display Type</label>
                        <div className={styles.displayTypeGrid}>
                            <button
                                type="button"
                                className={`${styles.displayTypeCard} ${displayType === 'custom-widget' ? styles.displayTypeCardActive : ''}`}
                                onClick={() => !isReadOnly && mode === 'create' && setDisplayType('custom-widget')}
                                disabled={isReadOnly || mode !== 'create'}
                            >
                                <div className={styles.displayTypeIcon}>📦</div>
                                <div className={styles.displayTypeTitle}>Custom Widget</div>
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

                    {/* Common Fields */}
                    <div className={styles.formSection}>
                        <label className={styles.sectionLabel}>
                            Configuration Name <span className={styles.required}>*</span>
                        </label>
                        <input
                            type="text"
                            className={styles.textInput}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Product Page Widget"
                            disabled={isReadOnly}
                        />
                    </div>

                    {/* Custom Widget Specific Fields */}
                    {displayType === 'custom-widget' && (
                        <>
                            <div className={styles.formSection}>
                                <label className={styles.sectionLabel}>Target CSS Selector</label>
                                <p className={styles.helperText}>Define where the widget should be rendered on your page</p>
                                
                                <div className={styles.formRow}>
                                    <div className={styles.formCol}>
                                        <label className={styles.fieldLabel}>Match Operator</label>
                                        <select 
                                            className={styles.selectInput}
                                            value={matchOperator}
                                            onChange={(e) => setMatchOperator(e.target.value as MatchOperator)}
                                            disabled={isReadOnly}
                                        >
                                            <option value="equals">Equals</option>
                                            <option value="contains">Contains</option>
                                            <option value="starts-with">Starts With</option>
                                        </select>
                                    </div>
                                    <div className={styles.formCol}>
                                        <label className={styles.fieldLabel}>
                                            CSS Selector Value <span className={styles.required}>*</span>
                                        </label>
                                        <input
                                            type="text"
                                            className={styles.textInput}
                                            value={selectorValue}
                                            onChange={(e) => setSelectorValue(e.target.value)}
                                            placeholder="e.g., product-detail"
                                            disabled={isReadOnly}
                                        />
                                    </div>
                                </div>
                                <div className={styles.helperBox}>
                                    {getHelperText()}
                                </div>
                            </div>

                            <div className={styles.formSection}>
                                <label className={styles.sectionLabel}>Widget Design</label>
                                
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
                            </div>

                            <div className={styles.formSection}>
                                <label className={styles.sectionLabel}>Preview</label>
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

                            <div className={styles.formSection}>
                                <label className={styles.sectionLabel}>How to integrate this widget:</label>
                                <div className={styles.guideBox}>
                                    <ol className={styles.guideList}>
                                        <li>Ensure the target element exists on your page</li>
                                        <li>The widget will automatically render inside the target element</li>
                                        <li>Design your widget for best user experience</li>
                                    </ol>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Popup Specific Fields */}
                    {displayType === 'popup' && (
                        <>
                            <div className={styles.formSection}>
                                <label className={styles.sectionLabel}>URL Trigger</label>
                                <p className={styles.helperText}>Define where the popup should appear</p>
                                
                                <div className={styles.formRow}>
                                    <div className={styles.formCol}>
                                        <label className={styles.fieldLabel}>Match Operator</label>
                                        <select 
                                            className={styles.selectInput}
                                            value={urlOperator}
                                            onChange={(e) => setUrlOperator(e.target.value as MatchOperator)}
                                            disabled={isReadOnly}
                                        >
                                            <option value="equals">Equals</option>
                                            <option value="contains">Contains</option>
                                            <option value="regex">Regex</option>
                                        </select>
                                    </div>
                                    <div className={styles.formCol} style={{ flex: 2 }}>
                                        <label className={styles.fieldLabel}>
                                            URL Value <span className={styles.required}>*</span>
                                        </label>
                                        <input
                                            type="text"
                                            className={styles.textInput}
                                            value={urlValue}
                                            onChange={(e) => setUrlValue(e.target.value)}
                                            placeholder="e.g., /product"
                                            disabled={isReadOnly}
                                        />
                                    </div>
                                </div>

                                <div className={styles.helperBox}>
                                    {getHelperText()}
                                </div>
                            </div>

                            <div className={styles.formSection}>
                                <label className={styles.sectionLabel}>Preview</label>
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

                            <div className={styles.formSection}>
                                <label className={styles.sectionLabel}>How does popup work?</label>
                                <div className={styles.guideBox}>
                                    <ol className={styles.guideList}>
                                        <li>Search for matching URLs based on your specified conditions</li>
                                        <li>Render the popup on matching pages into the specified div</li>
                                        <li>The popup will automatically appear when the condition is met</li>
                                        <li>The popup can move or be closed by the user</li>
                                    </ol>
                                </div>
                            </div>
                        </>
                    )}

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
            </div>
        </div>
    );
};
