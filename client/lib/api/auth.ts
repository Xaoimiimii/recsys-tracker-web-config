import { apiFetch } from './client';
import type { SignUpDto, AuthDto, AuthResponse, RefreshResponse } from './types';

export const authApi = {
    signup: (data: SignUpDto) => 
        apiFetch<AuthResponse>('/auth/signup', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    signin: (data: AuthDto) => 
        apiFetch<AuthResponse>('/auth/signin', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    signout: () => 
        apiFetch<void>('/auth/signout', {
            method: 'POST',
        }),
    
    refresh: () =>
        apiFetch<RefreshResponse>("/auth/refresh", {
            method: "POST",
        }),
};
