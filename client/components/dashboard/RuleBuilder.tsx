import React, { useState, useEffect, useCallback } from 'react';
import { Lightbulb, X, Fingerprint, Target, Filter, Plus, Trash2, Database, AlertCircle, Loader2, Save } from 'lucide-react';
import styles from './RuleBuilder.module.css';

// ==================== TYPES ====================
export enum EventType {
  CLICK = 'Click',
  RATING = 'Rating',
  REVIEW = 'Review',
  SCROLL = 'Scroll',
  PAGE_VIEW = 'Page view'
}

export enum MappingSource {
  REQUEST_BODY = 'request_body',
  ELEMENT = 'element',
  COOKIE = 'cookie',
  LOCAL_STORAGE = 'local_storage',
  SESSION_STORAGE = 'session_storage',
  URL_PARAM = 'url_param'
}

export interface Condition {
  id: string;
  pattern: 'CSS Selector' | 'URL' | 'Data Attribute';
  operator: 'Contains' | 'Equals' | 'Starts with' | 'Ends with';
  value: string;
}

export interface PayloadMapping {
  field: string;
  source: MappingSource;
  path?: string;
  required: boolean;
  url_pattern?: string;
  method?: 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'GET';
  fullUrl?: string;
  pathname?: string;
  query_string?: string;
  url_part?: 'pathname' | 'query_param';
  segment_index?: number;
  key?: string;
}

export interface TrackingRule {
  id: string;
  name: string;
  eventType: EventType;
  targetElement: {
    operator: string;
    value: string;
  };
  conditions: Condition[];
  payloadMappings: PayloadMapping[];
}

// ==================== CONSTANTS ====================
export const EVENT_TYPE_OPTIONS = Object.values(EventType);

export const EVENT_DESCRIPTIONS: Record<EventType, string> = {
  [EventType.CLICK]: "Tracks click behaviors on interface elements like Buttons, Links, or Icons.",
  [EventType.RATING]: "Records user rating actions through score or star components.",
  [EventType.REVIEW]: "Collects data when users submit text comments or detailed feedback.",
  [EventType.SCROLL]: "Monitors page scroll depth to measure content engagement.",
  [EventType.PAGE_VIEW]: "Measures page views or screen transitions within the application."
};

export const TARGET_SUGGESTIONS: Record<EventType, string> = {
  [EventType.CLICK]: "Suggested: #add-to-cart, .add-to-cart, favorite-btn, .bookmark-icon, .buy-now, .purchase-button",
  [EventType.RATING]: "Suggested: .rating, .rating-stars, .star, .star-rating, input[type=radio][name*=rating], [data-rating]",
  [EventType.REVIEW]: "Suggested: #review, #review-box, .review-box, .review-textarea, textarea[name*=review], textarea[placeholder*=review], .submit-review, .btn-submit-review",
  [EventType.SCROLL]: "",
  [EventType.PAGE_VIEW]: ""
};

export const CONDITION_SUGGESTIONS: Record<EventType, string> = {
  [EventType.CLICK]: "Suggested: Use 'URL Path' to target page clicks or 'CSS Selector' to check element presence.",
  [EventType.RATING]: "Suggested: Use 'URL Path' to target page clicks or 'CSS Selector' to check element presence.",
  [EventType.REVIEW]: "Suggested: Use 'URL Path' to target page clicks or 'CSS Selector' to check element presence.",
  [EventType.SCROLL]: "Suggested: Use 'URL Path' to target page clicks or 'CSS Selector' to check element presence.",
  [EventType.PAGE_VIEW]: "Suggested: Use 'URL Path' to target page clicks or 'CSS Selector' to check element presence."
};

export interface SectionExample {
  title: string;
  htmlContext?: string;
  config: string;
}

