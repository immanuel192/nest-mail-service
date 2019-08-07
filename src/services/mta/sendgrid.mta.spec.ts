import { SendGridMTA } from './sendgrid.mta';
import { loggerMock, configMock, when } from '../../commons/test-helper';

class FakeSendgridMTA extends SendGridMTA {
  getByName(name: string) {
    return (this as any)[name];
  }

  setByName(name: string, value: any) {
    (this as any)[name] = value;
  }
}

const logger = loggerMock();
const config = configMock();

describe('/src/services/mta/sendgrid.mta.ts', () => {
  let instance: FakeSendgridMTA;

  beforeAll(() => {
    instance = new FakeSendgridMTA(logger, config);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('should register correct name', () => {
    expect(instance.name).toEqual('sendgrid');
  });

  it('should register correct config name', () => {
    expect(instance.getByName('configName')).toEqual('sendgrid');
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
            message: `Invalid configuration of sendgrid. Actual config: ${JSON.stringify(instance.getByName('defaultConfig'))}`
          });
        });
    });

    it('should throw error if dont have authKey', () => {
      when(config.get).calledWith('mails').mockReturnValue({
        sendgrid: {
          from: 'from',
        }
      });
      return instance.init()
        .catch((e) => {
          expect(e).toMatchObject({
            message: `Invalid configuration of sendgrid. Actual config: ${JSON.stringify(instance.getByName('defaultConfig'))}`
          });
        });
    });

    it('should throw error if dont have from', () => {
      when(config.get).calledWith('mails').mockReturnValue({
        sendgrid: {
          authKey: 'domain'
        }
      });
      return instance.init()
        .catch((e) => {
          expect(e).toMatchObject({
            message: `Invalid configuration of sendgrid. Actual config: ${JSON.stringify(instance.getByName('defaultConfig'))}`
          });
        });
    });

    it('should call super to init', () => {
      const expectConfig = {
        authKey: 'from',
        from: 'from'
      };
      when(config.get).calledWith('mails').mockReturnValue({
        sendgrid: expectConfig
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
      instance.setByName('defaultConfig', { authKey: myKey });
      const mock = jest.fn();
      await (instance.getByName('prepareAuth').bind(instance)({ auth: mock }));

      expect(mock).toHaveBeenCalledTimes(1);
      expect(mock).lastCalledWith(myKey, { type: 'bearer' });
    });
  });

  describe('prepareUrl', () => {
    it('should return correct url', () => {
      const url = instance.getByName('prepareUrl').bind(instance)();

      expect(url).toEqual('https://api.sendgrid.com/v3/mail/send');
    });
  });

  describe('prepareRequestConfig', () => {
    it('should prepare correct config', async () => {
      const mock = jest.fn();
      instance.setByName('timeout', -200000);
      await (instance.getByName('prepareRequestConfig').bind(instance)({ timeout: mock, set: mock, accept: mock }));

      expect(mock.mock.calls[0]).toEqual([-200000]);
      expect(mock).toBeCalledWith('Content-Type', 'application/json');
      expect(mock).toBeCalledWith('application/json');
    });
  });

  describe('prepareRequestContent', () => {
    it('should prepare request when having only to', async () => {
      instance.setByName('defaultConfig', { from: 'from@me.com' });
      const mock = jest.fn();

      await (instance.getByName('prepareRequestContent').bind(instance)({ send: mock },
        {
          to: ['trung@test.com'],
          title: 'test',
          content: 'test 2 test'
        }
      ));

      expect(mock).lastCalledWith({
        personalizations: [
          {
            to: [
              { email: 'trung@test.com' }
            ]
          }
        ],
        from: {
          email: 'from@me.com'
        },
        subject: 'test',
        content: [
          {
            type: 'text/plain',
            value: 'test 2 test'
          }
        ]
      });
    });

    it('should prepare request when having cc', async () => {
      instance.setByName('defaultConfig', { from: 'from@me.com' });
      const mock = jest.fn();

      await (instance.getByName('prepareRequestContent').bind(instance)({ send: mock },
        {
          to: ['trung@test.com'],
          cc: ['cc@test.com'],
          title: 'test',
          content: 'test 2 test'
        }
      ));

      expect(mock).lastCalledWith({
        personalizations: [
          {
            to: [
              { email: 'trung@test.com' }
            ],
            cc: [
              { email: 'cc@test.com' }
            ]
          }
        ],
        from: {
          email: 'from@me.com'
        },
        subject: 'test',
        content: [
          {
            type: 'text/plain',
            value: 'test 2 test'
          }
        ]
      });
    });

    it('should prepare request when having bcc', async () => {
      instance.setByName('defaultConfig', { from: 'from@me.com' });
      const mock = jest.fn();

      await (instance.getByName('prepareRequestContent').bind(instance)({ send: mock },
        {
          to: ['trung@test.com'],
          cc: ['cc@test.com'],
          bcc: ['bcc@test.com'],
          title: 'test',
          content: 'test 2 test'
        }
      ));

      expect(mock).lastCalledWith({
        personalizations: [
          {
            to: [
              { email: 'trung@test.com' }
            ],
            cc: [
              { email: 'cc@test.com' }
            ],
            bcc: [
              { email: 'bcc@test.com' }
            ]
          }
        ],
        from: {
          email: 'from@me.com'
        },
        subject: 'test',
        content: [
          {
            type: 'text/plain',
            value: 'test 2 test'
          }
        ]
      });
    });
  });
});
