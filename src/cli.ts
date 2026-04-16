import { CommandFactory } from 'nest-commander';
import { ApiAppModule } from '../apps/api/src/app/api-app.module';

async function bootstrap() {
  await CommandFactory.run(ApiAppModule);
}

void bootstrap();
