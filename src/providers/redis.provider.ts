import { FactoryProvider } from '@nestjs/common/interfaces';
import * as Redis from 'ioredis';
import * as Bluebird from 'bluebird';
import { memoize } from 'lodash';
import { PROVIDERS } from '../commons/const';
import { IConfiguration, ILoggerInstance } from '../commons/interfaces';
(Redis as any).Promise = Promise;

/**
 * Create new redis connection, wait until connection established
 */
export const newRedisConnection: (config: IConfiguration, logger: ILoggerInstance, name?: string) => Bluebird<Redis.Redis> = memoize((config: IConfiguration, logger: ILoggerInstance, connectionName?: string) => {
  return new Bluebird<Redis.Redis>((resolve) => {
    const { host, port, db, keyPrefix } = config.get('redis');
    const redis = new Redis({
      connectionName,
      host,
      port,
      db,
      keyPrefix,
      enableReadyCheck: true,
      enableOfflineQueue: false
    });
    redis.on('error', async (error) => {
      logger.error(`Redis connection error ${JSON.stringify(error)}`);
      // try to reconnect
      await redis.connect();
    });
    redis.on('ready', () => resolve(redis));
  }).timeout(6000, 'Redis unavailable');
}, (...args: any[]) => ((args.length === 3) ? args[2] : '') + '-redis');

export const providerRedis: FactoryProvider = {
  provide: PROVIDERS.REDIS,
  inject: [IConfiguration, PROVIDERS.ROOT_LOGGER],
  useFactory: (config: IConfiguration, logger: ILoggerInstance) => newRedisConnection(config, logger)
};
