import React, { useState, useEffect } from 'react';
import { Container, TrackingRule } from '../../types';
import { RuleBuilder } from '../../components/dashboard/RuleBuilder';
import { TRIGGER_ICONS } from '../../lib/constants';
import { Box, Plus, Trash2, Edit2 } from 'lucide-react';
import { ruleApi, RuleResponse } from '../../lib/api/';
import styles from './TrackingRulesPage.module.css';

interface TrackingRulesPageProps {
    container: Container | null;
    setContainer: (c: Container) => void;
}

export const TrackingRulesPage: React.FC<TrackingRulesPageProps> = ({ container, setContainer }) => {
    const [isEditingRule, setIsEditingRule] = useState(false);
    const [currentRule, setCurrentRule] = useState<TrackingRule | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(false);
    const [apiRules, setApiRules] = useState<RuleResponse[]>([]);

    // Fetch rules from API when component mounts or container changes
    useEffect(() => {
        const fetchRules = async () => {
            if (!container?.id) return;
            
            setIsLoading(true);
            try {
                const rules = await ruleApi.getByDomainId(container.id);
                setApiRules(rules);
                
                // Convert API rules to TrackingRule format for display
                const trackingRules: TrackingRule[] = rules.map(rule => ({
                    id: rule.id?.toString() || '',
                    name: rule.name,
                    trigger: (rule.eventPattern?.type || 'click') as any,
                    selector: rule.targetElement?.selector || '',
                    extraction: rule.payloads?.map(p => ({
                        field: 'itemId',
                        method: p.payloadConfig.extractionMethod as any,
                        value: p.payloadConfig.extractionValue
                    })) || []
                }));

                setContainer({
                    ...container,
                    rules: trackingRules
                });
            } catch (error) {
                console.error('Failed to fetch rules:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchRules();
    }, [container?.id]); // Only depend on ID to avoid infinite loop

    const getTriggerLabel = (trigger: string) => {
        switch(trigger) {
            case 'click':
                return 'Click';
            case 'form_submit':
                return 'Form Submit';
            case 'scroll':
                return 'Scroll';
            case 'timer':
                return 'Timer';
            case 'view':
                return 'View';
            default:
                return trigger;
        }
    };

    const saveRule = async (rule: TrackingRule) => {
        if (!container) return;
        
        setIsLoading(true);
        try {
            // For now, we only support creating new rules
            // TODO: Implement PUT /rule/:id for updates
            
            // Call API to create rule
            // Note: This is a simplified mapping. You may need to adjust based on actual API requirements
            const response = await ruleApi.create({
                name: rule.name,
                domainKey: container.uuid,
                eventPatternId: rule.trigger, // This should be the actual event pattern ID from the API
                // Add other required fields based on your API
            });

            // Update local state with the new rule
            let newRules = [...container.rules];
            const existingIndex = newRules.findIndex(r => r.id === rule.id);
        
            if (existingIndex >= 0) {
                newRules[existingIndex] = rule;
            } else {
                newRules.push({
                    ...rule,
                    id: response.id // Use the ID from API response
                });
            }
            
            setContainer({ ...container, rules: newRules });
            setIsEditingRule(false);
            setCurrentRule(undefined);
        } catch (error) {
            console.error('Failed to save rule:', error);
            alert('Failed to save tracking rule. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const deleteRule = (id: string) => {
        if (!container) return;
        setContainer({ ...container, rules: container.rules.filter(r => r.id !== id) });
    };

    return (
        <div className={styles.container}>
            {!isEditingRule ? (
                <div className={styles.rulesCard}>
                    <div className={styles.cardHeader}>
                        <h3 className={styles.rulesTitle}>Tracking Rules</h3>
                        <button 
                            onClick={() => { setCurrentRule(undefined); setIsEditingRule(true); }}
                            className={styles.addButton}
                        >
                            <Plus size={16} />
                            Add Rule
                        </button>
                    </div>
                    {isLoading ? (
                        <div className={styles.emptyState}>
                            <p>Loading tracking rules...</p>
                        </div>
                    ) : container?.rules.length === 0 ? (
                        <div className={styles.emptyState}>
                            <p>No rules configured yet.</p>
                            <p>Click "Add Rule" to create one.</p>
                        </div>
                    ) : (
                        <table className={styles.rulesTable}>
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Trigger</th>
                                    <th>Rule Name</th>
                                    <th>Selector</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {container?.rules.map((rule, index) => (
                                    <tr key={rule.id}>
                                        <td>#{index + 1}</td>
                                        <td>
                                            <div className={styles.triggerCell}>
                                                <div className={styles.triggerIcon}>
                                                    {React.createElement(TRIGGER_ICONS[rule.trigger], { size: 18 })}
                                                </div>
                                                <span>{getTriggerLabel(rule.trigger)}</span>
                                            </div>
                                        </td>
                                        <td>{rule.name}</td>
                                        <td>{rule.selector || 'Global Page Trigger'}</td>
                                        <td>
                                            <button 
                                                className={styles.editButton}
                                                onClick={() => { setCurrentRule(rule); setIsEditingRule(true); }}
                                                title="Edit"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button 
                                                className={styles.deleteButton}
                                                onClick={() => deleteRule(rule.id)}
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
            ) : (
                <RuleBuilder 
                    domainKey={container?.uuid || ''} 
                    initialRule={currentRule} 
                    onSave={saveRule} 
                    onCancel={() => setIsEditingRule(false)} 
                />
            )}
        </div>
    );
};
