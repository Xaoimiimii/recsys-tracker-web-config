import React, { useState, useEffect } from 'react';
import { Container, OutputMethod, DisplayMethodConfig } from '../../types';
import { Edit2, Trash2, Plus } from 'lucide-react';
import { returnMethodApi } from '../../lib/api/';
import { useDataCache } from '../../contexts/DataCacheContext';
import styles from './RecommendationPage.module.css';

interface RecommendationPageProps {
    container: Container | null;
    setContainer: (c: Container) => void;
}

export const RecommendationPage: React.FC<RecommendationPageProps> = ({ container, setContainer }) => {
    const { getReturnMethods, clearReturnMethodsCache } = useDataCache();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMethod, setEditingMethod] = useState<DisplayMethodConfig | null>(null);
    const [selectedMethod, setSelectedMethod] = useState<number>(3); // Default to custom_widget id
    const [availableMethods, setAvailableMethods] = useState<Array<{id: number, name: string}>>([]);
    const [slot, setSlot] = useState('');
    const [targetUrl, setTargetUrl] = useState('');
    const [targetSelector, setTargetSelector] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const displayMethods = container?.outputConfig.displayMethods || [];

    // Fetch available return method types from API
    useEffect(() => {
        const fetchAvailableMethods = async () => {
            try {
                const methods = await returnMethodApi.getAll();
                setAvailableMethods(methods);
                if (methods.length > 0 && !selectedMethod) {
                    setSelectedMethod(methods[0].id);
                }
            } catch (error) {
                console.error('Failed to fetch available return methods:', error);
            }
        };

        fetchAvailableMethods();
    }, []);

    // Fetch return methods when component mounts or container changes
    useEffect(() => {
        const fetchReturnMethods = async () => {
            if (!container?.uuid) return;
            
            setIsLoading(true);
            try {
                const methods = await getReturnMethods(container.uuid);
                
                // Convert API response to DisplayMethodConfig format
                const displayMethodConfigs: DisplayMethodConfig[] = methods.map(m => ({
                    id: m.DomainID?.toString() || '',
                    slot: m.SlotName || '',
                    targetUrl: m.TargetUrl || '',
                    method: 'custom_widget', // Keep for backward compatibility
                    targetSelector: m.Value || '',
                    returnMethodId: m.ReturnMethodID,
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

    const getMethodDescription = (methodName: string) => {
        // Map descriptions based on method name from API
        const descriptions: Record<string, string> = {
            'Custom Widget': 'Provide designed div for partner to embed',
            'Popup Mode': 'Display recommendations in a popup overlay.',
            'Inline Injection': 'Render into partner\'s existing div using ID/class/selector',
            'SDK Callback': 'SDK calls API and returns data to partner\'s callback function',
        };
        return descriptions[methodName] || '';
    };

    const getMethodLabel = (methodId: number) => {
        const method = availableMethods.find(m => m.id === methodId);
        return method ? method.name : 'Unknown Method';
    };

    const openAddModal = () => {
        setEditingMethod(null);
        setSelectedMethod(availableMethods.length > 0 ? availableMethods[0].id : 1);
        setSlot('');
        setTargetUrl('');
        setTargetSelector('');
        setIsModalOpen(true);
    };

    const openEditModal = (method: DisplayMethodConfig) => {
        setEditingMethod(method);
        // Use returnMethodId if available
        const methodId = (method as any).returnMethodId || (availableMethods.length > 0 ? availableMethods[0].id : 1);
        setSelectedMethod(methodId);
        setSlot(method.slot);
        setTargetUrl(method.targetUrl || '');
        setTargetSelector(method.targetSelector || '');
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingMethod(null);
        setSelectedMethod(availableMethods.length > 0 ? availableMethods[0].id : 1);
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
                key: container.uuid,
                slotName: slot.trim(),
                returnMethodId: selectedMethod,
                targetUrl: targetUrl.trim(),
                targetSelector: targetSelector || undefined
            });

            const newMethod: DisplayMethodConfig = {
                id: response.DomainID?.toString() || '',
                slot: response.SlotName || '',
                targetUrl: response.TargetUrl || '',
                method: 'custom_widget', // Keep for backward compatibility
                targetSelector: response.Value || '',
                returnMethodId: response.ReturnMethodID,
            } as any;

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

            // Clear cache to force refresh on next load
            clearReturnMethodsCache(container.uuid);
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
                                    <td title={method.slot}>
                                        {method.slot.length > 30 ? `${method.slot.substring(0, 30)}...` : method.slot}
                                    </td>
                                    <td title={method.targetUrl}>
                                        {method.targetUrl.length > 40 ? `${method.targetUrl.substring(0, 40)}...` : method.targetUrl}
                                    </td>
                                    <td>{(method as any).returnMethodId ? getMethodLabel((method as any).returnMethodId) : 'Unknown'}</td>
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
                                    {availableMethods.map((method) => (
                                        <button
                                            key={method.id}
                                            type="button"
                                            className={`${styles.methodCard} ${selectedMethod === method.id ? styles.methodCardActive : ''}`}
                                            onClick={() => setSelectedMethod(method.id)}
                                        >
                                            <div className={styles.methodCardTitle}>{method.name}</div>
                                            <div className={styles.methodCardDescription}>{getMethodDescription(method.name)}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className={styles.methodDetails}>
                                <h5 className={styles.label}>Method Description</h5>
                                <div className={styles.methodDescription}>
                                    {getMethodDescription(getMethodLabel(selectedMethod))}
                                </div>

                                {getMethodLabel(selectedMethod) === 'Inline Injection' && (
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

                                {getMethodLabel(selectedMethod) === 'Custom Widget' && (
                                    <div className={styles.guideBox}>
                                        <label className={styles.label}>Widget Code (Copy and paste this into your HTML)</label>
                                        <div className={styles.widgetCodeBlock}>
                                            <code>&lt;div class="recsys-recommend-widget" data-slot="{slot || 'YOUR_SLOT'}"&gt;&lt;/div&gt;</code>
                                        </div>
                                        <p className={styles.widgetNote}>Place this code where you want recommendations to appear</p>
                                    </div>
                                )}

                                {getMethodLabel(selectedMethod) === 'SDK Callback' && (
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
