import { IDatabaseInstance } from './interfaces';

export function createMongoDbIndexes(db: IDatabaseInstance) {
  return db.collection('mails')
    .then((collection) => {
      return collection.createIndexes([
        {
          key: {
            'status.type': 1
          },
          background: true
        }
      ]);
    });
}