const PAYLOAD_COMMON_EXAMPLES: SectionExample[] = [
  {
    title: "Request Body Mapping",
    htmlContext: "// Request Sample (POST)\nURL: /api/v1/reviews/submit\nBody: { \"content\": \"Great!\", \"user_id\": 501 }\n\n// Response Body (Short)\n{ \"status\": \"ok\", \"id\": \"rev_99\" }",
    config: "Source: request_body | URL Pattern: /api/v1/reviews/submit | Method: POST | Path: content"
  },
  {
    title: "Element Mapping",
    htmlContext: "// Target div containing review text\n<div class=\"review-card\">\n  <p class=\"review-text\">Best product ever!</p>\n  <span data-id=\"item_404\"></span>\n</div>",
    config: "Source: element | Path: .review-card .review-text"
  },
  {
    title: "Global JS Object Mapping",
    htmlContext: "// Value stored in window object\nwindow.APP_CONFIG = {\n  currentUser: { id: \"u_789\", name: \"John\" }\n};",
    config: "Source: global | Path: APP_CONFIG.currentUser.id"
  },
  {
    title: "Cookie Mapping",
    htmlContext: "// Value stored in browser cookies\ndocument.cookie: \"session_id=xyz123; user_type=vip\"",
    config: "Source: cookie | Path: session_id"
  },
  {
    title: "Local Storage Mapping",
    htmlContext: "// Value stored in Local Storage\nlocalStorage.getItem(\"user_prefs\"): '{\"theme\": \"dark\", \"id\": \"123\"}'",
    config: "Source: local_storage | Path: user_prefs.id"
  },
  {
    title: "Session Storage Mapping",
    htmlContext: "// Value stored in Session Storage\nsessionStorage.getItem(\"temp_token\"): \"tmp_abc_555\"",
    config: "Source: session_storage | Path: temp_token"
  },
  {
    title: "URL - Pathname Mapping",
    htmlContext: "// Sample URL\nhttps://example.com/product/iphone-15/details\n\n// Parse Results\npathname: /product/iphone-15/details\nquery: (none)",
    config: "Source: url_param | URL Part: pathname | Segment Index: 2 (gets 'iphone-15')"
  },
  {
    title: "URL - Query Param Mapping",
    htmlContext: "// Sample URL\nhttps://example.com/search?q=shoes&category=mens\n\n// Parse Results\npathname: /search\nquery: q=shoes&category=mens",
    config: "Source: url_param | URL Part: query_param | Key: q (gets 'shoes')"
  }
];

export const SECTION_EXAMPLES: Record<string, Record<EventType, SectionExample[]>> = {
  target: {
    [EventType.CLICK]: [
      { 
        title: "Buy Button Example", 
        htmlContext: '<button class="btn-buy" id="cart-add">Add to Cart</button>',
        config: "Pattern: 'CSS Selector' | Match: 'equals' | Value: '.btn-buy'\n or\n Pattern: 'CSS Selector' | Match: 'equals' | Value: '#cart-add'" 
      }
    ],
    [EventType.RATING]: [
      { 
        title: "Star Rating Component", 
        htmlContext: '<div class="rating-stars" data-value="5"></div>',
        config: "Pattern: 'CSS Selector' | Match: 'contains' | Value: '.rating-stars'" 
      }
    ],
    [EventType.REVIEW]: [
      { 
        title: "Submit Feedback Form", 
        htmlContext: '<form id="review-form">\n  <textarea name="review" placeholder="Write your review..."></textarea>\n  <button type="submit">Submit</button>\n</form>',
        config: "Pattern: 'CSS Selector' | Match: 'contains' | Value: '#review-form'\n or\n Pattern: 'CSS Selector' | Match: 'contains' | Value: 'textarea[name=review]\n'" 
      }
    ],
    [EventType.SCROLL]: [],
    [EventType.PAGE_VIEW]: []
  },
  conditions: {
    [EventType.CLICK]: [
      { 
        title: "Shop Page Filter", 
        config: "Pattern: URL Path | Operator: contains | Value: /shop" 
      }
    ],
    [EventType.SCROLL]: [
      { 
        title: "Item Detail Page Filter", 
        config: "Pattern: URL Path | Operator: contains | Value: /item/" 
      }
    ],
    [EventType.RATING]: [
      { 
        title: "Product Rating Page Filter", 
        config: "Pattern: URL Path | Operator: contains | Value: /product/" 
      }
    ],
    [EventType.REVIEW]: [
      { 
        title: "Product Rating Page Filter", 
        config: "Pattern: URL Path | Operator: contains | Value: /product/" 
      }
    ],
    [EventType.PAGE_VIEW]: [
      { 
        title: "Item Detail Page Filter", 
        config: "Pattern: URL Path | Operator: contains | Value: /item/" 
      }
    ]
  },
  payload: {
    [EventType.CLICK]: PAYLOAD_COMMON_EXAMPLES,
    [EventType.REVIEW]: PAYLOAD_COMMON_EXAMPLES,
    [EventType.RATING]: PAYLOAD_COMMON_EXAMPLES,
    [EventType.SCROLL]: PAYLOAD_COMMON_EXAMPLES,
    [EventType.PAGE_VIEW]: PAYLOAD_COMMON_EXAMPLES
  }
};

