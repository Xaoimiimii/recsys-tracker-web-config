import { apiFetch } from './client';
import type { CreateReturnMethod, ReturnMethodResponse } from './types';

export const returnMethodApi = {
    getByDomainKey: (domainKey: string) => 
        apiFetch<ReturnMethodResponse[]>(`/return-method/${domainKey}`, undefined, false, true),

    create: (data: CreateReturnMethod) => 
        apiFetch<ReturnMethodResponse>('/return-method', {
            method: 'POST',
            body: JSON.stringify(data),
        }, false),
};
