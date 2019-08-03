import { providerRedis } from './redis.provider';
import { PROVIDERS } from '../commons';

describe('/src/providers/redis.provider.ts', () => {
  it('should register as REDIS factory provider', () => {
    expect(providerRedis).toMatchObject({
      provide: PROVIDERS.REDIS,
      useFactory: expect.anything()
    });
  });
});
