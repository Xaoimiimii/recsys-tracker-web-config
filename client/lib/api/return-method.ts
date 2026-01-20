import { apiFetch } from './client';
import type { CreateReturnMethod, ReturnMethodResponse } from './types';

export const returnMethodApi = {
    getByDomainKey: (domainKey: string) => 
        apiFetch<ReturnMethodResponse[]>(`/return-method/${domainKey}`, undefined, false, true),

    create: (data: CreateReturnMethod) => apiFetch<ReturnMethodResponse>('/return-method', {
            method: 'POST',
            body: JSON.stringify(data),
        }, false),

    getItemAttributes: (domainKey: string) =>
        apiFetch<string[]>(`/return-method/item-attributes/${domainKey}`, undefined, false, true),

    delete: (id: string) => apiFetch<{ statusCode: number; message: string }>(`/return-method/${id}`, {
            method: 'DELETE',
        }, false, true),

    edit: (data: CreateReturnMethod) => apiFetch<ReturnMethodResponse>('/return-method', {
        method: 'PATCH',
        body: JSON.stringify(data),
    }, false),
};
