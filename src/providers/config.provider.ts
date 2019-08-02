import { FactoryProvider } from '@nestjs/common/interfaces';
import { IConfiguration } from '../commons/interfaces';

function getConfigurationInstance(): IConfiguration {
  process.env['NODE_CONFIG_DIR'] = __dirname + '/../conf';
  const config = require('config');
  return config;
}

export const providerConfig: FactoryProvider = {
  provide: IConfiguration,
  useFactory: () => getConfigurationInstance()
};
