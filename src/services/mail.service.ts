import { Injectable } from '@nestjs/common';
import { ClassProvider } from '@nestjs/common/interfaces';
import { ObjectId } from 'mongodb';
import { IOC_KEY, EMailStatus } from '../commons';
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
          type: EMailStatus.Init
        }
      ],
      sentOn: new Date()
    };
    const insertResult = await this.repoMail.insertOne(newMailObj);
    return this.repoMail.findOne({ _id: insertResult.insertedId });
  }

  fetchPendingMails(
    inp: { fromId?: ObjectId, limit?: number, bufferTime?: number } = {})
    : Promise<MailDto[]> {
    const query: any = {
      'status.0.type': {
        $nin: [EMailStatus.Success, EMailStatus.Fail]
      }
    };

    const options: any = {
      sort: {
        id: 1
      },
      projection: {
        _id: 1
      },
      limit: (inp.limit > 0 ? inp.limit : 0) || 100
    };

    if (inp.fromId) {
      query._id = {
        $gt: inp.fromId
      };
    }

    if (inp.bufferTime > 0) {
      query.sentOn = {
        $lt: new Date(Date.now() - inp.bufferTime * 1000)
      };
    }

    return this.repoMail
      .find(query, options)
      .toArray();
  }
}