export const MAPPING_SOURCES = Object.values(MappingSource);

export const OPERATORS = ['Contains', 'Equals', 'Starts with', 'Ends with'];

export const INITIAL_MAPPINGS: Record<string, string[]> = {
  [EventType.CLICK]: ['userId', 'itemId'],
  [EventType.RATING]: ['userId', 'itemId', 'rating_value'],
  [EventType.REVIEW]: ['userId', 'itemId', 'review_text'],
  [EventType.SCROLL]: ['userId', 'itemId'],
  [EventType.PAGE_VIEW]: ['userId', 'itemId'],
};

// ==================== COMPONENT ====================
interface RuleBuilderProps {
  initialRule?: any;
  ruleDetails?: any;
  isViewMode?: boolean;
  onSave: (response: { statusCode: number; message: string }) => void;
  onCancel: () => void;
  domainKey: string;
}

export const RuleBuilder: React.FC<RuleBuilderProps> = ({ 
  initialRule, 
  ruleDetails, 
  isViewMode = false, 
  onSave, 
  onCancel, 
  domainKey 
}) => {
  const [rule, setRule] = useState<TrackingRule>({
    id: 'new-rule-' + Date.now(),
    name: '',
    eventType: EventType.CLICK,
    targetElement: { selector: '', operator: 'equals', value: '' },
    conditions: [],
    payloadMappings: [
      { field: 'username', source: MappingSource.LOCAL_STORAGE, path: 'user.username', required: true },
      { field: 'itemId', source: MappingSource.ELEMENT, path: '.product-id', required: true }
    ],
  });

  const [isSaving, setIsSaving] = useState(false);
  const [modalContent, setModalContent] = useState<{title: string, examples: SectionExample[]} | null>(null);

  useEffect(() => {
    const initialFields = INITIAL_MAPPINGS[rule.eventType] || [];
    
    setRule(prev => ({
      ...prev,
      payloadMappings: initialFields.map(field => ({
        field,
        source: field.toLowerCase().includes('user') ? MappingSource.LOCAL_STORAGE : MappingSource.ELEMENT,
        path: '',
        required: true
      }))
    }));
  }, [rule.eventType]);

  const handleAddCondition = () => {
    const newCondition: Condition = {
      id: Math.random().toString(36).substr(2, 9),
      pattern: 'URL',
      operator: 'Contains',
      value: ''
    };
    setRule(prev => ({ ...prev, conditions: [...prev.conditions, newCondition] }));
  };

  const handleRemoveCondition = (id: string) => {
    setRule(prev => ({ ...prev, conditions: prev.conditions.filter(c => c.id !== id) }));
  };

  const handleUpdateCondition = (id: string, updates: Partial<Condition>) => {
    setRule(prev => ({
      ...prev,
      conditions: prev.conditions.map(c => c.id === id ? { ...c, ...updates } : c)
    }));
  };

  const handleUpdateMapping = (index: number, updates: Partial<PayloadMapping>) => {
    const newMappings = [...rule.payloadMappings];
    newMappings[index] = { ...newMappings[index], ...updates };
    setRule(prev => ({ ...prev, payloadMappings: newMappings }));
  };

  const parseUrl = useCallback((index: number, url: string) => {
    try {
      const parsed = new URL(url);
      handleUpdateMapping(index, {
        fullUrl: url,
        pathname: parsed.pathname,
        query_string: parsed.search.slice(1)
      });
    } catch (e) {
      handleUpdateMapping(index, {
        fullUrl: url,
        pathname: 'Invalid URL',
        query_string: ''
      });
    }
  }, []);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      onSave({ statusCode: 200, message: 'Tracking Rule saved successfully!' });
    }, 1200);
  };

  const openExamples = (section: string) => {
    const examples = SECTION_EXAMPLES[section][rule.eventType] || [];
    setModalContent({
      title: `Config Examples: ${section.charAt(0).toUpperCase() + section.slice(1)}`,
      examples: examples
    });
  };

  const SectionHeader = ({ title, icon, sectionKey, required = false }: { title: string, icon: React.ReactNode, sectionKey?: string, required?: boolean }) => (
    <div className={styles.sectionHeader}>
      <div className={styles.headerIcon}>
        {icon}
      </div>
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
      {/* Modal Overlay */}
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
                      <p className={styles.exampleHtmlTitle}>Actual DIV / HTML example on website:</p>
                      <pre className={styles.examplePre}>
                        {ex.htmlContext}
                      </pre>
                    </div>
                  )}

                  <div className={styles.exampleDivider}></div>
                  
                  <p className={styles.exampleConfigTitle}>Config sample:</p>
                  <code className={`${styles.exampleCode} ${styles.exampleCodeNoMargin}`}>
                    {ex.config}
                  </code>
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
        {/* 1. Identification */}
        <div className={styles.card}>
          <SectionHeader title="Event Identification" icon={<Fingerprint size={14} />} />
          <div className={styles.grid2}>
            <div>
              <label className={styles.label}>Rule Name</label>
              <input 
                type="text"
                placeholder="e.g., Click Register Button"
                className={styles.input}
                value={rule.name}
                onChange={e => setRule({...rule, name: e.target.value})}
              />
            </div>
            <div>
              <label className={styles.label}>Event Type</label>
              <select 
                className={styles.input}
                value={rule.eventType}
                onChange={e => setRule({...rule, eventType: e.target.value as EventType})}
              >
                {EVENT_TYPE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
              <p className={styles.description}>{EVENT_DESCRIPTIONS[rule.eventType]}</p>
            </div>
          </div>
        </div>

        {/* 2. Target Configuration */}
        <div className={styles.card}>
          <SectionHeader 
            title="Target Element" 
            icon={<Target size={14} />} 
            sectionKey="target" 
            required 
          />
          <div className={styles.grid3}>
            <div>
              <label className={styles.label}>Pattern</label>
              <input 
                type="text"
                disabled
                className={`${styles.input} ${styles.disabledInput}`}
                value="CSS Selector"
              />
            </div>
            <div>
              <label className={styles.label}>Match Operator</label>
              <select 
                className={styles.input}
                value={rule.targetElement.operator}
                onChange={e => setRule({...rule, targetElement: {...rule.targetElement, operator: e.target.value}})}
              >
                <option value="Contains">contains</option>
                <option value="Equals">equals</option>
                <option value="Starts with">starts with</option>
                <option value="Ends with">ends with</option>
              </select>
            </div>
            <div>
              <label className={styles.label}>Value</label>
              <input 
                type="text"
                placeholder=".my-element"
                className={`${styles.input} ${styles.monospaceInput}`}
                value={rule.targetElement.selector}
                onChange={e => setRule({...rule, targetElement: {...rule.targetElement, selector: e.target.value}})}
              />
            </div>
          </div>
          <p className={styles.suggestion}>{TARGET_SUGGESTIONS[rule.eventType]}</p>
        </div>

        {/* 3. Conditions */}
        <div className={styles.card}>
          <div className={styles.conditionsHeader}>
            <SectionHeader title="Conditions" icon={<Filter size={14} />} sectionKey="conditions" />
            <button onClick={handleAddCondition} className={styles.btnAdd}>
              <Plus size={16} /> Add Condition
            </button>
          </div>
          
          <div className={styles.conditionsContainer}>
            {rule.conditions.length === 0 && (
              <div className={styles.emptyState}>
                No conditions added. The rule will trigger for every occurrence.
                <p className={`${styles.suggestion} ${styles.suggestionInEmptyState}`}>{CONDITION_SUGGESTIONS[rule.eventType]}</p>
              </div>
            )}
            {rule.conditions.map((cond) => (
              <div key={cond.id} className={styles.conditionRow}>
                <select 
                  className={`${styles.input} ${styles.conditionSelectFlex1}`}
                  value={cond.pattern}
                  onChange={e => handleUpdateCondition(cond.id, { pattern: e.target.value as any })}
                >
                  <option>URL</option>
                  <option>CSS Selector</option>
                  <option>Data Attribute</option>
                </select>
                <select 
                  className={`${styles.input} ${styles.conditionSelectAuto}`}
                  value={cond.operator}
                  onChange={e => handleUpdateCondition(cond.id, { operator: e.target.value as any })}
                >
                  {OPERATORS.map(op => <option key={op} value={op}>{op}</option>)}
                </select>
                <input 
                  type="text" placeholder="Filter value..." className={`${styles.input} ${styles.conditionInputFlex2}`}
                  value={cond.value}
                  onChange={e => handleUpdateCondition(cond.id, { value: e.target.value })}
                />
                <button onClick={() => handleRemoveCondition(cond.id)} className={styles.btnDelete}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 4. Payload Mapping */}
        <div className={styles.card}>
          <SectionHeader title="Payload Mapping" icon={<Database size={14} />} sectionKey="payload" />
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
                {rule.payloadMappings.map((mapping, idx) => {
                  const isUserField = mapping.field === 'userId' || mapping.field === 'username';
                  const isItemField = mapping.field === 'itemId' || mapping.field === 'itemTitle';

                  return (
                    <tr key={idx}>
                      <td className={`${styles.td} ${styles.tdVerticalTop}`}>
                        {isUserField ? (
                          <div className={styles.radioGroup}>
                            <label className={styles.radioLabel}>
                              <input type="radio" name={`user-field-${idx}`} checked={mapping.field === 'userId'} onChange={() => handleUpdateMapping(idx, { field: 'userId' })} />
                              UserId
                            </label>
                            <label className={styles.radioLabel}>
                              <input type="radio" name={`user-field-${idx}`} checked={mapping.field === 'username'} onChange={() => handleUpdateMapping(idx, { field: 'username' })} />
                              Username
                            </label>
                          </div>
                        ) : isItemField ? (
                          <div className={styles.radioGroup}>
                            <label className={styles.radioLabel}>
                              <input type="radio" name={`item-field-${idx}`} checked={mapping.field === 'itemId'} onChange={() => handleUpdateMapping(idx, { field: 'itemId' })} />
                              ItemId
                            </label>
                            <label className={styles.radioLabel}>
                              <input type="radio" name={`item-field-${idx}`} checked={mapping.field === 'itemTitle'} onChange={() => handleUpdateMapping(idx, { field: 'itemTitle' })} />
                              ItemTitle
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
                                type="text" placeholder="URL Pattern (/api/...)" className={`${styles.input} ${styles.urlParsingInputFlex2}`}
                                value={mapping.url_pattern || ''}
                                onChange={e => handleUpdateMapping(idx, { url_pattern: e.target.value })}
                              />
                              <select 
                                className={`${styles.input} ${styles.urlParsingInputFlex1}`}
                                value={mapping.method || 'POST'}
                                onChange={e => handleUpdateMapping(idx, { method: e.target.value as any })}
                              >
                                <option>POST</option><option>PUT</option><option>PATCH</option><option>DELETE</option><option>GET</option>
                              </select>
                            </div>
                            <input 
                              type="text" placeholder="Body Path (e.g., content.id)" className={styles.input}
                              value={mapping.path || ''}
                              onChange={e => handleUpdateMapping(idx, { path: e.target.value })}
                            />
                          </div>
                        )}

                        {mapping.source === MappingSource.URL_PARAM && (
                          <div className={styles.urlParsingContainer}>
                            <input 
                              type="text" placeholder="Enter full URL to parse..." className={styles.input}
                              value={mapping.fullUrl || ''}
                              onChange={e => parseUrl(idx, e.target.value)}
                            />
                            {mapping.pathname && (
                              <div className={styles.urlParsingResultsGrid}>
                                <input type="text" disabled className={`${styles.input} ${styles.urlParsingDisabledInput}`} value={`Path: ${mapping.pathname}`} />
                                <input type="text" disabled className={`${styles.input} ${styles.urlParsingDisabledInput}`} value={`Query: ${mapping.query_string || 'None'}`} />
                              </div>
                            )}
                            <div className={styles.urlParsingControlRow}>
                              <select 
                                className={`${styles.input} ${styles.urlParsingSelect}`}
                                value={mapping.url_part || 'pathname'}
                                onChange={e => handleUpdateMapping(idx, { url_part: e.target.value as any })}
                              >
                                <option value="pathname">pathname</option>
                                <option value="query_param">query_param</option>
                              </select>
                              {mapping.url_part === 'pathname' ? (
                                <input 
                                  type="number" placeholder="Segment Index" className={`${styles.input} ${styles.urlParsingInputFlexAuto}`}
                                  value={mapping.segment_index || ''}
                                  onChange={e => handleUpdateMapping(idx, { segment_index: parseInt(e.target.value) })}
                                />
                              ) : (
                                <input 
                                  type="text" placeholder="Param Key (e.g. itemId)" className={`${styles.input} ${styles.urlParsingInputFlexAuto}`}
                                  value={mapping.key || ''}
                                  onChange={e => handleUpdateMapping(idx, { key: e.target.value })}
                                />
                              )}
                            </div>
                          </div>
                        )}

                        {mapping.source !== MappingSource.REQUEST_BODY && mapping.source !== MappingSource.URL_PARAM && (
                          <input 
                            type="text"
                            placeholder={mapping.source === MappingSource.ELEMENT ? 'CSS Selector (e.g. .title)' : 'Path (e.g. user.id)'}
                            className={styles.input}
                            value={mapping.path || ''}
                            onChange={e => handleUpdateMapping(idx, { path: e.target.value })}
                          />
                        )}
                      </td>
                    </tr>
                  );
                })}
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
            <strong>1. Transparency Notice:</strong> <br></br>
            Our service operates based on user interaction data collected through the methods you select and configure. <br></br>
            By continuing to use the service, you acknowledge that you understand and agree to the sharing of this data. <br></br>
            We commit to strictly protecting the data and using it solely for improving recommendation quality.<br /><br />
            <strong>2. Testing Required:</strong> <br></br>
            Ensure configurations are verified in the testing environment. Network request tracking requires the API endpoint to match the specified pattern.<br /><br />
            <strong>3. Security Policy:</strong> <br></br>
            Whitelist our tracking script domain in your Content Security Policy (CSP) to ensure proper functionality.
          </p>
        </div>

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
