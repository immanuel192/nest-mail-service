import { Injectable } from '@nestjs/common';
import { ClassProvider } from '@nestjs/common/interfaces';
import { ObjectId } from 'mongodb';
import { IOC_KEY, EMailSendingStatus } from '../commons';
import { IMailService } from './mail.service.interface';
import { IMailCollection } from '../repositories';
import { InsertMailInfoDto, MailDto } from '../dto';
import { MailModel } from '../models/mail.model';

/**
 * Internal email service
 */
@Injectable()
export class MailService implements IMailService {
  static get [IOC_KEY](): ClassProvider {
    return {
      provide: IMailService,
      useClass: MailService
    };
  }

  constructor(
    private readonly repoMail: IMailCollection
  ) { }

  getMailById(id: string): Promise<MailDto> {
    return this.repoMail.findOne({ _id: new ObjectId(id) });
  }

  async insert(mail: InsertMailInfoDto): Promise<MailDto> {
    const newMailObj: MailModel = {
      to: mail.to,
      cc: mail.cc,
      bcc: mail.bcc,
      title: mail.title,
      content: mail.content,
      status: [
        {
          type: EMailSendingStatus.Init
        }
      ],
      sentOn: new Date()
    };
    const insertResult = await this.repoMail.insertOne(newMailObj);
    return this.repoMail.findOne({ _id: insertResult.insertedId });
  }
}
