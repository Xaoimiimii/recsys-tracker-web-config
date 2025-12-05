// ==================== AUTH TYPES ====================

export interface SignUpDto {
  email: string;
  password: string;
  name: string;
}

export interface AuthDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
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

// ==================== RETURN METHOD TYPES ====================

export interface CreateReturnMethodDto {
  domainKey: string;
  method: 'custom_widget' | 'popup' | 'inline_injection' | 'sdk_callback';
  slot: string;
  targetUrl?: string;
  targetSelector?: string;
}

export interface ReturnMethodResponse {
  id: string;
  domainKey: string;
  method: string;
  slot: string;
  targetUrl?: string;
  targetSelector?: string;
  createdAt: string;
  updatedAt: string;
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

export interface RuleResponse {
  id: string;
  name: string;
  domainKey: string;
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
