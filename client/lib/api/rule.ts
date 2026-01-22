import { apiFetch } from './client';
import type { 
    CreateRule, 
    RuleListItem,
    RuleDetailResponse,
    EventType
} from './types';

export const ruleApi = {
    getAllEventType: () =>
        apiFetch<EventType[]>('/rule/event-type', undefined, true),

    create: (data: CreateRule) => 
        apiFetch<{ statusCode: number; message: string }>('/rule/create', {
            method: 'POST',
            body: JSON.stringify(data),
        }, false, true),

    getRulesByDomain: (domainKey: string) => 
        apiFetch<RuleListItem[]>(`/rule/domain/${domainKey}`, undefined, true),

    delete: (id: string | number) => 
        apiFetch<{ statusCode: number; message: string }>(`/rule/${id}`, {
            method: 'DELETE',
        }, false, true),

    update: (data: any) =>
        apiFetch<{ statusCode: number; message: string }>('/rule', {
            method: 'PATCH',
            body: JSON.stringify(data),
        }, false, true),
};
