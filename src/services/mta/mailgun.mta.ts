import { SuperAgentRequest } from 'superagent';
import { MTABase } from './mta.base';
import { AttemptMailSendingDto } from '../../dto';
import { ILoggerInstance, IConfiguration } from '../../commons';

export class MailGunMTA extends MTABase {
  name = 'mailgun';

  protected configName: string = 'mailgun';

  protected defaultConfig: {
    domain: string;
    apiKey: string;
    from: string;
  };

  protected method = 'POST';

  constructor(
    logger: ILoggerInstance,
    configService: IConfiguration
  ) {
    super(logger, configService);
  }

  async init() {
    const config = this.configService.get('mails');
    this.defaultConfig = config[this.configName];
    if (!this.defaultConfig ||
      !(this.defaultConfig.apiKey && this.defaultConfig.domain && this.defaultConfig.from)
    ) {
      throw new Error(`Invalid configuration of mailgun. Actual config: ${JSON.stringify(this.defaultConfig)}`);
    }

    super.init();
  }

  protected async prepareAuth(request: SuperAgentRequest) {
    request.auth('api', this.defaultConfig.apiKey);
  }

  protected prepareUrl() {
    return `https://api.mailgun.net/v3/${this.defaultConfig.domain}/messages`;
  }

  protected async prepareRequestConfig(request: SuperAgentRequest) {
    request.timeout(this.timeout);
    request.accept('application/json');
    request.set('Content-Type', 'application/x-www-form-urlencoded');
  }

  protected async prepareRequestContent(request: SuperAgentRequest, mail: AttemptMailSendingDto) {
    /**
     *
     -F from='Excited User <mailgun@YOUR_DOMAIN_NAME>' \
    -F to=YOU@YOUR_DOMAIN_NAME \
    -F to=bar@example.com \
    -F subject='Hello' \
    -F text='Testing some Mailgun awesomeness!'
     */
    request.field({
      from: this.defaultConfig.from,
      to: mail.to,
      cc: mail.cc || [],
      bcc: mail.bcc || [],
      subject: mail.title,
      text: mail.content
    });
  }
}
