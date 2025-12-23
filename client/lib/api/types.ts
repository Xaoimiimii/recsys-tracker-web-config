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

export interface CreateDomainDto {
  url: string;
  type: number;
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
  OperatorId: number;
}

export interface ReturnMethodResponse {
  DomainID: number;
  ConfigurationName: string;
  Operator: string;
  Value: string;
  ReturnType: string;
}

// ==================== RULE TYPES ====================

export interface Pattern {
  Id: number;
  Name: string;
}

export interface Operator {
  Id: number;
  Name: string;
}

export interface EventType {
  Id: number;
  Name: string;
}

export interface Condition {
  PatternId: number;
  OperatorId: number;
  Value: string;
}

export interface PayloadConfig {
  Field: string;
  Source: string;
  Value?: string | null;
  RequestUrlPattern?: string | null;
  RequestMethod?: string | null;
  RequestBodyPath?: string | null;
  UrlPart?: string | null;
  UrlPartValue?: string | null;
}

export interface TrackingTarget {
  PatternId: number;
  OperatorId: number;
  Value: string;
}

export interface CreateRule {
  Name: string;
  DomainKey: string;
  EventTypeId: number;
  TrackingTarget?: TrackingTarget | null;
  Conditions: Condition[];
  PayloadMappings: PayloadConfig[];
}

export interface TargetElement {
  Id: number;
  Value: string;
  PatternId: number;
  OperatorId: number;
}

export interface RuleDetailResponse {
  Id: number;
  Name: string;
  DomainID: number;
  EventTypeID: number;
  TrackingTargetId: number;
  TrackingTarget: TargetElement;
  Conditions: Condition[];
  PayloadMappings: PayloadConfig[];
}

// Response from /rule/domain/:domainKey - list of rules
export interface RuleListItem {
  id: number;
  name: string;
  TriggerTypeName: string;
  TrackingTarget?: TargetElement;
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