import { IDatabaseInstance } from './interfaces';

export function createMongoDbIndexes(db: IDatabaseInstance) {
  return db.collection('mails')
    .then((collection) => {
      return collection.createIndexes([
        {
          key: {
            test: 1 // need to update field later
          },
          background: true
        }
      ]);
    });
}
