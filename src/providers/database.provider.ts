import { FactoryProvider } from '@nestjs/common/interfaces';
import { IConfiguration, ILoggerInstance } from '../commons/interfaces';
import { PROVIDERS } from '../commons';

export const providerDatabase: FactoryProvider = {
  provide: PROVIDERS.DB,
  inject: [IConfiguration, PROVIDERS.ROOT_LOGGER],
  useFactory: async (
    _configProvider: IConfiguration,
    _logger: ILoggerInstance
  ) => {
    return null;
  }
};
