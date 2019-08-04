import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './modules/app.module';
import * as _ from 'lodash';
import { inspect } from 'util';
import * as responseTime from 'response-time';
import * as compression from 'compression';
const helmet = require('helmet');

function handleErrors() {
  process.on('uncaughtException', (e) => {
    console.error(`Exiting due to unhandled exception: ${inspect(e)}`);
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error(`Exiting due to unhandled rejection: ${reason} ${inspect(promise)}`);
  });
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.use(helmet());
  app.use(responseTime({
    digits: 0,
    suffix: false
  }));
  app.use(compression({ level: 9, memLevel: 9 }));
  handleErrors();

  const options = new DocumentBuilder()
    .setTitle('nest-mail-service')
    .setDescription('nest-mail-service api')
    .build();
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('docs', app, document);

  await app.listen(process.env.NODE_PORT || 9000);
}

bootstrap()
  .catch((e) => {
    throw e;
  });
