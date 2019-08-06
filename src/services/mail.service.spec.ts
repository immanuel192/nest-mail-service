import { ObjectId } from 'mongodb';
import { MailService } from './mail.service';
import { IMailService } from './mail.service.interface';
import { collectionMock, randomString, when } from '../commons/test-helper';
import { IOC_KEY, EMailStatus } from '../commons';
import { InsertMailInfoDto } from '../dto';

const mailCol = collectionMock();

describe('/src/services/mail.service.ts', () => {
  let instance: IMailService;
  beforeAll(() => {
    instance = new MailService(mailCol as any);
  });

  beforeEach(() => {
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
            type: EMailStatus.Init
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

  describe('fetchPendingMails', () => {
    const baseQuery = {
      'status.0.type': {
        $nin: [EMailStatus.Success, EMailStatus.Fail]
      }
    };
    const baseOptions = {
      sort: {
        id: 1
      },
      projection: {
        _id: 1
      },
      limit: 100
    };

    it('should fetch data without the input conditions', async () => {
      const expectValue = [{ a: 1, b: 2 }];
      mailCol.find.mockReset();
      when(mailCol.find).calledWith({ ...baseQuery }, { ...baseOptions }).mockReturnValue(mailCol);
      mailCol.toArray.mockResolvedValue(expectValue);

      const result = await instance.fetchPendingMails();
      expect(result).toEqual(expectValue);
    });

    it('should fetch data with custom limit', async () => {
      const expectValue = [{ a: 1, b: 2 }];
      mailCol.find.mockReset();
      when(mailCol.find).calledWith({ ...baseQuery }, { ...baseOptions, limit: 20 }).mockReturnValue(mailCol);
      mailCol.toArray.mockResolvedValue(expectValue);

      const result = await instance.fetchPendingMails({ limit: 20 });
      expect(result).toEqual(expectValue);
    });

    it('should not fetch data with custom limit if limit < 0', async () => {
      const expectValue = [{ a: 1, b: 2 }];
      mailCol.find.mockReset();
      when(mailCol.find).calledWith({ ...baseQuery }, { ...baseOptions, limit: 100 }).mockReturnValue(mailCol);
      mailCol.toArray.mockResolvedValue(expectValue);

      const result = await instance.fetchPendingMails({ limit: -1 });
      expect(result).toEqual(expectValue);
    });

    it('should fetch data with fromId', async () => {
      const expectValue = [{ a: 1, b: 2 }];
      const id = new ObjectId('5d47931e4ac9107f560cd446');
      mailCol.find.mockReset();
      when(mailCol.find).calledWith({
        ...baseQuery,
        _id: {
          $gt: id
        }
      }, { ...baseOptions }).mockReturnValue(mailCol);
      mailCol.toArray.mockResolvedValue(expectValue);

      const result = await instance.fetchPendingMails({ fromId: id });
      expect(result).toEqual(expectValue);
    });

    it('should fetch data with custom bufferTime', async () => {
      const expectValue = [{ a: 1, b: 2 }];
      const bufferTime = 10;
      mailCol.find.mockReset();
      when(mailCol.find).calledWith({
        ...baseQuery,
        sentOn: {
          $lt: expect.any(Date)
        }
      }, { ...baseOptions }).mockReturnValue(mailCol);
      mailCol.toArray.mockResolvedValue(expectValue);

      const result = await instance.fetchPendingMails({ bufferTime });
      expect(result).toEqual(expectValue);

      const compareTime = new Date(Date.now() - bufferTime * 1000);
      const fistCallArgs = mailCol.find.mock.calls[0][0].sentOn['$lt'];
      expect(Math.abs(compareTime.getTime() - fistCallArgs.getTime())).toBeLessThanOrEqual(1000); // should be within 1s in diff
    });

  });
});
