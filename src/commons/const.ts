export const IOC_KEY = Symbol('ioc');

export const PROVIDERS = {
  ROOT_LOGGER: 'rootLogger',
  REDIS: 'redis'
};

export enum EMailStatus {
  /** Just insert mail document */
  Init = 'init',

  /** Attempt to send with a mail provider */
  Attempt = 'Attemp',

  /** Mail sending successfully */
  Success = 'Success',

  /** Can not send email after configured retries */
  Fail = 'Fail'
}

export const QUEUES = {
  MAIN: 'main',
  DEADLETTER: 'dead'
};

export const JOB_IDS = {
  MAIL_RECOVERY: 'mail-recover'
};

export const QUEUE_NAMESPACE = 'rsmq';

export const QUEUE_RETRY_CHECK = 5; // Retry pull this message from the queue again in 5s

/**
 * Maximum items to be fetched when idle
 */
export const QUEUE_MAXFETCH = 50;
/**
 * Maximum idle time for the queue consumer
 */
export const QUEUE_MAXIDLE = 1000 * 5;

export enum EMailProcessingStatus {
  Success = 'Success', Retry = 'Retry', Outdated = 'Outdated'
}
