/**
 * Utility pour faire des appels API avec gestion automatique des erreurs
 * et des credentials (cookies)
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

export interface ApiError {
  error: string;
  details?: any;
}

export async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;

  const defaultOptions: RequestInit = {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  };

  const response = await fetch(url, { ...defaultOptions, ...options });

  if (!response.ok) {
    const errorData: ApiError = await response.json().catch(() => ({
      error: `Erreur HTTP ${response.status}`,
    }));
    throw new Error(errorData.error || `Erreur ${response.status}`);
  }

  return response.json();
}
