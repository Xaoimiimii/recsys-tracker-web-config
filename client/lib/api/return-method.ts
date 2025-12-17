import { apiFetch } from './client';
import type { CreateReturnMethodDto, ReturnMethodResponse, ReturnMethodType } from './types';

export const returnMethodApi = {
    getByDomainKey: (domainKey: string) => 
        apiFetch<ReturnMethodResponse[]>(`/domain/return-method/${domainKey}`, undefined, true),

    getAll: () => 
        apiFetch<ReturnMethodType[]>('/domain/return-method/all', undefined, true),

    create: (data: CreateReturnMethodDto) => 
        apiFetch<ReturnMethodResponse>('/domain/return-method/create', {
            method: 'POST',
            body: JSON.stringify(data),
        }, true),
};
