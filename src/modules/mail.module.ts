import { Module } from '@nestjs/common';
import { IOC_KEY } from '../commons';
import { IMailCollection } from '../repositories';
import { MailService } from '../services/mail.service';
import MailController from '../controllers/mail.controller';

@Module({
  controllers: [
    MailController
  ],
  providers: [
    IMailCollection[IOC_KEY],
    MailService[IOC_KEY]
  ]
})
export class MailModule {
}
