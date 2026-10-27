/**
 * 5TOT ĐHĐN — Ambient Module Declaration for Prisma Client
 * Enables strict TypeScript compilation without @ts-ignore when running in offline mode.
 */

declare module '@prisma/client' {
  export interface PrismaClientOptions {
    datasources?: Record<string, unknown>;
    log?: Array<{ emit: string; level: string }>;
  }

  export interface PrismaQueryEvent {
    query: string;
    params: string;
    duration: number;
    target: string;
    timestamp: Date;
  }

  export type PrismaTransactionScope = Record<string, any>;

  export class PrismaClient {
    constructor(options?: PrismaClientOptions);
    $connect(): Promise<void>;
    $disconnect(): Promise<void>;
    $transaction<T>(
      fn: (tx: PrismaTransactionScope) => Promise<T>,
      options?: Record<string, unknown>
    ): Promise<T>;
    $transaction<T extends unknown[]>(promises: [...T]): Promise<{ [K in keyof T]: Awaited<T[K]> }>;
    $transaction(arg: any, options?: any): Promise<any>;
    $queryRaw(query: unknown, ...values: unknown[]): Promise<unknown>;
    $on(event: 'query', callback: (e: PrismaQueryEvent) => void): void;
    $on(event: string, callback: (e: unknown) => void): void;
    [delegate: string]: any;
  }
}
