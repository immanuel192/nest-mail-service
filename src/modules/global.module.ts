import { Global, Module, DynamicModule } from '@nestjs/common';
import HealthController from '../controllers/health.controller';
import {
  providerLogger, providerConfig, Database, providerRedis, providerGlobalValidation, providerErrorFilter
} from '../providers';
import { IOC_KEY } from '../commons';
import { MainQueue } from '../services/queue/main.queue';
import { DeadQueue } from '../services/queue/dead.queue';

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
        providerGlobalValidation,
        providerErrorFilter,
        providerConfig,
        providerLogger,
        Database[IOC_KEY],
        providerRedis,
        MainQueue[IOC_KEY],
        DeadQueue[IOC_KEY]
      ],
      exports: [
        providerConfig,
        providerLogger,
        Database[IOC_KEY],
        providerRedis,
        MainQueue[IOC_KEY],
        DeadQueue[IOC_KEY]
      ]
    };
  }
}
