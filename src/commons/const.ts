export const IOC_KEY = Symbol('ioc');

export const PROVIDERS = {
  ROOT_LOGGER: 'rootLogger',
  REDIS: 'redis'
};

export enum EMailSendingStatus {
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
