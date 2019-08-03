import * as mongodb from 'mongodb';
import { Database } from './database.provider';
import { IOC_KEY, IDatabaseInstance } from '../commons';
import { loggerMock, configMock, when } from '../commons/test-helper';

const logger = loggerMock();
const config = configMock();
const configDefaultKey = 'mongodb';

class FakeDatabase extends Database {
  getByName(name: string) {
    return (this as any)[name];
  }

  setByName(name: string, value: any) {
    (this as any)[name] = value;
  }
}

describe('/src/providers/database.provider.ts', () => {
  let instance: FakeDatabase;

  beforeAll(() => {
    when(config.get).calledWith(configDefaultKey).mockReturnValue({
      host: 'localhost:27020',
      user: 'myUser',
      password: 'myPassword',
      database: 'mails',
      replicaSet: 'myReplicaSet'
    });
    instance = new FakeDatabase(config, logger);

    // verify the constructor
    expect(instance.getByName('connectionString')).toEqual('mongodb://myUser:myPassword@localhost:27020/mails?replicaSet=myReplicaSet');
    expect(instance.getByName('dbName')).toEqual('mails');
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('ioc', () => {
    it('should register as IDatabaseInstance', () => {
      expect(Database[IOC_KEY]).toMatchObject({
        provide: IDatabaseInstance,
        useClass: Database
      });
    });
  });

  describe('open', () => {
    let connectSpyHandler: jest.SpyInstance;

    beforeAll(() => {
      connectSpyHandler = jest.spyOn(mongodb.MongoClient, 'connect');
    });

    afterAll(() => {
      connectSpyHandler.mockRestore();
    });

    it('should open new connection with default options', async () => {
      const connectionString = instance.getByName('connectionString');
      const dbName = instance.getByName('dbName');
      const expectDbInstance = { a: 1, b: 2 };

      const fakeClient = {
        db: jest.fn()
      };
      when(fakeClient.db).calledWith(dbName).mockReturnValue(expectDbInstance);
      connectSpyHandler.mockReturnValue(fakeClient);

      await instance.open();
      expect(connectSpyHandler).toBeCalledWith(connectionString, {
        authSource: instance.getByName('authSource'),
        reconnectTries: Number.MAX_VALUE,
        promiseLibrary: Promise
      });
      expect(instance.getByName('database')).toStrictEqual(expectDbInstance);
      expect(instance.getByName('mongoClient')).toStrictEqual(fakeClient);

      expect(logger.debug).toBeCalledWith('Establishing connection to mongodb');
    });

    it('should open new connection with custom options', async () => {
      const connectionString = instance.getByName('connectionString');
      const dbName = instance.getByName('dbName');
      const expectDbInstance = { a: 1, b: 2 };

      const fakeClient = {
        db: jest.fn()
      };
      when(fakeClient.db).calledWith(dbName).mockReturnValue(expectDbInstance);
      connectSpyHandler.mockReturnValue(fakeClient);

      await instance.open({
        authSource: 'test',
        promiseLibrary: null
      });
      expect(connectSpyHandler).toBeCalledWith(connectionString, {
        authSource: 'test',
        reconnectTries: Number.MAX_VALUE,
        promiseLibrary: null
      });
      expect(instance.getByName('database')).toStrictEqual(expectDbInstance);
      expect(instance.getByName('mongoClient')).toStrictEqual(fakeClient);
    });

    it('should support no auth user config', () => {
      config.get.mockReset();
      when(config.get).calledWith(configDefaultKey).mockReturnValue({
        host: 'localhost:27020',
        user: '',
        password: '',
        database: 'mails',
        replicaSet: 'myReplicaSet'
      });
      instance = new FakeDatabase(config, logger);
      expect(instance.getByName('connectionString')).toEqual('mongodb://localhost:27020/mails?replicaSet=myReplicaSet');
    });

    it('should support auth with no password', () => {
      config.get.mockReset();
      when(config.get).calledWith(configDefaultKey).mockReturnValue({
        host: 'localhost:27020',
        user: 'trung',
        password: '',
        database: 'mails',
        replicaSet: 'myReplicaSet'
      });
      instance = new FakeDatabase(config, logger);
      expect(instance.getByName('connectionString')).toEqual('mongodb://trung@localhost:27020/mails?replicaSet=myReplicaSet');
    });
  });

  describe('collection', () => {
    const fakeDbObject = {
      collection: jest.fn()
    };

    it('should open connection if have not established connection yet', async () => {
      const expectCollectionObject = { a: 1, b: 2 };
      instance.setByName('database', null);
      const spyOpenHandler = jest.spyOn(instance, 'open');
      spyOpenHandler.mockResolvedValue(fakeDbObject);
      fakeDbObject.collection.mockReset();
      when(fakeDbObject.collection).calledWith('myCollection').mockResolvedValue(expectCollectionObject);

      const collection = await instance.collection('myCollection');

      expect(collection).toMatchObject(expectCollectionObject);
      expect(logger.debug).toBeCalledWith('Retrieving collect myCollection');
      expect(spyOpenHandler).toHaveBeenCalledTimes(1);

      spyOpenHandler.mockRestore();
    });

    it('should not open connection if already established', async () => {
      instance.setByName('database', fakeDbObject);
      const spyOpenHandler = jest.spyOn(instance, 'open');
      fakeDbObject.collection.mockReset();

      await instance.collection('myCollection');

      expect(spyOpenHandler).not.toBeCalled();

      spyOpenHandler.mockRestore();
    });
  });

  describe('close', () => {
    it('should close the connection if alreay established', () => {
      const fakeClient = {
        close: jest.fn()
      };
      instance.setByName('mongoClient', fakeClient);
      instance.setByName('database', 'fake value, should be cleared after close');
      instance.close();

      expect(instance.getByName('database')).toStrictEqual(null);
      expect(fakeClient.close).toHaveBeenCalledTimes(1);
    });

    it('should clear the db info but not close connection', () => {
      instance.setByName('mongoClient', null);
      instance.setByName('database', 'fake value, should be cleared after close');
      instance.close();

      expect(instance.getByName('database')).toStrictEqual(null);
    });
  });
});
