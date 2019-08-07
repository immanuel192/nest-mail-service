import { AttemptMailSendingDto } from '../../dto';
import { EMailProcessingStatus } from '../../commons';

/**
 * Mail Transfer Agent Interface
 */
export abstract class IMailTransferAgent {
  /**
   * MTA Name
   *
   * @abstract
   * @type {string}
   * @memberof IMailTransferAgent
   */
  abstract name: string;

  /**
   * Return true if this MTA is available to be consumed. The value of this property will be controlled by the circuit breaker
   *
   * @type {boolean}
   * @memberof IMailTransferAgent
   */
  abstract isAvailable: boolean;

  /**
   * Attempt to send email
   * @param mail
   */
  abstract send(mail: AttemptMailSendingDto): Promise<EMailProcessingStatus>;

  /**
   * Try to do anything to init the MTA. Will reject in case of issue
   */
  abstract init(): Promise<void>;

  /**
   * Get how many retries in maximum this MTA allows
   */
  abstract getMaxRetries(): number;
}
