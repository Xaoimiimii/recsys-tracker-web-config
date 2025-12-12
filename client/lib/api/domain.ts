import { apiFetch } from './client';
import type { CreateDomainDto, DomainResponse, GetDomainResponse } from './types';

export const domainApi = {
    create: (data: CreateDomainDto) => 
        apiFetch<DomainResponse>('/domain/create', {
            method: 'POST',
            body: JSON.stringify(data),
        }, true),
    
    getByKey: (key: string) =>
        apiFetch<GetDomainResponse>(`/domain/${key}`, {
            method: 'GET',
        }, true),
};
