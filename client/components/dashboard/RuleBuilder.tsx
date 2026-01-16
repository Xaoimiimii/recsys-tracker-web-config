import React, { useState, useEffect } from 'react';
import { Lightbulb, X, Fingerprint, Target, Database, AlertCircle, Loader2, Save } from 'lucide-react';
import styles from './RuleBuilder.module.css';
import { ruleApi } from '../../lib/api/rule';

// ==================== TYPES ====================

export interface InteractionTypeOption {
  label: string;
  actionType: ActionType | null;
  eventTypeId: number;
}

export const DOMAIN_INTERACTION_TYPES: Record<string, InteractionTypeOption[]> = {
  'Music Streaming': [
    { label: 'Play song', actionType: 'View' as ActionType, eventTypeId: 1 },
    { label: 'Add song to favorite', actionType: 'AddToFavorite' as ActionType, eventTypeId: 1 },
    { label: 'Add song to playlist', actionType: 'AddToWishlist' as ActionType, eventTypeId: 1 },
    { label: 'Download song', actionType: 'AddToCart' as ActionType, eventTypeId: 1 },
    { label: 'Buy/Unlock song', actionType: 'Purchase' as ActionType, eventTypeId: 1 },
    { label: 'Rating song', actionType: null, eventTypeId: 2 },
    { label: 'Review song', actionType: null, eventTypeId: 3 },
  ],
  'Movies & Video': [
    { label: 'Play video', actionType: 'View' as ActionType, eventTypeId: 1 },
    { label: 'Add video to favorite', actionType: 'AddToFavorite' as ActionType, eventTypeId: 1 },
    { label: 'Add video to watchlist / watch later', actionType: 'AddToWishlist' as ActionType, eventTypeId: 1 },
    { label: 'Download video', actionType: 'AddToCart' as ActionType, eventTypeId: 1 },
    { label: 'Buy/Unlock video', actionType: 'Purchase' as ActionType, eventTypeId: 1 },
    { label: 'Rating movie / video', actionType: null, eventTypeId: 2 },
    { label: 'Review movie / video', actionType: null, eventTypeId: 3 },
  ],
  'E-Commerce': [
    { label: 'View product', actionType: 'View' as ActionType, eventTypeId: 1 },
    { label: 'Add product to favorite', actionType: 'AddToFavorite' as ActionType, eventTypeId: 1 },
    { label: 'Add product to wishlist', actionType: 'AddToWishlist' as ActionType, eventTypeId: 1 },
    { label: 'Add product to cart', actionType: 'AddToCart' as ActionType, eventTypeId: 1 },
    { label: 'Purchase / Checkout', actionType: 'Purchase' as ActionType, eventTypeId: 1 },
    { label: 'Rating product', actionType: null, eventTypeId: 2 },
    { label: 'Review product', actionType: null, eventTypeId: 3 },
  ],
  'News & Media': [
    { label: 'View article', actionType: 'View' as ActionType, eventTypeId: 1 },
    { label: 'Save/Bookmark article', actionType: 'AddToFavorite' as ActionType, eventTypeId: 1 },
    { label: 'Add to read later', actionType: 'AddToWishlist' as ActionType, eventTypeId: 1 },
    { label: 'Download article', actionType: 'AddToCart' as ActionType, eventTypeId: 1 },
    { label: 'Buy/Unlock paywall', actionType: 'Purchase' as ActionType, eventTypeId: 1 },
    { label: 'Rating article', actionType: null, eventTypeId: 2 },
    { label: 'Review article', actionType: null, eventTypeId: 3 },
  ],
  'General': [
    { label: 'View product', actionType: 'View' as ActionType, eventTypeId: 1 },
    { label: 'Add to favorite', actionType: 'AddToFavorite' as ActionType, eventTypeId: 1 },
    { label: 'Add to wishlist', actionType: 'AddToWishlist' as ActionType, eventTypeId: 1 },
    { label: 'Add to cart', actionType: 'AddToCart' as ActionType, eventTypeId: 1 },
    { label: 'Purchase / Checkout', actionType: 'Purchase' as ActionType, eventTypeId: 1 },
    { label: 'Rating product', actionType: null, eventTypeId: 2 },
    { label: 'Review product', actionType: null, eventTypeId: 3 },
  ],
};

export enum EventType {
  CLICK = 'Click',
  RATING = 'Rating',
  REVIEW = 'Review'
}

