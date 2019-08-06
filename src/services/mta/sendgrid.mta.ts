import { SuperAgentRequest } from 'superagent';
import { MTABase } from './mta.base';
import { AttemptMailSendingDto } from '../../dto';
import { ILoggerInstance, IConfiguration } from '../../commons';

export class SendGridMTA extends MTABase {
  name = 'sendgrid';

  protected configName: string = 'sendgrid';

  protected defaultConfig: {
    authKey: string;
    from: string
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
    if (
      !this.defaultConfig || !(this.defaultConfig.authKey && this.defaultConfig.from)
    ) {
      throw new Error(`Invalid configuration of ${this.name}. Actual config: ${JSON.stringify(this.defaultConfig)}`);
    }

    super.init();
  }

  protected async prepareAuth(request: SuperAgentRequest) {
    request.auth(this.defaultConfig.authKey, { type: 'bearer' });
  }

  protected prepareUrl() {
    return 'https://api.sendgrid.com/v3/mail/send';
  }

  protected async prepareRequestConfig(request: SuperAgentRequest) {
    request.timeout(this.timeout);
    request.set('Content-Type', 'application/json');
    request.accept('application/json');
  }

  protected async prepareRequestContent(request: SuperAgentRequest, mail: AttemptMailSendingDto) {
    const data: any = {
      personalizations: [
        {
          to: [
            ...mail.to.map(email => ({ email }))
          ]
        }
      ],
      from: {
        email: this.defaultConfig.from
      },
      subject: mail.title,
      content: [
        {
          type: 'text/plain',
          value: mail.content
        }
      ]
    };
    if (mail.cc && mail.cc.length > 0) {
      data.personalizations[0].cc = [
        ...mail.cc.map(email => ({ email }))
      ];
    }
    if (mail.bcc && mail.bcc.length > 0) {
      data.personalizations[0].bcc = [
        ...mail.bcc.map(email => ({ email }))
      ];
    }
    request.send(data);
  }
}
