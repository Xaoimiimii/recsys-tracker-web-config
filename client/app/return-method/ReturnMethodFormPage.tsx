import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Container } from '../../types';
import { Save, Layers, Monitor, ArrowLeft, ArrowUp, ArrowDown, Trash2, Plus, Check, BookOpen } from 'lucide-react';
import styles from './returnMethodPage.module.css';
import { DisplayType, LayoutJson, StyleJson, CustomizingFields, FieldConfig } from './types';
import { useDataCache } from '../../contexts/DataCacheContext';
import { returnMethodApi } from '../../lib/api/return-method';
import { ReturnType } from '../../lib/api/types';
import { DEFAULT_POPUP_LAYOUT, DEFAULT_INLINE_LAYOUT, DEFAULT_STYLE_CONFIG, LAYOUT_MODE_OPTIONS } from './returnMethodDefaults';

interface ReturnMethodFormPageProps {
    container: Container | null;
    mode: 'create' | 'edit' | 'view';
}

const DEFAULT_CUSTOM_FIELDS: CustomizingFields = {
    "product_name": { position: 1, isEnabled: true, label: "Tên sản phẩm" },
    "price": { position: 2, isEnabled: true, label: "Giá bán" },
    "image": { position: 0, isEnabled: true, label: "Ảnh sản phẩm" },
    "rating": { position: 3, isEnabled: true, label: "Đánh giá" },
    "description": { position: 4, isEnabled: false, label: "Mô tả ngắn" }
};

