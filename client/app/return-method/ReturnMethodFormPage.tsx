import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Container } from '../../types';
import { Save, X, Layers, Monitor, Puzzle, ArrowLeft, ArrowUp, ArrowDown, Trash2, Plus, Check, BookOpen, Settings, Image, Droplet, DropletOff } from 'lucide-react';
import styles from './returnMethodPage.module.css';
import { DisplayType, LayoutJson, StyleJson, CustomizingFields, FieldConfig } from './types';
import { useDataCache } from '../../contexts/DataCacheContext';
import { returnMethodApi } from '../../lib/api/return-method';
import { searchInputApi } from '../../lib/api/search-input';
import { ReturnType, SearchInputResponse } from '../../lib/api/types';
import { DEFAULT_POPUP_LAYOUT, DEFAULT_INLINE_LAYOUT, DEFAULT_STYLE_CONFIG, LAYOUT_MODE_OPTIONS, DARK_MODE_COLORS } from './returnMethodDefaults';

interface ReturnMethodFormPageProps {
    container: Container | null;
    mode: 'create' | 'edit' | 'view';
}

const DEFAULT_CUSTOM_FIELDS: CustomizingFields = {
    fields: [
        { key: "image", position: 0, isEnabled: true },
        { key: "item_name", position: 1, isEnabled: true },
        { key: "category", position: 2, isEnabled: true },
        { key: "description", position: 3, isEnabled: true }
    ]
};

