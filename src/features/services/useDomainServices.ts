/**
 * 5TOT ĐHĐN — Feature Hook for Dual-Mode Application Services
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Canonical Feature Layer Hook:
 * UI / Pages / Widgets
 *          |
 *          v
 * Feature Hooks / Application Services (useDomainServices)
 *          |
 *          v
 * Typed Domain Service Contracts
 *          |
 *          v
 *      Mode Resolver
 *       /        \
 *      v          v
 * Demo Adapter  Backend API Adapter
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  getExecutionMode,
  setExecutionMode,
  subscribeExecutionMode,
  isDemoMode,
  isBackendMode,
  type ExecutionMode,
} from '../../shared/config/executionMode';
import {
  resolveDomainServices,
  type DomainServicesBundle,
} from '../../entities/services';

export interface UseDomainServicesResult {
  mode: ExecutionMode;
  isDemo: boolean;
  isBackend: boolean;
  services: DomainServicesBundle;
  switchMode: (nextMode: ExecutionMode) => void;
}

export function useDomainServices(): UseDomainServicesResult {
  const [mode, setModeState] = useState<ExecutionMode>(() => getExecutionMode());

  useEffect(() => {
    return subscribeExecutionMode((nextMode) => {
      setModeState(nextMode);
    });
  }, []);

  const services = useMemo<DomainServicesBundle>(() => {
    return resolveDomainServices(mode);
  }, [mode]);

  const switchMode = useCallback((nextMode: ExecutionMode) => {
    setExecutionMode(nextMode);
  }, []);

  return {
    mode,
    isDemo: isDemoMode(),
    isBackend: isBackendMode(),
    services,
    switchMode,
  };
}