export const ReturnMethodFormPage: React.FC<ReturnMethodFormPageProps> = ({ container, mode }) => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isReadOnly = mode === 'view';
    
    // --- STATE ---
    const [displayType, setDisplayType] = useState<DisplayType>('popup');
    const [name, setName] = useState('');
    const [operatorId, setOperatorId] = useState<number>(1);
    const [value, setValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [errors, setErrors] = useState<{ name?: string; value?: string; general?: string }>({});

    // --- CONFIG STATE ---
    const [layoutJson, setLayoutJson] = useState<LayoutJson>(DEFAULT_POPUP_LAYOUT);
    const [styleJson, setStyleJson] = useState<StyleJson>(DEFAULT_STYLE_CONFIG);
    const [customFields, setCustomFields] = useState<CustomizingFields>(DEFAULT_CUSTOM_FIELDS);
    const [delayDuration, setDelayDuration] = useState<number>(0);

    const { operators } = useDataCache();

    const sortedFieldEntries = useMemo(() => {
        return Object.entries(customFields)
            .sort((a, b) => (a[1] as FieldConfig).position - (b[1] as FieldConfig).position);
    }, [customFields]);

    // --- EFFECT: LOAD DATA ---
    useEffect(() => {
        if (mode !== 'create' && id) {
            // Mock implementation
            setName('Campaign Popup 2024');
            setValue('/khuyen-mai');
        }
    }, [mode, id]);

    // --- HANDLERS ---
    const handleTypeChange = (type: DisplayType) => {
        if (isReadOnly) return;
        setDisplayType(type);
        if (type === 'popup') setLayoutJson(DEFAULT_POPUP_LAYOUT);
        else setLayoutJson(DEFAULT_INLINE_LAYOUT);
    };

    // Helper updaters
    const updatePopupWrapper = (key: string, val: any) => {
        setLayoutJson(prev => ({
            ...prev,
            wrapper: { popup: { ...prev.wrapper?.popup, [key]: val } as any }
        }));
    };

    const updateInlineWrapper = (key: string, val: any) => {
        setLayoutJson(prev => ({
            ...prev,
            wrapper: { inline: { ...prev.wrapper?.inline, [key]: val } as any }
        }));
    };

    const handleLayoutModeChange = (newMode: string) => {
        setLayoutJson(prev => ({ ...prev, contentMode: newMode }));
    };

    // Style Helpers
    const updateColorToken = (key: string, val: string) => {
        setStyleJson(prev => ({
            ...prev, tokens: { ...prev.tokens, colors: { ...prev.tokens.colors, [key]: val } }
        }));
    };

    const updateTypography = (type: keyof typeof styleJson.tokens.typography, field: string, val: any) => {
        setStyleJson(prev => ({
            ...prev, tokens: {
                ...prev.tokens, typography: {
                    ...prev.tokens.typography, [type]: { ...(prev.tokens.typography[type] as object), [field]: val }
                }
            }
        }));
    };

    const updateRadius = (key: keyof typeof styleJson.tokens.radius, val: number) => {
        setStyleJson(prev => ({
            ...prev, tokens: { ...prev.tokens, radius: { ...prev.tokens.radius, [key]: val } }
        }));
    };

    const updateDensity = (field: string, val: number) => {
        const currentSize = styleJson.size || 'md';
        setStyleJson(prev => ({
            ...prev, tokens: {
                ...prev.tokens, densityBySize: {
                    ...prev.tokens.densityBySize, [currentSize]: { ...prev.tokens.densityBySize[currentSize], [field]: val }
                }
            }
        }));
    };

    const updateShadow = (key: keyof typeof styleJson.tokens.shadow, val: string) => {
        setStyleJson(prev => ({
            ...prev, tokens: { ...prev.tokens, shadow: { ...prev.tokens.shadow, [key]: val } }
        }));
    };

    // Field Handlers
    const toggleField = (key: string) => {
        setCustomFields(prev => ({
            ...prev, [key]: { ...prev[key], isEnabled: !prev[key].isEnabled }
        }));
    };

    const updateFieldLabel = (key: string, newLabel: string) => {
        setCustomFields(prev => ({
            ...prev, [key]: { ...prev[key], label: newLabel }
        }));
    };

    const moveField = (key: string, direction: 'up' | 'down') => {
        const sortedKeys = Object.keys(customFields).sort((a, b) => customFields[a].position - customFields[b].position);
        const currentIndex = sortedKeys.indexOf(key);
        if (currentIndex === -1) return;
        const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        if (targetIndex < 0 || targetIndex >= sortedKeys.length) return;
        const targetKey = sortedKeys[targetIndex];

        setCustomFields(prev => ({
            ...prev,
            [key]: { ...prev[key], position: prev[targetKey].position },
            [targetKey]: { ...prev[targetKey], position: prev[key].position }
        }));
    };

    const [newFieldKey, setNewFieldKey] = useState('');
    const [newFieldLabel, setNewFieldLabel] = useState('');

    const addNewField = () => {
        if (!newFieldKey.trim()) return;
        const maxPos = Math.max(...Object.values(customFields).map((f: FieldConfig) => f.position), 0);
        setCustomFields(prev => ({
            ...prev,
            [newFieldKey]: { position: maxPos + 1, isEnabled: true, label: newFieldLabel || newFieldKey }
        }));
        setNewFieldKey('');
        setNewFieldLabel('');
    };

    const removeField = (key: string) => {
        const newFields = { ...customFields };
        delete newFields[key];
        setCustomFields(newFields);
    };

    // Save Handler
    const handleSave = async () => {
        setErrors({});
        const newErrors: typeof errors = {};
        if (!name.trim()) newErrors.name = 'Required';
        if (!value.trim()) newErrors.value = 'Required';
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setIsSaving(true);
        try {
            const requestData = {
                DomainID: container?.uuid,
                ConfigurationName: name,
                ReturnType: displayType === 'popup' ? ReturnType.POPUP : ReturnType.INLINE_INJECTION,
                OperatorId: operatorId,
                Value: value,
                DelayedDuration: delayDuration,
                IsEnabled: true,
                LayoutJson: { ...layoutJson, displayMode: displayType },
                StyleJson: styleJson,
                CustomizingFields: customFields
            };
            
            if (mode === 'create') await returnMethodApi.create(requestData as any);
            navigate('/dashboard/recommendation-display');
        } catch (error) {
            console.error(error);
            setErrors({ general: 'Failed to save.' });
        } finally {
            setIsSaving(false);
        }
    };

    // --- UI CONFIG PANELS ---
    const renderPopupConfigPanel = () => (
        <div className={styles.formContent}>
             <div className={styles.formGroup}>
                <div className={styles.sectionLabelWithIcon}>
                    <Layers size={16} className="text-gray-500"/>
                    <label className={styles.sectionLabel}>Popup Layout</label>
                </div>
                
                <div className={styles.formRow}>
                     <div className={styles.formCol}>
                        <label className={styles.inputLabel}>Overlay Backdrop</label>
                        <div className={styles.toggleWrapper}>
                            <label className={styles.statusToggle}>
                                <input 
                                    type="checkbox"
                                    checked={layoutJson.wrapper?.popup?.overlay ?? true}
                                    onChange={(e) => updatePopupWrapper('overlay', e.target.checked)}
                                    disabled={isReadOnly}
                                />
                                <span className={styles.toggleSlider}></span>
                                <span className={styles.toggleLabel}>Enable Overlay</span>
                            </label>

                            {(layoutJson.wrapper?.popup?.overlay ?? true) && (
                                <input 
                                    type="color" className={styles.colorPickerFull} style={{width: '60px'}}
                                    value={styleJson.tokens.colors.overlay?.slice(0, 7) || '#000000'}
                                    onChange={(e) => updateColorToken('overlay', e.target.value)}
                                    disabled={isReadOnly}
                                />
                            )}
                        </div>
                    </div>
                    <div className={styles.formCol}>
                        <label className={styles.inputLabel}>Popup Delay (sec)</label>
                        <input 
                            type="number" className={styles.textInput}
                            value={delayDuration}
                            onChange={(e) => setDelayDuration(Number(e.target.value))}
                            disabled={isReadOnly}
                        />
                    </div>
                </div>

                <div className={`${styles.formRow} ${styles.marginTopSm}`}>
                    <div className={styles.formCol}>
                        <label className={styles.inputLabel}>Position</label>
                        <select 
                            className={styles.selectInput}
                            value={layoutJson.wrapper?.popup?.position}
                            onChange={(e) => updatePopupWrapper('position', e.target.value)}
                            disabled={isReadOnly}
                        >
                            <option value="center">Center (Modal)</option>
                            <option value="bottom-right">Bottom Right</option>
                            <option value="bottom-left">Bottom Left</option>
                            <option value="top-center">Top Banner</option>
                        </select>
                    </div>
                    <div className={styles.formCol}>
                        <label className={styles.inputLabel}>Width (px)</label>
                        <input 
                            type="number" className={styles.textInput}
                            value={layoutJson.wrapper?.popup?.width}
                            onChange={(e) => updatePopupWrapper('width', Number(e.target.value))}
                            disabled={isReadOnly}
                        />
                    </div>
                </div>
            </div>
        </div>
    );

    const renderInlineConfigPanel = () => (
        <div className={styles.formContent}>
             <div className={styles.formGroup}>
                <div className={styles.sectionLabelWithIcon}>
                    <Monitor size={16} className="text-gray-500"/>
                    <label className={styles.sectionLabel}>Inline Settings</label>
                </div>
                <div className={styles.formRow}>
                    <div className={styles.formCol}>
                        <label className={styles.inputLabel}>Target Selector <span className={styles.required}>*</span></label>
                        <input 
                            type="text" className={styles.textInput}
                            placeholder="#product-recommendations"
                            value={layoutJson.wrapper?.inline?.selector || ''}
                            onChange={(e) => updateInlineWrapper('selector', e.target.value)}
                            disabled={isReadOnly}
                        />
                    </div>
                    <div className={styles.formCol}>
                        <label className={styles.inputLabel}>Injection Mode</label>
                        <select 
                            className={styles.selectInput}
                            value={layoutJson.wrapper?.inline?.injectionMode}
                            onChange={(e) => updateInlineWrapper('injectionMode', e.target.value)}
                            disabled={isReadOnly}
                        >
                            <option value="append">Append (Bottom)</option>
                            <option value="prepend">Prepend (Top)</option>
                            <option value="replace">Replace</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderFieldInstructions = () => {
        return (
            <div className={styles.instructionBox}>
                <div className={styles.instructionHeader}>
                    <BookOpen size={30} />
                    <span>Field Configuration Instructions:</span>
                </div>

                <div className={styles.stepList}>
                    <div className={styles.stepItem}>
                        <span className={styles.stepLabel}>Step 1:</span>
                        Enter the data identifier in the <b>Key</b> field.
                        <span className={styles.subNote}>
                            This is the technical name from your system (e.g., <span className={styles.codeTag}>price</span>, <span className={styles.codeTag}>discount_rate</span>).
                            <br/>⚠️ <b>Note:</b> Consult your IT team if unsure. Do not modify this value arbitrarily.
                        </span>
                    </div>
                    <div className={styles.stepItem}>
                        <span className={styles.stepLabel}>Step 2:</span>
                        Set the display name in the <b>Label</b> field.
                        <span className={styles.subNote}>
                            This is the text customers will see (e.g., change "price" to <span className={styles.codeTag}>Giá Sốc</span>).
                            <br/>You can write in Vietnamese, add icons, or leave it blank as needed.
                        </span>
                    </div>
                    <div className={styles.stepItem}>
                        <span className={styles.stepLabel}>Step 3:</span>
                        Use the arrow keys <span className={styles.codeTag}>↑</span> <span className={styles.codeTag}>↓</span> to sort the order of appearance on the card.
                    </div>
                    <div className={styles.stepItem}>
                        <span className={styles.stepLabel}>Step 4:</span>
                        Look at the <b>Live Preview</b> panel at the bottom to check the result immediately.
                    </div>
                </div>
            </div>
        );
    };

    const renderStyleConfigPanel = () => {
        const currentDensity = styleJson.tokens.densityBySize[styleJson.size || 'md'];

        return (
            <div className={`${styles.formContent} ${styles.separatorTop}`}>
                <h3 className={styles.sectionTitle}>Design & Appearance</h3>
                
                {/* Global Theme */}
                <div className={styles.formGroup}>
                    <label className={styles.fieldLabel}>Global Theme</label>
                    <div className={styles.formRow}>
                        <div className={styles.formCol}>
                            <label className={styles.inputLabel}>Widget Theme</label>
                            <select 
                                className={styles.selectInput}
                                value={styleJson.theme}
                                onChange={(e) => setStyleJson(prev => ({ ...prev, theme: e.target.value as 'light' | 'dark' }))}
                                disabled={isReadOnly}
                            >
                                <option value="light">Light Mode</option>
                                <option value="dark">Dark Mode</option>
                            </select>
                        </div>
                        <div className={styles.formCol}>
                            <label className={styles.inputLabel}>Base Size (Density)</label>
                            <select 
                                className={styles.selectInput}
                                value={styleJson.size}
                                onChange={(e) => setStyleJson(prev => ({ ...prev, size: e.target.value as 'sm' | 'md' | 'lg' }))}
                                disabled={isReadOnly}
                            >
                                <option value="sm">Small (Compact)</option>
                                <option value="md">Medium (Standard)</option>
                                <option value="lg">Large (Spacious)</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Typography */}
                <div className={styles.formGroup}>
                    <label className={styles.fieldLabel}>Typography</label>
                    <div className={styles.formRow}>
                        <div className={styles.formCol}>
                            <label className={styles.inputLabel}>Font Family</label>
                            <select 
                                className={styles.selectInput}
                                value={styleJson.tokens.typography.fontFamily}
                                onChange={(e) => updateTypography('fontFamily' as any, '', e.target.value)}
                                disabled={isReadOnly}
                            >
                                <option value="Inter, sans-serif">Inter</option>
                                <option value="Arial, sans-serif">Arial</option>
                                <option value="'Times New Roman', serif">Times New Roman</option>
                                <option value="inherit">Inherit from Site</option>
                            </select>
                        </div>
                    </div>

                    <div className={styles.typographyList}>
                        {['title', 'body', 'label'].map((type) => {
                            const typoConfig = styleJson.tokens.typography[type as keyof typeof styleJson.tokens.typography] as any;
                            if (!typoConfig || typeof typoConfig !== 'object') return null;

                            return (
                                <div key={type} className={styles.typographyItem}>
                                    <div className={styles.typographyItemHeader}>{type} Style</div>
                                    <div className={styles.typographyItemGrid}>
                                        <div>
                                            <label className={styles.tinyLabel}>Size (px)</label>
                                            <input type="number" className={`${styles.textInput} ${styles.tinyInput}`}
                                                value={typoConfig.fontSize}
                                                onChange={(e) => updateTypography(type as any, 'fontSize', Number(e.target.value))}
                                            />
                                        </div>
                                        <div>
                                            <label className={styles.tinyLabel}>Weight</label>
                                            <select className={`${styles.selectInput} ${styles.tinyInput}`}
                                                value={typoConfig.fontWeight}
                                                onChange={(e) => updateTypography(type as any, 'fontWeight', Number(e.target.value))}
                                            >
                                                <option value="400">Regular</option>
                                                <option value="500">Medium</option>
                                                <option value="600">Semibold</option>
                                                <option value="700">Bold</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className={styles.tinyLabel}>Height</label>
                                            <input type="number" step="0.1" className={`${styles.textInput} ${styles.tinyInput}`}
                                                value={typoConfig.lineHeight}
                                                onChange={(e) => updateTypography(type as any, 'lineHeight', Number(e.target.value))}
                                            />
                                        </div>
                                        <input type="color" className={styles.colorPickerFull}
                                            value={styleJson.tokens.colors[type === 'title' ? 'textPrimary' : 'textSecondary'] || '#000000'}
                                            onChange={(e) => updateColorToken(type === 'title' ? 'textPrimary' : 'textSecondary', e.target.value)}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Colors */}
                <div className={styles.formGroup}>
                    <label className={styles.fieldLabel}>Color Palette</label>
                    <div className={styles.formRow}>
                        {['surface', 'border', 'primary'].map(colorKey => (
                             <div className={styles.formCol} key={colorKey}>
                                <label className={styles.inputLabel}>{colorKey.charAt(0).toUpperCase() + colorKey.slice(1)}</label>
                                <div className={styles.colorSwatchWrapper}>
                                    <input type="color" 
                                        value={styleJson.tokens.colors[colorKey as keyof typeof styleJson.tokens.colors] as string} 
                                        onChange={(e) => updateColorToken(colorKey, e.target.value)} 
                                    />
                                    <span className={styles.helperText}>{styleJson.tokens.colors[colorKey as keyof typeof styleJson.tokens.colors]}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Spacing & Dimensions */}
                <div className={styles.formGroup}>
                    <label className={styles.fieldLabel}>Spacing & Dimensions ({styleJson.size})</label>
                    <div className={styles.formRow}>
                         <div className={styles.formCol}>
                            <label className={styles.inputLabel}>Card Padding: {currentDensity.cardPadding}px</label>
                            <input type="range" min="4" max="32" step="2" className={styles.rangeInput}
                                value={currentDensity.cardPadding}
                                onChange={(e) => updateDensity('cardPadding', Number(e.target.value))}
                            />
                        </div>
                        <div className={styles.formCol}>
                            <label className={styles.inputLabel}>Item Gap: {currentDensity.rowGap}px</label>
                            <input type="range" min="4" max="24" step="2" className={styles.rangeInput}
                                value={currentDensity.rowGap}
                                onChange={(e) => updateDensity('rowGap', Number(e.target.value))}
                            />
                        </div>
                    </div>
                    <div className={styles.formRow}>
                        <div className={styles.formCol}>
                            <label className={styles.inputLabel}>Corner Radius: {styleJson.tokens.radius.card}px</label>
                            <input type="range" min="0" max="24" step="2" className={styles.rangeInput}
                                value={styleJson.tokens.radius.card}
                                onChange={(e) => updateRadius('card', Number(e.target.value))}
                            />
                        </div>
                        <div className={styles.formCol}>
                            <label className={styles.inputLabel}>Shadow</label>
                            <select className={styles.selectInput}
                                value={styleJson.tokens.shadow.card}
                                onChange={(e) => updateShadow('card', e.target.value)}
                            >
                                <option value="none">None</option>
                                <option value="0 1px 3px rgba(0,0,0,0.1)">Light</option>
                                <option value="0 4px 6px rgba(0,0,0,0.1)">Medium</option>
                                <option value="0 10px 15px rgba(0,0,0,0.15)">Heavy</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderFieldsConfigPanel = () => {
        return (
            <div className={`${styles.formContent} ${styles.separatorTop}`}>
                <h3 className={styles.sectionTitle} style={{ marginBottom: '1rem' }}>
                    Data Fields Configuration
                </h3>

                {renderFieldInstructions()}
                
                <div className={styles.fieldList}>
                    {sortedFieldEntries.map(([key, config], index) => {
                        const fieldConfig = config as FieldConfig;

                        return (
                            <div key={key} className={styles.fieldItem}>
                                <button 
                                    onClick={() => toggleField(key)} 
                                    className={`${styles.checkboxButton} ${fieldConfig.isEnabled ? styles.checkboxActive : styles.checkboxInactive}`}
                                >
                                    {fieldConfig.isEnabled && <Check size={14} color="white" />}
                                </button>

                                <div className={styles.fieldInfo}>
                                    <span className={styles.fieldKey}>{key}</span>
                                    <input 
                                        type="text" 
                                        value={fieldConfig.label}
                                        onChange={(e) => updateFieldLabel(key, e.target.value)}
                                        className={`${styles.textInput} ${styles.smallInput}`}
                                        placeholder="Nhãn hiển thị"
                                    />
                                </div>

                                <div className={styles.actionButtons}>
                                    <button 
                                        onClick={() => moveField(key, 'up')} 
                                        disabled={index === 0}
                                        className={styles.actionButtonSmall}
                                        title="Move Up"
                                    >
                                        <ArrowUp size={14} />
                                    </button>
                                    <button 
                                        onClick={() => moveField(key, 'down')}
                                        disabled={index === sortedFieldEntries.length - 1}
                                        className={styles.actionButtonSmall}
                                        title="Move Down"
                                    >
                                        <ArrowDown size={14} />
                                    </button>

                                    <button 
                                            onClick={() => removeField(key)}
                                            className={styles.deleteButtonSmall}
                                            title="Remove Field"
                                        >
                                            <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}

                    <div className={styles.addFieldForm}>
                        <div style={{ flex: 1 }}>
                            <input 
                                placeholder="Key (Ex: discount_percent)" 
                                value={newFieldKey} onChange={e => setNewFieldKey(e.target.value)}
                                className={styles.textInput} 
                                style={{ marginBottom: '8px' }}
                            />
                            <input 
                                placeholder="Label (Ex: Discount)" 
                                value={newFieldLabel} onChange={e => setNewFieldLabel(e.target.value)}
                                className={styles.textInput} 
                            />
                        </div>
                        <button 
                            onClick={addNewField} 
                            className={styles.addButton} 
                            disabled={!newFieldKey.trim()}
                        >
                            <Plus size={16} /> Add
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // --- LIVE PREVIEW ---
    const renderLivePreview = () => {
        const isPopup = displayType === 'popup';
        const theme = styleJson.theme;
        const currentDensity = styleJson.tokens.densityBySize[styleJson.size || 'md'];
        const radius = styleJson.tokens.radius.card;
        const shadow = styleJson.tokens.shadow.card;
        
        const surfaceColor = styleJson.tokens.colors.surface;
        const textColor = styleJson.tokens.colors.textPrimary;
        const secondaryColor = styleJson.tokens.colors.textSecondary;
        const primaryColor = styleJson.tokens.colors.primary;
        const borderColor = styleJson.tokens.colors.border;
        const overlayColor = (layoutJson.wrapper?.popup?.overlay ?? true) 
            ? (styleJson.tokens.colors.overlay || 'rgba(0,0,0,0.5)') 
            : 'transparent';

        const typoTitle = styleJson.tokens.typography.title;
        const typoBody = styleJson.tokens.typography.body;
        const previewBg = theme === 'dark' ? '#1f2937' : '#f3f4f6';

        // Dynamic container styles
        const dynamicPreviewContainer = {
            backgroundColor: previewBg,
            fontFamily: styleJson.tokens.typography.fontFamily
        };

        const dynamicWidgetCard = {
            backgroundColor: surfaceColor,
            borderRadius: `${radius}px`,
            boxShadow: shadow === 'none' ? 'none' : shadow,
            border: `1px solid ${borderColor}`,
            padding: `${currentDensity.cardPadding}px`,
            width: isPopup ? (layoutJson.wrapper?.popup?.widthMode === 'fixed' ? `${layoutJson.wrapper?.popup?.width}px` : '90%') : '100%',
            maxWidth: isPopup ? '400px' : '100%',
            ...(isPopup && shadow === 'none' ? { filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))' } : {})
        };

        const getDynamicMockValue = (key: string) => {
            const k = key.toLowerCase();
            if (k.includes('price') || k.includes('cost')) return '$150.00';
            if (k.includes('percent') || k.includes('rate')) return '20%';
            if (k.includes('date') || k.includes('time')) return '24/12/2024';
            if (k.includes('sku') || k.includes('code')) return 'SKU-9999';
            if (k.includes('color')) return 'Blue / Red';
            if (k.includes('size')) return 'XL';
            // Mặc định
            return 'Sample Value';
        };

        const MockProduct = ({ id }: { id: number }) => {
            const activeTextFields = sortedFieldEntries.filter(([key, config]) => {
                const fieldConfig = config as FieldConfig;
                return fieldConfig.isEnabled && key !== 'image';
            });
            const showImage = customFields['image']?.isEnabled ?? true;

            return (
                <div key={id} className={styles.mockProductCard} style={{ 
                    flexDirection: layoutJson.contentMode === 'list' ? 'row' : 'column',
                    gap: `${currentDensity.rowGap}px`, 
                    borderColor: borderColor, 
                    borderRadius: `${Math.max(4, radius - 4)}px`,
                    backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : '#fff'
                }}>
                    {/* KHỐI ẢNH */}
                    {showImage && (
                        <div className={styles.mockProductImage} style={{ 
                            width: layoutJson.contentMode === 'list' ? '96px' : '100%', 
                            height: layoutJson.contentMode === 'list' ? '96px' : `${currentDensity.imageHeight}px`,
                            borderRadius: `${Math.max(2, radius - 6)}px`, 
                        }}></div>
                    )}

                    {/* KHỐI TEXT DYNAMIC */}
                    <div className={styles.mockProductContent}>
                        {activeTextFields.map(([key, config]) => {
                            const fieldConfig = config as FieldConfig;
                            
                            // 1. Xử lý các trường đặc biệt (Cần style riêng)
                            if (key === 'product_name') {
                                return (
                                    <div key={key} style={{ 
                                        fontSize: `${typoBody.fontSize}px`, 
                                        fontWeight: typoBody.fontWeight, 
                                        lineHeight: typoBody.lineHeight,
                                        color: textColor, marginBottom: '4px' 
                                    }}>
                                        {fieldConfig.label || `Product Sample ${id}`}
                                    </div>
                                );
                            }

                            if (key === 'price') {
                                return (
                                    <div key={key} style={{ fontSize: '13px', color: primaryColor, fontWeight: 'bold' }}>
                                        {fieldConfig.label ? `${fieldConfig.label}: ` : ''}$129.00
                                    </div>
                                );
                            }

                            if (key === 'rating') {
                                return (
                                    <div key={key} style={{ fontSize: '11px', color: secondaryColor, marginTop: '2px' }}>
                                        {fieldConfig.label ? `${fieldConfig.label}: ` : ''}
                                        <span style={{ color: '#fbbf24' }}>★★★★★</span> (45)
                                    </div>
                                );
                            }

                            // 2. Xử lý GENERIC (Cho tất cả các field người dùng tự thêm)
                            // Bất kể Key là gì, nó sẽ render theo format chuẩn
                            return (
                                <div key={key} style={{ 
                                    fontSize: '11px', 
                                    color: secondaryColor, 
                                    marginTop: '2px',
                                    display: 'flex',
                                    gap: '4px'
                                }}>
                                    {/* Luôn hiển thị Label (in đậm nhẹ) */}
                                    <span style={{ fontWeight: 600, opacity: 0.9 }}>
                                        {fieldConfig.label || key}:
                                    </span>
                                    
                                    {/* Giá trị giả tự sinh */}
                                    <span>{getDynamicMockValue(key)}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            );
        };

        return (
            <div className={styles.previewBox}>
                <p className={styles.previewLabel}>{isPopup ? 'Popup Preview' : 'Inline Injection Preview'}</p>
                <div className={styles.previewContainer} style={dynamicPreviewContainer}>
                    <div className={styles.previewFakeHeader}>Client Website (Background)</div>
                    <div className={styles.previewFakeBody}>
                        <div className={styles.placeholderBar} style={{ height: '30px', marginBottom: '12px', width: '60%' }}></div>
                        <div className={styles.placeholderBarSm} style={{ height: '10px', marginBottom: '8px', width: '90%' }}></div>
                        <div className={styles.placeholderBarSm} style={{ height: '10px', marginBottom: '24px', width: '80%' }}></div>
                        
                        {!isPopup && (
                            <div className={styles.widgetWrapperInline}>
                                <div className={styles.widgetCard} style={dynamicWidgetCard}>
                                    <h4 className={styles.widgetHeader} style={{ margin: '0 0 12px 0', color: textColor, fontSize: `${typoTitle.fontSize}px`, fontWeight: typoTitle.fontWeight }}>
                                        Recommended
                                    </h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: layoutJson.contentMode === 'list' ? '1fr' : '1fr 1fr', gap: '10px' }}>
                                        <MockProduct id={1} />
                                        <MockProduct id={2} />
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className={styles.placeholderBlock}></div>
                    </div>

                    {isPopup && (
                        <div className={styles.popupOverlayLayer} style={{
                            backgroundColor: overlayColor,
                            alignItems: layoutJson.wrapper?.popup?.position?.includes('center') ? 'center' : 'flex-end',
                            justifyContent: layoutJson.wrapper?.popup?.position?.includes('right') ? 'flex-end' : 
                                            layoutJson.wrapper?.popup?.position?.includes('left') ? 'flex-start' : 'center',
                            pointerEvents: (layoutJson.wrapper?.popup?.overlay ?? true) ? 'auto' : 'none'
                        }}>
                            <div className={styles.widgetCard} style={{ ...dynamicWidgetCard, pointerEvents: 'auto' }}>
                                <div className={styles.widgetHeader} style={{ borderBottom: `1px solid ${borderColor}` }}>
                                    <h4 style={{ margin: 0, color: textColor, fontSize: `${typoTitle.fontSize}px`, fontWeight: typoTitle.fontWeight }}>
                                        Recommended
                                    </h4>
                                    <span style={{ cursor: 'pointer', opacity: 0.6, color: secondaryColor }}>✕</span>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: layoutJson.contentMode === 'list' ? '1fr' : '1fr 1fr', gap: '10px' }}>
                                    <MockProduct id={1} />
                                    {layoutJson.contentMode !== 'list' && <MockProduct id={2} />}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                <p className={styles.helperText} style={{ textAlign: 'center', marginTop: '12px' }}>
                    *Preview shows layout structure and colors. Actual content will vary by product.
                </p>
            </div>
        );
    };

    return (
        <div className={styles.container}>
            <div className={styles.pageHeader}>
                <div className={styles.headerGroup}>
                    <button className={styles.closeButton} onClick={() => navigate('/dashboard/recommendation-display')}>
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className={styles.pageTitle}>
                        {mode === 'create' ? 'Create New Configuration' : 'Edit Configuration'}
                    </h1>
                </div>
            </div>

            {mode === 'create' && (
                <div className={styles.sectionCard}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>Choose Display Type</h2>
                    </div>
                    <div className={styles.displayTypeGrid}>
                        <button 
                            className={`${styles.displayTypeCard} ${displayType === 'popup' ? styles.displayTypeCardActive : ''}`}
                            onClick={() => handleTypeChange('popup')}
                            disabled={isReadOnly}
                        >
                            <Layers className={styles.displayTypeIcon} />
                            <div className={styles.displayTypeTitle}>Popup Overlay</div>
                            <div className={styles.displayTypeDescription}>Appears on top of content</div>
                        </button>
                        <button 
                            className={`${styles.displayTypeCard} ${displayType === 'inline-injection' ? styles.displayTypeCardActive : ''}`}
                            onClick={() => handleTypeChange('inline-injection')}
                            disabled={isReadOnly}
                        >
                            <Monitor className={styles.displayTypeIcon} />
                            <div className={styles.displayTypeTitle}>Inline Injection</div>
                            <div className={styles.displayTypeDescription}>Embeds into page layout</div>
                        </button>
                    </div>
                </div>
            )}

            <div className={styles.sectionCard}>
                <div className={styles.formRow}>
                    <div className={styles.formCol}>
                        <label className={styles.fieldLabel}>Configuration Name <span className={styles.required}>*</span></label>
                        <input 
                            type="text" className={`${styles.textInput} ${errors.name ? styles.inputError : ''}`}
                            value={name} onChange={e => setName(e.target.value)} 
                            disabled={isReadOnly}
                        />
                        {errors.name && <span className={styles.errorText}>{errors.name}</span>}
                    </div>
                    <div className={styles.formCol}>
                        <label className={styles.fieldLabel}>Trigger URL <span className={styles.required}>*</span></label>
                        <input 
                            type="text" className={`${styles.textInput} ${errors.value ? styles.inputError : ''}`}
                            value={value} onChange={e => setValue(e.target.value)} 
                            disabled={isReadOnly}
                        />
                        {errors.value && <span className={styles.errorText}>{errors.value}</span>}
                    </div>
                </div>
            </div>

            <div className={styles.sectionCard}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>
                        {displayType === 'popup' ? 'Popup' : 'Inline'} Customization
                    </h2>
                </div>
                
                <div className={styles.configGrid}>
                    <div>
                        {displayType === 'popup' ? renderPopupConfigPanel() : renderInlineConfigPanel()}
                        {renderFieldsConfigPanel()}
                        
                        <div className={`${styles.formRow} ${styles.separatorTop}`} style={{marginTop: '1.5rem', paddingTop: '1rem'}}>
                            <div className={styles.formCol}>
                                <label className={styles.inputLabel}>Content Layout</label>
                                <select 
                                    className={styles.selectInput}
                                    value={layoutJson.contentMode}
                                    onChange={(e) => handleLayoutModeChange(e.target.value)}
                                    disabled={isReadOnly}
                                >
                                    {LAYOUT_MODE_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {renderStyleConfigPanel()}
                    </div>

                    <div>
                        {renderLivePreview()}
                    </div>
                </div>
            </div>

            {!isReadOnly && (
                <div className={styles.formActions}>
                    <button className={styles.cancelButton} onClick={() => navigate('/dashboard/recommendation-display')}>
                        Cancel
                    </button>
                    <button className={styles.saveButton} onClick={handleSave} disabled={isSaving}>
                        <Save size={18} />
                        {isSaving ? 'Saving...' : 'Save Configuration'}
                    </button>
                </div>
            )}
            
            {errors.general && (
                <div className={styles.errorAlert} style={{ marginTop: '1rem' }}>{errors.general}</div>
            )}
        </div>
    );
};