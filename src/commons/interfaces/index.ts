export * from './ITMap';
export * from './queue.base.interface';
import { Collection, Db } from 'mongodb';

/**
 * Configuration interface
 *
 * @interface IConfiguration
 */
export abstract class IConfiguration {
  abstract get<T = any>(name?: string): T | null;
}

export type ILoggerInstance = {
  error(message: any, trace?: string, context?: string): void;
  log(message: any, context?: string): void;
  warn(message: any, context?: string): void;
  debug(message: any, context?: string): void;
  verbose(message: any, context?: string): void;
};

export interface DbConnectionOptions {
  host: string;
  user: string;
  password?: string;
  database: string;
  replicaSet?: string;
  authSource?: string;
}

export abstract class IDatabaseInstance {
  /**
   * Open connection
   * @param options
   */
  abstract open(options?: any): Promise<Db>;
  /**
   * Get collection instance
   * @param name
   */
  abstract collection<T = any>(name: string): Promise<Collection<T>>;
  /**
   * Close all connections
   */
  abstract close(): void;
}
