import * as RSMQ from 'rsmq';
import { OnModuleInit } from '@nestjs/common';
import { IConfiguration, ILoggerInstance } from '../../commons';
import { QueueMessageDto } from '../../dto';
import { IQueue } from './queue.base.interface';

/**
 * Base queue
 */
export abstract class QueueBase implements IQueue, OnModuleInit {
  protected abstract configService: IConfiguration;
  protected abstract logger: ILoggerInstance;
  protected connection: RSMQ;

  constructor(
    private readonly queueName: string
  ) { }

  async onModuleInit() {
    this.logger.debug(`Init queue ${this.queueName}`);
    const redisConfig = this.configService.get('redis');
    this.connection = new RSMQ({
      host: redisConfig.host,
      port: redisConfig.port,
      realtime: false,
      db: redisConfig.db
    } as any);
    const queues = await this.connection.listQueuesAsync();
    if (!queues.includes(this.queueName)) {
      const result = await this.connection.createQueueAsync({ qname: this.queueName });
      if (result !== 1) {
        throw new Error(`Creating queue ${this.queueName} unsuccessful`);
      }
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
