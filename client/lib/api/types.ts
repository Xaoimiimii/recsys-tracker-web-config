// ==================== AUTH TYPES ====================

export interface SignUpDto {
  username: string;
  password: string;
  name: string;
}

export interface AuthDto {
  username: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: number;
    username: string;
    name: string;
  };
}

export interface RefreshResponse {
  accessToken: string;
  user: {
    id: number;
    username: string;
    name: string;
  }
}

export interface UserState {
  isAuthenticated: boolean;
  currentUser: {
    name: string;
    email: string;
  } | null;
}

// ==================== DOMAIN TYPES ====================

export interface UserIdentityDto {
  Source: 'local_storage' | 'session_storage' | 'cookie' | 'request_body' | 'element';
  RequestConfig: any;
  Value: string;
  IsActivated: boolean;
}

export interface CreateDomainDto {
  url: string;
  type: number;
  UserIdentity: UserIdentityDto;
}

export interface DomainResponse {
  Id: number;
  TernantID: number;
  Key: string;
  Url: string;
  Type: number;
  CreatedAt: string;
}

// ==================== RETURN METHOD TYPES ====================

export enum ReturnType {
  POPUP = 'POPUP',
  INLINE_INJECTION = 'INLINE_INJECTION'
}

export interface CreateReturnMethod {
  Key: string;
  ConfigurationName: string;
  ReturnType: ReturnType;
  Value: string;
  LayoutJson: any;          
  StyleJson: any;
  CustomizingFields: any;
  DelayDuration?: number;
  SearchKeywordConfigId?: number;
}

export interface ReturnMethodResponse {
  Key: string;
  ConfigurationName: string;
  Value: string;
  ReturnType: string;
  LayoutJson?: any;
  StyleJson?: any;
  CustomizingFields?: any;
  DelayDuration?: number;
  SearchKeywordConfigId?: number;
}


// ==================== RULE TYPES ====================

export interface EventType {
  Id: number;
  Name: string;
}

export enum ItemIdentitySource {
  REQUEST_BODY = 'request_body',
  REQUEST_URL = 'request_url'
}

export enum UserIdentitySource {
  REQUEST_BODY = 'request_body',
  LOCAL_STORAGE = 'local_storage',
  SESSION_STORAGE = 'session_storage',
  COOKIE = 'cookie',
  ELEMENT = 'element'
}

export interface ItemIdentity {
  Source: ItemIdentitySource;
  TrackingRuleId: number;
  RequestConfig?: Record<string, any>;
}

export interface UserIdentity {
  Source: UserIdentitySource;
  RequestConfig?: Record<string, any>;
  Value?: string;
}

export interface CreateRule {
  Name: string;
  DomainKey: string;
  EventTypeId: number;
  PayloadMapping: any[];
  TrackingTarget: string;
  ActionType?: string | null;
}

export interface RuleDetailResponse {
  Id: number;
  Name: string;
  DomainID: number;
  EventTypeID: number;
  TrackingTarget: string | null;
  ActionType?: string;
  ItemIdentities: ItemIdentity[];
}

// EventType info in rule
export interface RuleEventType {
  Id: number;
  Name: string;
}

// Response from /rule/domain/:domainKey
export interface RuleListItem {
  Id: number;
  Name: string;
  DomainID: number;
  EventTypeID: number;
  TrackingTarget: string | null;
  ActionType?: string;
  EventType: RuleEventType;
  ItemIdentities: ItemIdentity[];
}

// ==================== USER TYPES ====================

export interface UserResponse {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

// ==================== ITEM TYPES ====================
export interface CreateItem {
  ternantItemId: string;
  title: string;
  description?: string;
  categories?: string[];
  domainId: number;
}

// ==================== EVENT TYPES ====================

export interface TrackedEvent {
  Id: number;
  EventTypeId: number;
  UserId?: string;
  AnonymousId: string;
  ItemField: string;
  ItemValue: string;
  RatingValue: number | null;
  ReviewValue: string | null;
  Timestamp: string;
  TrackingRule: {
    Id: number;
    Name: string;
  };
}

// ==================== SEARCH INPUT TYPES ====================

export interface SearchInputResponse {
  Id: number;
  DomainID: number;
  ConfigurationName: string;
  InputSelector: string;
}