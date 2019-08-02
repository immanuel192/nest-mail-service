import { NestMiddleware, Injectable, Inject, HttpServer } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { ILoggerInstance } from '../commons';
import { PROVIDERS } from '../commons/const';

const FORCE_TIMEOUT = 20000; // 20s

@Injectable()
export class MwGracefulShutdown implements NestMiddleware {
  private shuttingDown: boolean = false;
  private httpServer: HttpServer;

  constructor(
    @Inject(PROVIDERS.ROOT_LOGGER)
    private readonly logger: ILoggerInstance,
    httpAdapterHost: HttpAdapterHost
  ) {
    this.httpServer = httpAdapterHost.httpAdapter.getHttpServer();
    process.on('SIGTERM', this.gracefulExit.bind(this));
  }

  private gracefulExit(): void {
    if (!process.env.NODE_ENV) {
      return process.exit(1);
    }
    if (this.shuttingDown) {
      return;
    }
    this.shuttingDown = true;
    this.logger.warn('Received kill signal (SIGTERM), shutting down');

    setTimeout(() => {
      this.logger.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, FORCE_TIMEOUT).unref();

    Promise.resolve() // later can wait to close all connection
      .then(() => {
        this.httpServer.close();
        setTimeout(() => {
          process.exit();
        }, 500);
      });
    return null;
  }

  use(_req: any, res: any, next: () => void) {
    if (!this.shuttingDown) {
      return next();
    }
    res.set('Connection', 'close');
    res.status(503).send('Server is in the process of restarting.');
  }
}
