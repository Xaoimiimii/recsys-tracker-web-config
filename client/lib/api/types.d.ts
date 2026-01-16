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
    };
}
export interface UserState {
    isAuthenticated: boolean;
    currentUser: {
        name: string;
        email: string;
    } | null;
}
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
export declare enum ReturnType {
    POPUP = "POPUP",
    INLINE_INJECTION = "INLINE_INJECTION"
}
export interface CreateReturnMethod {
    Key: string;
    ConfigurationName: string;
    ReturnType: ReturnType;
    Value: string;
    OperatorId: number;
    LayoutJson: any;
    StyleJson: any;
    CustomizingFields: any;
    DelayDuration?: number;
}
export interface ReturnMethodResponse {
    Key: string;
    ConfigurationName: string;
    OperatorId: string;
    Value: string;
    ReturnType: string;
    LayoutJson?: any;
    StyleJson?: any;
    CustomizingFields?: any;
    DelayDuration?: number;
}
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
    Conditions: RuleCondition[];
    PayloadMappings: RulePayloadMapping[];
}
export interface RuleCondition {
    Id: number;
    Value: string;
    TrackingRuleID: number;
    PatternId: number;
    OperatorID: number;
}
export interface RulePayloadMapping {
    Id: number;
    Field: string;
    Source: string;
    Value: string | null;
    RequestUrlPattern: string | null;
    RequestMethod: string | null;
    RequestBodyPath: string | null;
    UrlPart: string | null;
    UrlPartValue: string | null;
    TrackingRuleId: number;
}
export interface RuleEventType {
    Id: number;
    Name: string;
}
export interface RuleListItem {
    Id: number;
    Name: string;
    DomainID: number;
    EventTypeID: number;
    TrackingTargetId: number;
    PayloadMappings: RulePayloadMapping[];
    Conditions: RuleCondition[];
    TrackingTarget: TargetElement;
    EventType: RuleEventType;
}
export interface UserResponse {
    id: string;
    email: string;
    name: string;
    createdAt: string;
}
export interface CreateItem {
    ternantItemId: string;
    title: string;
    description?: string;
    categories?: string[];
    domainId: number;
}
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
export interface SearchInputResponse {
    Id: number;
    DomainID: number;
    ConfigurationName: string;
    InputSelector: string;
}
