import { apiFetch } from './client';
import type { CreateDomainDto, DomainResponse, UserIdentityResponse, UpdateUserIdentityDto } from './types';

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

    getUserIdentity: (domainKey: string) =>
        apiFetch<UserIdentityResponse>(`/domain/user-identity?key=${domainKey}`, {
            method: 'GET',
        }, false, true),

    updateUserIdentity: (data: UpdateUserIdentityDto) =>
        apiFetch<UserIdentityResponse>('/domain/user-identity', {
            method: 'PUT',
            body: JSON.stringify(data),
        }, false, true),
};
