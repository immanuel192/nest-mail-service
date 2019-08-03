import { Module, NestModule, MiddlewareConsumer, OnModuleInit } from '@nestjs/common';
import { GlobalModule } from './global.module';
import { MwGracefulShutdown, MwRequestLogger } from '../middlewares';
import { providerErrorFilter, providerGlobalValidation } from '../providers';
import { IDatabaseInstance } from '../commons';
import { createMongoDbIndexes } from '../commons/mongoIndexes';

@Module({
  imports: [
    GlobalModule.forRoot()
  ],
  controllers: [
  ],
  providers: [
    providerErrorFilter,
    providerGlobalValidation
  ]
})
export class AppModule implements NestModule, OnModuleInit {
  constructor(
    private readonly database: IDatabaseInstance
  ) { }

  configure(consumer: MiddlewareConsumer) {
    consumer.apply(MwGracefulShutdown).forRoutes('/');
    consumer.apply(MwRequestLogger).forRoutes('/');
  }

  async onModuleInit() {
    await createMongoDbIndexes(this.database);
  }
}
