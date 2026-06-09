const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000/api";

class ApiRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    let message = `Error HTTP ${response.status}`;

    try {
      const body = (await response.json()) as { message?: string; error?: string };
      message = body.message ?? body.error ?? message;
    } catch {
      // Keep the generic HTTP message when the API does not return JSON.
    }

    throw new ApiRequestError(message, response.status);
  }

  return response.json() as Promise<T>;
}

export async function withMockFallback<T>(
  apiCall: () => Promise<T>,
  mockCall: () => T | Promise<T>,
): Promise<T> {
  try {
    return await apiCall();
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn("Cultivation API unavailable, using mock data.", error);
    }
    return mockCall();
  }
}
