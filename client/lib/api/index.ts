// Export all API modules
export { authApi } from './auth';
export { domainApi } from './domain';
export { userIdentityApi } from './user-identity';
export { returnMethodApi } from './return-method';
export { searchInputApi } from './search-input';
export { ruleApi } from './rule';
export { userApi } from './user';
export { eventApi } from './event';
export { recommendationApi } from './recommendation';


// Export client utilities
export { apiFetch, WEB_CONFIG_API_BASE_URL, MODULE_API_BASE_URL } from './client';

// Export all types
export type * from './types';
