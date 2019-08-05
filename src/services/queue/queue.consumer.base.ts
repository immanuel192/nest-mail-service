import { OnModuleInit, Inject, OnModuleDestroy } from '@nestjs/common';
import { Redis } from 'ioredis';
import { IQueueConsumer } from './queue.base.interface';
import { IConfiguration, ILoggerInstance, PROVIDERS, QUEUE_NAMESPACE, EMailInQueueProcessingStatus, QUEUE_RETRY_CHECK } from '../../commons';
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
  @Inject(PROVIDERS.REDIS)
  protected readonly redis: Redis;

  /**
   * Subcribe redis client, for realtime listen to the PUBLISH command
   *
   * @protected
   * @type {Redis}
   * @memberof QueueConsumerBase
   */
  protected subcribeRedis: Redis;
  protected channelName: string;
  protected MAX_CONCURRENT = 3;

  constructor(
    protected readonly queue: IQueueConsumer,
    private readonly queueName: string
  ) { }

  /**
   * Try to process the message
   * @param message
   * @returns Return true to delete the message. Any exception or not return anything will return the message back to the queue
   */
  abstract onMesage(message: QueueMessageDto): Promise<EMailInQueueProcessingStatus>;

  private async getTotalConcurrent() {
    const keys = await this.redis.keys(`${this.queueName}:*`);
    return keys.length;
  }

  private incTotalConcurrent() {
    const key = `${this.queueName}:${Math.random()}`;
    return this.redis.multi()
      .set(key, 1)
      .expire(key, 20)
      .exec();
  }

  private async decTotalConcurrent() {
    const keys = await this.redis.keys(`${this.queueName}:*`);
    const key = keys[0];
    await this.redis.del(key);
  }

  /**
   * @todo Try to implement the queue exceed
   */
  private async tryFetchMessage() {
    let currentConcurrent = await this.getTotalConcurrent();
    if (currentConcurrent >= this.MAX_CONCURRENT) {
      this.logger.debug(`Abort message due to exceed ${currentConcurrent}/${this.MAX_CONCURRENT} processes`);
      return;
    }

    const message = await this.queue.receive();
    if (message) {
      try {
        await this.incTotalConcurrent();
        this.logger.debug(`Executing worker for message ${message.message}, total ${currentConcurrent} concurrent processes `);
        const executeResult = await this.onMesage(message);
        this.logger.debug(`Worker processed doc ${message.message} with status ${executeResult}`);
        if (executeResult === EMailInQueueProcessingStatus.Outdated || executeResult === EMailInQueueProcessingStatus.Success) {
          await this.queue.delete(message.id);
        }

        if (executeResult === EMailInQueueProcessingStatus.Retry) {
          await this.queue.updateVisibility(message.id, QUEUE_RETRY_CHECK);
        }
      }
      catch (e) {
        this.logger.error(`Unsuccessful processing message ${message.message} with error ${e.message}`, e.stack);
      }
      finally {
        await this.decTotalConcurrent();
        currentConcurrent = await this.getTotalConcurrent();
        this.logger.debug(`Adjust concurrent process to ${currentConcurrent}`);
      }
    }
  }

  async onModuleInit() {
    this.subcribeRedis = await newRedisConnection(this.configService, this.logger, this.queueName);
    await this.subscribe();
  }

  onModuleDestroy() {
    this.subcribeRedis.quit();
  }

  private subscribe() {
    this.channelName = `${QUEUE_NAMESPACE}:rt:${this.queueName}`;
    this.subcribeRedis.subscribe(this.channelName);
    this.subcribeRedis.on('message', async (channel: string) => {
      if (channel === this.channelName) {
        await this.tryFetchMessage();
      }
    });
  }
}
