/**
 * 5TOT ĐHĐN — Dual-Mode Service Resolver
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Implements the canonical Mode Resolver architecture:
 *   UI / Pages / Widgets -> Feature Hooks -> Typed Domain Service Contracts -> Mode Resolver
 *     -> Demo Adapter (Demo Store / Demo Storage)
 *     -> Backend API Adapter (Backend APIs / Database + File Storage)
 */

import {
  getExecutionMode,
  setExecutionMode,
  isDemoMode,
  isBackendMode,
  type ExecutionMode,
} from '../../shared/config/executionMode';
import type { DomainServicesBundle } from './contracts';
import { demoServicesAdapter } from './demoAdapter';
import { backendServicesAdapter } from './backendAdapter';

export function resolveDomainServices(modeOverride?: ExecutionMode): DomainServicesBundle {
  const mode = modeOverride || getExecutionMode();
  return mode === 'BACKEND' ? backendServicesAdapter : demoServicesAdapter;
}

export {
  getExecutionMode,
  setExecutionMode,
  isDemoMode,
  isBackendMode,
  demoServicesAdapter,
  backendServicesAdapter,
};
