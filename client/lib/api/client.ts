const VITE_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://recsys-tracker-web-config.onrender.com';
const SERVER_API_BASE_URL = import.meta.env.SERVER_API_BASE_URL || 'https://recsys-tracker-module.onrender.com';

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
    if (useAuthHeader) {
        const accessToken = localStorage.getItem('accessToken');
        if (accessToken) {
            headers['Authorization'] = `Bearer ${accessToken}`;
        }
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

        return await response.json();
    } catch (error) {
        console.error(`API Error [${endpoint}]:`, error);
        throw error;
    }
}

export { VITE_API_BASE_URL, SERVER_API_BASE_URL };
