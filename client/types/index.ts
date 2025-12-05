export type DomainType = 'music' | 'movie' | 'news' | 'ecommerce' | 'general';

export type TriggerType = 'click' | 'form_submit' | 'scroll' | 'timer' | 'view';

export type ExtractionMethod = 'static' | 'css_attribute' | 'inner_text' | 'url_param' | 'js_variable' | 'cookie';

export type OutputMethod = 'popup' | 'inline_injection' | 'custom_widget' | 'sdk_callback';

export interface DataExtractionRule {
  field: 'itemId' | 'event' | 'category' | 'userId';
  method: ExtractionMethod;
  value: string; // The selector, attribute name, or static value
  regex?: string; // Optional regex for cleaning
}

export interface TrackingRule {
  id: string;
  name: string;
  trigger: TriggerType;
  selector: string; // CSS Selector for the element to watch (or empty for page-wide)
  extraction: DataExtractionRule[];
}

export interface DisplayMethodConfig {
  id: string;
  slot: string;
  targetUrl?: string;
  method: OutputMethod;
  targetSelector?: string; // For inline_injection
}

export interface Container {
  id: string;
  uuid: string; // The DomainKey
  name: string;
  url: string;
  domainType: DomainType;
  rules: TrackingRule[];
  outputConfig: {
    displayMethods: DisplayMethodConfig[];
  };
}

export interface UserState {
  isAuthenticated: boolean;
  currentUser: { name: string; email: string } | null;
}

// API Response Types (imported from lib/api.ts for reference)
export interface ApiEventPattern {
  id: string;
  type: string;
  description?: string;
}

export interface ApiPayloadPattern {
  id: string;
  pattern: string;
  description?: string;
}

export interface ApiOperator {
  id: string;
  operator: string;
  description?: string;
}

export interface ApiRuleResponse {
  id: string;
  name: string;
  domainKey: string;
  eventPattern: ApiEventPattern;
  targetElement?: {
    id: string;
    selector: string;
    selectorType: string;
  };
  conditions?: Array<{
    id: string;
    condition: {
      id: string;
      type: string;
    };
    operator: ApiOperator;
    value: string;
  }>;
  payloads?: Array<{
    id: string;
    payloadPattern: ApiPayloadPattern;
    payloadConfig: {
      id: string;
      extractionMethod: string;
      extractionValue: string;
    };
  }>;
  createdAt: string;
  updatedAt: string;
}

