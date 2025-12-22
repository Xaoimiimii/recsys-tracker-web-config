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

export interface CreateReturnMethod {
  key: string;
  configurationName: string;
  returnMethodId: number;
  value: string;
}

export interface ReturnMethodResponse {
  DomainID: number;
  ConfigurationName: string;
  Operator: string;
  Value: string;
  ReturnMethodID: number;
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

export interface Condition {
  patternId: number;
  operatorId: number;
  value: string;
}

export interface PayloadConfig {
  field: string;
  source: string;
  value?: string;
  requestUrlPattern?: string;
  requestMethod?: string;
  requestBodyPath?: string;
  urlPart?: string;
  urlPartValue?: string;
}

export interface CreateRule {
  name: string;
  domainKey: string;
  eventTypeId: number;
  targetElementOperatorId?: number;
  targetElementValue?: string;
  conditions: Condition[];
  payloadConfigs: PayloadConfig[];
}

export interface TargetElement {
  Id: number;
  Value: string;
  OperatorID: number;
}

export interface RuleDetailResponse {
  Id: number;
  Name: string;
  DomainID: number;
  EventTypeID: number;
  TargetElement: TargetElement;
  Conditions: Condition[];
  PayloadConfigs: PayloadConfig[];
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

// ==================== ITEM TYPES ====================
export interface CreateItem {
  ternantItemId: string;
  title: string;
  description?: string;
  categories?: string[];
  domainId: number;
}