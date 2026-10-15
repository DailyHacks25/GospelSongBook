/**
 * Typed client-side fetch helper for our API routes.
 * Every route returns `{ ok: true, data }` or `{ ok: false, error }`.
 */

export interface ApiErrorShape {
  code: string;
  message: string;
  fields?: Record<string, string>;
}

export class ApiClientError extends Error {
  readonly code: string;
  readonly fields: Record<string, string>;
  readonly status: number;

  constructor(status: number, error: ApiErrorShape) {
    super(error.message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = error.code;
    this.fields = error.fields ?? {};
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
      credentials: "same-origin",
    });
  } catch {
    throw new ApiClientError(0, {
      code: "network_error",
      message: "Network error. Check your connection and try again.",
    });
  }

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    // non-JSON response (e.g. proxy error)
  }

  const body = payload as { ok?: boolean; data?: T; error?: ApiErrorShape } | null;
  if (response.ok && body && body.ok === true) {
    return body.data as T;
  }

  throw new ApiClientError(
    response.status,
    body?.error ?? {
      code: "internal_error",
      message: "Something went wrong. Please try again.",
    },
  );
}

export const api = {
  get: <T>(url: string) => request<T>(url, { method: "GET" }),
  post: <T>(url: string, body?: unknown) =>
    request<T>(url, { method: "POST", body: body !== undefined ? JSON.stringify(body) : undefined }),
  patch: <T>(url: string, body?: unknown) =>
    request<T>(url, { method: "PATCH", body: body !== undefined ? JSON.stringify(body) : undefined }),
  delete: <T>(url: string) => request<T>(url, { method: "DELETE" }),
};
