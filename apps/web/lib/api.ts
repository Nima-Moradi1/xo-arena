import { absoluteApiUrl } from "@/lib/utils";

export class ApiClientError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public issues?: Record<string, string[] | undefined>
  ) {
    super(message);
  }
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  const hasFormData = typeof FormData !== "undefined" && init.body instanceof FormData;

  if (init.body && !hasFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(absoluteApiUrl(path), {
    ...init,
    headers,
    credentials: "include",
    cache: "no-store"
  });

  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json") ? await response.json() : await response.text();

  if (!response.ok) {
    const error = typeof payload === "object" && payload && "error" in payload ? (payload as any).error : null;
    throw new ApiClientError(error?.message ?? "Request failed", response.status, error?.code, error?.issues);
  }

  return payload as T;
}
