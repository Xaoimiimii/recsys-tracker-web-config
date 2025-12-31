import React, { useState, useEffect, useCallback } from 'react';
import { Lightbulb, X, Fingerprint, Target, Filter, Plus, Trash2, Database, AlertCircle, Loader2, Save } from 'lucide-react';
import styles from './RuleBuilder.module.css';
import { ruleApi } from '../../lib/api/rule';
import { useDataCache } from '../../contexts/DataCacheContext';
import { request } from 'http';

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
  REQUEST_URL = 'request_url',
  ELEMENT = 'element',
  COOKIE = 'cookie',
  LOCAL_STORAGE = 'local_storage',
  SESSION_STORAGE = 'session_storage',
  URL = 'page_url',
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
  value?: string;
  requestUrlPattern?: string;
  requestMethod?: 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'GET';
  requestBodyPath?: string;
  fullUrl?: string;
  pathname?: string;
  queryString?: string;
  urlPart?: 'PathName' | 'QueryParam';
  urlPartValue?: string;
}

export interface TrackingRule {
  id: string;
  name: string;
  eventType: EventType;
  targetElement?: {
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
    title: "URL - PathName Mapping",
    htmlContext: "// Sample URL\nhttps://example.com/product/iphone-15/details\n\n// Parse Results\nPathName: /product/iphone-15/details\nquery: (none)",
    config: "Source: url | URL Part: PathName | Segment Index: 2 (gets 'iphone-15')"
  },
  {
    title: "URL - Query Param Mapping",
    htmlContext: "// Sample URL\nhttps://example.com/search?q=shoes&category=mens\n\n// Parse Results\nPathName: /search\nquery: q=shoes&category=mens",
    config: "Source: url | URL Part: QueryParam | Key: q (gets 'shoes')"
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

// Mapping constants for API
export const EVENT_TYPE_TO_ID: Record<EventType, number> = {
  [EventType.CLICK]: 1,
  [EventType.RATING]: 2,
  [EventType.REVIEW]: 3,
  [EventType.SCROLL]: 4,
  [EventType.PAGE_VIEW]: 5
};

export const OPERATOR_TO_ID: Record<string, number> = {
  'Contains': 1,
  'Equals': 2,
  'Starts with': 3,
  'Ends with': 4
};

export const PATTERN_TO_ID: Record<string, number> = {
  'CSS Selector': 1,
  'URL': 2,
  'Data Attribute': 3
};

export const SOURCE_TO_BACKEND: Record<MappingSource, string> = {
  [MappingSource.REQUEST_BODY]: 'RequestBody',
  [MappingSource.REQUEST_URL]: 'RequestUrl',
  [MappingSource.ELEMENT]: 'Element',
  [MappingSource.COOKIE]: 'Cookie',
  [MappingSource.LOCAL_STORAGE]: 'LocalStorage',
  [MappingSource.SESSION_STORAGE]: 'SessionStorage',
  [MappingSource.URL]: 'Url'
};

export const FIELD_TO_BACKEND: Record<string, string> = {
  'userId': 'UserId',
  'username': 'Username',
  'anonymousId': 'AnonymousId',
  'itemId': 'ItemId',
  'itemTitle': 'ItemTitle',
  'rating_value': 'Value',
  'review_text': 'Value'
};

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
  const { patterns, operators } = useDataCache();
  
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
  const [errors, setErrors] = useState<{
    ruleName?: string;
    targetElement?: string;
    payloadMappings?: { [key: number]: string };
  }>({});
  const [modalContent, setModalContent] = useState<{title: string, examples: SectionExample[]} | null>(null);

  // Load data from ruleDetails when viewing a rule
  useEffect(() => {
    if (ruleDetails && isViewMode) {
      // Helper function to convert backend source to frontend enum
      const convertSource = (source: string): MappingSource => {
        const sourceMap: Record<string, MappingSource> = {
          'RequestBody': MappingSource.REQUEST_BODY,
          'RequestUrl': MappingSource.REQUEST_URL,
          'Element': MappingSource.ELEMENT,
          'Cookie': MappingSource.COOKIE,
          'LocalStorage': MappingSource.LOCAL_STORAGE,
          'SessionStorage': MappingSource.SESSION_STORAGE,
          'Url': MappingSource.URL
        };
        return sourceMap[source] || MappingSource.ELEMENT;
      };

      // Helper function to convert backend field to frontend field
      const convertField = (field: string): string => {
        const fieldMap: Record<string, string> = {
          'UserId': 'userId',
          'Username': 'username',
          'AnonymousId': 'anonymousId',
          'ItemId': 'itemId',
          'ItemTitle': 'itemTitle',
          'Value': ruleDetails.EventType?.Name === 'Rating' ? 'rating_value' : 'review_text'
        };
        return fieldMap[field] || field.toLowerCase();
      };

      // Convert EventType
      const eventTypeMap: Record<string, EventType> = {
        '1': EventType.CLICK,
        '2': EventType.RATING,
        '3': EventType.REVIEW,
        '4': EventType.SCROLL,
        '5': EventType.PAGE_VIEW
      };

      // Map PatternId to pattern name from cached data
      const patternIdToName: Record<number, string> = patterns.reduce((acc, p) => {
        acc[p.Id] = p.Name;
        return acc;
      }, {} as Record<number, string>);

      // Map OperatorId to operator name from cached data
      const operatorIdToName: Record<number, string> = operators.reduce((acc, o) => {
        acc[o.Id] = o.Name;
        return acc;
      }, {} as Record<number, string>);

      // Transform PayloadMappings
      const payloadMappings: PayloadMapping[] = ruleDetails.PayloadMappings.map((mapping: any) => {
        const source = convertSource(mapping.Source);
        const result: PayloadMapping = {
          field: convertField(mapping.Field),
          source: source
        };

        if (source === MappingSource.REQUEST_BODY) {
          result.requestUrlPattern = mapping.RequestUrlPattern || '';
          result.requestMethod = mapping.RequestMethod || 'POST';
          result.value = mapping.RequestBodyPath || '';
        } else if (source === MappingSource.URL) {
          result.urlPart = mapping.UrlPart || 'PathName';
          result.urlPartValue = mapping.UrlPartValue || '';
        } else {
          result.value = mapping.Value || '';
        }

        return result;
      });

      // Transform Conditions
      const conditions: Condition[] = ruleDetails.Conditions.map((cond: any) => ({
        id: Math.random().toString(36).substr(2, 9),
        pattern: patternIdToName[cond.PatternId] || 'URL',
        operator: operatorIdToName[cond.OperatorID || cond.OperatorId] || 'Contains',
        value: cond.Value || ''
      }));

      // Transform TrackingTarget
      let targetElement = undefined;
      if (ruleDetails.TrackingTarget) {
        targetElement = {
          selector: ruleDetails.TrackingTarget.Value || '',
          operator: operatorIdToName[ruleDetails.TrackingTarget.OperatorId] || 'Equals',
          value: ruleDetails.TrackingTarget.Value || ''
        };
      }

      setRule({
        id: ruleDetails.Id.toString(),
        name: ruleDetails.Name || '',
        eventType: eventTypeMap[ruleDetails.EventTypeID] || EventType.CLICK,
        targetElement: targetElement,
        conditions: conditions,
        payloadMappings: payloadMappings
      });
    }
  }, [ruleDetails, isViewMode]);

  useEffect(() => {
    const initialFields = INITIAL_MAPPINGS[rule.eventType] || [];
    
    // Only reset payloadMappings when not in view mode or when ruleDetails is not available
    if (!isViewMode || !ruleDetails) {
      setRule(prev => ({
        ...prev,
        // Set targetElement to NULL for Scroll and Page view
        targetElement: (rule.eventType === EventType.SCROLL || rule.eventType === EventType.PAGE_VIEW) 
          ? undefined 
          : prev.targetElement || { selector: '', operator: 'equals', value: '' },
        payloadMappings: initialFields.map(field => ({
          field,
          source: field.toLowerCase().includes('user') ? MappingSource.LOCAL_STORAGE : MappingSource.ELEMENT,
          path: '',
          required: true
        }))
      }));
    }
  }, [rule.eventType, isViewMode, ruleDetails]);

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
    let updatedMapping = { ...newMappings[index], ...updates };

    const nextField = (updates.field ?? newMappings[index].field);

    if (nextField === 'anonymousId') {
      updatedMapping = {
        ...updatedMapping,
        source: MappingSource.LOCAL_STORAGE,
        value: 'recsys_anon_id',
        requestUrlPattern: undefined,
        requestMethod: undefined,
        requestBodyPath: undefined,
        urlPart: undefined,
        urlPartValue: undefined,
        fullUrl: undefined,
        pathname: undefined,
        queryString: undefined,
      };
    } else if (updates.source) {
      if (updates.source === MappingSource.REQUEST_URL) {
        updatedMapping = {
          ...updatedMapping,
          requestBodyPath: undefined,
          urlPart: undefined,
          urlPartValue: undefined,
          fullUrl: undefined,
          pathname: undefined,
          queryString: undefined
        };
      } else if (updates.source === MappingSource.REQUEST_BODY) {
        updatedMapping = {
          ...updatedMapping,
          value: undefined,
          urlPart: undefined,
          urlPartValue: undefined,
          fullUrl: undefined,
          pathname: undefined,
          queryString: undefined
        };
      } else if (updates.source === MappingSource.URL) {
        updatedMapping = {
          ...updatedMapping,
          value: undefined,
          requestUrlPattern: undefined,
          requestMethod: undefined,
          requestBodyPath: undefined
        };
      } else if ([MappingSource.ELEMENT, MappingSource.COOKIE, MappingSource.LOCAL_STORAGE, MappingSource.SESSION_STORAGE].includes(updates.source)) {
        updatedMapping = {
          ...updatedMapping,
          requestUrlPattern: undefined,
          requestMethod: undefined,
          requestBodyPath: undefined,
          urlPart: undefined,
          urlPartValue: undefined,
          fullUrl: undefined,
          pathname: undefined,
          queryString: undefined
        };
      }
    }

    newMappings[index] = updatedMapping;
    setRule(prev => ({ ...prev, payloadMappings: newMappings }));
  };

