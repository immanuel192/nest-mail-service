import { MailStatusDto } from '../../dto';
import { IMailTransferAgent } from '../mta';

export abstract class IMTAStategyService {
  /**
   * Smart fetch the correspond MTA accoridng to the MTA config
   * @param lastStatus Last email status
   */
  abstract getMTA(lastStatus: MailStatusDto): Promise<IMailTransferAgent>;
}
