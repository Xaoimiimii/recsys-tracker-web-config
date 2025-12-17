import { apiFetch } from './client';
import type { CreateDomainDto, DomainResponse } from './types';

export const domainApi = {
    create: (data: CreateDomainDto) => 
        apiFetch<DomainResponse>('/domain/create', {
            method: 'POST',
            body: JSON.stringify(data),
        }, true),
    
    getByKey: (key: string) =>
        apiFetch<DomainResponse>(`/domain/${key}`, {
            method: 'GET',
        }, true),
};
