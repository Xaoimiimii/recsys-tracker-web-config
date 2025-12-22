import { apiFetch } from './client';
import type { 
    EventPattern, 
    PayloadPattern, 
    Operator, 
    CreateRuleDto, 
    RuleListItem,
    RuleDetailResponse
} from './types';

export const ruleApi = {
    getEventPatterns: () => 
        apiFetch<EventPattern[]>('/rule/event-patterns', undefined, true),

    getPayloadPatterns: () => 
        apiFetch<PayloadPattern[]>('/rule/payload-patterns', undefined, true),

    getOperators: () => 
        apiFetch<Operator[]>('/rule/operators', undefined, true),

    create: (data: CreateRuleDto) => 
        apiFetch<{ statusCode: number; message: string }>('/rule/create', {
            method: 'POST',
            body: JSON.stringify(data),
        }, true),

    // Get list of rules for a domain
    getRulesByDomain: (domainKey: string) => 
        apiFetch<RuleListItem[]>(`/rule/domain/${domainKey}`, undefined, true),

    // Get detailed information for a specific rule
    getRuleById: (ruleId: number) => 
        apiFetch<RuleDetailResponse>(`/rule/${ruleId}`, undefined, true),
};
