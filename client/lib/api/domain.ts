import { apiFetch } from './client';
import type { CreateDomainDto, DomainResponse } from './types';
import type { TriggerEvent } from '../../contexts/DataCacheContext';

export const domainApi = {
    create: (data: CreateDomainDto) => 
        apiFetch<DomainResponse>('/domain/create', {
            method: 'POST',
            body: JSON.stringify(data),
        }, false, true),
    
    getByKey: (key: string) =>
        apiFetch<DomainResponse>(`/domain/${key}`, {
            method: 'GET',
        }, true),
    
    getByTernantId: () =>
        apiFetch<DomainResponse[]>('/domain/ternant', {
            method: 'GET',
        }, false, true),
    
    getTriggerEvents: () =>
        apiFetch<TriggerEvent[]>('/domain/trigger-event/all', {
            method: 'GET',
        }, true),
};
