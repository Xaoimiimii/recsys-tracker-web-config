import { apiFetch } from './client';
import type { CreateReturnMethodDto, ReturnMethodResponse } from './types';

export const returnMethodApi = {
    getByDomainKey: (domainKey: string) => 
        apiFetch<ReturnMethodResponse[]>(`/return-method/${domainKey}`),

    create: (data: CreateReturnMethodDto) => 
        apiFetch<ReturnMethodResponse>('/return-method/create', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
};
