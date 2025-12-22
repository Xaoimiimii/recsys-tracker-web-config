import { apiFetch } from './client';
import type { CreateDomainDto, DomainResponse } from './types';

export const domainApi = {

    getByKey: (key: string) =>
        apiFetch<DomainResponse>(`/domain/${key}`, {
            method: 'GET',
        }, true),

    create: (data: CreateDomainDto) => 
        apiFetch<DomainResponse>('/domain/create', {
            method: 'POST',
            body: JSON.stringify(data),
        }, false, true),
    

    getByTernantId: () =>
        apiFetch<DomainResponse[]>('/domain/ternant', {
            method: 'GET',
        }, false, true),

    getAllEventType: () =>
        apiFetch<DomainResponse[]>('/domain/event-type/all', {
            method: 'GET',
        }, true),
};
