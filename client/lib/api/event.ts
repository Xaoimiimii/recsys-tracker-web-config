import { apiFetch } from './client';
import type { TrackedEvent } from './types';

export const eventApi = {
    getLatestByDomain: (domainKey: string, k: number = 10, page: number = 1, ruleId?: number) => {
        let url = `/event/domain/last?key=${domainKey}&k=${k}&page=${page}`;
        if (ruleId !== undefined) {
            url += `&ruleId=${ruleId}`;
        }
        return apiFetch<TrackedEvent[]>(url, undefined, false);
    },

    getLatestByRule: (ruleId: number, k: number = 10, page: number = 1) =>
        apiFetch<TrackedEvent[]>(`/event/tracking-rule/last?id=${ruleId}&k=${k}&page=${page}`, undefined, false),
};
