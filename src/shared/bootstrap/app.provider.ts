import { Provider } from '@nestjs/common';
import { DI_TOKENS } from './app.constants';
import { load } from './app.config';

export const AppConfigProvider: Provider = {
  provide: DI_TOKENS.CONFIG,
  useValue: load.from.env(process.env),
};
