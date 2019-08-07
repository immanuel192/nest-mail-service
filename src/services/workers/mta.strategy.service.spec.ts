import { MTAStategyService } from './mta.strategy.service';
import { loggerMock, configMock } from '../../commons/test-helper';
import { EMailStatus } from '../../commons';

class FakeMTAStategy extends MTAStategyService {
  getByName(name: string) {
    return (this as any)[name];
  }

  setByName(name: string, value: any) {
    (this as any)[name] = value;
  }
}

const logger = loggerMock();
const config = configMock();
describe('/src/services/workers/mta.strategy.service.ts', () => {
  let instance: FakeMTAStategy;

  beforeAll(() => {
    instance = new FakeMTAStategy(logger, config);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe('getMTA', () => {
    const availableMTA: any[] = [];
    beforeAll(() => {
      instance.setByName('availableMTA', availableMTA);
    });

    it('should prefer to load available MTA that match with previous use', async () => {
      availableMTA.length = 0;
      const mta = { name: 'mymta', isAvailable: true, getMaxRetries() { return 2; } };
      availableMTA.push(mta);

      const actualMta = await instance.getMTA({ type: EMailStatus.Attempt, mta: 'mymta' });
      expect(actualMta).toStrictEqual(mta);
    });

    it('should load previous mta to retry', async () => {
      availableMTA.length = 0;
      const mta = { name: 'mymta', isAvailable: true, getMaxRetries() { return 2; } };
      availableMTA.push(mta);

      const actualMta = await instance.getMTA({ type: EMailStatus.Attempt, retries: 1, mta: 'mymta' });
      expect(actualMta).toStrictEqual(mta);
    });

    it('should choose different mta if exceed retry', async () => {
      availableMTA.length = 0;
      const mta = { name: 'mymta', isAvailable: true, getMaxRetries() { return 2; } };
      const mta2 = { name: 'mymta2', isAvailable: true, getMaxRetries() { return 2; } };
      availableMTA.push(mta);
      availableMTA.push(mta2);

      const actualMta = await instance.getMTA({ type: EMailStatus.Attempt, retries: 2, mta: 'mymta' });
      expect(actualMta).toStrictEqual(mta2);
    });

    it('should return undefined if can not find any MTA', async () => {
      availableMTA.length = 0;
      const mta = { name: 'mymta', isAvailable: true, getMaxRetries() { return 2; } };
      const mta2 = { name: 'mymta2', isAvailable: false, getMaxRetries() { return 2; } };
      availableMTA.push(mta);
      availableMTA.push(mta2);

      const actualMta = await instance.getMTA({ type: EMailStatus.Attempt, retries: 2, mta: 'mymta' });
      expect(actualMta).toBeFalsy();
    });

    it('should return any MTA that match for Init', async () => {
      availableMTA.length = 0;
      const mta = { name: 'mymta', isAvailable: true, getMaxRetries() { return 2; } };
      const mta2 = { name: 'mymta2', isAvailable: false, getMaxRetries() { return 2; } };
      availableMTA.push(mta);
      availableMTA.push(mta2);

      const actualMta = await instance.getMTA({ type: EMailStatus.Init });
      expect(actualMta).toStrictEqual(mta);
    });
  });
});
