import { Inject, Injectable } from '@nestjs/common';
import { ClassProvider } from '@nestjs/common/interfaces';
import { QueueBase } from './queue.base';
import { IConfiguration, ILoggerInstance, PROVIDERS, QUEUES, IOC_KEY } from '../../commons';

@Injectable()
export class DeadQueue extends QueueBase {
  /**
   * This queue does not need realtime
   *
   * @protected
   * @type {boolean}
   * @memberof MainQueue
   */
  protected realtime: boolean = false;

  constructor(
    protected readonly configService: IConfiguration,
    @Inject(PROVIDERS.ROOT_LOGGER)
    protected readonly logger: ILoggerInstance
  ) {
    super(QUEUES.DEADLETTER);
  }

  static get [IOC_KEY](): ClassProvider {
    return {
      provide: QUEUES.DEADLETTER,
      useClass: DeadQueue
    };
  }
}
