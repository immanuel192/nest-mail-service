import { MailService } from './mail.service';
import { IMailService } from './mail.service.interface';
import { collectionMock, randomString, when } from '../commons/test-helper';
import { IOC_KEY, EMailSendingStatus } from '../commons';
import { InsertMailInfoDto } from '../dto';

const mailCol = collectionMock();

describe('/src/services/mail.service.ts', () => {
  let instance: IMailService;
  beforeAll(() => {
    instance = new MailService(mailCol as any);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe('IoC', () => {
    it('should have class information as expected', () => {
      expect(MailService[IOC_KEY]).not.toBeUndefined();
      expect(MailService[IOC_KEY]).toMatchObject({
        provide: IMailService,
        useClass: MailService
      });

      expect(instance).not.toBeUndefined();
    });
  });

  describe('insert', () => {
    const inp: InsertMailInfoDto = {
      to: [randomString()],
      cc: [randomString()],
      bcc: [randomString()],
      title: randomString(),
      content: randomString()
    };

    it('should insert new mail and return full new mail document', async () => {
      const actualInsertedDoc = { insertedId: randomString() };
      const actualNewMailDoc = { a: 1, b: 2, c: 4 };
      when(mailCol.insertOne).calledWith({
        to: inp.to,
        cc: inp.cc,
        bcc: inp.bcc,
        title: inp.title,
        content: inp.content,
        status: [
          {
            type: EMailSendingStatus.Init
          }
        ],
        sentOn: expect.any(Date)
      }).mockResolvedValue(actualInsertedDoc);
      when(mailCol.findOne).calledWith({ _id: actualInsertedDoc.insertedId }).mockResolvedValue(actualNewMailDoc);

      const result = await instance.insert(inp);
      expect(result).toMatchObject(actualNewMailDoc);
    });

    it('should reject if any exception when inserting new document', () => {
      const expectError = new Error('i love this error');
      mailCol.insertOne.mockRejectedValue(expectError);

      return instance.insert(inp)
        .then(() => Promise.reject(new Error('insert does not handle error correctly')))
        .catch((e) => {
          expect(e).toMatchObject(expectError);
          expect(mailCol.findOne).not.toBeCalled();
        });
    });
  });
});
