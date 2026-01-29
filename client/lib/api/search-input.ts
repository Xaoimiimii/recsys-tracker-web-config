import { apiFetch } from './client';
import type { SearchInputResponse } from './types';

export interface CreateSearchInputDto {
    DomainKey: string;
    ConfigurationName: string;
    InputSelector: string;
}

export interface UpdateSearchInputDto extends CreateSearchInputDto {
    Id: number;
}

export const searchInputApi = {
    getByDomainKey: (domainKey: string) => 
        apiFetch<SearchInputResponse[]>(`/search-keyword-config?domainKey=${domainKey}`, undefined, false),

    create: (data: CreateSearchInputDto) => 
        apiFetch<SearchInputResponse>('/search-keyword-config', {
            method: 'POST',
            body: JSON.stringify(data),
        }, true),

    update: (data: UpdateSearchInputDto) => 
        apiFetch<SearchInputResponse>('/search-keyword-config', {
            method: 'PATCH',
            body: JSON.stringify(data),
        }, false, true),

    delete: (id: number) => 
        apiFetch<void>(`/search-keyword-config/${id}`, {
            method: 'DELETE',
        }, false, true),
};
