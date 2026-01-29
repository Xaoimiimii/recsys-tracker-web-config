import { apiFetch } from './client';

export const recommendationApi = {
    triggerTrainModels: () =>
        apiFetch<void>('/recommendation', {
            method: 'POST',
        }),
};
