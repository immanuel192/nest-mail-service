import { ObjectId } from 'mongodb';
import { MailRecoverJob } from './mail.recover.job';
import { loggerMock, when } from '../../commons/test-helper';

class FakeMailRecoverJob extends MailRecoverJob {
  setByName(name: string, value: any) {
    (this as any)[name] = value;
  }

  getJobName() {
    return this.jobName;
  }
}

const mailService = {
  fetchPendingMails: jest.fn()
};
const mainQueue = {
  send: jest.fn()
};
const logger = loggerMock();

describe('/src/services/jobs/mail.recover.job.ts', () => {
  let instance: FakeMailRecoverJob;
  const defaultConfig = {
    bufferTime: 10
  };

  beforeAll(() => {
    instance = new FakeMailRecoverJob(mailService as any, mainQueue as any);
    instance.setByName('logger', logger);
    instance.setByName('config', defaultConfig);
    instance.setByName('bufferTime', defaultConfig.bufferTime);

  });
  afterAll(() => {
    jest.restoreAllMocks();
  });
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should execute correctly', async () => {
    const id = new ObjectId('5d47931e4ac9107f560cd446');
    const id2 = new ObjectId('5d47a7844ac9107f560cd448');

    when(mailService.fetchPendingMails).calledWith({
      fromId: null,
      limit: 100,
      bufferTime: defaultConfig.bufferTime
    }).mockResolvedValue([{ _id: id }, { _id: id2 }]);

    when(mailService.fetchPendingMails).calledWith({
      fromId: id2,
      limit: 100,
      bufferTime: defaultConfig.bufferTime
    }).mockResolvedValue([]);

    await instance.execute();

    expect(mailService.fetchPendingMails.mock.calls[0][0]).toMatchObject({ fromId: null, limit: 100, bufferTime: 10 });
    expect(mailService.fetchPendingMails.mock.calls[1][0]).toMatchObject({ fromId: id2, limit: 100, bufferTime: 10 });

    expect(mainQueue.send).toBeCalledWith(id.toHexString());
    expect(mainQueue.send).toBeCalledWith(id2.toHexString());

    expect(logger.debug).toBeCalledWith(`${instance.getJobName()}: Starting job`);
    expect(logger.debug).toBeCalledWith('Fetched 2 pending mails');
    expect(logger.debug).toBeCalledWith(`${instance.getJobName()}: Finished. Processed 2 pending mails, started from ${id.toHexString()}`);
  });
});
