import { providerLogger } from './logger.provider';
import { PROVIDERS } from '../commons';
import { Logger } from '@nestjs/common';

describe('/src/providers/logger.provider.ts', () => {
  it('should register as ROOT_LOGGER factory provider', () => {
    expect(providerLogger).toMatchObject({
      provide: PROVIDERS.ROOT_LOGGER,
      useFactory: expect.anything()
    });
  });

  it('should resolve logger instance', () => {
    expect(providerLogger.useFactory()).toEqual(Logger);
  });
});
