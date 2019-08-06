import * as Bluebird from 'bluebird';
import { OnModuleInit, Inject, OnModuleDestroy } from '@nestjs/common';
import { Redis } from 'ioredis';
import { Subject, timer, Observable } from 'rxjs';
import { bufferTime } from 'rxjs/operators';
import { IQueueConsumer } from './queue.base.interface';
import { IConfiguration, ILoggerInstance, PROVIDERS, QUEUE_NAMESPACE, EMailProcessingStatus, QUEUE_RETRY_CHECK, QUEUE_MAXIDLE, QUEUE_MAXFETCH } from '../../commons';
import { newRedisConnection } from '../../providers/redis.provider';
import { QueueMessageDto } from '../../dto';

/**
 * Consumer queue base
 */
export abstract class QueueConsumerBase implements OnModuleInit, OnModuleDestroy {
  @Inject(PROVIDERS.ROOT_LOGGER)
  protected readonly logger: ILoggerInstance;
  @Inject(IConfiguration)
  protected readonly configService: IConfiguration;

  /**
   * Subcribe redis client, for realtime listen to the PUBLISH command
   *
   * @protected
   * @type {Redis}
   * @memberof QueueConsumerBase
   */
  protected subcribeRedis: Redis;
  /**
   * Redis channel name
   *
   * @protected
   * @type {string}
   * @memberof QueueConsumerBase
   */
  protected channelName: string;
  /**
   * Internal observable, to continuously
   *
   * @protected
   * @type {Subject<any>}
   * @memberof QueueConsumerBase
   */
  private rxObservableBuffer: Subject<any>;
  private rxObservableTicker: Observable<number>;
  /**
   * Last time (in number) we process a message. To make sure that we dont miss any message in the queue
   *
   * @private
   * @type {number}
   * @memberof QueueConsumerBase
   */
  private lastProcessOn: number = Date.now();

  constructor(
    protected readonly queue: IQueueConsumer,
    private readonly queueName: string
  ) { }

  /**
   * Try to process the message
   *
   * Possible return cases:
   * - `EMailInQueueProcessingStatus.Success`: Message will be deleted
   * - `EMailInQueueProcessingStatus.Retry`: Message will be putted back to the queue for next retry
   * - `EMailInQueueProcessingStatus.Outdated`: No need to do anything, message will be deleted. Usually because the item has been processed while message still in the queue
   * @param message
   */
  abstract onMesage(message: QueueMessageDto): Promise<EMailProcessingStatus>;

  async onModuleInit() {
    this.subcribeRedis = await newRedisConnection(this.configService, this.logger, this.queueName);
    await this.subscribeRedis();
    await this.initRx();
  }

  onModuleDestroy() {
    this.subcribeRedis.quit();
    this.rxObservableBuffer.complete();
  }

  private initRx() {
    /**
     * I use observable in Rxjs to try prevent backpressure
     */
    this.rxObservableBuffer = new Subject();
    this.rxObservableBuffer
      .pipe(bufferTime(50))
      .subscribe(args => Bluebird.map([...args], m => this.attempProcessMessage(m), { concurrency: 5 }));

    // In case that we miss anything, actively to pull data from the queue
    this.rxObservableTicker = timer(2000, 5000);
    this.rxObservableTicker.subscribe(() => {
      if (Date.now() - this.lastProcessOn > QUEUE_MAXIDLE) {
        return this.tryFetchOnIdle();
      }
      return null;
    });
  }

  private subscribeRedis() {
    this.channelName = `${QUEUE_NAMESPACE}:rt:${this.queueName}`;
    this.subcribeRedis.subscribe(this.channelName);
    this.subcribeRedis.on('message', (channel: string) => {
      if (channel === this.channelName) {
        // trigger our internal event to fetch message from queue
        this.rxObservableBuffer.next();
      }
    });
  }

  /**
   * Try to fetch at most QUEUE_MAXFETCH messages from the queue
   */
  private async tryFetchOnIdle() {
    for (let i = 0; i < QUEUE_MAXFETCH; i++) {
      const message = await this.queue.receive();
      if (!message) {
        break;
      }
      this.rxObservableBuffer.next(message);
    }
  }

  /**
   * Attempt to either fetch one message from queue OR process the prefetched one
   * @param prefetchedMessage Prefetched message from the queue
   */
  private async attempProcessMessage(prefetchedMessage?: QueueMessageDto) {
    const message = (prefetchedMessage && prefetchedMessage.id) ? prefetchedMessage : (await this.queue.receive());
    if (message) {
      try {
        this.logger.debug(`Executing worker for message ${message.message}`);
        const executeResult = await this.onMesage(message);
        this.logger.debug(`Worker processed doc ${message.message} with status ${executeResult}`);
        if (executeResult === EMailProcessingStatus.Outdated || executeResult === EMailProcessingStatus.Success) {
          await this.queue.delete(message.id);
        }

        if (executeResult === EMailProcessingStatus.Retry) {
          await this.queue.updateVisibility(message.id, QUEUE_RETRY_CHECK);
        }
      }
      catch (e) {
        this.logger.error(`Unsuccessful processing message ${message.message} with error ${e.message}`, e.stack);
      }
      finally {
        this.lastProcessOn = Date.now();
      }
    }
  }
}
