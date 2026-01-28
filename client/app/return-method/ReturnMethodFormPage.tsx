import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Container } from '../../types';
import { Save, X, Layers, Puzzle, Image } from 'lucide-react';
import styles from './returnMethodPage.module.css';
import { DisplayType, LayoutJson, StyleJson, CustomizingFields, FieldConfig } from './types';
import { useDataCache } from '../../contexts/DataCacheContext';
import { returnMethodApi } from '../../lib/api/return-method';
import { searchInputApi } from '../../lib/api/search-input';
import { ReturnType, SearchInputResponse } from '../../lib/api/types';
import { DEFAULT_POPUP_LAYOUT, DEFAULT_INLINE_LAYOUT, DEFAULT_STYLE_CONFIG, LAYOUT_MODE_OPTIONS, DARK_MODE_COLORS } from './returnMethodDefaults';

// Import refactored render components
import { PopupConfigPanel } from './render/PopupConfigPanel/PopupConfigPanel';
import { StyleConfigPanel } from './render/StyleConfigPanel/StyleConfigPanel';
import { FieldsConfigPanel } from './render/FieldsConfigPanel/FieldsConfigPanel';
import { LivePreview } from './render/LivePreview/LivePreview';

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

    // Popup fields
    const [delayedDuration, setDelayedDuration] = useState<number>(0);
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
    
    // New Field State
    const [newFieldKey, setNewFieldKey] = useState('');

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
        
        if (type === 'popup') {
            setLayoutJson(DEFAULT_POPUP_LAYOUT);
            setStyleJson(prev => ({
                ...prev,
                tokens: {
                    ...prev.tokens,
                    colors: {
                        ...prev.tokens.colors,
                        surface: '#FFFFFF',
                        border: '#E5E7EB' // Màu viền xám nhẹ mặc định
                    }
                }
            }));
        } else {
            setLayoutJson(DEFAULT_INLINE_LAYOUT);
            setStyleJson(prev => ({
                ...prev,
                tokens: {
                    ...prev.tokens,
                    colors: {
                        ...prev.tokens.colors,
                        surface: 'transparent',
                        border: 'transparent'
                    }
                }
            }));
        }
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

    const handleLayoutModeChange = (newMode: string) => {
        setLayoutJson(prev => ({ ...prev, contentMode: newMode }));
    };

    const updateLayoutRoot = (key: string, val: any) => {
        setLayoutJson(prev => ({
            ...prev,
            [key]: val
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
                            value= {displayType === 'pop-up' ? 'Page URL' : 'CSS Selector'}
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
                
                {/* RENDER COMPONENT: Fields Config */}
                <FieldsConfigPanel
                    sortedFields={sortedFields}
                    isReadOnly={isReadOnly}
                    expandedFieldKey={expandedFieldKey}
                    setExpandedFieldKey={setExpandedFieldKey}
                    isFieldCustomizationEnabled={isFieldCustomizationEnabled}
                    toggleField={toggleField}
                    moveField={moveField}
                    removeField={removeField}
                    styleJson={styleJson}
                    handleUpdateFieldStyle={handleUpdateFieldStyle}
                    newFieldKey={newFieldKey}
                    setNewFieldKey={setNewFieldKey}
                    addNewField={addNewField}
                />
            </div>

            <div className={styles.sectionCard}>
                <div className={styles.switchAndTitleSection}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>
                            {displayType === 'popup' ? 'Popup' : 'Inline'} Customization
                        </h2>
                    </div>

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
                        {displayType === 'popup' && (
                            // RENDER COMPONENT: Popup Config
                            <PopupConfigPanel 
                                isCustomizationEnabled={isCustomizationEnabled}
                                delayedDuration={delayedDuration}
                                setDelayedDuration={setDelayedDuration}
                                layoutJson={layoutJson}
                                updatePopupWrapper={updatePopupWrapper}
                                isReadOnly={isReadOnly}
                            />
                        )}
                        
                        {isCustomizationEnabled && (
                            <>
                                <div className={`${displayType === 'popup' ? styles.separatorTop : ''}`}>
                                    <div className={styles.formRow}>
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

                                        <div className={styles.formCol}>
                                            <label className={styles.inputLabel}>Max Items to Show</label>
                                            <input
                                                type="number" 
                                                className={styles.textInput}
                                                min="1"
                                                max="100"
                                                value={layoutJson.maxItems ?? 50}
                                                onChange={(e) => updateLayoutRoot('maxItems', Number(e.target.value))}
                                                disabled={isReadOnly}
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className={styles.formRow} style={{ marginTop: '0.75rem' }}>
                                        <div className={styles.formCol} style={{flex: 1}}>
                                            <label className={styles.inputLabel}>Item Click URL Pattern</label>
                                            <input
                                                type="text" 
                                                className={styles.textInput}
                                                value={layoutJson.itemUrlPattern ?? '/song/{:id}'}
                                                onChange={(e) => updateLayoutRoot('itemUrlPattern', e.target.value)}
                                                disabled={isReadOnly}
                                                placeholder="/product/{:id}"
                                            />
                                            <span className={styles.helperText} style={{marginTop: '4px'}}>
                                                Use <code style={{background: '#f3f4f6', color: '#ef4444', padding: '2px 4px', borderRadius: '4px', fontFamily: 'monospace'}}>{'{:id}'}</code> or <code style={{background: '#f3f4f6', color: '#ef4444', padding: '2px 4px', borderRadius: '4px', fontFamily: 'monospace'}}>{'{:slug}'}</code> as dynamic placeholders.
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            
                            {/* RENDER COMPONENT: Style Config */}
                            <StyleConfigPanel
                                styleJson={styleJson}
                                setStyleJson={setStyleJson}
                                isReadOnly={isReadOnly}
                            />
                            </>
                        )}
                    </div>

                    <div>
                        {/* RENDER COMPONENT: Live Preview */}
                        <LivePreview 
                            displayType={displayType}
                            styleJson={styleJson}
                            layoutJson={layoutJson}
                            sortedFields={sortedFields}
                            showImage={showImage}
                        />
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
                         {/* RENDER COMPONENT: Live Preview (Floating) */}
                         <LivePreview 
                            displayType={displayType}
                            styleJson={styleJson}
                            layoutJson={layoutJson}
                            sortedFields={sortedFields}
                            showImage={showImage}
                        />
                    </div>
                </div>
            )}                          
        </div>
    );
};
