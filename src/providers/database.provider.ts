import { Injectable, Inject } from '@nestjs/common';
import { ClassProvider } from '@nestjs/common/interfaces';
import * as mongodb from 'mongodb';
import * as _ from 'lodash';
import * as url from 'url';
import { IConfiguration, IDatabaseInstance, ILoggerInstance } from '../commons/interfaces';
import { IOC_KEY, PROVIDERS } from '../commons';

const configName = 'mongodb';

@Injectable()
export class Database implements IDatabaseInstance {
  protected mongoClient: mongodb.MongoClient = null;
  protected database: mongodb.Db = null;
  protected connectionString: string = '';
  protected dbName: string = '';
  protected authSource: string;

  static get [IOC_KEY](): ClassProvider {
    return {
      provide: IDatabaseInstance,
      useClass: Database
    };
  }

  constructor(
    configService: IConfiguration,
    @Inject(PROVIDERS.ROOT_LOGGER)
    private readonly logger: ILoggerInstance
  ) {
    const config = configService.get(configName);
    this.connectionString = url.format({
      protocol: 'mongodb',
      slashes: true,
      auth: config.user ? (
        config.user + (config.password ? ':' + config.password : '')
      ) : undefined,
      host: config.host,
      pathname: config.database,
      query: config.replicaSet ? { replicaSet: config.replicaSet } : undefined
    });
    this.dbName = config.database;
    this.authSource = config.authSource;
  }

  async open(options?: any): Promise<mongodb.Db> {
    const o: mongodb.MongoClientOptions = _.defaultsDeep({}, options || {}, {
      authSource: this.authSource,
      reconnectTries: Number.MAX_VALUE,
      promiseLibrary: Promise
    });
    this.logger.debug('Establishing connection to mongodb');
    const client = await mongodb.MongoClient.connect(this.connectionString, o);
    this.database = client.db(this.dbName);
    this.mongoClient = client;
    return this.database;
  }

  async collection<T = any>(name: string) {
    const db = this.database || await this.open();
    this.logger.debug(`Retrieving collect ${name}`);
    return db.collection<T>(name);
  }

  close() {
    if (this.mongoClient) {
      this.mongoClient.close();
    }
    this.database = null;
  }
}
