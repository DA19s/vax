export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

export class ApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export type FetchOptions = RequestInit & {
  timeoutMs?: number;
};

export async function apiFetch<T>(
  path: string,
  { timeoutMs = 10000, headers, ...init }: FetchOptions = {}
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      credentials: "include", // ✅ Envoie automatiquement le cookie HttpOnly avec le token JWT
      headers: {
        "Content-Type": "application/json",
        ...(headers || {}),
      },
      signal: controller.signal,
    });

    const contentType = res.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");
    const body = isJson ? await res.json() : await res.text();

    if (!res.ok) {
      const message =
        (isJson && (body?.message || body?.error)) ||
        `HTTP ${res.status} ${res.statusText}`;
      throw new ApiError(message, res.status);
    }

    return body as T;
  } catch (err: any) {
    if (err?.name === "AbortError") {
      throw new ApiError("Request timeout", 408);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
