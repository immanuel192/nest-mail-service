import { Inject, Injectable } from '@nestjs/common';
import { ClassProvider } from '@nestjs/common/interfaces';
import { QueueBase } from './queue.base';
import { IConfiguration, ILoggerInstance, PROVIDERS, QUEUES, IOC_KEY } from '../../commons';

@Injectable()
export class MainQueue extends QueueBase {

  /**
   * This queue will support realtime
   *
   * @protected
   * @type {boolean}
   * @memberof MainQueue
   */
  protected realtime: boolean = true;

  constructor(
    protected readonly configService: IConfiguration,
    @Inject(PROVIDERS.ROOT_LOGGER)
    protected readonly logger: ILoggerInstance
  ) {
    super(QUEUES.MAIN);
  }

  static get [IOC_KEY](): ClassProvider {
    return {
      provide: QUEUES.MAIN,
      useClass: MainQueue
    };
  }
}
