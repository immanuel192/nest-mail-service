import { Module } from '@nestjs/common';
import { ScheduleModule } from 'nest-schedule';
import { MailRecoverJob } from '../services/jobs/mail.recover.job';
import { MailModule } from './mail.module';

@Module({
  imports: [
    ScheduleModule.register(),
    MailModule
  ],
  providers: [
    MailRecoverJob
  ]
})
export class WorkerModule {
}
