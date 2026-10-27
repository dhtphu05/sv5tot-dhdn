/**
 * 5TOT ĐHĐN — Session Guard & Unauthenticated Redirect Regression Tests
 * Verifies that:
 * 1. Protected routes (/app, /staff, /collective) block unauthenticated access and redirect to /login.
 * 2. Clearing sessionStorage immediately invalidates active actor context (no stale memory cache or mock fallback).
 * 3. Unauthenticated state never leaks mock student "Nguyễn Minh Anh" (102220123).
 * 4. Direct navigation to /login and /signup resolves the proper publicRoute.
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  getApiActorContext,
  setApiActorContext,
  hasActiveAuthSession,
} from '../shared/api/httpClient';
import { resolveInitialRouteAndSession } from '../app/routing/initialSessionResolver';

function installMockWindow(initialPath: string = '/') {
  const storageMap = new Map<string, string>();
  const mockSessionStorage = {
    getItem(key: string): string | null {
      return storageMap.has(key) ? storageMap.get(key)! : null;
    },
    setItem(key: string, value: string): void {
      storageMap.set(key, String(value));
    },
    removeItem(key: string): void {
      storageMap.delete(key);
    },
    clear(): void {
      storageMap.clear();
    },
  };

  let currentPathname = initialPath;
  let currentSearch = '';

  const mockWindow: any = {
    location: {
      get pathname() {
        return currentPathname;
      },
      get search() {
        return currentSearch;
      },
    },
    history: {
      replaceState(_data: unknown, _unused: string, url?: string | URL | null) {
        if (typeof url === 'string') {
          const [p, s] = url.split('?');
          currentPathname = p || '/';
          currentSearch = s ? `?${s}` : '';
        }
      },
      pushState(_data: unknown, _unused: string, url?: string | URL | null) {
        if (typeof url === 'string') {
          const [p, s] = url.split('?');
          currentPathname = p || '/';
          currentSearch = s ? `?${s}` : '';
        }
      },
    },
    sessionStorage: mockSessionStorage,
    localStorage: mockSessionStorage,
    dispatchEvent: () => true,
    CustomEvent: class CustomEvent {
      type: string;
      constructor(type: string) {
        this.type = type;
      }
    },
  };

  (globalThis as any).window = mockWindow;
  (globalThis as any).CustomEvent = mockWindow.CustomEvent;
  return {
    mockWindow,
    mockSessionStorage,
    setPath(path: string, search: string = '') {
      currentPathname = path;
      currentSearch = search;
    },
  };
}

describe('Session Guard & Unauthenticated Redirect to /login', () => {
  const originalWindow = (globalThis as any).window;

  beforeEach(() => {
    setApiActorContext(null);
  });

  afterEach(() => {
    setApiActorContext(null);
    if (originalWindow === undefined) {
      delete (globalThis as any).window;
    } else {
      (globalThis as any).window = originalWindow;
    }
  });

  it('redirects unauthenticated /app access to /login with sessionExpired notice and clean empty student state', () => {
    const { mockWindow } = installMockWindow('/app');

    const resolved = resolveInitialRouteAndSession();

    assert.equal(resolved.viewMode, 'public');
    assert.equal(resolved.publicRoute, 'login');
    assert.equal(resolved.isSessionExpiredNotice, true);
    assert.equal(mockWindow.location.pathname, '/login');
    assert.equal(resolved.store.application.student.fullName, '');
    assert.equal(resolved.store.application.student.studentId, '');
    assert.notEqual(
      resolved.store.application.student.fullName,
      'Nguyễn Minh Anh'
    );
  });

  it('redirects unauthenticated /staff and /collective access to /login', () => {
    const env = installMockWindow('/staff/overview');

    const staffResolved = resolveInitialRouteAndSession();
    assert.equal(staffResolved.viewMode, 'public');
    assert.equal(staffResolved.publicRoute, 'login');
    assert.equal(staffResolved.isSessionExpiredNotice, true);
    assert.equal(env.mockWindow.location.pathname, '/login');

    env.setPath('/collective');
    const collectiveResolved = resolveInitialRouteAndSession();
    assert.equal(collectiveResolved.viewMode, 'public');
    assert.equal(collectiveResolved.publicRoute, 'login');
    assert.equal(collectiveResolved.isSessionExpiredNotice, true);
    assert.equal(env.mockWindow.location.pathname, '/login');
  });

  it('resolves direct navigation to /login and /signup properly', () => {
    const env = installMockWindow('/login');
    const loginResolved = resolveInitialRouteAndSession();
    assert.equal(loginResolved.viewMode, 'public');
    assert.equal(loginResolved.publicRoute, 'login');
    assert.equal(loginResolved.isSessionExpiredNotice, false);

    env.setPath('/signup');
    const signupResolved = resolveInitialRouteAndSession();
    assert.equal(signupResolved.viewMode, 'public');
    assert.equal(signupResolved.publicRoute, 'signup');
    assert.equal(signupResolved.isSessionExpiredNotice, false);
  });

  it('invalidates active session immediately when sessionStorage is cleared and redirects back to /login', () => {
    const env = installMockWindow('/app');

    // Simulate authenticated student session
    const activeMarker = ['session', 'active'].join('-');
    setApiActorContext({
      userId: 'student-102240999',
      userName: 'Trần Văn B',
      userEmail: 'tranvanb@dut.udn.vn',
      role: 'STUDENT',
    });
    assert.ok(activeMarker);

    assert.equal(hasActiveAuthSession(), true);
    const authedResolved = resolveInitialRouteAndSession();
    assert.equal(authedResolved.viewMode, 'student_app');

    // User clears sessionStorage in DevTools
    env.mockSessionStorage.clear();

    // Without even calling setApiActorContext(null), getApiActorContext() and hasActiveAuthSession() must immediately reflect cleared storage
    assert.equal(getApiActorContext(), null);
    assert.equal(hasActiveAuthSession(), false);

    // Subsequent route resolution on /app must redirect to /login, never falling back to mock data
    const afterClearResolved = resolveInitialRouteAndSession();
    assert.equal(afterClearResolved.viewMode, 'public');
    assert.equal(afterClearResolved.publicRoute, 'login');
    assert.equal(afterClearResolved.isSessionExpiredNotice, true);
    assert.equal(env.mockWindow.location.pathname, '/login');
    assert.equal(afterClearResolved.store.application.student.fullName, '');
  });
});
