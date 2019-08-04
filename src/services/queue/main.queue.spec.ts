import { MainQueue } from './main.queue';
import { IOC_KEY, QUEUES } from '../../commons';

describe('/src/services/queue/main.queue.ts', () => {
  describe('IoC', () => {
    it('should have class information as expected', () => {
      expect(MainQueue[IOC_KEY]).not.toBeUndefined();
      expect(MainQueue[IOC_KEY]).toMatchObject({
        provide: QUEUES.MAIN,
        useClass: MainQueue
      });
    });
  });
});
