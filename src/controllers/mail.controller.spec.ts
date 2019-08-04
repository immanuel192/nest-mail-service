import { when } from 'jest-when';
import { ObjectId } from 'mongodb';
import MailController from './mail.controller';
import { SendMailRequestDto } from '../dto';
import { queueMock, loggerMock } from '../commons/test-helper';

const mockMailService = {
  insert: jest.fn()
};

const mainQueue = queueMock();
const logger = loggerMock();

describe('/src/controllers/mail.controller.ts', () => {
  let instance: MailController;

  beforeAll(() => {
    instance = new MailController(
      mainQueue,
      logger,
      mockMailService as any
    );
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('create', () => {
    const expectObjId = new ObjectId('5d4601128e98533b66875b71');

    it('should call mail service to insert new mail and response correctly', async () => {
      const inp: SendMailRequestDto = { title: 'my ttitle', content: 'test', to: ['myemail@gmail.com'] };

      when(mockMailService.insert).calledWith({ ...inp }).mockResolvedValue({ _id: expectObjId });

      const result = await instance.create(inp);
      expect(result.data.id).toEqual(expectObjId.toHexString());
      expect(mainQueue.send).toHaveBeenCalledTimes(1);
      expect(mainQueue.send).toBeCalledWith(expectObjId.toHexString());
    });

    it('should log as error but not reject in case can not enqueue', async () => {
      const inp: SendMailRequestDto = { title: 'my ttitle', content: 'test', to: ['myemail@gmail.com'] };
      const myError = new Error('test');

      when(mockMailService.insert).calledWith({ ...inp }).mockResolvedValue({ _id: expectObjId });
      mainQueue.send.mockRejectedValue(myError);

      const result = await instance.create(inp);
      expect(result.data.id).toEqual(expectObjId.toHexString());

      expect(logger.error).toBeCalledWith('Can not dispatch new mail sending to main queue', myError.stack || null);
    });

    it('should throw exception if can not create new document', () => {
      const myError = new Error('test');
      mockMailService.insert.mockRejectedValue(myError);

      return instance.create({} as any)
        .then(() => Promise.reject(new Error('mail controller create does not handle error correctly')))
        .catch((e) => {
          expect(e).toMatchObject(myError);
          expect(logger.error).not.toBeCalled();
          expect(mainQueue.send).not.toBeCalled();
        });
    });
  });
});
