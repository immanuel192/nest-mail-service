import { Module, NestModule, MiddlewareConsumer, OnModuleInit } from '@nestjs/common';
import { GlobalModule } from './global.module';
import { MwGracefulShutdown, MwRequestLogger } from '../middlewares';
import { IDatabaseInstance } from '../commons';
import { createMongoDbIndexes } from '../commons/mongoIndexes';
import { MailModule } from './mail.module';
import { WorkerModule } from './worker.module';

@Module({
  imports: [
    GlobalModule.forRoot(),
    MailModule,
    WorkerModule
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
