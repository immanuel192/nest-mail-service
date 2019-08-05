import { OnModuleInit, Inject } from '@nestjs/common';
import { merge, get } from 'lodash';
import { Scheduler } from 'nest-schedule/dist/scheduler';
import { IJobConfig, EJobType } from './jobabstract.interface';
import { ILoggerInstance, IConfiguration, PROVIDERS } from '../../commons';

export abstract class JobAbstract implements OnModuleInit {
  /**
   * Job name
   */
  protected abstract jobName: string;
  @Inject(PROVIDERS.ROOT_LOGGER)
  protected readonly logger: ILoggerInstance;
  /**
   * Job Config
   */
  protected config: IJobConfig = {
    type: EJobType.timeout,
    maxRetry: 5,
    retryInterval: 2000
  };
  protected isRunning: boolean = false;

  @Inject(IConfiguration) protected readonly configService: IConfiguration;

  /**
   * Job main entry point to execute your business logic. Return true to stop the job
   */
  abstract execute(): void | Promise<void> | boolean | Promise<boolean>;

  cancelJob() {
    Scheduler.cancelJob(this.jobName);
  }

  /**
   * Mutex Lock acquirer. By default always return true
   */
  tryLock(_key?: string | number): boolean | (() => void) | Promise<TryRelease> {
    return true;
  }

  onModuleInit() {
    const userConfig = get(this.configService.get<IJobConfig>('jobs'), this.jobName, {}) as IJobConfig;
    if (!userConfig.enable) {
      this.logger.debug(`Ignore job ${this.jobName} due to not enable`);
    }
    this.logger.debug(`Registering job ${this.jobName}`);

    if (userConfig.startTime) {
      userConfig.startTime = new Date(userConfig.startTime);
      userConfig.endTime = new Date(userConfig.endTime);
    }
    this.config = merge({
      startTime: null,
      endTime: null
    } as any, this.config, userConfig);

    const executor = async () => {
      try {
        if (this.isRunning) {
          this.logger.debug(`Job ${this.jobName} is running. Skipping`);
          return false;
        }
        this.isRunning = true;
        const result = await this.execute();
        return result || false;
      }
      catch (err) {
        this.logger.error({
          message: err.message,
          stack: err.stack,
          jobId: this.jobName
        });
        return true;
      }
      finally {
        this.isRunning = false;
      }
    };

    switch (this.config.type) {
      case EJobType.cron:
        Scheduler.scheduleCronJob(this.jobName, this.config.cron, executor, this.config, this.tryLock.bind(this));
        break;
      case EJobType.interval:
        Scheduler.scheduleIntervalJob(this.jobName, this.config.interval, executor, this.config, this.tryLock.bind(this));
        break;
      case EJobType.timeout:
        Scheduler.scheduleTimeoutJob(this.jobName, this.config.timeout, executor, this.config, this.tryLock.bind(this));
        break;
    }
  }
}