export enum MappingSource {
  REQUEST_BODY = 'request_body',
  REQUEST_URL = 'request_url',
  ELEMENT = 'element'
}

export enum ActionType {
  VIEW = 'View',
  ADD_TO_FAVORITE = 'AddToFavorite',
  ADD_TO_WISHLIST = 'AddToWishlist',
  ADD_TO_CART = 'AddToCart',
  PURCHASE = 'Purchase'
}

export interface PayloadMapping {
  field: string;
  source: MappingSource;
  value?: string;
  requestUrlPattern?: string;
  requestMethod?: 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'GET';
  urlExtractType?: 'pathname' | 'query';
}

export interface TrackingRule {
  id: string;
  name: string;
  eventType: EventType;
  actionType?: ActionType;
  targetElement?: {
    selector: string;
  };
  payloadMappings: PayloadMapping[];
}

// ==================== CONSTANTS ====================

export const EVENT_DESCRIPTIONS: Record<EventType, string> = {
  [EventType.CLICK]: "Tracks click behaviors on interface elements like Buttons or Icons.",
  [EventType.RATING]: "Records user rating actions through score or star components.",
  [EventType.REVIEW]: "Collects data when users submit text comments or detailed feedback."
};

export const TARGET_SUGGESTIONS: Record<EventType, string> = {
  [EventType.CLICK]: "Suggested: #add-to-cart, .add-to-cart, favorite-btn, .bookmark-icon",
  [EventType.RATING]: "Suggested: .rating, .rating-stars, .star, input[type=radio][name*=rating]",
  [EventType.REVIEW]: "Suggested: #review, .review-box, textarea[name*=review], .submit-review"
};

export interface SectionExample {
  title: string;
  htmlContext?: string;
  config: string;
}

const PAYLOAD_COMMON_EXAMPLES: SectionExample[] = [
  {
    title: "Request Body Mapping",
    htmlContext: "// Request Sample (POST)\nURL: /api/v1/reviews/submit\nBody: { \"content\": \"Great!\", \"user_id\": 501 }",
    config: "Source: request_body | URL Pattern: /api/v1/reviews/submit | Method: POST | Path: content"
  },
  {
    title: "Request URL - PathName Mapping",
    htmlContext: "// Sample request URL\nhttps://example.com/api/product/2912917937/details",
    config: "RequestUrlPattern: \"/api/product/{id}\" | RequestMethod: \"GET\" | PathName - SegmentIndex: 3 (gets '2912917937')"
  },
  {
    title: "Request URL - Query Parameter Mapping",
    htmlContext: "// Sample request URL\nhttps://example.com/api/submit-review?item_id=2912917937&ref=homepage",
    config: "RequestUrlPattern: \"/api/submit-review\" | RequestMethod: \"POST\" | QueryParam - Key: item_id"
  },
  {
    title: "Element Mapping",
    htmlContext: "// Target div containing item ID\n<div class=\"product-card\" data-id=\"item_404\"></div>",
    config: "Source: element | Path: .product-card"
  }
];

export const SECTION_EXAMPLES: Record<string, Record<EventType, SectionExample[]>> = {
  target: {
    [EventType.CLICK]: [
      { 
        title: "Buy Button Example", 
        htmlContext: '<button class="btn-buy" id="cart-add">Add to Cart</button>',
        config: "Target Type: 'CSS Selector' | Value: '.btn-buy' or '#cart-add'" 
      }
    ],
    [EventType.RATING]: [
      { 
        title: "Star Rating Component", 
        htmlContext: '<div class="rating-stars" data-value="5"></div>',
        config: "Target Type: 'CSS Selector' | Value: '.submit-rating' or '#submit-rating'"
      }
    ],
    [EventType.REVIEW]: [
      { 
        title: "Submit Feedback Form", 
        htmlContext: '<form id="review-form">\n  <textarea name="review"></textarea>\n  <button type="submit">Submit</button>\n</form>',
        config: "Target Type: 'CSS Selector' | Value: '#review-form' or 'textarea[name=review]'"
      }
    ]
  },
  payload: {
    [EventType.CLICK]: PAYLOAD_COMMON_EXAMPLES,
    [EventType.REVIEW]: PAYLOAD_COMMON_EXAMPLES,
    [EventType.RATING]: PAYLOAD_COMMON_EXAMPLES
  }
};

