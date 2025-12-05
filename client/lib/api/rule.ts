import { apiFetch } from './client';
import type { 
    EventPattern, 
    PayloadPattern, 
    Operator, 
    CreateRuleDto, 
    RuleResponse 
} from './types';

export const ruleApi = {
    getEventPatterns: () => 
        apiFetch<EventPattern[]>('/rule/event-patterns'),

    getPayloadPatterns: () => 
        apiFetch<PayloadPattern[]>('/rule/payload-patterns'),

    getOperators: () => 
        apiFetch<Operator[]>('/rule/operators'),

    create: (data: CreateRuleDto) => 
        apiFetch<RuleResponse>('/rule/create', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    getById: (id: string) => 
        apiFetch<RuleResponse>(`/rule/${id}`),

    getByDomainId: (domainId: string) => 
        apiFetch<RuleResponse[]>(`/rule/domain/${domainId}`),
};
