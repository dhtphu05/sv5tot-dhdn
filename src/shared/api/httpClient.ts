/**
 * 5TOT ĐHĐN — Typed Backend API HTTP Client
 * Enforces strict Real Backend Mode semantics:
 * - Attaches actor authentication/authorization headers and Bearer token.
 * - Parses structured JSON responses.
 * - Throws explicit BackendApiError on HTTP or network failure (never falls back to Demo data).
 */

export interface ApiActorContext {
  userId?: string;
  userName?: string;
  userEmail?: string;
  role?: string;
  unitId?: string;
  token?: string;
}

export class BackendApiError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(message: string, status: number = 500, code: string = 'BACKEND_API_ERROR', details?: unknown) {
    super(message);
    this.name = 'BackendApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const ACTOR_STORAGE_KEY = '5tot_auth_actor_context_v1';

let activeApiBaseUrl = '';
let activeActorContext: ApiActorContext | null = null;

export function setApiBaseUrl(baseUrl: string): void {
  activeApiBaseUrl = baseUrl.replace(/\/+$/, '');
}

export function getApiBaseUrl(): string {
  if (activeApiBaseUrl) return activeApiBaseUrl;
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) {
    return String(import.meta.env.VITE_API_BASE_URL).replace(/\/+$/, '');
  }
  return '';
}

export function setApiActorContext(actor: ApiActorContext | null): void {
  activeActorContext = actor;
  if (typeof window !== 'undefined') {
    try {
      if (actor) {
        window.sessionStorage.setItem(ACTOR_STORAGE_KEY, JSON.stringify(actor));
      } else {
        window.sessionStorage.removeItem(ACTOR_STORAGE_KEY);
      }
    } catch {
      // Ignore storage errors in restricted environments
    }
  }
}

export function getApiActorContext(): ApiActorContext | null {
  if (activeActorContext) return activeActorContext;
  if (typeof window !== 'undefined') {
    try {
      const raw = window.sessionStorage.getItem(ACTOR_STORAGE_KEY);
      if (raw) {
        activeActorContext = JSON.parse(raw) as ApiActorContext;
        return activeActorContext;
      }
    } catch {
      // Ignore storage errors
    }
  }
  return null;
}

export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  actor?: ApiActorContext;
  headers?: Record<string, string>;
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${baseUrl}${normalizedPath}`;

  const currentActor = getApiActorContext();
  const actor = options.actor || currentActor;
  const effectiveToken = options.actor?.token || currentActor?.token;
  const isV2Endpoint = normalizedPath.startsWith('/api/v2/') || normalizedPath === '/api/v2';

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...options.headers,
  };

  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (effectiveToken) {
    headers['Authorization'] = `Bearer ${effectiveToken}`;
  }

  // Backend V2 (/api/v2/*) enforces Zero-Trust anti-spoofing and strictly forbids x-5tot-actor-* headers.
  if (actor && !isV2Endpoint) {
    if (actor.userId) {
      headers['x-5tot-actor-id'] = encodeURIComponent(actor.userId);
    }
    if (actor.userName) {
      headers['x-5tot-actor-name'] = encodeURIComponent(actor.userName);
    }
    if (actor.userEmail) {
      headers['x-5tot-actor-email'] = encodeURIComponent(actor.userEmail);
    }
    if (actor.role) {
      headers['x-5tot-actor-role'] = encodeURIComponent(actor.role);
    }
    if (actor.unitId) {
      headers['x-5tot-actor-unit'] = encodeURIComponent(actor.unitId);
    }
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method: options.method || 'GET',
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch (networkErr: unknown) {
    const msg = networkErr instanceof Error ? networkErr.message : 'Không thể kết nối máy chủ Backend';
    throw new BackendApiError(
      `Lỗi kết nối Backend API (${normalizedPath}): ${msg}`,
      0,
      'NETWORK_FAILURE',
      networkErr
    );
  }

  let payload: any = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json') || contentType.includes('application/problem+json')) {
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }
  } else {
    const text = await response.text();
    throw new BackendApiError(
      `Phản hồi từ Backend không đúng định dạng JSON tại ${normalizedPath}`,
      response.status,
      'INVALID_RESPONSE_FORMAT',
      text.slice(0, 200)
    );
  }

  if (!response.ok || (payload && payload.success === false)) {
    const errMsg =
      payload?.error ||
      payload?.detail ||
      payload?.message ||
      `Yêu cầu Backend thất bại với mã trạng thái HTTP ${response.status}`;
    const errCode = payload?.errorCode || payload?.code || `HTTP_${response.status}`;
    throw new BackendApiError(errMsg, response.status, errCode, payload);
  }

  return payload as T;
}
