import { IMailTransferAgent } from './mta.interface';
import * as superagent from 'superagent';
import { get, merge } from 'lodash';
import { EMailProcessingStatus, ILoggerInstance, IConfiguration } from '../../commons';
import { AttemptMailSendingDto } from '../../dto';
import circuitBreaker, { CircuitBreaker } from 'opossum';

/**
 * Base Mail Transfer Agent
 */
export abstract class MTABase extends IMailTransferAgent {
  isAvailable: boolean = true;

  protected timeout: number = 5000;
  /**
  * Default mail sending config
  *
  * @abstract
  * @type {*}
  * @memberof IMailTransferAgent
  */
  protected readonly defaultConfig: any = {};

  /**
   * Config name, in config file
   *
   * @abstract
   * @type {string}
   * @memberof IMailTransferAgent
   */
  protected abstract readonly configName: string;

  /**
   * Request method
   *
   * @protected
   * @abstract
   * @type {('GET' | 'POST')}
   * @memberof MTABase
   */
  protected abstract readonly method: string;

  private circuit: CircuitBreaker;
  protected config: any;

  constructor(
    protected readonly logger: ILoggerInstance,
    protected readonly configService: IConfiguration
  ) {
    super();
  }

  async init() {
    const defaultOptions = {
      timeout: 5000, // If our function takes longer than 3 seconds, trigger a failure
      errorThresholdPercentage: 50, // When 50% of requests fail, trip the circuit
      resetTimeout: 30000 // After 30 seconds, try again.
    };

    this.config = get(this.configService.get('mails'), this.configName);
    const options = merge({}, get(this.config, 'circuit', {}), defaultOptions);

    this.circuit = circuitBreaker(this.attemptSendMail.bind(this), options);
    // when open
    this.circuit.on('open', () => {
      this.logger.debug(`Walao eh! ${this.name} circuit opened`);
      this.isAvailable = false;
    });
    // when close
    this.circuit.on('close', () => {
      this.logger.debug(`Hallo! ${this.name} circuit closed`);
      this.isAvailable = true;
    });
  }

  getMaxRetries() {
    return this.config.maxRetries || 3;
  }

  async send(mail: AttemptMailSendingDto) {
    return this.circuit.fire(mail)
      .catch(() => EMailProcessingStatus.Retry); // Retry here means failed)
  }

  /**
   * Prepare authentication
   */
  protected abstract prepareAuth(request: superagent.SuperAgentRequest): Promise<void>;

  /**
   * Prepare url to making request
   */
  protected abstract prepareUrl(): string;

  /**
   * Prepare request content
   */
  protected abstract prepareRequestContent(
    request: superagent.SuperAgentRequest,
    mail: AttemptMailSendingDto
  ): Promise<void>;

  /**
   * Last step before sending out request, you can set timeout or whatever things you like
   * @param request
   */
  protected abstract prepareRequestConfig(request: superagent.SuperAgentRequest): Promise<void>;

  private async attemptSendMail(mail: AttemptMailSendingDto) {
    const request = superagent(this.method, this.prepareUrl());
    await Promise.all([
      this.prepareAuth(request),
      this.prepareRequestContent(request, mail),
      this.prepareRequestConfig(request)
    ]);

    return request
      .then((response) => {
        /**
         * @todo To handle possible cases such as 429, 413, 503,...
         */
        if (response.ok) {
          return EMailProcessingStatus.Success;
        }
        return EMailProcessingStatus.Retry;
      })
      .catch((e) => {
        this.logger.error(`${this.name} - Error while sending email - ${e.message} - ${JSON.stringify(get(e, 'response.body', {}))}`, e.stack);
        return Promise.reject(e);
      });
  }
}
