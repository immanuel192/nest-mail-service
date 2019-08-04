import { Cursor, MongoCallback, FindOneOptions, InsertWriteOpResult, CollectionInsertManyOptions, InsertOneWriteOpResult, CollectionInsertOneOptions, ReplaceOneOptions, UpdateWriteOpResult, CommonOptions } from 'mongodb';
import { FactoryProvider } from '@nestjs/common/interfaces';
import { IOC_KEY, IDatabaseInstance } from '../commons';
import { MailModel } from '../models/mail.model';

/**
 * Abstract collection class to help us easier register collection into IoC
 */
abstract class Collection<TSchema>{
  abstract find<T = TSchema>(query?: Object): Cursor<T>;
  abstract findOne<T = TSchema>(filter: Object, callback: MongoCallback<T | null>): void;
  abstract findOne<T = TSchema>(filter: Object, options?: FindOneOptions): Promise<T | null>;
  abstract findOne<T = TSchema>(filter: Object, options: FindOneOptions, callback: MongoCallback<T | null>): void;

  abstract insertMany(docs: Object[], callback: MongoCallback<InsertWriteOpResult>): void;
  abstract insertMany(docs: Object[], options?: CollectionInsertManyOptions): Promise<InsertWriteOpResult>;
  abstract insertMany(docs: Object[], options: CollectionInsertManyOptions, callback: MongoCallback<InsertWriteOpResult>): void;
  /** http://mongodb.github.io/node-mongodb-native/3.0/api/Collection.html#insertOne */
  abstract insertOne(docs: Object, callback: MongoCallback<InsertOneWriteOpResult>): void;
  abstract insertOne(docs: Object, options?: CollectionInsertOneOptions): Promise<InsertOneWriteOpResult>;
  abstract insertOne(docs: Object, options: CollectionInsertOneOptions, callback: MongoCallback<InsertOneWriteOpResult>): void;

  abstract updateMany(filter: Object, update: Object, callback: MongoCallback<UpdateWriteOpResult>): void;
  abstract updateMany(filter: Object, update: Object, options?: CommonOptions & { upsert?: boolean }): Promise<UpdateWriteOpResult>;
  abstract updateMany(filter: Object, update: Object, options: CommonOptions & { upsert?: boolean }, callback: MongoCallback<UpdateWriteOpResult>): void;
  /** http://mongodb.github.io/node-mongodb-native/3.0/api/Collection.html#updateOne */
  abstract updateOne(filter: Object, update: Object, callback: MongoCallback<UpdateWriteOpResult>): void;
  abstract updateOne(filter: Object, update: Object, options?: ReplaceOneOptions): Promise<UpdateWriteOpResult>;
  abstract updateOne(filter: Object, update: Object, options: ReplaceOneOptions, callback: MongoCallback<UpdateWriteOpResult>): void;
}

export abstract class IMailCollection extends Collection<MailModel> {
  static get [IOC_KEY](): FactoryProvider {
    return {
      provide: IMailCollection,
      inject: [IDatabaseInstance],
      useFactory: (db: IDatabaseInstance) => db.collection('mails')
    };
  }
}
