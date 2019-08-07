import { MailSendingWorker } from './mail.sending.worker';
import { when } from 'jest-when';
import { EMailProcessingStatus, EMailStatus } from '../../commons';

const queue = {};
const mailService = {
  getMailById: jest.fn(),
  addMailStatus: jest.fn(),
  updateMailStatus: jest.fn()
};
const mtaStategy = {
  getMTA: jest.fn()
};

describe('/src/services/workers/mail.sending.worker.ts', () => {
  let instance: MailSendingWorker;

  beforeAll(() => {
    instance = new MailSendingWorker(queue as any, mailService as any, mtaStategy as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe('onMessage', () => {
    const message = { id: '123', message: '456' };
    it('should return Outdated if can not find message in mongodb', async () => {
      when(mailService.getMailById).calledWith(message.message).mockResolvedValue(null);

      const res = await instance.onMesage(message as any);
      expect(res).toEqual(EMailProcessingStatus.Outdated);
    });

    it('should return Outdated when mail does not have status', async () => {
      when(mailService.getMailById).calledWith(message.message).mockResolvedValue({});

      const res = await instance.onMesage(message as any);
      expect(res).toEqual(EMailProcessingStatus.Outdated);
    });

    it('should return Outdated when mail does not have invalid status', async () => {
      when(mailService.getMailById).calledWith(message.message).mockResolvedValue({ status: [] });

      const res = await instance.onMesage(message as any);
      expect(res).toEqual(EMailProcessingStatus.Outdated);
    });

    it('should return Outdated when status is Fail', async () => {
      when(mailService.getMailById).calledWith(message.message).mockResolvedValue({ status: [{ type: EMailStatus.Fail }] });

      const res = await instance.onMesage(message as any);
      expect(res).toEqual(EMailProcessingStatus.Outdated);
    });

    it('should return Outdated when status is Success', async () => {
      when(mailService.getMailById).calledWith(message.message).mockResolvedValue({ status: [{ type: EMailStatus.Success }] });

      const res = await instance.onMesage(message as any);
      expect(res).toEqual(EMailProcessingStatus.Outdated);
    });

    it('should Fail if can not find any MTA', async () => {
      const _id = '_id';
      when(mailService.getMailById).calledWith(message.message).mockResolvedValue({
        _id,
        status: [{ type: EMailStatus.Attempt }]
      });
      when(mtaStategy.getMTA).calledWith({ type: EMailStatus.Attempt }).mockResolvedValue(null);

      const res = await instance.onMesage(message as any);
      expect(res).toEqual(EMailProcessingStatus.Outdated);
      expect(mailService.addMailStatus).toBeCalledWith(_id, expect.objectContaining({
        onDate: expect.any(Date),
        type: EMailStatus.Fail
      }));
    });

    it('should send mail for Init status', async () => {
      const _id = '_id';
      when(mailService.getMailById).calledWith(message.message).mockResolvedValue({
        _id,
        status: [{ type: EMailStatus.Init }]
      });
      const mock = jest.fn();
      when(mtaStategy.getMTA).calledWith({ type: EMailStatus.Init }).mockResolvedValue({ send: mock, name: 'mymta' });
      mock.mockResolvedValue(EMailProcessingStatus.Success);

      const res = await instance.onMesage(message as any);
      expect(res).toEqual(EMailProcessingStatus.Success);
      expect(mailService.addMailStatus).toBeCalledWith(_id, expect.objectContaining({
        onDate: expect.any(Date),
        type: EMailStatus.Success
      }));
    });

    it('should retry when mail Init fail', async () => {
      const _id = '_id';
      when(mailService.getMailById).calledWith(message.message).mockResolvedValue({
        _id,
        status: [{ type: EMailStatus.Init }]
      });
      const mock = jest.fn();
      when(mtaStategy.getMTA).calledWith({ type: EMailStatus.Init }).mockResolvedValue({ send: mock, name: 'mymta' });
      mock.mockResolvedValue(EMailProcessingStatus.Retry);

      const res = await instance.onMesage(message as any);
      expect(res).toEqual(EMailProcessingStatus.Retry);
      expect(mailService.addMailStatus).toBeCalledWith(_id, expect.objectContaining({
        retries: 1,
        mta: 'mymta',
        type: EMailStatus.Attempt
      }));
    });

    it('should retry for Attempt mail', async () => {
      const _id = '_id';
      when(mailService.getMailById).calledWith(message.message).mockResolvedValue({
        _id,
        status: [{ type: EMailStatus.Attempt, retries: 1, mta: 'mymta' }]
      });
      const mock = jest.fn();
      when(mtaStategy.getMTA).calledWith({
        type: EMailStatus.Attempt,
        retries: 1,
        mta: 'mymta'
      }).mockResolvedValue({ send: mock, name: 'mymta' });
      mock.mockResolvedValue(EMailProcessingStatus.Retry);

      const res = await instance.onMesage(message as any);
      expect(res).toEqual(EMailProcessingStatus.Retry);
      expect(mailService.updateMailStatus).toBeCalledWith(_id, expect.objectContaining({
        retries: 2,
        mta: 'mymta',
        type: EMailStatus.Attempt
      }));
    });

    it('should retry for Attempt with different MTA if exceed configured number', async () => {
      const _id = '_id';
      when(mailService.getMailById).calledWith(message.message).mockResolvedValue({
        _id,
        status: [{
          type: EMailStatus.Attempt,
          // Previously used mymta2 but the stategy will give different MTA in this scenario
          retries: 1, mta: 'mymta2'
        }]
      });
      const mock = jest.fn();
      when(mtaStategy.getMTA).calledWith({
        type: EMailStatus.Attempt,
        retries: 1,
        mta: 'mymta2'
      }).mockResolvedValue({ send: mock, name: 'mymta' });
      mock.mockResolvedValue(EMailProcessingStatus.Retry);

      const res = await instance.onMesage(message as any);
      expect(res).toEqual(EMailProcessingStatus.Retry);
      expect(mailService.addMailStatus).toBeCalledWith(_id, expect.objectContaining({
        retries: 1,
        mta: 'mymta',
        type: EMailStatus.Attempt
      }));
    });
  });
});
