import React from 'react';
import { X, AlertTriangle } from 'lucide-react';
import styles from './ConfirmModal.module.css';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
    variant?: 'danger' | 'warning' | 'info';
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    onConfirm,
    onCancel,
    variant = 'warning'
}) => {
    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onClick={onCancel}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <button 
                    className={styles.closeButton}
                    onClick={onCancel}
                    aria-label="Close"
                >
                    <X size={20} />
                </button>
                
                <div className={styles.content}>
                    <div className={`${styles.iconWrapper} ${styles[`iconWrapper${variant.charAt(0).toUpperCase() + variant.slice(1)}`]}`}>
                        <AlertTriangle 
                            className={styles.icon}
                            size={24}
                        />
                    </div>
                    <h2 className={styles.title}>{title}</h2>
                    <p className={styles.message}>{message}</p>
                </div>
                
                <div className={styles.footer}>
                    <button 
                        className={styles.cancelButton}
                        onClick={onCancel}
                    >
                        {cancelText}
                    </button>
                    <button 
                        className={`${styles.confirmButton} ${styles[`confirm${variant.charAt(0).toUpperCase() + variant.slice(1)}`]}`}
                        onClick={onConfirm}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};
