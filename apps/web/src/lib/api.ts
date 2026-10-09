const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface ApiFetchOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

export async function apiFetch<T = any>(endpoint: string, options: ApiFetchOptions = {}): Promise<T> {
  const { params, headers, ...restOptions } = options;

  let url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const response = await fetch(url, {
    headers: {
      ...defaultHeaders,
      ...headers,
    },
    credentials: 'include', // sends httpOnly cookies
    ...restOptions,
  });

  const json = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = json?.error?.message || json?.message || `Request failed with status ${response.status}`;
    const error: any = new Error(errorMsg);
    error.status = response.status;
    error.code = json?.error?.code || 'UNKNOWN_ERROR';
    error.details = json?.error?.details;
    throw error;
  }

  return json;
}
