export * from './ITMap';

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

export interface IDatabaseInstance { }
