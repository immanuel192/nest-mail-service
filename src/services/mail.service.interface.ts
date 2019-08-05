import { ObjectId } from 'mongodb';
import { InsertMailInfoDto, MailDto } from '../dto';

export abstract class IMailService {
  /**
   * Request send email
   * @param mail
   */
  abstract insert(mail: InsertMailInfoDto): Promise<MailDto>;

  /**
   * Get mail by its id
   * @param id
   */
  abstract getMailById(id: string): Promise<MailDto>;

  /**
   * Fetch all pending mails
   * @param inp.limit Default is 100
   * @param inp.fromId ObjectId to start query from
   * @param inp.bufferTime How many seconds to be buffer
   */
  abstract fetchPendingMails(
    inp?: { fromId?: ObjectId, limit?: number, bufferTime?: number })
    : Promise<MailDto[]>;
}
