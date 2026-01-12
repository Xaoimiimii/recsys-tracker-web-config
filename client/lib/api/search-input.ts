import { apiFetch } from './client';

export interface CreateSearchInputDto {
    Key: string;
    Name: string;
    Selector: string;
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
        apiFetch<SearchInputResponse>('/domain/search-input', {
            method: 'POST',
            body: JSON.stringify(data),
        }, true),

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
