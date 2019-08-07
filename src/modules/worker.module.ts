import { Module } from '@nestjs/common';
import { ScheduleModule } from 'nest-schedule';
import { IOC_KEY } from '../commons';
import { MailRecoverJob } from '../services/jobs/mail.recover.job';
import { MailModule } from './mail.module';
import { MailSendingWorker } from '../services/workers/mail.sending.worker';
import { MTAStategyService } from '../services/workers/mta.strategy.service';

@Module({
  imports: [
    ScheduleModule.register(),
    MailModule
  ],
  providers: [
    MailRecoverJob,
    MailSendingWorker,
    MTAStategyService[IOC_KEY]
  ]
})
export class WorkerModule { }
