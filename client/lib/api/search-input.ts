import { apiFetch } from './client';
import type { SearchInputResponse } from './types';

export interface CreateSearchInputDto {
    DomainKey: string;
    ConfigurationName: string;
    InputSelector: string;
}

export const searchInputApi = {
    getByDomainKey: (domainKey: string) => 
        apiFetch<SearchInputResponse[]>(`/search-keyword-config?domainKey=${domainKey}`, undefined, false),

    create: (data: CreateSearchInputDto) => 
        apiFetch<SearchInputResponse>('/search-keyword-config', {
            method: 'POST',
            body: JSON.stringify(data),
        }, true),

    update: (id: number, data: CreateSearchInputDto) => 
        apiFetch<SearchInputResponse>(`/search-input/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }, true),

};
