import { apiFetch, apiFetchBlob } from './client';
import type { ActiveUserCountResponse, InteractionTypeCountResponse, TrackedEvent } from './types';

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

    getActiveUsersCount: (domainKey: string, minutes: number) =>
        apiFetch<ActiveUserCountResponse>(`/event/domain/active-users/count?key=${domainKey}&minutes=${minutes}`, undefined, false),

    getInteractionTypeCounts: (domainKey: string) =>
        apiFetch<InteractionTypeCountResponse>(`/event/domain/interaction-types/count?key=${domainKey}`, undefined, false),

    exportDomainEvents: (domainKey: string, ruleId?: number) => {
        let url = `/event/domain/export?key=${domainKey}`;
        if (ruleId !== undefined) {
            url += `&ruleId=${ruleId}`;
        }
        return apiFetchBlob(url, { method: 'GET' }, false, true);
    },
};
