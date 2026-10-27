/**
 * 5TOT ĐHĐN — Dual-Mode Execution Configuration & Guard
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Supports two permanent, strictly isolated execution modes:
 * - DEMO: Interactive Demo Mode using isolated fixtures and Demo Store (works without backend).
 * - BACKEND: Real Backend Mode using authenticated REST APIs, database persistence, and audit logs.
 *   Never silently falls back to Demo data when an API request fails.
 */

import type { ExecutionMode } from '@5tot/contracts';
export type { ExecutionMode };

const MODE_STORAGE_KEY = '5tot_danang_execution_mode_v1';

let memoryModeOverride: ExecutionMode | null = null;
const modeListeners = new Set<(mode: ExecutionMode) => void>();

function normalizeMode(raw: string | null | undefined): ExecutionMode | null {
  if (!raw) return null;
  const upper = raw.trim().toUpperCase();
  if (upper === 'DEMO' || upper === 'INTERACTIVE_DEMO') return 'DEMO';
  if (upper === 'BACKEND' || upper === 'REAL' || upper === 'PRODUCTION') return 'BACKEND';
  return null;
}

/**
 * Resolves the active execution mode deterministically:
 * 1. Explicit in-memory session override (set via setExecutionMode)
 * 2. Browser URL query parameter (?mode=demo | ?mode=backend | ?mode=real)
 * 3. Browser sessionStorage persistence for the active tab
 * 4. Environment configuration (VITE_EXECUTION_MODE or VITE_DEMO_MODE)
 * 5. Default: 'DEMO' (preserves out-of-the-box interactive prototype & regression tests)
 */
export function getExecutionMode(): ExecutionMode {
  if (memoryModeOverride) {
    return memoryModeOverride;
  }

  if (typeof window !== 'undefined') {
    try {
      const params = new URLSearchParams(window.location.search);
      const fromUrl = normalizeMode(params.get('mode') || params.get('executionMode'));
      if (fromUrl) {
        window.sessionStorage.setItem(MODE_STORAGE_KEY, fromUrl);
        memoryModeOverride = fromUrl;
        return fromUrl;
      }
    } catch {
      // Ignore storage access errors in restricted environments
    }
  }

  if (typeof import.meta !== 'undefined' && import.meta.env) {
    if (import.meta.env.VITE_DEMO_MODE === 'false') {
      return 'BACKEND';
    }
    const envMode = normalizeMode(
      import.meta.env.VITE_EXECUTION_MODE || import.meta.env.VITE_5TOT_EXECUTION_MODE
    );
    if (envMode) return envMode;
  }

  if (typeof window !== 'undefined') {
    try {
      const fromSession = normalizeMode(window.sessionStorage.getItem(MODE_STORAGE_KEY));
      if (fromSession) {
        return fromSession;
      }
    } catch {
      // Ignore storage access errors in restricted environments
    }
  }

  if (typeof process !== 'undefined' && process.env) {
    const nodeEnvMode = normalizeMode(process.env.VITE_EXECUTION_MODE || process.env.EXECUTION_MODE);
    if (nodeEnvMode) return nodeEnvMode;
  }

  return 'DEMO';
}

export function setExecutionMode(mode: ExecutionMode): void {
  memoryModeOverride = mode;
  if (typeof window !== 'undefined') {
    try {
      window.sessionStorage.setItem(MODE_STORAGE_KEY, mode);
    } catch {
      // Ignore storage access errors
    }
  }
  modeListeners.forEach((listener) => listener(mode));
}

export function resetExecutionModeOverride(): void {
  memoryModeOverride = null;
  if (typeof window !== 'undefined') {
    try {
      window.sessionStorage.removeItem(MODE_STORAGE_KEY);
    } catch {
      // Ignore storage access errors
    }
  }
}

export function isDemoMode(): boolean {
  return getExecutionMode() === 'DEMO';
}

export function isBackendMode(): boolean {
  return getExecutionMode() === 'BACKEND';
}

export function subscribeExecutionMode(listener: (mode: ExecutionMode) => void): () => void {
  modeListeners.add(listener);
  return () => {
    modeListeners.delete(listener);
  };
}
