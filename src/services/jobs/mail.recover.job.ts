import { Injectable, Inject } from '@nestjs/common';
import { get } from 'lodash';
import * as Bluebird from 'bluebird';
import { JobAbstract } from './jobabstract';
import { JOB_IDS, QUEUES } from '../../commons';
import { IMailService } from '../mail.service.interface';
import { MailDto } from '../../dto';
import { IQueueProducer } from '../queue/queue.base.interface';

/**
 * Enqueue emails to queue in case anything failed
 */
@Injectable()
export class MailRecoverJob extends JobAbstract {
  protected jobName = JOB_IDS.MAIL_RECOVERY;
  protected bufferTime: number = 1800;

  constructor(
    private readonly mailService: IMailService,
    @Inject(QUEUES.MAIN)
    private readonly mainQueue: IQueueProducer
  ) {
    super();
  }

  async onModuleInit() {
    await super.onModuleInit();
    this.bufferTime = get(this.config as any, 'bufferTime', this.bufferTime);
  }

  async execute() {
    this.logger.debug(`${this.jobName}: Starting job`);
    let pendingMails: MailDto[] = [];
    let processedCount: number = 0;
    let firstId: string = null;
    const fetchQuery = {
      fromId: null as any,
      limit: 100,
      bufferTime: this.bufferTime
    };
    do {
      pendingMails = await this.mailService.fetchPendingMails({ ...fetchQuery });
      if (pendingMails.length === 0) {
        break;
      }
      processedCount += pendingMails.length;
      firstId = firstId || pendingMails[0]._id.toHexString();

      fetchQuery.fromId = pendingMails[pendingMails.length - 1]._id;
      this.logger.debug(`Fetched ${pendingMails.length} pending mails`);

      // push to queue with limited concurrency
      await Bluebird.map(pendingMails, mail => this.mainQueue.send(mail._id.toHexString()), { concurrency: 5 });
    } while (pendingMails.length > 0);

    this.logger.debug(`${this.jobName}: Finished. Processed ${processedCount} pending mails, started from ${firstId}`);
  }
}
