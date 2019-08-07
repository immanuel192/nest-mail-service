import * as redisProvider from '../../providers/redis.provider';
import { QueueConsumerBase } from './queue.consumer.base';
import { EMailProcessingStatus, QUEUE_NAMESPACE, QUEUE_RETRY_CHECK } from '../../commons';
import { loggerMock, configMock, when } from '../../commons/test-helper';

class FakeWorker extends QueueConsumerBase {
  onMesage(): Promise<EMailProcessingStatus> {
    return Promise.resolve(null);
  }

  setByName(name: string, value: any) {
    (this as any)[name] = value;
  }

  getByName(name: string) {
    return (this as any)[name];
  }
}

const queueMock = {
  receive: jest.fn(),
  delete: jest.fn(),
  updateVisibility: jest.fn()
};
const QUEUE_NAME = 'test-queue';
const logger = loggerMock();
const config = configMock();

describe('/src/services/queue/queue.consumer.base.ts', () => {
  let instance: FakeWorker;
  let spyRedisNewConnection: jest.SpyInstance;

  beforeAll(() => {
    spyRedisNewConnection = jest.spyOn(redisProvider, 'newRedisConnection');
    instance = new FakeWorker(queueMock, QUEUE_NAME);
    instance.setByName('logger', logger);
    instance.setByName('configService', config);
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  afterAll(() => {
    jest.restoreAllMocks();
    instance.onModuleDestroy();
  });

  describe('onModuleInit', () => {
    const fakeRedis = {
      subscribe: jest.fn(),
      on: jest.fn()
    };

    it('should init subcribe to redis and internal buffer', async () => {
      const channelName = `${QUEUE_NAMESPACE}:rt:${QUEUE_NAME}`;
      when(spyRedisNewConnection).calledWith(config, logger, QUEUE_NAME).mockReturnValue(fakeRedis);
      await instance.onModuleInit();

      expect(fakeRedis.subscribe).toBeCalledWith(channelName);
      expect(fakeRedis.on).toBeCalledWith('message', expect.anything());
    });
  });

  describe('attempProcessMessage', () => {
    let mockOnMessage: jest.SpyInstance;

    beforeAll(() => {
      mockOnMessage = jest.spyOn(instance, 'onMesage');
    });

    beforeEach(() => {
      mockOnMessage.mockReset();
    });

    afterAll(() => {
      mockOnMessage.mockRestore();
    });

    it('should not do anything if can not fetch message from queue', async () => {
      queueMock.receive.mockResolvedValue(null);

      await (instance as any).attempProcessMessage();
      expect(mockOnMessage).not.toBeCalled();
    });

    it('should process input message that prefetch from queue', async () => {
      const message = { id: 123, message: 'my message' };

      await (instance as any).attempProcessMessage(message);
      expect(queueMock.receive).not.toBeCalled();
      expect(logger.debug).toBeCalledWith(`Executing worker for message ${message.message}`);
      expect(mockOnMessage).toBeCalledWith(message);

      // should date lastProcessOn
      expect(Date.now() - instance.getByName('lastProcessOn')).toBeLessThan(100);
    });

    it('should fetch data from from queue if any', async () => {
      const message = { id: 123, message: 'my message' };
      queueMock.receive.mockResolvedValue(message);

      await (instance as any).attempProcessMessage();
      expect(logger.debug).toBeCalledWith(`Executing worker for message ${message.message}`);
      expect(mockOnMessage).toBeCalledWith(message);

      // should date lastProcessOn
      expect(Date.now() - instance.getByName('lastProcessOn')).toBeLessThan(100);
    });

    it('should delete message from queue when successfull', async () => {
      const message = { id: 123, message: 'my message' };
      mockOnMessage.mockResolvedValue(EMailProcessingStatus.Success);

      await (instance as any).attempProcessMessage(message);
      expect(logger.debug).toBeCalledWith(`Worker processed doc ${message.message} with status ${EMailProcessingStatus.Success}`);
      expect(queueMock.delete).toBeCalledWith(message.id);
    });

    it('should retry message from queue if any', async () => {
      const message = { id: 123, message: 'my message' };
      mockOnMessage.mockResolvedValue(EMailProcessingStatus.Retry);

      await (instance as any).attempProcessMessage(message);
      expect(queueMock.delete).not.toBeCalled();
      expect(queueMock.updateVisibility).toBeCalledWith(message.id, QUEUE_RETRY_CHECK);
    });

    it('should log if any error', async () => {
      const message = { id: 123, message: 'my message' };
      const myError = new Error('my error');
      mockOnMessage.mockRejectedValue(myError);

      await (instance as any).attempProcessMessage(message);
      expect(queueMock.delete).not.toBeCalled();
      expect(queueMock.updateVisibility).not.toBeCalled();
      expect(logger.error).toBeCalledWith(`Unsuccessful processing message ${message.message} with error ${myError.message}`, myError.stack);
    });
  });
});
