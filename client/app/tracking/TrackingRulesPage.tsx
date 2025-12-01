import React, { useState } from 'react';
import { Container, TrackingRule } from '../../types';
import { RuleBuilder } from '../../components/dashboard/RuleBuilder';
import { TRIGGER_ICONS } from '../../lib/constants';
import { Box, Plus, Trash2, Edit2 } from 'lucide-react';
import styles from './TrackingRulesPage.module.css';

interface TrackingRulesPageProps {
    container: Container | null;
    setContainer: (c: Container) => void;
}

export const TrackingRulesPage: React.FC<TrackingRulesPageProps> = ({ container, setContainer }) => {
    const [isEditingRule, setIsEditingRule] = useState(false);
    const [currentRule, setCurrentRule] = useState<TrackingRule | undefined>(undefined);

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

    const saveRule = (rule: TrackingRule) => {
        if (!container) return;
        let newRules = [...container.rules];
        const existingIndex = newRules.findIndex(r => r.id === rule.id);
    
        if (existingIndex >= 0) {
            newRules[existingIndex] = rule;
        } else {
            newRules.push(rule);
        }
        setContainer({ ...container, rules: newRules });
        setIsEditingRule(false);
        setCurrentRule(undefined);
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
                    {container?.rules.length === 0 ? (
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
