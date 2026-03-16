import { apiCache, cachePolicies, shouldSkipCacheForEndpoint } from "@/lib/apiCache";
import type {
  AuthSessionResponse,
  ConstantsResponse,
  LoginPayload,
  LoginResponse,
  PublicConstants,
  User,
} from "@/types/api";

type CachePolicyKey = keyof typeof cachePolicies;
type ApiRequestOptions = RequestInit & {
  cachePolicy?: CachePolicyKey;
};

interface ApiErrorPayload {
  message?: string;
}

function normalizeApiBase(value: string | undefined): string {
  if (!value) return "";
  return value.replace(/\/+$/, "");
}

function toApiPath(endpoint: string): string {
  if (/^https?:\/\//i.test(endpoint)) return endpoint;
  if (endpoint.startsWith("/")) return endpoint;
  return `/${endpoint}`;
}

const API_BASE = normalizeApiBase(import.meta.env.VITE_API_URL);

function buildRequestUrl(endpoint: string): string {
  const apiPath = toApiPath(endpoint);
  return API_BASE ? `${API_BASE}${apiPath}` : apiPath;
}

async function parseErrorPayload(response: Response): Promise<ApiErrorPayload> {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json().catch(() => ({}));
  }

  const text = await response.text().catch(() => "");
  return text ? { message: text } : {};
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly payload?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiRequest<T>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const { cachePolicy, headers, body, method, ...rest } = options;
  const upperMethod = (method || "GET").toUpperCase();
  const requestUrl = buildRequestUrl(endpoint);
  const useCache =
    upperMethod === "GET" &&
    cachePolicy &&
    cachePolicies[cachePolicy].maxAge > 0 &&
    !shouldSkipCacheForEndpoint(toApiPath(endpoint));

  if (useCache) {
    const cached = apiCache.get<T>(requestUrl, cachePolicies[cachePolicy].maxAge);
    if (cached) return cached;
  }

  const requestHeaders = new Headers(headers);
  if (body != null && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json");
  }
  if (!requestHeaders.has("Accept")) {
    requestHeaders.set("Accept", "application/json");
  }

  let response: Response;
  try {
    response = await fetch(requestUrl, {
      ...rest,
      method: upperMethod,
      body,
      credentials: "include",
      headers: requestHeaders,
    });
  } catch (error) {
    throw new ApiError(0, "네트워크 요청에 실패했습니다.", error);
  }

  if (!response.ok) {
    const errorPayload = await parseErrorPayload(response);
    throw new ApiError(
      response.status,
      errorPayload.message || `요청에 실패했습니다. (${response.status})`,
      errorPayload
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? ((await response.json()) as T)
    : ((await response.text()) as T);

  if (useCache) {
    apiCache.set(requestUrl, data);
  }

  if (["POST", "PUT", "PATCH", "DELETE"].includes(upperMethod)) {
    apiCache.invalidate(/^https?:\/\/.*\/api\/auth\//);
    apiCache.invalidate(/^https?:\/\/.*\/api\/constants/);
    apiCache.invalidate(/^\/api\/auth\//);
    apiCache.invalidate(/^\/api\/constants/);
  }

  return data;
}

export function isAuthEnabled(): boolean {
  return import.meta.env.VITE_ENABLE_AUTH === "true";
}

export function isRemoteConstantsEnabled(): boolean {
  return import.meta.env.VITE_ENABLE_REMOTE_CONSTANTS === "true";
}

export async function fetchCurrentUser(): Promise<User | null> {
  const response = await apiRequest<AuthSessionResponse>("/api/auth/session", {
    cachePolicy: "authSession",
  });
  return response.user;
}

export async function login(payload: LoginPayload): Promise<User> {
  const response = await apiRequest<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return response.user;
}

export async function logout(): Promise<void> {
  await apiRequest<void>("/api/auth/logout", {
    method: "POST",
  });
}

export async function fetchPublicConstants(): Promise<Partial<PublicConstants>> {
  const response = await apiRequest<ConstantsResponse>("/api/constants", {
    cachePolicy: "constants",
  });
  return response.constants || {};
}