export const INITIAL_MAPPINGS: Record<string, string[]> = {
  [EventType.CLICK]: ['itemId'],
  [EventType.RATING]: ['itemId', 'rating_value'],
  [EventType.REVIEW]: ['itemId', 'review_text']
};

// ==================== COMPONENT ====================

interface RuleBuilderProps {
  onSave: (response: { statusCode: number; message: string }) => void;
  onCancel: () => void;
  domainKey: string;
  domainType?: string;
}

export const RuleBuilder: React.FC<RuleBuilderProps> = ({ 
  onSave, 
  onCancel, 
  domainKey,
  domainType = 'General'
}) => {
  
  const interactionTypes = DOMAIN_INTERACTION_TYPES[domainType] || DOMAIN_INTERACTION_TYPES['General'];
  const [selectedInteractionType, setSelectedInteractionType] = useState<string>(interactionTypes[0]?.label || '');
  
  const [rule, setRule] = useState<TrackingRule>({
    id: 'new-rule-' + Date.now(),
    name: '',
    eventType: EventType.CLICK,
    actionType: ActionType.VIEW,
    targetElement: { selector: '' },
    payloadMappings: []
  });

  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<{
    ruleName?: string;
    targetElement?: string;
    payloadMappings?: { [key: number]: string };
  }>({});
  const [modalContent, setModalContent] = useState<{title: string, examples: SectionExample[]} | null>(null);

  // Initialize payloadMappings when interaction type changes
  useEffect(() => {
    if (!selectedInteractionType) return;
    
    const selectedInteraction = interactionTypes.find(it => it.label === selectedInteractionType);
    if (!selectedInteraction) return;
    
    const eventTypeMap: Record<number, EventType> = {
      1: EventType.CLICK,
      2: EventType.RATING,
      3: EventType.REVIEW
    };
    
    const eventType = eventTypeMap[selectedInteraction.eventTypeId] || EventType.CLICK;
    const initialFields = INITIAL_MAPPINGS[eventType] || [];
    
    setRule(prev => ({
      ...prev,
      eventType: eventType,
      actionType: selectedInteraction.actionType as any,
      targetElement: { selector: '' },
      payloadMappings: initialFields.map(field => ({
        field,
        source: MappingSource.ELEMENT,
        value: '',
        urlExtractType: 'pathname'
      }))
    }));
  }, [selectedInteractionType, interactionTypes]);

  // Handle mapping updates
  const handleUpdateMapping = (index: number, updates: Partial<PayloadMapping>) => {
    const newMappings = [...rule.payloadMappings];
    let updatedMapping = { ...newMappings[index], ...updates };

    // Reset fields when source changes
    if (updates.source) {
      if (updates.source === MappingSource.REQUEST_URL) {
        updatedMapping = {
          ...updatedMapping,
          value: '',
          requestUrlPattern: '',
          requestMethod: 'GET',
          urlExtractType: 'pathname'
        };
      } else if (updates.source === MappingSource.REQUEST_BODY) {
        updatedMapping = {
          ...updatedMapping,
          value: '',
          requestUrlPattern: '',
          requestMethod: 'POST',
          urlExtractType: undefined
        };
      } else if (updates.source === MappingSource.ELEMENT) {
        updatedMapping = {
          ...updatedMapping,
          value: '',
          requestUrlPattern: undefined,
          requestMethod: undefined,
          urlExtractType: undefined
        };
      }
    }

    // Reset value when urlExtractType changes for request_url
    if (updates.urlExtractType && newMappings[index].source === MappingSource.REQUEST_URL) {
      updatedMapping.value = '';
    }

    newMappings[index] = updatedMapping;
    setRule(prev => ({ ...prev, payloadMappings: newMappings }));
  };

  // Save handler
  const handleSave = async () => {
    setErrors({});
    const newErrors: {
      ruleName?: string;
      targetElement?: string;
      payloadMappings?: { [key: number]: string };
    } = {};

    // Validation 1: Rule Name
    if (!rule.name.trim()) {
      newErrors.ruleName = 'Rule Name is required.';
    }

    // Validation 2: Target Element
    if (!rule.targetElement?.selector?.trim()) {
      newErrors.targetElement = 'Target Element selector is required.';
    }

    // Validation 3: Payload Mappings
    const payloadErrors: { [key: number]: string } = {};
    rule.payloadMappings.forEach((mapping, idx) => {
      if (mapping.source === MappingSource.REQUEST_BODY) {
        if (!mapping.requestUrlPattern?.trim() || !mapping.value?.trim()) {
          payloadErrors[idx] = 'URL Pattern and Body Path are required.';
        }
      } else if (mapping.source === MappingSource.REQUEST_URL) {
        if (!mapping.requestUrlPattern?.trim() || !mapping.value?.trim()) {
          payloadErrors[idx] = 'URL Pattern and value are required.';
        }
      } else if (mapping.source === MappingSource.ELEMENT) {
        if (!mapping.value?.trim()) {
          payloadErrors[idx] = 'CSS Selector is required.';
        }
      }
    });

    if (Object.keys(payloadErrors).length > 0) {
      newErrors.payloadMappings = payloadErrors;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSaving(true);
    
    try {
      const selectedInteraction = interactionTypes.find(it => it.label === selectedInteractionType);
      const eventTypeId = selectedInteraction?.eventTypeId || 1;
      const actionType = selectedInteraction?.actionType || null;

      const trackingTarget = rule.targetElement?.selector || '';

      // Build PayloadMapping from payload mappings
      const fieldNameMap: Record<string, string> = {
        'itemId': 'ItemId',
        'rating_value': 'Rating',
        'review_text': 'Review'
      };

      const payloadMapping: any[] = [];
      
      rule.payloadMappings.forEach(mapping => {
        const fieldName = fieldNameMap[mapping.field];
        if (!fieldName) return;

        const mappingItem: any = {
          Field: fieldName,
          Source: mapping.source
        };

        if (mapping.source === MappingSource.REQUEST_BODY) {
          mappingItem.Config = {
            RequestUrlPattern: mapping.requestUrlPattern || null,
            RequestMethod: mapping.requestMethod || 'POST',
            Value: mapping.value || null
          };
        } else if (mapping.source === MappingSource.REQUEST_URL) {
          mappingItem.Config = {
            RequestUrlPattern: mapping.requestUrlPattern || null,
            RequestMethod: mapping.requestMethod || 'GET',
            Value: mapping.value || null,
            ExtractType: mapping.urlExtractType || 'pathname'
          };
        } else if (mapping.source === MappingSource.ELEMENT) {
          mappingItem.Config = {
            SelectorPattern: mapping.value || null
          };
        }

        payloadMapping.push(mappingItem);
      });

      const payload = {
        Name: rule.name,
        DomainKey: domainKey,
        EventTypeId: eventTypeId,
        ActionType: actionType,
        PayloadMapping: payloadMapping,
        TrackingTarget: trackingTarget
      };

      const response = await ruleApi.create(payload);
      
      setIsSaving(false);
      onSave(response);
    } catch (error) {
      setIsSaving(false);
      onSave({ 
        statusCode: 500, 
        message: error instanceof Error ? error.message : 'Failed to save rule' 
      });
    }
  };

  const openExamples = (section: string) => {
    const examples = SECTION_EXAMPLES[section][rule.eventType] || [];
    setModalContent({
      title: `Config Examples: ${section.toUpperCase()}`,
      examples: examples
    });
  };

  const SectionHeader = ({ title, icon, sectionKey, required = false }: { title: string, icon: React.ReactNode, sectionKey?: string, required?: boolean }) => (
    <div className={styles.sectionHeader}>
      <div className={styles.headerIcon}>{icon}</div>
      <h3 className={styles.sectionTitle}>
        {title}
        {required && <span className={styles.required}>*</span>}
      </h3>
      {sectionKey && (
        <Lightbulb
          className={styles.lightbulb}
          size={18}
          title="View example configs" 
          onClick={() => openExamples(sectionKey)}
        />
      )}
    </div>
  );

  return (
    <div className={styles.mainContainer}>
      {/* Modal for Examples */}
      {modalContent && (
        <div className={styles.modalOverlay} onClick={() => setModalContent(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <X className={styles.modalClose} size={24} onClick={() => setModalContent(null)} />
            <h2 className={styles.modalTitle}>
              <Lightbulb className={styles.modalLightbulbIcon} size={24} />
              {modalContent.title}
            </h2>
            {modalContent.examples.length === 0 ? (
              <p className={styles.noExamplesText}>No specific examples available.</p>
            ) : (
              modalContent.examples.map((ex, i) => (
                <div key={i} className={styles.exampleCard}>
                  <div className={styles.exampleLabel}>{ex.title}</div>
                  {ex.htmlContext && (
                    <div className={styles.exampleHtmlContext}>
                      <p className={styles.exampleHtmlTitle}>HTML Example:</p>
                      <pre className={styles.examplePre}>{ex.htmlContext}</pre>
                    </div>
                  )}
                  <div className={styles.exampleDivider}></div>
                  <p className={styles.exampleConfigTitle}>Config:</p>
                  <code className={styles.exampleCode}>{ex.config}</code>
                </div>
              ))
            )}
            <button className={`${styles.btnPrimary} ${styles.modalCloseButton}`} onClick={() => setModalContent(null)}>
              Close
            </button>
          </div>
        </div>
      )}

      <div className={styles.formSection}>
        {/* 1. Event Identification */}
        <div className={styles.card}>
          <SectionHeader title="Event Identification" icon={<Fingerprint size={14} />} />
          <div className={styles.grid2}>
            <div>
              <label className={styles.label}>Rule Name</label>
              <input 
                type="text"
                placeholder="e.g., Click Buy Button"
                className={`${styles.input} ${errors.ruleName ? styles.inputError : ''}`}
                value={rule.name}
                onChange={e => {
                  setRule({...rule, name: e.target.value});
                  if (errors.ruleName) setErrors(prev => ({...prev, ruleName: undefined}));
                }}
              />
              {errors.ruleName && (
                <p className={styles.errorText}>
                  <AlertCircle size={14} />
                  {errors.ruleName}
                </p>
              )}
            </div>
            <div>
              <label className={styles.label}>Interaction Type</label>
              <select 
                className={styles.input}
                value={selectedInteractionType}
                onChange={e => setSelectedInteractionType(e.target.value)}
              >
                {interactionTypes.map(it => (
                  <option key={it.label} value={it.label}>{it.label}</option>
                ))}
              </select>
              <p className={styles.description}>{EVENT_DESCRIPTIONS[rule.eventType]}</p>
            </div>
          </div>
        </div>

        {/* 2. Target Element */}
        <div className={styles.card}>
          <SectionHeader title="Target Element" icon={<Target size={14} />} sectionKey="target" required />
          <div>
            <label className={styles.label}>CSS Selector</label>
            <input 
              type="text"
              placeholder=".my-element"
              className={`${styles.input} ${styles.monospaceInput} ${errors.targetElement ? styles.inputError : ''}`}
              value={rule.targetElement?.selector || ''}
              onChange={e => {
                setRule({...rule, targetElement: {selector: e.target.value}});
                if (errors.targetElement) setErrors(prev => ({...prev, targetElement: undefined}));
              }}
            />
            {errors.targetElement && (
              <p className={styles.errorText}>
                <AlertCircle size={14} />
                {errors.targetElement}
              </p>
            )}
          </div>
          <p className={styles.suggestion}>{TARGET_SUGGESTIONS[rule.eventType]}</p>
        </div>

        {/* 3. Payload Mapping */}
        <div className={styles.card}>
          <SectionHeader title="Payload Mapping" icon={<Database size={14} />} sectionKey="payload" />
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={`${styles.th} ${styles.thWidth180}`}>Data Field</th>
                  <th className={`${styles.th} ${styles.thWidth180}`}>Source</th>
                  <th className={styles.th}>Configuration</th>
                </tr>
              </thead>
              <tbody>
                {rule.payloadMappings.map((mapping, idx) => (
                  <tr key={idx}>
                    <td className={`${styles.td} ${styles.tdVerticalTop}`}>
                      <span className={styles.fieldTag}>{mapping.field}</span>
                    </td>
                    <td className={`${styles.td} ${styles.tdVerticalTop}`}>
                      <select 
                        className={styles.input}
                        value={mapping.source}
                        onChange={e => handleUpdateMapping(idx, { source: e.target.value as MappingSource })}
                      >
                        <option value={MappingSource.REQUEST_BODY}>request_body</option>
                        <option value={MappingSource.REQUEST_URL}>request_url</option>
                        <option value={MappingSource.ELEMENT}>element</option>
                      </select>
                    </td>
                    <td className={styles.td}>
                      {/* REQUEST_BODY Configuration */}
                      {mapping.source === MappingSource.REQUEST_BODY && (
                        <div className={styles.urlParsingContainer}>
                          <div className={styles.urlParsingInputRow}>
                            <input 
                              type="text" 
                              placeholder="URL Pattern (/api/song/:id)" 
                              className={`${styles.input} ${styles.urlParsingInputFlex2} ${errors.payloadMappings?.[idx] ? styles.inputError : ''}`}
                              value={mapping.requestUrlPattern || ''}
                              onChange={e => {
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
                              <option>POST</option>
                              <option>PUT</option>
                              <option>PATCH</option>
                              <option>DELETE</option>
                              <option>GET</option>
                            </select>
                          </div>
                          <input 
                            type="text" 
                            placeholder="Body Path (e.g., content.id)" 
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
                            Specify the JSON path in request body. Example: <code>{'{"content": {"id": "123"}}'}</code> → path: <strong>content.id</strong>
                          </div>
                        </div>
                      )}

                      {/* REQUEST_URL Configuration */}
                      {mapping.source === MappingSource.REQUEST_URL && (
                        <div className={styles.urlParsingContainer}>
                          <div className={styles.urlParsingInputRow}>
                            <input 
                              type="text" 
                              placeholder="URL Pattern (/api/product/{id})" 
                              className={`${styles.input} ${styles.urlParsingInputFlex2} ${errors.payloadMappings?.[idx] ? styles.inputError : ''}`}
                              value={mapping.requestUrlPattern || ''}
                              onChange={e => {
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
                              value={mapping.requestMethod || 'GET'}
                              onChange={e => handleUpdateMapping(idx, { requestMethod: e.target.value as any })}
                            >
                              <option>GET</option>
                              <option>POST</option>
                              <option>PUT</option>
                              <option>PATCH</option>
                              <option>DELETE</option>
                            </select>
                          </div>
                          
                          {/* Radio buttons for extract type */}
                          <div className={styles.radioGroup}>
                            <label className={styles.radioLabel}>
                              <input 
                                type="radio" 
                                name={`extract-type-${idx}`} 
                                checked={mapping.urlExtractType === 'pathname'} 
                                onChange={() => handleUpdateMapping(idx, { urlExtractType: 'pathname' })} 
                              />
                              PathName
                            </label>
                            <label className={styles.radioLabel}>
                              <input 
                                type="radio" 
                                name={`extract-type-${idx}`} 
                                checked={mapping.urlExtractType === 'query'} 
                                onChange={() => handleUpdateMapping(idx, { urlExtractType: 'query' })} 
                              />
                              Query Parameter
                            </label>
                          </div>

                          {mapping.urlExtractType === 'pathname' && (
                            <input 
                              type="number" 
                              placeholder="Segment Index (e.g., 3)" 
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
                          )}

                          {mapping.urlExtractType === 'query' && (
                            <input 
                              type="text" 
                              placeholder="Query Key (e.g., item_id)" 
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
                          )}

                          {errors.payloadMappings?.[idx] && (
                            <p className={styles.errorText}>
                              <AlertCircle size={14} />
                              {errors.payloadMappings[idx]}
                            </p>
                          )}
                          <div className={styles.fieldNote}>
                            {mapping.urlExtractType === 'pathname' 
                              ? "Specify segment index. Example: /api/product/123/details → index 3 gets '123'"
                              : "Specify query key. Example: ?item_id=123&ref=home → key 'item_id' gets '123'"
                            }
                          </div>
                        </div>
                      )}

                      {/* ELEMENT Configuration */}
                      {mapping.source === MappingSource.ELEMENT && (
                        <div>
                          <input 
                            type="text"
                            placeholder='CSS Selector (e.g., .product-id)'
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
                            CSS selector to extract value from element. Example: <code>{'<div class="title">Name</div>'}</code> → selector: <strong>.title</strong>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Important Notes */}
        <div className={styles.warningCard}>
          <h4 className={styles.warningCardTitle}>
            <AlertCircle size={18} /> Important Notes:
          </h4>
          <p className={styles.warningCardText}>
            <strong>1. Transparency:</strong> User interaction data is collected and used for recommendation improvements.<br /><br />
            <strong>2. Testing:</strong> Verify configurations in testing environment before production.<br /><br />
            <strong>3. Security:</strong> Whitelist tracking script domain in your CSP.
          </p>
        </div>

        {/* Action Buttons */}
        <div className={styles.buttonActions}>
          <button onClick={onCancel} className={styles.btnSecondary}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={isSaving} className={styles.btnPrimary}>
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} style={{ marginRight: '4px' }} />}
            Save
          </button>
        </div>
      </div>
    </div>
  );
};


