import { Module } from '@nestjs/common';
import { ScheduleModule } from 'nest-schedule';
import { MailRecoverJob } from '../services/jobs/mail.recover.job';
import { MailModule } from './mail.module';
import { MailSendingWorker } from '../services/workers/mail.sending.worker';

@Module({
  imports: [
    ScheduleModule.register(),
    MailModule
  ],
  providers: [
    MailRecoverJob,
    MailSendingWorker
  ]
})
export class WorkerModule { }
