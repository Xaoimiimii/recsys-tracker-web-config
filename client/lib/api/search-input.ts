import { apiFetch } from './client';

export interface CreateSearchInputDto {
    DomainKey: string;
    ConfigurationName: string;
    InputSelector: string;
}

export interface SearchInputResponse {
    Id: number;
    DomainID: number;
    Name: string;
    Selector: string;
    CreatedAt: string;
    UpdatedAt: string;
}

export const searchInputApi = {
    getByDomainKey: (domainKey: string) => 
        apiFetch<SearchInputResponse[]>(`/search-input/${domainKey}`, undefined, false, true),

    create: (data: CreateSearchInputDto) => 
        apiFetch<SearchInputResponse>('/search-keyword-config', {
            method: 'POST',
            body: JSON.stringify(data),
        }, false),

    update: (id: number, data: CreateSearchInputDto) => 
        apiFetch<SearchInputResponse>(`/search-input/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }, true),

    delete: (id: number) => 
        apiFetch<void>(`/search-input/${id}`, {
            method: 'DELETE',
        }, true),
};
