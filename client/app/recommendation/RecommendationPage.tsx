import React, { useState, useEffect } from 'react';
import { Container, OutputMethod, DisplayMethodConfig } from '../../types';
import { Edit2, Trash2, Plus } from 'lucide-react';
import { returnMethodApi } from '../../lib/api/';
import styles from './RecommendationPage.module.css';

interface RecommendationPageProps {
    container: Container | null;
    setContainer: (c: Container) => void;
}

export const RecommendationPage: React.FC<RecommendationPageProps> = ({ container, setContainer }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMethod, setEditingMethod] = useState<DisplayMethodConfig | null>(null);
    const [selectedMethod, setSelectedMethod] = useState<OutputMethod>('custom_widget');
    const [slot, setSlot] = useState('');
    const [targetUrl, setTargetUrl] = useState('');
    const [targetSelector, setTargetSelector] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const displayMethods = container?.outputConfig.displayMethods || [];

    // Fetch return methods when component mounts or container changes
    useEffect(() => {
        const fetchReturnMethods = async () => {
            if (!container?.uuid) return;
            
            setIsLoading(true);
            try {
                const methods = await returnMethodApi.getByDomainKey(container.uuid);
                
                // Convert API response to DisplayMethodConfig format
                const displayMethodConfigs: DisplayMethodConfig[] = methods.map(m => ({
                    id: m.id,
                    slot: m.slot,
                    targetUrl: m.targetUrl,
                    method: m.method as OutputMethod,
                    targetSelector: m.targetSelector,
                }));

                setContainer({
                    ...container,
                    outputConfig: {
                        ...container.outputConfig,
                        displayMethods: displayMethodConfigs
                    }
                });
            } catch (error) {
                console.error('Failed to fetch return methods:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchReturnMethods();
    }, [container?.uuid]); // Only depend on uuid to avoid infinite loop

    const getMethodDescription = (method: OutputMethod) => {
        switch(method) {
            case 'custom_widget':
                return 'Provide designed div for partner to embed';
            case 'popup':
                return 'Display recommendations in a popup overlay.';
            case 'inline_injection':
                return 'Render into partner\'s existing div using ID/class/selector';
            case 'sdk_callback':
                return 'SDK calls API and returns data to partner\'s callback function';
            default:
                return '';
        }
    };

    const getMethodLabel = (method: OutputMethod) => {
        switch(method) {
            case 'custom_widget':
                return 'Custom Widget';
            case 'popup':
                return 'Popup Mode';
            case 'inline_injection':
                return 'Inline Injection';
            case 'sdk_callback':
                return 'SDK Callback';
            default:
                return method;
        }
    };

    const openAddModal = () => {
        setEditingMethod(null);
        setSelectedMethod('custom_widget');
        setSlot('');
        setTargetUrl('');
        setTargetSelector('');
        setIsModalOpen(true);
    };

    const openEditModal = (method: DisplayMethodConfig) => {
        setEditingMethod(method);
        setSelectedMethod(method.method);
        setSlot(method.slot);
        setTargetUrl(method.targetUrl || '');
        setTargetSelector(method.targetSelector || '');
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingMethod(null);
        setSelectedMethod('custom_widget');
        setSlot('');
        setTargetUrl('');
        setTargetSelector('');
    };

    const handleSave = async () => {
        if (!container || !slot.trim() || !targetUrl.trim()) {
            alert('Please enter full details');
            return;
        }

        setIsLoading(true);
        try {
            // Call API to create return method
            const response = await returnMethodApi.create({
                domainKey: container.uuid,
                method: selectedMethod,
                slot: slot.trim(),
                targetUrl: targetUrl.trim(),
                targetSelector: selectedMethod === 'inline_injection' ? targetSelector : undefined
            });

            const newMethod: DisplayMethodConfig = {
                id: response.id,
                slot: response.slot,
                targetUrl: response.targetUrl,
                method: response.method as OutputMethod,
                targetSelector: response.targetSelector
            };

            let updatedMethods: DisplayMethodConfig[];
            if (editingMethod) {
                updatedMethods = displayMethods.map(m => m.id === editingMethod.id ? newMethod : m);
            } else {
                updatedMethods = [...displayMethods, newMethod];
            }

            setContainer({
                ...container,
                outputConfig: {
                    ...container.outputConfig,
                    displayMethods: updatedMethods
                }
            });

            closeModal();
        } catch (error) {
            console.error('Failed to save return method:', error);
            alert('Failed to save return method. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = (id: string) => {
        if (!container) return;
        if (!confirm('Are you sure you want to delete this display method?')) return;

        const updatedMethods = displayMethods.filter(m => m.id !== id);
        setContainer({
            ...container,
            outputConfig: {
                ...container.outputConfig,
                displayMethods: updatedMethods
            }
        });
    };

    return (
        <div className={styles.container}>
            <div className={styles.outputConfigCard}>
                <div className={styles.cardHeader}>
                    <h3 className={styles.outputConfigTitle}>Recommendation Display Methods</h3>
                    <button className={styles.addButton} onClick={openAddModal}>
                        <Plus size={16} />
                        Add Display Method
                    </button>
                </div>

                {isLoading ? (
                    <div className={styles.emptyState}>
                        <p>Loading return methods...</p>
                    </div>
                ) : displayMethods.length === 0 ? (
                    <div className={styles.emptyState}>
                        <p>No display methods configured yet.</p>
                        <p>Click "Add Display Method" to create one.</p>
                    </div>
                ) : (
                    <table className={styles.methodsTable}>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Slot</th>
                                <th>Target URL</th>
                                <th>Method</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayMethods.map((method, index) => (
                                <tr key={method.id}>
                                    <td>#{index + 1}</td>
                                    <td>{method.slot}</td>
                                    <td>{method.targetUrl}</td>
                                    <td>{getMethodLabel(method.method)}</td>
                                    <td>
                                        <button 
                                            className={styles.editButton}
                                            onClick={() => openEditModal(method)}
                                            title="Edit"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button 
                                            className={styles.deleteButton}
                                            onClick={() => handleDelete(method.id)}
                                            title="Delete"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {isModalOpen && (
                <div className={styles.modalOverlay} onClick={closeModal}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3>{editingMethod ? 'Edit Display Method' : 'Add Display Method'}</h3>
                            <button className={styles.closeButton} onClick={closeModal}>×</button>
                        </div>

                        <div className={styles.modalBody}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Slot Name</label>
                                <input
                                    type="text"
                                    className={styles.input}
                                    value={slot}
                                    onChange={(e) => setSlot(e.target.value)}
                                    placeholder="e.g., homepage-recommendations"
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>Target URL</label>
                                <input
                                    type="text"
                                    className={styles.input}
                                    value={targetUrl}
                                    onChange={(e) => setTargetUrl(e.target.value)}
                                    placeholder="e.g., https://example.com/homepage"
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>Display Method</label>
                                <div className={styles.methodCardsGrid}>
                                    {(['custom_widget', 'popup', 'inline_injection', 'sdk_callback'] as OutputMethod[]).map((method) => (
                                        <button
                                            key={method}
                                            type="button"
                                            className={`${styles.methodCard} ${selectedMethod === method ? styles.methodCardActive : ''}`}
                                            onClick={() => setSelectedMethod(method)}
                                        >
                                            <div className={styles.methodCardTitle}>{getMethodLabel(method)}</div>
                                            <div className={styles.methodCardDescription}>{getMethodDescription(method)}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className={styles.methodDetails}>
                                <h5 className={styles.label}>Method Description</h5>
                                <div className={styles.methodDescription}>
                                    {selectedMethod === 'popup' && 'Display recommendations in a popup overlay. The popup will automatically appear on your website. No additional configuration needed.'}
                                    {selectedMethod === 'inline_injection' && 'Render into partner\'s existing div using ID/class/selector'}
                                    {selectedMethod === 'custom_widget' && 'Provide designed div for partner to embed'}
                                    {selectedMethod === 'sdk_callback' && 'SDK calls API and returns data to partner\'s callback function'}
                                </div>

                                {selectedMethod === 'inline_injection' && (
                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Target Selector (ID/Class/CSS Selector)</label>
                                        <input 
                                            type="text" 
                                            placeholder="#recommendation-container or .rec-widget"
                                            className={styles.input}
                                            value={targetSelector}
                                            onChange={(e) => setTargetSelector(e.target.value)}
                                        />
                                    </div>
                                )}

                                {selectedMethod === 'custom_widget' && (
                                    <div className={styles.guideBox}>
                                        <label className={styles.label}>Widget Code (Copy and paste this into your HTML)</label>
                                        <div className={styles.widgetCodeBlock}>
                                            <code>&lt;div class="recsys-recommend-widget" data-slot="{slot || 'YOUR_SLOT'}"&gt;&lt;/div&gt;</code>
                                        </div>
                                        <p className={styles.widgetNote}>Place this code where you want recommendations to appear</p>
                                    </div>
                                )}

                                {selectedMethod === 'sdk_callback' && (
                                    <div className={styles.developerGuide}>
                                        <h4 className={styles.label}>Developer Guide - SDK Callback</h4>
                                        
                                        <div className={styles.guideSection}>
                                            <h5 className={styles.sectionTitle}>A. Code Snippet Example</h5>
                                            <pre className={styles.codeBlock}>
                                                {`<script>
MMN.recommend({
    slot: "${slot || 'YOUR_SLOT'}",
    onResult: function(items, meta) {
        // Render your recommendations here
        // Example:
        // const container = document.getElementById("my-recommend-box");
        // container.innerHTML = items.map(i =>
        //   \`<div class="item">
        //     <img src="\${i.image}">
        //     <p>\${i.title}</p>
        //   </div>\`
        // ).join("");
    }
});
</script>`}
                                            </pre>
                                        </div>

                                        <div className={styles.guideSection}>
                                            <h5 className={styles.sectionTitle}>B. Items Structure (JSON)</h5>
                                            <pre className={styles.codeBlock}>
                                                {`items = [
    {
        "itemId": "P123",
        "title": "Nike Air 90",
        "image": "https://...",
        "score": 0.98,
        "metadata": {
            "category": "Shoes",
            "price": 1200000
        }
    },
    ...
]`}
                                            </pre>
                                        </div>

                                        <div className={styles.guideSection}>
                                            <h5 className={styles.sectionTitle}>C. When is the Callback Called?</h5>
                                            <ul className={styles.callbackInfo}>
                                                <li>✓ SDK has finished loading</li>
                                                <li>✓ Slot/Scenario is valid</li>
                                                <li>✓ Recommend API returns JSON</li>
                                                <li>✓ Event <code>onResult</code> is called exactly once per request</li>
                                            </ul>
                                        </div>
                                    </div>
                                )}

                            </div>
                        </div>

                        <div className={styles.modalFooter}>
                            <button className={styles.cancelButton} onClick={closeModal}>
                                Cancel
                            </button>
                            <button className={styles.saveButton} onClick={handleSave}>
                                {editingMethod ? 'Update' : 'Add'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
