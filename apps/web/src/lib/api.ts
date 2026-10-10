const FASTAPI_URL = process.env.NEXT_PUBLIC_AUTH_API_URL || 'http://localhost:8000/api/v1';
const EXPRESS_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface ApiFetchOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

export function resolveApiUrl(endpoint: string): string {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  // Phase 2, 3, 4 & 5: Auth, Users, Admin, Products, Categories, Agent Shop/Listings, Cart, Orders, Wallet, Wishlist, Watchlist, Notifications, Reviews cut over to FastAPI
  if (
    cleanEndpoint.startsWith('/auth') ||
    cleanEndpoint.startsWith('/users') ||
    cleanEndpoint.startsWith('/admin') ||
    cleanEndpoint.startsWith('/products') ||
    cleanEndpoint.startsWith('/categories') ||
    cleanEndpoint.startsWith('/agent') ||
    cleanEndpoint.startsWith('/agents') ||
    cleanEndpoint.startsWith('/cart') ||
    cleanEndpoint.startsWith('/orders') ||
    cleanEndpoint.startsWith('/customer') ||
    cleanEndpoint.startsWith('/wishlist') ||
    cleanEndpoint.startsWith('/watchlist') ||
    cleanEndpoint.startsWith('/notifications') ||
    cleanEndpoint.startsWith('/reviews')
  ) {
    return `${FASTAPI_URL}${cleanEndpoint}`;
  }

  // Pre-existing mock routes remain on Express prototype
  return `${EXPRESS_API_URL}${cleanEndpoint}`;
}

export async function apiFetch<T = any>(endpoint: string, options: ApiFetchOptions = {}): Promise<T> {
  const { params, headers, ...restOptions } = options;

  let url = resolveApiUrl(endpoint);

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
