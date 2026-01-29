const VITE_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://recsys-tracker-web-config.onrender.com';
const SERVER_API_BASE_URL = import.meta.env.SERVER_API_BASE_URL || 'https://recsys-tracker-module.onrender.com';

// Global token storage
let globalAccessToken: string | null = null;

export function setGlobalAccessToken(token: string | null) {
    globalAccessToken = token;
}

export async function apiFetch<T>(
    endpoint: string,
    options?: RequestInit,
    useServerUrl: boolean = false,
    useAuthHeader: boolean = false
): Promise<T> {
    const baseUrl = useServerUrl ? SERVER_API_BASE_URL : VITE_API_BASE_URL;
    const url = `${baseUrl}${endpoint}`;
  
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...options?.headers as Record<string, string>,
    };

    // Add Authorization header if needed
    if (useAuthHeader && globalAccessToken) {
        headers['Authorization'] = `Bearer ${globalAccessToken}`;
    }
  
    try {
        const response = await fetch(url, {
            ...options,
            headers,
            credentials: 'include', // Include cookies for JWT auth
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
            console.error('API error detail:', errorData);
            const errorMessage = Array.isArray(errorData.message) 
                ? errorData.message.join(', ') 
                : errorData.message;
            throw new Error(errorMessage || `HTTP ${response.status}: ${response.statusText}`);
        }

        const contentType = response.headers.get('content-type');
        const hasContent = response.headers.get('content-length') !== '0';

        if (response.status === 204 || !hasContent) {
            return {} as T;
        }

        if (contentType && contentType.includes('application/json')) {
            return await response.json();
        }

        return {} as T;
    } catch (error) {
        console.error(`API Error [${endpoint}]:`, error);
        throw error;
    }
}

export { VITE_API_BASE_URL, SERVER_API_BASE_URL };