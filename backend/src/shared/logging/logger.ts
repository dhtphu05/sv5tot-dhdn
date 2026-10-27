/**
 * 5TOT ĐHĐN — Structured JSON Logger with Secret & PII Redaction
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_SEVERITY: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const SENSITIVE_KEYS = new Set([
  'password',
  'token',
  'secret',
  'authorization',
  'cookie',
  'refreshtoken',
  'accesstoken',
  'database_url',
  'direct_url',
]);

function redact(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(redact);
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      result[key] = '[REDACTED]';
    } else if (typeof value === 'object') {
      result[key] = redact(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  correlationId?: string;
  context?: Record<string, unknown>;
  durationMs?: number;
}

export class Logger {
  private minLevel: LogLevel;

  constructor(minLevel: LogLevel = 'info') {
    this.minLevel = minLevel;
  }

  private shouldLog(level: LogLevel): boolean {
    return LEVEL_SEVERITY[level] >= LEVEL_SEVERITY[this.minLevel];
  }

  private format(level: LogLevel, message: string, context?: Record<string, unknown>, correlationId?: string): string {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      correlationId,
      context: context ? (redact(context) as Record<string, unknown>) : undefined,
    };
    return JSON.stringify(entry);
  }

  debug(message: string, context?: Record<string, unknown>, correlationId?: string): void {
    if (this.shouldLog('debug')) console.debug(this.format('debug', message, context, correlationId));
  }

  info(message: string, context?: Record<string, unknown>, correlationId?: string): void {
    if (this.shouldLog('info')) console.info(this.format('info', message, context, correlationId));
  }

  warn(message: string, context?: Record<string, unknown>, correlationId?: string): void {
    if (this.shouldLog('warn')) console.warn(this.format('warn', message, context, correlationId));
  }

  error(message: string, context?: Record<string, unknown>, correlationId?: string): void {
    if (this.shouldLog('error')) console.error(this.format('error', message, context, correlationId));
  }
}

export const logger = new Logger(
  (process.env.LOG_LEVEL as LogLevel) || 'info'
);
