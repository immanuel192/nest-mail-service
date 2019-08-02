import { Catch, HttpException, ArgumentsHost, HttpStatus, ExceptionFilter, Inject } from '@nestjs/common';
import { ClassProvider } from '@nestjs/common/interfaces';
import { pick } from 'lodash';
import { APP_FILTER } from '@nestjs/core';
import { PROVIDERS, ILoggerInstance } from '../commons';

@Catch()
class ErrorFilter implements ExceptionFilter {
  constructor(
    @Inject(PROVIDERS.ROOT_LOGGER)
    private readonly logger: ILoggerInstance
  ) { }

  catch(exception: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    this.logger.error(exception);

    response.status(status).json({
      statusCode: status,
      message: (exception.message as any).message || exception.message,
      timestamp: new Date().toISOString(),
      uri: request.url,
      method: request.method,
      ...pick(exception.message || {}, ['data'])
    });
  }
}

export const providerErrorFilter: ClassProvider = {
  provide: APP_FILTER,
  useClass: ErrorFilter,
};