  const parseUrl = useCallback((index: number, url: string) => {
    setRule(prev => {
      const newMappings = [...prev.payloadMappings];
      const currentMapping = newMappings[index];
      
      try {
        const parsed = new URL(url);
        newMappings[index] = {
          ...currentMapping,
          fullUrl: url,
          pathname: parsed.pathname,
          queryString: parsed.search.slice(1)
        };
      } catch (e) {
        newMappings[index] = {
          ...currentMapping,
          fullUrl: url,
          pathname: 'Invalid URL',
          queryString: ''
        };
      }
      
      return { ...prev, payloadMappings: newMappings };
    });
  }, []);

  const handleSave = async () => {
    // Clear previous errors
    setErrors({});
    const newErrors: {
      ruleName?: string;
      targetElement?: string;
      payloadMappings?: { [key: number]: string };
    } = {};

    // Validation 1: Rule Name is required
    if (!rule.name.trim()) {
      newErrors.ruleName = 'Rule Name is required.';
    }

    // Validation 2: Target element value is required for Click/Rating/Review
    if ([EventType.CLICK, EventType.RATING, EventType.REVIEW].includes(rule.eventType)) {
      if (!rule.targetElement?.selector?.trim()) {
        newErrors.targetElement = 'Target Element value is required for this event type.';
      }
    }

    // Validation 3: Payload Mapping validations
    const payloadErrors: { [key: number]: string } = {};
    rule.payloadMappings.forEach((mapping, idx) => {
      // Check user/item fields (userId, username, itemId, itemTitle) - required for all event types
      if (['userId', 'username', 'anonymousId', 'itemId', 'itemTitle'].includes(mapping.field)) {
        if (mapping.source === MappingSource.REQUEST_BODY) {
          if (!mapping.requestUrlPattern?.trim()) {
            payloadErrors[idx] = 'URL Pattern is required when source is Request Body.';
          } else if (!mapping.value?.trim()) {
            payloadErrors[idx] = 'Body Path is required when source is Request Body.';
          }
        } else if (mapping.source === MappingSource.URL) {
          if (!mapping.urlPartValue?.trim()) {
            payloadErrors[idx] = 'URL Part Value is required when source is URL.';
          }
        } else {
          // Element, Cookie, LocalStorage, SessionStorage
          if (!mapping.value?.trim()) {
            payloadErrors[idx] = 'Path/Value is required.';
          }
        }
      }

      // Check rating_value field
      if (mapping.field === 'rating_value') {
        if (mapping.source === MappingSource.REQUEST_BODY) {
          if (!mapping.requestUrlPattern?.trim() || !mapping.value?.trim()) {
            payloadErrors[idx] = 'URL Pattern and Body Path are required when source is Request Body.';
          }
        } else if (mapping.source === MappingSource.URL) {
          if (!mapping.urlPartValue?.trim()) {
            payloadErrors[idx] = 'URL Part and its value are required when source is URL.';
          }
        } else {
          if (!mapping.value?.trim()) {
            payloadErrors[idx] = 'Path/Value is required.';
          }
        }
      }

      // Check review_text field
      if (mapping.field === 'review_text') {
        if (mapping.source === MappingSource.REQUEST_BODY) {
          if (!mapping.requestUrlPattern?.trim() || !mapping.value?.trim()) {
            payloadErrors[idx] = 'URL Pattern and Body Path are required when source is Request Body.';
          }
        } else if (mapping.source === MappingSource.URL) {
          if (!mapping.urlPartValue?.trim()) {
            payloadErrors[idx] = 'URL Part and its value are required when source is URL.';
          }
        } else {
          if (!mapping.value?.trim()) {
            payloadErrors[idx] = 'Path/Value is required.';
          }
        }
      }
    });

    if (Object.keys(payloadErrors).length > 0) {
      newErrors.payloadMappings = payloadErrors;
    }

    // If there are any errors, set them and stop
    if (Object.keys(newErrors).length > 0 || Object.keys(payloadErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSaving(true);
    
    try {
      // Transform conditions
      const conditions = rule.conditions.map(cond => ({
        PatternId: PATTERN_TO_ID[cond.pattern],
        OperatorId: OPERATOR_TO_ID[cond.operator],
        Value: cond.value
      }));

      // Transform payload mappings
      const payloadMappings = rule.payloadMappings.map(mapping => {
        const backendMapping: any = {
          Field: FIELD_TO_BACKEND[mapping.field] || mapping.field,
          Source: SOURCE_TO_BACKEND[mapping.source]
        };

        // Set values based on source type
        if (mapping.source === MappingSource.REQUEST_BODY) {
          backendMapping.RequestUrlPattern = mapping.requestUrlPattern || null;
          backendMapping.RequestMethod = mapping.requestMethod || 'POST';
          backendMapping.RequestBodyPath = mapping.value || null;
          backendMapping.Value = null;
          backendMapping.UrlPart = null;
          backendMapping.UrlPartValue = null;
        } else if (mapping.source === MappingSource.REQUEST_URL) {
          backendMapping.RequestUrlPattern = mapping.requestUrlPattern || null;
          backendMapping.RequestMethod = mapping.requestMethod || 'POST';
          backendMapping.RequestBodyPath = null;
          backendMapping.Value = mapping.value || null;
          backendMapping.UrlPart = null;
          backendMapping.UrlPartValue = null;
        } else if (mapping.source === MappingSource.URL) {
          backendMapping.UrlPart = mapping.urlPart || 'PathName';
          backendMapping.UrlPartValue = mapping.urlPartValue || null;
          backendMapping.Value = null;
          backendMapping.RequestUrlPattern = null;
          backendMapping.RequestMethod = null;
          backendMapping.RequestBodyPath = null;
        } else {
          // Element, Cookie, LocalStorage, SessionStorage
          backendMapping.Value = mapping.value || null;
          backendMapping.RequestUrlPattern = null;
          backendMapping.RequestMethod = null;
          backendMapping.RequestBodyPath = null;
          backendMapping.UrlPart = null;
          backendMapping.UrlPartValue = null;
        }

        return backendMapping;
      });

      // Transform tracking target (NULL for Scroll and Page view)
      let trackingTarget = null;
      if (rule.eventType !== EventType.SCROLL && rule.eventType !== EventType.PAGE_VIEW && rule.targetElement) {
        trackingTarget = {
          PatternId: 1, // Always "CSS Selector"
          OperatorId: OPERATOR_TO_ID[rule.targetElement.operator] || 2,
          Value: rule.targetElement.selector || ''
        };
      }

      // Prepare the payload
      const payload = {
        Name: rule.name,
        DomainKey: domainKey,
        EventTypeId: EVENT_TYPE_TO_ID[rule.eventType],
        Conditions: conditions,
        PayloadMappings: payloadMappings,
        TrackingTarget: trackingTarget
      };

      // Call the API
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
                className={`${styles.input} ${errors.ruleName ? styles.inputError : ''}`}
                value={rule.name}
                disabled={isViewMode}
                onChange={e => {
                  setRule({...rule, name: e.target.value});
                  if (errors.ruleName) {
                    setErrors(prev => ({...prev, ruleName: undefined}));
                  }
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
              <label className={styles.label}>Event Type</label>
              <select 
                className={styles.input}
                value={rule.eventType}
                disabled={isViewMode}
                onChange={e => setRule({...rule, eventType: e.target.value as EventType})}
              >
                {EVENT_TYPE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
              <p className={styles.description}>{EVENT_DESCRIPTIONS[rule.eventType]}</p>
            </div>
          </div>
        </div>

        {/* 2. Target Configuration */}
        {rule.eventType !== EventType.SCROLL && rule.eventType !== EventType.PAGE_VIEW && (
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
                  value={rule.targetElement?.operator || 'Equals'}
                  disabled={isViewMode}
                  onChange={e => setRule({...rule, targetElement: {...rule.targetElement, operator: e.target.value}})}
                >
                  <option value="Contains">Contains</option>
                  <option value="Equals">Equals</option>
                  <option value="Starts with">Starts with</option>
                  <option value="Ends with">Ends with</option>
                </select>
              </div>
              <div>
                <label className={styles.label}>Value</label>
                <input 
                  type="text"
                  placeholder=".my-element"
                  className={`${styles.input} ${styles.monospaceInput} ${errors.targetElement ? styles.inputError : ''}`}
                  value={rule.targetElement?.selector || ''}
                  disabled={isViewMode}
                  onChange={e => {
                    setRule({...rule, targetElement: {...rule.targetElement, selector: e.target.value}});
                    if (errors.targetElement) {
                      setErrors(prev => ({...prev, targetElement: undefined}));
                    }
                  }}
                />
                {errors.targetElement && (
                  <p className={styles.errorText}>
                    <AlertCircle size={14} />
                    {errors.targetElement}
                  </p>
                )}
              </div>
            </div>
            <p className={styles.suggestion}>{TARGET_SUGGESTIONS[rule.eventType]}</p>
          </div>
        )}

        {/* 3. Conditions */}
        <div className={styles.card}>
          <div className={styles.conditionsHeader}>
            <SectionHeader title="Conditions" icon={<Filter size={14} />} sectionKey="conditions" />
            <button onClick={handleAddCondition} className={styles.btnAdd} disabled={isViewMode}>
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
                  disabled={isViewMode}
                  onChange={e => handleUpdateCondition(cond.id, { pattern: e.target.value as any })}
                >
                  <option>URL</option>
                  <option>CSS Selector</option>
                  <option>Data Attribute</option>
                </select>
                <select 
                  className={`${styles.input} ${styles.conditionSelectAuto}`}
                  value={cond.operator}
                  disabled={isViewMode}
                  onChange={e => handleUpdateCondition(cond.id, { operator: e.target.value as any })}
                >
                  {OPERATORS.map(op => <option key={op} value={op}>{op}</option>)}
                </select>
                <input 
                  type="text" placeholder="Filter value..." className={`${styles.input} ${styles.conditionInputFlex2}`}
                  value={cond.value}
                  disabled={isViewMode}
                  onChange={e => handleUpdateCondition(cond.id, { value: e.target.value })}
                />
                <button onClick={() => handleRemoveCondition(cond.id)} className={styles.btnDelete} disabled={isViewMode}>
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
                  const isUserField = mapping.field === 'userId' || mapping.field === 'username' || mapping.field === 'anonymousId';
                  const isItemField = mapping.field === 'itemId' || mapping.field === 'itemTitle';

                  return (
                    <tr key={idx}>
                      <td className={`${styles.td} ${styles.tdVerticalTop}`}>
                        {isUserField ? (
                          <div className={styles.radioGroup}>
                            <label className={styles.radioLabel}>
                              <input type="radio" name={`user-field-${idx}`} checked={mapping.field === 'userId'} disabled={isViewMode} onChange={() => handleUpdateMapping(idx, { field: 'userId' })} />
                              UserId
                            </label>
                            <label className={styles.radioLabel}>
                              <input type="radio" name={`user-field-${idx}`} checked={mapping.field === 'username'} disabled={isViewMode} onChange={() => handleUpdateMapping(idx, { field: 'username' })} />
                              Username
                            </label>
                            <label className={styles.radioLabel}>
                              <input type="radio" name={`user-field-${idx}`} checked={mapping.field === 'anonymousId'} disabled={isViewMode} onChange={() => handleUpdateMapping(idx, { field: 'anonymousId' })} />
                              AnonymousId
                            </label>
                          </div>
                        ) : isItemField ? (
                          <div className={styles.radioGroup}>
                            <label className={styles.radioLabel}>
                              <input type="radio" name={`item-field-${idx}`} checked={mapping.field === 'itemId'} disabled={isViewMode} onChange={() => handleUpdateMapping(idx, { field: 'itemId' })} />
                              ItemId
                            </label>
                            <label className={styles.radioLabel}>
                              <input type="radio" name={`item-field-${idx}`} checked={mapping.field === 'itemTitle'} disabled={isViewMode} onChange={() => handleUpdateMapping(idx, { field: 'itemTitle' })} />
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
                          value={mapping.field === 'anonymousId' ? MappingSource.LOCAL_STORAGE : mapping.source}
                          disabled={isViewMode || mapping.field === 'anonymousId'}
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
                                type="text" placeholder="URL Pattern (/api/...)" 
                                className={`${styles.input} ${styles.urlParsingInputFlex2} ${errors.payloadMappings?.[idx] ? styles.inputError : ''}`}
                                value={mapping.requestUrlPattern || ''}
                                disabled={isViewMode}
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
                                disabled={isViewMode}
                                onChange={e => handleUpdateMapping(idx, { requestMethod: e.target.value as any })}
                              >
                                <option>POST</option><option>PUT</option><option>PATCH</option><option>DELETE</option><option>GET</option>
                              </select>
                            </div>
                            <input 
                              type="text" placeholder="Body Path (e.g., content.id)" 
                              className={`${styles.input} ${errors.payloadMappings?.[idx] ? styles.inputError : ''}`}
                              value={mapping.value || ''}
                              disabled={isViewMode}
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
                          </div>
                        )}

                        {mapping.source === MappingSource.REQUEST_URL && (
                          <div className={styles.urlParsingContainer}>
                            <div className={styles.urlParsingInputRow}>
                              <input 
                                type="text" placeholder="URL Pattern (/api/cart/:itemId)" 
                                className={`${styles.input} ${styles.urlParsingInputFlex2} ${errors.payloadMappings?.[idx] ? styles.inputError : ''}`}
                                value={mapping.requestUrlPattern || ''}
                                disabled={isViewMode}
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
                                disabled={isViewMode}
                                onChange={e => handleUpdateMapping(idx, { requestMethod: e.target.value as any })}
                              >
                                <option>POST</option><option>PUT</option><option>PATCH</option><option>DELETE</option><option>GET</option>
                              </select>
                            </div>
                            <input 
                              type="number" placeholder="Path Index (e.g., 1, 2, 3)" 
                              className={`${styles.input} ${errors.payloadMappings?.[idx] ? styles.inputError : ''}`}
                              value={mapping.value || ''}
                              disabled={isViewMode}
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
                          </div>
                        )}

                        {mapping.source === MappingSource.URL && (
                          <div className={styles.urlParsingContainer}>
                            <input 
                              type="text" placeholder="Enter full URL to parse..." className={styles.input}
                              value={mapping.fullUrl || ''}
                              disabled={isViewMode}
                              onChange={e => parseUrl(idx, e.target.value)}
                            />
                            {mapping.pathname && (
                              <div className={styles.urlParsingResultsGrid}>
                                <input type="text" disabled className={`${styles.input} ${styles.urlParsingDisabledInput}`} value={`Path: ${mapping.pathname}`} />
                                <input type="text" disabled className={`${styles.input} ${styles.urlParsingDisabledInput}`} value={`Query: ${mapping.queryString || 'None'}`} />
                              </div>
                            )}
                            <div className={styles.urlParsingControlRow}>
                              <select 
                                className={`${styles.input} ${styles.urlParsingSelect} ${errors.payloadMappings?.[idx] ? styles.inputError : ''}`}
                                value={mapping.urlPart || 'PathName'}
                                disabled={isViewMode}
                                onChange={e => {
                                  handleUpdateMapping(idx, { urlPart: e.target.value as any });
                                  if (errors.payloadMappings?.[idx]) {
                                    const newPayloadErrors = {...errors.payloadMappings};
                                    delete newPayloadErrors[idx];
                                    setErrors(prev => ({...prev, payloadMappings: newPayloadErrors}));
                                  }
                                }}
                              >
                                <option value="PathName">PathName</option>
                                <option value="QueryParam">QueryParam</option>
                              </select>
                              {mapping.urlPart === 'PathName' ? (
                                <input 
                                  type="number" placeholder="Segment Index" 
                                  className={`${styles.input} ${styles.urlParsingInputFlexAuto} ${errors.payloadMappings?.[idx] ? styles.inputError : ''}`}
                                  value={mapping.urlPartValue || ''}
                                  disabled={isViewMode}
                                  onChange={e => {
                                    handleUpdateMapping(idx, { urlPartValue: e.target.value });
                                    if (errors.payloadMappings?.[idx]) {
                                      const newPayloadErrors = {...errors.payloadMappings};
                                      delete newPayloadErrors[idx];
                                      setErrors(prev => ({...prev, payloadMappings: newPayloadErrors}));
                                    }
                                  }}
                                />
                              ) : (
                                <input 
                                  type="text" placeholder="Param Key" 
                                  className={`${styles.input} ${styles.urlParsingInputFlexAuto} ${errors.payloadMappings?.[idx] ? styles.inputError : ''}`}
                                  value={mapping.urlPartValue || ''}
                                  disabled={isViewMode}
                                  onChange={e => {
                                    handleUpdateMapping(idx, { urlPartValue: e.target.value });
                                    if (errors.payloadMappings?.[idx]) {
                                      const newPayloadErrors = {...errors.payloadMappings};
                                      delete newPayloadErrors[idx];
                                      setErrors(prev => ({...prev, payloadMappings: newPayloadErrors}));
                                    }
                                  }}
                                />
                              )}
                            </div>
                            {errors.payloadMappings?.[idx] && (
                              <p className={styles.errorText}>
                                <AlertCircle size={14} />
                                {errors.payloadMappings[idx]}
                              </p>
                            )}
                          </div>
                        )}

                        {mapping.source !== MappingSource.REQUEST_BODY && mapping.source !== MappingSource.REQUEST_URL && mapping.source !== MappingSource.URL && (
                          <div>
                            <input 
                              type="text"
                              placeholder={mapping.source === MappingSource.ELEMENT ? 'CSS Selector (e.g. .title)' : 'Path (e.g. user.id)'}
                              className={`${styles.input} ${errors.payloadMappings?.[idx] ? styles.inputError : ''}`}
                              value={mapping.field === 'anonymousId' ? 'recsys_anon_id' : (mapping.value || '')}
                              disabled={isViewMode || mapping.field === 'anonymousId'}
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
                          </div>
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
            {isViewMode ? 'Close' : 'Cancel'}
          </button>
          {!isViewMode && (
            <button onClick={handleSave} disabled={isSaving} className={styles.btnPrimary}>
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} style={{ marginRight: '4px' }} />}
              Save
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
