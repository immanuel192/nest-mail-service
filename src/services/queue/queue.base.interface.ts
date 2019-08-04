import { QueueMessageDto } from '../../dto';

/**
 * Queue interface for worker
 */
export abstract class IQueueRetrieveOnly {
  /**
   * Fetch message from queue
   * @returns Message id
   */
  abstract receive(): Promise<QueueMessageDto>;

  /**
   * Delete message by id
   * @param id
   */
  abstract delete(id: number): Promise<boolean>;

  /**
   * Update message visibility
   * @param id Message id
   * @param vt New message visibility, in seconds
   */
  abstract updateVisibility(id: number, vt: number): Promise<boolean>;
}

/**
 * Queue interface in general
 */
export abstract class IQueue extends IQueueRetrieveOnly {
  /**
   * Send message to queue.
   * @param message
   * @returns Message id
   */
  abstract send(message: string): Promise<number>;
}
