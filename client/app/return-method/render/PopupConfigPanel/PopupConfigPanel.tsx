import React from 'react';
import { Layers } from 'lucide-react';
import styles from './PopupConfigPanel.module.css';
import { LayoutJson } from '../../types';

interface PopupConfigPanelProps {
    isCustomizationEnabled: boolean;
    delayedDuration: number;
    setDelayedDuration: (val: number) => void;
    layoutJson: LayoutJson;
    updatePopupWrapper: (key: string, val: any) => void;
    isReadOnly: boolean;
}

export const PopupConfigPanel: React.FC<PopupConfigPanelProps> = ({
    isCustomizationEnabled,
    delayedDuration,
    setDelayedDuration,
    layoutJson,
    updatePopupWrapper,
    isReadOnly
}) => {
    return (
        <div className={styles.formContent}>
            <div className={styles.formGroup}>
                {isCustomizationEnabled && (
                    <>
                        <div className={styles.sectionLabelWithIcon}>
                            <Layers size={16} className="text-gray-500" />
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