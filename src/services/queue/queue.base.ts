import * as RSMQ from 'rsmq';
import { OnModuleInit } from '@nestjs/common';
import { IConfiguration, ILoggerInstance, QUEUE_NAMESPACE } from '../../commons';
import { QueueMessageDto } from '../../dto';
import { IQueueProducer, IQueueConsumer } from './queue.base.interface';

/**
 * Base queue
 */
export abstract class QueueBase implements IQueueProducer, IQueueConsumer, OnModuleInit {
  protected abstract configService: IConfiguration;
  protected abstract logger: ILoggerInstance;
  protected connection: RSMQ;

  /**
   * Whether we will support realtime or not
   */
  protected realtime: boolean = false;

  constructor(
    private readonly queueName: string
  ) { }

  async onModuleInit() {
    this.logger.debug(`Init queue ${this.queueName}`);
    const redisConfig = this.configService.get('redis');
    this.connection = new RSMQ({
      host: redisConfig.host,
      port: redisConfig.port,
      ns: QUEUE_NAMESPACE,
      realtime: this.realtime,
      db: redisConfig.db
    } as any);
    const queues = await this.connection.listQueuesAsync();
    if (!queues.includes(this.queueName)) {
      const result = await this.connection.createQueueAsync({
        qname: this.queueName,
        vt: 20
      });
      if (result !== 1) {
        throw new Error(`Creating queue ${this.queueName} unsuccessful`);
      }
      this.logger.debug(`Created queue ${this.queueName}`);
    }
  }

  send(message: string) {
    return this.connection.sendMessageAsync({
      message,
      qname: this.queueName
    });
  }

  receive(): Promise<QueueMessageDto> {
    return this.connection.receiveMessageAsync({ qname: this.queueName })
      .then((message: QueueMessageDto) => (message.id ? message : null));
  }

  delete(id: number): Promise<boolean> {
    return this.connection.deleteMessageAsync({ id: id.toString(10), qname: this.queueName }).then(t => t === 1);
  }

  updateVisibility(id: number, vt: number): Promise<boolean> {
    return this.connection.changeMessageVisibilityAsync({
      vt,
      id: id.toString(10),
      qname: this.queueName
    }).then(t => t === 1);
  }
}
