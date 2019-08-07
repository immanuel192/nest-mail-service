import * as circuit from 'opossum';
import { MTABase } from './mta.base';
import { AttemptMailSendingDto } from '../../dto';
import { loggerMock, configMock, when } from '../../commons/test-helper';
import { EMailProcessingStatus } from '../../commons';

class FakeMTA extends MTABase {
  isAvailable: boolean = true;
  config: any = {};
  configName: string = 'myConfigName';
  method: string = 'mymethod';
  name: string = 'mta name';

  getByName(name: string) {
    return (this as any)[name];
  }

  setByName(name: string, value: any) {
    (this as any)[name] = value;
  }

  public prepareAuth(_request: any): Promise<void> {
    throw new Error('Method not implemented.');
  }

  public prepareUrl(): string {
    return 'myurl';
  }

  public prepareRequestContent(_request: any, _mail: AttemptMailSendingDto): Promise<void> {
    throw new Error('Method not implemented.');
  }

  public prepareRequestConfig(_request: any): Promise<void> {
    throw new Error('Method not implemented.');
  }
}

const logger = loggerMock();
const config = configMock();
let circuitMock: jest.SpyInstance;

describe('/src/services/mta/mta.base.ts', () => {
  let instance: FakeMTA;

  beforeAll(() => {
    circuitMock = jest.spyOn(circuit, 'default');
    instance = new FakeMTA(logger, config);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe('init', () => {
    const fakeCircuitObj = {
      on: jest.fn()
    };

    it('should use default config to init circuit', async () => {
      when(config.get).calledWith('mails').mockReturnValue({ [instance.configName]: {} });
      circuitMock.mockReturnValue(fakeCircuitObj);

      await instance.init();

      expect(circuitMock.mock.calls[0][1]).toMatchObject({
        timeout: 5000,
        errorThresholdPercentage: 50,
        resetTimeout: 30000
      });
    });

    it('should allow override config to init circuit', async () => {
      when(config.get).calledWith('mails').mockReturnValue({
        [instance.configName]: {
          circuit: {
            resetTimeout: 1
          }
        }
      });
      circuitMock.mockReturnValue(fakeCircuitObj);

      await instance.init();

      expect(circuitMock.mock.calls[0][1]).toMatchObject({
        timeout: 5000,
        errorThresholdPercentage: 50,
        resetTimeout: 1
      });
    });

    it('should listen to circuit status', async () => {
      when(config.get).calledWith('mails').mockReturnValue({ [instance.configName]: {} });
      circuitMock.mockReturnValue(fakeCircuitObj);

      await instance.init();

      // open
      expect(fakeCircuitObj.on.mock.calls[0][0]).toEqual('open');
      instance.isAvailable = true;
      fakeCircuitObj.on.mock.calls[0][1]();
      expect(instance.isAvailable).toEqual(false);
      expect(logger.debug).toBeCalledWith(`Walao eh! ${instance.name} circuit opened`);

      // close
      expect(fakeCircuitObj.on.mock.calls[1][0]).toEqual('close');
      instance.isAvailable = false;
      fakeCircuitObj.on.mock.calls[1][1]();
      expect(instance.isAvailable).toEqual(true);
      expect(logger.debug).toBeCalledWith(`Hallo! ${instance.name} circuit closed`);
    });
  });

  describe('getMaxRetries', () => {
    it('should return config max retries', () => {
      instance.config.maxRetries = 10;
      expect(instance.getMaxRetries()).toEqual(10);
    });

    it('should return default maxretries', () => {
      instance.config = {};
      expect(instance.getMaxRetries()).toEqual(3);
    });
  });

  describe('send', () => {
    it('should call circuit to fire event', async () => {
      const fire = jest.fn();
      const inp = { x: 1, y: 2 };
      const expectValue = { a: 1, b: 2 };
      instance.setByName('circuit', { fire });
      when(fire).calledWith(inp).mockResolvedValue(expectValue);

      const res = await instance.send(inp as any);
      expect(res).toMatchObject(expectValue);
    });

    it('should return Retry status if circuit failed to load', async () => {
      const fire = jest.fn();
      const inp = { x: 1, y: 2 };
      instance.setByName('circuit', { fire });
      when(fire).calledWith(inp).mockRejectedValue(EMailProcessingStatus.Retry);

      const res = await instance.send(inp as any);
      expect(res).toEqual(EMailProcessingStatus.Retry);
    });
  });
});
