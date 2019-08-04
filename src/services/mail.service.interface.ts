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
}
