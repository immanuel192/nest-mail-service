import { when } from 'jest-when';
import { ObjectId } from 'mongodb';
import MailController from './mail.controller';
import { SendMailRequestDto } from '../dto';
const mockMailService = {
  insert: jest.fn()
};

describe('/src/controllers/mail.controller.ts', () => {
  let instance: MailController;

  beforeAll(() => {
    instance = new MailController(mockMailService as any);
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
    });
  });
});
