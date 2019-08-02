import * as morgan from 'morgan';
import { NestMiddleware, Injectable, Inject } from '@nestjs/common';
import { ILoggerInstance } from '../commons';
import { PROVIDERS } from '../commons/const';
import { RequestHandler } from '@nestjs/common/interfaces';

@Injectable()
export class MwRequestLogger implements NestMiddleware {
  private mw: RequestHandler;

  constructor(
    @Inject(PROVIDERS.ROOT_LOGGER)
    private readonly logger: ILoggerInstance
  ) {
    this.mw = morgan('combined', {
      stream: {
        write: (message: string) => this.logger.log(message)
      }
    });

  }

  use(req: any, res: any, next: () => void) {
    this.mw(req, res, next);
  }
}
