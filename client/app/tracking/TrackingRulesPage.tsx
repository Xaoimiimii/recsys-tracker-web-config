import React, { useState, useEffect } from 'react';
import { Container, TrackingRule } from '../../types';
import { RuleBuilder, DOMAIN_INTERACTION_TYPES } from '../../components/dashboard/RuleBuilder';
import { Box, Plus, Trash2, Edit2, MousePointer, Eye, Star, ArrowDownCircle, MessageSquareHeart, ChevronDown, ChevronUp, Lightbulb, X, Database, AlertCircle } from 'lucide-react';
import { ruleApi, RuleListItem, RuleDetailResponse } from '../../lib/api/';
import { useDataCache } from '../../contexts/DataCacheContext';
import styles from './TrackingRulesPage.module.css';

// Mapping Source Types
enum MappingSource {
  REQUEST_BODY = 'request_body',
  REQUEST_URL = 'request_url',
  ELEMENT = 'element',
  COOKIE = 'cookie',
  LOCAL_STORAGE = 'local_storage',
  SESSION_STORAGE = 'session_storage',
}

const MAPPING_SOURCES = Object.values(MappingSource);

// Payload Mapping Interface
interface PayloadMapping {
  field: string;
  source: MappingSource;
  value?: string;
  requestUrlPattern?: string;
  requestMethod?: 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'GET';
  requestBodyPath?: string;
}

// Example data for modal
interface SectionExample {
  title: string;
  htmlContext?: string;
  config: string;
  config2?: string;
}

