import { apiFetch } from './client';
import type { UserResponse } from './types';

export const userApi = {
    getMe: () => 
        apiFetch<UserResponse>('/users/me'),
};
