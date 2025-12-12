import { apiFetch } from './client';
import type { CreateReturnMethodDto, ReturnMethodResponse } from './types';

export const returnMethodApi = {
    getByDomainKey: (domainKey: string) => 
        apiFetch<ReturnMethodResponse[]>(`/domain/return-method/${domainKey}`, undefined, true),

    create: (data: CreateReturnMethodDto) => 
        apiFetch<ReturnMethodResponse>('/domain/return-method/create', {
            method: 'POST',
            body: JSON.stringify(data),
        }, true),
};
