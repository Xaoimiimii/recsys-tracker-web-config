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
  ternantId: number;
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

export interface ReturnMethodType {
  id: number;
  name: string;
}

export interface CreateReturnMethodDto {
  key: string;
  slotName: string;
  returnMethodId: number;
  targetUrl: string;
  targetSelector?: string;
}

export interface ReturnMethodResponse {
  DomainID: number;
  SlotName: string;
  Value: string;
  TargetUrl: string;
  ReturnMethodID: number;
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

export interface ConditionDto {
  eventPatternId: number;
  operatorId: number;
  value: string;
}

export interface PayloadConfigDto {
  payloadPatternId: number;
  operatorId: number;
  value?: string;
  type?: string;
}

export interface CreateRuleDto {
  name: string;
  domainKey: string;
  triggerEventId: number;
  targetEventPatternId: number;
  targetOperatorId: number;
  targetElementValue: string;
  conditions: ConditionDto[];
  payloadConfigs: PayloadConfigDto[];
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
  EventPatternID: number;
  RuleID: number;
  OperatorID: number;
  Value: string;
}

export interface TargetElement {
  Id: number;
  Value: string;
  EventPatternID: number;
  OperatorID: number;
}

export interface RuleDetailResponse {
  Id: number;
  Name: string;
  DomainID: number;
  TriggerEventID: number;
  TargetElementID: number;
  PayloadConfigs: PayloadConfig[];
  Conditions: RuleCondition[];
  TargetElement: TargetElement;
}

// Response from /rule/domain/:domainKey - list of rules
export interface RuleListItem {
  id: number;
  name: string;
  TriggerTypeName: string;
}

// ==================== USER TYPES ====================

export interface UserResponse {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}
