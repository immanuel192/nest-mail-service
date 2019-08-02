import { FactoryProvider } from '@nestjs/common/interfaces';
import { Logger } from '@nestjs/common';
import { PROVIDERS } from '../commons/const';

export const providerLogger: FactoryProvider = {
  provide: PROVIDERS.ROOT_LOGGER,
  /**
   * @todo Implement custom logger here
   */
  useFactory: () => Logger,
};
