export interface QueueMessageDto {
  /**
   * The message's contents.
   *
   * @type {string}
   * @memberof QueueMessage
   */
  message: string;

  /**
   * The internal message id.
   *
   * @type {string}
   * @memberof QueueMessage
   */
  id: number;

  /**
   * Timestamp of when this message was sent / created.
   *
   * @type {number}
   * @memberof QueueMessage
   */
  sent: number;

  /**
   * Timestamp of when this message was first received.
   *
   * @type {number}
   * @memberof QueueMessage
   */
  fr: number;

  /**
   * Number of times this message was received.
   *
   * @type {number}
   * @memberof QueueMessage
   */
  rc: number;
}
