import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as _ from 'lodash';
import { NoopLogger, randomString } from '../src/commons/test-helper';
import { PROVIDERS, EMailStatus } from '../src/commons';
import { MailModule } from '../src/modules/mail.module';
import { GlobalModule } from '../src/modules/global.module';
import { IMailService } from '../src/services';

describe('/test/mail.e2e-spec.ts', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [
        GlobalModule.forRoot(),
        MailModule
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

  describe('Email endpoints', () => {
    describe('POST /api/emails', () => {
      describe('validation', () => {
        it('when request without title then return 400', () => {
          return request(app.getHttpServer())
            .post('/api/emails')
            .send({})
            .set('accept', 'json')
            .expect(400)
            .then((ret) => {
              expect(ret.body.message).toEqual(expect.arrayContaining([
                expect.objectContaining({
                  property: 'title',
                  constraints: expect.objectContaining({
                    isString: 'title must be a string'
                  })
                })
              ]));
            });
        });

        it('when request with empty title then return 400', () => {
          return request(app.getHttpServer())
            .post('/api/emails')
            .send({
              title: ''
            })
            .set('accept', 'json')
            .expect(400)
            .then((ret) => {
              expect(ret.body.message).toEqual(expect.arrayContaining([
                expect.objectContaining({
                  property: 'title',
                  constraints: expect.objectContaining({
                    minLength: 'title must be longer than or equal to 1 characters'
                  })
                })
              ]));
            });
        });

        it('when request with empty content then return 400', () => {
          return request(app.getHttpServer())
            .post('/api/emails')
            .send({
              content: ''
            })
            .set('accept', 'json')
            .expect(400)
            .then((ret) => {
              expect(ret.body.message).toEqual(expect.arrayContaining([
                expect.objectContaining({
                  property: 'content',
                  constraints: expect.objectContaining({
                    minLength: 'content must be longer than or equal to 1 characters'
                  })
                })
              ]));
            });
        });

        it('when request without content then return 400', () => {
          return request(app.getHttpServer())
            .post('/api/emails')
            .send({})
            .set('accept', 'json')
            .expect(400)
            .then((ret) => {
              expect(ret.body.message).toEqual(expect.arrayContaining([
                expect.objectContaining({
                  property: 'content',
                  constraints: expect.objectContaining({
                    isString: 'content must be a string'
                  })
                })
              ]));
            });
        });

        describe('field to', () => {
          it('when request with empty to then return 400', () => {
            return request(app.getHttpServer())
              .post('/api/emails')
              .send({
                to: ''
              })
              .set('accept', 'json')
              .expect(400)
              .then((ret) => {
                expect(ret.body.message).toEqual(expect.arrayContaining([
                  expect.objectContaining({
                    property: 'to',
                    constraints: expect.objectContaining({
                      isArray: 'to must be an array'
                    })
                  })
                ]));
              });
          });

          it('when request without to then return 400', () => {
            return request(app.getHttpServer())
              .post('/api/emails')
              .send({})
              .set('accept', 'json')
              .expect(400)
              .then((ret) => {
                expect(ret.body.message).toEqual(expect.arrayContaining([
                  expect.objectContaining({
                    property: 'to',
                    constraints: expect.objectContaining({
                      isArray: 'to must be an array'
                    })
                  })
                ]));
              });
          });

          it('when request with to is not an array then return 400', () => {
            return request(app.getHttpServer())
              .post('/api/emails')
              .send({
                to: 'test@gmail.com'
              })
              .set('accept', 'json')
              .expect(400)
              .then((ret) => {
                expect(ret.body.message).toEqual(expect.arrayContaining([
                  expect.objectContaining({
                    property: 'to',
                    constraints: expect.objectContaining({
                      isArray: 'to must be an array'
                    })
                  })
                ]));
              });
          });

          it('when request with to has at least one invalid email address then return 400', () => {
            return request(app.getHttpServer())
              .post('/api/emails')
              .send({
                to: [
                  'test@gmail.com',
                  'invalid'
                ]
              })
              .set('accept', 'json')
              .expect(400)
              .then((ret) => {
                expect(ret.body.message).toEqual(expect.arrayContaining([
                  expect.objectContaining({
                    property: 'to',
                    constraints: expect.objectContaining({
                      isEmail: 'each value in to must be an email'
                    })
                  })
                ]));
              });
          });
        });

        describe('field cc', () => {
          it('when request with empty cc then return 400', () => {
            return request(app.getHttpServer())
              .post('/api/emails')
              .send({
                cc: ''
              })
              .set('accept', 'json')
              .expect(400)
              .then((ret) => {
                expect(ret.body.message).toEqual(expect.arrayContaining([
                  expect.objectContaining({
                    property: 'cc',
                    constraints: expect.objectContaining({
                      isArray: 'cc must be an array'
                    })
                  })
                ]));
              });
          });

          it('when request without cc then should not throw exception', () => {
            return request(app.getHttpServer())
              .post('/api/emails')
              .send({})
              .set('accept', 'json')
              .expect(400)
              .then((ret) => {
                expect(ret.body.message).not.toEqual(expect.arrayContaining([
                  expect.objectContaining({
                    property: 'cc',
                    constraints: expect.objectContaining({
                      isArray: 'cc must be an array'
                    })
                  })
                ]));
              });
          });

          it('when request with cc is not an array then return 400', () => {
            return request(app.getHttpServer())
              .post('/api/emails')
              .send({
                cc: 'test@gmail.com'
              })
              .set('accept', 'json')
              .expect(400)
              .then((ret) => {
                expect(ret.body.message).toEqual(expect.arrayContaining([
                  expect.objectContaining({
                    property: 'cc',
                    constraints: expect.objectContaining({
                      isArray: 'cc must be an array'
                    })
                  })
                ]));
              });
          });

          it('when request with cc has at least one invalid email address then return 400', () => {
            return request(app.getHttpServer())
              .post('/api/emails')
              .send({
                cc: [
                  'test@gmail.com',
                  'invalid'
                ]
              })
              .set('accept', 'json')
              .expect(400)
              .then((ret) => {
                expect(ret.body.message).toEqual(expect.arrayContaining([
                  expect.objectContaining({
                    property: 'cc',
                    constraints: expect.objectContaining({
                      isEmail: 'each value in cc must be an email'
                    })
                  })
                ]));
              });
          });
        });

        describe('field bcc', () => {
          it('when request with empty bcc then return 400', () => {
            return request(app.getHttpServer())
              .post('/api/emails')
              .send({
                bcc: ''
              })
              .set('accept', 'json')
              .expect(400)
              .then((ret) => {
                expect(ret.body.message).toEqual(expect.arrayContaining([
                  expect.objectContaining({
                    property: 'bcc',
                    constraints: expect.objectContaining({
                      isArray: 'bcc must be an array'
                    })
                  })
                ]));
              });
          });

          it('when request without bcc then should not throw exception', () => {
            return request(app.getHttpServer())
              .post('/api/emails')
              .send({})
              .set('accept', 'json')
              .expect(400)
              .then((ret) => {
                expect(ret.body.message).not.toEqual(expect.arrayContaining([
                  expect.objectContaining({
                    property: 'bcc',
                    constraints: expect.objectContaining({
                      isArray: 'bcc must be an array'
                    })
                  })
                ]));
              });
          });

          it('when request with cc is not an array then return 400', () => {
            return request(app.getHttpServer())
              .post('/api/emails')
              .send({
                bcc: 'test@gmail.com'
              })
              .set('accept', 'json')
              .expect(400)
              .then((ret) => {
                expect(ret.body.message).toEqual(expect.arrayContaining([
                  expect.objectContaining({
                    property: 'bcc',
                    constraints: expect.objectContaining({
                      isArray: 'bcc must be an array'
                    })
                  })
                ]));
              });
          });

          it('when request with cc has at least one invalid email address then return 400', () => {
            return request(app.getHttpServer())
              .post('/api/emails')
              .send({
                bcc: [
                  'test@gmail.com',
                  'invalid'
                ]
              })
              .set('accept', 'json')
              .expect(400)
              .then((ret) => {
                expect(ret.body.message).toEqual(expect.arrayContaining([
                  expect.objectContaining({
                    property: 'bcc',
                    constraints: expect.objectContaining({
                      isEmail: 'each value in bcc must be an email'
                    })
                  })
                ]));
              });
          });
        });
      });

      it('when request to send email with correct info then insert new record in database', () => {
        const inp = {
          title: randomString(),
          content: randomString(),
          to: ['thisisvalidemail2019s@gmail.com']
        };
        const mailService = app.get(IMailService);
        return request(app.getHttpServer())
          .post('/api/emails')
          .send({ ...inp })
          .set('accept', 'json')
          .then(async (ret) => {
            const actualEmail = await mailService.getMailById(ret.body.data.id);
            expect(actualEmail).toMatchObject({
              to: inp.to,
              cc: null,
              bcc: null,
              title: inp.title,
              content: inp.content,
              status: [
                { type: EMailStatus.Init }
              ],
              sentOn: expect.any(Date)
            });
          });
      });
    });
  });
});
