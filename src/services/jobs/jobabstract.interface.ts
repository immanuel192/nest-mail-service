import { ICronJobConfig } from 'nest-schedule';

export enum EJobType {
  cron = 'cron',
  interval = 'interval',
  timeout = 'timeout'
}

export interface IJobConfig extends ICronJobConfig {
  type: EJobType;
  cron?: string;
  interval?: number;
  timeout?: number;
}
