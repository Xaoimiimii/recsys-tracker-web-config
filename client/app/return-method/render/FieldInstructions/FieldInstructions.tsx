import React from 'react';
import { BookOpen } from 'lucide-react';
import styles from './FieldInstructions.module.css';

export const FieldInstructions: React.FC = () => {
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
                        <br />⚠️ <b>Note:</b> Consult your IT team if unsure. Do not modify this value arbitrarily.
                    </span>
                </div>
                <div className={styles.stepItem}>
                    <span className={styles.stepLabel}>Step 2:</span>
                    Set the display name in the <b>Label</b> field.
                    <span className={styles.subNote}>
                        This is the text customers will see (e.g., change "price" to <span className={styles.codeTag}>Giá Sốc</span>).
                        <br />You can write in Vietnamese, add icons, or leave it blank as needed.
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
