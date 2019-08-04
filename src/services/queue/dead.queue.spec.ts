import { DeadQueue } from './dead.queue';
import { IOC_KEY, QUEUES } from '../../commons';

describe('/src/services/queue/dead.queue.ts', () => {
  describe('IoC', () => {
    it('should have class information as expected', () => {
      expect(DeadQueue[IOC_KEY]).not.toBeUndefined();
      expect(DeadQueue[IOC_KEY]).toMatchObject({
        provide: QUEUES.DEADLETTER,
        useClass: DeadQueue
      });
    });
  });
});
