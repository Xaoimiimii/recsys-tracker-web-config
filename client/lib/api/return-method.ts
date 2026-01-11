import { apiFetch } from './client';
import type { CreateReturnMethod, ReturnMethodResponse } from './types';

export const returnMethodApi = {
    getByDomainKey: (domainKey: string) => 
        apiFetch<ReturnMethodResponse[]>(`/domain/return-method/${domainKey}`, undefined, true),

    create: (data: CreateReturnMethod) => 
        apiFetch<ReturnMethodResponse>('/return-method', {
            method: 'POST',
            body: JSON.stringify(data),
        }, true),
};
