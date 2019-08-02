import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as _ from 'lodash';
import { AppModule } from '../src/modules/app.module';
import { NoopLogger } from '../src/commons/test-helper';
import { PROVIDERS } from '../src/commons';

/**
 * Integration test for Jobs
 */
describe('/src/app.ts', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [
        AppModule
      ]
    })
      .overrideProvider(PROVIDERS.ROOT_LOGGER)
      .useValue(NoopLogger)
      .compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Common', () => {
    describe('GET /health', () => {
      it('should return HTTP 200', () => {
        return request(app.getHttpServer())
          .get('/health')
          .expect(200)
          .then((res) => {
            expect(res.body).toMatchObject({
              name: 'nest-mail-service',
              version: expect.anything()
            });
          });
      });
    });

    describe('HEAD /health', () => {
      it('should return HTTP 200', () => {
        return request(app.getHttpServer())
          .head('/health')
          .expect(200);
      });
    });
  });
});
