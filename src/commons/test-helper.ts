export { when } from 'jest-when';

const ISO_8601_FULL = /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(\.\d+)?(([+-]\d\d:\d\d)|Z)?$/i;
export const expectDateISO8601Format = expect.stringMatching(ISO_8601_FULL);

/**
 * Generate random string
 */
export const randomString = (): string => Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);

/**
 * Generate random number in range
 * @param min
 * @param max
 */
export const randomNum = (isInt: boolean = true, min: number = 1, max: number = 99999) => {
  const t = Math.random() * (max - min) + min;
  return isInt ? Math.trunc(t) : t;
};

/**
 * Noop Logger, for integration test only
 */
export const NoopLogger = {
  error(_message: any, _trace?: string, _context?: string) { },
  log(_message: any, _context?: string) { },
  warn(_message: any, _context?: string) { },
  debug(_message: any, _context?: string) { },
  verbose(_message: any, _context?: string) { },
};

export const loggerMock = () => {
  return {
    error: jest.fn(),
    log: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
  };
};

export const configMock = () => {
  return {
    get: jest.fn()
  };
};

export const collectionMock = () => {
  return {

  };
};
