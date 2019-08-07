import { Injectable, Inject } from '@nestjs/common';
import { QueueConsumerBase } from '../queue/queue.consumer.base';
import { QueueMessageDto, AttemptMailSendingDto } from '../../dto';
import { EMailProcessingStatus, QUEUES, EMailStatus } from '../../commons';
import { IQueueConsumer } from '../queue/queue.base.interface';
import { IMTAStategyService } from './mta.strategy.service.interface';
import { IMailService } from '../mail.service.interface';

@Injectable()
export class MailSendingWorker extends QueueConsumerBase {
  constructor(
    @Inject(QUEUES.MAIN)
    mainQueueConsumer: IQueueConsumer,
    private readonly mailService: IMailService,
    private readonly mtaStategy: IMTAStategyService
  ) {
    super(mainQueueConsumer, QUEUES.MAIN);
  }

  async onMesage(message: QueueMessageDto) {
    const mail = await this.mailService.getMailById(message.message);
    if (!mail) {
      return EMailProcessingStatus.Outdated;
    }

    let status = mail.status && mail.status.length > 0 && mail.status[0];
    if (!status || [EMailStatus.Fail, EMailStatus.Success].includes(status.type)) {
      return EMailProcessingStatus.Outdated;
    }

    // pick one mail transfer agent
    const mtaInstance = await this.mtaStategy.getMTA(status);
    let needNewStatus = !mtaInstance || status.type === EMailStatus.Init || mtaInstance.name !== status.mta;
    let finalProcessingStatus = EMailProcessingStatus.Success;
    if (!mtaInstance) {
      // totally dont have any mta instances? die lah
      needNewStatus = true;
      status = {
        onDate: new Date(),
        type: EMailStatus.Fail
      };
      finalProcessingStatus = EMailProcessingStatus.Outdated;
    }
    else {
      if (needNewStatus) {
        status = {
          retries: 0,
          mta: mtaInstance.name,
          type: EMailStatus.Attempt
        };
      }
      // attempt to send
      const mailSendingInfo: AttemptMailSendingDto = {
        to: mail.to,
        cc: mail.cc,
        bcc: mail.bcc,
        title: mail.title,
        content: mail.content
      };
      const sendStatus = await mtaInstance.send(mailSendingInfo);

      switch (sendStatus) {
        case EMailProcessingStatus.Success:
          needNewStatus = true;
          status = {
            onDate: new Date(),
            type: EMailStatus.Success
          };
          break;
        default:
          status.retries++;
          finalProcessingStatus = EMailProcessingStatus.Retry;
          break;
      }
    }

    if (needNewStatus) {
      await this.mailService.addMailStatus(mail._id, status);
    }
    else {
      await this.mailService.updateMailStatus(mail._id, status);
    }

    return finalProcessingStatus;
  }
}
