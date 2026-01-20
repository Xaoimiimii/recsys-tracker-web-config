import { apiFetch } from './client';

export interface CreateUserIdentityDto {
  Source: 'local_storage' | 'session_storage' | 'cookie' | 'request_body' | 'element';
  RequestConfig: any;
  Value: string;
  Field: string;
  DomainKey: string;
}

export interface UserIdentityResponse {
  Id: number;
  Source: string;
  RequestConfig: any;
  Value: string;
  Field: string;
  DomainKey: string;
  CreatedAt: string;
}

export const userIdentityApi = {
  create: (data: CreateUserIdentityDto) => 
    apiFetch<UserIdentityResponse>('/domain/user-identity', {
      method: 'POST',
      body: JSON.stringify(data),
    }, false, true),
};
