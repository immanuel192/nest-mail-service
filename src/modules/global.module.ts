import { Global, Module, DynamicModule } from '@nestjs/common';
import HealthController from '../controllers/health.controller';
import {
  providerLogger, providerConfig, Database, providerRedis
} from '../providers';
import { IOC_KEY } from '../commons';

@Global()
@Module({})
export class GlobalModule {
  static forRoot(): DynamicModule {
    return {
      module: GlobalModule,
      controllers: [
        HealthController
      ],
      providers: [
        providerConfig,
        providerLogger,
        Database[IOC_KEY],
        providerRedis
      ],
      exports: [
        providerConfig,
        providerLogger,
        Database[IOC_KEY],
        providerRedis
      ]
    };
  }
}
