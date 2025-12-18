import React, { useState, useEffect } from 'react';
import { Container, TrackingRule } from '../../types';
import { RuleBuilder } from '../../components/dashboard/RuleBuilder';
import { TRIGGER_ICONS } from '../../lib/constants';
import { Box, Plus, Trash2, Edit2, MousePointer, Eye, Star } from 'lucide-react';
import { ruleApi, RuleListItem, RuleDetailResponse } from '../../lib/api/';
import { useDataCache } from '../../contexts/DataCacheContext';
import styles from './TrackingRulesPage.module.css';

interface TrackingRulesPageProps {
    container: Container | null;
    setContainer: (c: Container) => void;
}

interface RuleWithDetails extends RuleListItem {
    details?: RuleDetailResponse;
}

export const TrackingRulesPage: React.FC<TrackingRulesPageProps> = ({ container, setContainer }) => {
    const { getRules, clearRulesCache } = useDataCache();
    const [isEditingRule, setIsEditingRule] = useState(false);
    const [currentRule, setCurrentRule] = useState<TrackingRule | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(false);
    const [rulesWithDetails, setRulesWithDetails] = useState<RuleWithDetails[]>([]);
    const [fetchError, setFetchError] = useState(false);

    // Fetch rules from API when component mounts or container changes
    useEffect(() => {
        const fetchRules = async () => {
            if (!container?.uuid) return;
            
            setIsLoading(true);
            setFetchError(false);
            try {
                // Step 1: Get list of rules for the domain
                const rulesList = await ruleApi.getRulesByDomain(container.uuid);
                
                // Step 2: Fetch detailed information for each rule
                const rulesWithDetailsPromises = rulesList.map(async (rule) => {
                    try {
                        const details = await ruleApi.getRuleById(rule.id);
                        return {
                            ...rule,
                            details
                        };
                    } catch (error) {
                        console.error(`Failed to fetch details for rule ${rule.id}:`, error);
                        return rule; // Return rule without details if fetch fails
                    }
                });
                
                const rulesData: RuleWithDetails[] = await Promise.all(rulesWithDetailsPromises);
                setRulesWithDetails(rulesData);
                
                // Convert API rules to TrackingRule format for display (legacy support)
                const trackingRules: TrackingRule[] = rulesData.map(rule => ({
                    id: rule.id.toString(),
                    name: rule.name,
                    trigger: 'click',
                    selector: rule.details?.TargetElement?.Value || '',
                    extraction: rule.details?.PayloadConfigs?.map(p => ({
                        field: 'itemId',
                        method: 'attribute' as any,
                        value: p.Value
                    })) || []
                }));

                setContainer({
                    ...container,
                    rules: trackingRules
                });
            } catch (error) {
                console.error('Failed to fetch rules:', error);
                setFetchError(true);
                setRulesWithDetails([]);
                // Clear rules on error
                setContainer({
                    ...container,
                    rules: []
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchRules();
    }, [container?.uuid]); // Only depend on UUID to avoid infinite loop

    const getTriggerTypeFromId = (triggerEventId: number | undefined) => {
        switch(triggerEventId) {
            case 1:
                return { label: 'Click', icon: MousePointer };
            case 2:
                return { label: 'Rate', icon: Star };
            case 3:
                return { label: 'View', icon: Eye };
            default:
                return { label: 'Click', icon: Box };
        }
    };

    const saveRule = async (response: any) => {
        if (!container) return;
        
        setIsLoading(true);
        try {
            // API call already done in RuleBuilder component
            // Just update local state with the response
            const newId = response.id || response.Id || Date.now().toString();
            const newRule: TrackingRule = {
                id: newId.toString(),
                name: response.name || response.Name || 'New Rule',
                trigger: 'click', // Default, can be enhanced with response data
                selector: '',
                extraction: []
            };

            let newRules = [...container.rules];
            const existingIndex = newRules.findIndex(r => r.id === newId.toString());
        
            if (existingIndex >= 0) {
                newRules[existingIndex] = newRule;
            } else {
                newRules.push(newRule);
            }
            
            setContainer({ ...container, rules: newRules });
            setIsEditingRule(false);
            setCurrentRule(undefined);
            
            // Clear cache to force refresh on next load
            clearRulesCache(container.uuid);
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
                                    <th>Trigger Type</th>
                                    <th>Rule Name</th>
                                    <th>Selector (Value)</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rulesWithDetails.map((rule, index) => {
                                    const triggerInfo = getTriggerTypeFromId(rule.details?.TriggerEventID);
                                    const TriggerIcon = triggerInfo.icon;
                                    return (
                                        <tr key={rule.id}>
                                            <td>#{index + 1}</td>
                                            <td>
                                                <div className={styles.triggerCell}>
                                                    <TriggerIcon size={16} className={styles.triggerIcon} />
                                                    {triggerInfo.label}
                                                </div>
                                            </td>
                                            <td>{rule.name}</td>
                                            <td>{rule.details?.TargetElement?.Value || 'N/A'}</td>
                                            <td>
                                            <button 
                                                className={styles.editButton}
                                                onClick={() => { 
                                                    // Find the corresponding TrackingRule
                                                    const trackingRule = container?.rules.find(r => r.id === rule.id.toString());
                                                    setCurrentRule(trackingRule); 
                                                    setIsEditingRule(true); 
                                                }}
                                                title="Edit"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button 
                                                className={styles.deleteButton}
                                                onClick={() => deleteRule(rule.id.toString())}
                                                title="Delete"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                    );
                                })}
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
