import { MailGunMTA } from './mailgun.mta';
import { loggerMock, configMock, when } from '../../commons/test-helper';

class FakeMailgunMTA extends MailGunMTA {
  getByName(name: string) {
    return (this as any)[name];
  }

  setByName(name: string, value: any) {
    (this as any)[name] = value;
  }
}

const logger = loggerMock();
const config = configMock();

describe('/src/services/mta/mailgun.mta.ts', () => {
  let instance: FakeMailgunMTA;

  beforeAll(() => {
    instance = new FakeMailgunMTA(logger, config);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('should register correct name', () => {
    expect(instance.name).toEqual('mailgun');
  });

  it('should register correct config name', () => {
    expect(instance.getByName('configName')).toEqual('mailgun');
  });

  it('should register correct method', () => {
    expect(instance.getByName('method')).toEqual('POST');
  });

  describe('init', () => {
    it('should throw error if no config', () => {
      when(config.get).calledWith('mails').mockReturnValue({});
      return instance.init()
        .catch((e) => {
          expect(e).toMatchObject({
            message: `Invalid configuration of mailgun. Actual config: ${JSON.stringify(instance.getByName('defaultConfig'))}`
          });
        });
    });

    it('should throw error if dont have apiKey', () => {
      when(config.get).calledWith('mails').mockReturnValue({
        mailgun: {
          domain: 'domain',
          from: 'from',
        }
      });
      return instance.init()
        .catch((e) => {
          expect(e).toMatchObject({
            message: `Invalid configuration of mailgun. Actual config: ${JSON.stringify(instance.getByName('defaultConfig'))}`
          });
        });
    });

    it('should throw error if dont have domain', () => {
      when(config.get).calledWith('mails').mockReturnValue({
        mailgun: {
          apiKey: 'domain',
          from: 'from',
        }
      });
      return instance.init()
        .catch((e) => {
          expect(e).toMatchObject({
            message: `Invalid configuration of mailgun. Actual config: ${JSON.stringify(instance.getByName('defaultConfig'))}`
          });
        });
    });

    it('should throw error if dont have from', () => {
      when(config.get).calledWith('mails').mockReturnValue({
        mailgun: {
          domain: 'domain',
          apiKey: 'from',
        }
      });
      return instance.init()
        .catch((e) => {
          expect(e).toMatchObject({
            message: `Invalid configuration of mailgun. Actual config: ${JSON.stringify(instance.getByName('defaultConfig'))}`
          });
        });
    });

    it('should call super to init', () => {
      const expectConfig = {
        domain: 'domain',
        apiKey: 'from',
        from: 'from'
      };
      when(config.get).calledWith('mails').mockReturnValue({
        mailgun: expectConfig
      });
      return instance.init()
        .then(() => {
          expect(instance.getByName('config')).toMatchObject(expectConfig);
        });
    });
  });

  describe('prepareAuth', () => {
    it('should set correct auth', async () => {
      const myKey = 'mykey';
      instance.setByName('defaultConfig', { apiKey: myKey });
      const mock = jest.fn();
      await (instance.getByName('prepareAuth').bind(instance)({ auth: mock }));

      expect(mock).toHaveBeenCalledTimes(1);
      expect(mock).lastCalledWith('api', myKey);
    });
  });

  describe('prepareUrl', () => {
    it('should return correct url', () => {
      const myDomain = 'mydomain';
      instance.setByName('defaultConfig', { domain: myDomain });
      const url = instance.getByName('prepareUrl').bind(instance)();

      expect(url).toEqual(`https://api.mailgun.net/v3/${myDomain}/messages`);
    });
  });

  describe('prepareRequestConfig', () => {
    it('should prepare correct config', async () => {
      const mock = jest.fn();
      instance.setByName('timeout', -200000);
      await (instance.getByName('prepareRequestConfig').bind(instance)({ timeout: mock, set: mock }));

      expect(mock.mock.calls[0]).toEqual([-200000]);
      expect(mock).toBeCalledWith('Content-Type', 'application/x-www-form-urlencoded');
    });
  });

  describe('prepareRequestContent', () => {
    it('should prepare request when having only to', async () => {
      instance.setByName('defaultConfig', { from: 'from@me.com' });
      const mock = jest.fn();

      await (instance.getByName('prepareRequestContent').bind(instance)({ field: mock },
        {
          to: 'trung@test.com',
          title: 'test',
          content: 'test 2 test'
        }
      ));

      expect(mock).lastCalledWith({
        from: 'from@me.com',
        to: 'trung@test.com',
        subject: 'test',
        text: 'test 2 test'
      });
    });

    it('should prepare request when having cc', async () => {
      instance.setByName('defaultConfig', { from: 'from@me.com' });
      const mock = jest.fn();

      await (instance.getByName('prepareRequestContent').bind(instance)({ field: mock },
        {
          to: 'trung@test.com',
          cc: ['test@cc.com'],
          title: 'test',
          content: 'test 2 test'
        }
      ));

      expect(mock).lastCalledWith({
        from: 'from@me.com',
        to: 'trung@test.com',
        cc: ['test@cc.com'],
        subject: 'test',
        text: 'test 2 test'
      });
    });

    it('should prepare request when having bcc', async () => {
      instance.setByName('defaultConfig', { from: 'from@me.com' });
      const mock = jest.fn();

      await (instance.getByName('prepareRequestContent').bind(instance)({ field: mock },
        {
          to: 'trung@test.com',
          cc: ['test@cc.com'],
          bcc: ['test@bcc.com'],
          title: 'test',
          content: 'test 2 test'
        }
      ));

      expect(mock).lastCalledWith({
        from: 'from@me.com',
        to: 'trung@test.com',
        cc: ['test@cc.com'],
        bcc: ['test@bcc.com'],
        subject: 'test',
        text: 'test 2 test'
      });
    });
  });
});
