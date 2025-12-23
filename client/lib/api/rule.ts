import { apiFetch } from './client';
import type { 
    Pattern, 
    Operator, 
    CreateRule, 
    RuleListItem,
    RuleDetailResponse,
    EventType
} from './types';

export const ruleApi = {
    getPatterns: () => 
        apiFetch<Pattern[]>('/rule/pattern', undefined, true),

    getOperators: () => 
        apiFetch<Operator[]>('/rule/operators', undefined, true),

    getAllEventType: () =>
        apiFetch<EventType[]>('/rule/event-type', undefined, true),

    create: (data: CreateRule) => 
        apiFetch<{ statusCode: number; message: string }>('/rule/create', {
            method: 'POST',
            body: JSON.stringify(data),
        }, true),

    // Get detailed information for a specific rule
    getRuleById: (ruleId: number) => 
        apiFetch<RuleDetailResponse>(`/rule/${ruleId}`, undefined, true),

    // Get list of rules for a domain
    getRulesByDomain: (domainKey: string) => 
        apiFetch<RuleListItem[]>(`/rule/domain/${domainKey}`, undefined, true),

};