export const ReturnMethodFormPage: React.FC<ReturnMethodFormPageProps> = ({ container, mode }) => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isReadOnly = mode === 'view';
    
    // --- STATE ---
    const [displayType, setDisplayType] = useState<DisplayType>('popup');
    const [name, setName] = useState('');
    const [value, setValue] = useState('');
    
    // Advanced Mode Switch
    const [isFieldCustomizationEnabled, setIsFieldCustomizationEnabled] = useState(false);
    const [isCustomizationEnabled, setIsCustomizationEnabled] = useState(false);

    // Floating Preview State
    const [showFloatingPreview, setShowFloatingPreview] = useState(false);

    // Custom Widget fields
    const [layoutStyle, setLayoutStyle] = useState('grid');
    const [theme, setTheme] = useState('light');
    const [spacing, setSpacing] = useState('medium');
    const [size, setSize] = useState('large');
    
    // Popup fields
    const [isSaving, setIsSaving] = useState(false);
    
    // Search keyword signals
    const [enableSearchKeyword, setEnableSearchKeyword] = useState(false);
    const [selectedSearchConfigId, setSelectedSearchConfigId] = useState<number | null>(null);
    const [searchInputConfigs, setSearchInputConfigs] = useState<SearchInputResponse[]>([]);
    
    // Available attributes for custom fields
    const [availableAttributes, setAvailableAttributes] = useState<string[]>([]);
    const [showImage, setShowImage] = useState(true);
    const [expandedFieldKey, setExpandedFieldKey] = useState<string | null>(null);
    
    // Error states
    const [errors, setErrors] = useState<{
        name?: string;
        value?: string;
        general?: string;
    }>({});
    
    // --- CONFIG STATE ---
    const [layoutJson, setLayoutJson] = useState<LayoutJson>(DEFAULT_POPUP_LAYOUT);
    const [styleJson, setStyleJson] = useState<StyleJson>(DEFAULT_STYLE_CONFIG);
    const [customFields, setCustomFields] = useState<CustomizingFields>({ fields: [] });
    const [delayedDuration, setDelayedDuration] = useState<number>(0);

    // Generate default custom fields based on available attributes
    const defaultCustomFields = useMemo(() => {
        if (availableAttributes.length === 0) {
            return { fields: [] };
        }

        // Priority mapping for common fields
        const priorityFields = [
            { apiName: 'ImageUrl', key: 'image_url' },
            { apiName: 'Title', key: 'title' },
            { apiName: 'Categories', key: 'categories' },
            { apiName: 'Description', key: 'description' }
        ];

        const fields: FieldConfig[] = [];
        let position = 0;

        // Add priority fields first if they exist in available attributes
        priorityFields.forEach(({ apiName, key }) => {
            if (availableAttributes.includes(apiName)) {
                fields.push({
                    key,
                    position,
                    isEnabled: true
                });
                position++;
            }
        });

        // Add remaining attributes
        availableAttributes.forEach(attr => {
            const existingPriorityField = priorityFields.find(pf => pf.apiName === attr);
            if (!existingPriorityField) {
                fields.push({
                    key: attr.toLowerCase().replace(/\s+/g, '_'),
                    position,
                    isEnabled: true
                });
                position++;
            }
        });

        return { fields };
    }, [availableAttributes]);

    useEffect(() => {
        if (customFields['image_url']?.isEnabled) {
            setShowImage(true);
        }
    }, [customFields]);

    // Initialize custom fields when default fields are available
    useEffect(() => {
        if (defaultCustomFields.fields.length > 0 && customFields.fields.length === 0) {
            setCustomFields(defaultCustomFields);
        }
    }, [defaultCustomFields, customFields.fields.length]);

    // Get cached data from context
    const { 
        clearReturnMethodsByDomain,
        getSearchInputsByDomain,
        setSearchInputsByDomain,
        getReturnMethodsByDomain
    } = useDataCache();

    // Trong file ReturnMethodFormPage.tsx

    useEffect(() => {
        if (mode === 'create' || !id || !container?.uuid) return;

        const loadData = async () => {
            let methods = getReturnMethodsByDomain(container.uuid);
            if (!methods) {
                try {
                    methods = await returnMethodApi.getByDomainKey(container.uuid);
                } catch (err) {
                    console.error("Failed to load data", err);
                    return;
                }
            }
            const foundItem = methods?.find(m => String(m.Id) === String(id));
            if (foundItem) {
                const rawItem = foundItem as any;
                setName(rawItem.ConfigurationName);
                setValue(rawItem.Value);
                setDisplayType(rawItem.ReturnType === 'POPUP' ? 'popup' : 'inline-injection');
                setDelayedDuration(rawItem.DelayDuration || 0); 

                const mappedLayout = rawItem.Layout || rawItem.LayoutJson;
                if (mappedLayout) setLayoutJson(mappedLayout);
                const mappedStyle = rawItem.Style || rawItem.StyleJson;
                if (mappedStyle) setStyleJson(mappedStyle);

                const rawCustomizing = rawItem.Customizing || rawItem.CustomizingFields;
                if (rawCustomizing) {
                    if (Array.isArray(rawCustomizing)) {
                        setCustomFields({ fields: rawCustomizing });
                    } else {
                        setCustomFields(rawCustomizing); 
                    }
                }

                if (rawItem.SearchKeywordConfigId) {
                    setEnableSearchKeyword(true);
                    setSelectedSearchConfigId(rawItem.SearchKeywordConfigId);
                }

                const hasFieldOverrides = mappedStyle?.components?.fieldRow?.overrides 
                    && Object.keys(mappedStyle.components.fieldRow.overrides).length > 0;
                
                if (hasFieldOverrides) {
                    setIsFieldCustomizationEnabled(true);
                }
                const isThemeChanged = mappedStyle?.theme && mappedStyle.theme !== 'light'; 
                const isLayoutChanged = mappedLayout?.contentMode && mappedLayout.contentMode !== 'grid';
                const defaultPrimary = DEFAULT_STYLE_CONFIG.tokens.colors.primary;
                const currentPrimary = mappedStyle?.tokens?.colors?.primary;
                const isColorChanged = currentPrimary && currentPrimary !== defaultPrimary;
                let isWrapperChanged = false;
                if (rawItem.ReturnType === 'POPUP') {
                    const popup = mappedLayout?.wrapper?.popup;
                    if (popup) {
                        if (popup.position !== 'bottom-right') isWrapperChanged = true;
                        if (popup.width !== 500) isWrapperChanged = true;
                        if (popup.widthMode !== 'fixed') isWrapperChanged = true;
                    }
                    if ((rawItem.DelayDuration || rawItem.Duration || 0) > 0) isWrapperChanged = true;
                } else {
                    const inline = mappedLayout?.wrapper?.inline;
                    if (inline) {
                        if (inline.selector !== '#recommendation-slot') isWrapperChanged = true;
                        if (inline.injectionMode !== 'append') isWrapperChanged = true;
                    }
                }

                if (isThemeChanged || isLayoutChanged || isColorChanged || isWrapperChanged) {
                    setIsCustomizationEnabled(true);
                }
            } else {
                console.warn("Item not found in cache/api for ID:", id);
            }
        };

        loadData();
    }, [id, container?.uuid, mode]);

    // Fetch search input configurations
    useEffect(() => {
        const fetchSearchInputs = async () => {
            if (!container?.uuid) return;
            
            // Check cache first
            const cachedSearchInputs = getSearchInputsByDomain(container.uuid);
            if (cachedSearchInputs) {
                setSearchInputConfigs(cachedSearchInputs);
                return;
            }

            // Fetch from API if not in cache
            try {
                const response = await searchInputApi.getByDomainKey(container.uuid);
                setSearchInputsByDomain(container.uuid, response);
                setSearchInputConfigs(response);
            } catch (error) {
                console.error('Failed to fetch search inputs:', error);
                setSearchInputConfigs([]);
            }
        };

        fetchSearchInputs();
    }, [container?.uuid, getSearchInputsByDomain, setSearchInputsByDomain]);


    // Fetch available attributes for custom fields
    useEffect(() => {
        const fetchAttributes = async () => {
            if (!container?.uuid) return;

            try {
                const attributes = await returnMethodApi.getItemAttributes(container.uuid);
                console.log(attributes);
                setAvailableAttributes(attributes);
            } catch (error) {
                console.error('Failed to fetch item attributes:', error);
                setAvailableAttributes([]);
            }
        };

        fetchAttributes();
    }, [container?.uuid]);

    const sortedFields = useMemo(() => {
        return [...customFields.fields].sort((a, b) => a.position - b.position);
    }, [customFields]);
    
    // --- HANDLERS ---
    const handleTypeChange = (type: DisplayType) => {
        if (isReadOnly) return;
        setDisplayType(type);
        if (type === 'popup') setLayoutJson(DEFAULT_POPUP_LAYOUT);
        else setLayoutJson(DEFAULT_INLINE_LAYOUT);
    };

    const handleUpdateFieldStyle = (fieldKey: string, property: 'fontSize' | 'fontWeight' | 'color', value: any) => {
        setStyleJson(prev => ({
            ...prev,
            components: {
                ...prev.components,
                fieldRow: {
                    ...prev.components.fieldRow,
                    overrides: {
                        ...prev.components.fieldRow.overrides,
                        [fieldKey]: {
                            ...(prev.components.fieldRow.overrides?.[fieldKey] || {}),
                            [property]: value
                        }
                    }
                }
            }
        }));
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
    const toggleField = (targetKey: string) => {
        setCustomFields(prev => ({
            fields: prev.fields.map(f => 
                f.key === targetKey ? { ...f, isEnabled: !f.isEnabled } : f
            )
        }));
    };

    const moveField = (targetKey: string, direction: 'up' | 'down') => {
        setCustomFields(prev => {
            const sortedList = [...prev.fields]
                .sort((a, b) => a.position - b.position)
                .map(field => ({ ...field })); 
            const index = sortedList.findIndex(f => f.key === targetKey);
            if (index === -1) return prev;
            const targetIndex = direction === 'up' ? index - 1 : index + 1;
            if (targetIndex === 0 || targetIndex >= sortedList.length) return prev;
            const temp = sortedList[index];
            sortedList[index] = sortedList[targetIndex];
            sortedList[targetIndex] = temp;
            const reindexedList = sortedList.map((field, i) => ({
                ...field,
                position: i
            }));
            return { fields: reindexedList };
        });
    };

    const [newFieldKey, setNewFieldKey] = useState('');

    const addNewField = () => {
        if (!newFieldKey.trim()) return;
        if (customFields.fields.some(f => f.key === newFieldKey)) {
            alert("Key already exists.");
            return;
        }
        const maxPos = Math.max(...customFields.fields.map(f => f.position), 0);
        setCustomFields(prev => ({
            fields: [
                ...prev.fields,
                { key: newFieldKey, position: maxPos + 1, isEnabled: true }
            ]
        }));
        setNewFieldKey('');
    };

    const removeField = (targetKey: string) => {
        setCustomFields(prev => ({
            fields: prev.fields.filter(f => f.key !== targetKey)
        }));
    };

    const handleCancel = () => {
        navigate('/dashboard/recommendation-display');
    };
    
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
            const requestData: any = {
                Key: container.uuid,
                Id: parseInt(id),
                ConfigurationName: name,
                ReturnType: displayType === 'popup' ? ReturnType.POPUP : ReturnType.INLINE_INJECTION,
                Value: value,
                Duration: delayedDuration,
                LayoutJson: { ...layoutJson, displayMode: displayType },
                StyleJson: styleJson,
                CustomizingFields: customFields.fields,
                DelayDuration: delayedDuration || 0
            };

            // Add SearchKeywordConfigId if enabled and selected
            if (enableSearchKeyword && selectedSearchConfigId) {
                requestData.SearchKeywordConfigId = selectedSearchConfigId;
            }

            if (mode === 'create') await returnMethodApi.create(requestData);
            else if (mode === 'edit') await returnMethodApi.edit(requestData);
            // Clear cache để trang danh sách sẽ fetch lại data mới
            clearReturnMethodsByDomain(container.uuid);
            navigate('/dashboard/recommendation-display');
        } catch (error) {
            console.error(error);
            setErrors({ general: 'Failed to save.' });
        } finally {
            setIsSaving(false);
        }
    };

    // --- UI CONFIG PANELS ---

    const renderPopupConfigPanel = () => {
        return (
            <div className={styles.formContent}>
                <div className={styles.formGroup}>
                    {/* 3. Popup Delay - Bị khóa theo isPopupSettingsDisabled */}
                    {isCustomizationEnabled && (
                        <>
                            <div className={styles.sectionLabelWithIcon} style={{ marginBottom: 0 }}>
                                <Layers size={16} className="text-gray-500"/>
                                <label className={styles.sectionLabel}>Popup Layout</label>
                            </div>
                            <div className={styles.formRow}>
                                <div className={styles.formCol}>
                                    <label className={styles.inputLabel}>Popup Delay (sec)</label>
                                    <input 
                                        type="number" className={styles.textInput}
                                        value={delayedDuration}
                                        onChange={(e) => setDelayedDuration(Number(e.target.value))}
                                        disabled={isReadOnly}
                                    />
                                </div>
                            </div>

                            {/* 4. Position & Width - Bị khóa theo isPopupSettingsDisabled */}
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
                        </>
                    )}
                </div> 
            </div>
        );
    };

    const renderFieldInstructions = () => {
        return (
            <div className={styles.instructionBox}>
                <div className={styles.instructionHeader}>
                    <BookOpen size={25} />
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
                                onChange={(e) => {
                                    const newTheme = e.target.value as 'light' | 'dark';
                                    const newColors = newTheme === 'dark' ? DARK_MODE_COLORS  : DEFAULT_STYLE_CONFIG.tokens.colors;
                                    setStyleJson(prev => ({
                                        ...prev,
                                        theme: newTheme,
                                        tokens: {
                                            ...prev.tokens,
                                            colors: {
                                                ...prev.tokens.colors,
                                                ...newColors 
                                            }
                                        }
                                    }));
                                }}
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

                {/* Typography (Đã rút gọn) */}
                <div className={styles.formGroup}>
                    <label className={styles.fieldLabel}>Typography</label>
                    
                    <div className={styles.typographyList}>
                        {['title'].map((type) => {
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
                                                disabled={isReadOnly}
                                            />
                                        </div>
                                        <div>
                                            <label className={styles.tinyLabel}>Weight</label>
                                            <select className={`${styles.selectInput} ${styles.tinyInput}`}
                                                value={typoConfig.fontWeight}
                                                onChange={(e) => updateTypography(type as any, 'fontWeight', Number(e.target.value))}
                                                disabled={isReadOnly}
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
                                                disabled={isReadOnly}
                                            />
                                        </div>
                                        <input type="color" className={styles.colorPickerFull}
                                            value={styleJson.tokens.colors['textPrimary'] || '#000000'}
                                            onChange={(e) => updateColorToken('textPrimary', e.target.value)}
                                            disabled={isReadOnly}
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
                        {['surface', 'border'].map(colorKey => {
                            const currentColor = styleJson.tokens.colors[colorKey as keyof typeof styleJson.tokens.colors] as string;
                            const isTransparent = currentColor === 'transparent';

                            return (
                                <div className={styles.formCol} key={colorKey}>
                                    <label className={styles.inputLabel}>{colorKey.charAt(0).toUpperCase() + colorKey.slice(1)}</label>
                                    
                                    <div className={styles.colorSwatchWrapper}>
                                        {/* 1. Ô Input Color */}
                                        <input 
                                            type="color" 
                                            value={isTransparent ? '#ffffff' : currentColor} 
                                            onChange={(e) => updateColorToken(colorKey, e.target.value)} 
                                            disabled={isReadOnly || isTransparent}
                                            style={{ 
                                                opacity: isTransparent ? 0.3 : 1, 
                                                cursor: isTransparent ? 'not-allowed' : 'pointer'
                                            }}
                                        />

                                        {/* 2. Nút Transparent mới (Hình tròn) */}
                                        <button
                                            onClick={() => {
                                                if (isTransparent) {
                                                    updateColorToken(colorKey, styleJson.theme === 'dark' ? '#1F2937' : '#FFFFFF');
                                                } else {
                                                    updateColorToken(colorKey, 'transparent');
                                                }
                                            }}
                                            className={`${styles.iconButton} ${isTransparent ? styles.iconButtonActive : ''}`}
                                            title={isTransparent ? "Remove Transparency" : "Set Transparent"}
                                            disabled={isReadOnly}
                                        >
                                            {isTransparent ? <DropletOff size={16} /> : <Droplet size={16} />}
                                        </button>
                                    </div>
                                    <span className={styles.helperText} style={{ fontSize: '10px', marginTop: '4px' }}>
                                        {currentColor}
                                    </span>
                                </div>
                            );
                        })}
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
                                disabled={isReadOnly}
                            />
                        </div>
                        <div className={styles.formCol}>
                            <label className={styles.inputLabel}>Item Gap: {currentDensity.rowGap}px</label>
                            <input type="range" min="4" max="24" step="2" className={styles.rangeInput}
                                value={currentDensity.rowGap}
                                onChange={(e) => updateDensity('rowGap', Number(e.target.value))}
                                disabled={isReadOnly}
                            />
                        </div>
                    </div>
                    <div className={styles.formRow}>
                        <div className={styles.formCol}>
                            <label className={styles.inputLabel}>Corner Radius: {styleJson.tokens.radius.card}px</label>
                            <input type="range" min="0" max="24" step="2" className={styles.rangeInput}
                                value={styleJson.tokens.radius.card}
                                onChange={(e) => updateRadius('card', Number(e.target.value))}
                                disabled={isReadOnly}
                            />
                        </div>
                        <div className={styles.formCol}>
                            <label className={styles.inputLabel}>Shadow</label>
                            <select className={styles.selectInput}
                                value={styleJson.tokens.shadow.card}
                                onChange={(e) => updateShadow('card', e.target.value)}
                                disabled={isReadOnly}
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
            <div className={`${styles.formContent}`}>
                {renderFieldInstructions()}
                <div className={styles.formRow} style={{ marginTop: '0.5rem' }}>
                    <div className={styles.helperBox}>
                        When Advanced is enabled, you are allowed to customize style of each field. Click the <Settings className={styles.settingIcon}></Settings> button to open up customization panel. 
                    </div>
                </div>
                
                <div className={styles.fieldList}>
                    {sortedFields.map((fieldConfig, index) => {
                        const isExpanded = expandedFieldKey === fieldConfig.key;
                        const currentStyle = styleJson.components.fieldRow.overrides?.[fieldConfig.key] || {};

                        return (
                            <div key={fieldConfig.key} className={styles.fieldItemWrapper}>
                                <div className={styles.fieldItemHeader}>
                                    <button 
                                        onClick={() => toggleField(fieldConfig.key)} 
                                        className={`${styles.checkboxButton} ${fieldConfig.isEnabled ? styles.checkboxActive : styles.checkboxInactive}`}
                                        disabled={isReadOnly}
                                        style={{ opacity: isReadOnly ? 0.6 : 1, cursor: isReadOnly ? 'not-allowed' : 'pointer' }}
                                    >
                                        {fieldConfig.isEnabled && <Check size={14} color="white" />}
                                    </button>

                                    <div className={styles.fieldInfo}>
                                        <span className={styles.fieldKey}>{index + 1}. {fieldConfig.key}</span>
                                    </div>

                                    <div className={styles.actionButtons}>
                                        {/* Nút Settings*/}
                                        {isFieldCustomizationEnabled && !fieldConfig.key.includes('image') && (
                                            <button
                                                onClick={() => setExpandedFieldKey(isExpanded ? null : fieldConfig.key)}
                                                className={`${styles.settingsButton} ${isExpanded ? styles.settingsButtonActive : ''}`}
                                                title="Customize Style"
                                            >
                                                <Settings size={14} />
                                            </button>
                                        )}

                                        {!isReadOnly && !fieldConfig.key.includes('image') && (
                                            <>
                                                <button 
                                                    onClick={() => moveField(fieldConfig.key, 'up')} 
                                                    disabled={index <= 1} 
                                                    className={styles.actionButtonSmall}>
                                                    <ArrowUp size={14} />
                                                </button>
                                                <button 
                                                    onClick={() => moveField(fieldConfig.key, 'down')} 
                                                    disabled={index === sortedFields.length - 1} 
                                                    className={styles.actionButtonSmall}>
                                                    <ArrowDown size={14} />
                                                </button>
                                                <button 
                                                onClick={() => removeField(fieldConfig.key)} 
                                                className={styles.deleteButtonSmall}>
                                                    <Trash2 size={14} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Phần Style Panel: CHỈ HIỆN KHI EXPAND */}
                                {isExpanded && isFieldCustomizationEnabled && !fieldConfig.key.includes('image') && (
                                    <div className={styles.fieldStylePanel}>
                                        <div className={styles.styleInputGroup}>
                                            <label className={styles.styleInputLabel}>Font Size (px)</label>
                                            <input 
                                                type="number" 
                                                className={styles.styleInputSmall}
                                                placeholder="18"
                                                value={currentStyle.fontSize || ''}
                                                onChange={(e) => handleUpdateFieldStyle(fieldConfig.key, 'fontSize', Number(e.target.value))}
                                                disabled={isReadOnly}
                                            />
                                        </div>
                                        <div className={styles.styleInputGroup}>
                                            <label className={styles.styleInputLabel}>Font Weight</label>
                                            <select 
                                                className={styles.styleInputSmall}
                                                value={currentStyle.fontWeight || ''}
                                                onChange={(e) => handleUpdateFieldStyle(fieldConfig.key, 'fontWeight', Number(e.target.value))}
                                                disabled={isReadOnly}
                                            >
                                                <option value="400">Regular</option>
                                                <option value="500">Medium</option>
                                                <option value="600">Semibold</option>
                                                <option value="700">Bold</option>
                                            </select>
                                        </div>
                                        <div className={styles.styleInputGroup}>
                                            <label className={styles.styleInputLabel}>Text Color</label>
                                            <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                                                <input 
                                                    type="color" 
                                                    className={styles.styleColorInput}
                                                    value={currentStyle.color || '#000000'}
                                                    onChange={(e) => handleUpdateFieldStyle(fieldConfig.key, 'color', e.target.value)}
                                                    disabled={isReadOnly}
                                                />
                                                {currentStyle.color && (
                                                    <span 
                                                        style={{fontSize: '10px', cursor:'pointer', color: 'red'}} 
                                                        onClick={() => handleUpdateFieldStyle(fieldConfig.key, 'color', undefined)}
                                                        disabled={isReadOnly}
                                                    >
                                                        Clear
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {/* Add New Field */}
                    {!isReadOnly && (
                        <div className={styles.addFieldForm}>
                            <div style={{ flex: 1 }}>
                                <input 
                                    placeholder="Key (Ex: discount_percent)" 
                                    value={newFieldKey} onChange={e => setNewFieldKey(e.target.value)}
                                    className={styles.textInput} 
                                    style={{ marginBottom: '8px' }}
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
                    )}
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

        const typoTitle = styleJson.tokens.typography.title;
        const previewBg = '#f3f4f6';

        // --- 1. CONFIG STYLE ---
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

        // --- 2. MOCK PRODUCT (GIỮ NGUYÊN) ---
        const MockProduct = ({ id }: { id: number }) => {
            const activeTextFields = sortedFields.filter(f => f.isEnabled && !f.key.includes('image'));
            const colors = styleJson.tokens.colors;
            const isCarousel = layoutJson.contentMode === 'carousel';
            const isList = layoutJson.contentMode === 'list';
            const contentAlign = isList ? 'flex-start' : 'center'; 
            const textAlignment = isList ? 'left' : 'center';

            const carouselItemStyle: React.CSSProperties = isCarousel ? {
                width: '100%', 
                flexShrink: 0,
                scrollSnapAlign: 'center'
            } : {};

            const imgConfig = (layoutJson.card?.image?.sizeByMode as any)?.[layoutJson.contentMode || 'grid'] || {};
            
            let imgW = '100%';
            let imgH = `${currentDensity.imageHeight}px`;

            if (isList) {
                imgW = '96px'; imgH = '96px';
            } else if (isCarousel) {
                imgW = imgConfig.width ? `${imgConfig.width}px` : '100%';
                imgH = imgConfig.height ? `${imgConfig.height}px` : '140px'; 
                if(imgConfig.aspectRatio === '1:1' && imgConfig.width) imgH = `${imgConfig.width}px`;
            } else {
                 imgW = imgConfig.width ? `${imgConfig.width}px` : '100%';
                 imgH = imgConfig.height ? `${imgConfig.height}px` : `${currentDensity.imageHeight}px`;
            }

            return (
                <div key={id} className={styles.mockProductCard} style={{ 
                    flexDirection: layoutJson.contentMode === 'list' ? 'row' : 'column',
                    gap: `${currentDensity.rowGap}px`, 
                    borderColor: borderColor, 
                    borderRadius: `${Math.max(4, radius - 4)}px`,
                    backgroundColor: colors.surface,
                    ...carouselItemStyle
                }}>
                    {showImage && (
                        <div className={styles.mockProductImage} style={{ 
                            width: imgW, 
                            height: imgH,
                            borderRadius: `${Math.max(2, radius - 6)}px`, 
                            flexShrink: 0,
                            margin: isList ? '0' : '0 auto'
                        }}></div>
                    )}

                    <div className={styles.mockProductContent} style={{
                        alignItems: contentAlign,
                        textAlign: textAlignment as any 
                    }}>
                        {activeTextFields.map((fieldConfig) => {
                            const key = fieldConfig.key;
                            const override = styleJson.components.fieldRow.overrides?.[key] || {};
                            
                            let baseStyle: React.CSSProperties = { fontSize: '11px', color: colors.textSecondary, marginTop: '2px' };
                            if (key.includes('item_name') || key.includes('title')) {
                                baseStyle = { 
                                    fontWeight: '600', 
                                    fontSize: '14px', 
                                    color: colors.textPrimary 
                                };
                            } else if (key.includes('price')) {
                                baseStyle = { 
                                    fontWeight: '700', 
                                    fontSize: '14px',
                                    color: colors.primary 
                                };
                            } else if (key.includes('categories')) {
                                baseStyle = { 
                                    fontWeight: '400', 
                                    fontSize: '11px',
                                    color: colors.primary 
                                };
                            } else if (key.includes('rating')) {
                                baseStyle = { 
                                    color: colors.warning, 
                                    fontSize: '12px'
                                };
                            }

                            const finalStyle = {
                                ...baseStyle,
                                ...(override.fontSize ? { fontSize: `${override.fontSize}px` } : {}),
                                ...(override.fontWeight ? { fontWeight: override.fontWeight } : {}),
                                ...(override.color ? { color: override.color } : {}),
                            };

                            let content = 'Sample Value';
                            if (key.includes('item_name') || key.includes('title')) content = 'Iphone 18 Pro Max';
                            else if (key.includes('price')) content = '$100.00';
                            else if (key.includes('rating')) content = '★★★★★';
                            else if (key.includes('categories')) content = 'Apple, Phone, ...';
                            else if (key.includes('description')) content = 'This is the most modern phone...';
                            return (
                                <div key={key} style={finalStyle}>
                                    {content}
                                </div>
                            );
                        })}
                    </div>
                </div>
            );
        };

        // --- 3. HELPER RENDER BODY (XỬ LÝ CAROUSEL/GRID/LIST) ---
        const renderWidgetBody = () => {
            const isCarousel = layoutJson.contentMode === 'carousel';
            const isList = layoutJson.contentMode === 'list';
            const gridColumns = (layoutJson.modes?.grid as any)?.columns || 2;

            // Style cho nút điều hướng (Đẹp hơn)
            const navBtnStyle: React.CSSProperties = {
                position: 'absolute',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: theme === 'dark' ? '#374151' : '#fff', // Màu nền nút
                border: `1px solid ${borderColor}`,
                color: textColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 10,
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)', // Đổ bóng đẹp hơn
                fontSize: '18px',
                lineHeight: 1,
                paddingBottom: '2px' // Căn chỉnh icon mũi tên
            };

            // Style container chứa items
            const containerStyle: React.CSSProperties = {
                display: isList ? 'flex' : (isCarousel ? 'flex' : 'grid'), 
                flexDirection: isList ? 'column' : 'row',
                gridTemplateColumns: !isList && !isCarousel ? `repeat(${gridColumns}, 1fr)` : undefined,
                gap: '12px',
                padding: isCarousel ? '0 12px' : '0', // Padding nội bộ để item không dính sát biên khi trượt
                overflow: 'hidden',
                position: 'relative',
                alignItems: 'stretch'
            };

            return (
                <div style={{ position: 'relative', padding: isCarousel ? '0 24px' : '0' }}> 
                    {/* Padding ngoài 24px để chừa chỗ cho nút bấm nằm đè lên biên */}
                    
                    {isCarousel && (
                        <>
                            <button style={{ ...navBtnStyle, left: '-12px' }}>‹</button>
                            <button style={{ ...navBtnStyle, right: '-12px' }}>›</button>
                        </>
                    )}

                    <div style={containerStyle}>
                        <MockProduct id={1} />
                        {/* Carousel hiển thị 1 cái chính, Grid/List hiển thị nhiều */}
                        {!isCarousel && <MockProduct id={2} />}
                        
                        {/* Nếu là Grid Inline thì hiện thêm cho đầy đặn */}
                        {!isCarousel && !isPopup && !isList && (
                            <>
                                <MockProduct id={3} />
                                <MockProduct id={4} />
                            </>
                        )}
                        {/* Nếu là Grid Inline thì hiện thêm cho đầy đặn */}
                        {!isCarousel && !isPopup && !isList && displayType === 'inline-injection' && (
                            <>
                                <MockProduct id={5} />
                            </>
                        )}
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
                                    {/* SỬ DỤNG HÀM RENDER BODY MỚI */}
                                    {renderWidgetBody()}
                                </div>
                            </div>
                        )}
                        <div className={styles.placeholderBlock}></div>
                    </div>

                    {isPopup && (
                        <div className={styles.popupOverlayLayer} style={{
                            alignItems: layoutJson.wrapper?.popup?.position?.includes('center') ? 'center' : 'flex-end',
                            justifyContent: layoutJson.wrapper?.popup?.position?.includes('right') ? 'flex-end' : 
                                            layoutJson.wrapper?.popup?.position?.includes('left') ? 'flex-start' : 'center'
                        }}>
                            <div className={styles.widgetCard} style={{ ...dynamicWidgetCard, pointerEvents: 'auto' }}>
                                <div className={styles.widgetHeader} style={{ borderBottom: `1px solid ${borderColor}` }}>
                                    <h4 style={{ margin: 0, color: textColor, fontSize: `${typoTitle.fontSize}px`, fontWeight: typoTitle.fontWeight }}>
                                        Recommended
                                    </h4>
                                    <span style={{ cursor: 'pointer', opacity: 0.6, color: secondaryColor }}>✕</span>
                                </div>
                                {/* SỬ DỤNG HÀM RENDER BODY MỚI */}
                                <div style={{ paddingTop: '12px' }}>
                                    {renderWidgetBody()}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                <p className={styles.helperText} style={{ textAlign: 'center', marginTop: '12px' }}>
                    *Preview shows layoutJson structure and colors. Actual content will vary by product.
                </p>
            </div>
        );
    };

    return (
        <div className={styles.container}>
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
                            <Puzzle className={styles.displayTypeIcon} />
                            <div className={styles.displayTypeTitle}>Inline Injection</div>
                            <div className={styles.displayTypeDescription}>Embeds into page layout</div>
                        </button>
                    </div>
                </div>
            )}

            <div className={styles.sectionCard}>
                <div className={styles.formRow} style={{ marginBottom: '1rem' }}>
                    <div className={styles.formCol}>
                        <label className={styles.fieldLabel}>Configuration Name <span className={styles.required}>*</span></label>
                        <input 
                            type="text" className={`${styles.textInput} ${errors.name ? styles.inputError : ''}`}
                            value={name} onChange={e => setName(e.target.value)} 
                            disabled={isReadOnly}
                            placeholder="e.g. Homepage Recommendations"
                        />
                        {errors.name && <span className={styles.errorText}>{errors.name}</span>}
                    </div>
                </div>

                <div className={styles.formRow}>
                    <div className={styles.formCol}>
                        <label className={styles.fieldLabel}>Target Type</label>
                        <input 
                            className={styles.selectInput}
                            value="Page URL"
                            disabled
                        >
                        </input>
                    </div>
                    <div className={styles.formCol}>
                        <label className={styles.fieldLabel}>Match Condition</label>
                        <input 
                            className={styles.selectInput}
                            value="Contains"
                            disabled
                        >
                        </input>
                    </div>
                    <div className={styles.formCol} style={{ flex: 2 }}>
                        <label className={styles.fieldLabel}>
                             {displayType === 'inline-injection' ? 'Target Selector Value' : 'Trigger URL'} <span className={styles.required}>*</span>
                        </label>
                        <input 
                            type="text" className={`${styles.textInput} ${errors.value ? styles.inputError : ''}`}
                            value={value} onChange={e => setValue(e.target.value)} 
                            disabled={isReadOnly}
                            placeholder={displayType === 'inline-injection' ? 'e.g., product-detail' : 'e.g., /product'}
                        />
                        {errors.value && <span className={styles.errorText}>{errors.value}</span>}
                    </div>
                </div>
                <div className={styles.formRow} style={{ marginTop: '0.5rem' }}>
                    <p className={styles.helperText}>
                        {displayType === 'inline-injection' 
                            ? `The widget will appear inside elements where the class/id contains this value.` 
                            : `The popup will appear when the page URL contains this value.`}
                    </p>
                </div>
            </div>

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
                                            setSelectedSearchConfigId(null);
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
                                value={selectedSearchConfigId || ''}
                                onChange={(e) => setSelectedSearchConfigId(e.target.value ? Number(e.target.value) : null)}
                                disabled={isReadOnly}
                            >
                                <option value="">Select a search keyword configuration...</option>
                                {searchInputConfigs.map(config => (
                                    <option key={config.Id} value={config.Id}>
                                        {config.ConfigurationName}
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

            <div className={styles.sectionCard}>
                    <div className={styles.switchAndTitleSection}>
                        <div className={styles.sectionHeader}>
                            <h2 className={styles.sectionTitle}>
                                Data Field Configuration
                            </h2>
                        </div>

                        {/* 2. Switch (Bên phải) */}
                        <div className={styles.switchContainer}>
                            <label className={styles.switchLabel} style={{ marginRight: '8px' }}>
                                Advanced
                            </label>
                            <label className={styles.switch}>
                                <input 
                                    type="checkbox" 
                                    checked={isFieldCustomizationEnabled}
                                    onChange={(e) => setIsFieldCustomizationEnabled(e.target.checked)}
                                    disabled={isReadOnly}
                                />
                                <span className={styles.slider}></span>
                            </label>
                        </div>
                </div>
                {renderFieldsConfigPanel()}
            </div>

            <div className={styles.sectionCard}>
                <div className={styles.switchAndTitleSection}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>
                            {displayType === 'popup' ? 'Popup' : 'Inline'} Customization
                        </h2>
                    </div>

                    {/* 2. Switch (Bên phải) */}
                    <div className={styles.switchContainer}>
                        <label className={styles.switchLabel} style={{ marginRight: '8px' }}>
                            Advanced
                        </label>
                        <label className={styles.switch}>
                            <input 
                                type="checkbox" 
                                checked={isCustomizationEnabled}
                                onChange={(e) => setIsCustomizationEnabled(e.target.checked)}
                                disabled={isReadOnly}
                            />
                            <span className={styles.slider}></span>
                        </label>
                    </div>
                </div>

                <div className={styles.formRow} style={{ marginTop: '0.5rem' }}>
                    <div className={styles.helperBox}>
                        When Advanced is enabled, you are allowed to customize the configuration of the widget's layout, styling, and behavior.
                    </div>
                </div>
                
                <div className={styles.configGrid}>
                    
                    <div>
                        {displayType === 'popup' ? renderPopupConfigPanel() : ''}
                        
                        {isCustomizationEnabled && (
                            <>
                            <div 
                                className={`${displayType === 'popup' ? styles.separatorTop : ''}`} 
                            >
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
                            </>
                        )}
                    </div>

                    <div>
                        {renderLivePreview()}
                    </div>
                </div>
            </div>

            {!isReadOnly && (
                <div className={styles.formActions}>
                    <button 
                        className={styles.cancelButton} 
                        onClick={handleCancel}
                        disabled={isSaving}
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
            
            {errors.general && (
                <div className={styles.errorAlert} style={{ marginTop: '1rem' }}>{errors.general}</div>
            )}

            <button 
                className={styles.floatingPreviewBtn}
                onClick={() => setShowFloatingPreview(true)}
                title="Open live review"
            >
                <Image size={24} />
            </button>

            {showFloatingPreview && (
                <div className={styles.previewModalOverlay} onClick={() => setShowFloatingPreview(false)}>
                    <div className={styles.previewModalContent} onClick={e => e.stopPropagation()}>
                        <button className={styles.closeModalBtn} onClick={() => setShowFloatingPreview(false)}>
                            <X size={20} />
                        </button>
                        <h3 style={{ margin: '0 0 1rem 0' }}>Live Preview</h3>
                        {renderLivePreview()}
                    </div>
                </div>
            )}                          
        </div>
    );
};