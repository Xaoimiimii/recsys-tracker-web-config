import React from 'react';
import { Droplet, DropletOff } from 'lucide-react';
import styles from './StyleConfigPanel.module.css';
import { StyleJson } from '../../types';
import { DARK_MODE_COLORS, DEFAULT_STYLE_CONFIG } from '../../returnMethodDefaults';

interface StyleConfigPanelProps {
    styleJson: StyleJson;
    setStyleJson: React.Dispatch<React.SetStateAction<StyleJson>>;
    isReadOnly: boolean;
}

export const StyleConfigPanel: React.FC<StyleConfigPanelProps> = ({
    styleJson,
    setStyleJson,
    isReadOnly
}) => {
    // Helpers copied from parent or passed as logic
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
                                const newColors = newTheme === 'dark' ? DARK_MODE_COLORS : DEFAULT_STYLE_CONFIG.tokens.colors;
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

            {/* Typography */}
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
                                    <input
                                        type="color"
                                        value={isTransparent ? '#ffffff' : currentColor}
                                        onChange={(e) => updateColorToken(colorKey, e.target.value)}
                                        disabled={isReadOnly || isTransparent}
                                        className={styles.colorInput}
                                        style={{
                                            opacity: isTransparent ? 0.3 : 1,
                                            cursor: isTransparent ? 'not-allowed' : 'pointer'
                                        }}
                                    />
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
