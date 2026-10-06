/**
 * Normalizes API URL ensuring no duplicated /api/v1 and handling trailing slashes.
 */
export function getNormalizedApiUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
  let cleaned = envUrl.trim().replace(/\/+$/, '');

  if (!cleaned.endsWith('/api/v1')) {
    cleaned = `${cleaned}/api/v1`;
  }
  return cleaned;
}

export interface ApiFetchOptions extends RequestInit {
  timeoutMs?: number;
}

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = getNormalizedApiUrl();
  }

  private async fetchWithTimeout(url: string, options: ApiFetchOptions = {}): Promise<Response> {
    const { timeoutMs = 30000, ...fetchOptions } = options;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(fetchOptions.headers || {}),
        },
      });
      clearTimeout(timeoutId);
      return res;
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new Error(`Request timed out after ${timeoutMs}ms`);
      }
      throw new Error(err.message || 'Network communication error');
    }
  }

  public async request<T = any>(endpoint: string, options: ApiFetchOptions = {}): Promise<T> {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    // Strip redundant /api/v1 if present in endpoint
    const finalEndpoint = cleanEndpoint.replace(/^\/api\/v1/, '');
    const url = `${this.baseUrl}${finalEndpoint}`;

    try {
      const response = await this.fetchWithTimeout(url, options);

      if (response.status === 401) {
        // Try single refresh retry if not already calling auth
        if (!endpoint.includes('/auth/')) {
          try {
            await this.post('/auth/refresh', {});
            // Retry original request once
            const retryRes = await this.fetchWithTimeout(url, options);
            const retryJson = await retryRes.json();
            return retryJson.data !== undefined ? retryJson.data : retryJson;
          } catch {
            // Fallthrough to standard error
          }
        }
      }

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.message || json.error?.message || `HTTP ${response.status} Error`);
      }

      return json.data !== undefined ? json.data : json;
    } catch (err: any) {
      console.warn(`[API Client Error] ${endpoint}:`, err.message);
      throw err;
    }
  }

  public get<T = any>(endpoint: string, options: ApiFetchOptions = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  public post<T = any>(endpoint: string, body?: any, options: ApiFetchOptions = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public put<T = any>(endpoint: string, body?: any, options: ApiFetchOptions = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public delete<T = any>(endpoint: string, options: ApiFetchOptions = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
