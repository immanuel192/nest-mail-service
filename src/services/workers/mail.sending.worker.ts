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

  onMesage(_message: QueueMessageDto): Promise<EMailInQueueProcessingStatus> {
    return Bluebird.resolve()
      .delay(3000)
      .then(() => EMailInQueueProcessingStatus.Success) as any;
  }
}
