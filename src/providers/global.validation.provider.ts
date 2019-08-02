import { FactoryProvider } from '@nestjs/common/interfaces';
import { APP_PIPE } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';

export const providerGlobalValidation: FactoryProvider = {
  provide: APP_PIPE,
  useFactory: () => new ValidationPipe({ transform: true })
};
