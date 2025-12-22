export type DomainType = 'music' | 'movie' | 'news' | 'ecommerce' | 'general';

export type TriggerType = 'click' | 'rate' | 'page_view' | 'scroll';

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
  trigger: string;
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