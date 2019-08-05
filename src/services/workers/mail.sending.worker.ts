import { Injectable, Inject } from '@nestjs/common';
import * as Bluebird from 'bluebird';
import { QueueConsumerBase } from '../queue/queue.consumer.base';
import { QueueMessageDto } from '../../dto';
import { EMailInQueueProcessingStatus, QUEUES } from '../../commons';
import { IQueueConsumer } from '../queue/queue.base.interface';

@Injectable()
export class MailSendingWorker extends QueueConsumerBase {
  constructor(
    @Inject(QUEUES.MAIN)
    mainQueueConsumer: IQueueConsumer
  ) {
    super(mainQueueConsumer, QUEUES.MAIN);
  }

  onMesage(message: QueueMessageDto): Promise<EMailInQueueProcessingStatus> {
    console.log(message);
    return Bluebird.resolve()
      .delay(10000)
      .then(() => EMailInQueueProcessingStatus.Success) as any;
  }

}
