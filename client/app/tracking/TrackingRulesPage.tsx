import React, { useState, useEffect } from 'react';
import { Container, TrackingRule } from '../../types';
import { RuleBuilder } from '../../components/dashboard/RuleBuilder';
import { Box, Plus, Trash2, Edit2, MousePointer, Eye, Star, ArrowDownCircle, MessageSquareHeart } from 'lucide-react';
import { ruleApi, RuleListItem, RuleDetailResponse } from '../../lib/api/';
import { useDataCache } from '../../contexts/DataCacheContext';
import styles from './TrackingRulesPage.module.css';

interface TrackingRulesPageProps {
    container: Container | null;
    setContainer: (c: Container) => void;
}

export const TrackingRulesPage: React.FC<TrackingRulesPageProps> = ({ container, setContainer }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [isEditingRule, setIsEditingRule] = useState(false);
    const [isViewMode, setIsViewMode] = useState(false);
    const [currentRule, setCurrentRule] = useState<TrackingRule | undefined>(undefined);
    const [currentRuleDetails, setCurrentRuleDetails] = useState<RuleDetailResponse | undefined>(undefined);
    
    const [rules, setRules] = useState<RuleListItem[]>([]);
    const [fetchError, setFetchError] = useState(false);
    
    const { getRulesByDomain, setRulesByDomain } = useDataCache();

    // Fetch rules from API when component mounts or container changes
    useEffect(() => {
        const fetchRules = async () => {
            if (!container?.uuid) return;
            
            // Check cache first
            const cachedRules = getRulesByDomain(container.uuid);
            if (cachedRules) {
                setRules(cachedRules);
                updateContainerRules(cachedRules);
                return;
            }
            
            setIsLoading(true);
            setFetchError(false);
            try {
                // API now returns full details including PayloadMappings, Conditions, TrackingTarget, EventType
                const rulesData = await ruleApi.getRulesByDomain(container.uuid);
                setRules(rulesData);
                setRulesByDomain(container.uuid, rulesData);

                updateContainerRules(rulesData);

            } catch (error) {
                console.error('Failed to fetch rules:', error);
                setFetchError(true);
                setRules([]);
                // Clear rules on error
                setContainer({
                    ...container,
                    rules: []
                });
            } finally {
                setIsLoading(false);
            }
        };

        const updateContainerRules = (rulesData: RuleListItem[]) => {
            if (!container) return;
            
            // Update container's rules based on fetched data
            const updatedRules: TrackingRule[] = rulesData.map(r => ({
                id: r.Id.toString(),
                name: r.Name,
                trigger: r.EventType.Name,
                selector: r.TrackingTarget?.Value || '',
                extraction: []
            }));
            setContainer({
                ...container,
                rules: updatedRules
            });
        };

        fetchRules();
    }, [container?.uuid]); // Only depend on UUID to avoid infinite loop

    const getTriggerTypeFromId = (triggerEventId: number | undefined) => {
        switch(triggerEventId) {
            case 1:
                return { label: 'Click', icon: MousePointer };
            case 2:
                return { label: 'Rating', icon: Star };
            case 3:
                return { label: 'Review', icon: MessageSquareHeart };
            case 4:
                return { label: 'Scroll', icon: ArrowDownCircle };
            case 5:
                return { label: 'Page view', icon: Eye };
            default:
                return { label: 'Click', icon: Box };
        }
    };

    const saveRule = async (response: any) => {
        if (!container) return;
        
        setIsLoading(true);
        try {
            // API call already done in RuleBuilder component
            // Refetch rules to get the latest data with full details
            const rulesData = await ruleApi.getRulesByDomain(container.uuid);
            setRules(rulesData);
            setRulesByDomain(container.uuid, rulesData);

            // Update container's rules based on fetched data
            const updatedRules: TrackingRule[] = rulesData.map(r => ({
                id: r.Id.toString(),
                name: r.Name,
                trigger: r.EventType.Name,
                selector: r.TrackingTarget?.Value || '',
                extraction: []
            }));
            setContainer({
                ...container,
                rules: updatedRules
            });
            
            setIsEditingRule(false);
            setCurrentRule(undefined);
            setCurrentRuleDetails(undefined);
        } catch (error) {
            console.error('Failed to save rule:', error);
            alert('Failed to save tracking rule. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleView = (id: string | number) => {
        const ruleToView = rules.find(r => r.Id.toString() === id.toString());
        console.log('Viewing rule:', ruleToView, 'from id:', id);
        if (ruleToView) {
            // Map to TrackingRule format
            const mappedRule: TrackingRule = {
                id: ruleToView.Id.toString(),
                name: ruleToView.Name,
                trigger: ruleToView.EventType.Name.toLowerCase(),
                selector: ruleToView.TrackingTarget?.Value || '',
                extraction: []
            };
            // Map to RuleDetailResponse format for compatibility
            const details: RuleDetailResponse = {
                Id: ruleToView.Id,
                Name: ruleToView.Name,
                DomainID: ruleToView.DomainID,
                EventTypeID: ruleToView.EventTypeID,
                TrackingTargetId: ruleToView.TrackingTargetId,
                TrackingTarget: ruleToView.TrackingTarget,
                Conditions: ruleToView.Conditions,
                PayloadMappings: ruleToView.PayloadMappings
            };
            setCurrentRule(mappedRule);
            setCurrentRuleDetails(details);
            setIsViewMode(true);
            setIsEditingRule(true);
        }
    };

    const handleEdit = (id: string | number) => {
        const ruleToEdit = rules.find(r => r.Id.toString() === id.toString());
        if (ruleToEdit) {
            // Map to TrackingRule format
            const mappedRule: TrackingRule = {
                id: ruleToEdit.Id.toString(),
                name: ruleToEdit.Name,
                trigger: ruleToEdit.EventType.Name.toLowerCase(),
                selector: ruleToEdit.TrackingTarget?.Value || '',
                extraction: []
            };
            // Map to RuleDetailResponse format for compatibility
            const details: RuleDetailResponse = {
                Id: ruleToEdit.Id,
                Name: ruleToEdit.Name,
                DomainID: ruleToEdit.DomainID,
                EventTypeID: ruleToEdit.EventTypeID,
                TrackingTargetId: ruleToEdit.TrackingTargetId,
                TrackingTarget: ruleToEdit.TrackingTarget,
                Conditions: ruleToEdit.Conditions,
                PayloadMappings: ruleToEdit.PayloadMappings
            };
            setCurrentRule(mappedRule);
            setCurrentRuleDetails(details);
            setIsViewMode(false);
            setIsEditingRule(true);
        }
    };

    const handleDelete = (id: string) => {
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
                            onClick={() => { 
                                setCurrentRule(undefined); 
                                setCurrentRuleDetails(undefined);
                                setIsViewMode(false);
                                setIsEditingRule(true); 
                            }}
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
                                {rules.map((rule, index) => {
                                    const triggerInfo = getTriggerTypeFromId(rule.EventTypeID);
                                    const TriggerIcon = triggerInfo.icon;
                                    return (
                                        <tr key={rule.Id}>
                                            <td>#{index + 1}</td>
                                            <td>
                                                <div className={styles.triggerCell}>
                                                    <TriggerIcon size={16} className={styles.triggerIcon} />
                                                    {triggerInfo.label}
                                                </div>
                                            </td>
                                            <td>{rule.Name}</td>
                                            <td>{rule.TrackingTarget?.Value || ''}</td>
                                            <td>
                                            <button 
                                                className={styles.editButton}
                                                onClick={() => handleView(rule.Id)}
                                                title="View details"
                                            >
                                                <Eye size={16} />
                                            </button>
                                            <button 
                                                className={styles.editButton}
                                                onClick={() => handleEdit(rule.Id)} 
                                                title="Edit"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button 
                                                className={styles.deleteButton}
                                                onClick={() => handleDelete(rule.Id.toString())}
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
                    ruleDetails={currentRuleDetails}
                    isViewMode={isViewMode}
                    onSave={saveRule} 
                    onCancel={() => {
                        setIsEditingRule(false);
                        setIsViewMode(false);
                        setCurrentRuleDetails(undefined);
                    }} 
                />
            )}
        </div>
    );
};
