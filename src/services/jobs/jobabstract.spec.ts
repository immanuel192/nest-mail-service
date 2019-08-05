import { when } from 'jest-when';
import { Scheduler } from 'nest-schedule/dist/scheduler';
import { JobAbstract } from './jobabstract';
import { EJobType } from './jobabstract.interface';
import { ILoggerInstance, IConfiguration } from '../../commons';
import { configMock, spyOn, loggerMock } from '../../commons/test-helper';

class TestJob extends JobAbstract {
  protected jobName: string = 'test-job';
  protected logger: ILoggerInstance;
  protected configService: IConfiguration;

  setLogger(logger: any) {
    this.logger = logger;
  }

  setRunningState(state: boolean) {
    this.isRunning = state;
  }

  getRunningState() {
    return this.isRunning;
  }

  getConfig() {
    return this.config;
  }

  resetConfig() {
    this.config = {
      type: EJobType.timeout,
      maxRetry: 5,
      retryInterval: 2000
    };
  }

  getJobName() {
    return this.jobName;
  }

  setConfigService(configService: any) {
    this.configService = configService;
  }

  execute(): boolean | void | Promise<void> | Promise<boolean> {
  }
}

describe('/src/jobs/jobabstract.ts', () => {
  let instance: TestJob;
  const logger = loggerMock();

  beforeAll(() => {
    instance = new TestJob();
    instance.setLogger(logger);
  });
  beforeEach(() => {
    instance.resetConfig();
  });
  afterAll(() => {
    jest.restoreAllMocks();
  });
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('tryLock', () => {
    it('should return true when try lock', async () => {
      expect(await instance.tryLock()).toEqual(true);
    });
  });

  describe('onModuleInit', () => {
    const configService = configMock();
    let handlers: {
      scheduleCronJob: jest.SpyInstance<Scheduler>,
      scheduleIntervalJob: jest.SpyInstance<Scheduler>,
      scheduleTimeoutJob: jest.SpyInstance<Scheduler>
    } = null;
    beforeAll(() => {
      instance.setConfigService(configService);
      handlers = spyOn(Scheduler, [
        'scheduleCronJob',
        'scheduleIntervalJob',
        'scheduleTimeoutJob'
      ]);
    });

    it('should build config correctly', async () => {
      const userConfig = {
        myConfig: 123,
        enable: true
      };
      when(configService.get).calledWith('jobs').mockReturnValue({
        [instance.getJobName()]: userConfig
      });
      handlers.scheduleTimeoutJob.mockImplementation(() => { });
      await instance.onModuleInit();

      expect(instance.getConfig()).toMatchObject({
        startTime: null,
        endTime: null,
        type: EJobType.timeout,
        maxRetry: 5,
        retryInterval: 2000,
        ...userConfig
      });

      expect(Scheduler.scheduleTimeoutJob).toBeCalled();
    });

    it('should convert to native DateTime for startTime and endTime', async () => {
      const userConfig = {
        startTime: 'Mon Jun 03 2019',
        endTime: '2019-06-03T04:00:14.803Z',
        enable: true
      };

      when(configService.get).calledWith('jobs').mockReturnValue({
        [instance.getJobName()]: userConfig
      });
      handlers.scheduleTimeoutJob.mockImplementation(() => { });
      await instance.onModuleInit();

      expect(instance.getConfig()).toMatchObject({
        startTime: new Date(userConfig.startTime),
        endTime: new Date(userConfig.endTime),
        type: EJobType.timeout,
        maxRetry: 5,
        retryInterval: 2000
      });
    });

    it('should register timeout job correctly', async () => {
      when(configService.get).calledWith('jobs').mockReturnValue({
        [instance.getJobName()]: { enable: true }
      });
      handlers.scheduleTimeoutJob.mockImplementation(() => { });
      await instance.onModuleInit();

      const config = instance.getConfig();
      expect(handlers.scheduleTimeoutJob).toHaveBeenCalledTimes(1);
      expect(handlers.scheduleTimeoutJob).toBeCalledWith(instance.getJobName(), config.timeout, expect.anything(), config, expect.anything());
      expect(handlers.scheduleCronJob).not.toBeCalled();
      expect(handlers.scheduleIntervalJob).not.toBeCalled();
    });

    it('should register interval job correctly', async () => {
      when(configService.get).calledWith('jobs').mockReturnValue({
        [instance.getJobName()]: {
          type: EJobType.interval,
          interval: 500,
          enable: true
        }
      });
      handlers.scheduleIntervalJob.mockImplementation(() => { });
      await instance.onModuleInit();

      const config = instance.getConfig();
      expect(handlers.scheduleIntervalJob).toHaveBeenCalledTimes(1);
      expect(handlers.scheduleIntervalJob).toBeCalledWith(instance.getJobName(), config.interval, expect.anything(), config, expect.anything());
      expect(handlers.scheduleCronJob).not.toBeCalled();
      expect(handlers.scheduleTimeoutJob).not.toBeCalled();
    });

    it('should register cron job correctly', async () => {
      when(configService.get).calledWith('jobs').mockReturnValue({
        [instance.getJobName()]: {
          type: EJobType.cron,
          cron: '*/1 * * * *',
          enable: true
        }
      });
      handlers.scheduleCronJob.mockImplementation(() => { });
      await instance.onModuleInit();

      const config = instance.getConfig();
      expect(handlers.scheduleCronJob).toHaveBeenCalledTimes(1);
      expect(handlers.scheduleCronJob).toBeCalledWith(instance.getJobName(), config.cron, expect.anything(), config, expect.anything());
      expect(handlers.scheduleIntervalJob).not.toBeCalled();
      expect(handlers.scheduleTimeoutJob).not.toBeCalled();
    });

    it('should pass tryLock to scheduler', async () => {
      when(configService.get).calledWith('jobs').mockReturnValue({
        [instance.getJobName()]: {
          enable: true
        }
      });
      handlers.scheduleTimeoutJob.mockImplementation(() => { });
      const tryLockHandler = jest.spyOn(instance, 'tryLock');
      await instance.onModuleInit();

      const tryLockArgument = handlers.scheduleTimeoutJob.mock.calls[0][4];
      tryLockArgument();
      expect(tryLockHandler).toBeCalled();
      tryLockHandler.mockRestore();
    });

    describe('job executor mechanism', () => {
      let executorHandler: jest.SpyInstance<any>;

      beforeAll(() => {
        executorHandler = jest.spyOn(instance, 'execute');
      });

      beforeEach(() => {
        when(configService.get).calledWith('jobs').mockReturnValue({
          [instance.getJobName()]: { enable: true }
        });
        handlers.scheduleTimeoutJob.mockImplementation(() => { });
      });

      it('should not trigger job if it is running', async () => {
        instance.setRunningState(true);
        await instance.onModuleInit();

        const executor = handlers.scheduleTimeoutJob.mock.calls[0][2];
        await executor();
        expect(executorHandler).not.toBeCalled();
        expect(logger.debug).toBeCalledWith(`Job ${instance.getJobName()} is running. Skipping`);
      });

      it('should trigger job if it is not running', async () => {
        instance.setRunningState(false);
        executorHandler.mockImplementation(() => 'ok ok');
        await instance.onModuleInit();

        const executor = handlers.scheduleTimeoutJob.mock.calls[0][2];
        const ret = await executor();
        expect(executorHandler).toHaveBeenCalledTimes(1);
        expect(ret).toEqual('ok ok');
      });

      it('should change the state isRunning to true before execute job', async () => {
        instance.setRunningState(false);
        executorHandler.mockImplementation(() => {
          expect(instance.getRunningState()).toEqual(true);
          return 'ok ok';
        });
        await instance.onModuleInit();

        const executor = handlers.scheduleTimeoutJob.mock.calls[0][2];
        const ret = await executor();
        expect(instance.getRunningState()).toEqual(false); // switch back to false
        expect(executorHandler).toHaveBeenCalledTimes(1);
        expect(ret).toEqual('ok ok');
      });

      it('should force return false if job does not return anything', async () => {
        instance.setRunningState(false);
        await instance.onModuleInit();

        const executor = handlers.scheduleTimeoutJob.mock.calls[0][2];
        const ret = await executor();
        expect(executorHandler).toHaveBeenCalledTimes(1);
        expect(ret).toEqual(false);
      });

      it('should try catch when execute job', async () => {
        const error = new Error('my error');

        instance.setRunningState(false);
        executorHandler.mockReset();
        executorHandler.mockRejectedValue(error);

        await instance.onModuleInit();

        const executor = handlers.scheduleTimeoutJob.mock.calls[0][2];
        const ret = await executor();
        expect(executorHandler).toHaveBeenCalledTimes(1);
        expect(ret).toEqual(true);
        expect(instance.getRunningState()).toEqual(false); // force running to false
        expect(logger.error).toBeCalledWith({
          message: error.message,
          stack: error.stack,
          jobId: instance.getJobName()
        });
      });
    });
  });

  describe('cancelJob', () => {
    it('should cancel the job', () => {
      const handler = jest.spyOn(Scheduler, 'cancelJob');
      handler.mockImplementation(() => { });
      instance.cancelJob();
      expect(handler).toBeCalledWith(instance.getJobName());
      handler.mockRestore();
    });
  });
});
