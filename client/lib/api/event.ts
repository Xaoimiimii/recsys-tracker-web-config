import { apiFetch } from './client';
import type { TrackedEvent } from './types';

export const eventApi = {
    getLatestByDomain: (domainKey: string, k: number = 10) =>
        apiFetch<TrackedEvent[]>(`/event/domain/last?key=${domainKey}&k=${k}`, undefined, false),

    getLatestByRule: (ruleId: number, k: number = 10) =>
        apiFetch<TrackedEvent[]>(`/event/tracking-rule/last?id=${ruleId}&k=${k}`, undefined, false),
};