const PAYLOAD_EXAMPLES: SectionExample[] = [
  {
    title: "Request Body Mapping",
    htmlContext: "// Request Sample (POST)\nURL: /api/v1/user/profile\nBody: { \"username\": \"john_doe\", \"userId\": \"12345\" }\n\n// Response Body\n{ \"status\": \"ok\", \"data\": { \"id\": \"usr_99\" } }",
    config: "Source: request_body | URL Pattern: /api/v1/user/profile | Method: POST | Path: username"
  },
  {
    title: "Element Mapping",
    htmlContext: "// Target div containing user info\n<div class=\"user-profile\">\n  <span data-user-id=\"usr_404\">John Doe</span>\n</div>",
    config: "Source: element | Path: .user-profile [data-user-id]"
  },
  {
    title: "Cookie Mapping",
    htmlContext: "// Value stored in browser cookies\ndocument.cookie: \"user_id=xyz123; session=abc\"",
    config: "Source: cookie | Path: user_id"
  },
  {
    title: "Local Storage Mapping",
    htmlContext: "// Value stored in Local Storage\nlocalStorage.getItem(\"user_data\"): '{\"id\": \"123\", \"name\": \"John\"}'",
    config: "Source: local_storage | Path: user_data.id"
  },
  {
    title: "Session Storage Mapping",
    htmlContext: "// Value stored in Session Storage\nsessionStorage.getItem(\"current_user\"): \"user_abc_555\"",
    config: "Source: session_storage | Path: current_user"
  },
  {
    title: "Request URL Mapping",
    htmlContext: "// Sample URL\nhttps://example.com/api/user/john_doe/profile\n\n// Extract from URL path",
    config: "Source: request_url | URL Pattern: /api/user/:username/profile | Method: GET | Path Index: 3"
  }
];

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
    
    // User Identity Configuration states
    const [isUserConfigExpanded, setIsUserConfigExpanded] = useState(false);
    const [showUserConfigExamples, setShowUserConfigExamples] = useState(false);
    const [payloadMappings, setPayloadMappings] = useState<PayloadMapping[]>([
        { field: 'anonymousId', source: MappingSource.LOCAL_STORAGE, value: 'recsys_anon_id' }
    ]);
    const [errors, setErrors] = useState<{ payloadMappings?: { [key: number]: string } }>({});
    const [isSavingUserConfig, setIsSavingUserConfig] = useState(false);
    
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
                // API now returns full details including ItemIdentities, TrackingTarget, EventType
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
            const updatedRules: TrackingRule[] = rulesData.map(r => {
                // Get trigger name from EventTypeID
                const triggerInfo = getTriggerTypeFromId(r.EventTypeID);
                return {
                    id: r.Id.toString(),
                    name: r.Name,
                    trigger: triggerInfo.label,
                    selector: r.TrackingTarget || '',
                    extraction: []
                };
            });
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

    const getInteractionLabel = (eventTypeId: number, actionType: string | null | undefined, domainType: string | undefined) => {
        if (!domainType) return getTriggerTypeFromId(eventTypeId);
        
        const interactionTypes = DOMAIN_INTERACTION_TYPES[domainType] || DOMAIN_INTERACTION_TYPES['General'];
        const interaction = interactionTypes.find(t => 
            t.eventTypeId === eventTypeId && 
            (t.actionType === actionType || (t.actionType === null && actionType === null))
        );
        
        if (interaction) {
            return { label: interaction.label, icon: getTriggerTypeFromId(eventTypeId).icon };
        }
        
        return getTriggerTypeFromId(eventTypeId);
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
            const updatedRules: TrackingRule[] = rulesData.map(r => {
                const triggerInfo = getTriggerTypeFromId(r.EventTypeID);
                return {
                    id: r.Id.toString(),
                    name: r.Name,
                    trigger: triggerInfo.label,
                    selector: r.TrackingTarget || '',
                    extraction: []
                };
            });
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
            const triggerInfo = getTriggerTypeFromId(ruleToView.EventTypeID);
            const mappedRule: TrackingRule = {
                id: ruleToView.Id.toString(),
                name: ruleToView.Name,
                trigger: triggerInfo.label.toLowerCase(),
                selector: ruleToView.TrackingTarget || '',
                extraction: []
            };
            // Map to RuleDetailResponse format for compatibility
            const details: RuleDetailResponse = {
                Id: ruleToView.Id,
                Name: ruleToView.Name,
                DomainID: ruleToView.DomainID,
                EventTypeID: ruleToView.EventTypeID,
                TrackingTarget: ruleToView.TrackingTarget,
                ActionType: ruleToView.ActionType,
                ItemIdentities: ruleToView.ItemIdentities
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
            const triggerInfo = getTriggerTypeFromId(ruleToEdit.EventTypeID);
            const mappedRule: TrackingRule = {
                id: ruleToEdit.Id.toString(),
                name: ruleToEdit.Name,
                trigger: triggerInfo.label.toLowerCase(),
                selector: ruleToEdit.TrackingTarget || '',
                extraction: []
            };
            // Map to RuleDetailResponse format for compatibility
            const details: RuleDetailResponse = {
                Id: ruleToEdit.Id,
                Name: ruleToEdit.Name,
                DomainID: ruleToEdit.DomainID,
                EventTypeID: ruleToEdit.EventTypeID,
                TrackingTarget: ruleToEdit.TrackingTarget,
                ActionType: ruleToEdit.ActionType,
                ItemIdentities: ruleToEdit.ItemIdentities
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

    const handleUpdateMapping = (index: number, updates: Partial<PayloadMapping>) => {
        const newMappings = [...payloadMappings];
        let updatedMapping = { ...newMappings[index], ...updates };

        const nextField = (updates.field ?? newMappings[index].field);
        const previousField = newMappings[index].field;

        // Reset all config fields when switching from anonymousId to userId
        if (updates.field && previousField === 'anonymousId' && nextField === 'userId') {
            updatedMapping = {
                field: 'userId',
                source: MappingSource.LOCAL_STORAGE,
                value: undefined,
                requestUrlPattern: undefined,
                requestMethod: undefined,
                requestBodyPath: undefined,
            };
        }
        // Set default config for anonymousId
        else if (nextField === 'anonymousId') {
            updatedMapping = {
                ...updatedMapping,
                source: MappingSource.LOCAL_STORAGE,
                value: 'recsys_anon_id',
                requestUrlPattern: undefined,
                requestMethod: undefined,
                requestBodyPath: undefined,
            };
        }
        // Reset config fields when changing source
        else if (updates.source && updates.source !== newMappings[index].source) {
            if (updates.source === MappingSource.REQUEST_URL) {
                updatedMapping = {
                    ...updatedMapping,
                    value: undefined,
                    requestBodyPath: undefined,
                };
            } else if (updates.source === MappingSource.REQUEST_BODY) {
                updatedMapping = {
                    ...updatedMapping,
                    value: undefined,
                    requestUrlPattern: undefined,
                    requestMethod: undefined,
                };
            } else if ([MappingSource.ELEMENT, MappingSource.COOKIE, MappingSource.LOCAL_STORAGE, MappingSource.SESSION_STORAGE].includes(updates.source)) {
                updatedMapping = {
                    ...updatedMapping,
                    value: undefined,
                    requestUrlPattern: undefined,
                    requestMethod: undefined,
                    requestBodyPath: undefined,
                };
            }
        }

        newMappings[index] = updatedMapping;
        setPayloadMappings(newMappings);
        
        // Clear error for this field if exists
        if (errors.payloadMappings?.[index]) {
            const newPayloadErrors = {...errors.payloadMappings};
            delete newPayloadErrors[index];
            setErrors(prev => ({...prev, payloadMappings: newPayloadErrors}));
        }
    };

    const handleSaveUserConfig = async () => {
        if (!container) return;
    }

    return (
        <div className={styles.container}>
            {/* User Config Examples Modal */}
            {showUserConfigExamples && (
                <div className={styles.modalOverlay} onClick={() => setShowUserConfigExamples(false)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <X className={styles.modalClose} size={24} onClick={() => setShowUserConfigExamples(false)} />
                        <h2 className={styles.modalTitle}>
                            <Lightbulb className={styles.modalLightbulbIcon} size={24} />
                            User Identity Configuration Examples
                        </h2>
                        <div className={styles.modalContent}>
                            {PAYLOAD_EXAMPLES.map((example, idx) => (
                                <div key={idx} className={styles.exampleCard}>
                                    <div className={styles.exampleLabel}>{example.title}</div>
                                    
                                    {example.htmlContext && (
                                        <div className={styles.exampleHtmlContext}>
                                            <p className={styles.exampleHtmlTitle}>Context Example:</p>
                                            <pre className={styles.examplePre}>
                                                {example.htmlContext}
                                            </pre>
                                        </div>
                                    )}

                                    <div className={styles.exampleDivider}></div>
                                    
                                    <p className={styles.exampleConfigTitle}>Config sample:</p>
                                    <code className={`${styles.exampleCode} ${styles.noMargin}`}>
                                        {example.config}
                                    </code>
                                    {example.config2 && (
                                        <code className={`${styles.exampleCode} ${styles.exampleCodeMargin}`}>
                                            {example.config2}
                                        </code>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
            
            {!isEditingRule ? (
                <div className={styles.contentWrapper}>
                    <div className={styles.rulesCard}>
                        <div className={`${styles.cardHeader} ${styles.noMargin}`}>
                            <div className={styles.userConfigHeader}>
                                <h3 className={styles.rulesTitle} style={{ cursor: 'pointer', flex: 1 }} onClick={() => setIsUserConfigExpanded(!isUserConfigExpanded)}>
                                    Identify Current User
                                </h3>
                                <Lightbulb 
                                    size={18} 
                                    className={styles.lightbulb}
                                    onClick={() => setShowUserConfigExamples(true)}
                                    title="View configuration examples"
                                />
                            </div>
                            <div style={{ cursor: 'pointer' }} onClick={() => setIsUserConfigExpanded(!isUserConfigExpanded)}>
                                {isUserConfigExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            </div>
                        </div>
                        {isUserConfigExpanded && (
                            <div className={styles.userConfigContent}>
                                <div className={styles.tableWrapper}>
                                    <table className={styles.table}>
                                        <thead>
                                            <tr>
                                                <th className={`${styles.th} ${styles.thWidth180}`}>Data Field</th>
                                                <th className={`${styles.th} ${styles.thWidth180}`}>Source</th>
                                                <th className={styles.th}>Details / Configuration</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {payloadMappings.map((mapping, idx) => {
                                                const isUserIdField = mapping.field === 'anonymousId' || mapping.field === 'userId';
                                                
                                                return (
                                                    <React.Fragment key={idx}>
                                                        <tr>
                                                            <td className={`${styles.td} ${styles.tdVerticalTop}`}>
                                                                {isUserIdField ? (
                                                                    <div className={styles.radioGroup}>
                                                                        <label className={styles.radioLabel}>
                                                                            <input 
                                                                                type="radio" 
                                                                                name={`user-field-${idx}`} 
                                                                                checked={mapping.field === 'anonymousId'} 
                                                                                onChange={() => handleUpdateMapping(idx, { field: 'anonymousId' })} 
                                                                            />
                                                                            AnonymousId
                                                                        </label>
                                                                        <label className={styles.radioLabel}>
                                                                            <input 
                                                                                type="radio" 
                                                                                name={`user-field-${idx}`} 
                                                                                checked={mapping.field === 'userId'} 
                                                                                onChange={() => handleUpdateMapping(idx, { field: 'userId' })} 
                                                                            />
                                                                            UserId
                                                                        </label>
                                                                    </div>
                                                                ) : (
                                                                    <span className={styles.fieldTag}>{mapping.field}</span>
                                                                )}
                                                            </td>
                                                            <td className={`${styles.td} ${styles.tdVerticalTop}`}>
                                                                <select 
                                                                    className={styles.input}
                                                                    value={mapping.source}
                                                                    disabled={mapping.field === 'anonymousId'}
                                                                    onChange={e => handleUpdateMapping(idx, { source: e.target.value as MappingSource })}
                                                                >
                                                                    {MAPPING_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                                                                </select>
                                                            </td>
                                                            <td className={styles.td}>
                                                                {/* SOURCE SPECIFIC INPUTS */}
                                                                {mapping.source === MappingSource.REQUEST_BODY && (
                                                                    <div className={styles.urlParsingContainer}>
                                                                        <div className={styles.urlParsingInputRow}>
                                                                            <input 
                                                                                type="text" 
                                                                                placeholder="URL Pattern (/api/user/profile)" 
                                                                                className={`${styles.input} ${styles.urlParsingInputFlex2} ${errors.payloadMappings?.[idx] ? styles.inputError : ''}`}
                                                                                value={mapping.requestUrlPattern || ''}                                                                            
                                                                                disabled={mapping.field === 'anonymousId'}                                                                                onChange={e => {
                                                                                    handleUpdateMapping(idx, { requestUrlPattern: e.target.value });
                                                                                    if (errors.payloadMappings?.[idx]) {
                                                                                        const newPayloadErrors = {...errors.payloadMappings};
                                                                                        delete newPayloadErrors[idx];
                                                                                        setErrors(prev => ({...prev, payloadMappings: newPayloadErrors}));
                                                                                    }
                                                                                }}
                                                                            />
                                                                            <select 
                                                                                className={`${styles.input} ${styles.urlParsingInputFlex1}`}
                                                                                value={mapping.requestMethod || 'POST'}
                                                                                onChange={e => handleUpdateMapping(idx, { requestMethod: e.target.value as any })}
                                                                            >
                                                                                <option>POST</option><option>PUT</option><option>PATCH</option><option>DELETE</option><option>GET</option>
                                                                            </select>
                                                                        </div>
                                                                        <input 
                                                                            type="text" 
                                                                            placeholder="Body Path (e.g., user.id)" 
                                                                            className={`${styles.input} ${errors.payloadMappings?.[idx] ? styles.inputError : ''}`}
                                                                            value={mapping.value || ''}
                                                                            onChange={e => {
                                                                                handleUpdateMapping(idx, { value: e.target.value });
                                                                                if (errors.payloadMappings?.[idx]) {
                                                                                    const newPayloadErrors = {...errors.payloadMappings};
                                                                                    delete newPayloadErrors[idx];
                                                                                    setErrors(prev => ({...prev, payloadMappings: newPayloadErrors}));
                                                                                }
                                                                            }}
                                                                        />
                                                                        {errors.payloadMappings?.[idx] && (
                                                                            <p className={styles.errorText}>
                                                                                <AlertCircle size={14} />
                                                                                {errors.payloadMappings[idx]}
                                                                            </p>
                                                                        )}
                                                                        <div className={styles.fieldNote}>
                                                                            Specify the JSON path within the request/response body to extract the desired value. 
                                                                            <br />
                                                                            For example, for a request/response body like <code>{'{"user": {"id": "12345"}}'}</code>, the path to extract the ID would be <strong>user.id</strong>.
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {mapping.source === MappingSource.REQUEST_URL && (
                                                                    <div className={styles.urlParsingContainer}>
                                                                        <div className={styles.urlParsingInputRow}>
                                                                            <input 
                                                                                type="text" 
                                                                                placeholder="URL Pattern (/api/user/:id)" 
                                                                                className={`${styles.input} ${styles.urlParsingInputFlex2} ${errors.payloadMappings?.[idx] ? styles.inputError : ''}`}
                                                                                value={mapping.requestUrlPattern || ''}                                                                            
                                                                                disabled={mapping.field === 'anonymousId'}                                                                                onChange={e => {
                                                                                    handleUpdateMapping(idx, { requestUrlPattern: e.target.value });
                                                                                    if (errors.payloadMappings?.[idx]) {
                                                                                        const newPayloadErrors = {...errors.payloadMappings};
                                                                                        delete newPayloadErrors[idx];
                                                                                        setErrors(prev => ({...prev, payloadMappings: newPayloadErrors}));
                                                                                    }
                                                                                }}
                                                                            />
                                                                            <select 
                                                                                className={`${styles.input} ${styles.urlParsingInputFlex1}`}
                                                                                value={mapping.requestMethod || 'POST'}
                                                                                disabled={mapping.field === 'anonymousId'}
                                                                                onChange={e => handleUpdateMapping(idx, { requestMethod: e.target.value as any })}
                                                                            >
                                                                                <option>POST</option><option>PUT</option><option>PATCH</option><option>DELETE</option><option>GET</option>
                                                                            </select>
                                                                        </div>
                                                                        <input 
                                                                            type="number" 
                                                                            placeholder="Path Index (e.g. 3 for :id)" 
                                                                            className={`${styles.input} ${errors.payloadMappings?.[idx] ? styles.inputError : ''}`}
                                                                            value={mapping.value || ''}
                                                                            disabled={mapping.field === 'anonymousId'}
                                                                            onChange={e => {
                                                                                handleUpdateMapping(idx, { value: e.target.value });
                                                                                if (errors.payloadMappings?.[idx]) {
                                                                                    const newPayloadErrors = {...errors.payloadMappings};
                                                                                    delete newPayloadErrors[idx];
                                                                                    setErrors(prev => ({...prev, payloadMappings: newPayloadErrors}));
                                                                                }
                                                                            }}
                                                                        />
                                                                        {errors.payloadMappings?.[idx] && (
                                                                            <p className={styles.errorText}>
                                                                                <AlertCircle size={14} />
                                                                                {errors.payloadMappings[idx]}
                                                                            </p>
                                                                        )}
                                                                        <div className={styles.fieldNote}>
                                                                            Specify the path index from the URL to extract the desired value.
                                                                            <br />
                                                                            For example, in request URL <strong>www.example.com/api/users/:id</strong>, the path index for <strong>:id</strong> is <strong>3</strong>.
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {mapping.source === MappingSource.ELEMENT && (
                                                                    <div>
                                                                        <input 
                                                                            type="text"
                                                                            placeholder='CSS Selector (e.g. [data-user-id])'
                                                                            className={`${styles.input} ${errors.payloadMappings?.[idx] ? styles.inputError : ''}`}
                                                                            value={mapping.value || ''}                                                                            
                                                                            disabled={mapping.field === 'anonymousId'}                                                                            
                                                                            onChange={e => {
                                                                                handleUpdateMapping(idx, { value: e.target.value });
                                                                                if (errors.payloadMappings?.[idx]) {
                                                                                    const newPayloadErrors = {...errors.payloadMappings};
                                                                                    delete newPayloadErrors[idx];
                                                                                    setErrors(prev => ({...prev, payloadMappings: newPayloadErrors}));
                                                                                }
                                                                            }}
                                                                        />
                                                                        {errors.payloadMappings?.[idx] && (
                                                                            <p className={styles.errorText}>
                                                                                <AlertCircle size={14} />
                                                                                {errors.payloadMappings[idx]}
                                                                            </p>
                                                                        )}
                                                                        <div className={styles.fieldNote}>
                                                                            Specify a valid CSS selector to extract the value from the target element on the webpage. 
                                                                            <br />
                                                                            For example, to extract user ID from an element like <code>{'<div data-user-id="usr123">John</div>'}</code>, use the selector <strong>[data-user-id]</strong>.
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            
                                                                {mapping.source !== MappingSource.REQUEST_BODY && mapping.source !== MappingSource.REQUEST_URL && mapping.source !== MappingSource.ELEMENT && (
                                                                    <div>
                                                                        <input 
                                                                            type="text"
                                                                            placeholder='Path (e.g. user.id)'
                                                                            className={`${styles.input} ${errors.payloadMappings?.[idx] ? styles.inputError : ''}`}
                                                                            value={mapping.value || ''}
                                                                            disabled={mapping.field === 'anonymousId'}
                                                                            onChange={e => {
                                                                                handleUpdateMapping(idx, { value: e.target.value });
                                                                                if (errors.payloadMappings?.[idx]) {
                                                                                    const newPayloadErrors = {...errors.payloadMappings};
                                                                                    delete newPayloadErrors[idx];
                                                                                    setErrors(prev => ({...prev, payloadMappings: newPayloadErrors}));
                                                                                }
                                                                            }}
                                                                        />
                                                                        {errors.payloadMappings?.[idx] && (
                                                                            <p className={styles.errorText}>
                                                                                <AlertCircle size={14} />
                                                                                {errors.payloadMappings[idx]}
                                                                            </p>
                                                                        )}
                                                                        <div className={styles.fieldNote}>
                                                                            Specify the data path to extract the desired value from the selected source. 
                                                                            <br />
                                                                            For example, for a JSON object like <code>{'{"user": {"id": "12345"}}'}</code>, the path to extract the user ID would be <strong>user.id</strong>.
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    </React.Fragment>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                                { payloadMappings.some(mapping => mapping.field === 'anonymousId') && (
                                    <div className={styles.configNote}>
                                        <p><strong>Note:</strong> Anonymous ID has limitations in tracking user behavior across sessions. We recommend configuring User ID for better tracking accuracy. </p>
                                    </div>
                                )}
                                { payloadMappings.some(mapping => mapping.field === 'userId') && (
                                    <div className={styles.configNote}>
                                        <p><strong>Note:</strong> We will attempt to capture user information according to this configuration, but will fall back to anonymous ID if capture fails.</p>
                                    </div>
                                )}

                                <div className={styles.userConfigActions}>
                                    <button 
                                        onClick={handleSaveUserConfig}
                                        className={styles.saveConfigButton}
                                        disabled={isSavingUserConfig}
                                    >
                                        <Database size={16} />
                                        {isSavingUserConfig ? 'Saving...' : 'Save Configuration'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
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
                                        <th>Event Type</th>
                                        <th>Rule Name</th>
                                        <th>Tracking Target</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rules.map((rule, index) => {
                                        const interactionInfo = getInteractionLabel(rule.EventTypeID, rule.ActionType, container?.domainType);
                                        const InteractionIcon = interactionInfo.icon;
                                        return (
                                            <tr key={rule.Id}>
                                                <td>#{index + 1}</td>
                                                <td>
                                                    <div className={styles.triggerCell}>
                                                        <InteractionIcon size={16} className={styles.triggerIcon} />
                                                        {interactionInfo.label}
                                                    </div>
                                                </td>
                                                <td>{rule.Name}</td>
                                                <td>{rule.TrackingTarget || ''}</td>
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
                </div>
            ) : (
                <RuleBuilder 
                    domainKey={container?.uuid || ''} 
                    domainType={container?.domainType}
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
