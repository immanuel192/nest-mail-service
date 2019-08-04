
jest.mock('rsmq', () => {
  return jest.fn().mockImplementation(() => rsmqMock);
});
import { QueueBase } from './queue.base';
import { configMock, loggerMock, when, randomString } from '../../commons/test-helper';
import { IQueue } from './queue.base.interface';

const config = configMock();
const logger = loggerMock();
const rsmqMock = {
  listQueuesAsync: jest.fn(),
  createQueueAsync: jest.fn(),
  sendMessageAsync: jest.fn(),
  receiveMessageAsync: jest.fn(),
  deleteMessageAsync: jest.fn(),
  changeMessageVisibilityAsync: jest.fn()
};
const QUEUE_NAME = 'test-queue';
const sampleRedisConfig = {
  host: 'myhost',
  port: 1234,
  db: 5
};

class FakeQueue extends QueueBase {
  public configService: any;
  public logger: any;
  constructor() {
    super(QUEUE_NAME);
    this.configService = config;
    this.logger = logger;
  }
}

describe('/src/services/queue/queue.base.ts', () => {
  let instance: IQueue;

  beforeAll(() => {
    instance = new FakeQueue();
  });

  beforeEach(() => {
    when(config.get).calledWith('redis').mockReturnValue(sampleRedisConfig);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe('onModuleInit', () => {
    it('should create queue if not exist', async () => {
      rsmqMock.listQueuesAsync.mockResolvedValue(['test', randomString()]);
      when(rsmqMock.createQueueAsync).calledWith({ qname: QUEUE_NAME }).mockResolvedValue(1);

      await (instance as any).onModuleInit();
      expect(logger.debug).toBeCalledWith(`Init queue ${QUEUE_NAME}`);
      expect(logger.debug).toBeCalledWith(`Created queue ${QUEUE_NAME}`);
    });

    it('should not create queue if queue already existed', async () => {
      rsmqMock.listQueuesAsync.mockResolvedValue(['test', randomString(), QUEUE_NAME]);

      await (instance as any).onModuleInit();
      expect(rsmqMock.createQueueAsync).not.toBeCalled();
    });

    it('should throw exception when can not create queue', () => {
      rsmqMock.listQueuesAsync.mockResolvedValue(['test', randomString()]);
      rsmqMock.createQueueAsync.mockResolvedValue(0);

      return (instance as any).onModuleInit()
        .catch((e: Error) => {
          expect(e).toMatchObject({
            message: `Creating queue ${QUEUE_NAME} unsuccessful`
          });
        });
    });
  });

  describe('send', () => {
    it('should enqueue message to queue', async () => {
      const expectValue = { a: 1, b: 2 };
      const message = randomString();
      rsmqMock.sendMessageAsync.mockResolvedValue(expectValue);

      const result = await instance.send(message);
      expect(result).toMatchObject(expectValue);
      expect(rsmqMock.sendMessageAsync).toBeCalledWith({
        message, qname: QUEUE_NAME
      });
    });
  });

  describe('receive', () => {
    it('should fetch message from queue', async () => {
      const expectValue = { id: 123 };
      rsmqMock.receiveMessageAsync.mockResolvedValue(expectValue);

      const result = await instance.receive();
      expect(result).toMatchObject(expectValue);
      expect(rsmqMock.receiveMessageAsync).toBeCalledWith({
        qname: QUEUE_NAME
      });
    });

    it('should return null if no message', async () => {
      const expectValue = {};
      rsmqMock.receiveMessageAsync.mockResolvedValue(expectValue);

      const result = await instance.receive();
      expect(result).toStrictEqual(null);
      expect(rsmqMock.receiveMessageAsync).toBeCalledWith({
        qname: QUEUE_NAME
      });
    });
  });

  describe('delete', () => {
    it('should delete message from queue and return true', async () => {
      const id = 123;
      rsmqMock.deleteMessageAsync.mockResolvedValue(1);

      const result = await instance.delete(id);
      expect(result).toStrictEqual(true);
      expect(rsmqMock.deleteMessageAsync).toBeCalledWith({
        qname: QUEUE_NAME,
        id: id.toString()
      });
    });

    it('should return false if can not delete', async () => {
      const id = 123;
      rsmqMock.deleteMessageAsync.mockResolvedValue(0);

      const result = await instance.delete(id);
      expect(result).toStrictEqual(false);
      expect(rsmqMock.deleteMessageAsync).toBeCalledWith({
        qname: QUEUE_NAME,
        id: id.toString()
      });
    });
  });

  describe('updateVisibility', () => {
    it('should update message visibility return true', async () => {
      const id = 123; const vt = 100;
      rsmqMock.changeMessageVisibilityAsync.mockResolvedValue(1);

      const result = await instance.updateVisibility(id, vt);
      expect(result).toStrictEqual(true);
      expect(rsmqMock.changeMessageVisibilityAsync).toBeCalledWith({
        vt,
        qname: QUEUE_NAME,
        id: id.toString()
      });
    });

    it('should return false if can not update message visibility', async () => {
      const id = 123; const vt = 100;
      rsmqMock.changeMessageVisibilityAsync.mockResolvedValue(0);

      const result = await instance.updateVisibility(id, vt);
      expect(result).toStrictEqual(false);
      expect(rsmqMock.changeMessageVisibilityAsync).toBeCalledWith({
        vt,
        qname: QUEUE_NAME,
        id: id.toString()
      });
    });
  });
});
