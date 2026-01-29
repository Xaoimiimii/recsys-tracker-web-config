import React from 'react';
import { Settings, Check, ArrowUp, ArrowDown, Trash2, Plus } from 'lucide-react';
import styles from './FieldsConfigPanel.module.css';
import { FieldConfig, StyleJson } from '../../types';
import { FieldInstructions } from '../FieldInstructions/FieldInstructions';

interface FieldsConfigPanelProps {
    sortedFields: FieldConfig[];
    isReadOnly: boolean;
    expandedFieldKey: string | null;
    setExpandedFieldKey: (key: string | null) => void;
    isFieldCustomizationEnabled: boolean;
    toggleField: (key: string) => void;
    moveField: (key: string, direction: 'up' | 'down') => void;
    removeField: (key: string) => void;
    styleJson: StyleJson;
    handleUpdateFieldStyle: (key: string, property: any, value: any) => void;
    newFieldKey: string;
    setNewFieldKey: (key: string) => void;
    addNewField: () => void;
    newFieldKeyError?: string;
}

export const FieldsConfigPanel: React.FC<FieldsConfigPanelProps> = ({
    sortedFields,
    isReadOnly,
    expandedFieldKey,
    setExpandedFieldKey,
    isFieldCustomizationEnabled,
    toggleField,
    moveField,
    removeField,
    styleJson,
    handleUpdateFieldStyle,
    newFieldKey,
    setNewFieldKey,
    addNewField,
    newFieldKeyError
}) => {
    return (
        <div className={styles.formContent}>
            {isFieldCustomizationEnabled && (
                <FieldInstructions />
            )}
            <div className={styles.formRow} style={{ marginTop: '0.5rem' }}>
                <div className={styles.helperBox}>
                    When Advanced is enabled, you are allowed to customize style of each field. Click the <Settings className={styles.settingIcon} size={14} /> button to open up customization panel.
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
                                    {/* Nút Settings */}
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
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <input
                                                type="color"
                                                className={styles.styleColorInput}
                                                value={currentStyle.color || '#000000'}
                                                onChange={(e) => handleUpdateFieldStyle(fieldConfig.key, 'color', e.target.value)}
                                                disabled={isReadOnly}
                                            />
                                            {currentStyle.color && (
                                                <span
                                                    style={{ fontSize: '10px', cursor: 'pointer', color: 'red' }}
                                                    onClick={() => handleUpdateFieldStyle(fieldConfig.key, 'color', undefined)}
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
            </div>
        </div>
    );
};