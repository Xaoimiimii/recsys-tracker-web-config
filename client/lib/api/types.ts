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
  name: string;
  url: string;
  userId: string;
}

export interface DomainResponse {
  id: string;
  name: string;
  url: string;
  key: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface GetDomainResponse {
  domainKey: string;
  domainUrl: string | null;
  domainType: string | null;
}

// ==================== RETURN METHOD TYPES ====================

export interface CreateReturnMethodDto {
  domainKey: string;
  method: 'custom_widget' | 'popup' | 'inline_injection' | 'sdk_callback';
  slot: string;
  targetUrl?: string;
  targetSelector?: string;
}

export interface ReturnMethodResponse {
  DomainID?: number;
  SlotName?: string;
  Value?: string;
  TargetUrl?: string;
  ReturnMethodID?: number;
}

// ==================== RULE TYPES ====================

export interface EventPattern {
  Id: number;
  Name: string;
}

export interface PayloadPattern {
  Id: number;
  Name: string;
  Type: string | null;
}

export interface Operator {
  Id: number;
  Name: string;
}

export interface CreateRuleDto {
  name: string;
  domainKey: string;
  eventPatternId: string;
  targetElementId?: string;
  conditions?: {
    conditionId: string;
    operatorId: string;
    value: string;
  }[];
  payloads?: {
    payloadPatternId: string;
    payloadConfigId: string;
  }[];
}

// Response from /rule/domain/:domainKey - list of rules
export interface RuleListItem {
  id: number;
  name: string;
  TriggerTypeName: string;
}

// Response from /rule/:id - detailed rule info
export interface PayloadConfig {
  PayloadPatternID: number;
  RuleID: number;
  Value: string;
  Type: string;
  OperatorID: number;
}

export interface RuleCondition {
  Id: number;
  Value: string;
  RuleID: number;
  EventPatternID: number;
  OperatorID: number;
}

export interface RuleTargetElement {
  Id: number;
  Value: string;
  EventPatternID: number;
  OperatorID: number;
}

export interface RuleDetailResponse {
  Id: number;
  Name: string;
  TriggerEventID: number;
  TargetElementID: number;
  PayloadConfigs: PayloadConfig[];
  Conditions: RuleCondition[];
  TargetElement: RuleTargetElement;
}

// Legacy type - keep for backwards compatibility
export interface RuleResponse {
  id?: number | string;
  domainKey: string;
  name: string;
  eventPattern: EventPattern;
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
    operator: Operator;
    value: string;
  }>;
  payloads?: Array<{
    id: string;
    payloadPattern: PayloadPattern;
    payloadConfig: {
      id: string;
      extractionMethod: string;
      extractionValue: string;
    };
  }>;
  createdAt: string;
  updatedAt: string;
}

// ==================== USER TYPES ====================

export interface UserResponse {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

// ==================== ITEM TYPES ====================
export interface CreateItemDto {
  ternantItemId: string;
  title: string;
  description?: string;
  categories?: string[];
  domainId: number;
}